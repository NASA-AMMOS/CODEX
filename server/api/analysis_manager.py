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

sys.path.insert(1, os.getenv('CODEX_ROOT'))

logger = logging.getLogger(__name__)

from api.sub.return_code       import dump_code_to_file

def download_code(msg, result, savePath):
    '''
    Inputs:

    Outputs:

    '''
    try:
        saveFile = os.path.join(savePath,"returned_code.py")
        dump_code_to_file(saveFile)
        f = open(saveFile, "r")
        lines = f.readlines()
        outString = "".join(lines)
        outStringEncoded = outString.encode('ascii')
        result['code'] = str(base64.b64encode(outStringEncoded).decode('utf-8'))
        result['message'] = 'success'
        f.close()

    except:
        logging.warning(traceback.format_exc())

    return result


