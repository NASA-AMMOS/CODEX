#! /usr/bin/env python

import sys
import json

if __name__ == '__main__':
    desc = json.load(sys.stdin)

    # class is a keyword
    for cls in desc:
        print('{}:'.format(cls))
    
        tups = desc[cls].items()#.sort(lambda x: sum([f['count'] for f in x[1]]))
        tups = sorted(tups, key=lambda x: sum([f['count'] for f in x[1]]), reverse=True)

        for fn, uses in tups:
            print('\t{}'.format(fn))
            if uses:
                for use in uses:
                    #print(json.dumps(use))
                    print('\t\t{: 2d} x {}'.format(use['count'], use['file']['basename']))
            else:
                print('\t\tno uses')
