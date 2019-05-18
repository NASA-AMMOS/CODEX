


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

Client->Server Example JSON
{'routine': 'download_code', 'cid': 'inhkh'} 

Server->Client Example JSON
{"code": "aW1wdfgdfg...l34gerg45JykK", "message": "success", "cid": "inhkh"}


## Dimensionality Reduction API

Client->Server Example JSON:
{"routine":"algorithm", "algorithmName":<name string>, "algorithmType":"dimensionality_reduction", 'dataFeatures': [<list of feature strings>], 'downsampled': False, file': <file name>, 'guidance': None, 'identification': {'id': 'dev0'}, 'parameters': {n_components': 100}, 'dataSelections': [], 'cid': 'wngyu'}

|         algorithmName          | Description  |      parm 1 name     | parm 1 dtype | parm 1 default         |     parm 1 range     |
|--------------------------------|--------------|----------------------|--------------|------------------------|----------------------|
| PCA                            |              | n_components         |     int      |        # features      |     [1, # features]  |
| ICA                            |              | n_components         |     int      |        # features      |     [1, # features]  |

## Clustering API

Client->Server Example JSON:
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

Client->Server Example JSON:
{"routine":"algorithm", "algorithmName":<name string>, "algorithmType":"classification", 'dataFeatures': [<list of feature strings>], 'downsampled': False, 'cross_val': 5, file': <file name>, 'guidance': None, 'identification': {'id': 'dev0'}, 'scoring':<scoring type>,'search_type':<"random or grid">, 'parameters': {eps': [0.7], 'k':[1,2,3,4,5]}, 'dataSelections': [], 'cid': 'wngyu'}

Fields:<br/>
"routine": "algorithm" - always set to algorithm.  Tells the server you're requesting algorithmic data processing.<br/>
"algorithmName": <algirithmName from table below><br/>
"algorithmType": "classification" - Specifies we're doing classification.  Separates the algorithmic processing from things like regression or clustering.<br/>
"dataFeatures": [<list of feature names>]<br/>
"downsampled": Either False for no downsampling, or a percentage between 1 and 100 (int).<br/>
"cross_val": integer >= 1.  Determines how many times you want to cross validate the experiment.<br/>
"file": Path to the file we're processing data from.<br/>
"guidance": None - Always None for classification algorithmic processing.<br/>
"identification": Not sure, set on front end, not used by server currently.<br/>
"dataSelections": List of selection names to apply to processing.<br/>
"cid": Not sure, set on front end, not used by server currently.<br/>
"scoring": The metric for evaluating the equality of the model.  Acceptable keys are: accuracy, balanced_accuracy, average_precision, brier_score_loss, f1, f1_micro, f1_macro, f1_weighted, f1_samples, neg_log_loss, precision, recall, jaccard, roc_auc<br/>
"search_type": Technique for evaluating the parameter space for each algorithm.  Acceptable keys are: "random" or "grid".<br/>
"parameters": {<sub dictionary of parameters for the given algorithmName>} - Defined in the table below.  Only send the ones specified for the given algorithm. Each key should be a list.
																			When a range is given by the user, the front end should extend it out.  For example, if the user specified min=5, max=10 & step=2 for key "apple", the front end should send "apple":[5,7,9]<br/>




|         algorithmName          | Description  |      parm 1 name     | parm 1 dtype | parm 1 default range   |     parm 1 range     |
|--------------------------------|--------------|----------------------|--------------|------------------------|----------------------|
| AdaBoostClassifier             |              | n_estimators         |     int      |          50            |     [1, 100]         |
| BaggingClassifier              |              | n_estimators         |     int      |          10            |     [1, 100]         |
| BayesianGaussianMixture        |              | n_components         |     int      |           1            |     [1, 100]         |
| BernoulliNB                    |              |    alpha             |    float     |           1            |     [0, 100]         |
| CalibratedClassifierCV         |              |    method            |    string    |       sigmoid          |sigmoid or isotonic   |
| ComplementNB                   |              |    alpha             |    float     |           1            |     [0, 100]         |
| DecisionTreeClassifier         |              |  max_depth           |     int      |         None           |  None or [1, 1000]   |
| ExtraTreesClassifier           |              | n_estimators         |     int      |          10            |     [1, 100]         |
| ExtraTreeClassifier            |              |  max_depth           |     int      |         None           |  None or [1, 1000]   |
| GaussianMixture                |              | n_components         |     int      |           1            |     [1, 100]         |
| GaussianNB                     |              | var_smoothing        |    float     |         1e-09          |     [0, 100]         |
| GaussianProcessClassifier      |              | n_restarts_optimizer |     int      |           0            |     [0, 100]         |
| GradientBoostingClassifier     |              | n_estimators         |     int      |          100           |     [1, 1000]        |
| KNeighborsClassifier           |              | n_neighbors          |     int      |           5            |     [1, 100]         |
| LabelPropagation               |              | n_neighbors          |     int      |           5            |     [1, 100]         |
| LabelSpreading                 |              | n_neighbors          |     int      |           5            |     [1, 100]         |
| LinearDiscriminantAnalysis     |              | n_components         |     int      |           3            | [1, # features -1]   |
| LogisticRegression             |              | max_iter             |     int      |          100           |    [1, 10000]        |
| LogisticRegressionCV           |              | max_iter             |     int      |          100           |    [1, 10000]        |
| MLPClassifier                  |              | max_iter             |     int      |          200           |    [1, 10000]        |
| MultinomialNB                  |              |    alpha             |    float     |           1            |     [0, 100]         |
| NuSVC                          |              | max_iter             |     int      |          -1            |    [-1, 10000]       |
| QuadraticDiscriminantAnalysis  |              | tol                  |    float     |         1.0e-4         |   [1.0e-6, 1.0e-2]   |
| RandomForestClassifier         |              | n_estimators         |     int      |          10            |     [1, 100]         |
| SGDClassifier                  |              |    alpha             |    float     |        0.0001          |     [0, 100]         |
| SVC                            |              | max_iter             |     int      |          -1            |    [-1, 10000]       |


## Regression API

Client->Server Example JSON:
{"routine":"algorithm", "algorithmName":<name string>, "algorithmType":"regression", 'dataFeatures': [<list of feature strings>], 'downsampled': False, 'cross_val': 5, file': <file name>, 'guidance': None, 'identification': {'id': 'dev0'}, 'scoring':<scoring type>,'search_type':<"random or grid">, 'parameters': {eps': [0.7], 'k':[1,2,3,4,5,5]}, 'dataSelections': [], 'cid': 'wngyu'}

Fields:<br/>
"routine": "algorithm" - always set to algorithm.  Tells the server you're requesting algorithmic data processing.<br/>
"algorithmName": <algirithmName from table below><br/>
"algorithmType": "regression" - Specifies we're doing regression.  Separates the algorithmic processing from things like classification or clustering.<br/>
"dataFeatures": [<list of feature names>]<br/>
"downsampled": Either False for no downsampling, or a percentage between 1 and 100 (int).<br/>
"cross_val": integer >= 1.  Determines how many times you want to cross validate the experiment.<br/>
"file": Path to the file we're processing data from.<br/>
"guidance": None - Always None for regression algorithmic processing.<br/>
"identification": Not sure, set on front end, not used by server currently.<br/>
"dataSelections": List of selection names to apply to processing.<br/>
"cid": Not sure, set on front end, not used by server currently.<br/>
"scoring": The metric for evaluating the equality of the model.  Acceptable keys are: explained_variance, max_error, neg_mean_absolute_error, neg_mean_squared_error, neg_mean_squared_log_error, neg_median_absolute_error, r2<br/>
"search_type": Technique for evaluating the parameter space for each algorithm.  Acceptable keys are: "random" or "grid".<br/>
"parameters": {<sub dictionary of parameters for the given algorithmName>} - Defined in the table below.  Only send the ones specified for the given algorithm. Each key should be a list.
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





