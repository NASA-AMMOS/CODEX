#! /usr/bin/env python3

import sys
import json
from typing import List, Callable, Dict, Text

def extract(node: Dict, test: Callable) -> List:
    """
    Extract a list of nodes matching a certain test

    :param node: node to start with
    :type node: Dict
    :param test: lambda
    :type test: Callable
    :returns: a list of nodes
    :rtype: List
    """

    # local case
    out = []
    if test(node):
        out.append(node)

    if not 'deps' in node:
        return out

    # recursive step
    for dep in node['deps']:
        out += extract(dep, test)

    return out

def extract_parents(node: Dict, test: Callable) -> List:
    """
    Like extract, but returning parents when children match

    :param node: node to start with
    :type node: Dict
    :param test: lambda
    :type test: Callable
    :returns: a list of nodes
    :rtype: List
    """

    # we know that if there are no deps, this can't match
    if not 'deps' in node:
        return []

    # scan children
    matched = False
    for dep in node['deps']:
        if test(dep):
            matched = True

    # if matched then return the node later
    out = []
    if matched:
        out.append(node)

    # same recursion step as before
    for dep in node['deps']:
        out += extract_parents(dep, test)

    return out


def show_list(title: Text, targets: List[Text]) -> None:
    """show_list

    :param title: Title of the list
    :type title: Text
    :param targets: list of Nodes
    :type targets: List[Text]
    :rtype: None
    """

    if not targets:
        return

    print('\n{}:'.format(title))
    for targ in targets:
        print('\t{}'.format(targ))


if __name__ == '__main__':
    ROOT = json.load(sys.stdin)

    controller_targets = [
        n['basename'] for n in extract_parents(ROOT, lambda n: 'controller' in n['path'])
    ]
    error_nodes = [n['basename'] for n in extract(ROOT, lambda n: n['type'] == 'error')]

    show_list('Rearchitecture targets', controller_targets)
    show_list('Non-standard JS', error_nodes)
