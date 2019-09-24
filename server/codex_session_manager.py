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

from os      import listdir
from os.path import isfile, join, isdir

sys.path.insert(1, os.getenv('CODEX_ROOT'))

import codex_doctest
from codex_hash import get_cache

def save_session(msg, result):
    codex_hash = get_cache(msg['sessionkey'])


    session_name = msg['session_name']
    session_path = os.path.join(CODEX_ROOT, 'sessions', session_name)

    if not os.path.exists(session_path):
        codex_hash.pickle_data(session_name, msg['state'])
    else:
        result["WARNING"] = session_name + " already exists."

    return result


def load_session(msg, result):
    codex_hash = get_cache(msg['sessionkey'])

    session_name = msg['session_name']
    session_path = os.path.join(CODEX_ROOT, 'sessions', session_name)
    result['session_name'] = msg['session_name']

    if os.path.exists(session_path):
        result['session_data'] = codex_hash.unpickle_data(session_name)
    else:
        result["WARNING"] = session_name + " does not exist."

    return result


def get_sessions(msg, result):

    path = os.path.join(CODEX_ROOT, 'sessions')
    result['sessions'] = [f for f in listdir(path) if isdir(join(path, f))]

    return result



if __name__ == "__main__":

    codex_doctest.run_codex_doctest()

