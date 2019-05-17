from tornado import web, ioloop, websocket, gen
import os
## Enviornment variable for setting CODEX root directory.
CODEX_ROOT = os.getenv('CODEX_ROOT')

import sys
sys.path.insert(1, CODEX_ROOT + '/api/')
sys.path.insert(1, CODEX_ROOT + '/api/sub/')
import ssl
import time, h5py, codex_plot
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.image as mpimg
from scipy import misc
from random import randint
from sklearn import cluster, datasets
from sklearn.neighbors import kneighbors_graph
from sklearn.preprocessing import StandardScaler
from decimal import *
from concurrent.futures import ProcessPoolExecutor
from tornado.ioloop import IOLoop
import concurrent.futures
import base64, threading, datetime, functools, tornado, json
from os import listdir
from os.path import isfile, join, isdir
import json

# CODEX API
import codex_1d_binning
import codex_clustering_api
import codex_data_quality_scan_api
import codex_dimmension_reduction_api
import codex_endmembers
import codex_normalize
import codex_peak_detection_api
import codex_read_data_api
import codex_regression_api
import codex_segmentation_api
import codex_template_scan_api
import codex_classification_api
import codex_workflow

# CODEX Support
import codex_system
import codex_hash, codex_return_code
import codex_downsample, codex_yaml
import codex_time_log
import codex_doctest

# create a `ThreadPoolExecutor` instance
executor = concurrent.futures.ThreadPoolExecutor(max_workers=5)

verbose = True
fileChunks = []


def workflow_call(msg, result):
    '''
    Inputs:

    Outputs:

    Examples:

    '''

    featureList = msg["dataFeatures"]
    featureList = codex_system.get_featureList(featureList)

    subsetHashName = msg["dataSelections"]
    if (subsetHashName != []):
        subsetHashName = subsetHashName[0]
    else:
        subsetHashName = None

    hashList = codex_hash.feature2hashList(featureList)
    codex_return_code.logReturnCode("hashList = codex_hash.feature2hashList(featureList)")

    data = codex_hash.mergeHashResults(hashList)
    codex_return_code.logReturnCode("data = codex_hash.mergeHashResults(hashList)")
    inputHash = codex_hash.hashArray('Merged', data, "feature")

    if (inputHash != None):

        codex_return_code.logReturnCode('codex_hash.hashArray("Merged", data, "feature")')
        inputHash = inputHash["hash"]


    if ('workflow' == "explain_this"):

        codex_workflow.explain_this(inputHash, subsetHashName, result)

    else:
        result['message'] = "Cannot parse algorithmType"

    return result


def algorithm_call(msg, result):
    '''
    Inputs:

    Outputs:

    Examples:

    '''

    parms = msg['parameters']
    downsampled = msg["downsampled"]
    algorithmName = msg['algorithmName']
    algorithmType = msg["algorithmType"]

    featureList = msg["dataFeatures"]
    featureList = codex_system.get_featureList(featureList)

    subsetHashName = msg["dataSelections"]
    if (subsetHashName != []):
        subsetHashName = subsetHashName[0]
    else:
        subsetHashName = None

    hashList = codex_hash.feature2hashList(featureList)
    codex_return_code.logReturnCode("hashList = codex_hash.feature2hashList(featureList)")

    data = codex_hash.mergeHashResults(hashList)
    codex_return_code.logReturnCode("data = codex_hash.mergeHashResults(hashList)")
    inputHash = codex_hash.hashArray('Merged', data, "feature")

    if (inputHash != None):
        codex_return_code.logReturnCode('codex_hash.hashArray("Merged", data, "feature")')
        inputHash = inputHash["hash"]

    if (downsampled != False):
        downsampled = int(downsampled)

    if (algorithmType == "binning"):
        result = codex_1d_binning.ml_binning(inputHash, hashList,
                                             subsetHashName, algorithmName,
                                             downsampled, parms, result)

    elif (algorithmType == "clustering"):
        result = codex_clustering_api.ml_cluster(inputHash, hashList,
                                                 subsetHashName, algorithmName,
                                                 downsampled, parms, result)

    elif (algorithmType == "data_quality_scan"):
        result = codex_data_quality_scan_api.ml_quality_scan(
            inputHash, hashList, subsetHashName, algorithmName, downsampled,
            parms, result)

    elif (algorithmType == "dimensionality_reduction"):
        result = codex_dimmension_reduction_api.ml_dimensionality_reduction(
            inputHash, hashList, subsetHashName, algorithmName, downsampled,
            parms, result)

    elif (algorithmType == "endmember"):
        result = codex_endmembers.ml_endmember(inputHash, hashList,
                                               subsetHashName, algorithmName,
                                               downsampled, parms, result)

    elif (algorithmType == "normalize"):
        result = codex_normalize.ml_normalize(inputHash, hashList,
                                              subsetHashName, algorithmName,
                                              downsampled, parms, result)

    elif (algorithmType == "peak_detect"):
        result = codex_peak_detection_api.ml_peak_detect(
            inputHash, hashList, subsetHashName, algorithmName, downsampled,
            parms, result)

    elif (algorithmType == "regression"):

        labelName = msg["labelName"]
        labelHash = codex_hash.findHashArray("name", labelName, "feature")['hash']

        cross_val = msg["cross_val"]
        search_type = msg["search_type"]
        scoring = msg["scoring"]

        result = codex_regression_api.ml_regression(
            inputHash, hashList, subsetHashName, labelHash, algorithmName,
            downsampled, parms, scoring, search_type, cross_val, result)

    elif (algorithmType == "classification"):

        labelName = msg["labelName"]
        labelHash = codex_hash.findHashArray("name", labelName, "feature")['hash']

        cross_val = msg["cross_val"]
        search_type = msg["search_type"]
        scoring = msg["scoring"]

        result = codex_classification_api.ml_classification(
            inputHash, hashList, subsetHashName, labelHash, algorithmName,
            downsampled, parms, scoring, search_type, cross_val, result)

    elif (algorithmType == "segment"):
        result = codex_segmentation_api.ml_segmentation(
            inputHash, hashList, subsetHashName, algorithmName, downsampled,
            parms, result)

    elif (algorithmType == "template_scan"):
        result = codex_template_scan_api.ml_template_scan(
            inputHash, hashList, subsetHashName, None, algorithmName, downsampled, parms, result)

    else:
        result['message'] = "Cannot parse algorithmType"

    return result


def get_guidance(guidance, result):
    '''
    Inputs:

    Outputs:

    Examples:

    '''
    split = guidance.split(":")
    if (len(split) == 2):
        guidanceString = codex_yaml.get_guidance_text_block(split[0], split[1])
        if (guidanceString is not None):
            result["guidance"] = guidanceString
        else:
            result[
                "message"] = guidance + " does not exist in YAML guidance file"
            result["guidance"] = ""
    else:
        result["message"] = "Incorrect request formatting"
        result["guidance"] = ""

    return result


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

            f = open(filepath, 'wb')
            for chunk in fileChunks:
                f.write(chunk)
            f.close()
            fileChunks = []

            fileExtension = filename.split(".")[-1]
            if (fileExtension == "csv"):
                hashList, featureList = codex_read_data_api.codex_read_csv(
                    filepath, None, "feature")
                codex_return_code.logReturnCode(
                    "hashList = codex_read_data_api.codex_read_csv('" +
                    filepath + "', None, 'feature')")

            elif (fileExtension == "h5"):
                hashList, featureList = codex_read_data_api.codex_read_hd5(
                    filepath, None, "feature")
                codex_return_code.logReturnCode(
                    "hashList = codex_read_data_api.codex_read_h5('" +
                    filepath + "', None, 'feature')")

            elif (fileExtension == "npy"):
                hashList, featureList = codex_read_data_api.codex_read_npy(
                    filepath, None, "feature")
                codex_return_code.logReturnCode(
                    "hashList = codex_read_data_api.codex_read_npy('" +
                    filepath + "', None, 'feature')")

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
        codex_system.codex_server_memory_check()

    def handle_request(self, message):
        '''
        Inputs:

        Outputs:

        Notes:
            Helpful link for multi-threading: https://stackoverflow.com/questions/32211102/tornado-with-threadpoolexecutor

        Examples:

        '''
        result = {}

        msg = json.loads(message)
        codex_system.codex_log("{time} : Message from front end: {json}".format(time=now.isoformat(), json=msg))

        routine = msg['routine']

        if (routine == 'algorithm'):

            result = algorithm_call(msg, result)
            result['identification'] = msg['identification']

        elif (routine == 'workflow'):

            result = workflow_call(msg, result)
            result['identification'] = msg['identification']

        elif (routine == 'guidance'):

            guidance = msg["guidance"]

            if (guidance is not None):
                result = get_guidance(guidance, result)
            else:
                result['message'] = 'guidance none'

            result['identification'] = msg['identification']

        elif (routine == "save_session"):

            session_name = msg['session_name']
            session_path = os.path.join(CODEX_ROOT, 'sessions', session_name)

            if not os.path.exists(session_path):
                codex_hash.pickle_data(session_name)
            else:
                result["WARNING"] = session_name + " already exists."

        elif (routine == "load_session"):

            session_name = msg['session_name']
            session_path = os.path.join(CODEX_ROOT, 'sessions', session_name)
            result['session_name'] = msg['session_name']

            if os.path.exists(session_path):
                result['session_data'] = codex_hash.unpickle_data(session_name)
            else:
                result["WARNING"] = session_name + " does not exist."

        elif (routine == "get_sessions"):

            path = os.path.join(CODEX_ROOT, 'sessions')
            result['sessions'] = [f for f in listdir(path) if isdir(join(path, f))]

        elif (routine == 'time'):

            algorithmType = msg['algorithmType']
            algorithmName = msg['algorithmName']
            numSamples = int(msg['numSamples'])

            # TODO - extend computeTimeEstimate to factor in number of features
            numFeatures = int(msg['numFeatures'])

            eta = codex_time_log.getComputeTimeEstimate(
                algorithmType, algorithmName, numSamples)

            result['eta'] = eta
            result['message'] = 'success'
            result['algorithmType'] = msg['algorithmType']
            result['algorithmName'] = msg['algorithmName']
            result['numSamples'] = int(msg['numSamples'])
            result['numFeatures'] = int(msg['numFeatures'])

        elif (routine == 'arrange'):

            activity = msg["activity"]
            hashType = msg['hashType']

            if (activity == "add"):

                data = msg["data"]
                maskLength = msg["length"]
                encoded = data.encode("ascii")
                decoded = base64.decodebytes(encoded)
                resultString = "".join(["{:08b}".format(x) for x in decoded])

                numResults = len(resultString)
                delta = abs(numResults - maskLength)

                maskTmp = np.zeros(numResults)

                for x in range(0, numResults):
                    maskTmp[x] = int(resultString[x])

                mask = maskTmp[delta:]

                if (hashType == "selection"):
                    hashResult = codex_hash.hashArray(msg["name"], mask,
                                                      "subset")
                elif (hashType == "feature"):
                    hashResult = codex_hash.hashArray(msg["name"], mask,
                                                      "feature")
                else:
                    result["message"] = 'failure'

                result['message'] = 'success'

            elif (activity == "get"):

                names = msg["name"]
                data = []
                status = True

                for name in names:
                    if (hashType == "selection"):
                        array = codex_hash.findHashArray(
                            "name", name, "subset")
                    elif (hashType == "feature"):
                        array = codex_hash.findHashArray(
                            "name", name, "feature")
                    elif (hashType == "downsample"):
                        array = codex_hash.findHashArray(
                            "name", name, "downsample")
                    elif (hashType == "label"):
                        array = codex_hash.findHashArray("name", name, "label")
                    else:
                        result["message"] = 'failure'

                    if not array:
                        result[
                            "message"] = 'failed to find ' + name + ' feature '
                        status = False
                        break
                    else:
                        data.append(array['data'])

                if (status):
                    return_data = np.column_stack(data)
                    result['data'] = return_data.tolist()

            elif (activity == "delete"):

                name = msg["name"]

                if (hashType == "selection"):
                    status = codex_hash.deleteHashName(name, "subset")
                elif (hashType == "feature"):
                    status = codex_hash.deleteHashName(name, "feature")
                elif (hashType == "downsample"):
                    status = codex_hash.deleteHashName(name, "downsample")
                elif (hashType == "label"):
                    status = codex_hash.deleteHashName(name, "label")
                else:
                    result["message"] = 'failure'
                    status = False

                if (status == True):
                    result['message'] = 'success'
                else:
                    result['message'] = 'failure'

            elif (activity == "update"):

                field = msg["field"]
                old = msg["old"]
                new = msg["new"]

                if (hashType == "selection"):
                    status = codex_hash.hashUpdate(field, new, old, "subset")
                elif (hashType == "feature"):
                    status = codex_hash.hashUpdate(field, new, old, "feature")
                elif (hashType == "downsample"):
                    status = codex_hash.hashUpdate(field, new, old,
                                                   "downsample")
                elif (hashType == "label"):
                    status = codex_hash.hashUpdate(field, new, old, "label")
                else:
                    result["message"] = 'failure'
                    status = False

                if (status == True):
                    result['message'] = 'success'
                else:
                    result['message'] = 'failure'

            else:

                result['message'] = 'failure'

        elif (routine == 'download_code'):

            codex_return_code.dump_code_to_file()
            f = open(CODEX_ROOT + "returned_code.py", "r")
            lines = f.readlines()
            outString = "".join(lines)
            outStringEncoded = outString.encode('ascii')
            result['code'] = str(
                base64.b64encode(outStringEncoded).decode('utf-8'))
            result['message'] = 'success'

        else:

            result['message'] = 'Unknown Routine'

        # If anything failed above, the result will be None.
        # TODO - Replace this with an error handling scheme at some point
        if (result is None):
            result = {}

        result['cid'] = msg['cid']
        if 'message' not in result:
            result['message'] = 'success'

        stringMsg = json.dumps(result)
        codex_system.codex_log("{time} : Response to front end: {json}".format(time=now.isoformat(), json=stringMsg))
        return stringMsg


def routine_add_selection(msg):
    routineResult = {}


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


if __name__ == '__main__':

    print("CODEX Server Started")
    now = datetime.datetime.now()
    codex_system.codex_log("Server started at: " + str(now.isoformat()))
    codex_return_code.makeReturnCode()

    codex_time_log.getTimeLogDict()

    # Tornado Websocket
    app = make_app()
    if (len(sys.argv) > 1) and (sys.argv[1] == '-ssl'):
        ssl_ctx = ssl.create_default_context(ssl.Purpose.CLIENT_AUTH)
        ssl_ctx.load_cert_chain(
            os.path.join("/web/codex/html/_cert/codex.crt"),
            os.path.join("/web/codex/html/_cert/codex.key"))
        app = tornado.httpserver.HTTPServer(app, ssl_options=ssl_ctx)
    else:
        app = tornado.httpserver.HTTPServer(app)
    app.listen(8888)
    ioloop.IOLoop.instance().start()
