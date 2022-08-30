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
import logging
import traceback
import asyncio

# TEMP: needs refactor
import numpy as np

from tornado import web
from tornado import ioloop
from tornado import websocket
from pebble import ProcessPool, ThreadPool
from multiprocessing import Manager, Process, cpu_count
from tornado.ioloop import IOLoop
from zmq.error import ZMQError

## Enviornment variable for setting CODEX root directory.
CODEX_ROOT = os.getenv('CODEX_ROOT')
sys.path.insert(1, os.getenv('CODEX_ROOT'))

logger = logging.getLogger(__name__)

# CODEX
from api.workflow_manager import workflow_call
from api.algorithm_manager import algorithm_call
from api.guidance_manager import get_guidance
from api.session_manager import save_session
from api.session_manager import load_session
from api.session_manager import get_sessions
from api.data_manager import add_data
from api.data_manager import get_data
from api.data_manager import delete_data
from api.data_manager import update_data
from api.data_manager import get_data_metrics
from api.export_manager import export_contents
from api.eta_manager import get_time_estimate
from api.sub.system import codex_server_memory_check
from api.sub.time_log import getTimeLogDict
from api.sub.hash import get_cache
from api.sub.hash import create_cache_server
from api.sub.hash import stop_cache_server
from api.sub.hash import NoSessionSpecifiedError
from api.sub.audit import initialize_auditor, MessageAuditor


def throttled_cpu_count():
    return max(1, math.floor(cpu_count() * 0.75))


# create our process pools
executor = ProcessPool(
    max_workers=throttled_cpu_count(), max_tasks=throttled_cpu_count() * 2)
readpool = ThreadPool(
    max_workers=throttled_cpu_count(), max_tasks=throttled_cpu_count() * 2)
queuemgr = Manager()

fileChunks = []


class UploadSocket(tornado.websocket.WebSocketHandler):
    def open(self):
        logging.info("Upload Websocket opened")

    def check_origin(self, origin):
        return True

    def on_message(self, message):

        global fileChunks

        msg = json.loads(message)
        result = {}

        filename = msg["filename"]
        filepath = os.path.join(CODEX_ROOT, "uploads", filename)

        if (msg["done"] == True):

            #stop_cache_server()
            #codex_hash_server = make_cache_process()
            #codex_hash_server.start()

            logging.info('Finished file transfer, initiating save...')
            cache = get_cache(msg['sessionkey'], timeout=None)

            f = open(filepath, 'wb')
            for chunk in fileChunks:
                f.write(chunk)
            f.close()
            fileChunks = []

            fileExtension = filename.split(".")[-1]
            try:
                if (fileExtension == "csv"):
                    hashList, featureList = cache.import_csv(filepath)

                elif (fileExtension == "h5"):
                    hashList, featureList = cache.import_hd5(filepath)

                elif (fileExtension == "npy"):
                    hashList, featureList = cache.import_npy(filepath)

                else:
                    result['message'] = "Currently unsupported filetype"
                    stringMsg = json.dumps(result)
                    self.write_message(stringMsg)
            except Exception as e:
                logging.info('Unable to save file: ' + repr(e))
                result['status'] = 'failure'
                result['message'] = repr(e)
            else:
                sentinel_values = cache.getSentinelValues(featureList)
                nan = sentinel_values["nan"]
                inf = sentinel_values["inf"]
                ninf = sentinel_values["ninf"]

                result['status'] = 'complete'
                result['feature_names'] = featureList
                result["nan"] = nan
                result["inf"] = inf
                result["ninf"] = ninf
                logging.info('Finished file save.')

        else:
            contents = base64.decodebytes(str.encode(msg["chunk"]))
            fileChunks.append(contents)
            result['status'] = 'streaming'

        stringMsg = json.dumps(result)
        self.write_message(stringMsg)

        if result['status'] == 'failure':
            self.close()


def route_request(msg, result):
    '''
    This is the main router function for CODEX. This takes a message and a result, and returns either:

    1) just the result object, which will be directly sent to the client
    2) an iterator, which will be iterated over in the worker process and sent
       piecemeal to the client.
    '''

    routine = msg['routine']
    if (routine == 'algorithm'):
        yield algorithm_call(msg, result)
    elif (routine == 'workflow'):
        yield workflow_call(msg, result)
    elif (routine == 'guidance'):
        yield get_guidance(msg, result, CODEX_ROOT)
    elif (routine == "save_session"):
        yield save_session(msg, result, CODEX_ROOT)
    elif (routine == "load_session"):
        yield load_session(msg, result, CODEX_ROOT)
    elif (routine == "get_sessions"):
        yield get_sessions(msg, result, CODEX_ROOT)
    elif (routine == 'time'):
        yield get_time_estimate(msg, result)
    elif (routine == 'arrange'):
        activity = msg["activity"]
        if (activity == "add"):
            yield add_data(msg, result)
        elif (activity == "get"):
            yield get_data(msg, result)
        elif (activity == "delete"):
            yield delete_data(msg, result)
        elif (activity == "update"):
            yield update_data(msg, result)
        elif (activity == "metrics"):
            for metric in get_data_metrics(msg, result):
                yield metric
    elif (routine == 'export'):
        yield export_contents(msg, result, CODEX_ROOT)
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
        message - Message from frontend
    '''
    if type(message) is str:
        msg = json.loads(message)
    else:
        msg = message
    result = msg

    # log the response but without the data
    logging.info("{time} : Message from front end: {json}".format(
        time=datetime.datetime.now().isoformat(),
        json={k: (msg[k] if k != 'data' else '[data removed]')
              for k in msg}))

    if 'sessionkey' not in msg:
        logging.warning('session_key not in message!')
        raise NoSessionSpecifiedError()

    try:
        with MessageAuditor(msg) as audit:
            # actually execute the function requested
            try:
                # while the generator has more values...
                for chunk in route_request(msg, result):
                    # ...shovel the result into a queue
                    chunk['message'] = "success"
                    queue.put_nowait({'result': chunk, 'done': False})

            except Exception as e:
                response = {'message': 'failure'}
                queue.put_nowait({'result': response, 'done': False})

            # let the readers know that we've drained the queue
            queue.put_nowait({'done': True})
    except Exception as e:
        sys.stderr.write('Exception caught in request: {}\n'.format(repr(e)))
        import traceback
        traceback.print_exc()
        queue.put_nowait({result: {'message': 'failure'}, 'done': True})


# Tornado Websocket
class CodexSocket(tornado.websocket.WebSocketHandler):
    connection = set()
    queue = None
    message_handler_future = None
    future = None
    reader = None

    def open(self):
        logging.info("{self}".format(self=self))
        logging.info("Websocket opened")

    def check_origin(self, origin):
        return True

    def on_response(self, response):
        self.write_message(response.result())

    def _on_response_ready(self, response):
        ioloop.IOLoop.current().add_callback(
            functools.partial(self.on_response, response))

    def on_close(self):
        logging.info("Websocket closed")

        if self.message_handler_future:
            self.message_handler_future.cancel()

        # close the executor
        if self.future is not None and (not self.future.done()):
            self.future.cancel()

        # ...and close the reader
        if self.reader is not None and (not self.reader.done()):
            self.reader.cancel()

    def on_message(self, message):
        self.message_handler_future = asyncio.ensure_future(
            self.handle_message(message))

    async def handle_message(self, message):
        self.queue = queuemgr.Queue()
        # Helpful reading about multiprocessing.Queue from Tornado: https://stackoverflow.com/a/46864186

        # Essentially, the strategy is to:
        #       1) Send a job into the process pool
        #       2) Send another job to read the queue, as
        #          it blocks

        # start an audit of the external message
        audit = MessageAuditor(json.loads(message))
        audit.start()
        if audit.is_enabled():
            audit.method = 'tornado:' + audit.method

        self.future = executor.schedule(
            functools.partial(execute_request, self.queue, message))

        while True:
            # Wait on reading the queue
            self.reader = readpool.schedule(self.queue.get)

            response = await asyncio.wrap_future(self.reader)

            # if we're done, there's nothing more to be read and we can stop
            if response['done']:
                break

            result = response['result']
            logging.info("{time} : Response to front end: {json}".format(
                time=datetime.datetime.now().isoformat(),
                json={
                    k: (result[k] if
                        (k != 'data' and k != 'downsample' and k != 'y'
                         and k != "y_pred") else '[data removed]')
                    for k in result
                }))

            try:
                self.write_message(json.dumps(response['result']))
            except tornado.websocket.WebSocketClosedError:
                break

        audit.finish()

        # make sure the socket gets closed
        self.on_close()
        self.close()


class GenericAPIHandler(tornado.web.RequestHandler):
    queue = None
    future = None
    reader = None

    def prepare(self):
        self.set_header('Content-Type', 'application/json')

        # break off CORS headers
        self.set_header('Access-Control-Allow-Origin', '*')
        self.set_header('Access-Control-Expose-Headers', '*')

    async def make_api_call(self, request):
        '''
        Inputs:
            Request (dict)

        Outputs:
            Response (dict)

        Notes:
            This method emulates the websocket API call for now, with the
            exception that partial results will be ignored, and only the last
            one will be sent.

            This is a result of the fact that this is designed for use in HTTP
            methods, which do not support partial results.

            Eventually, this API access may be folded into it's own generic
            form and re-used.
        '''
        self.queue = queuemgr.Queue()
        # Helpful reading about multiprocessing.Queue from Tornado: https://stackoverflow.com/a/46864186

        # Essentially, the strategy is to:
        #       1) Send a job into the process pool
        #       2) Send another job to read the queue, as
        #          it blocks

        # start an audit of the external message
        audit = MessageAuditor(request)
        audit.start()
        if audit.is_enabled():
            audit.method = 'tornado_http:' + audit.method

        self.future = executor.schedule(
            functools.partial(execute_request, self.queue, request))

        while True:
            # Wait on reading the queue
            self.reader = readpool.schedule(self.queue.get)

            response = await asyncio.wrap_future(self.reader)

            # if we're done, there's nothing more to be read and we can stop
            if response['done']:
                break

            result = response['result']
            logging.info("{time} : Response to front end: {json}".format(
                time=datetime.datetime.now().isoformat(),
                json={
                    k: (result[k] if
                        (k != 'data' and k != 'downsample' and k != 'y'
                         and k != "y_pred") else '[data removed]')
                    for k in result
                }))

        audit.finish()

        return result

    def send_failure(self, reason=None):
        self.set_status(400)
        self.write(
            json.dumps({
                'reason':
                reason if reason is not None else 'Invalid request.',
                'success':
                False
            }))


class FeatureAPIHandler(GenericAPIHandler):
    async def get(self):
        session = self.get_argument('session', None)
        name = self.get_argument('name', None)
        downsample = self.get_argument('downsample', None)

        if name is None or session is None:
            self.send_failure()
            return

        resp = await self.make_api_call({
            'routine': 'arrange',
            'activity': 'get',
            'hashType': 'feature',
            'sessionkey': session,
            'downsample': downsample,
            'name': [name]
        })

        if not 'data' in resp:
            self.send_failure()
            return

        # we need to reconstruct the numpy array
        # even though it's a column vector, it's still contiguous in memory
        # so we can just swap here
        arr = np.asarray(resp['data'], dtype=np.float32)

        self.set_header('X-Endianness', sys.byteorder)
        self.set_header('X-Data-Type', 'float32')
        self.set_header('Content-Type', 'application/octet-stream')
        self.write(bytes(arr.data))


class MainHandler(tornado.web.RequestHandler):
    def get(self):
        return


def make_app():
    settings = dict(
        app_name=u"JPL Complex Data Explorer",
        debug=True,
        autoreload=True,
        static_path=os.path.join(os.path.dirname(__file__), "static"))

    return web.Application([
        (r"/", MainHandler),
        (r"/api/feature", FeatureAPIHandler),
        (r"/codex", CodexSocket),
        (r"/upload", UploadSocket),
    ], **settings)


def make_cache_process():
    def run_cache():
        try:
            create_cache_server()
        except ZMQError as e:
            if e.strerror == 'Address already in use':
                logging.warning('Cache server already running!')
            else:
                raise
        except Exception as e:
            logging.warning('Cache server launch failure!', e)
            raise

    return Process(target=run_cache)


if __name__ == '__main__':

    initialize_auditor()

    if not os.path.exists("logs/"):
        os.makedirs("logs/")

    logging.basicConfig(
        filename='logs/{time}.log'.format(time=datetime.datetime.now()),
        level=0)
    print("CODEX Server Started")
    logging.info("CODEX Server Started")
    logging.info(" ".join(sys.argv))

    getTimeLogDict()

    app = make_app()
    app = tornado.httpserver.HTTPServer(app)

    # create the cache server process
    codex_hash_server = make_cache_process()
    codex_hash_server.start()

    # start server
    app.listen(8888)
    tornado.ioloop.IOLoop.instance().start()

    # gracefully shut down cache server
    stop_cache_server()
    codex_hash_server.join()  # wait for process shutdown
