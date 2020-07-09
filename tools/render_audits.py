#! /usr/bin/env python
'''
This is a fragile, shitty script to create a single web page with some
precisely positioned DOM elements to visualize a single request stream.
'''

# how to run:
# python render_audits.py database.sqlite [session]

import sqlite3
import sys
from math import ceil

if len(sys.argv) != 3 and len(sys.argv) != 2:
    print('usage: ./render_audits.py database.sqlite [session]')
    sys.exit(1)

conn = sqlite3.Connection(sys.argv[1])
conn.row_factory = sqlite3.Row

def get_requested_session_key():

    # if it's specified, return it
    if len(sys.argv) == 3:
        return sys.argv[2]

    c = conn.cursor()
    c.execute('''
        SELECT session FROM Audits ORDER BY start DESC LIMIT 1
    ''')

    return c.fetchone()[0]

session_key = get_requested_session_key()

sys.stderr.write('Rendering logs for session with key "{}"\n'.format(session_key))
sys.stderr.flush()


def get_all_logs(session):
    c = conn.cursor()
    c.execute('''
        SELECT method, features, start, elapsed, success
            FROM Audits
            WHERE session=?
            ORDER BY start ASC
    ''', [session])

    return c.fetchall()


def create_bars(session):
    # we have to resolve them all here bc there's not a clean way to determine
    # the spacing on the fly
    logs = list(get_all_logs(session))

    first_start_time = logs[0]['start']
    last_end_time    = logs[-1]['start'] + logs[-1]['elapsed']

    divs = '<div class="bars">\n'

    spacing = 1000

    # create data bars
    for i, log in enumerate(logs):
        divs += '''
        <div class="bar {}" style="left: {}px; top: {}px; height: {}px;">
            <span class="bar__label">{} ({}s)</span>
        </div>'''.format(
            'bar--tornado' if log['method'].startswith('tornado') else '',
            (i + 1) * 10,
            (log['start'] - first_start_time) * spacing,
            log['elapsed'] * spacing,
            log['method'],
            log['elapsed']
        )

    # calculate how many ticks we need (1/sec)
    ticks_needed = ceil(last_end_time - first_start_time)
    
    # insert major ticks
    for i in range(ticks_needed):
        divs += '''
            <div class="tick" style="top:{}px;">
                {}s
            </div>
        '''.format(i*spacing, i)

    # insert minor ticks
    subticks_per_sec = 8
    for i in range(ticks_needed * subticks_per_sec):
        # skip every 4th
        if (i % subticks_per_sec) == 0:
            continue

        divs += '''
            <div class="tick__minor" style="top:{}px;">
                {}s
            </div>
        '''.format((i/subticks_per_sec)*spacing, i/subticks_per_sec)



    divs += '</div>'
    return divs


def create_page(session_key):
    bars = create_bars(session_key)
    
    styles = '''
        <style>
            .bars {
                position: relative;
                margin: 10px;
                font-family: monospace;
                font-size: 11px;
                padding-bottom: 10px;
            }

            .bar {
                background-color: cyan;
                color: black;
                position: absolute;
                width: 10px;
            }

            .bar--tornado {
                background-color: gray;
            }

            .bar__label {
                white-space: nowrap;
                margin-left: 21px;
                position: relative;
            }

            .bar__label:hover {
                background-color: white;
                z-index: 1000;
            }


            .tick {
                height: 1px;
                border-top: 1px dashed red;
                color: red;
                
                position: absolute;
                left: 0;
                right: 0;
            }

            .tick__minor {
                height: 1px;
                border-top: 1px dotted red;
                color: red;
                opacity: 0.15;
                
                position: absolute;
                left: 0;
                right: 0;
            }
        </style>
    '''


    return f'''
        <html>
            <head>
                <title>Inspecting {session_key}</title>
            </head>
            <body>
                <h1>Session "{session_key}"</h1>
                {bars}
                {styles}
            </body>
        </html>
    '''

print(create_page(session_key))
