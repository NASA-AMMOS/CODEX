# -----------------------------------------------------------------
# -----------------------------------------------------------------
#
#  Mandrake lib (mlib) for handy regression techniques
#
# -----------------------------------------------------------------
# -----------------------------------------------------------------

import numpy as N
import mlib.datadict as DD
import mlib.numeric as NUM


# --------------------
def RANSAC(X, Y,
           base_estimator=None,
           min_samples=None,
           residual_threshold=None,
           max_trials=100,
           stop_n_inliers=N.inf,
           random_state=None):
    """ Performs a RANSAC to identify the largest subset of data with excellent random forest regression.
        Won't work if the sought line is less than 50% of the data or so, depending on noise quality.

    Args:
        X                 : 1 or 2D array containing the independent vectors to train
        Y                 : 1D array containing the dependent values to train
        base_estimator    : May pass another regressor other than linear, default linear
        min_samples       : Minimum number of samples chosen randomly from original data, default num_feats + 1
        residual_threshold: max residual for data sample to be consider inlier. Default = median absolute deviation
        max_trials        : Maximum trials permitted during search
        stop_n_inliers    : Stop when you get at least this many inliers, default no
        random_state      : Used to seed the random state before training, None means use current instantiation

    Returns:
        mask_inliers      : A boolean mask for the points selected as well-behaved inliers
        estimator         : The estimator object itself should predictions or parameters be desired

    Test with a perfect line appended to random data

    >>> N.random.seed(0)
    >>> Y_line  = list(N.linspace(0,1,10))
    >>> Y_noise = list(N.random.random(10))
    >>> Y = N.array(Y_noise + Y_line)
    >>> X = N.arange(len(Y)).T
    >>> X.shape
    (20,)

    >>> Y
    array([ 0.5488135 ,  0.71518937,  0.60276338,  0.54488318,  0.4236548 ,
            0.64589411,  0.43758721,  0.891773  ,  0.96366276,  0.38344152,
            0.        ,  0.11111111,  0.22222222,  0.33333333,  0.44444444,
            0.55555556,  0.66666667,  0.77777778,  0.88888889,  1.        ])

    >>> mask, estimator = RANSAC (X, Y)

    >>> mask
    array([False, False, False, False, False, False, False, False, False,
           False,  True,  True,  True,  True,  True,  True,  True,  True,
            True,  True], dtype=bool)

    """

    if len(X) < 2: raise Exception('Must provide at least 2 samples of data for a lienar fit!')

    # Handle stupid requirement for 1 feature data
    if len(N.shape(X)) < 2: X = N.atleast_2d(X).T

    Y = N.array(Y).squeeze()

    from sklearn.linear_model import RANSACRegressor

    estimator = RANSACRegressor(random_state=random_state,
                                base_estimator=base_estimator,
                                min_samples=min_samples,
                                residual_threshold=residual_threshold,
                                max_trials=max_trials,
                                stop_n_inliers=stop_n_inliers
                                )

    estimator = estimator.fit(X, Y)
    mask = estimator.inlier_mask_

    # import pylab as P
    # P.close('all')
    # P.plot(X,Y,'ro')
    # P.hold(True)
    # P.plot(X[mask],Y[mask],'b+')
    # P.plot(X[mask],Y[mask],'b-')
    # P.savefig('test.png')
    # import sys
    # sys.exit()

    return mask, estimator


# Performs MVLR while enforcing sparsity and potentially forcing coefficients to be positive
# This is an iterative, approximate solution
# x independent variables (samples, feats)
# y variable to regress   (samples,)
# alpha, regularization term, 0 = no regularization (sparsity enforcement), 1.0 = normal, higher is strong enforcement
# fit_intercept will permit a non-zero intercept fitting, useful if data isn't zero-centered beforehand
# normalize will do so to the data before processing
# precompute causes the Gram matrix to be precomputed to speed up calculations
# max_iter, the maximum number of iterations to permit during convergence
# positive, forces coefficients to be positive combinations
# copy_X if true will protect the input X from modification, but take up more memory and go more slowly
# selection, 'random' updates are often much more swift to converge than 'cyclic' updates
# random_state, method of controlling random seed
# return_rms causes the code to predict the training data and measure (return) the RMS (slower)
#
# Returns: coefficients, (rms, y_predict)
def mvlr_lasso(X, Y, alpha=1.0, fit_intercept=True, normalize=False, copy_X=True, precompute=True, max_iter=-1,
               positive=False, selection='random', random_state=None, return_rms=True):
    """ Performs an iterative sparse linear fit. Impractically slow for any decent data size, alas.

    Args:
        X     : A 1 or 2D array containing the independent vectors
        Y     : A 1D array containing the values to regress
        alpha : regularization term, 0 = no regularization (normal MVLR), 1 = sparsity enforcement, higher increases strictness
        fit_intercept: Permit a non-zero intercept, useful if data isn't zero-centered beforehand
        normalize    : Normalize data before fitting
        copy_X       : Make a copy of X to protect against modification, but runs more slowly and takes more memory
        precompute   : Precompute Gram matrix to speed up calculations
        max_iter     : Maximum number of iterations to permit, -1 does not limit
        positive     : Forces coefficients to be positive combinations
        selection    : 'random' updates are much more swift to converge, 'cyclic' is... not?
        random_state : Random seed to use, None means use current state
        return_rms   : Predict the training data and measure training rms (slower)

    Returns:
        coefficients: Linear weights on each independent variable
        rms         : If requested via return_rms, include tuple of rms and y_predict
        y_predict   : See above

    >>> X = N.array([[0,1,2,3,4,5,6,7,8,9],[1,0,1,0,1,0,1,0,1,0],[1,0,0,1,0,0,1,0,0,1]]).astype(N.float64).T

    >>> X.shape
    (10, 3)

    >>> X
    array([[ 0.,  1.,  1.],
           [ 1.,  0.,  0.],
           [ 2.,  1.,  0.],
           [ 3.,  0.,  1.],
           [ 4.,  1.,  0.],
           [ 5.,  0.,  0.],
           [ 6.,  1.,  1.],
           [ 7.,  0.,  0.],
           [ 8.,  1.,  0.],
           [ 9.,  0.,  1.]])

    >>> Y = N.array( 2*X[:,0] + 5*X[:,1] + 10 )
    >>> Y
    array([ 15.,  12.,  19.,  16.,  23.,  20.,  27.,  24.,  31.,  28.])

    No sparsity enforcement

    >>> N.random.seed(0)
    >>> coefficients, intercept, rms, Y_pred = mvlr_lasso(X, Y, alpha = 0.01, fit_intercept = True, copy_X = True, return_rms = True, positive = False)
    >>> coefficients[0]
    1.9974444...
    >>> coefficients[1]
    4.9556657...
    >>> coefficients[2]
    -0.0

    >>> print('{:.10f}'.format(intercept))
    10.0336672510

    >>> print('{:.10f}'.format(rms))
    0.0221045772

    >>> Y_pred
    array([ 14.989333  ,  12.03111167,  18.98422183,  16.0260005 ,
            22.97911067,  20.02088933,  26.9739995 ,  24.01577817,
            30.96888833,  28.010667  ])

    Strong Sparsity enforcement

    >>> N.random.seed(0)
    >>> coefficients, intercept, rms, Y_pred = mvlr_lasso(X, Y, alpha = 2.0, fit_intercept = True, copy_X = True, return_rms = True, positive = False)
    >>> coefficients
    array([ 1.60606061,  0.        ,  0.        ])

    >>> intercept
    14.272727272727273

    >>> rms
    2.5584085962673258

    >>> Y_pred
    array([ 14.27272727,  15.87878788,  17.48484848,  19.09090909,
            20.6969697 ,  22.3030303 ,  23.90909091,  25.51515152,
            27.12121212,  28.72727273])

    """

    Y = N.array(Y).squeeze()

    from sklearn.linear_model import Lasso

    # Ensure train_feature_data is an Ndarray (samples, feats)

    # Handle incoming dictionary
    if isinstance(X, dict):
        X = DD.DataDict(X).as_array()
    # Handle incoming DataDict
    elif isinstance(X, DD.DataDict):
        X = X.as_array()
    # Handle incoming list of arrays
    elif isinstance(X, list):
        X = N.array(X).T

    Y = N.array(Y)

    # Enforce X, Y match dimension
    if X.shape[0] != len(Y):
        raise Exception('Must provide regression target each sample, dimension mismatch between X %s & Y %s' % (
        str(X.shape), str(len(Y))))

    # Perform fit
    regressor = Lasso(alpha=alpha, fit_intercept=fit_intercept, normalize=normalize, copy_X=copy_X,
                      precompute=precompute,
                      max_iter=max_iter, positive=positive, selection=selection, random_state=random_state)

    regressor.fit(X, Y)

    coefficients = regressor.coef_
    intercept = regressor.intercept_

    # How well did we do?
    if return_rms:
        Y_predict = regressor.predict(X)
        rms = NUM.rms(Y_predict - Y)
        return coefficients, intercept, rms, Y_predict
    else:
        return coefficients, intercept


# --------------------
def svr(X, Y, kernel='rbf', C=1e3, gamma=0.2, degree=2):
    """ Performs a support vector regression with chosen kernel.

    Args:
        X     : A 1 or 2D array containing the independent vectors
        Y     : A 1D array containing the values to regress
        kernel: types are 'linear', 'rbf', 'poly'
        C     : hyperparameter used for all fits (should be optimized)
        gamma : hyperparameter only used for RBF kernel
        degree: hyperparameter only used for poly kernel

    Returns:
        Y_pred: The predicted Y values
        rms   : The training rms difference between Y_pred and Y

    >>> X = N.array([[0,1,2,3,4,5,6,7,8,9],[1,0,1,0,1,0,1,0,1,0]]).astype(N.float64).T

    >>> X.shape
    (10, 2)

    >>> X
    array([[ 0.,  1.],
           [ 1.,  0.],
           [ 2.,  1.],
           [ 3.,  0.],
           [ 4.,  1.],
           [ 5.,  0.],
           [ 6.,  1.],
           [ 7.,  0.],
           [ 8.,  1.],
           [ 9.,  0.]])

    >>> Y = N.array( 2*X[:,0] + 5*X[:,1] )
    >>> Y.shape
    (10,)

    >>> Y
    array([  5.,   2.,   9.,   6.,  13.,  10.,  17.,  14.,  21.,  18.])

    Linear Analysis
    >>> Y_pred, rms = svr(X, Y, kernel = 'linear', C = 1e3)
    >>> rms
    0.10000000000000263

    >>> Y_pred
    array([  4.9,   2.1,   8.9,   6.1,  12.9,  10.1,  16.9,  14.1,  20.9,  18.1])

    RBF Analysis
    >>> Y_pred, rms = svr(X, Y, kernel = 'rbf', C = 1e3, gamma = 0.2)
    >>> rms
    0.10021948096551339

    >>> Y_pred
    array([  5.10009082,   2.10005954,   8.89980364,   6.10048976,
            13.10036672,   9.89972879,  16.89957923,  14.10008958,
            20.90019251,  17.89959942])

    """

    Y = N.array(Y).squeeze()

    from sklearn.svm import SVR

    svr_rbf = SVR(kernel=kernel, C=1e2, gamma=0.1)
    Y_pred = svr_rbf.fit(X, Y).predict(X)
    rms = NUM.rms(Y - Y_pred)

    return Y_pred, rms


# --------------------
def random_forest(X, Y, Z=None, num_estimators=10, max_features=None, max_depth=None, min_samples_split=2,
                  min_samples_leaf=1,
                  min_weight_fraction_leaf=0, max_leaf_nodes=None, bootstrap=True, num_jobs=-1,
                  random_state=None, verbose=0):
    """ Performs a random forest regression.

    Args:
        X     : A 1 or 2D array containing the independent vectors to train
        Y     : A 1D array containing the dependent values to train
        Z     : A 1 or 2D array (X) for testing purposes
        num_estimators: Number of trees to include
        max_features  : Maximum features to include at each decision branch (int), or percentage of features (float)
        max_depth     : Maximum depth of each tree
        min_samples_split: Minimum number of samples permitted to create new branch
        min_samples_leaf : Minimum number of samples permitted to be their own leaf
        min_weight_fraction_leaf: ???
        max_leaf_nodes          : Maximum number of nodes permitted
        bootstrap               : Whether bootstrapped samples are used when building trees
        num_jobs                : How many cores to use, -1 = number available cores, otherwise hard coded number
        random_state            : Used to seed the random state before training, None means use current instantiation
        verbose                 : How much tree-building information is exposed

    Returns:
        Y_pred: The predicted Y values
        rms   : The training rms difference between Y_pred and Y
        estimator: The trained regressor
        Z_pred: The predicted Y values given Z (test data, optional)

    >>> X = N.array([[0  ,1  ,2,3,4,5,6,7,8,9],[1,0,1,0,1,0,1,0,1,0]]).astype(N.float64).T
    >>> Z = N.array([[0.1,1.1,2,3,4,5,6,7,8,9],[1,0,1,0,1,0,1,0,1,0]]).astype(N.float64).T
    >>> Y = N.array( 2*X[:,0] + 5*X[:,1] )
    >>> Y
    array([  5.,   2.,   9.,   6.,  13.,  10.,  17.,  14.,  21.,  18.])

    Low Number of estimators

    >>> N.random.seed(0)
    >>> Y_pred, rms_train, regressor, Z_pred = random_forest(X, Y, Z = Z, num_estimators = 10, num_jobs = 1)
    >>> Y_pred
    array([  4.4,   2.6,   6.6,   6.9,  10.9,  11.3,  14.2,  14.3,  18.4,  18.2])

    >>> rms_train
    1.6769019053003671

    >>> Z_pred
    array([  4.4,   3. ,   6.6,   6.9,  10.9,  11.3,  14.2,  14.3,  18.4,  18.2])

    Medium Number of estimators

    >>> N.random.seed(0)
    >>> Y_pred, rms_train, regressor, Z_pred = random_forest(X, Y, Z = Z, num_estimators = 100, num_jobs = 1)
    >>> Y_pred
    array([  4.58,   3.14,   6.91,   7.36,  11.12,  10.99,  15.3 ,  15.14,
            19.14,  18.39])

    >>> rms_train
    1.4145493982183868

    Large Number of estimators

    >>> N.random.seed(0)
    >>> Y_pred, rms_train, regressor, Z_pred = random_forest(X, Y, Z = Z, num_estimators = 10000, num_jobs = 1)
    >>> Y_pred
    array([  4.7832,   3.3767,   7.2536,   7.0426,  11.2295,  11.1233,
            15.2207,  15.1314,  19.0575,  18.1815])

    >>> rms_train
    1.3685002352940974

    Explore the feature importance

    >>> regressor.feature_importances_
    array([ 0.97034626,  0.02965374])

    Percent Variance Explained
    >>> NUM.rsquared(Y, Y_pred)*100
    94.531991550364964

    """

    Y = N.array(Y).squeeze()

    from sklearn.ensemble import RandomForestRegressor
    estimator = RandomForestRegressor(random_state=random_state,
                                      n_estimators=num_estimators,
                                      verbose=verbose,
                                      n_jobs=num_jobs,
                                      bootstrap=bootstrap,
                                      max_leaf_nodes=max_leaf_nodes,
                                      min_weight_fraction_leaf=min_weight_fraction_leaf,
                                      min_samples_leaf=min_samples_leaf,
                                      min_samples_split=min_samples_split,
                                      max_depth=max_depth,
                                      max_features=max_features)

    estimator = estimator.fit(X, Y)
    Y_pred = estimator.predict(X)
    rms = NUM.rms(Y - Y_pred)

    if Z is None:
        return Y_pred, rms, estimator

    Z_pred = estimator.predict(Z)

    return Y_pred, rms, estimator, Z_pred


# X array (samples, features) of training features
# Y array (samples) of training labels
# Z array (samples2, features) of test data for label evaluation
# splitter, "best" selects best split and "random" chooses random split
# max_features, int = consider max_features at each split, float = percentage of features,
#                    "auto"/"sqrt" = sqrt(numfeat) considered, "log2" = log2(numfeat), None = numfeat
# max_depth, maximum depth of the tree.
# presort, may speed up smaller datasets but slow down larger ones
def decision_tree(X, Y, Z=None,
                  max_depth=None, max_features=None, presort=False, random_state=None, splitter='best'):
    Y = N.array(Y).squeeze()

    from sklearn.tree import DecisionTreeRegressor

    DT = DecisionTreeRegressor(max_depth=max_depth,
                               max_features=max_features,
                               presort=presort,
                               random_state=random_state, splitter=splitter)
    DT.fit(X, Y)

    # Make classifier predictions and test accuracy
    Y_pred = DT.predict(X)

    # Grasp the feature importances via the Gini importance
    feat_importance = DT.feature_importances_

    if Z is not None:
        # Make classifier assignments to test data provided, if any
        ZY_pred = DT.predict(Z)
        return DT, Y_pred, feat_importance, ZY_pred
    else:
        # Return classifier and accuracy
        return DT, Y_pred, feat_importance


# Visualizes a trained decision tree to a graphic file on disk. PNG, PDF, etc. are acceptable extensions.
def visualize_decision_tree(decision_tree, filename, feature_names=None,
                            filled=True, rounded=True, special_characters=True):
    from sklearn.tree import export_graphviz
    import mlib.shell as S

    dotfile = filename.split('.')[0] + ".dot"
    ext = filename.split('.')[-1]
    with open(dotfile, 'w') as f:
        export_graphviz(decision_tree, out_file=f, feature_names=feature_names,
                        filled=filled, rounded=rounded, special_characters=special_characters)
    S.exb('dot -T' + ext + ' ' + dotfile + ' -o ' + filename)
    S.rm(dotfile)


# --------------------------------
# --------------------------------
# --------------------------------

if __name__ == "__main__":
    import doctest
    from mlib._doctest import repo_path

    N.set_printoptions(legacy='1.13')
    doctest.testmod(optionflags=doctest.ELLIPSIS)
