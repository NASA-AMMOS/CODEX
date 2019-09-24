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

sys.path.insert(1, os.getenv('CODEX_ROOT'))

from api.sub.codex_guidance import get_guidance_text_block

def get_guidance(msg, result):
    '''
    Inputs:

    Outputs:

    Examples:

    '''

    guidance = msg["guidance"]
    split = guidance.split(":")
    
    if (len(split) == 2):
        guidanceString = get_guidance_text_block(split[0], split[1])
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

    from api.sub.codex_doctest import run_codex_doctest
    run_codex_doctest()

