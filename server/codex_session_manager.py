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

from os import listdir
from os.path import isfile, join, isdir

import codex_hash
import codex_doctest

def save_session(msg, result):


    session_name = msg['session_name']
    session_path = os.path.join(CODEX_ROOT, 'sessions', session_name)

    if not os.path.exists(session_path):
        codex_hash.pickle_data(session_name)
    else:
        result["WARNING"] = session_name + " already exists."

    return result


def load_session(msg, result):

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

