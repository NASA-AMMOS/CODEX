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
            result['code'] = str(base64.b64encode(outStringEncoded).decode('utf-8'))
            result['message'] = 'success'
            f.close()


    except:
        logging.warning(traceback.format_exc())

    return result


