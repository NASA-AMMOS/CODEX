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

import codex_guidance
import codex_doctest


def get_guidance(msg, result):
    '''
    Inputs:

    Outputs:

    Examples:

    '''

    guidance = msg["guidance"]
    split = guidance.split(":")
    
    if (len(split) == 2):
        guidanceString = codex_guidance.get_guidance_text_block(split[0], split[1])
        if (guidanceString is not None):
            result["guidance"] = guidanceString
            result["message"] = "success"
        else:
            result[
                "message"] = guidance + " does not exist in YAML guidance file"
            result["guidance"] = ""
            result["message"] = "failure"
    else:
        result["message"] = "Incorrect request formatting"
        result["guidance"] = ""
        result["message"] = "failure"

    return result



if __name__ == "__main__":

    codex_doctest.run_codex_doctest()

