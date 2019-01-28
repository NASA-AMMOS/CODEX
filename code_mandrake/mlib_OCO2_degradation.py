##-----------------------------------------------------------------
##-----------------------------------------------------------------
##
## Mandrake lib (mlib) for reading and processing contamination levels
##
##-----------------------------------------------------------------
##-----------------------------------------------------------------

import numpy as N
import pandas as PA
import mlib_time
import mlib_numeric as NUM
from scipy    import interpolate
from scipy.io import readsav

SOURCE_FILE = "/scratch-science2/validation/mandrake/data/OCO2_degradation_levels/degradation.csv"
LARS_FILE   = "/groups/calibration/cal_reports/RadiometricTrend/save_files/degrad_data.sav"
DECON_CYCLE_DEGRADATION_MIN_JUMP = 0.01
SECONDS_AROUND_JUMP_TO_KEEP = 10*24*60*60.0 #days

#Reads in Lars' up to date degradation file and returns relationship of orbit to degradation
#The correct way to access degradation levels
def read_degradation_lars():

    degrad_data = readsav(LARS_FILE)
    # an array of n orbit numbers
    orbits = degrad_data["melded_orbits"]

    #degrad_data["melded_cal_data"] an array of degradation factors, with shape (3 bands, n orbits, 1016 channels, 8 footprints)
    # gives you the median degradation factor for each orbit in the A-band (what Brendan reports)
    factors = N.median(degrad_data['melded_cal_data'][0], axis=(1, 2))

    #renormalize and re-define degradation to go from 0 (no degradation) to 1 (current highest limit seen of degradation)
    degradation = 1.0 - NUM.normalize(factors, kind = 'scale')

    return NUM.sort_arrays_by_first(orbits, degradation)

#Maps orbit numbers to degradation levels
def orbit_to_degradation_levels(orbits):
    lars_orbit, lars_degradation = read_degradation_lars()

    #Now identify gaps in the orbit record during which the degradation is undefined
    #gaps are identified as having a suddenly lower value of degradation by more than 0.1
    gaps = N.where([(lars_degradation[i+1] - lars_degradation[i]) < -0.1 for i in range(len(lars_degradation)-1)])[0]

    #Initialize return degradation value as nan (unmatched)
    degradation = N.ones(len(orbits))*N.nan

    #Now handle each region between gaps with their own interpolator
    for index_L,index_R in zip([0,]+list(gaps),
                                    list(gaps)+[len(lars_orbit)-1,]):

        #Note that index_L is the last index BEFORE a gap, so you don't want to include it
        #This is true everywhere except where index_L=0 special case
        index_left = index_L+1 if index_L > 0 else index_L

        mask = NUM.inr(orbits, lars_orbit[index_left], lars_orbit[index_R])

        #If no requested data lies in this region, move to next
        if N.sum(mask) == 0: continue

        #build interpolator based on available data
        interpolator = interpolate.interp1d( lars_orbit[index_left:index_R+1], lars_degradation[index_left:index_R+1] )

        #use interpolator to evaluate degradation everywhere applicable
        degradation[mask] = interpolator(orbits[mask])

    # import pylab as P
    # import mlib_plot as MP; MP.init()
    # P.figure()
    # P.plot(orbits,degradation,'or',alpha=0.15, markersize=5)
    # P.hold(True)
    # P.plot(orbits[N.isnan(degradation)], [0.3,]*N.sum(N.isnan(degradation)), '.m',alpha=0.15,markersize=5)
    # P.plot(lars_orbit,lars_degradation,'.b',alpha=0.25,markersize=1)
    # P.plot(lars_orbit[gaps],[0.5,]*len(gaps),'g.')
    # MP.disable_axis_offset()
    # P.savefig('test%02d.png'%(N.random.randint(99)),dpi=150)

    return degradation
