#! /usr/bin/env python

import sys
import json

if __name__ == '__main__':
    desc = json.load(sys.stdin)

    for key in desc:
        print('{}:'.format(key))
        for fn in desc[key]:
            print('\t{}({})'.format(fn['name'], len(fn['params'])))
