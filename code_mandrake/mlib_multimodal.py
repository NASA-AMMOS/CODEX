##------------------------------------------------------------------
##------------------------------------------------------------------
##
## Mandrake lib (mlib) for detecting multimodality in a distribution
##
##------------------------------------------------------------------
##------------------------------------------------------------------

import numpy as N
import mlib_HDF5 as H

DEFAULT_GRIDSIZE = 100    #The resolution of the resampled grid upon which the regressor functions
LOWEST_AMPLITUDE = 1e-10  #The lowest peak amplitude to consider valid

#----------------------------------------
def unimodal_distribution(center = 0.5, width = 0.25, amplitude = 1.0, gridsize = DEFAULT_GRIDSIZE, dist = 'gaussian'):
    """ Fills an array with any of several unimodal peak distributions.

    Args:
        center   : The peak location of the distribution. 0-1 ranges from left to right of the grid. Values beyond 0-1 are acceptable.
        width    : Width of the distribution (sigma for Gaussian, diversity for laplace, width for randompeak. Same units as center.
        amplitude: Peak amplitude of the distribution. Default 1.
        gridsize : The number of samples / elements in the returned array. Default to global library value.
        dist     : The desired distribution (case insensitive). Valid entries:
                   gaussian, randompeak, laplacian, tophat

    Returns:
        retarray : A numpy array containing the Gaussian samples of specified length.

    Standard use case for Gaussian (default)
    >>> ret = unimodal_distribution(0.5, 0.25, gridsize = 20)
    >>> [round(x,2) for x in ret]
    [0.02, 0.04, 0.08, 0.16, 0.26, 0.41, 0.59, 0.77, 0.92, 1.0, 1.0, 0.92, 0.77, 0.59, 0.41, 0.26, 0.16, 0.08, 0.04, 0.02]

    Try new gridsize
    >>> ret = unimodal_distribution(0.5, 0.25, gridsize = 10)
    >>> [round(x,2) for x in ret]
    [0.02, 0.09, 0.31, 0.67, 1.0, 1.0, 0.67, 0.31, 0.09, 0.02]

    Vary amplitude
    >>> ret = unimodal_distribution(0.5, 0.25, amplitude = 0.1, gridsize = 10)
    >>> [round(x,2) for x in ret]
    [0.0, 0.01, 0.03, 0.07, 0.1, 0.1, 0.07, 0.03, 0.01, 0.0]

    Center Gaussian on left
    >>> ret = unimodal_distribution(0, 0.25, gridsize = 10)
    >>> [round(x,2) for x in ret]
    [1.0, 0.82, 0.45, 0.17, 0.04, 0.01, 0.0, 0.0, 0.0, 0.0]

    Center Gaussian on right
    >>> ret = unimodal_distribution(1, 0.25, gridsize = 10)
    >>> [round(x,2) for x in ret]
    [0.0, 0.0, 0.0, 0.0, 0.01, 0.04, 0.17, 0.45, 0.82, 1.0]

    Center Gaussian beyond right edge
    >>> ret = unimodal_distribution(1.5, 0.25, gridsize = 10)
    >>> [round(x,2) for x in ret]
    [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.01, 0.14, 1.0]

    Make Gaussian very wide
    >>> ret = unimodal_distribution(0.5, 1.0, gridsize = 10)
    >>> [round(x,2) for x in ret]
    [0.78, 0.86, 0.93, 0.98, 1.0, 1.0, 0.98, 0.93, 0.86, 0.78]

    Try 0 sigma
    >>> ret = unimodal_distribution(0.5, 0.0, gridsize = 10)
    >>> [round(x,2) for x in ret]
    [0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0]

    Try gridsize 1
    >>> ret = unimodal_distribution(0.5, 1.0, gridsize = 1)
    >>> [round(x,2) for x in ret]
    [1.0]

    Try gridsize <1
    >>> unimodal_distribution(0.5, 1.0, gridsize = 0)
    Traceback (most recent call last):
    Exception: gridsize must be >0

    Standard Laplace distribution
    >>> ret = unimodal_distribution(0.5, 0.25, gridsize = 10, dist = 'Laplace')
    >>> [round(x,2) for x in ret]
    [0.17, 0.26, 0.41, 0.64, 1.0, 1.0, 0.64, 0.41, 0.26, 0.17]

    Tophat distribution
    >>> ret = unimodal_distribution(0.5, 0.02, gridsize = 10, dist = 'tophat')
    >>> [round(x,2) for x in ret]
    [0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0]

    """

    if gridsize < 1: raise Exception('gridsize must be >0')

    #Handle very small width case (less than 1/2 a single bin)
    if width < 1.0/gridsize/2:
        ret = N.zeros(gridsize)
        if (center >= 0) and (center <= 1): ret[int(center*(gridsize-1))] = amplitude
        return ret

    #Handle gridsize 1 case
    if gridsize == 1: return N.array([amplitude,])

    X = N.linspace(0, 1, gridsize)

    retarray = None
    if dist.lower() == "gaussian":
        retarray = amplitude * N.exp( -( (X-center) / width )**2 )
    if dist.lower() == 'laplace':
        retarray = amplitude / width / 2.0 * N.exp( - N.abs(X - center)/width )
    #Must put an inverged V on top of tophat to make sure it gets sensed as a peak
    if dist.lower() == 'tophat':
        left  = max(0         , int( (center - width/2)*gridsize ))
        right = min(gridsize-1, int( (center + width/2)*gridsize ))
        retarray = N.zeros(gridsize)
        retarray[left:right+1] = amplitude

    if retarray is None: raise Exception('Unknown distribution type: %s'%dist)

    return retarray / N.max(retarray) * amplitude

#----------------------------------------
def random_distribution(nummodes = 1, snr = 20, gridsize = DEFAULT_GRIDSIZE):

    """ Generates a guarenteed single peak distribution of nearly any parameters, skewness, etc.

    Args:
        nummodes: Number of distinct modes in the distribution
        snr     : The minimum SNR to ensure when adding noise, as defined by the least perceivable peak included
        gridsize: The size of the array containing the distribution

    Returns:
        retarray: An NDarray containing the distribution.

    Unimodal
    >>> N.random.seed(0)
    >>> ret = random_distribution(gridsize = 20)
    >>> [round(x,2) for x in ret]
    [0.37, 0.54, 0.56, 0.61, 0.77, 0.7, 0.65, 0.72, 0.89, 0.84, 1.0, 0.96, 0.93, 0.75, 0.8, 0.59, 0.67, 0.59, 0.48, 0.44]

    >>> ret = random_distribution(gridsize = 20)
    >>> [round(x,2) for x in ret]
    [0.0, 1.0, 1.0, 1.0, 0.01, 0.0, 0.0, 0.02, 0.02, 0.0, 0.0, 0.0, 0.0, 0.01, 0.0, 0.0, 0.01, 0.0, 0.0, 0.0]

    Unimodal no noise
    >>> N.random.seed(0)
    >>> ret = random_distribution(snr = 0.0, gridsize = 20)
    >>> [round(x,2) for x in ret]
    [0.48, 0.52, 0.56, 0.6, 0.64, 0.69, 0.75, 0.8, 0.86, 0.93, 1.0, 0.99, 0.92, 0.85, 0.79, 0.74, 0.68, 0.64, 0.59, 0.55]

    Bimodal
    >>> N.random.seed(0)
    >>> ret = random_distribution(gridsize = 20, nummodes = 2)
    >>> [round(x,2) for x in ret]
    [0.74, 0.71, 0.58, 0.51, 0.49, 0.47, 0.51, 0.56, 0.62, 0.72, 0.81, 0.92, 0.99, 0.85, 0.74, 0.62, 0.54, 0.45, 0.41, 0.35]

    >>> ret = random_distribution(gridsize = 20, nummodes = 2)
    >>> [round(x,2) for x in ret]
    [0.06, 0.07, 0.03, 0.1, 0.4, 0.94, 0.52, 0.24, 0.2, 0.21, 0.22, 0.3, 0.46, 0.8, 0.96, 0.65, 0.43, 0.3, 0.13, 0.14]

    Trimodal
    >>> N.random.seed(0)
    >>> ret = random_distribution(gridsize = 20, nummodes = 3)
    >>> [round(x,2) for x in ret]
    [0.07, 0.28, 0.71, 0.6, 0.25, 0.07, 0.05, 0.03, 0.09, 0.26, 1.0, 0.83, 0.28, 0.2, 0.21, 0.26, 0.41, 0.51, 0.75, 0.48]

    """

    LOCAL_PEAK_RANGE = 3   #How many bins around a local peak must confirm the local peak as primary (this value to each side)
    MIN_PEAK_HEIGHT  = 0.2 #Relative height of local peaks vs lowest adjacent connected values

    if gridsize < 10        : raise Exception ('Unsafe to specify grids below size 10 for distribution studies')
    if gridsize < nummodes*4: raise Exception ('Unsafe to request nummodes > gridsize / 4')

    #How far in terms of grid cells must multimodal peaks be to ensure they don't just blend together
    # min_center_separation = 4.0 / gridsize

    distributions = ['gaussian', 'laplace', 'tophat']

    #Continue searching for a valid arrangement of modes, ensuring each can indeed be perceived
    not_done = True
    while not_done:

        #Generate a random distribution of centers, widths, amplitudes, and distribution_types

        #Centers vary from 0 to 1 to ensure each mode's peak is within the working window
        centers    = [ N.random.random()                                     for imode in range(nummodes) ]
        widths     = [ N.random.random()                                     for imode in range(nummodes) ]
        amplitudes = [ N.random.random()*(1-MIN_PEAK_HEIGHT)+MIN_PEAK_HEIGHT for imode in range(nummodes) ]
        dist_types = [ distributions[N.random.randint( len(distributions) )] for imode in range(nummodes) ]

        #Tophat need special modification of their width to be relatively narrow, so the peakfinder can agree they are there
        indices_tophat = N.where(["tophat" in x for x in dist_types])[0]
        for index_tophat in indices_tophat: widths[index_tophat] = N.random.random()*4.0/gridsize

        #centers must be at least LOCAL_PEAK_RANGE apart
        if (len(centers) > 1) and ( N.min(N.diff(sorted(centers))) < LOCAL_PEAK_RANGE/float(gridsize) ): continue

        #Assemble the distributions into the aggregate distribution
        retarray   = N.zeros(gridsize)
        for imode in range(nummodes):
            retarray += unimodal_distribution( center    = centers[imode]   , #ranges from 0 to 1 to assure single peak is present
                                               width     = widths [imode]   , #ranges from 0 to 1 to assure the peak is still discernable
                                               dist      = dist_types[imode], #string for choice of distribution type to use
                                               gridsize  = gridsize,
                                               amplitude = amplitudes[imode], #ranges from MIN_PEAK_HEIGHT to 1
            )

        #Reject extremely low amplitude solutions
        maxval = N.max(retarray)
        if maxval < LOWEST_AMPLITUDE: continue
        retarray /= maxval

        #If there was only one mode requested, we're done
        if nummodes == 1:
            not_done = False
            continue

        #Now we must check that each local peak is indeed the highest value in its local range (in the multi-peak case)
        peaks_valid = []
        min_peak_height_above_background = 9e99 #This is used for noise addition later
        for center in centers:
            cindex = int(center * (gridsize-1) + 0.5)
            left  = cindex-1
            right = cindex+1
            while (left  >=          0) and (retarray[left ] < retarray[left +1]): left  -= 1
            while (right <= gridsize-1) and (retarray[right] < retarray[right-1]): right += 1
            valid = True
            if left  >          0:
                valid *= (retarray[cindex] - retarray[left ] > MIN_PEAK_HEIGHT)
                min_peak_height_above_background = min(min_peak_height_above_background, retarray[cindex] - retarray[left ])
            if right < gridsize-1:
                valid *= (retarray[cindex] - retarray[right] > MIN_PEAK_HEIGHT)
                min_peak_height_above_background = min(min_peak_height_above_background, retarray[cindex] - retarray[right])
            peaks_valid.append(valid)

        #If any peaks are not their own local max, try again
        #Note that N.all([]) is True, so the single mode case is also ok here
        if not N.all(peaks_valid): continue

        #All looks good, so let's accept the current answer
        not_done = False

    #Now we must add Gaussian noise to the answer, but never so much as to violate the above conditions
    if snr > 0:
        if nummodes == 1:
            #It's ok to obscure a single peak, because that's still a single mode in the data, so we add more noise here
            noise_amp = N.max(retarray) / snr * N.random.randn()
        else:
            noise_amp = min_peak_height_above_background / snr

        retarray += noise_amp * N.random.randn(gridsize)

    #apply cutoffs to ensure we don't go beyond 0-1 amplitude range
    retarray[retarray > 1] = 1.0
    retarray[retarray < 0] = 0.0

    return retarray

#----------------------------------------
def summary_plots_training_data(path):
    """Debugging routine that generates plots to check generated distributions"""

    import mlib_plot as MP; MP.init()
    import mlib_numeric as NUM
    import mlib_shell as S

    # import warnings
    # warnings.filterwarnings("error", "invalid")

    NUM_DISTRIBUTIONS = 10

    datafiles = S.glob(path+"*.h5")

    for datafile in datafiles:

        print "Plotting",datafile

        dists = H.read_column(datafile, "distribution")
        N.random.seed(0)
        #Filter down to a random sampling of interest
        dists = dists[N.random.choice(range(dists.shape[0]), NUM_DISTRIBUTIONS)]

        #Convert to list of arrays for plotting
        dists = [dists[i,:]+i for i in range(dists.shape[0])]

        MP.scatterplot_multiseries([N.linspace(0,1,len(dists[0])),]*NUM_DISTRIBUTIONS,
                                   dists,
                                   title     = datafile.split('/')[-1].replace('.h5',''),
                                   filename  = datafile.replace('.h5','.png'),
                                   palette   = "gist_rainbow_r",
                                   legend    = False,
                                   dpi       = 200,
                                   limits    = [0, 1, 0, N.max(dists)+0.01],
                                   linewidth = 3,
                                   linealpha = 0.75,
                                   )


#----------------------------------------
def generate_summed_peak_training_data (filename = "training_summedpeak.h5", gridsize = DEFAULT_GRIDSIZE):
    """Generates a comprehensive file of training data exploring summations of many styles of peaks up to nummodes = 4.

    Args:
        filename: An h5 file containing the training distributions and the answer key.

    """

    from mlib_progressbar import bar_nospam

    NUMSAMP = 1000
    MAX_NUMMODE = 4

    for imode in range(1, MAX_NUMMODE+1):

        print "Generating summedpeak %d"%imode

        dists = N.zeros((NUMSAMP*imode, gridsize))

        for isamp in bar_nospam(range(NUMSAMP*imode)):
            dists[isamp,:] = random_distribution(gridsize = gridsize, nummodes = imode)

        print "Writing    summedpeak %d:"%imode,dists.shape[0]
        H.write(filename.replace(".h5","_mode_%d.h5"%imode),
                { 'distribution':                      dists  ,
                  'nummode'     : N.array([imode,]*len(dists))  }
        )

#----------------------------------------
def generate_tophat_training_data (filename = "training_tophat.h5", gridsize = DEFAULT_GRIDSIZE):
    """Generates a comprehensive file of training data exploring combinations of tophat functions only.

    Args:
        filename: An h5 file containing the training distributions and the answer key.

    """

    NUMSAMP = 8
    NUMLESS = 3
    MIN_SNR = 10

    #Start with single mode dists
    dists = []
    for center in N.linspace(0,1,NUMSAMP):
        for width in N.linspace(0,1,NUMSAMP):

            #Make tophat distribution with the requested parameters
            dists.append( unimodal_distribution(center    = center,
                                                width     = width,
                                                amplitude = 1.0,
                                                dist      = 'tophat')
                          )

            #Add noise
            dists[-1] += N.max(dists[-1])/MIN_SNR*N.random.randn(len(dists[-1]))

            #Ensure distribution isn't higher than 1 or less than 0
            dists[-1][ dists[-1] > 1.0 ] = 1.0
            dists[-1][ dists[-1] < 0.0 ] = 0.0

    print "Writing tophat 1:",len(dists)
    H.write(filename.replace(".h5","_mode_%d.h5"%1),
            { 'distribution': N.array(         dists ),
              'nummode'     : N.array([1,]*len(dists))  }
    )

    #Bimodal top hats are tricker... can't let them encompass each other's edges, or you can accidentally make a mode=3 distribution
    dists = []
    for center1 in N.linspace(0, 1, NUMSAMP):
        for center2 in N.linspace(0, 1, NUMSAMP):
            for width1 in N.linspace(0, 0.5, NUMSAMP):
                for width2 in N.linspace(0, 0.5, NUMSAMP):
                    for amp1 in N.linspace(0.5, 1, NUMLESS):
                        for amp2 in (0.25, 0.5):
                            #Ensure these don't overlap at all, the "clean" case
                            #They also can't touch, or it looks like a single mode
                            #We define center1 as always being the left-most dist for convenience
                            if center2 - width2 <= center1 + width1: continue

                            #Make tophat distribution with the requested parameters
                            dist1 = unimodal_distribution(center    = center1,
                                                          width     = width1 ,
                                                          amplitude = amp1   ,
                                                          dist      = 'tophat')

                            #Make tophat distribution with the requested parameters
                            dist2 = unimodal_distribution(center    = center2,
                                                          width     = width2 ,
                                                          amplitude = amp2   ,
                                                          dist      = 'tophat')

                            dists.append(dist1 + dist2)

                            #Re-normalize
                            dists[-1] /= N.max(dists[-1])

                            #Add noise (make sure it's smaller than the delta between amplitudes)
                            dists[-1] += min(amp1,amp2)/MIN_SNR*N.random.randn(len(dists[-1]))

                            #Ensure distribution isn't higher than 1 or less than 0
                            dists[-1][ dists[-1] > 1.0 ] = 1.0
                            dists[-1][ dists[-1] < 0.0 ] = 0.0

    print "Writing tophat 2:",len(dists)
    H.write(filename.replace(".h5","_mode_%d.h5"%2),
            { 'distribution': N.array(         dists ),
              'nummode'     : N.array([2,]*len(dists))  }
    )


    #Assemble bimodal out of purposely overlapping regions 000222211100000
    #                                                         L   J R
    dists = []
    MINWIDTH1 = 10.0/gridsize
    MINWIDTH2 =  5.0/gridsize
    for L in N.linspace(0, 1 - MINWIDTH1, NUMSAMP):
        for R in N.linspace(L + MINWIDTH1, 1, NUMLESS):
            for J in N.linspace(L + MINWIDTH2, R - MINWIDTH2, NUMLESS):
                for amp1 in N.linspace(0.6, 1, NUMLESS):
                    for amp2 in (0.25, amp1*0.8):
                        for sign in (-1,1):

                            #Just manually make these, it's too annoying to put them into center/width
                            Li = int(L*(gridsize-1)+0.5)
                            Ri = int(R*(gridsize-1)+0.5)
                            Ji = int(J*(gridsize-1)+0.5)

                            dist1 = N.zeros(gridsize)
                            dist2 = N.zeros(gridsize)
                            dist1[Li:Ri+1] = amp1
                            dist2[Li:Ji+1] = amp2*sign

                            dists.append(dist1 + dist2)

                            #Re-normalize
                            dists[-1] /= N.max(dists[-1])

                            #Add noise (make sure it's smaller than the delta between amplitudes)
                            dists[-1] += min(amp1,amp2,amp1+sign*amp2)/MIN_SNR*N.random.randn(len(dists[-1]))

                            #Ensure distribution isn't higher than 1 or less than 0
                            dists[-1][ dists[-1] > 1.0 ] = 1.0
                            dists[-1][ dists[-1] < 0.0 ] = 0.0

    print "Writing tophat 2 overlap:",len(dists)
    H.write(filename.replace(".h5","_mode_%d_overlap.h5"%2),
            { 'distribution': N.array(         dists ),
              'nummode'     : N.array([2,]*len(dists))  }
    )


#----------------------------------------
def generate_training_data (path):
    """Generates all training data required for the multimodality detector.

    Args:
        path: The path in which to create the training data and associated summary plots

    """

    import mlib_shell as S

    S.rm   (path)
    S.mkdir(path)

    print "Generating tophat training data"
    generate_tophat_training_data(path + "/training_tophat.h5")

    print "Generating summed peak distribution training data"
    generate_summed_peak_training_data(path + "/training_summedpeak.h5")

    print "Make test plots that confirm distribution behavior"
    summary_plots_training_data  (path)

#--------------------------------
#--------------------------------
#--------------------------------

#Random mixer/generator is fine
#Sweep SNR
#Also make a sweeper that explores all possible versions of each distribution, especially tophat
#Target K = 1, 2, 3, 4

if __name__ == "__main__":

    import doctest
    from mlib_doctest import repo_path
    doctest.testmod()

    # generate_training_data( repo_path() + "/doctest_working/training_multimodality_detector/" )

    print
    print "Done."
