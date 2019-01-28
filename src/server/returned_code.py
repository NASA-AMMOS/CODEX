import os
CODEX_ROOT  = os.getenv('CODEX_ROOT')
import sys
sys.path.insert(1,CODEX_ROOT + '/api/')
sys.path.insert(1,CODEX_ROOT + '/api/sub/')
import time, h5py, codex_read_data_api, codex_plot, codex_time_log
import codex_data_quality_scan_api
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.image as mpimg
import codex_peak_detection_api
from scipy import misc
from random import randint
from sklearn import cluster, datasets
from sklearn.neighbors import kneighbors_graph
from sklearn.preprocessing import StandardScaler
from codex_plot import getColorMap
import codex_hash, codex_return_code
import codex_clustering_api, codex_dimmension_reduction_api
import codex_template_scan_api, codex_endmembers
import codex_segmentation_api, codex_regression_api


#### This code is an auto-generated output of your last session working in CODEX.

hashList = codex_read_data_api.codex_read_csv('/Users/jackal/Documents/CODEX/CODEX_GIT/src/server//../../uploads/doctest.csv', None, 'feature')
featureList =['SiO2','TiO2','Al2O3','FeOT']
hashList = codex_hash.feature2hashList(featureList)
data = codex_hash.mergeHashResults(hashList)
"d4f73c330a7697113e9efb97816fb4ce5154d1db" = codex_hash.hashArray("Merged", data, "feature")
codex_dimmension_reduction_api.codex_decomposition_PCA('d4f73c330a7697113e9efb97816fb4ce5154d1db',False,2,True,False,False)

codex_clustering_api.codex_clustering_kmeans('e3f5de63be5f8fccd42b58721e39c6f302547d7e',False,3,True,15)

codex_clustering_api.codex_clustering_ward('e3f5de63be5f8fccd42b58721e39c6f302547d7e',False,5,3,True,15)

codex_clustering_api.codex_clustering_mean_shift('e3f5de63be5f8fccd42b58721e39c6f302547d7e',False,0.5,True,15)

codex_clustering_api.codex_clustering_dbScan('e3f5de63be5f8fccd42b58721e39c6f302547d7e',False,0.7,True,15)

codex_clustering_api.codex_clustering_agglomerative('e3f5de63be5f8fccd42b58721e39c6f302547d7e',False,5,3,True,15)

codex_clustering_api.codex_clustering_birch('e3f5de63be5f8fccd42b58721e39c6f302547d7e',False,3,True,15)

codex_clustering_api.codex_clustering_affinity_propagation('e3f5de63be5f8fccd42b58721e39c6f302547d7e',False,0.9,True,15)

codex_clustering_api.codex_clustering_spectral('e3f5de63be5f8fccd42b58721e39c6f302547d7e',False,3,True,15)

