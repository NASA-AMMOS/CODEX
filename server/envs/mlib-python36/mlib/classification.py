# -----------------------------------------------------------------
# -----------------------------------------------------------------
#
#  Mandrake lib (mlib) for handy classification techniques
#
# -----------------------------------------------------------------
# -----------------------------------------------------------------

import numpy as N
import mlib.datadict as DD
import collections as C


# -------------------------
def confusion_matrix(Y_truth, Y_pred):
    """Returns a confusion matrix between expected and predicted Y labels.

    Args:
        Y_truth: An integer array (0-based) on the true classes for each test
        Y_pred : An integer array (0-based) on the classifier's predicted output

    Returns:
        matrix : An NxN confusion matrix

    Try case of perfect prediction (diagonal confusion matrix)
    >>> Y_truth = [1,2,3,4,5,6,7,8,9,1,2,3,4,5,6,7,8,9]
    >>> Y_pred  = Y_truth
    >>> confusion_matrix(Y_truth, Y_pred)
    array([[2, 0, 0, 0, 0, 0, 0, 0, 0],
           [0, 2, 0, 0, 0, 0, 0, 0, 0],
           [0, 0, 2, 0, 0, 0, 0, 0, 0],
           [0, 0, 0, 2, 0, 0, 0, 0, 0],
           [0, 0, 0, 0, 2, 0, 0, 0, 0],
           [0, 0, 0, 0, 0, 2, 0, 0, 0],
           [0, 0, 0, 0, 0, 0, 2, 0, 0],
           [0, 0, 0, 0, 0, 0, 0, 2, 0],
           [0, 0, 0, 0, 0, 0, 0, 0, 2]])

    Try case of off-by-one prediction
    >>> Y_truth = [1,2,3,4,5,6,7,8,9,1,2,3,4,5,6,7,8,9]
    >>> Y_pred  = [2,3,4,5,6,7,8,9,1,2,3,4,5,6,7,8,9,1]
    >>> confusion_matrix(Y_truth, Y_pred)
    array([[0, 2, 0, 0, 0, 0, 0, 0, 0],
           [0, 0, 2, 0, 0, 0, 0, 0, 0],
           [0, 0, 0, 2, 0, 0, 0, 0, 0],
           [0, 0, 0, 0, 2, 0, 0, 0, 0],
           [0, 0, 0, 0, 0, 2, 0, 0, 0],
           [0, 0, 0, 0, 0, 0, 2, 0, 0],
           [0, 0, 0, 0, 0, 0, 0, 2, 0],
           [0, 0, 0, 0, 0, 0, 0, 0, 2],
           [2, 0, 0, 0, 0, 0, 0, 0, 0]])
    """

    from sklearn.metrics import confusion_matrix as sk_conf_matrix

    return sk_conf_matrix(Y_truth, Y_pred)


# -------------------------
def distribution_matrix(Y_truth, Y_pred_raw, bins=None, limits=None, ignore_outliers=False):
    """Forms the floating point, pre-threshold-assigned equivalent of a confusion matrix.
    For each class, shows the distribution of raw classifier/regressor scores of the predicted class.
    Useful for regression problems or raw classifier score analysis.

    Args:
        Y_truth    : An array of the true class assignment, 0-based
        Y_pred_raw : An array of the predicted class, floating point
        bins       : The specific bins (or number of bins) to use in the distribution histograms. Default 10*num_classes
        limits     : The limits on the output distribution histograms. Default: -0.5 to max_class+0.5.
        ignore_outliers: Whether to omit values beyond stated limits or include as side spike. See binned_stat.

    Returns:
        bins       : The central bin values for the histograms
        dist_matrix: A list of lists (numclasses, numbins)

    Try case of perfect prediction (diagonal confusion matrix)
    >>> Y_truth = [0,1,2,3,]*4
    >>> Y_pred  = Y_truth
    >>> bins, dist_matrix = distribution_matrix(Y_truth, Y_pred, bins = 2*5)
    >>> bins
    array([-0.3,  0.1,  0.5,  0.9,  1.3,  1.7,  2.1,  2.5,  2.9,  3.3])
    >>> dist_matrix
    array([[0, 4, 0, 0, 0, 0, 0, 0, 0, 0],
           [0, 0, 0, 4, 0, 0, 0, 0, 0, 0],
           [0, 0, 0, 0, 0, 0, 4, 0, 0, 0],
           [0, 0, 0, 0, 0, 0, 0, 0, 4, 0]])

    Try case of noisy spread around true class values
    >>> N.random.seed(0)
    >>> Y_truth = [0,1,2,3,]*4
    >>> Y_pred  = N.random.random(len(Y_truth)) + Y_truth - 0.5
    >>> bins, dist_matrix = distribution_matrix(Y_truth, Y_pred, bins = 2*5)
    >>> dist_matrix
    array([[0, 3, 1, 0, 0, 0, 0, 0, 0, 0],
           [0, 0, 0, 1, 3, 0, 0, 0, 0, 0],
           [0, 0, 0, 0, 0, 1, 3, 0, 0, 0],
           [0, 0, 0, 0, 0, 0, 0, 1, 2, 1]])
    """

    import mlib.numeric as NUM

    max_class = int(N.max(Y_truth))
    if limits is None: limits = (-0.5, max_class + 0.5)
    if bins is None: bins = 10 * (max_class + 1)

    Y_pred_raw = N.array(Y_pred_raw)

    dist_matrix = []

    # Determine the global bins
    bins, counts = NUM.binned_stat(Y_pred_raw, bins=bins, limits=limits, ignore_outliers=ignore_outliers)

    for i_class in range(max_class + 1):
        mask = N.array(Y_truth) == i_class
        _, counts = NUM.binned_stat(Y_pred_raw[mask], bins=bins, limits=limits, ignore_outliers=ignore_outliers)

        dist_matrix.append(counts)

    return N.array(bins), N.array(dist_matrix).astype(int)


# -------------------------
def balance_set(X, Y):
    """Balances a training set X, Y to ensure all classes in Y are equally represented by super-sampling.
    No randomness, just starts at the top of the list again and keeps adding.

    >>> num_feats = 8
    >>> label_num = [1, 10, 100, 1000]
    >>> X = []
    >>> Y = []
    >>> for i, num in enumerate(label_num):
    ...    X.append(N.zeros((num,num_feats)) + i) #Set all feature data equal to label data for verification
    ...    Y.append([i,]*num)
    >>> X = N.vstack(X)
    >>> Y = N.hstack(Y)

    Check incoming label distribution
    >>> len(Y), C.Counter(Y)
    (1111, Counter({3: 1000, 2: 100, 1: 10, 0: 1}))

    >>> Xb, Yb = balance_set(X,Y)

    Check outgoing label distribution
    >>> len(Yb), C.Counter(Yb)
    (4000, Counter({0: 1000, 1: 1000, 2: 1000, 3: 1000}))

    Check that feature data (set equal to label) corresponds
    >>> verify = []
    >>> for i in range(len(label_num)):
    ...    verify.append( N.all(Xb[Yb == i] == i) )
    >>> N.all(verify)
    True

    """

    count_per_label = C.Counter(Y)

    # wrap in list because Python 3 will return dict_values views instead of a list
    target_number = N.max(list(count_per_label.values()))
    Y = N.array(Y)

    Xb = []
    Yb = []
    for label in count_per_label:

        num_so_far = 0
        mask = Y == label
        num = N.sum(mask)

        while num_so_far < target_number:

            num_to_go = target_number - num_so_far

            if num_to_go >= num:
                Xb.append(X[mask])
                Yb.append(Y[mask])
                num_so_far += num

            else:
                Xb.append(X[mask][:num_to_go])
                Yb.append(Y[mask][:num_to_go])
                num_so_far += num_to_go

    Xb = N.vstack(Xb)
    Yb = N.hstack(Yb)

    return Xb, Yb


# -------------------------
def LDA_train(X, Y, solver='svd', shrinkage=None, priors=None, n_components=None, tol=0.0001):
    """ Trains an LDA classifier from sklearn and returns the classifier. Extremely fast, even with 200k x 39 feats
    Args:
        X           : 2D Narray (numsamps x numfeats) feature data
        Y           : 1D iterable of class labels
        solver      : Solver type to use: 'svd', 'lsqr','eigen'
        shrinkage   : A number 0-1 that varies between empirical covariance matrix (0) and diagonal matrix of individual variances (1).
                      Used for cases when number of samples < number_features, where empirical covariance is unreliable.
                      Ignored for svd, default None, 'auto' uses Ledoit-Wolf lemma, otherwise float between 0-1
        priors      : Prior probability of classes. Narray(num_classes)
        n_components: Number of components (output planes) for dimensionality reduction (< n_classes -1)
                      Typically this is 1 to use direct LDA best-separating plane, but can be used like PCA to return top N separating planes
        store_covariance: Return class covariance matrix
        tol         : Stopping condition, threshold used for rank estimation in SVD solver

    Returns:
        trained_classifier

    # >>> X = [[0, 0], [1, 1]]
    # >>> Y = [0, 1]
    # >>> classifier = LDA_train(X, Y)

    # >>> print(classifier.predict([[0, 0]]))
    # [0]

    # >>> print(classifier.predict([[1, 1]]))
    # [1]

    # >>> print(classifier.predict([[-0.8, -1],[0.8,1]]))
    # [0 1]

    Test 200k example
    >>> numsamp = 200000
    >>> numfeat = 3
    >>> N.random.seed(0)
    >>> X = N.random.random((numsamp, numfeat))
    >>> Y = N.linspace(0,4,numsamp).astype(int)
    >>> classifier = LDA_train(X, Y)
    >>> N.random.seed(0)
    >>> classifier.predict(N.random.random(numfeat).reshape(1, -1))
    array([3])

    Get out the hyperplane definitions
    >>> separating_slopes = classifier.coef_.squeeze()
    >>> separating_means  = classifier.means_

    >>> separating_slopes.shape
    (5, 3)

    >>> separating_slopes
    array([[  2.70440523e-02,  -3.80858158e-02,   2.41489887e-02],
           [ -2.53418850e-02,   2.79816369e-03,   6.21784910e-03],
           [ -7.77643702e-03,   1.32056000e-02,  -3.35055363e-02],
           [  6.01276895e-03,   2.21513897e-02,   3.08449021e-03],
           [  3.08105498e+00,  -3.44472837e+00,   2.71349840e+00]])

    >>> separating_means.shape
    (5, 3)

    >>> separating_means
    array([[ 0.50161415,  0.4972585 ,  0.50199664],
           [ 0.49726039,  0.50065976,  0.50050506],
           [ 0.49872434,  0.50152527,  0.49718801],
           [ 0.49987251,  0.50227821,  0.5002453 ],
           [ 0.75526211,  0.21382493,  0.72614352]])


    Test 200k, binary classification
    >>> numsamp = 200000
    >>> numfeat = 3
    >>> N.random.seed(0)
    >>> X = N.random.random((numsamp, numfeat))
    >>> Y = (N.linspace(0,.9999999,numsamp) + 0.5).astype(int)
    >>> classifier = LDA_train(X, Y)
    >>> N.random.seed(0)
    >>> classifier.predict(N.random.random(numfeat).reshape(1, -1))
    array([1])

    Get out the hyperplane definitions
    >>> separating_slopes     = classifier.coef_.squeeze()
    >>> separating_intercepts = classifier.intercept_

    Get the class means
    >>> class_means  = classifier.means_

    >>> separating_slopes.shape
    (3,)

    >>> separating_slopes
    array([-0.00170067,  0.03528707, -0.03036636])

    >>> separating_intercepts.shape
    (1,)

    >>> separating_intercepts
    array([-0.00162669])

    >>> class_means.shape
    (2, 3)

    >>> class_means
    array([[ 0.49943727,  0.49895913,  0.50125085],
           [ 0.49930098,  0.50189886,  0.49871892]])

    """

    from sklearn.discriminant_analysis import LinearDiscriminantAnalysis

    # Ensure X is an Ndarray (samples, feats)

    # Handle incoming dictionary
    if isinstance(X, dict):
        X = DD.DataDict(X).as_array()
    # Handle incoming DataDict
    elif isinstance(X, DD.DataDict):
        X = X.as_array()
    # Handle incoming list of arrays
    elif isinstance(X, list):
        X = N.array(X).T

    # output: coefs (n_features,) or (n_classes, n_features)
    # output: intercept (n_features,)
    # output: covariance matrix
    # output: explained_variance_ratio (n_components,) The percentage of variance explained by each selected component. Only for eigen solver.
    # output: means (n_classes, n_features)
    # output: priors (n_classes,)
    # output: scalings (rank, n_classes-1), scaling of features in the space spanned by the class centroids
    # output: xbar(n_features,) overall mean
    # output: classes (n_classes) Unique class labels

    # Perform fit to training data
    LDA = LinearDiscriminantAnalysis(solver='svd', shrinkage=None, priors=None, n_components=None,
                                     store_covariance=False, tol=0.0001)

    LDA.fit(X, Y)

    return LDA


# -------------------------
def QDA_train(X, Y, reg_param=0.0, priors=None, store_covariance=False, tol=0.0001):
    """ Trains a quadratic discriminant analysis classifier from sklearn and returns the classifier. Extremely fast, even with 200k x 39 feats
    Args:
        X           : 2D Narray (numsamps x numfeats) feature data
        Y           : 1D iterable of class labels
        reg_param   : Regularization parameter (float, 0-1). Reg term becomes (1-reg_param)*sigma + reg_param*N.eye(n_feat)
        priors      : Prior probability of classes. Narray(num_classes)
        store_covariance: Return class covariance matrix
        tol         : Stopping condition, threshold used for rank estimation in SVD solver

    Returns:
        trained_classifier

    # >>> X = [[0, 0], [1, 1]]
    # >>> Y = [0, 1]
    # >>> classifier = QDA_train(X, Y)

    # >>> print(classifier.predict([[0, 0]]))
    # [0]

    # >>> print(classifier.predict([[1, 1]]))
    # [1]

    # >>> print(classifier.predict([[-0.8, -1],[0.8,1]]))
    # [0 1]

    Test 200k example
    >>> numsamp = 200000
    >>> numfeat = 3
    >>> N.random.seed(0)
    >>> X = N.random.random((numsamp, numfeat))
    >>> Y = N.linspace(0,3.99999,numsamp).astype(int)
    >>> classifier = QDA_train(X, Y)
    >>> N.random.seed(0)
    >>> classifier.predict(N.random.random(numfeat).reshape(1, -1))
    array([3])

    Test 200k, binary classification
    >>> numsamp = 200000
    >>> numfeat = 3
    >>> N.random.seed(0)
    >>> X = N.random.random((numsamp, numfeat))
    >>> Y = (N.linspace(0,.9999999,numsamp) + 0.5).astype(int)
    >>> classifier = QDA_train(X, Y)
    >>> N.random.seed(0)
    >>> classifier.predict(N.random.random(numfeat).reshape(1, -1))
    array([1])

    """

    from sklearn.discriminant_analysis import QuadraticDiscriminantAnalysis

    # Ensure X is an Ndarray (samples, feats)

    # Handle incoming dictionary
    if isinstance(X, dict):
        X = DD.DataDict(X).as_array()
    # Handle incoming DataDict
    elif isinstance(X, DD.DataDict):
        X = X.as_array()
    # Handle incoming list of arrays
    elif isinstance(X, list):
        X = N.array(X).T

    # Perform fit to training data
    QDA = QuadraticDiscriminantAnalysis(reg_param=reg_param, priors=None, store_covariances=False, tol=0.0001)

    QDA.fit(X, Y)

    return QDA

    # See how well the fit did
    # train_predict_class = LDA.predict(X)
    # train_label_accuracy = N.sum(train_predict_class == Y) / float(len(train_predict_class))

    # if test_feature_data is None:

    #     #This is only available when the eigen solver is used
    #     #explained_var        = LDA.explained_variance_ratio_

    #     return train_predict_class, train_label_accuracy, LDA.coef_.squeeze(), LDA.means_

    # else:

    #     predict_class_test = LDA.predict(test_feature_data)

    #     return train_predict_class, test_predict_class, train_label_accuracy, LDA.coef_, LDA.means_


# -------------------------
def decision_tree_train(X, Y, class_weight='balanced', criterion='gini', max_depth=None, max_features=None,
                        max_leaf_nodes=None, min_samples_leaf=1, min_samples_split=2,
                        min_weight_fraction_leaf=0.0, presort=False, random_state=None, splitter='best'):
    """Trains and returns a decision tree classifier from sklearn. Very fast with 200k x 3 feats

    Args:
        X           : 2D Narray (numsamps x numfeats) feature data
        Y           : 1D iterable of class labels

        class_weight: dict {class_label:weight} (apriori expectation of likelihood in output)
                      "balanced" (values of y to inversely adjust weights to input frequency)
                      None (default, assume equal probability)
        criterion   : "gini" for Gini impurity and "entropy" for information gain
        splitter    : "best" selects best split and "random" chooses random split
        max_features: (int) limit number of features to consider at each split, float = percentage of features,
                      "auto"/"sqrt" = sqrt(numfeat) considered, "log2" = log2(numfeat), None = numfeat
        max_depth   : maximum depth of the tree
        min_samples_split: min number of samples that can cause an additional split
        min_samples_leaf : min num of samples required to be a leaf
        min_weight_fraction_leaf: min fraction of numsamp required to be a leaf
        max_leaf_nodes   : overrides max_depth, uses set # of nodes and searches for 'best' by relative reduction in impurity
        presort          : may speed up smaller datasets but slow down larger ones
        random_state     : (int) or default None, the random seed to use

    Returns:
        trained_classifier

    >>> X = [[0, 0], [1, 1]]
    >>> Y = [0, 1]
    >>> classifier = decision_tree_train(X, Y)

    >>> print(classifier.predict([[0, 0]]))
    [0]

    >>> print(classifier.predict([[1, 1]]))
    [1]

    >>> print(classifier.predict([[-0.8, -1],[0.8,1]]))
    [0 1]

    Test 200k example
    >>> numsamp = 200000
    >>> numfeat = 3
    >>> N.random.seed(0)
    >>> X = N.random.random((numsamp, numfeat))
    >>> Y = N.linspace(0,3.99999,numsamp).astype(int)
    >>> classifier = decision_tree_train(X, Y)
    >>> N.random.seed(0)
    >>> classifier.predict(N.random.random(numfeat).reshape(1, -1))
    array([0])

    Test 200k, binary classification
    >>> numsamp = 200000
    >>> numfeat = 3
    >>> N.random.seed(0)
    >>> X = N.random.random((numsamp, numfeat))
    >>> Y = (N.linspace(0,.9999999,numsamp) + 0.5).astype(int)
    >>> classifier = decision_tree_train(X, Y)
    >>> N.random.seed(0)
    >>> classifier.predict(N.random.random(numfeat).reshape(1, -1))
    array([0])
    """

    from sklearn.tree import DecisionTreeClassifier

    DT = DecisionTreeClassifier(class_weight=class_weight, criterion=criterion, max_depth=max_depth,
                                max_features=max_features, max_leaf_nodes=max_leaf_nodes,
                                min_samples_leaf=min_samples_leaf, min_samples_split=min_samples_split,
                                min_weight_fraction_leaf=min_weight_fraction_leaf, presort=presort,
                                random_state=random_state, splitter=splitter)
    DT.fit(X, Y)

    return DT

    # #Make classifier predictions and test accuracy
    # Y_pred = DT.predict(X)
    # accuracy = N.sum(Y_pred == Y) / float(len(Y))
    # #Predict probabilities of each class for input X
    # probs = DT.predict_proba(X)

    # #Grasp the feature importances via the Gini importance
    # feat_importance = DT.feature_importances_

    # if Z is not None:
    #     #Make classifier assignments to test data provided, if any
    #     ZY_pred       = DT.predict(Z)
    #     ZY_pred_probs = DT.predict_proba(Z)
    #     return DT, Y_pred, probs, accuracy, feat_importance, ZY_pred, ZY_pred_probs
    # else:
    #     #Return classifier and accuracy
    #     return DT, Y_pred, probs, accuracy, feat_importance


# Visualizes a trained decision tree to a graphic file on disk. PNG, PDF, etc. are acceptable extensions.
# -------------------------
def visualize_decision_tree(decision_tree, filename, feature_names=None, class_names=None,
                            filled=True, rounded=True, special_characters=True):
    from sklearn.tree import export_graphviz
    import mlib.shell as S

    dotfile = filename.split('.')[0] + ".dot"
    ext = filename.split('.')[-1]
    with open(dotfile, 'w') as f:
        export_graphviz(decision_tree, out_file=f, feature_names=feature_names, class_names=class_names,
                        filled=filled, rounded=rounded, special_characters=special_characters)
    S.exb('dot -T' + ext + ' ' + dotfile + ' -o ' + filename)
    S.rm(dotfile)


# -------------------------
def support_vector_machine_train(X, Y, class_weight='balanced', C=1.0, kernel='linear',
                                 gamma='auto', coef0=0.0, degree=2, probability=False,
                                 shrinking=True, tol=1e-3, verbose=False, max_iter=-1,
                                 random_state=None, cache_size=5000):
    """ Trains a support vector machine (SVM) using the SVC sklearn method. Very slow; 200k x 39 feats too large

    Args:
        X: 2D Narray of feature information
        Y: class labels to learn
        class_weight: (multi-class) Vector of weights to scale the C parameter for each class i, otherwise [1,]*num_classes
                      'balanced' yields [1/class_membership,] for each class to help balance assymetric class labels
        C           : The penalty parameter C for the error term; higher means stricter sensitivity to mismatch
        kernel      : 'linear','poly','rbf','sigmoid','precomputed' or a callable function. Default 'linear'
        gamma       : Kernel coefficient for 'rbf', 'poly', and 'sigmoid'. 'Auto' uses 1/num_features.
        degree      : Polynomial degree to use if kernel type 'poly'
        coef0       : Intercept to use in 'poly' and 'sigmoid' functions
        probability : Boolean, whether to attempt to calculate probability estimates. Significantly slows computation.
        shrinking   : Boolean, whether to use shrinking heuristic. Can speed up convergence in terms of runtime.
        tol         : Tolerance float for convergence monitoring, default 1e-3
        verbose     : Boolean, verbose mode
        max_iter    : How many iterations to permit, default = -1 (no limit)
        random_state: Random number seed to use, or None to generate new
        cache_size  : The cache size (MB) to use for storing frequently requested distances during training. Default 5000.

    >>> X = [[0, 0], [1, 1]]
    >>> Y = [0, 1]
    >>> classifier = support_vector_machine_train(X, Y, C = 1.0, kernel = 'rbf', gamma = 'auto', random_state = 0)

    >>> print(classifier.predict([[0, 0]]))
    [0]

    >>> print(classifier.predict([[1, 1]]))
    [1]

    >>> print(classifier.predict([[-0.8, -1],[0.8,1]]))
    [0 1]

    >>> numsamp = 20000
    >>> numfeat = 3
    >>> N.random.seed(0)
    >>> X = N.random.random((numsamp, numfeat))
    >>> Y = N.linspace(0,10,numsamp).astype(int)
    >>> classifier = support_vector_machine_train(X, Y, C = 1.0, kernel = 'linear', random_state = 0)
    >>> N.random.seed(0)
    >>> classifier.predict(N.random.random(numfeat).reshape(1, -1))
    array([6])

    """

    from sklearn import svm

    classifier = svm.SVC(C=C, kernel=kernel, degree=degree, gamma=gamma, coef0=coef0, shrinking=shrinking,
                         probability=probability, tol=tol, class_weight=class_weight, verbose=verbose,
                         max_iter=max_iter, decision_function_shape='ovr', random_state=random_state,
                         cache_size=cache_size)
    classifier.fit(X, Y)

    return classifier


# -------------------------
def random_forest_train(X, Y, class_weight='balanced', criterion='gini', max_depth=None, max_features=None,
                        max_leaf_nodes=None, min_samples_leaf=1, min_samples_split=2,
                        min_weight_fraction_leaf=0.0, random_state=None, n_estimators=10,
                        bootstrap=True, oob_score=False, n_jobs=1, verbose=0, warm_start=False):
    """Trains and returns a decision tree classifier from sklearn. Very fast with 200k x 3 feats

    Args:
        X           : 2D Narray (numsamps x numfeats) feature data
        Y           : 1D iterable of class labels

        class_weight: dict {class_label:weight} (apriori expectation of likelihood in output)
                      "balanced" (values of y to inversely adjust weights to input frequency)
                      None (default, assume equal probability)
        criterion   : "gini" for Gini impurity and "entropy" for information gain
        max_features: (int) limit number of features to consider at each split, float = percentage of features,
                      "auto"/"sqrt" = sqrt(numfeat) considered, "log2" = log2(numfeat), None = numfeat
        max_depth   : maximum depth of the tree
        min_samples_split: min number of samples that can cause an additional split
        min_samples_leaf : min num of samples required to be a leaf
        min_weight_fraction_leaf: min fraction of numsamp required to be a leaf
        max_leaf_nodes   : overrides max_depth, uses set # of nodes and searches for 'best' by relative reduction in impurity
        random_state     : (int) or default None, the random seed to use
        n_estimators: Number of trees to include in the forest (major parameter)
        bootstrap   : (boolean) Whether bootstrap samples are used when building trees
        oob_score   : Whether to use out-of-bag samples to estimate generalization error
        n_jobs      : How many children to initiate on available cores
        verbose     : (int, default 0) How much verbosity to display
        warm_start  : True = reuse solutio nof previous call to fit and add more estimators to ensemble, otherwise fit new forest (on-line)


    Returns:
        trained_classifier

    >>> X = [[0, 0], [1, 1]]
    >>> Y = [0, 1]
    >>> classifier = random_forest_train(X, Y)

    >>> print(classifier.predict([[0, 0]]))
    [0]

    >>> print(classifier.predict([[1, 1]]))
    [1]

    >>> print(classifier.predict([[-0.8, -1],[0.8,1]]))
    [0 1]

    Test 200k example
    >>> numsamp = 200000
    >>> numfeat = 3
    >>> N.random.seed(0)
    >>> X = N.random.random((numsamp, numfeat))
    >>> Y = N.linspace(0,3.99999,numsamp).astype(int)
    >>> classifier = random_forest_train(X, Y, n_jobs = 15)
    >>> N.random.seed(0)
    >>> classifier.predict(N.random.random(numfeat).reshape(1, -1))
    array([0])

    Test 200k, binary classification
    >>> numsamp = 200000
    >>> numfeat = 3
    >>> N.random.seed(0)
    >>> X = N.random.random((numsamp, numfeat))
    >>> Y = (N.linspace(0,.9999999,numsamp) + 0.5).astype(int)
    >>> classifier = random_forest_train(X, Y, n_jobs = 15)
    >>> N.random.seed(0)
    >>> classifier.predict(N.random.random(numfeat).reshape(1, -1))
    array([0])
    """

    from sklearn.ensemble import RandomForestClassifier

    RF = RandomForestClassifier(class_weight=class_weight, criterion=criterion, max_depth=max_depth,
                                max_features=max_features, max_leaf_nodes=max_leaf_nodes,
                                min_samples_leaf=min_samples_leaf, min_samples_split=min_samples_split,
                                min_weight_fraction_leaf=min_weight_fraction_leaf, random_state=random_state,
                                bootstrap=bootstrap, oob_score=oob_score, n_jobs=n_jobs, verbose=verbose,
                                warm_start=warm_start, n_estimators=n_estimators)
    RF.fit(X, Y)

    return RF


if __name__ == "__main__":
    import doctest
    from mlib._doctest import repo_path

    N.set_printoptions(legacy='1.13')
    doctest.testmod()
