import numpy as N
import mlib_datadict as DD

#Parameters for dataset construction
NUM_SAMPLES = int(1e5)

#Read in parent data for zip codes
zipdata = DD.DataDict('zip_codes_states.csv')
