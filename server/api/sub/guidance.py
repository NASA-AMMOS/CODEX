'''
Author: Jack Lightholder
Date  : 2/7/18

Brief : YAML read/write/manipulate library for CODEX

Notes :

'''
import os
import sys
import yaml
import logging

sys.path.insert(1, os.getenv('CODEX_ROOT'))

logger = logging.getLogger(__name__)

def get_guidance_text_block(page, section, readPath):
    '''
    Inputs:

    Outputs:

    '''
    try:
	     with open(os.path.join(readPath, "guidance.yaml"), 'r') as ymlfile:
	        yamlDoc = yaml.load(ymlfile, Loader=yaml.FullLoader)
        	return yamlDoc[page][section]
    except BaseException:
        return None

