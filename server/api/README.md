


# Client Server API

## Saving a CODEX Session
Client->Server
{"routine":"save_session", "session_name":<session name>}

## Loading a CODEX Session
Client->Server
{"routine":"load_session", "session_name":<session name>}

Server->Client
{"session_name":<session name>, "session_data":{"features":[<feature names for sidebar>],"labels":[<label names for sidebar>],"subsets":[<subset names for sidebar>], "downsample":[<downsample names not currently displayed on front end>]}


## Get List of Saved CODEX Sessions
Client->Server
{"routine":"get_sessions"}

Server->Client
{"sessions":[<session name1>, <session name2>]}
	Returns list of session names




## Clustering API

Example:
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


## Classification API

Example:
{"routine":"algorithm", "algorithmName":<name string>, "algorithmType":"classification", 'dataFeatures': [<list of feature strings>], 'downsampled': False, 'cross_val': 5, file': <file name>, 'guidance': None, 'identification': {'id': 'dev0'}, 'parameters': {eps': [0.7], 'k':[1,2,3,4,5]}, 'dataSelections': [], 'cid': 'wngyu'}

Fields:
"routine": "algorithm" - always set to algorithm.  Tells the server you're requesting algorithmic data processing.
"algorithmName": <algirithmName from table below>
"algorithmType": "classification" - Specifies we're doing classification.  Separates the algorithmic processing from things like regression or clustering.
"dataFeatures": [<list of feature names>]
"downsampled": Either False for no downsampling, or a percentage between 1 and 100 (int).
"cross_val": integer >= 1.  Determines how many times you want to cross validate the experiment.
"file": Path to the file we're processing data from.
"guidance": None - Always None for classification algorithmic processing.
"identification": Not sure, set on front end, not used by server currently.
"dataSelections": List of selection names to apply to processing.
"cid": Not sure, set on front end, not used by server currently.
"parameters": {<sub dictionary of parameters for the given algorithmName>} - Defined in the table below.  Only send the ones specified for the given algorithm. Each key should be a list.
																			When a range is given by the user, the front end should extend it out.  For example, if the user specified min=5, max=10 & step=2 for key "apple", the front end should send "apple":[5,7,9]


|         algorithmName          | Description  |      parm 1 name     | parm 1 dtype | parm 1 default value |     parm 1 range   |
|--------------------------------|--------------|----------------------|--------------|----------------------|--------------------|
| AdaBoostClassifier             |              | n_estimators         |     int      |          50          |     [1, 100]       |
| BaggingClassifier              |              | n_estimators         |     int      |          10          |     [1, 100]       |
| BayesianGaussianMixture        |              | n_components         |     int      |           1          |     [1, 100]       |
| BernoulliNB                    |              |    alpha             |    float     |           1          |     [0, 100]       |
| CalibratedClassifierCV         |              |    method            |    string    |       sigmoid        |sigmoid or isotonic |
| ComplementNB                   |              |    alpha             |    float     |           1          |     [0, 100]       |
| DecisionTreeClassifier         |              |  max_depth           |     int      |         None         |  None or [1, 1000] |
| ExtraTreesClassifier           |              | n_estimators         |     int      |          10          |     [1, 100]       |
| ExtraTreeClassifier            |              |  max_depth           |     int      |         None         |  None or [1, 1000] |
| GaussianMixture                |              | n_components         |     int      |           1          |     [1, 100]       |
| GaussianNB                     |              | var_smoothing        |    float     |         1e-09        |     [0, 100]       |
| GaussianProcessClassifier      |              | n_restarts_optimizer |     int      |           0          |     [0, 100]       |
| GradientBoostingClassifier     |              | n_estimators         |     int      |          100         |     [1, 1000]      |
| KNeighborsClassifier           |              | n_neighbors          |     int      |           5          |     [1, 100]       |
| LabelPropagation               |              | n_neighbors          |     int      |           5          |     [1, 100]       |
| LabelSpreading                 |              | n_neighbors          |     int      |           5          |     [1, 100]       |
| LinearDiscriminantAnalysis     |              | n_components         |     int      |           3          | [1, # features -1] |
| LogisticRegression             |              | max_iter             |     int      |          100         |    [1, 10000]      |
| LogisticRegressionCV           |              | max_iter             |     int      |          100         |    [1, 10000]      |
| MLPClassifier                  |              | max_iter             |     int      |          200         |    [1, 10000]      |
| MultinomialNB                  |              |    alpha             |    float     |           1          |     [0, 100]       |
| NuSVC                          |              | max_iter             |     int      |          -1          |    [-1, 10000]     |
| QuadraticDiscriminantAnalysis  |              | tol                  |    float     |         1.0e-4       |   [1.0e-6, 1.0e-2] |
| RandomForestClassifier         |              | n_estimators         |     int      |          10          |     [1, 100]       |
| SGDClassifier                  |              |    alpha             |    float     |        0.0001        |     [0, 100]       |
| SVC                            |              | max_iter             |     int      |          -1          |    [-1, 10000]     |


## Regression API

Example:
{"routine":"algorithm", "algorithmName":<name string>, "algorithmType":"regression", 'dataFeatures': [<list of feature strings>], 'downsampled': False, 'cross_val': 5, file': <file name>, 'guidance': None, 'identification': {'id': 'dev0'}, 'parameters': {eps': [0.7], 'k':[1,2,3,4,5,5]}, 'dataSelections': [], 'cid': 'wngyu'}

Fields:
"routine": "algorithm" - always set to algorithm.  Tells the server you're requesting algorithmic data processing.
"algorithmName": <algirithmName from table below>
"algorithmType": "regression" - Specifies we're doing regression.  Separates the algorithmic processing from things like classification or clustering.
"dataFeatures": [<list of feature names>]
"downsampled": Either False for no downsampling, or a percentage between 1 and 100 (int).
"cross_val": integer >= 1.  Determines how many times you want to cross validate the experiment.
"file": Path to the file we're processing data from.
"guidance": None - Always None for regression algorithmic processing.
"identification": Not sure, set on front end, not used by server currently.
"dataSelections": List of selection names to apply to processing.
"cid": Not sure, set on front end, not used by server currently.
"parameters": {<sub dictionary of parameters for the given algorithmName>} - Defined in the table below.  Only send the ones specified for the given algorithm. Each key should be a list.
																			When a range is given by the user, the front end should extend it out.  For example, if the user specified min=5, max=10 & step=2 for key "apple", the front end should send "apple":[5,7,9]



|           algorithmName        | Description  |      parm 1 name     | parm 1 dtype | parm 1 default value |    parm 1 range    |
|--------------------------------|--------------|----------------------|--------------|----------------------|--------------------|
| ARDRegression                  |              | n_iter               |     int      |         300          |    [1, 10000]      |
| AdaBoostRegressor              |              | n_estimators         |     int      |          50          |     [1, 1000]      |
| BaggingRegressor               |              | n_estimators         |     int      |          10          |     [1, 1000]      |
| BayesianRidge                  |              | n_estimators         |     int      |          300         |     [1, 1000]      |
| CCA                            |              | max_iter             |     int      |          500         |     [1, 1000]      |
| DecisionTreeRegressor          |              | max_depth            |     int      |         None         |  None or [1, 1000] |
| ElasticNet                     |              | max_iter             |     int      |          -1          |    [-1, 10000]     |
| ElasticNetCV                   |              | max_iter             |     int      |          -1          |    [-1, 10000]     |
| ExtraTreeRegressor             |              | max_features         |     int      |       # features     |    [1, # features] |
| ExtraTreesRegressor            |              | max_features         |     int      |       # features     |    [1, # features] |
| GaussianProcessRegressor       |              | n_restarts_optimizer |     int      |           0          |        >= 0        |
| GradientBoostingRegressor      |              | max_depth            |     int      |           3          |  None or [1, 1000] |
| HuberRegressor                 |              | max_iter             |     int      |          100         |    [1, 10000]      |
| KNeighborsRegressor            |              | n_neighbors          |     int      |           5          |     [1,1000]       |
| KernelRidge                    |              |
| Lars                           |              |
| LarsCV                         |              |
| Lasso                          |              |
| LassoCV                        |              |
| LassoLars                      |              |
| LassoLarsCV                    |              |
| LassoLarsIC                    |              |
| LinearRegression               |              |
| LinearSVR                      |              |
| MLPRegressor                   |              |
| MultiTaskElasticNet            |              |
| MultiTaskElasticNetCV          |              |
| MultiTaskLasso                 |              |
| MultiTaskLassoCV               |              |
| NuSVR                          |              |
| OrthogonalMatchingPursuit      |              |
| OrthogonalMatchingPursuitCV    |              |
| PLSCanonical                   |              |
| PLSRegression                  |              |
| PassiveAggressiveRegressor     |              |
| RANSACRegressor                |              |
| RadiusNeighborsRegressor       |              |
| RandomForestRegressor          |              |
| Ridge                          |              |
| RidgeCV                        |              |
| SGDRegressor                   |              |
| SVR                            |              |
| TheilSenRegressor              |              |
| TransformedTargetRegressor     |              |





