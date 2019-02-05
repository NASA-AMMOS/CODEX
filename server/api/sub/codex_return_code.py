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
import numpy as np
import os.path
CODEX_ROOT = os.getenv('CODEX_ROOT')

returnedCodePath = CODEX_ROOT + "returned_code.py"
contents = []


def makeReturnCode():
    '''
    Inputs:

    Outputs:

    Examples:
    '''
    contents.append('import os\n')
    contents.append("CODEX_ROOT  = os.getenv('CODEX_ROOT')\n")
    contents.append("import sys\n")
    contents.append("sys.path.insert(1,CODEX_ROOT + '/api/')\n")
    contents.append("sys.path.insert(1,CODEX_ROOT + '/api/sub/')\n")
    contents.append(
        "import time, h5py, codex_read_data_api, codex_plot, codex_time_log\n")
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
    contents.append("import codex_hash, codex_return_code\n")
    contents.append(
        "import codex_clustering_api, codex_dimmension_reduction_api\n")
    contents.append("import codex_template_scan_api, codex_endmembers\n")
    contents.append("import codex_segmentation_api, codex_regression_api\n")
    contents.append(
        "\n\n#### This code is an auto-generated output of your last session working in CODEX.\n\n")


def logReturnCode(inputString):
    '''
    Inputs:

    Outputs:

    Examples:
    '''
    contents.append(inputString + "\n")


def code_unique(seq):
    seen = set()
    seen_add = seen.add
    return [x for x in seq if not (x in seen or seen_add(x))]


def dump_code_to_file():
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

    import doctest
    results = doctest.testmod(optionflags=doctest.ELLIPSIS)
    sys.exit(results.failed)
