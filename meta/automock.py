#! /usr/bin/env python3

import sys
import json
from typing import List, Dict, Text

def mock_method(name: Text, params: List[Text]) -> Text:
    """
    auto-mock a method

    :param name: method name
    :type name: Text
    :param params: list of parameter names
    :type params: List[Text]
    :rtype: Text
    """
    params = [p if p is not None else 'x' for p in params]
    func = '\n\t{}({}) {{\n'.format(name, ', '.join(params))
    func += '\t\tconsole.warn(\'{} called with \', {})\n'.format(name, ', '.join(params))
    func += '\t}\n'

    return func


def mock_class(name: Text, methods: List[Dict]) -> Text:
    """
    auto-mock a class

    :param name: class name
    :type name: Text
    :param methods: 
    :type methods: List[Dict]
    :rtype: Text
    """
    out = 'class {} {{\n'.format(name)
    out += ''.join([mock_method(m['name'], m['params']) for m in methods])
    out += '}}\n\nexport default {}'.format(name)

    return out

if __name__=='__main__':
    desc = json.load(sys.stdin)
    for key in desc:
        print(mock_class(key, desc[key]))
