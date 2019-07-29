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
sys.path.insert(1, os.path.join(CODEX_ROOT, 'api'))
sys.path.insert(1, os.path.join(CODEX_ROOT, 'api/sub'))

from tornado import web
from tornado import ioloop
from tornado import websocket
from tornado import gen
from pebble import ProcessPool, concurrent
from multiprocessing import Manager
from tornado.ioloop import IOLoop
import ssl
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

# create our process pools
executor = ProcessPool(max_workers=5, max_tasks=10)
readpool = ProcessPool(max_workers=5, max_tasks=10)
queuemgr = Manager()

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
        filepath = os.path.join(CODEX_ROOT, "uploads", filename)

        if (msg["done"] == True):
            codex_system.codex_log('Finished file transfer, initiating save...')
            codex_hash = get_cache(msg['sessionkey'], timeout=None)

            f = open(filepath, 'wb')
            for chunk in fileChunks:
                f.write(chunk)
            f.close()
            fileChunks = []

            fileExtension = filename.split(".")[-1]
            if (fileExtension == "csv"):
                hashList, featureList = codex_hash.import_csv(filepath)
                codex_return_code.logReturnCode(inspect.currentframe())

            elif (fileExtension == "h5"):
                hashList, featureList = codex_hash.import_hd5(filepath)
                codex_return_code.logReturnCode(inspect.currentframe())

            elif (fileExtension == "npy"):
                hashList, featureList = codex_hash.import_npy(filepath)
                codex_return_code.logReturnCode(inspect.currentframe())

            else:
                result['message'] = "Currently unsupported filetype"

        else:
            contents = base64.decodebytes(str.encode(msg["chunk"]))
            fileChunks.append(contents)

        if msg['done']:
            codex_system.codex_log('Finished file save.')
            result['status'] = 'complete'
            result['feature_names'] = featureList
        else:
            result['status'] = 'streaming'

        stringMsg = json.dumps(result)
        self.write_message(stringMsg)

def route_request(msg, result):
    '''
    This is the main router function for CODEX. This takes a message and a result, and returns either:

    1) just the result object, which will be directly sent to the client
    2) an iterator, which will be iterated over in the worker process and sent
       piecemeal to the client.
    '''

    routine = msg['routine']
    if(routine == 'algorithm'):
        yield codex_algorithm_manager.algorithm_call(msg, result)
    elif(routine == 'workflow'):
        yield codex_workflow_manager.workflow_call(msg, result)
    elif(routine == 'guidance'):
        yield codex_guidance_manager.get_guidance(msg, result)
    elif (routine == "save_session"):
        yield codex_session_manager.save_session(msg, result)
    elif (routine == "load_session"):
        yield codex_session_manager.load_session(msg, result)
    elif (routine == "get_sessions"):
        yield codex_session_manager.get_sessions(msg, result)
    elif (routine == 'time'):
        yield codex_eta_manager.get_time_estimate(msg, result)
    elif (routine == 'arrange'):
        activity = msg["activity"]
        if (activity == "add"):
            yield codex_data_manager.add_data(msg, result)
        elif (activity == "get"):
            yield codex_data_manager.get_data(msg, result)
        elif (activity == "delete"):
            yield codex_data_manager.delete_data(msg, result)
        elif (activity == "update"):
            yield codex_data_manager.update_data(msg, result)
        elif (activity == "metrics"):
            for metric in codex_data_manager.get_data_metrics(msg, result):
                yield metric

    elif (routine == 'download_code'):
        yield codex_analysis_manager.download_code(msg, result)
    else:
        result['message'] = 'Unknown Routine'
        yield result

def execute_request(queue, message):
    '''
    This function calls the request router, and determines if the result is a singular result or a
    generator. The result is either stuffed entirely into the output queue or iterated over into the
    output queue.

    Inputs:
        queue - Queue to write into
        message - Message from frontend:w
    '''
    
    msg = json.loads(message)


    result = msg
    # log the response but without the data
    codex_system.codex_log("{time} : Message from front end: {json}".format(time=now.isoformat(), json={k:(msg[k] if k != 'data' else '[data removed]') for k in msg}))

    if 'sessionkey' not in msg:
        print('session_key not in message!')
        raise NoSessionSpecifiedError()


    # actually execute the function requested
    try:
        # while the generator has more values...
        for chunk in route_request(msg, result):
            # ...shovel the result into a queue
            chunk['message'] = "success"
            queue.put_nowait( {'result': chunk, 'done': False} )
    except e:
        response = {'message': 'failure'}
        queue.put_nowait( { 'result': response, 'done': False} )

    # let the readers know that we've drained the queue
    queue.put_nowait({ 'done': True })


# Tornado Websocket
class CodexSocket(tornado.websocket.WebSocketHandler):
    connection = set()
    queue      = None
    future     = None
    reader     = None

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

    def on_close():
        # close the executor
        if self.future is not None and (not self.future.done()):
            self.future.cancel()

        # ...and close the reader
        if self.reader is not None and (not self.reader.done()):
            self.reader.cancel()

    @gen.engine
    def on_message(self, message):
        self.queue = queuemgr.Queue()
        # Helpful reading about multiprocessing.Queue from Tornado: https://stackoverflow.com/a/46864186

        # Essentially, the strategy is to:
        #       1) Send a job into the process pool
        #       2) Send another job to read the queue, as
        #          it blocks
        self.future = executor.schedule(functools.partial(execute_request, self.queue, message))

        while True:
            # Wait on reading the queue
            self.reader = readpool.schedule( self.queue.get )
            response = yield self.reader

            # if we're done, there's nothing more to be read and we can stop
            if response['done']:
                break

            result = response['result']
            codex_system.codex_log("{time} : Response to front end: {json}".format(time=now.isoformat(), json={k:(result[k] if k != 'data' else '[data removed]') for k in result}))

            yield self.write_message(json.dumps(response['result']))

        # close the thread? i don't think this is necessary
        yield self.future
        try:
            codex_system.codex_server_memory_check(session=json.loads(message)['sessionkey'])
        except:
            raise



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

@concurrent.process
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

    # create the cache server process
    codex_hash_server = run_cache()

    # start server
    app.listen(8888)
    ioloop.IOLoop.instance().start()

    # gracefully shut down cache server
    stop_cache_server() 
    codex_hash_server.join() # wait for process shutdown
    
