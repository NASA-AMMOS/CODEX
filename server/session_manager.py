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
import traceback

from os      import listdir
from os.path import isfile, join, isdir

sys.path.insert(1, os.getenv('CODEX_ROOT'))

from api.sub.codex_hash    import get_cache
from api.sub.codex_system  import codex_log

def save_session(msg, result, savePath):
    '''
    Inputs:

    Outputs:

    Examples:

    '''
    try:

        codex_hash = get_cache(msg['sessionkey'])

        session_name = msg['session_name']
        session_path = os.path.join(savePath, 'sessions', session_name)

        if not os.path.exists(session_path):
            codex_hash.pickle_data(session_name, msg['state'], savePath)
        else:
            result["WARNING"] = session_name + " already exists."

    except:
        codex_log(traceback.format_exc())

    return result


def load_session(msg, result, loadPath):
    '''
    Inputs:

    Outputs:

    Examples:

    '''
    try:

        codex_hash = get_cache(msg['sessionkey'])

        session_name = msg['session_name']
        session_path = os.path.join(loadPath, 'sessions', session_name)
        result['session_name'] = msg['session_name']

        if os.path.exists(session_path):
            result['session_data'] = codex_hash.unpickle_data(session_name, loadPath)
        else:
            result["WARNING"] = session_name + " does not exist."

    except:
        codex_log(traceback.format_exc())

    return result


def get_sessions(msg, result, sessionPath):
    '''
    Inputs:

    Outputs:

    Examples:

    '''
    try:

        path = os.path.join(sessionPath, 'sessions')
        result['sessions'] = [f for f in listdir(path) if isdir(join(path, f))]

    except:
        codex_log(traceback.format_exc())

    return result



if __name__ == "__main__":

    from api.sub.codex_doctest import run_codex_doctest
    run_codex_doctest()

