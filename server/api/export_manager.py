'''
Author: Jack Lightholder
Date  : 7/19/17
Brief : 
Notes :

Copyright 2019 California Institute of Technology.  ALL RIGHTS RESERVED.
U.S. Government Sponsorship acknowledged.
'''
import os
import sys
import base64
import traceback
import logging
import numpy as np

sys.path.insert(1, os.getenv('CODEX_ROOT'))

logger = logging.getLogger(__name__)

from api.sub.hash  import get_cache

def export_contents(msg, result, savePath):
    '''
    Inputs:

    Outputs:

    '''
    try:

        if(msg["type"] == "code"):
            cache = get_cache(msg['sessionkey'])
            saveFile = os.path.join(savePath,"returned_code.py")
            cache.dump_code_to_file(saveFile)
            f = open(saveFile, "r")
            lines = f.readlines()
            outString = "".join(lines)
            outStringEncoded = outString.encode('ascii')
            result['data'] = str(base64.b64encode(outStringEncoded).decode('utf-8'))
            result['filename'] = 'codex_code.py'
            result['message'] = 'success'
            result['content'] = True
            f.close()

        elif(msg["type"] == "features"):
            cache = get_cache(msg['sessionkey'])
            data = cache.return_data()
            names = []
            features = []
            for item in data['features']:
                names.append(item['name'])
                features.append(item['data'])
            if features:
                features = np.column_stack(features)
                header = ",".join(names)
                saveFile = os.path.join(savePath,"features.csv")   
                np.savetxt(saveFile, features, delimiter=',', header=header)
                f = open(saveFile, "r")
                lines = f.readlines()
                outString = "".join(lines)
                outStringEncoded = outString.encode('ascii')
                result['data'] = str(base64.b64encode(outStringEncoded).decode('utf-8'))
                result['filename'] = 'codex_features.csv'
                result['content'] = True
                f.close()
            else:
                result['content'] = False
            result['message'] = 'success'


        elif(msg["type"] == "selections"):
            cache = get_cache(msg['sessionkey'])
            data = cache.return_data()
            names = []
            selections = []
            for item in data['subsets']:
                names.append(item['name'])
                selections.append(item['data'])
            if selections:
                selections = np.column_stack(selections)
                header = ",".join(names)
                saveFile = os.path.join(savePath,"selections.csv")   
                np.savetxt(saveFile, selections, delimiter=',', header=header)
                f = open(saveFile, "r")
                lines = f.readlines()
                outString = "".join(lines)
                outStringEncoded = outString.encode('ascii')
                result['data'] = str(base64.b64encode(outStringEncoded).decode('utf-8'))
                result['filename'] = 'codex_selections.csv'
                result['content'] = True
                f.close()
            else:
                result['content'] = False
            result['message'] = 'success'
        else:
            result['WARNING'] = 'export type not supported. code|features|selections are supported.'
            result['message'] = 'failure'



    except:
        logging.warning(traceback.format_exc())

    return result


