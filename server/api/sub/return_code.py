'''
Author: Jack Lightholder
Date  : 7/15/17

Brief : Commands for auto-generating output source, based on user input

Notes :
'''
import os
import time
import h5py
import hashlib
import sys
import json
import inspect
import os.path

from types import ModuleType

import numpy as np

sys.path.insert(1, os.getenv('CODEX_ROOT'))

contents = []

from api.sub.codex_hash import WrappedCache

def logReturnCode(frame):
    '''
    Inputs:

    Outputs:

    Examples:
    '''
    args, _, _, values = inspect.getargvalues(frame)
    trace = inspect.getframeinfo(frame)
    func_name = trace[2]
    file_name = trace[0].rstrip(".py")

    args = dict(zip(args,list(values.values())[:len(args)]))

    function_string = "{file_name}.{func_name}".format(file_name=file_name, func_name=func_name)

    arg_string_list = []
    for arg, value in args.items():
        if isinstance(value, int):
            arg_string = "{arg}={value}".format(arg=arg, value=value)
        elif isinstance(value, float):
            arg_string = "{arg}={value}".format(arg=arg, value=value)
        elif isinstance(value, bool):
            arg_string = "{arg}={value}".format(arg=arg, value=value)
        elif isinstance(value, type(None)):
            arg_string = "{arg}={value}".format(arg=arg, value=None)
        elif isinstance(value, str):
            arg_string = "{arg}='{value}'".format(arg=arg, value=value)
        elif isinstance(value, list):
            arg_string = "{arg}={value}".format(arg=arg, value=value)
        elif isinstance(value, tuple):
            arg_string = "{arg}={value}".format(arg=arg, value=value)
        elif isinstance(value, dict):

            ndarray_keys = []
            for dict_key, dict_value in value.items():
                if isinstance(dict_value, (np.ndarray, np.generic)):
                    value[dict_key] = dict_value.tolist()
                    ndarray_keys.append(dict_key)

                # TODO - do these need to be back in byte configuration to actually be used again?
                if isinstance(dict_value, bytes):
                    value[dict_key] = str(dict_value)

            resolved_ndarray_keys = []
            for key in ndarray_keys:
                value[key] = '"{key}":np.array(({payload}))'.format(key=key, payload=value[key])
                resolved_ndarray_keys.append(value[key])
                del value[key]

            dict_string = json.dumps(value)
            dict_string = dict_string[:-1]
            resolved_nd_array_key_string = ",".join(resolved_ndarray_keys)
            dict_string = "{dict_string},{resolved_nd_array_key_string}}}".format(dict_string=dict_string, resolved_nd_array_key_string=resolved_nd_array_key_string)
            arg_string = "{arg}={dict_string}".format(arg=arg, dict_string=dict_string)

        elif isinstance(value, (np.ndarray, np.generic)):
            arg_string = "{arg}=np.array(({value}))".format(arg=arg, value=value)
            arg_string = arg_string.replace("\n","")
            arg_string = arg_string.replace(" ",",")
        elif isinstance(value, WrappedCache):
            arg_string = ""
        elif isinstance(value, ModuleType):
            arg_string = ""
        else:
            arg_string = ""
            print("Unsupported input type: {type} for {function_string} in {arg}".format(type=type(value), function_string=function_string, arg=arg))

        arg_string_list.append(arg_string)
    
    arg_string = ", ".join(arg_string_list)

    full_string = "{function_string}({arg_string})\n".format(function_string=function_string, arg_string=arg_string)
    contents.append(full_string)
    return full_string


def makeReturnCode():
    '''
    Inputs:

    Outputs:

    Examples:
    '''
    contents.append('import os\n')
    contents.append("CODEX_ROOT  = os.getenv('CODEX_ROOT')\n")
    contents.append("import sys\n")
    contents.append("import time, h5py, codex_read_data_api, codex_plot, codex_time_log\n")
    contents.append("import codex_data_quality_scan_api\n")
    contents.append("import numpy as np\n")
    contents.append("import matplotlib.pyplot as plt\n")
    contents.append("import matplotlib.image as mpimg\n")
    contents.append("import codex_peak_detection_api\n")
    contents.append("from scipy import misc\n")
    contents.append("from random import randint\n")
    contents.append("from sklearn import cluster, datasets\n")
    contents.append("from sklearn.neighbors import kneighbors_graph\n")
    contents.append("from sklearn.preprocessing import StandardScaler\n")
    contents.append("from codex_plot import getColorMap\n")
    contents.append("import codex_hash, return_code\n")
    contents.append("import codex_clustering_api, codex_dimmension_reduction_api\n")
    contents.append("import codex_template_scan_api, codex_endmembers\n")
    contents.append("import codex_segmentation_api, codex_regression_api\n")
    contents.append("\n\n#### This code is an auto-generated output of your last session working in CODEX.\n\n")


def code_unique(seq):
    '''
    Inputs:

    Outputs:

    Examples:
    '''
    seen = set()
    seen_add = seen.add
    return [x for x in seq if not (x in seen or seen_add(x))]


def dump_code_to_file(returnedCodePath):
    '''
    Inputs:

    Outputs:

    Examples:
    '''

    file = open(returnedCodePath, 'w+')
    global contents
    contents = code_unique(contents)

    for line in contents:
        file.write(line)

    file.close()


if __name__ == "__main__":

    from api.sub.codex_doctest import run_codex_doctest
    run_codex_doctest()

