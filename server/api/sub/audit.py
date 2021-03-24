'''
Author: Patrick Kage
Date  : 7/06/20
Brief : Audit logging for CODEX
Notes :
    This component generates audit logs for every CODEX function call,
    allowing for the generation of fine-grained profiling.

    This information will guide future decisions about optimization directions.

    Some of this (e.g. opening the DB) will be generalized out of here.
'''

import os
import sys
import time
import sqlite3
import logging

logger = logging.getLogger('audit')
sys.path.insert(1, os.getenv('CODEX_ROOT'))

DB_PATH = os.path.join(os.getenv('CODEX_ROOT'), 'codex.sqlite')
SCHEMA_PATH = os.path.join(os.getenv('CODEX_ROOT'), 'schema.sql')

def _audits_enabled():
    if not os.path.exists(DB_PATH) and not os.path.exists(SCHEMA_PATH):
        logger.error('Audit database does not exist, and schema does not either. Unable to bootstrap DB, auditing will be unavailable.')
        return False
    return os.getenv('CODEX_AUDIT') is not None

def initialize_auditor():
    '''
    Initializes the auditor database
    '''
    logger.debug('init auditor')
    if not _audits_enabled():
        return

    if not os.path.exists(DB_PATH):
        logger.debug('init audit db')
        conn = sqlite3.connect(DB_PATH)

        c = conn.cursor()

        try:
            with open(SCHEMA_PATH, 'r') as schema_file:
                schema = schema_file.read()
                c.executescript(schema)

            c.close()
        except sqlite3.OperationalError as err:
            logger.error('Unable to apply schema to database, due to an error with the schema file.')
            logger.error('Auditing may be unstable/fully broken.')
            print(err)
        else:
            logger.info('Audit DB bootstrapped successfully.')

class MessageAuditor:
    def __init__(self, msg):
        if not _audits_enabled():
            return

        print('init audit')

        self.method = msg['routine'] if 'routine' in msg else None

        if self.method == 'arrange':
            self.method += '/' + msg['activity']

        if 'name' in msg:
            if type(msg['name']) is str:
                # features is a string
                self.features = msg['name']
            else:
                # features is an array
                self.features = ','.join(msg['name'])
        else:
            self.features = None

        # just going to assume it's on the message
        self.session = msg['sessionkey']

        # assume we're doing ok
        self.success = True
        print('init audit done')

    def start(self):
        if not _audits_enabled():
            return
        # start the clock
        self.start = time.time()
        print('start audit')

    def is_enabled(self):
        return _audits_enabled()

    def set_success(self, success):
        self.success = success

    def finish(self):
        if not _audits_enabled():
            return
        print('finishing audit')
        # determine time elapsed
        elapsed = time.time() - self.start

        # write into database
        conn = sqlite3.connect(DB_PATH)
        print('\twriting to '+DB_PATH)
        c = conn.cursor()

        try:
            c.execute('''
                INSERT INTO Audits (session, method, features, start, elapsed, success)
                VALUES (?,?,?,?,?,?)
            ''',
                [self.session, self.method, self.features, self.start, elapsed, self.success]
            )

            conn.commit()
            c.close()
        except Exception as e:
            import traceback
            traceback.print_exc()
        else:
            print('\tno exception generated.')

        print('audit finished')

    def __enter__(self):
        self.start()

    def __exit__(self, exc_type, exc_value, exc_traceback):
        # if we haven't been given an exception, then assume success.
        self.set_success(exc_type is None)
        self.finish()

if __name__ == '__main__':
    msg = {"routine":"arrange","hashType":"feature","activity":"metrics","name":["Na2O"],"sessionkey":"PreciousAgreeableWoebegoneFerret","cid":"g9wn"}

    print('beginning audit')
    with MessageAuditor(msg) as audit:
        print('audit running')
    print('audit ended')
