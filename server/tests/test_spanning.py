'''
Author: Jack Lightholder
Date  : 9/27/19

Copyright 2019 California Institute of Technology.  ALL RIGHTS RESERVED.
U.S. Government Sponsorship acknowledged.
'''
import os
import pytest
import sys
import numpy as np

sys.path.insert(1, os.getenv('CODEX_ROOT'))

from api.sub.spanning import *

def test_standardize(capsys):

    result = standardize (N.arange(5))
    #assert np.array_equal(result, np.array([-1.26491106, -0.63245553,  0.,  0.63245553,  1.26491106])) == True

    result = standardize (N.arange(10,5,-1))
    #assert np.array_equal(result, np.array([ 1.26491106,  0.63245553,  0., -0.63245553, -1.26491106])) == True

    result = standardize (N.arange(5)+1)
    #assert np.array_equal(result, np.array([-1.26491106, -0.63245553,  0.,  0.63245553,  1.26491106])) == True

    result = standardize([1,N.nan])
    #assert np.array_equal(result, np.array([ nan,  nan])) == True

    result = standardize([])
    #assert np.array_equal(result, np.array([])) == True

def test_is_iterable(capsys):
    assert is_iterable("hello") == True
    assert is_iterable(2) == False
    assert is_iterable([2,]) == True
    assert(is_not_iterable(2) == (not is_iterable(2)))

def test_is_not_iterable(capsys):

    assert is_not_iterable("hello") == False
    assert is_not_iterable(2) == True
    assert is_not_iterable([2,]) == False
    assert (is_not_iterable([2,]) == (not is_iterable([2,])))

def test_scale(capsys):

    result = scale (N.arange(5))
    #array([ 0.  ,  0.25,  0.5 ,  0.75,  1.  ])

    result = scale (N.arange(10,5,-1))
    #array([ 1.  ,  0.75,  0.5 ,  0.25,  0.  ])

    result = scale (N.arange(5)+1)
    #array([ 0.  ,  0.25,  0.5 ,  0.75,  1.  ])

    result = scale([1,N.nan])
    #array([ nan,  nan])

    result = scale([])
    #[]

def test_serparation_noise(capsys):

    np.random.seed(0)
    result = separating_noise( (1,1,1,2,2,3,4,5,9) )
    #array([ 0.00048814,  0.00215189,  0.00102763,  0.00044883, -0.00076345,  0.00145894, -0.00062413,  0.00391773,  0.00463663])

    np.random.seed(0)
    result = separating_noise( (1,1,1,2,2,3,4,5,9), divisor = 100000 )
    #array([  4.88135039e-07,   2.15189366e-06,   1.02763376e-06,   4.48831830e-07,  -7.63452007e-07,   1.45894113e-06,
    #        -6.24127887e-07,   3.91773001e-06,   4.63662761e-06])

    np.random.seed(0)
    result = separating_noise ( (1,1,1) )
    #array([ 0.0488135 ,  0.21518937,  0.10276338])

    np.random.seed(0)
    result = separating_noise( (1,1,1,2,2,3,4,5,N.nan) )
    #array([ 0.00048814,  0.00215189,  0.00102763,  0.00044883, -0.00076345,  0.00145894, -0.00062413,  0.00391773,  0.00463663])

def test_mask_spanning_subset(capsys):


        np.random.seed(0)
        test = np.arange(10)
        result = mask_spanning_subset([test,test^2,test^3,-test,test^5],4)
        #(array([ True, False, False, False,  True, False, False,  True, False,  True], dtype=bool), array([0, 9, 7, 4]))

        #Asking for first two points equal the first two in the list of 4 above
        result = mask_spanning_subset([test,test^2,test^3,-test,test^5],2)
        #(array([ True, False, False, False, False, False, False, False, False,  True], dtype=bool), array([0, 9]))

        #Ask for no points (or negative), get nothing back
        result =  mask_spanning_subset([test,test^2,test^3,-test,test^5],0)
        #(array([False, False, False, False, False, False, False, False, False, False], dtype=bool), array([], dtype=float64))

        #result = mask_spanning_subset([],2)
        #Traceback (most recent call last):
        #Exception: No features to span!

        #Detailed 1-D test
        vals = N.array([1,1,1,2,2,3,4,4,5,5,5,6,6,7,8,8,9,9,9])
        mask, indxs = mask_spanning_subset([vals,],5)
        #indxs
        #array([ 0, 16,  8,  5, 13])
        #>>> [vals[x] for x in indxs]
        #[1, 9, 5, 3, 7]

        #Detailed 2-D test
        #Make a grid of values with a higher density region
        #Integers represent the number of points to allocate to that x,y coordinate
        vals1 = [[1,1,1,1,1,1,0],
                 [1,2,2,1,1,1,1],
                 [1,2,2,1,1,1,1],
                 [1,1,1,3,1,1,1],
                 [1,1,1,1,1,1,1],
                 [1,1,1,1,1,1,1],
                 [1,1,1,1,1,1,1],]

        #Unwrap into list of points, replicated at points > 1
        valx = []
        valy = []
        for x in range(7):
           for y in range(7):
              for i in range(vals1[x][y]):
                 valx.append(x)
                 valy.append(y)
        valx = np.array(valx)
        valy = np.array(valy)

        #Form spanning solution for 10 points
        mask, indxs = mask_spanning_subset([valx,valy],10)

        #Graphically display chosen points, labeling them by order of choice
        vals2 = N.array(vals1)*0-1
        for i,x,y in zip(range(len(valx)),valx[indxs],valy[indxs]):
            vals2[x,y] = 9e9 if vals2[x,y] >= 0 else i
        #vals2
        #array([[ 0, -1, -1,  6, -1, -1, -1],
        #       [-1, -1, -1, -1, -1,  3, -1],
        #       [-1, -1,  7, -1, -1, -1, -1],
        #       [ 5, -1, -1, -1, -1, -1,  8],
        #       [-1, -1, -1,  4, -1, -1, -1],
        #       [-1, -1, -1, -1, -1, -1, -1],
        #       [ 2, -1,  9, -1, -1, -1,  1]])

        #Detailed 2-D test with sufficient points to cover grid, but better not see doubling up (note corner that isn't populated)
        mask, indxs = mask_spanning_subset([valx,valy],7*7-1)

        #Graphically display chosen points, labeling them by order of choice
        vals2 = N.array(vals1)*0-1
        for i,x,y in zip(range(len(valx)),valx[indxs],valy[indxs]):
            vals2[x,y] = 9e9 if vals2[x,y] >= 0 else i
        #>>> vals2
        #array([[ 0, 23, 16,  6, 15, 24, -1],
        #       [25, 12, 34, 35, 26,  3, 21],
        #       [36, 37,  7, 17, 38, 39, 40],
        #       [ 5, 27, 28, 29, 11, 30,  8],
        #       [31, 13, 18,  4, 32, 14, 33],
        #       [41, 42, 43, 44, 45, 46, 47],
        #       [ 2, 19,  9, 20, 10, 22,  1]])


        #Detailed 3-D test with sufficient points to cover grid many times over, but also linearly increasing time per obs.
        #This emulates spanning lat, lon, time case. We have sufficient data to cover lat,lon many times over, but time is
        #unique and always increasing.
        vals1 = [[10,10,10,10,10,10,10],
                  [10,10,10,10,10,10,10],
                  [10,10,10,10,10,10,10],
                  [10,10,10,10,10,10,10],
                  [10,10,10,10,10,10,10],
                  [10,10,10,10,10,10,10],
                  [10,10,10,10,10,10,10],]

        #Unwrap into list of points, replicated at points > 1
        valx = []
        valy = []
        for x in range(7):
            for y in range(7):
                for i in range(vals1[x][y]):
                    valx.append(x)
                    valy.append(y)
        valx = np.array(valx)
        valy = np.array(valy)

        #Now make ever-increasing time for each obs
        valt = range(len(valx))

        #First cover 2D grid without time to demonstrate spanning functionality
        mask, indxs = mask_spanning_subset([valx,valy],7*7)

        #Graphically display chosen points, labeling them by order of choice
        #9e9 means we overlapped a selection
        #-1  means we didn't select that location
        vals2 = N.array(vals1)*0-1
        for i,x,y in zip(range(len(valx)),valx[indxs],valy[indxs]):
            vals2[x,y] = 9e9 if vals2[x,y] >= 0 else i
        #vals2
        #array([[ 0, 29, 17,  5, 18, 30,  2],
        #       [31, 13, 32, 33, 34, 14, 35],
        #       [19, 36,  9, 20, 10, 21, 37],
        #       [ 6, 38, 22,  4, 23, 39,  7],
        #       [24, 40, 11, 25, 12, 26, 41],
        #       [42, 15, 27, 43, 28, 16, 44],
        #       [ 3, 45, 46,  8, 47, 48,  1]])

        #Now do same thing but including linear time as co-spanning feature
        mask, indxs = mask_spanning_subset([valx,valy,valt],7*7)

        #Graphically display chosen points, labeling them by order of choice
        #9e9 means we overlapped a selection
        #-1  means we didn't select that location
        #NOTE: selection 2 & 3 aren't in the corners, because it gets too close to the similar-time selection in 0!
        #Here, because we are normalizing, the effect of time is less important than x or y alone because of larger t range.
        vals2 = np.array(vals1)*0-1
        for i,x,y in zip(range(len(valx)),valx[indxs],valy[indxs]):
            vals2[x,y] = 9e9 if vals2[x,y] >= 0 else i
        #vals2
        #array([[ 0, 35, 24,  5, 44,  9, 27],
        #       [39, 13, 22, 33, 17, 36,  2],
        #       [ 7, 45, 12, 32, 19, 40, 21],
        #       [28, 14, 43,  4, 42, 15, 29],
        #       [30, 20, 46, 25, 11, 47,  8],
        #       [ 3, 37, 18, 34, 23, 16, 41],
        #       [31, 10, 48,  6, 26, 38,  1]])


        #Now introduce non-uniformity in time to replicate problem observations from QTS sets.
        vals_u = [[ 2, 2, 2, 2, 2, 2, 2],
                  [ 2, 2, 2, 2, 2, 2, 2],
                  [ 2, 2, 2, 2, 2, 2, 2],
                  [ 2, 2, 2, 2, 2, 2, 2],
                  [ 2, 2, 2, 2, 2, 2, 2],
                  [ 2, 2, 2, 2, 2, 2, 2],
                  [ 2, 2, 2, 2, 2, 2, 2],]

        #Unwrap into list of points, replicated at points > 1
        valx = []
        valy = []
        valt = []
        for x in range(7):
           for y in range(7):
              for i in range(vals_u[x][y]):
                 valx.append(x)
                 valy.append(y)
                 valt.append(x+y*7)

        #Copy the above solution every uniform time for three times
        valt = valt + [x+7*7 for x in valt] + [x+2*7*7 for x in valt]
        valx = valx + valx + valx
        valy = valy + valy + valy

        #Add a second popution
        #Add in a narrower region of update in-between the previous time samples
        vals_nu = [[ 0, 0, 0, 0, 0, 0, 0],
                   [ 0, 0, 0, 0, 0, 0, 0],
                   [ 2, 2, 2, 2, 2, 2, 2],
                   [ 2, 2, 2, 2, 2, 2, 2],
                   [ 2, 2, 2, 2, 2, 2, 2],
                   [ 0, 0, 0, 0, 0, 0, 0],
                   [ 0, 0, 0, 0, 0, 0, 0],]

        valx_nu = []
        valy_nu = []
        valt_nu = []
        for x in range(7):
           for y in range(7):
              for i in range(vals_nu[x][y]):
                 valx_nu.append(x)
                 valy_nu.append(y)
                 valt_nu.append(x+y*7)

        nut = []
        nux = []
        nuy = []
        for i in range(10):
           nut += [x/49.0+49+i for x in valt_nu]
           nux += valx_nu
           nuy += valy_nu

        #Add together
        valx += nux
        valy += nuy
        valt += nut

        valx = np.array(valx)
        valy = np.array(valy)
        valt = np.array(valt)

        #First cover 2D grid without time to demonstrate spanning functionality
        mask, indxs = mask_spanning_subset([valx,valy],7*7*2)

        #Graphically display chosen points as a density plot
        vals2 = N.array(vals_nu)*0
        for i,x,y in zip(range(len(valx)),valx[indxs],valy[indxs]):
           vals2[x,y] += 1

        #Sound be a field of density 2 (with random time distribution)
        #vals2
        #array([[2, 2, 2, 2, 2, 2, 2],
        #       [2, 2, 2, 2, 2, 2, 2],
        #       [2, 2, 2, 2, 2, 2, 2],
        #       [2, 2, 2, 2, 2, 2, 2],
        #       [2, 2, 2, 2, 2, 2, 2],
        #       [2, 2, 2, 2, 2, 2, 2],
        #       [2, 2, 2, 2, 2, 2, 2]])

        #Now take time into consideration
        mask, indxs = mask_spanning_subset([valx,valy,valt],7*7*2, separate_values = True)

        #Graphically display chosen points as a density plot
        vals2 = N.array(vals_nu)*0
        for i,x,y in zip(range(len(valx)),valx[indxs],valy[indxs]):
           vals2[x,y] += 1

        #Note that equispacing in lat/lon is no longer possible, and that some density enhancement has occurred in the dense region.
        #vals2
        #array([[3, 1, 2, 2, 3, 0, 3],
        #       [2, 2, 1, 2, 1, 2, 3],
        #       [1, 2, 3, 2, 3, 1, 2],
        #       [2, 3, 2, 2, 2, 2, 3],
        #       [3, 1, 3, 3, 1, 2, 3],
        #       [2, 1, 2, 2, 2, 1, 3],
        #       [2, 2, 1, 2, 2, 1, 2]])







