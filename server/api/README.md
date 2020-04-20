


# Client Server API

## Saving a CODEX Session
Client->Server Example JSON
{"routine":"save_session", "session_name":<session name>}

## Loading a CODEX Session
Client->Server Example JSON
{"routine":"load_session", "session_name":<session name>}

Server->Client Example JSON
{"session_name":<session name>, "session_data":{"features":[<feature names for sidebar>],"labels":[<label names for sidebar>],"subsets":[<subset names for sidebar>], "downsample":[<downsample names not currently displayed on front end>]}


## Get List of Saved CODEX Sessions
Client->Server Example JSON
{"routine":"get_sessions"}

Server->Client Example JSON
{"sessions":[<session name1>, <session name2>]}
	Returns list of session names


## Downloading CODEX Code
This routine will download the python code, generated based on your CODEX session.  Returns the base64 ascii utf-8 encoding of the file, which the front-end should then download as a file for the user.

Client->Server Example JSON:<br/>
{'routine': 'download_code', 'cid': 'inhkh'} 

Server->Client Example JSON:<br/>
{"code": "aW1wdfgdfg...l34gerg45JykK", "message": "success", "cid": "inhkh"}


## Dimensionality Reduction API

Client->Server Example JSON:<br/>
{"routine":"algorithm", "algorithmName":name string, "algorithmType":"dimensionality_reduction", 'dataFeatures': [list of feature strings], 'downsampled': False, file': "doctest.csv", 'guidance': None, 'identification': {'id': 'dev0'}, 'parameters': {n_components': 100}, 'dataSelections': [], 'cid': 'wngyu'}

|         algorithmName          | Description  |      parm 1 name     | parm 1 dtype | parm 1 default         |     parm 1 range     |
|--------------------------------|--------------|----------------------|--------------|------------------------|----------------------|
| PCA                            |              | n_components         |     int      |        # features      |     [1, # features]  |
| ICA                            |              | n_components         |     int      |        # features      |     [1, # features]  |


Server->Client Example JSON:<br/>
{'eta': 0.02315640208697078, 'algorithm': 'PCA', 'data': [[-11.115906215282186, -4.235958394220638], [-0.8582352792774531, 7.622008233024563], [11.974141494559637, -3.3860498388039253]], 'explained_variance_ratio': [75, 100], 'inputHash': '34a8c666b260c3968ad2a2010eef03fe4f80e21e', 'subsetHash': False, 'outputHash': 'cc5fa052e0f581733051d57c3a6738d50b46d0d7', 'n_components': 2, 'downsample': 3}

explained_variance: percentage of the data explained by that number of components.  Length will be the same as the n_components field.  These values are the Y axis values on the graph. X axis values are 1->n_components.



## Clustering API

Client->Server Example JSON:<br/>
{"routine":"algorithm", "algorithmName":<name string>, "algorithmType":"clustering", 'dataFeatures': [<list of feature strings>], 'downsampled': False, file': <file name>, 'guidance': None, 'identification': {'id': 'dev0'}, 'parameters': {eps': 0.7}, 'dataSelections': [], 'cid': 'wngyu'}


|     algorithmName       | Description  | parm 1 name  | parm 1 dtype | parm 1 default value | parm 1 range | parm 2 name  | parm 2 dtype | parm 2 default value | parm 2 range |
|-------------------------|--------------|--------------|--------------|----------------------|--------------|--------------|--------------|----------------------|--------------|
|  agglomerative          |              |      k       |     int      |          3           |    [3,10]    |  n_neighbors |     int      |          5           |   [2, 1000]  |
|  dbscan                 |              |     eps      |    float     |          5           |   [2, 1000]  |              |              |                      |              |
|  spectral               |              |      k       |     int      |          3           |    [3,10]    |              |              |                      |              |
|  ward                   |              |      k       |     int      |          3           |    [3,10]    |  n_neighbors |     int      |          5           |   [2, 1000]  |
|  birch                  |              |      k       |     int      |          3           |    [3,10]    |              |              |                      |              |
|  affinity_propagation   |              |    damping   |    float     |         0.5          |   [0.5, 1]   |              |              |                      |              |
|  mean_shift             |              |    quantile  |    float     |         0.3          |    [0, 1]    |              |              |                      |              |
|  kmeans                 |              |      k       |     int      |          3           |    [3,10]    |              |              |                      |              |


## Regression API

Client->Server Example JSON:<br/>
{"routine":"algorithm", "algorithmName":<name string>, "algorithmType":"regression", 'dataFeatures': [list of feature strings], 'downsampled': False, 'cross_val': 5, file': <file name>, 'guidance': None, 'identification': {'id': 'dev0'}, 'scoring':<scoring type>,'search_type':<"random or grid">, 'parameters': {eps': [0.7], 'k':[1,2,3,4,5,5]}, 'dataSelections': [], 'cid': 'wngyu'}

Fields:<br/>
"routine": "algorithm" - always set to algorithm.  Tells the server you're requesting algorithmic data processing.<br/>
"algorithmName": algirithmName from table below<br/>
"algorithmType": "regression" - Specifies we're doing regression.  Separates the algorithmic processing from things like classification or clustering.<br/>
"dataFeatures": [list of feature names]<br/>
"downsampled": Either False for no downsampling, or a percentage between 1 and 100 (int).<br/>
"cross_val": integer >= 1.  Determines how many times you want to cross validate the experiment.<br/>
"file": Path to the file we're processing data from.<br/>
"guidance": None - Always None for regression algorithmic processing.<br/>
"identification": Not sure, set on front end, not used by server currently.<br/>
"dataSelections": List of selection names to apply to processing.<br/>
"cid": Not sure, set on front end, not used by server currently.<br/>
"scoring": The metric for evaluating the equality of the model.  Acceptable keys are: explained_variance, max_error, neg_mean_absolute_error, neg_mean_squared_error, neg_mean_squared_log_error, neg_median_absolute_error, r2<br/>
"search_type": Technique for evaluating the parameter space for each algorithm.  Acceptable keys are: "random" or "grid".<br/>
"parameters": sub dictionary of parameters for the given algorithmName - Defined in the table below.  Only send the ones specified for the given algorithm. Each key should be a list.
																			When a range is given by the user, the front end should extend it out.  For example, if the user specified min=5, max=10 & step=2 for key "apple", the front end should send "apple":[5,7,9]<br/>





|           algorithmName        | Description  |      parm 1 name     | parm 1 dtype | parm 1 default range   |    parm 1 range      |
|--------------------------------|--------------|----------------------|--------------|------------------------|----------------------|
| ARDRegression                  |              | n_iter               |     int      |         300            |    [1, 10000]        |
| AdaBoostRegressor              |              | n_estimators         |     int      |          50            |     [1, 1000]        |
| BaggingRegressor               |              | n_estimators         |     int      |          10            |     [1, 1000]        |
| BayesianRidge                  |              | n_estimators         |     int      |          300           |     [1, 1000]        |
| CCA                            |              | max_iter             |     int      |          500           |     [1, 1000]        |
| DecisionTreeRegressor          |              | max_depth            |     int      |         None           |  None or [1, 1000]   |
| ElasticNet                     |              | max_iter             |     int      |          -1            |    [-1, 10000]       |
| ElasticNetCV                   |              | max_iter             |     int      |          -1            |    [-1, 10000]       |
| ExtraTreeRegressor             |              | max_features         |     int      |       # features       |    [1, # features]   |
| ExtraTreesRegressor            |              | max_features         |     int      |       # features       |    [1, # features]   |
| GaussianProcessRegressor       |              | n_restarts_optimizer |     int      |           0            |        >= 0          |
| GradientBoostingRegressor      |              | max_depth            |     int      |           3            |    None or [1, 1000] |
| HuberRegressor                 |              | max_iter             |     int      |          100           |  [1, 10000]          |
| KNeighborsRegressor            |              | n_neighbors          |     int      |           5            |     [1,1000]         |
| KernelRidge                    |              | degree               |     int      |           3            |      [1,10]          |
| Lars                           |              | eps                  |    float     |           1            |      [0,100]         |
| Lasso                          |              |    alpha             |    float     |           1            |     [0, 100]         |
| LassoLars                      |              | max_iter             |     int      |          100           |  [1, 10000]          |
| LassoLarsIC                    |              | max_iter             |     int      |          100           |  [1, 10000]          |
| LinearRegression               |              | n_jobs               |     int      |           1            |  [-1,8]              |
| LinearSVR                      |              | max_iter             |     int      |          1000          |  [1, 10000]          |
| MLPRegressor                   |              | max_iter             |     int      |          200           |  [1, 10000]          |
| MultiTaskElasticNet            |              | max_iter             |     int      |          200           |  [1, 10000]          |
| MultiTaskLasso                 |              | max_iter             |     int      |          200           |  [1, 10000]          |
| NuSVR                          |              | max_iter             |     int      |           -1           |  [-1, 10000]         |
| OrthogonalMatchingPursuit      |              | n_nonzero_coefs      |     int      |         "None"         |  "None" or > 0       |
| PLSCanonical                   |              | max_iter             |     int      |           500          |  [-1, 10000]         |
| PLSRegression                  |              | max_iter             |     int      |           500          |  [-1, 10000]         |
| PassiveAggressiveRegressor     |              | max_iter             |     int      |           1000         |  [-1, 10000]         |
| RANSACRegressor                |              |                      |              |                        |                      |
| RadiusNeighborsRegressor       |              |                      |              |                        |                      |
| RandomForestRegressor          |              |                      |              |                        |                      |
| Ridge                          |              |                      |              |                        |                      |
| SGDRegressor                   |              |                      |              |                        |                      |
| SVR                            |              |                      |              |                        |                      |
| TheilSenRegressor              |              |                      |              |                        |                      |
| TransformedTargetRegressor     |              |                      |              |                        |                      |



## Explain This API 
"Explain This" is an interactive page for users to provide a binary classification, and see the decision tree which explains how those populations are different.  It's a workflow which summarizes results for novice users.


Client->Server Example JSON:<br/>
{'routine': 'workflow', 'dataSelections': [], 'labelName': 'labels', 'workflow':'explain_this', 'dataFeatures': ['TiO2', 'Al2O3', 'FeOT', 'MgO'], 'file': 'doctest.csv', 'cid': '8ksjk', 'identification': {'id': 'dev0'},}


Server->Client JSON Structure:<br/>
{'file': 'doctest.csv', 'cid': '8ksjk', 'identification': {'id': 'dev0'}, 'y':y_labels, 'data': feature data, 'tree_sweep': list of dictionaries for each tree}


Top Level Keys:<br/>
'WARNING': Logging of any errors in server processing.  None if no errors were encountered.<br>
"identification": Not sure, set on front end, not used by server currently.<br/>
"cid": Not sure, set on front end, not used by server currently.<br/>
'file': File for which the base features originated.<br>
'y': Binary classification labels used in analysis. Not currently needed by the front-end.<br>
'data': Feature data used in classification.  Not currently needed by the front-end.<br>
'tree_sweep': List of dictionaries for each possible tree scenario between 1 feature and the total number of features delivered.  Each dictionary in the list will be used at one place on the slider bar, with the first dictionary being the slider bar all the way to the left and the last dictionary being the slider bar all the way to the right.  Internal dictionary definition for each value in the list defined below.


Tree_Sweep Dictionary Structure & Keys:<br/>
'feature_rank': Sorted rank of all features used in the analysis.  First feature in the list was the most important.
'feature_weights': Rank % scores tied to feature_rank.  First value in the list will be the % relevance for the first feature in feature_rank.  All %s and should add up to 100%.  Might just want to visualize features with weights > 0.
'score': percentage accuracy (0-100) for the given tree.
'max_features': Maximum number of features used in analysis.  This will increase by one for every dictionary in the tree_sweep list. 
'json_tree': Data structure outlining the tree structure for visualization.  Built based on https://planspace.org/20151129-see_sklearn_trees_with_d3/




