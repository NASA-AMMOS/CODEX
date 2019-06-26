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

/Users/helbling/Workspace/CODEX/server/api/sub/codex_system.get_featureList(featureList=['SiO2', 'TiO2'])
codex.on_message(self=['File', 'Target', 'ShotNumber', 'Distance(m)', 'LaserPower', 'SpectrumTotal', 'SiO2', 'TiO2', 'Al2O3', 'FeOT', 'MgO', 'CaO', 'Na2O', 'K2O', 'Total', 'SiO2_RMSEP', 'TiO2_RMSEP', 'Al2O3_RMSEP', 'FeOT_RMSEP', 'MgO_RMSEP', 'CaO_RMSEP', 'Na2O_RMSEP', 'K2O_RMSEP', 'labels'], message=['9b8a02a6e0f6e31da38c693f64a8a31aacfdf34c', '3794400b71826da64b8e143bc7ca44c7ee928351', '48fb386dd420e06ff6f15f95e3f791fb679d2bfc', '23c9043ca1c26f1020be28a63b59171d4b17e680', 'cc60dacdd8ad9adfab1ec8a15d9e4e03ac1a65ad', '9e9ef596cefb10e662718c31535533020e464ad8', '1f966799d5ed7712cd9bf4f4afbf3cb24627ae6b', '6b46a4be7386cf2508cb0dac2a3b77862e19a4d8', '10833cf4c87b66afc08ac5191ee7a32dc5a818fe', '6b787b9364a80d6fb165fd2501cc5c3cff214812', '48bf497857a40d3a9beb0173466aafa804f7b8d1', '78c772251df35002dc4474219663bf629dccb32c', 'eb4e1cb69cbd4543752c61528a37e6b3613cb930', '75f757bcf34ed89cc8d398ef7fb8776576114078', '3396b81bc1f2aeab1ceef5027d9889913d9c7692', '896c8fe60ccb8c51f747e8b451ec79358205bdd8', '2daabf8824f7199e336599d91bebe3c8f76009a4', '780204e15bd1d7d1779509a1efcf6fb764ec3d6f', 'e7fcb52caec79b7d4d80400cc0ca53c84dbfb8be', '26f40ca0db2994d11e237b0b045eee0f5924babc', 'e8b3a68fd9cf7c39d16d147df70ea62deb6724dd', '595b1b82473f3c2e13149838c0fe8dd791e7383a', 'ab5822c222c83c448bca2e24480302ff3c6282e1', '78e0f5c25aa8f29ee53e41a5f568e361bf78b0d6'])
/Users/helbling/Workspace/CODEX/server/api/sub/codex_system.get_featureList(featureList=['FeOT', 'CaO'])
/Users/helbling/Workspace/CODEX/server/codex_workflow_manager.workflow_call(msg=['6b787b9364a80d6fb165fd2501cc5c3cff214812', '78c772251df35002dc4474219663bf629dccb32c'], result=None)
/Users/helbling/Workspace/CODEX/server/api/sub/codex_system.get_featureList(featureList=['Al2O3', 'MgO'])
/Users/helbling/Workspace/CODEX/server/codex_algorithm_manager.algorithm_call(msg=['10833cf4c87b66afc08ac5191ee7a32dc5a818fe', '48bf497857a40d3a9beb0173466aafa804f7b8d1'], result=None)
/Users/helbling/Workspace/CODEX/server/api/codex_dimmension_reduction_api.run_codex_dim_reduction(inputHash='PCA', subsetHash=False, parms=False, downsampled={"n_components": 2,}, showPlot=False, algorithm='579d43da0d73c7830dc15e1d3d7a4caff5fd48a5')
/Users/helbling/Workspace/CODEX/server/api/codex_dimmension_reduction_api.run_codex_dim_reduction(inputHash='ICA', subsetHash=False, parms=False, downsampled={"n_components": 2,}, showPlot=False, algorithm='579d43da0d73c7830dc15e1d3d7a4caff5fd48a5')
/Users/helbling/Workspace/CODEX/server/api/sub/codex_system.get_featureList(featureList=['MgO', 'Na2O'])
/Users/helbling/Workspace/CODEX/server/codex_workflow_manager.workflow_call(msg=['48bf497857a40d3a9beb0173466aafa804f7b8d1', 'eb4e1cb69cbd4543752c61528a37e6b3613cb930'], result=None)
/Users/helbling/Workspace/CODEX/server/codex_algorithm_manager.algorithm_call(msg=['48bf497857a40d3a9beb0173466aafa804f7b8d1', 'eb4e1cb69cbd4543752c61528a37e6b3613cb930'], result=None)
/Users/helbling/Workspace/CODEX/server/api/codex_dimmension_reduction_api.run_codex_dim_reduction(inputHash='PCA', subsetHash=False, parms=False, downsampled={"n_components": 2,}, showPlot=False, algorithm='6e6b20fa4100b1b5db41548b5e0ec42d6b6bf465')
/Users/helbling/Workspace/CODEX/server/api/codex_dimmension_reduction_api.run_codex_dim_reduction(inputHash='ICA', subsetHash=False, parms=False, downsampled={"n_components": 2,}, showPlot=False, algorithm='6e6b20fa4100b1b5db41548b5e0ec42d6b6bf465')
/Users/helbling/Workspace/CODEX/server/api/sub/codex_system.get_featureList(featureList=['MgO', 'K2O'])
/Users/helbling/Workspace/CODEX/server/codex_algorithm_manager.algorithm_call(msg=['48bf497857a40d3a9beb0173466aafa804f7b8d1', '75f757bcf34ed89cc8d398ef7fb8776576114078'], result=None)
/Users/helbling/Workspace/CODEX/server/api/codex_dimmension_reduction_api.run_codex_dim_reduction(inputHash='PCA', subsetHash=False, parms=False, downsampled={"n_components": 2,}, showPlot=False, algorithm='6637f2c28fe98a07a14bd1a687fc78c9d26fbe05')
/Users/helbling/Workspace/CODEX/server/api/codex_dimmension_reduction_api.run_codex_dim_reduction(inputHash='ICA', subsetHash=False, parms=False, downsampled={"n_components": 2,}, showPlot=False, algorithm='6637f2c28fe98a07a14bd1a687fc78c9d26fbe05')
