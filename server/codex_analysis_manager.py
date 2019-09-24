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

sys.path.insert(1, os.getenv('CODEX_ROOT'))

from api.sub.codex_return_code import dump_code_to_file

def download_code(msg, result):

    dump_code_to_file()
    f = open(CODEX_ROOT + "returned_code.py", "r")
    lines = f.readlines()
    outString = "".join(lines)
    outStringEncoded = outString.encode('ascii')
    result['code'] = str(base64.b64encode(outStringEncoded).decode('utf-8'))
    result['message'] = 'success'
    f.close()

    return result


if __name__ == "__main__":
    
    import codex_doctest
    codex_doctest.run_codex_doctest()


