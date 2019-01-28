##-----------------------------------------------------------------
##-----------------------------------------------------------------
##
## Mandrake lib (mlib) for reading, converting NCEP .nc files
##
##-----------------------------------------------------------------
##-----------------------------------------------------------------

import sys
import h5py as H
import numpy as N
import mlib_time
import mlib_latlon
import glob
import os
from mlib_progressbar import bar_nospam
import scipy.interpolate
import mlib_flatfile
import mlib_shell as S

CONST_NCEP_PATH  = "/home/mandrake/oco2_analysis/ncep/"

#FILTER_BEFORE_DATE eliminates things before this date
FILTER_BEFORE_DATE = "20010000000000" #"20140701000000"
#FILTER LOWER  THAN THIS IN LATITUDE (magic number 2.6 is because 2.5 degrees is resolution of NCEP file, want to include 1 more than necessary for interp)
FILTER_BOT_LAT     = -90 #-60.0 - 2.6
#FILTER HIGHER THAN THIS IN LATITUDE
FILTER_TOP_LAT     =  90 #70.0 + 2.6

#Load an existing T700 vs sounding ID file
def load_T700_vs_SID(path):
   temp = [x.strip().split() for x in S.smartopen(path+"/L1b_sid_vs_T700.txt.gz") if not "T" in x]
   #Make the T700 values be floats on return
   return dict([(N.int64(x),float(y)) for x,y in temp])

#Load flatfile as a 3D array with helper arrays for ultra-fast indexing
#Path can be simple path or path to a file
def load_flatfile_3D(path):
    path     = os.path.split(path)[0]
    lats     = mlib_flatfile.read_as_pandas(path+"/ncep_lats.txt.gz").values.squeeze()
    lons     = mlib_flatfile.read_as_pandas(path+"/ncep_lons.txt.gz").values.squeeze()
    times    = N.array([x.strip() for x in S.smartopen(path+"/ncep_times.txt.gz") if not "#" in x])
    times    = mlib_time.sounding_ids_to_J2000(times)
    raw_T700 = mlib_flatfile.read_as_pandas(path+"/ncep_T700.txt.gz",usecols=[3,]).values.squeeze()
    return times, lats, lons, raw_T700.reshape((len(times),len(lats),len(lons)))

#Return an interpolator that can immediately be used to obtain a T700 value for a given time, lat, lon
def interpolator(path):

   ncep_times, ncep_lats, ncep_lons, ncep_T700 = load_flatfile_3D(path)

   #Need to copy lon=0 to lon=360 to emulate periodic relationship of globe
#   print "Mirroring around LON for periodic interpolation"
   ncep_T700_mirrored_lon = N.zeros((len(ncep_times),
                     len(ncep_lats ),
                     len(ncep_lons )+1,))
   #copy the bulk of the original array
   ncep_T700_mirrored_lon[:,:,:-1] = ncep_T700[:,:,:]
   #copy the lon=0 values into the new lon=360 columns
   ncep_T700_mirrored_lon[:,:, -1] = ncep_T700[:,:,0]
   #replace original
   ncep_lons = N.concatenate((ncep_lons, (360,)))
   #convert to -180 to 180 longitude
#   ncep_lons = mlib_latlon.lon_360_to_180(ncep_lons)

   #Return interpolator for the NCEP data... really neat trick!
   # print "Interpolator ranges"
   # print "time",N.min(ncep_times),N.max(ncep_times)
   # print "lat ",N.min(ncep_lats ),N.max(ncep_lats )
   # print "lon ",N.min(ncep_lons ),N.max(ncep_lons )

   return scipy.interpolate.RegularGridInterpolator((ncep_times,ncep_lats,ncep_lons),ncep_T700_mirrored_lon, bounds_error = False, fill_value = None)

#Use an interpolator to return a series of T700 values as a function of spacetime coordinates
#Time is in J2000, lat/lon are in degrees (-180,180 for lon)
#must specify either a path to load from or an existing interpolator that covers the range needed
def T700_from_J2000_lat_lon(J2000, lats, lons, path = None, interpolator_object = None):
   if interpolator_object is None:
      if path is None:
         raise Exception("You must specify either an interpolator object or a path to read from in mlib_NCEP.T700")
      interpolator_object = interpolator(path)

   #Unfortunately, interpolator needs to work with 0-360 or else it gets very iffy about the reflective boundary
   #conditions on LON... so convert incoming lons to appropriate range

   # for t,la,lo in zip(J2000,lats,mlib_latlon.lon_180_to_360(lons)):
   #    try:
   #       _ = interpolator_object(((t,),(la,),(lo,)))
   #    except ValueError:
   #       print "Item found with element outside interpolator range"
   #       print t,la,lo

   return interpolator_object((J2000,lats,mlib_latlon.lon_180_to_360(lons)))

#Load it in as a maximum redundancy record
def load_flatfile_list(path):
    lats = []
    lons = []
    times = []
    T700s = []
    for line in S.smartopen(path+"/ncep_T700.txt.gz"):
        if "#" in line: continue

        #DEBUG DEBUG DEBUG
#        if not("201503" in line): continue


        lat, lon, time, T700 = line.split()
        lats  .append(float(lat))
        lons  .append(float(lon))
        times .append(time)
        T700s .append(float(T700))
    return N.array(lats),N.array(lons),N.array(times),N.array(T700s)

#Read in the file as a huge dictionary for later fast access
def load_flatfile_dictionary(path):
    lat_list  = {}
    lon_list  = {}
    time_list = {}
    T_list    = {}
    for line in S.smartopen(path,'r'):
        if "#" in line: continue
        lat, lon, time, T = line.split()
        lat_list [lat ]=1
        lon_list [lon ]=1
        time_list[time]=1
        T_list   [T   ]=1

    lat_list   = [float(x)          for x in  lat_list.keys()]
    lon_list   = [float(x)          for x in  lon_list.keys()]
    J2000_list = [mlib_time.Mtime(x)+0.0 for x in time_list.keys()]

    ncep = {}
    for lat in lat_list:
        ncep[lat]={}
        for lon in lon_list:
            ncep[lat][lon]={}
            for time in J2000_list:
                ncep[lat][lon][time]=0.0

    for line in S.smartopen(path,'r'):
        if "#" in line: continue
        lat, lon, time, T700 = line.split()
        time = mlib_time.Mtime(time)+0.0
        ncep[float(lat)][float(lon)][time] = float(T700)

    return ncep


#Convert the NCEP time (hours since 1800-01-01 00:00:00)
#to standard OCO-2 SID-style time
def convert_ncep_time_to_SID(ncep_time):
    epoch_ncep  = mlib_time.Mtime('18000101000000')
    epoch_J2000 = mlib_time.Mtime('20000101120000')
    return N.array([mlib_time.Mtime(x).to('YYYYMMDDHHMMSS') for x in ncep_time*60.0*60.0 + epoch_ncep - epoch_J2000])

if __name__ == "__main__":


    print "Usage: mlib_NCEP (file1.nc) (file2.nc) ...\n"

    print " ".join(sys.argv)

    f = S.smartopen("ncep_T700.txt.gz","w")
    f.write("#Lat Lon SID/time T700_hPa\n")

    i = S.smartopen("ncep_times.txt.gz",'w')
    i.write("#Times\n")

    print "Filtering data before",FILTER_BEFORE_DATE

    first = True
    for file in sys.argv[1:]:

        print "Processing file",file

        h = H.File(file,'r')

        temperatures = h['air'  ].value
        lats         = h['lat'  ].value
        lons         = h['lon'  ].value
        times        = h['time' ].value
        levels       = h['level'].value

        if first:
            g = S.smartopen("ncep_lats.txt.gz" ,'w')
            g.write("#Latitude\n")
            #reversing lats because they are listed in decreasing order natively, unlike other dims
            for lat in lats[::-1]:
                if not (FILTER_BOT_LAT < lat < FILTER_TOP_LAT): continue
                g.write("%0.1f\n"%lat)
            g.close()
            h = S.smartopen("ncep_lons.txt.gz" ,'w')
            h.write("#Longitude(0-360)\n")
            for lon in lons: h.write("%0.1f\n"%lon)
            h.close()

        times        = convert_ncep_time_to_SID(times)

        times_to_use = []
        for t in times:
            if t < FILTER_BEFORE_DATE: continue
            i.write("%s\n"%t)
            times_to_use.append(t)

        #Find level that corresponds to 700 hPa
        level_mask = levels == 700.0

        #Start writing out temperature values
        #Note that the temperatures variable is time x level x lat x lon

        print "Writing output"
        print "NOTE! Lon is in 0-360 range"

#        bar = mlib_progressbar.ProgressBar(len(times_to_use)*len(lats))
#        bar.start()
        ti = 0
        for time in bar_nospam(times):
            if time < FILTER_BEFORE_DATE: continue
            time_mask = times == time
            #reversing lats because they are listed in decreasing order natively, unlike other dims
            for ilat,lat in enumerate(lats[::-1]):
                if not (FILTER_BOT_LAT < lat < FILTER_TOP_LAT): continue
                lat_mask = lats == lat
                for lon in lons:
                    lon_mask = lons == lon
                    f.write("%.1f %.1f %s %.1f\n"%(lat, lon, time, temperatures[time_mask,level_mask,lat_mask,lon_mask]))
#                bar.update(ti*len(lats) + ilat)
            ti+=1
#        bar.finish()
        print

    print "\nDone."
