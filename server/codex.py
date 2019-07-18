'''
Author: Jack Lightholder
Date  : 7/19/17

Brief :

Notes :

Copyright 2019 California Institute of Technology.  ALL RIGHTS RESERVED.
U.S. Government Sponsorship acknowledged.
'''

import os
## Enviornment variable for setting CODEX root directory.
CODEX_ROOT = os.getenv('CODEX_ROOT')

import sys
sys.path.insert(1, CODEX_ROOT + '/api/')
sys.path.insert(1, CODEX_ROOT + '/api/sub/')

from tornado import web
from tornado import ioloop
from tornado import websocket
from tornado import gen
from concurrent.futures import ProcessPoolExecutor
from multiprocessing import Process
from tornado.ioloop import IOLoop
import ssl
import concurrent.futures
import base64
import threading
import datetime
import functools
import tornado
import json
import inspect

# CODEX
import codex_workflow_manager
import codex_algorithm_manager
import codex_guidance_manager
import codex_read_data_api
import codex_system
import codex_return_code
import codex_time_log
import codex_doctest
import codex_session_manager
import codex_data_manager
import codex_analysis_manager
import codex_eta_manager
from codex_hash import get_cache, create_cache_server, stop_cache_server, NoSessionSpecifiedError
from zmq.error import ZMQError

# create a `ThreadPoolExecutor` instance
executor = concurrent.futures.ThreadPoolExecutor(max_workers=5)

fileChunks = []

class uploadSocket(tornado.websocket.WebSocketHandler):
    def open(self):
        print("Upload Websocket opened")

    def check_origin(self, origin):
        return True

    def on_message(self, message):

        global fileChunks
        msg = json.loads(message)
        result = {}

        filename = msg["filename"]
        filepath = CODEX_ROOT + "/uploads/" + filename

        if (msg["done"] == True):
            codex_hash = get_cache(msg['sessionkey'])

            f = open(filepath, 'wb')
            for chunk in fileChunks:
                f.write(chunk)
            f.close()
            fileChunks = []

            fileExtension = filename.split(".")[-1]
            if (fileExtension == "csv"):
                hashList, featureList = codex_read_data_api.codex_read_csv(
                    filepath, None, "feature", session=codex_hash)
                codex_return_code.logReturnCode(inspect.currentframe())

            elif (fileExtension == "h5"):
                hashList, featureList = codex_read_data_api.codex_read_hd5(
                    filepath, None, "feature", session=codex_hash)
                codex_return_code.logReturnCode(inspect.currentframe())

            elif (fileExtension == "npy"):
                hashList, featureList = codex_read_data_api.codex_read_npy(filepath, None, "feature", session=codex_hash)
                codex_return_code.logReturnCode(inspect.currentframe())

            else:
                result['message'] = "Currently unsupported filetype"

        else:
            contents = base64.decodebytes(str.encode(msg["chunk"]))
            fileChunks.append(contents)

        if msg['done']:
            result['status'] = 'complete'
            result['feature_names'] = featureList
        else:
            result['status'] = 'streaming'

        stringMsg = json.dumps(result)
        self.write_message(stringMsg)


# Tornado Websocket
class CodexSocket(tornado.websocket.WebSocketHandler):

    connection = set()

    def open(self):
        codex_system.codex_log("{self}".format(self=self))
        codex_system.codex_log("Websocket opened")

    def check_origin(self, origin):
        return True

    def on_response(self, response):
        self.write_message(response.result())

    def _on_response_ready(self, response):
        ioloop.IOLoop.current().add_callback(
            functools.partial(self.on_response, response))

    @gen.engine
    def on_message(self, message):
        result = executor.submit(self.handle_request, message)
        result.add_done_callback(self._on_response_ready)
        try:
            codex_system.codex_server_memory_check(session=json.loads(message)['sessionkey'])
        except:
            raise

    def handle_request(self, message):
        '''
        Inputs:

        Outputs:

        Notes:
            Helpful link for multi-threading: https://stackoverflow.com/questions/32211102/tornado-with-threadpoolexecutor

        Examples:

        '''
        msg = json.loads(message)


        result = msg
        codex_system.codex_log("{time} : Message from front end: {json}".format(time=now.isoformat(), json=msg))

        if 'sessionkey' not in msg:
            print('session_key not in message!!!')
            raise NoSessionSpecifiedError()

        routine = msg['routine']
        if(routine == 'algorithm'):
            result = codex_algorithm_manager.algorithm_call(msg, result)
        elif(routine == 'workflow'):
            result = codex_workflow_manager.workflow_call(msg, result)
        elif(routine == 'guidance'):
            result = codex_guidance_manager.get_guidance(msg, result)
        elif (routine == "save_session"):
            result = codex_session_manager.save_session(msg, result)
        elif (routine == "load_session"):
            result = codex_session_manager.load_session(msg, result)
        elif (routine == "get_sessions"):
            result = codex_session_manager.get_sessions(msg, result)
        elif (routine == 'time'):
            result = codex_eta_manager.get_time_estimate(msg, result)
        elif (routine == 'arrange'):
            activity = msg["activity"]
            if (activity == "add"):
                result = codex_data_manager.add_data(msg, result)
            elif (activity == "get"):
                result = codex_data_manager.get_data(msg, result)
            elif (activity == "delete"):
                result = codex_data_manager.delete_data(msg, result)
            elif (activity == "update"):
                result = codex_data_manager.update_data(msg, result)
            elif (activity == "metrics"):
                result = codex_data_manager.get_data_metrics(msg, result)

        elif (routine == 'download_code'):
            result = codex_analysis_manager.download_code(msg, result)
        else:
            result['message'] = 'Unknown Routine'

        result['message'] = "success"
        stringMsg = json.dumps(result)
        codex_system.codex_log("{time} : Response to front end: {json}".format(time=now.isoformat(), json=stringMsg))
        return stringMsg


class MainHandler(tornado.web.RequestHandler):
    def get(self):
        return


def make_app():
    settings = dict(
        app_name=u"JPL Complex Data Explorer",
        static_path=os.path.join(os.path.dirname(__file__), "static"),
        debug=True)

    print(settings['static_path'])

    return web.Application([
        (r"/", MainHandler),
        (r"/codex", CodexSocket),
        (r"/upload", uploadSocket),
    ], **settings)

def make_cache_process():
    def run_cache():
        try:
            create_cache_server()
        except ZMQError as e:
            if e.strerror == 'Address already in use':
                print('Cache server already running!')
            else:
                raise
        except Exception as e:
            print('Cache server launch failure!')
            raise
    return Process(target=run_cache)

if __name__ == '__main__':

    print("CODEX Server Started")
    now = datetime.datetime.now()
    codex_system.codex_log("Server started at: " + str(now.isoformat()))
    codex_return_code.makeReturnCode()

    codex_time_log.getTimeLogDict()

    app = make_app()
    if (len(sys.argv) > 1) and (sys.argv[1] == '-ssl'):
        ssl_ctx = ssl.create_default_context(ssl.Purpose.CLIENT_AUTH)
        ssl_ctx.load_cert_chain(
            os.path.join("/web/codex/html/_cert/codex.crt"),
            os.path.join("/web/codex/html/_cert/codex.key"))
        app = tornado.httpserver.HTTPServer(app, ssl_options=ssl_ctx)
    else:
        app = tornado.httpserver.HTTPServer(app)

    # create the cache server process and start it
    codex_hash_server = make_cache_process()
    codex_hash_server.start()

    # start server
    app.listen(8888)
    ioloop.IOLoop.instance().start()

    # gracefully shut down cache server
    stop_cache_server() 
    codex_hash_server.join() # wait for process shutdown
    
