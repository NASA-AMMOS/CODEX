'''
Author: Jack Lightholder
Date  : 7/19/17

Brief :

Notes :

Copyright 2019 California Institute of Technology.  ALL RIGHTS RESERVED.
U.S. Government Sponsorship acknowledged.
'''
import ssl
import base64
import threading
import datetime
import functools
import tornado
import json
import inspect
import sys
import os
import math

from tornado         import web
from tornado         import ioloop
from tornado         import websocket
from tornado         import gen
from pebble          import ProcessPool, ThreadPool
from multiprocessing import Manager, Process, cpu_count
from tornado.ioloop  import IOLoop
from zmq.error       import ZMQError


## Enviornment variable for setting CODEX root directory.
CODEX_ROOT = os.getenv('CODEX_ROOT')
sys.path.insert(1, os.getenv('CODEX_ROOT'))

# CODEX
from codex_workflow_manager       import workflow_call
from codex_algorithm_manager      import algorithm_call
from codex_guidance_manager       import get_guidance
from codex_session_manager        import save_session
from codex_session_manager        import load_session
from codex_session_manager        import get_sessions
from codex_data_manager           import add_data
from codex_data_manager           import get_data
from codex_data_manager           import delete_data
from codex_data_manager           import update_data
from codex_data_manager           import get_data_metrics
from codex_analysis_manager       import download_code
from codex_eta_manager            import get_time_estimate
from api.sub.codex_system         import codex_log
from api.sub.codex_system         import codex_server_memory_check
from api.sub.codex_return_code    import logReturnCode
from api.sub.codex_return_code    import makeReturnCode
from api.sub.codex_time_log       import getTimeLogDict
from api.sub.codex_hash           import get_cache
from api.sub.codex_hash           import create_cache_server
from api.sub.codex_hash           import stop_cache_server
from api.sub.codex_hash           import NoSessionSpecifiedError

def throttled_cpu_count():
    return max( 1, math.floor(cpu_count() * 0.75))

# create our process pools
executor = ProcessPool(max_workers=throttled_cpu_count(), max_tasks=throttled_cpu_count() * 2)
readpool = ThreadPool( max_workers=throttled_cpu_count(), max_tasks=throttled_cpu_count() * 2)
queuemgr = Manager()

fileChunks = []

# Temporary sentinel values for JSON transfer
nan = None
inf = None
ninf = None

class uploadSocket(tornado.websocket.WebSocketHandler):
    def open(self):
        print("Upload Websocket opened")

    def check_origin(self, origin):
        return True

    def on_message(self, message):

        global fileChunks
        global nan
        global inf
        global ninf

        msg = json.loads(message)
        result = {}

        filename = msg["filename"]
        filepath = os.path.join(CODEX_ROOT, "uploads", filename)

        if (msg["done"] == True):
            codex_log('Finished file transfer, initiating save...')
            codex_hash = get_cache(msg['sessionkey'], timeout=None)

            f = open(filepath, 'wb')
            for chunk in fileChunks:
                f.write(chunk)
            f.close()
            fileChunks = []

            fileExtension = filename.split(".")[-1]
            if (fileExtension == "csv"):
                hashList, featureList = codex_hash.import_csv(filepath)
                logReturnCode(inspect.currentframe())

            elif (fileExtension == "h5"):
                hashList, featureList = codex_hash.import_hd5(filepath)
                logReturnCode(inspect.currentframe())

            elif (fileExtension == "npy"):
                hashList, featureList = codex_hash.import_npy(filepath)
                logReturnCode(inspect.currentframe())

            else:
                result['message'] = "Currently unsupported filetype"
                stringMsg = json.dumps(result)
                self.write_message(stringMsg)

            sentinel_values = codex_hash.getSentinelValues(featureList) 
            nan  = sentinel_values["nan"]
            inf  = sentinel_values["inf"]
            ninf = sentinel_values["ninf"]

        else:
            contents = base64.decodebytes(str.encode(msg["chunk"]))
            fileChunks.append(contents)

        if msg['done']:
            result['status'] = 'complete'
            result['feature_names'] = featureList
            result["nan"]  = nan
            result["inf"]  = inf
            result["ninf"] = ninf
            codex_log('Finished file save.')
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

    global nan
    global inf
    global ninf

    routine = msg['routine']
    if(routine == 'algorithm'):
        yield algorithm_call(msg, result)
    elif(routine == 'workflow'):
        yield workflow_call(msg, result)
    elif(routine == 'guidance'):
        yield get_guidance(msg, result)
    elif (routine == "save_session"):
        yield save_session(msg, result)
    elif (routine == "load_session"):
        yield load_session(msg, result)
    elif (routine == "get_sessions"):
        yield get_sessions(msg, result)
    elif (routine == 'time'):
        yield get_time_estimate(msg, result)
    elif (routine == 'arrange'):
        activity = msg["activity"]
        if (activity == "add"):
            yield add_data(msg, result)
        elif (activity == "get"):
            yield get_data(msg, nan, inf, ninf, result)
        elif (activity == "delete"):
            yield delete_data(msg, result)
        elif (activity == "update"):
            yield update_data(msg, result)
        elif (activity == "metrics"):
            for metric in get_data_metrics(msg, result):
                yield metric

    elif (routine == 'download_code'):
        yield download_code(msg, result)
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
    codex_log("{time} : Message from front end: {json}".format(time=now.isoformat(), json={k:(msg[k] if k != 'data' else '[data removed]') for k in msg}))

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
        codex_log("{self}".format(self=self))
        codex_log("Websocket opened")

    def check_origin(self, origin):
        return True

    def on_response(self, response):
        self.write_message(response.result())

    def _on_response_ready(self, response):
        ioloop.IOLoop.current().add_callback(
            functools.partial(self.on_response, response))

    def on_close(self):
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
            codex_log("{time} : Response to front end: {json}".format(time=now.isoformat(), json={k:(result[k] if (k != 'data' and k != 'downsample') else '[data removed]') for k in result}))

            yield self.write_message(json.dumps(response['result']))

        # close the thread? I don't think this is necessary
        yield self.future
        try:
            codex_server_memory_check(session=json.loads(message)['sessionkey'])
        except:
            raise

        # make sure the socket gets closed
        self.on_close()
        self.close()


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
            print('Cache server launch failure!', e)
            raise
    return Process(target=run_cache)

if __name__ == '__main__':

    print("CODEX Server Started")
    now = datetime.datetime.now()
    codex_log("Server started at: " + str(now.isoformat()))
    makeReturnCode()

    getTimeLogDict()

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
    codex_hash_server = make_cache_process()
    codex_hash_server.start()

    # start server
    app.listen(8888)
    ioloop.IOLoop.instance().start()

    # gracefully shut down cache server
    stop_cache_server()
    codex_hash_server.join() # wait for process shutdown

