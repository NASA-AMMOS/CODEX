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

import base64

import codex_return_code

def download_code(msg, result):

    codex_return_code.dump_code_to_file()
    f = open(CODEX_ROOT + "returned_code.py", "r")
    lines = f.readlines()
    outString = "".join(lines)
    outStringEncoded = outString.encode('ascii')
    result['code'] = str(base64.b64encode(outStringEncoded).decode('utf-8'))
    result['message'] = 'success'
    f.close()

    return result


if __name__ == "__main__":

    codex_doctest.run_codex_doctest()


