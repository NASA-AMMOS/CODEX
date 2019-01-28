##-----------------------------------------------------------------
##-----------------------------------------------------------------
##
## lib (mlib) for handling TCCON .nc files, reading TCCON
## results, activity reports, site lists, etc.
##
##-----------------------------------------------------------------
##-----------------------------------------------------------------

import numpy as N
import mlib_numeric as NUM
import collections as C
import mlib_NCEP
import mlib_time
import mlib_latlon as MLL
import warnings
import mlib_shell as S
import mlib_regex as R
import mlib_datadict as DD
import sklearn.externals.joblib as JL
import scipy.spatial as spsp

from mlib_progressbar import bar_nospam
from pprint import pprint as PP

#Hideously, h5py can't handle TCCON netCDF files! They are NETCDF3_CLASSIC format
import netCDF4

DEBUG = False
CONST_TCCON_PATH = "/home/mandrake/oco2_analysis/tccon/"
MAX_HOURS_MATCH_TCCON_OBS = 2 #(INT, HOURS) Maximum window (+- this value) beyond which TCCON match to other data is considered ridiculous
MIN_OBS_IN_ACTIVITY_RANGE = 5 #(INT, NUM)   minimum TCCON soundings within a +- MAX_HOURS_MATCH_TCCON_OBS hour window

BAD_TCCON_SITES = [
#   'eureka'  , #too far north, our answers are not trustworthy and so should not be compared
#   'manaus'  , #considered completely useless?
#   'pasadena', #LA Basin has such a high pollution concentration on such a small scale that matching observations from afar is perilous
#   'edwards' , #Edwards/Dryden/Armstrong, Southern half of data (south of Dryden) corrupted by LA Basin
   #Also of note, Japenese sites can be severely polluted by China with drifting clouds of pollution, hopefully not too bad
   ]
REMOVE_EDWARDS_SOUTH_OF_LAT = 34.687892

#---------------------------------
def load_site_file(path = CONST_TCCON_PATH):
   """ Read in a site file for all TCCON sides availabe. """

   TCCON_sites = {'site': [],
                  'lat' : [],
                  'lon' : [] }

   site_file = S.glob(path + "/tccon_site_list.txt*")[0]

   for line in S.smartopen(site_file):
      if "#" in line: continue
      a = line.strip().split('\t')
      if a[0] == "": continue
      identifier, lat, lon = a
      TCCON_sites['site'].append(identifier)
      TCCON_sites['lat' ].append(float(lat))
      TCCON_sites['lon' ].append(float(lon))

   for key in TCCON_sites: TCCON_sites[key]=N.array(TCCON_sites[key])

   return TCCON_sites

#-------------------------------

def load_activity_file(path):
   """ Read in TCCON activity file. """

   TCCON_activity = {}
   for line in S.smartopen(path+"/tccon_activity.txt.gz"):
      if "#" in line: continue

      site, lat, lon, time_start, time_end = line.strip().split()

      if not site in TCCON_activity:
         TCCON_activity[site] = {
            'active_ranges' :[],
            'lat'           :float(lat),
            'lon'           :float(lon),
            'reject_before' :"",
            'accept_after'  :""
            }

      TCCON_activity[site]['active_ranges'].append((time_start,time_end))

   for site in TCCON_activity:
      TCCON_activity[site]['reject_before'] = min([x[0] for x in TCCON_activity[site]['active_ranges']])
      TCCON_activity[site]['accept_after' ] = max([x[1] for x in TCCON_activity[site]['active_ranges']])

   return TCCON_activity

#-------------------------------
def convert_TCCON_time_to_YYYYMMDDHHMMSS(tccon_time):
    #fractional days since 1970/1/1 00:00:00
    epoch_ncep  = mlib_time.Mtime('19700101000000')
    epoch_J2000 = mlib_time.Mtime('20000101120000')
    return [mlib_time.Mtime(x).to('YYYYMMDDHHMMSS')[:14] for x in tccon_time*60.0*60.0*24.0 + epoch_ncep - epoch_J2000]

#-------------------------------
def read_TCCON_netCDF_data(path, ignore_before = None, ignore_after = None):

    TCCON_data = {'time' :[],
                  'lon'  :[],
                  'lat'  :[],
                  'xco2' :[],
                  'site' :[],
                  'T700' :[],
                  }

    flag_final = []

    for c,filer in enumerate(sorted(S.glob(path+"/*.nc"))):

        print "Loading",filer

        f = netCDF4.Dataset(filer,'r')

        #Gets the attributes for the entire file
        attributes = f.__dict__
        try:
           sitename = attributes['longName']
        except KeyError:
           print "longName attribute not present in",filer,"... skipping"
           continue

        times = convert_TCCON_time_to_YYYYMMDDHHMMSS(f.variables['time'    ][:])
        lons  =                                      f.variables['long_deg'][:]
        lats  =                                      f.variables['lat_deg' ][:]
        xco2  =                                      f.variables['xco2_ppm'][:]
        flag  =                                      f.variables['flag'    ][:]

        prior_date_index  = f.variables['prior_date_index'][:] #per sounding 1D array
        prior_pressure    = f.variables['prior_Pressure'  ][:] #(num_times x (71) levels dimensioned ) in hPa
        prior_temperature = f.variables['prior_Temp'      ][:] #(num_times x (71) levels dimensioned )

        #Figure out which level (mean) corresponds to 700 hPa
        prior_pressure     = N.mean(prior_pressure,axis=0)
        level_700hPa_index = N.argmin(N.abs(prior_pressure - 700))

        #select out the temperatures of interest
        T700 = prior_temperature[prior_date_index, level_700hPa_index]

        sites = (sitename,)*len(lons)

        TCCON_data['time'].extend(times)
        TCCON_data['lon' ].extend(lons .tolist())
        TCCON_data['lat' ].extend(lats .tolist())
        TCCON_data['xco2'].extend(xco2 .tolist())
        TCCON_data['T700'].extend(T700 .tolist())
        TCCON_data['site'].extend(sites)
        flag_final .extend(flag < 1.0 ) #==0.0 means OK sounding

        #Debug only load ten files
        if DEBUG and c > 10: break

    #filter out flag > 0 soundings
    flag_final=N.array(flag_final)

    print "Data Flag: Keeping %d/%d"%(N.sum(flag_final),len(flag_final))

    for key in TCCON_data: TCCON_data[key] = N.array(TCCON_data[key])[flag_final]

    #Apply time filtration if requested
    filter = False
    if ignore_before is not None:
       mask = (TCCON_data['time'] >= ignore_before)
       filter = True

    if ignore_after is not None:
       if not filter: mask = N.ones(len(TCCON_data['lat']),dtype='bool')
       mask = mask * (TCCON_data['time'] <= ignore_after)
       filter = True

    if filter:
       print "Keeping",N.sum(mask),"out of",len(mask),"due to date range specified"
       for key in TCCON_data: TCCON_data[key] = TCCON_data[key][mask]

    #make our own T700 estimate with interpolation from downloaded files, time, lat, and lon
    TCCON_data['T700_mandrake'] = mlib_NCEP.T700_from_J2000_lat_lon(
       mlib_time.sounding_ids_to_J2000(TCCON_data['time']),
       TCCON_data['lat' ],
       TCCON_data['lon' ],
       path = mlib_NCEP.CONST_NCEP_PATH)

    return TCCON_data

#-------------------------------

#Generate TCCON flatfiles, both complete xco2 records and activity reports
def generate_TCCON_flatfiles(path, ignore_before = None, ignore_after = None):

   #Read in the raw TCCON observations
   TCCON_data = read_TCCON_netCDF_data(path, ignore_before = ignore_before, ignore_after = ignore_after)

   print "TCCON observations:",len(TCCON_data['site'])

   #First sort data by sites (and by this, lats/lons)
   #That way, files will be very human-friendly
   neworder = N.lexsort((TCCON_data['time'],TCCON_data['site'])) #sorts first by sites then by times. Note backwards ordering of variables to sort
   for key in TCCON_data: TCCON_data[key] = TCCON_data[key][neworder]

   print "Writing out TCCON site list and activity file"

   #Calculating Activity
   #Activity files are intended to facilitate colocating other data records
   #Summarize TCCON activity into site, location, and times operating resolved to single hours
   #Breaks in operation start a new activity line
   #Each activity period must have at least MIN_OBS_IN_ACTIVITY_RANGE observations contained within

   f=S.smartopen(path+"/tccon_activity.txt.gz","w")
   f.write("#site lat lon start_time end_time\n")

   g=S.smartopen(path+"/tccon_site_list.txt.gz","w")
   g.write("#site lat lon\n")

   for site in N.unique(TCCON_data['site']):

      print "Processing",site,":",

      site_mask = TCCON_data['site'] == site

      #for this site, figure out time range we're talking about and make activity histogram per hour
      active_times_hours_since_J2000 = N.array([mlib_time.Mtime(x)/60.0/60.0 for x in TCCON_data['time'][site_mask]])
      lat = N.mean(TCCON_data['lat'][site_mask])
      lon = N.mean(TCCON_data['lon'][site_mask])
      g.write("%s\t%0.2f\t%0.2f\n"%(site,lat,lon))

      #min_time is the first time we see TCCON data, minus some hours for the maximum TCCON matching range
      min_time                       = N.int(N.min(active_times_hours_since_J2000)) - MAX_HOURS_MATCH_TCCON_OBS

      #convert times into indices into activity grid
      hour_index                     = (active_times_hours_since_J2000 - min_time).astype("int32")
      #calculate the grid of numbers of TCCON observations per hour, plus some zeros on the end for the maximum TCCON matching range

      hourly_numsound_grid           = N.concatenate((N.bincount(hour_index),[0,]*MAX_HOURS_MATCH_TCCON_OBS))
      #calculate the timestring for each bin
      timestring_grid                = [mlib_time.Mtime( (x + min_time)*60.0*60.0 ).to("YYYYMMDDHHMMSS") for x in range(0,len(hourly_numsound_grid)) ]

      #Figure out activity ranges
      activity_grid = (hourly_numsound_grid*0.0).astype('bool')
      for i in range(len(hourly_numsound_grid)):
         if N.sum(hourly_numsound_grid[N.max((                 0,i-MAX_HOURS_MATCH_TCCON_OBS)) :
                                       N.min((len(activity_grid),i+MAX_HOURS_MATCH_TCCON_OBS))]) < MIN_OBS_IN_ACTIVITY_RANGE:
            continue
         activity_grid[i] = True

      #Summarize observed ranges of activity across hourly grid directly into activity file
      active_ranges = NUM.consecutive_boolean_region_ranges(activity_grid)

      #Write ranges out to the activity file
      for ranger in active_ranges:
         f.write("%s %0.2f %0.2f %s %s\n"%(site,lat,lon,timestring_grid[ranger[0]],timestring_grid[ranger[1]]))

      print len(active_ranges),"ranges from",N.sum(site_mask),"soundings"

   f.close()
   g.close()

   print "Activity file complete"

   print "Writing comprehensive TCCON sounding file"

   #Write complete flatfile
   #A record for every TCCON observation
   f=S.smartopen(path+"/tccon_data.txt.gz","w")
   f.write("#Site time lat lon xco2 T_700_hPa_NCEP T_700_hPa_NCEP_mandrake\n")
   for s,t,la,lo,x,T,Tm in zip(TCCON_data['site'],
                               TCCON_data['time'],
                               TCCON_data['lat' ],
                               TCCON_data['lon' ],
                               TCCON_data['xco2'],
                               TCCON_data['T700'],
                               TCCON_data['T700_mandrake']):
      f.write("%s %s %.2f %.2f %.1f %.1f %.1f\n"%(s,t,la,lo,x,T,Tm))
   f.close()

#-------------------------------

def load_flatfile(path = CONST_TCCON_PATH, filter_bad_sites = True):
   """Loads in an existing TCCON flatfile of observations for use. Optionally (default) filter out problem sites."""

   TCCON_data = DD.DataDict(path+"/tccon_data.txt.gz")
   TCCON_data.rename_feature('Site','site')
   TCCON_data.rename_feature('T_700_hPa_NCEP','T700')
   TCCON_data.rename_feature('T_700_hPa_NCEP_mandrake','T700_mandrake')

   if filter_bad_sites:

      #Make a resolved list of bad site names by pattern matching contents of BAD_TCCON_SITES with known site names
      bad_sites = R.matching_elements(BAD_TCCON_SITES, NUM.unique(TCCON_data['site']))
      mask_keep = N.ones_like(TCCON_data['site'], dtype=bool)

      #Scan over the identified bad sites
      for site in bad_sites:

         #Just remove this bad site completely, over all time and space
         mask_keep[TCCON_data['site'] == site] = False

      #Apply the mask to the entire TCCON dataset, removed all problem sites at this point
      TCCON_data.apply_mask(mask_keep)

   #Create J2000 from sounding_ids (foolishly called time)
   TCCON_data['J2000'] = mlib_time.sounding_ids_to_J2000(TCCON_data['time'])

   return TCCON_data

#-----------------------------------------------------
def chunk_colocated_indices(OCO_lon, OCO_lat, OCO_time,
                            TCN_lon, TCN_lat, TCN_time, TCN_sites,
                            max_lon, max_lat, max_time, print_status = False, progressbar = False, force_onechunk = False):
   """ Sorts both OCO-2 and TCCON by time, then finds OCO-2 gaps of greater than 3 hours.
   Chunks both OCO-2 and TCCON by these gaps. This produces two orders of magnitude speed-up in TCCON matching.

   Args:
       OCO_lon  : Longitudes     of all OCO-2 points to match (all OCO arrays must match length)
       OCO_lat  : Latitudes      of all OCO-2 points to match (all OCO arrays must match length)
       OCO_time : Times(seconds) of all OCO-2 points to match (all OCO arrays must match length)
       TCN_lon  : Longitudes     of all TCCON points to match (all TCN arrays must match length)
       TCN_lat  : Latitudes      of all TCCON points to match (all TCN arrays must match length)
       TCN_time : Times(seconds) of all TCCON points to match (all TCN arrays must match length)
       TCN_sites: String names for each point identifying the TCCON site (all TCN arrays must match length)
       max_lon  : Maximum (delta) longitude to co-locate OCO-2 around TCCON
       max_lat  : Maximum (delta) latitude  to co-locate OCO-2 around TCCON
       max_time : Maximum (delta) time(sec) to co-locate OCO-2 around TCCON
       print_status  : Enables verbose printing mode for algorithm tracking
       progressbar   : Prints a status bar showing estimated length of processing
       force_onechunk: Forces the chunking routine to process entire record as a single chunk

   Returns:
       colocated_indices = Indices into the TCN arrays for each OCO sounding that are co-located






   >>> OCO_lon = N.linspace( 0, 10, 10) #From the TCCON station to the right by 10 degrees
   >>> OCO_lat = N.linspace(25, 26, 10) #From the TCCON station and up, all within the latitude box, Northern hemisphere
   >>> OCO_tim = N.array([0,1e6]*5) #make every other sounding be 1e6 seconds away from main group at zero (to force chunking)
   >>> TCN_lon = [0 ,  0] #TCN station at 25/0 lat/lon
   >>> TCN_lat = [25, 25]
   >>> TCN_tim = [0 ,1e6] #TCN station has two comparison points at the precise times of interest
   >>> TCN_sites = ['Test',]*2
   >>> max_lon, max_lat, max_time = 5, 1, 1e5 #make the box smaller in lon and time

   Try chunking solution (should be two chunks)
   >>> try1 = chunk_colocated_indices(OCO_lon, OCO_lat, OCO_tim, TCN_lon, TCN_lat, TCN_tim, TCN_sites, max_lon, max_lat, max_time)

   Try one-chunk solution
   >>> try2 = chunk_colocated_indices(OCO_lon, OCO_lat, OCO_tim, TCN_lon, TCN_lat, TCN_tim, TCN_sites, max_lon, max_lat, max_time, force_onechunk = True)

   >>> try1
   [[0], [1], [0], [1], [0], [], [], [], [], []]
   >>> try2
   [[0], [1], [0], [1], [0], [], [], [], [], []]

   Permute the orders, so the sorting actually does something
   >>> order = NUM.subsample_indices (len(OCO_lon), len(OCO_lon), randomseed = 0)
   >>> "order",order
   ('order', array([3, 5, 1, 2, 9, 8, 0, 6, 7, 4]))

   >>> OCO_lon = OCO_lon[order]
   >>> OCO_lat = OCO_lat[order]
   >>> OCO_tim = OCO_tim[order]

   Try chunking solution (should be two chunks)
   >>> try1 = chunk_colocated_indices(OCO_lon, OCO_lat, OCO_tim, TCN_lon, TCN_lat, TCN_tim, TCN_sites, max_lon, max_lat, max_time)

   Try one-chunk solution
   >>> try2 = chunk_colocated_indices(OCO_lon, OCO_lat, OCO_tim, TCN_lon, TCN_lat, TCN_tim, TCN_sites, max_lon, max_lat, max_time, force_onechunk = True)

   >>> try1
   [[1], [], [1], [0], [], [], [0], [], [], [0]]
   >>> try2
   [[1], [], [1], [0], [], [], [0], [], [], [0]]


   """

   TIME_GAP_TO_SEPARATE_CHUNKS = 60.0*60.0 #Gaps bigger than 1 hour are much larger than any viable TCCON traversal, so chunk

   num_OCO = len(OCO_lon)
   num_TCN = len(TCN_lon)

   if print_status: print "Sorting OCO and TCN arrays"

   #Sort both arrays but retain their original order
   timeorder_OCO = N.lexsort((OCO_time,))
   OCO_lon   = N.array(OCO_lon)  [timeorder_OCO]
   OCO_lat   = N.array(OCO_lat)  [timeorder_OCO]
   OCO_time  = N.array(OCO_time) [timeorder_OCO]

   timeorder_TCN = N.lexsort((TCN_time,))
   TCN_lon   = N.array(TCN_lon)  [timeorder_TCN]
   TCN_lat   = N.array(TCN_lat)  [timeorder_TCN]
   TCN_time  = N.array(TCN_time) [timeorder_TCN]
   TCN_sites = N.array(TCN_sites)[timeorder_TCN]

   if print_status: print "Finding OCO-2 chunks separated by at least %d seconds"%TIME_GAP_TO_SEPARATE_CHUNKS

   #First seek time breaks in OCO_time, as this will define the boundaries of both OCO and TCCON data
   #Note that these are index pairs to be used as (pair[0]:pair[1]) in the standard Python way.
   if force_onechunk:
      chunk_time_ranges_i = ((0, len(OCO_time)),)
   else:
      chunk_time_ranges_i = NUM.list_to_intervals(NUM.find_breaks_in_list(OCO_time, TIME_GAP_TO_SEPARATE_CHUNKS))
   if print_status: print "Number chunks:",len(chunk_time_ranges_i)

   #Master lists to return to user of colocated_indices (not sorted in time)
   coloc_indices = [[],]*num_OCO

   if print_status: print "Processing individual chunks"

   #Scroll through the time ranges to match
   if progressbar:
      lister = bar_nospam(chunk_time_ranges_i)
   else:
      lister = chunk_time_ranges_i

   for chunk_range_i in lister:
      #Find TCCON subset within specified chunk range
      mask_TCN = NUM.inr(TCN_time,
                         OCO_time[chunk_range_i[0]  ] - TIME_GAP_TO_SEPARATE_CHUNKS/2.0,
                         OCO_time[chunk_range_i[1]-1] + TIME_GAP_TO_SEPARATE_CHUNKS/2.0)
      #Find left-most index for TCN pointers... unless there aren't any. Then just fill with filler 0 value.
      TCN_chunk_left_index = N.where(mask_TCN)[0][0] if N.sum(mask_TCN) > 0 else 0

      #OCO-2 chunks have been defined directly
      lf, rg = chunk_range_i

      # if chunk_range_i[0] == 23:
      #    import pdb
      #    pdb.set_trace()

      #Perform colocation on this sub-region
      OCO_vs_TCCON_masked_sorted_indices = colocated_indices(
         OCO_lon[lf:rg], OCO_lat[lf:rg], OCO_time[lf:rg],
         TCN_lon[mask_TCN], TCN_lat[mask_TCN], TCN_time[mask_TCN], TCN_sites[mask_TCN],
         max_lon, max_lat, max_time, print_status=False, progressbar=False)

      #INVESTIGATE THE SOLUTION HERE IN SORTED, MASKED SPACE
      #Delta lon of 10 deg found with tsukuba02... why? Should only be
      # first = True
      # for _ocoi, _ind_tccon in enumerate(OCO_vs_TCCON_masked_sorted_indices):
      #    if len(_ind_tccon) > 20:
      #       if first:
      #          print "\nCo-located OCO data for chunk",chunk_range_i
      #          first = False
      #       print _ocoi+lf, OCO_lon[lf:rg][_ocoi], OCO_lat[lf:rg][_ocoi], TCN_lon[mask_TCN][_ind_tccon][0], TCN_lat[mask_TCN][_ind_tccon][0], C.Counter(TCN_sites[mask_TCN][_ind_tccon])

      #Map the discovered TCCON indices back from TCN chunk mask and unsort it in time
      OCO_vs_TCCON_indices = [ [ timeorder_TCN[ x + TCN_chunk_left_index] for x in TCN_indices_masked ] for TCN_indices_masked in OCO_vs_TCCON_masked_sorted_indices ]

      #Now store these discoveries in the appropriate (unsorted) OCO-2 range and order
      for i in range(len(OCO_vs_TCCON_indices)):
         coloc_indices[timeorder_OCO[i + lf]] = OCO_vs_TCCON_indices[i]

   return coloc_indices

#-----------------------------------------------------
def colocated_indices(OCO_lon, OCO_lat, OCO_time,
                      TCN_lon, TCN_lat, TCN_time, TCN_sites,
                      max_lon = None, max_lat = None, max_time = None, print_status = False, progressbar = False):
    """ Returns a list len(OCO_lon) long containing arrays of colocated indices.
    max lon and lat are combined to produce a rectangular matching region if provided, otherwise Debra's standard
    print_status prints results directly to the screen to track progress.
    TCN_sites is used to sub-filter data geographically based on site-specific information.

    Args:
        OCO_lon : Longitude of OCO-2 points (-180 to 180)
        OCO_lat : Latitude  of OCO-2 points (-90  to  90)
        OCO_time: Time      of OCO-2 points (seconds, must match to TCN time measure)
        TCN_lon : Longitude of TCCON points
        TCN_lat : Latitude  of TCCON points
        TCN_time: Time      of TCCON points (seconds, must match to OCO_time)
        max_lon : if None, will use Debra's coincidence. Otherwise this is +- delta longitude to include
        max_lat : if None, will use Debra's coincidence. Otherwise this is +- delta latitude  to include
        max_time: if None, will use Debra's coincidence. Otherwise this is +- delta time      to include (same units as above times)
        print_status: boolean, whether to print status to screen during operation
        progressbar : boolean, whether to print a status bar to screen during operation

    Debra's coincidence criteria: if lat >  -25, +-2.5 degrees latitude, +- 5  degrees longitude
                                  if lat <= -25, +-10  degrees latitude, +- 60 degrees longitude
                                  time = +- 12 hours (same day)
                                  Special case Caltech: lat_boundary = (33.38, 34.27) lon_boundary = (-118.49, -117.55)
                                  Special case Caltech: lat_boundary = (34.68, 37.46) lon_boundary = (-127.88, -112.88)

    Warning: This is a very slow routine for data sizes >~10k. Chunking is advised before using this algorithm.

    Test time matching (pop2 = pop1 except time is exactly 1 unit higher)
    >>> lon  = N.array(range(6))
    >>> lat  = N.array(range(6))
    >>> time = N.array(range(6))

    >>> lonb  = N.array([0, 2, 4, 5])
    >>> latb  = N.array([0, 2, 4, 5])
    >>> timeb = N.array([0, 2, 4, 5])

    >>> sites = N.array(['site',]*4)

    Everything gets a match because they're identical, but only one each because narrow range
    >>> colocated_indices(lonb, latb, timeb, lonb, latb, timeb, sites, 0.1, 0.1, 0.1)
    [array([0]), array([1]), array([2]), array([3])]

    Everything gets a match because they're identical, but everything for everyone because wide range
    >>> colocated_indices(lonb, latb, timeb, lonb, latb, timeb, sites, 10, 10, 10)
    [array([0, 1, 2, 3]), array([0, 1, 2, 3]), array([0, 1, 2, 3]), array([0, 1, 2, 3])]

    Everybody gets a match, but data lengths now different, narrow range
    >>> colocated_indices(lon, lat, time, lonb, latb, timeb, sites, 2.1, 2.1, 2.1)
    [array([0, 1]), array([0, 1]), array([0, 1, 2]), array([1, 2, 3]), array([1, 2, 3]), array([2, 3])]

    Everybody gets a match, but data lengths now different, wide range
    >>> colocated_indices(lon, lat, time, lonb, latb, timeb, sites, 10, 10, 10)
    [array([0, 1, 2, 3]), array([0, 1, 2, 3]), array([0, 1, 2, 3]), array([0, 1, 2, 3]), array([0, 1, 2, 3]), array([0, 1, 2, 3])]

    >>> timex = timeb + 1.1

    All points in pop 1 will be matched to some in pop2, but not all, as maxtime 2 < range of times = 5
    >>> colocated_indices(lon, lat, time, lonb, latb, timex, sites, 0.9, 0.9, 2)
    [array([0]), array([], dtype=int64), array([1]), array([], dtype=int64), array([2]), array([3])]

    >>> timex = timeb + 2.1

    Even less matched, we've moved past the acceptable time window
    >>> colocated_indices(lon, lat, time, lonb, latb, timex, sites, 0.9, 0.9, 2)
    [array([], dtype=int64), array([], dtype=int64), array([], dtype=int64), array([], dtype=int64), array([], dtype=int64), array([], dtype=int64)]

    Test Spatial matching, make grid of points surrounding 0,0 and ranging from -5 to 5 lat & lon
    >>> lon, lat = N.meshgrid(N.linspace(-5,5,10),N.linspace(-5,5,10))
    >>> lon = lon.reshape(lon.size)
    >>> lat = lat.reshape(lat.size)
    >>> time = N.array([  0,]*len(lon))

    >>> lonb  = N.array([ 0,])
    >>> latb  = N.array([ 0,])
    >>> timeb = N.array([ 0,])

    >>> sites = N.array(['site',])

    Match everything, delta angle 10 >> 5
    >>> indices = colocated_indices(lon, lat, time, lonb, latb, timeb, sites, 10, 10, 1)
    >>> mask = N.zeros(100,dtype=int)
    >>> mask[N.array([len(x) > 0 for x in indices])] = 1
    >>> mask.reshape((10,10))
    array([[1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
           [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
           [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
           [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
           [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
           [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
           [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
           [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
           [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
           [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]])

    Match nothing, delta angle 0.10 << 5
    >>> indices = colocated_indices(lon, lat, time, lonb, latb, timeb, sites, 0.10, 0.10, 1)
    >>> mask = N.zeros(100,dtype=int)
    >>> mask[N.array([len(x) > 0 for x in indices])] = 1
    >>> mask.reshape((10,10))
    array([[0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
           [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
           [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
           [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
           [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
           [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
           [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
           [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
           [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
           [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]])

    Match inner circle, radius 3 < 5
    >>> indices = colocated_indices(lon, lat, time, lonb, latb, timeb, sites, 3, 3, 1)
    >>> mask = N.zeros(100,dtype=int)
    >>> mask[N.array([len(x) > 0 for x in indices])] = 1
    >>> mask.reshape((10,10))
    array([[0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
           [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
           [0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
           [0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
           [0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
           [0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
           [0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
           [0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
           [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
           [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]])

    Match rectangle stretching in longitude
    >>> indices = colocated_indices(lon, lat, time, lonb, latb, timeb, sites, 6, 3, 1)
    >>> mask = N.zeros(100,dtype=int)
    >>> mask[N.array([len(x) > 0 for x in indices])] = 1
    >>> mask.reshape((10,10))
    array([[0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
           [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
           [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
           [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
           [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
           [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
           [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
           [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
           [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
           [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]])

    Match rectangle stretching in latitude
    >>> indices = colocated_indices(lon, lat, time, lonb, latb, timeb, sites, 3, 6, 1)
    >>> mask = N.zeros(100,dtype=int)
    >>> mask[N.array([len(x) > 0 for x in indices])] = 1
    >>> mask.reshape((10,10))
    array([[0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
           [0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
           [0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
           [0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
           [0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
           [0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
           [0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
           [0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
           [0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
           [0, 0, 1, 1, 1, 1, 1, 1, 0, 0]])

    Test edwards case
    >>> TCCONLON = -117.881069
    >>> TCCONLAT = 34.959917
    >>> lon, lat = N.meshgrid( N.linspace(-10, 10, 10) + TCCONLON, N.linspace(-3, 3, 10) + TCCONLAT )
    >>> lon      = lon.reshape(lon.size)
    >>> lat      = lat.reshape(lat.size)
    >>> time     = N.array([ 0,]*len(lon))
    >>> lonb     = N.array([ TCCONLON,])
    >>> latb     = N.array([ TCCONLAT,])
    >>> timeb    = N.array([ 0,])
    >>> sites    = N.array(['edwards',])

    >>> indices = colocated_indices(lon, lat, time, lonb, latb, timeb, sites)
    >>> mask = N.zeros(100,dtype=int)
    >>> checkmask = N.array([len(x) > 0 for x in indices])
    >>> mask[checkmask] = 1
    >>> mask.reshape((10,10))
    array([[0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
           [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
           [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
           [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
           [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
           [0, 0, 0, 1, 1, 1, 1, 0, 0, 0],
           [0, 0, 0, 1, 1, 1, 1, 0, 0, 0],
           [0, 0, 0, 1, 1, 1, 1, 0, 0, 0],
           [0, 0, 0, 1, 1, 1, 1, 0, 0, 0],
           [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]])
    >>> N.min(lon[checkmask]), N.max(lon[checkmask])
    (-121.21440233333333, -114.54773566666667)
    >>> N.min(lat[checkmask]), N.max(lat[checkmask])
    (35.293250333333333, 37.293250333333333)
    >>> N.linspace(-10 + TCCONLON, 10 + TCCONLON, 10)
    array([-127.881069  , -125.65884678, -123.43662456, -121.21440233,
           -118.99218011, -116.76995789, -114.54773567, -112.32551344,
           -110.10329122, -107.881069  ])
    >>> N.linspace(-3  + TCCONLAT, 3  + TCCONLAT, 10)
    array([ 31.959917  ,  32.62658367,  33.29325033,  33.959917  ,
            34.62658367,  35.29325033,  35.959917  ,  36.62658367,
            37.29325033,  37.959917  ])

    Test double empty case
    >>> colocated_indices([], [], [], [], [], [], sites, 9,9,9)
    []

    Test empty OCO case
    >>> colocated_indices([], [], [], lonb, latb, timeb, sites, 9,9,9)
    []

    Test empty TCCON case
    >>> colocated_indices(lonb, latb, timeb, [],[],[], sites, 9,9,9)
    [array([], dtype=int64)]

    Test Realistic Northern Hemisphere case ignoring time and using default coincidence criteria
    >>> MIN_LON, MAX_LON = (-10, 10)
    >>> MIN_LAT, MAX_LAT = ( 0,  10)
    >>> NUMRES = 20
    >>> lon, lat = N.meshgrid(N.linspace(MIN_LON,MAX_LON,NUMRES),N.linspace(MIN_LAT,MAX_LAT,NUMRES))
    >>> lon = lon.reshape(lon.size)
    >>> lat = lat.reshape(lat.size)
    >>> time = N.array([  0,]*len(lon))

    >>> lonb  = N.array([ (MIN_LON+MAX_LON)/2.0,])
    >>> latb  = N.array([ (MIN_LAT+MAX_LAT)/2.0,])
    >>> timeb = N.array([ 0.0 ,])

    >>> sites = N.array(['realisticNH',])

    >>> indices = colocated_indices(lon, lat, time, lonb, latb, timeb, sites)
    >>> mask = N.zeros(NUMRES*NUMRES, dtype=int)
    >>> mask[N.array([len(x) > 0 for x in indices])] = 1
    >>> mask.reshape((NUMRES,NUMRES))
    array([[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
           [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
           [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
           [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
           [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
           [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
           [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
           [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
           [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
           [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
           [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
           [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
           [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
           [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
           [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
           [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
           [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
           [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
           [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
           [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]])

    Test Realistic Southern Hemisphere case ignoring time and using default coincidence criteria
    >>> MIN_LON, MAX_LON = ( -70   , 70   )
    >>> MIN_LAT, MAX_LAT = ( -15-60, 15-60)
    >>> NUMRES = 20
    >>> lon, lat = N.meshgrid(N.linspace(MIN_LON,MAX_LON,NUMRES),N.linspace(MIN_LAT,MAX_LAT,NUMRES))
    >>> lon = lon.reshape(lon.size)
    >>> lat = lat.reshape(lat.size)
    >>> time = N.array([  0,]*len(lon))

    >>> lonb  = N.array([ (MIN_LON+MAX_LON)/2.0,])
    >>> latb  = N.array([ (MIN_LAT+MAX_LAT)/2.0,])
    >>> timeb = N.array([ 0.0 ,])

    >>> sites = N.array(['realisticSH',])

    >>> indices = colocated_indices(lon, lat, time, lonb, latb, timeb, sites)
    >>> mask = N.zeros(NUMRES*NUMRES, dtype=int)
    >>> mask[N.array([len(x) > 0 for x in indices])] = 1
    >>> mask.reshape((NUMRES,NUMRES))
    array([[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
           [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
           [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
           [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
           [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
           [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
           [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
           [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
           [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
           [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
           [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
           [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
           [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
           [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
           [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
           [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
           [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
           [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
           [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
           [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]])

    Test Realistic Southern Hemisphere case ignoring time and using default coincidence criteria, PLUS wrapping longitude handling and ultra-low latitude
    >>> MIN_LON, MAX_LON = ( -70 + 180, -180 + 70 )
    >>> MIN_LAT, MAX_LAT = ( -90      , -90  + 30 )
    >>> NUMRES = 20
    >>> lon, lat = N.meshgrid( list(N.linspace(MIN_LON,180,NUMRES/2)) + list(N.linspace(-180,MAX_LON,NUMRES/2)),
    ...                        N.linspace(MIN_LAT,MAX_LAT,NUMRES)                                     )
    >>> lon = lon.reshape(lon.size)
    >>> lat = lat.reshape(lat.size)
    >>> time = N.array([  0,]*len(lon))

    >>> lonb  = N.array([ -180,])
    >>> latb  = N.array([ (MIN_LAT+MAX_LAT)/2.0,])
    >>> timeb = N.array([ 0.0 ,])

    >>> sites = N.array(['realisticSHwrap',])

    >>> indices = colocated_indices(lon, lat, time, lonb, latb, timeb, sites)
    >>> mask = N.zeros(NUMRES*NUMRES, dtype=int)
    >>> mask[N.array([len(x) > 0 for x in indices])] = 1
    >>> mask.reshape((NUMRES,NUMRES))
    array([[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
           [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
           [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
           [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
           [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
           [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
           [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
           [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
           [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
           [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
           [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
           [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
           [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
           [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
           [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
           [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
           [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
           [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
           [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
           [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]])

    """

    #Default coincidence criteria if user doesn't specify
    DEFAULT_DELTA_TIME = 60 * 60.0 #seconds in +- 1 hour

    #Preliminary filter limitations to help reduce the amount of data to consider in detailed comparisons
    PRELIM_DELTA_TIME = DEFAULT_DELTA_TIME
    PRELIM_DELTA_LON  = 30
    PRELIM_DELTA_LAT  = 10

    #Test for no OCO2 data
    if len(OCO_lon) == 0: return []

    #A useful empty return vessel
    empty = N.array([], dtype=N.int64)

    #Define number of OCO2 soundings
    num_OCO = len(OCO_lon)

    #Test for no TCCON data
    if len(TCN_lon) == 0: return [empty,]*num_OCO

    #Recalling the original indices so that when we subfilter we can find our way back
    matching_indices = N.arange(num_OCO)

    #This is the initial filter; it filters out all OCO2 data that has no reasonable chance of matching
    #Accelerated through the use of distance trees for nearest neighbor calculations

    #Create tree over TCCON time
    if print_status: print "Building TCCON time tree"
    TCN_tree = spsp.cKDTree(N.atleast_2d(TCN_time).T, balanced_tree = False)
    if print_status: print "Matching TCCON to OCO2 time"
    TCN_dists, TCN_matching_indices = TCN_tree.query ( x = N.atleast_2d(OCO_time).T, k = 1, p = 1 )
    prelim_max_time = max_time if max_time is not None else PRELIM_DELTA_TIME
    mask     = TCN_dists <= prelim_max_time

    #If no OCO_2 data survived, return no matches
    if N.sum(mask) == 0: return [empty,]*num_OCO

    #Reduce the OCO-2 data
    matching_indices = matching_indices[mask]
    OCO_lat  = OCO_lat [mask]
    OCO_lon  = OCO_lon [mask]
    OCO_time = OCO_time[mask]

    #Create tree over TCCON lat
    if print_status: print "Building TCCON lat tree"
    TCN_tree = spsp.cKDTree(N.atleast_2d(TCN_lat).T, balanced_tree = False)
    if print_status: print "Matching TCCON to OCO2 lat"
    TCN_dists, TCN_matching_indices = TCN_tree.query ( x = N.atleast_2d(OCO_lat).T, k = 1, p = 1 )
    prelim_max_lat = max_lat if max_lat is not None else PRELIM_DELTA_LAT
    mask     = TCN_dists <= prelim_max_lat

    #If no OCO_2 data survived, return no matches
    if N.sum(mask) == 0: return [empty,]*num_OCO

    #Reduce the OCO-2 data
    matching_indices = matching_indices[mask]
    OCO_lat  = OCO_lat [mask]
    OCO_lon  = OCO_lon [mask]
    OCO_time = OCO_time[mask]

    if print_status: print "Reduced by time & lat & lon from %d to %d"%(num_OCO,len(matching_indices))

    #Carefully refine filter around OCO-2 points to include region-specific requirements

    #Initialize the OCO matches (matching_indices into TCCON points that were matched)
    OCO_matches = [N.array([],dtype=N.int64),]*num_OCO

    if progressbar:
       _matched_indices = bar_nospam(matching_indices)
    else:
       _matched_indices = matching_indices

    #Mask for sites that are / are not special cases (Caltech, Edwards)
    tccon_caltech_mask    = N.array(["caltech" in x.lower().strip() or "pasadena" in x.lower().strip() for x in TCN_sites])
    tccon_edwards_mask    = N.array(["edwards" in x.lower().strip() for x in TCN_sites])
    tccon_normalsite_mask = ~tccon_caltech_mask & ~tccon_edwards_mask

    #No user-specified time
    if max_time is None: max_time = DEFAULT_DELTA_TIME

    #Loop over the matched OCO2 indices and compare with TCCON record more elaborately
    #i_zeroindex    pertains only to the REMAINING OCO-2 data after initial filtration
    #i_matchedindex maps back to the original OCO-2 full data record
    for i_zeroindex, i_matchedindex in enumerate(_matched_indices):

       #Not a user-specified distance
       if (max_lat is None) or (max_lon is None):
          #southern hemisphere gets especially large matching regions
          if OCO_lat[i_zeroindex] <= -25:
             _max_lat = 10 #SH admits wide lat range
             _max_lon = 30 #SH admits wide lon range
          else:
             _max_lat = 2.5 #Normally admit smaller lat range
             _max_lon = 5   #Normally admit smaller lon range
       else:
          _max_lat = max_lat
          _max_lon = max_lon

       tccon_match_normalsites = ( tccon_normalsite_mask &
                                   (
                                    #time matching
                                    ( N.abs(OCO_time[i_zeroindex] - TCN_time) <= max_time ) &
                                    #Handles lat/lon bounding box with lon wrapping handled correctly
                                    MLL.bounding_box(OCO_lat[i_zeroindex], OCO_lon[i_zeroindex], _max_lat, _max_lon, TCN_lat, TCN_lon)
                                   )
       )

       tccon_match_caltech     = ( tccon_caltech_mask &
                                   #time matching
                                   ( N.abs(OCO_time[i_zeroindex] - TCN_time) <= max_time ) &
                                   #lat matching
                                   ( NUM.inr(OCO_lat [i_zeroindex],   33.38,   34.27) ) &
                                   #lon matching
                                   ( NUM.inr(OCO_lon [i_zeroindex], -118.49, -117.55) )
       )

       tccon_match_edwards     = ( tccon_edwards_mask &
                                   #time matching
                                   ( N.abs(OCO_time[i_zeroindex] - TCN_time) <= max_time ) &
                                   #lat matching
                                   ( NUM.inr(OCO_lat [i_zeroindex],   34.68,   37.46) ) &
                                   #lon matching
                                   ( NUM.inr(OCO_lon [i_zeroindex], -122.88, -112.88) )
       )

       tccon_matches_mask = tccon_match_normalsites | tccon_match_caltech | tccon_match_edwards

       # if NUM.inr(OCO_lat[i_zeroindex], 34.68, 37.46) & ( NUM.inr(OCO_lon [i_zeroindex], -127.88, -112.88) ):
       #    import pdb
       #    pdb.set_trace()

       OCO_matches[i_matchedindex] = N.where(tccon_matches_mask)[0]

    return OCO_matches

#----------------------------
def colocated_indices_old(OCO_lon, OCO_lat, OCO_time, OCO_T700,
                          TCN_lon, TCN_lat, TCN_time, TCN_T700, TCN_sites,
                          max_lon, max_lat, max_time, max_T700, print_status = False, progressbar = False):
    """ Obsolute due to a modification of Debra's coincidence criteria no longer requiring T700.
    Returns a list len(OCO_lon) long containing arrays of colocated indices.
    max lon and lat are combined to produce an elliptical matching region.
    print_status prints results directly to the screen to track progress.
    TCN_sites is used to sub-filter data geographically based on site-specific information.
    Warning: This is a very slow routine for data sizes >~10k. Chunking is advised before using this algorithm.

    Test time matching (pop2 = pop1 except time is exactly 1 unit higher)
    >>> lon  = N.array(range(6))
    >>> lat  = N.array(range(6))
    >>> time = N.array(range(6))
    >>> T700 = N.array(range(6))

    >>> lonb  = N.array([0, 2, 4, 5])
    >>> latb  = N.array([0, 2, 4, 5])
    >>> timeb = N.array([0, 2, 4, 5])
    >>> T700b = N.array([0, 2, 4, 5])

    >>> sites = N.array(['site',]*4)

    Everything gets a match because they're identical, but only one each because narrow range
    >>> colocated_indices_old(lonb, latb, timeb, T700b, lonb, latb, timeb, T700b, sites, 1, 1, 1, 1)
    [array([0]), array([1]), array([2]), array([3])]

    Everything gets a match because they're identical, but everything for everyone because wide range
    >>> colocated_indices_old(lonb, latb, timeb, T700b, lonb, latb, timeb, T700b, sites, 10, 10, 10, 10)
    [array([0, 1, 2, 3]), array([0, 1, 2, 3]), array([0, 1, 2, 3]), array([0, 1, 2, 3])]

    Everybody gets a match, but data lengths now different, narrow range
    >>> colocated_indices_old(lon, lat, time, T700, lonb, latb, timeb, T700b, sites, 2, 2, 2, 2)
    [array([0]), array([0, 1]), array([1]), array([1, 2]), array([2, 3]), array([2, 3])]

    Everybody gets a match, but data lengths now different, wide range
    >>> colocated_indices_old(lon, lat, time, T700, lonb, latb, timeb, T700b, sites, 10, 10, 10, 10)
    [array([0, 1, 2, 3]), array([0, 1, 2, 3]), array([0, 1, 2, 3]), array([0, 1, 2, 3]), array([0, 1, 2, 3]), array([0, 1, 2, 3])]

    >>> timex = timeb + 1.1

    All points in pop 1 will be matched to some in pop2, but not all, as maxtime 2 < range of times = 5
    >>> colocated_indices_old(lon, lat, time, T700, lonb, latb, timex, T700b, sites, 1, 1, 2, 2)
    [array([0]), array([], dtype=int64), array([1]), array([], dtype=int64), array([2]), array([3])]

    >>> timex = timeb + 2.1

    Even less matched, we've moved past the acceptable time window
    >>> colocated_indices_old(lon, lat, time, T700, lonb, latb, timex, T700b, sites, 1, 1, 2, 2)
    [array([], dtype=int64), array([], dtype=int64), array([], dtype=int64), array([], dtype=int64), array([], dtype=int64), array([], dtype=int64)]

    Test T700 matching
    >>> lon  = N.array([ 20,]*5)
    >>> lat  = N.array([  0,]*5)
    >>> time = N.array([  0,]*5)
    >>> T700 = N.array([ 10,]*5)
    >>> T700b = T700 + 2.1

    >>> sites = N.array(['site',]*5)

    All points should be matched
    >>> colocated_indices_old(lon, lat, time, T700, lon, lat, time, T700b, sites, 1, 1, 1, 3)
    [array([0, 1, 2, 3, 4]), array([0, 1, 2, 3, 4]), array([0, 1, 2, 3, 4]), array([0, 1, 2, 3, 4]), array([0, 1, 2, 3, 4])]

    Should match nothing, as we're permitting max_temp = 1
    >>> colocated_indices_old(lon, lat, time, T700, lon, lat, time, T700b, sites, 1, 1, 1, 1)
    [array([], dtype=int64), array([], dtype=int64), array([], dtype=int64), array([], dtype=int64), array([], dtype=int64)]

    Test Spatial matching, make grid of points surrounding 0,0 and ranging from -5 to 5 lat & lon
    >>> lon, lat = N.meshgrid(N.linspace(-5,5,10),N.linspace(-5,5,10))
    >>> lon = lon.reshape(lon.size)
    >>> lat = lat.reshape(lat.size)
    >>> time = N.array([  0,]*len(lon))
    >>> T700 = N.array([ 10,]*len(lon))

    >>> lonb  = N.array([ 0,])
    >>> latb  = N.array([ 0,])
    >>> timeb = N.array([ 0,])
    >>> T700b = N.array([10,])

    >>> sites = N.array(['site',])

    Match everything, radius 10 >> 5
    >>> indices = colocated_indices_old(lon, lat, time, T700, lonb, latb, timeb, T700b, sites, 10, 10, 1, 1)
    >>> mask = N.zeros(100,dtype=int)
    >>> mask[N.array([len(x) > 0 for x in indices])] = 1
    >>> mask.reshape((10,10))
    array([[1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
           [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
           [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
           [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
           [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
           [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
           [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
           [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
           [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
           [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]])

    Match nothing, radius 0.10 << 5
    >>> indices = colocated_indices_old(lon, lat, time, T700, lonb, latb, timeb, T700b, sites, 0.10, 0.10, 1, 1)
    >>> mask = N.zeros(100,dtype=int)
    >>> mask[N.array([len(x) > 0 for x in indices])] = 1
    >>> mask.reshape((10,10))
    array([[0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
           [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
           [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
           [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
           [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
           [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
           [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
           [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
           [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
           [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]])

    Match inner circle, radius 3 < 5
    >>> indices = colocated_indices_old(lon, lat, time, T700, lonb, latb, timeb, T700b, sites, 3, 3, 1, 1)
    >>> mask = N.zeros(100,dtype=int)
    >>> mask[N.array([len(x) > 0 for x in indices])] = 1
    >>> mask.reshape((10,10))
    array([[0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
           [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
           [0, 0, 0, 0, 1, 1, 0, 0, 0, 0],
           [0, 0, 0, 1, 1, 1, 1, 0, 0, 0],
           [0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
           [0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
           [0, 0, 0, 1, 1, 1, 1, 0, 0, 0],
           [0, 0, 0, 0, 1, 1, 0, 0, 0, 0],
           [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
           [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]])

    Match inner ellipse stretching in longitude
    >>> indices = colocated_indices_old(lon, lat, time, T700, lonb, latb, timeb, T700b, sites, 6, 3, 1, 1)
    >>> mask = N.zeros(100,dtype=int)
    >>> mask[N.array([len(x) > 0 for x in indices])] = 1
    >>> mask.reshape((10,10))
    array([[0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
           [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
           [0, 0, 0, 1, 1, 1, 1, 0, 0, 0],
           [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
           [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
           [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
           [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
           [0, 0, 0, 1, 1, 1, 1, 0, 0, 0],
           [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
           [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]])

    Match inner ellipse stretching in latitude
    >>> indices = colocated_indices_old(lon, lat, time, T700, lonb, latb, timeb, T700b, sites, 3, 6, 1, 1)
    >>> mask = N.zeros(100,dtype=int)
    >>> mask[N.array([len(x) > 0 for x in indices])] = 1
    >>> mask.reshape((10,10))
    array([[0, 0, 0, 0, 1, 1, 0, 0, 0, 0],
           [0, 0, 0, 1, 1, 1, 1, 0, 0, 0],
           [0, 0, 0, 1, 1, 1, 1, 0, 0, 0],
           [0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
           [0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
           [0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
           [0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
           [0, 0, 0, 1, 1, 1, 1, 0, 0, 0],
           [0, 0, 0, 1, 1, 1, 1, 0, 0, 0],
           [0, 0, 0, 0, 1, 1, 0, 0, 0, 0]])

    Test double empty case
    >>> colocated_indices_old([],[],[],[], [],[],[],[], sites, 9,9,9,9)
    []

    Test empty OCO case
    >>> colocated_indices_old([], [], [], [], lonb, latb, timeb, T700b, sites, 9,9,9,9)
    []

    Test empty TCCON case
    >>> colocated_indices_old(lonb, latb, timeb, T700b, [],[],[],[], sites, 9,9,9,9)
    [array([], dtype=int64)]

    """

    #Test for no OCO2 data
    if len(OCO_lon) == 0: return []

    empty = N.array([],dtype=N.int64)

    num_OCO = len(OCO_lon)

    #Test for no TCCON data
    if len(TCN_lon) == 0: return [empty,]*num_OCO

    import scipy.spatial as spsp

    #Recalling the original indices so that when we subfilter we can find our way back
    matching_indices = N.arange(num_OCO)

    #Create tree over TCCON time
    if print_status: print "Building TCCON time tree"
    TCN_tree = spsp.cKDTree(N.atleast_2d(TCN_time).T, balanced_tree = False)
    if print_status: print "Matching TCCON to OCO2 time"
    TCN_dists, TCN_matching_indices = TCN_tree.query ( x = N.atleast_2d(OCO_time).T, k = 1, p = 1 )
    mask     = TCN_dists <= max_time

    if N.sum(mask) == 0: return [empty,]*num_OCO

    #Reduce the OCO-2 data
    matching_indices = matching_indices[mask]
    OCO_lat  = OCO_lat [mask]
    OCO_lon  = OCO_lon [mask]
    OCO_T700 = OCO_T700[mask]
    OCO_time = OCO_time[mask]

    #Create tree over TCCON T700
    if print_status: print "Building TCCON T700 tree"
    TCN_tree = spsp.cKDTree(N.atleast_2d(TCN_T700).T, balanced_tree = False)
    if print_status: print "Matching TCCON to OCO2 T700"
    TCN_dists, TCN_matching_indices = TCN_tree.query ( x = N.atleast_2d(OCO_T700).T, k = 1, p = 1 )
    mask     = TCN_dists <= max_T700

    if N.sum(mask) == 0: return [empty,]*num_OCO

    #Reduce the OCO-2 data
    matching_indices = matching_indices[mask]
    OCO_lat  = OCO_lat [mask]
    OCO_lon  = OCO_lon [mask]
    OCO_T700 = OCO_T700[mask]
    OCO_time = OCO_time[mask]

    #Create a tree over the TCCON sites spatially, shrink down to the largest radius specified
    if print_status: print "Building TCCON spatial tree"
    TCN_tree = spsp.cKDTree(zip(TCN_lon,TCN_lat), balanced_tree = False)
    if print_status: print "Matching TCCON to OCO2 space"
    TCN_dists, TCN_matching_indices = TCN_tree.query( x = zip(OCO_lon, OCO_lat), k = 1, p = 2)
    mask     = TCN_dists <= N.max((max_lon,max_lat))

    if N.sum(mask) == 0: return [empty,]*num_OCO

    #Reduce the OCO-2 data
    matching_indices = matching_indices[mask]
    OCO_lat  = OCO_lat [mask]
    OCO_lon  = OCO_lon [mask]
    OCO_T700 = OCO_T700[mask]
    OCO_time = OCO_time[mask]

    if print_status: print "Reduced by time & temp & space from %d to %d"%(num_OCO,len(matching_indices))

    #Carefully process the remaining precision matching to include ellipse
    if print_status: print "Refining filtration"
    ratio = max_lon / float(max_lat)
    ratio2 = ratio*ratio
    max_lon2 = max_lon*max_lon

    #Initialize the OCO matches (matching_indices into TCCON points that were matched)
    OCO_matches = [N.array([],dtype=N.int64),]*num_OCO

    if progressbar:
       _matched_indices = bar_nospam(matching_indices)
    else:
       _matched_indices = matching_indices
    ii=-1
    #Loop over the matched indices with TCCON
    for i in _matched_indices:
       ii+=1
       tccon_mask = (

          #time matching
          ( N.abs(OCO_time[ii] - TCN_time) <= max_time ) &
          #temp matching
          ( N.abs(OCO_T700[ii] - TCN_T700) <= max_T700 ) &
          #angular distance matching
          ( (OCO_lon[ii] - TCN_lon)**2 + ratio2*(OCO_lat[ii] - TCN_lat)**2 <= max_lon2 )

       )

       #Check to see if we are matching Edwards, and if so, do not match if OCO_lat is south of Lancaster

       edwards_present = N.any(["edward" in x for x in TCN_sites[tccon_mask]])
       if edwards_present and OCO_lat[ii] < REMOVE_EDWARDS_SOUTH_OF_LAT: continue

       OCO_matches[i] = N.where(tccon_mask)[0]

    return OCO_matches

#----------------------------
def add_colocated_tccon(data, data_TCCON, max_lon = None, max_lat = None, max_sec = None, print_status = False, progressbar = False, force_onechunk = False):
   """ Add TCCON colocated data to an existing DataDict "data" given four dimensional matching.
   Args:
       data: Independent DataDict of soundings. Colocation will be performed using retrieval_longitude, retrieval_latitude, J2000.
             WARNING Results will be added to this DataDict, not returned as a function. Side-effect.
       data_TCCON       : A DataDict containing "lon","lat","time" (sounding_id)
       max_lon / max_lat: The maximum radius of matching as angles. If lat/lon not equal, results in matching ellipse.
       max_sec          : Number of seconds to match
       print_status     : If True, will print status of various processes directly to screen
       progressbar      : If True, will print an updating status bar
       force_onechunk   : Causes no chunking to be used; all data will be colocated simultaneously
   Returns:
       (none)
   """
   if print_status: print "Matching TCCON indices to OCO-2 data using chunking"

   indices_list = chunk_colocated_indices(
      data["longitude"],
      data["latitude"],
      data['J2000'],

      data_TCCON['lon'],
      data_TCCON['lat'],
      data_TCCON['J2000'],

      data_TCCON['site'],

      max_lon, max_lat, max_sec, print_status = print_status, progressbar = progressbar, force_onechunk = force_onechunk)

   #Update the OCO2 datadict
   if print_status: print "Forming averaged TCCON results per OCO-2 sounding"
   #Fill with no-match results entirely, because over 90% of the record will be in this state
   longest_sitename = N.max([len(x) for x in NUM.unique(data_TCCON['site'])])
   data['Mandrake/TCCON_median_xco2'] = [N.nan,]*data.numrows()
   data['Mandrake/TCCON_mean_lon'   ] = [N.nan,]*data.numrows()
   data['Mandrake/TCCON_mean_lat'   ] = [N.nan,]*data.numrows()
   data['Mandrake/TCCON_mean_J2000' ] = [N.nan,]*data.numrows()
   data['Mandrake/TCCON_nummatch'   ] = [0    ,]*data.numrows()
   data['Mandrake/TCCON_site'       ] = N.array(["-"  ,]*data.numrows(),dtype='|S%d'%(longest_sitename*3+2))

   #Form mask of matched soundings
   mask = N.array([len(x) > 0 for x in indices_list])
   indices_list_match = [x for x in indices_list if len(x) > 0]

   #Set the answers only for those soundings that were matched
   if N.sum(mask) > 0:
      if print_status: print "Forming TCCON median_xco2"
      data['Mandrake/TCCON_median_xco2'][mask]=N.array([N.median(data_TCCON['xco2'         ][indices]) for indices in indices_list_match])
      if print_status: print "Forming TCCON mean lon"
      data['Mandrake/TCCON_mean_lon'   ][mask]=N.array([N.mean  (data_TCCON['lon'          ][indices]) for indices in indices_list_match])
      data['Mandrake/TCCON_mean_lat'   ][mask]=N.array([N.mean  (data_TCCON['lat'          ][indices]) for indices in indices_list_match])
      data['Mandrake/TCCON_mean_J2000' ][mask]=N.array([N.mean  (data_TCCON['J2000'        ][indices]) for indices in indices_list_match])
      data['Mandrake/TCCON_nummatch'   ][mask]=N.array([len(indices)                                   for indices in indices_list_match])

      data['Mandrake/TCCON_site'       ][mask]=N.array([",".join(NUM.sortunique(data_TCCON['site'][indices])) for indices in indices_list_match])

#----------------------------
def regenerate_TCCON(path = '/home/mandrake/oco2_analysis/tccon'):
   """ Regenerates the useable TCCON files from the raw .nc files obtained from TCCON's website using wget. """

   import mlib_plot as MP; MP.init()
   import pylab as P
   import mlib_color as C

   print "**Please ensure that the NCEP files have recently been freshened to ensure the maximum TCCON data is accepted**"

   print "\nGenerating flatfiles using default path"

   generate_TCCON_flatfiles(path = path, ignore_before = '20000701000000', ignore_after = "20200501000000")

   print "\nReading resulting activity file (test)"

   TCCON_activity = load_activity_file(path = path)
   print 'lamont01',["%s = %s"%(x,TCCON_activity['lamont01'][x]) for x in sorted(TCCON_activity['lamont01']) if not "active_ranges" in x]
   print TCCON_activity['lamont01']['active_ranges'][:10]

   print "\nReading resulting site file (test)"

   sites = load_site_file(path = path)
   print sites

   print "\nReading TCCON flatfile (test)"

   TCCON_data = load_flatfile(path = path, filter_bad_sites = False)
   for key in TCCON_data.features: print key,TCCON_data[key][:10]

   print "\nVisualizing results for confirmation of function"

   P.close('all')

   colors = C.color_span(len(TCCON_activity),'gist_rainbow_r')
   for color, station in zip(colors,TCCON_activity):
      first = True
      for tstart, tend in TCCON_activity[station]['active_ranges']:
         P.hold(True)
         P.plot([mlib_time.sounding_ids_to_decimal_year(tstart), mlib_time.sounding_ids_to_decimal_year(tend)],
                [TCCON_activity[station]['lat'], TCCON_activity[station]['lat']],
                '-', linewidth=4.0, color = color)
         if first:
            P.text(mlib_time.sounding_ids_to_decimal_year(tstart),
                   TCCON_activity[station]['lat'],
                   station,color='k')
            first = False

   P.xlabel('Decimal Year')
   P.ylabel('Lat')
   P.title('Activity ranges for TCCON stations')
   P.savefig('tccon_activity_ranges.png',dpi=150)

   print "\nVisualizing spatial availability"
#   colors   = C.color_span(len(sites['site']), 'gist_rainbow_r')

   P.close('all')

   MP.global_scatterplot_multiseries([TCCON_data['lon'][TCCON_data['site'] == x] for x in sites['site']],
                                     [TCCON_data['lat'][TCCON_data['site'] == x] for x in sites['site']],
#                                     colors = colors,
                                     title="TCCON availability without filtration: %d"%TCCON_data.numrows(),
                                     filename = None,
                                     labels = ['%s: %d'%(x, N.sum(TCCON_data['site']==x)) for x in sites['site']],
                                     markersize = 10, markeralpha = 1.0, markertype = '.',
                                     legend = True, marginal_bins = None, legend_alpha = 0.5, legend_loc = 'best', dpi=150,
                                     grid_alpha = 0.1,
                                     grid_dashes = (1e-9,1),
                                     palette = 'gist_rainbow_r',
                                     )

   #Place on site labels
   # props = dict(boxstyle='round', facecolor='wheat', alpha=0.5)
   # for site, lat, lon, col in zip(sites['site'],sites['lat'],sites['lon'],colors):
   #    P.text(lon,lat,'%s = %d'%(site, N.sum(TCCON_data['site'] == site)),color=col,fontsize='x-small',bbox=props)
   MP.visible_axes(['left',])
   MP.nicelegend(size=5)
   P.savefig("global_map_without_filtration.png",dpi=150)

   TCCON_data = load_flatfile(path = path, filter_bad_sites = True)
   P.close('all')

   MP.global_scatterplot_multiseries([TCCON_data['lon'][TCCON_data['site'] == x] for x in sites['site']],
                                     [TCCON_data['lat'][TCCON_data['site'] == x] for x in sites['site']],
#                                     colors = colors,
                                     title="TCCON availability with filtration: %d"%TCCON_data.numrows(),
                                     filename = None,
                                     labels = ['%s: %d'%(x, N.sum(TCCON_data['site']==x)) for x in sites['site']],
                                     markersize = 10, markeralpha = 1.0, markertype = '.',
                                     legend = True, marginal_bins = None, legend_alpha = 0.5, legend_loc = 'best', dpi=150,
                                     grid_alpha = 0.1,
                                     grid_dashes = (1e-9,1),
                                     palette = 'gist_rainbow_r',
                                     )

   #Place on site labels
   # for site, lat, lon, col in zip(sites['site'],sites['lat'],sites['lon'],colors):
   #    P.text(lon,lat,'%s = %d'%(site, N.sum(TCCON_data['site'] == site)),color=col,fontsize='x-small',bbox=props)
   MP.visible_axes(['left',])
   MP.nicelegend(size=5)
   P.savefig("global_map_with_filtration.png",dpi=150)

#----------------------------
#-----------------------------
#----------------------------

if __name__ == "__main__":
   import doctest
   from mlib_doctest import repo_path
   doctest.testmod()
