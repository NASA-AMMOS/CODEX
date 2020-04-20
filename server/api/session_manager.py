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
import logging

from os      import listdir
from os.path import isfile, join, isdir

sys.path.insert(1, os.getenv('CODEX_ROOT'))

logger = logging.getLogger(__name__)

from api.sub.hash    import get_cache

def save_session(msg, result, savePath):
    '''
    Inputs:

    Outputs:

    '''
    try:

        cache = get_cache(msg['sessionkey'])

        session_name = msg['session_name']

        if session_name == "AUTOSAVE":
            cache.pickle_data(session_name, msg['state'], savePath)
        else:
            session_path = os.path.join(savePath, 'sessions', session_name)

            if not os.path.exists(session_path):
                cache.pickle_data(session_name, msg['state'], savePath)
            else:
                result["WARNING"] = "{session_name} already exists.".format(session_name=session_name)

    except:
        logging.warning(traceback.format_exc())

    return result


def load_session(msg, result, loadPath):
    '''
    Inputs:

    Outputs:

    '''
    try:

        cache = get_cache(msg['sessionkey'])

        session_name = msg['session_name']
        session_path = os.path.join(loadPath, 'sessions', session_name)
        result['session_name'] = msg['session_name']

        if os.path.exists(session_path):
            result['session_data'] = cache.unpickle_data(session_name, loadPath)
        else:
            result["WARNING"] = session_name + " does not exist."

    except:
        logging.warning(traceback.format_exc())

    return result


def get_sessions(msg, result, sessionPath):
    '''
    Inputs:

    Outputs:

    '''
    try:

        path = os.path.join(sessionPath, 'sessions')
        result['sessions'] = [f for f in listdir(path) if isdir(join(path, f))]

    except:
        logging.warning(traceback.format_exc())

    return result


