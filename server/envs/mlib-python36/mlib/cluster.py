# -----------------------------------------------------------------
# -----------------------------------------------------------------
#
#  Mandrake lib (mlib) for handy clustering techniques
#
# -----------------------------------------------------------------
# -----------------------------------------------------------------

import mlib.datadict as DD
import numpy as N


# Performs dbscan and returns associated clusters
# eps         "maximum distance between two samples for them to be considered as in the same neighborhood"
# min_samples "number of samples in a neighborhood for a point to be considered a core point"
# algorithm   The nearest neighbor algorithm to use. Can be auto, ball_tree, kd_tree, brute. See sklearn.NearstNeighbors
# leaf_size   parameter for BallTree of cKDTree

def DBSCAN(indata, eps=0.3, min_samples=10, algorithm='auto', leaf_size=30):
    from sklearn.cluster import DBSCAN as dbscan_clustering

    # Handle incoming dictionary
    if isinstance(indata, dict):
        indata = DD.DataDict(indata).as_array()
    # Handle incoming DataDict
    elif isinstance(indata, DD.DataDict):
        indata = indata.as_array()
    # Handle incoming list of arrays
    elif isinstance(indata, list):
        indata = N.array(indata).T

    # Perform clustering
    dbfit = dbscan_clustering(eps=eps, min_samples=min_samples, algorithm=algorithm, leaf_size=leaf_size).fit(indata)
    # Extract mask for core points and cluster labels from object
    mask_corepoints = N.zeros_like(dbfit.labels_, dtype=bool)
    mask_corepoints[dbfit.core_sample_indices_] = True
    cluster_labels = dbfit.labels_

    return cluster_labels, mask_corepoints


def mini_batch_kmeans(indata, number_of_clusters=8, max_no_improvement=10, tol=0.0, batch_size=100,
                      init_size=300, num_init=3, random_state=None, reassignment_ratio=0.01,
                      verbose=False):
    """Performs Mini-Batch K-Means clustering algorithm from sklearn.

    Args:
        indata: 2D array of feature data
        number_of_clusters: Required guess of how many cluster to separate
        max_no_improvement: Early stopping condition (in iterations) for lack of improvement in smoothed intertia
        tol               : Early stopping condition based on movement of center changes. If set to 0.0, won't use this expensive condition.
        batch_size        : Number of points to include in the mini batches
        init_size         : Number of points to randomly sample during initialization; should be at least 3 * batch_size
        num_init          : Number of random initializations that are attempted before selecting and proceeding
        random_state      : Random seed to use or generate if None
        reassignment_ratio: Center reassignment; higher values make easier to re-assign low count centers (longer convergance, better answer)
        verbose           : Specify verbose mode (boolean)

    Returns:
        cluster_labels    : Cluster labels (integer values)
        cluster_centers   : Cluster centers in parent space

    >>> num_obs = 1000
    >>> X1 = N.array((N.linspace(0,1,num_obs)      , N.linspace(20,50,num_obs)**2       , N.linspace(1,0,num_obs)+10      ))
    >>> X2 = N.array((N.linspace(0,1,num_obs) + 100, N.linspace(20,50,num_obs)**2 - 1000, N.linspace(1,0,num_obs)+10+ 1000))
    >>> X = N.hstack((X1,X2)).T
    >>> labels, centers = mini_batch_kmeans(X, number_of_clusters = 2, random_state = 0)
    >>> import collections as C
    >>> C.Counter(labels)
    Counter({0: 1196, 1: 804})
    >>> centers
    array([[   17.86543033,  1260.22999134,   183.51918505],
           [  100.39453186,    58.91961305,  1010.60546814]])

    """

    from sklearn.cluster import MiniBatchKMeans
    mbkm = MiniBatchKMeans(n_clusters=number_of_clusters,
                           max_no_improvement=max_no_improvement,
                           tol=tol,
                           batch_size=batch_size,
                           init_size=init_size,
                           n_init=num_init,
                           random_state=random_state,
                           reassignment_ratio=reassignment_ratio,
                           verbose=verbose)
    mbkm.fit(indata)
    cluster_labels = mbkm.labels_
    cluster_centers = mbkm.cluster_centers_

    return cluster_labels, cluster_centers


if __name__ == "__main__":
    import doctest
    from mlib._doctest import repo_path

    N.set_printoptions(legacy='1.13')
    doctest.testmod()
