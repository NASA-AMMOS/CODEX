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

sys.path.insert(1, os.getenv('CODEX_ROOT'))

from api.sub.codex_return_code import dump_code_to_file
from api.sub.codex_system      import codex_log

def download_code(msg, result, savePath):
    '''
    Inputs:

    Outputs:

    Examples:
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
        codex_log(traceback.format_exc())

    return result


if __name__ == "__main__":
    
    from api.sub.codex_doctest import run_codex_doctest
    run_codex_doctest()


