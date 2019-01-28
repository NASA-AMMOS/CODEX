##-----------------------------------------------------------------
##-----------------------------------------------------------------
##
## Mandrake lib (mlib) for reading GOSAT input files and aggregation
##
##-----------------------------------------------------------------
##-----------------------------------------------------------------

import h5py as H
import numpy as N
import numpy.ma as Nmask
import pandas as PA
import glob
import mlib_regex
import collections as C
import mlib_time
import mlib_NCEP
import warnings
import mlib_datadict as DD
from mlib_numeric import flatten
import mlib_log
import dogo_lib_feature_filter
#import mlib_progressbar
import mlib_formatting
import mlib_string

class GOSAT_datafile:

    """Encapsulates an aggregated generic dataset"""

    data  = PA.DataFrame({})

    paths_glob      = ""
    paths_input     = []
    paths_available = []

    def __init__(self, glob = None, paths = None):
        if glob is not None: self.set_glob(glob)
        if paths is not None: self.read(paths)

    def set_glob(self, glob):
        self.paths_glob = glob

    def read(self, paths):
        """stub for inheritance"""

    def scan_available_files(self):
        self.paths_available = sorted(glob.glob(self.paths_glob))

    def get_paths_by_orbit(self, orbit, revision = None):

        #scan all available paths first and keep it, if haven't already
        if len(self.paths_available) == 0: self.scan_available_files()

        orbit_paths = mlib_regex.matching_elements("_"+orbit,self.paths_available)

        if revision is not None:
            orbit_paths = mlib_regex.matching_elements(revision,orbit_paths)

#       You cannot force to select only one file, because there can be multiple mode files all with the same information otherwise
#       This also means you MUST handle the case if multiple SID's are loaded from different versions of the file
#        if len(orbit_paths) > 1: orbit_paths = orbit_paths[:1]

        return orbit_paths

    def get_paths_by_YYYYMMDD(self, identifier):

        """Takes a YYYYMMDD string or sounding_id and returns the paths that may be applicable"""

        #scan all available paths first and keep it, if haven't already
        if len(self.paths_available) == 0: self.scan_available_files()

        #Pull it apart and only search relevant directories
        yyyymmdd = str(identifier)[:8]
        yyyy = yyyymmdd[:4]
        mm   = yyyymmdd[4:6]
        dd   = yyyymmdd[6:]

        return mlib_regex.matching_elements(yyyy+"/"+mm+"/"+dd,self.paths_available)

    def read_by_orbit(self, orbit, revision = None):
        paths = self.get_paths_by_orbit(orbit, revision)
        self.read(paths)

    def read_by_YYYYMMDD(self, identifier):
        paths = self.get_paths_by_YYYYMMDD(identifier)
        self.read(paths)

    def limit_files_by_date(self, date_start, date_end):
        """Filter down the list of available files by date, if possible"""

        if date_start is None: return
        if date_end   is None: return

        to_keep = []
        for filer in self.paths_available:
            yyyymmdd = "".join(mlib_regex.extract_groups("/(\d\d\d\d)/(\d\d)/(\d\d)/",filer))
            if len(yyyymmdd) < 1:
                to_keep.append(filer)
                continue
            if yyyymmdd < date_start: continue
            if yyyymmdd > date_end  : continue
            to_keep.append(filer)

        self.paths_available = to_keep

class L2(GOSAT_datafile):

    """Encapsulates an aggregated L2 dataset from Ops output"""

    def read(self, paths):

        self.paths_input = paths
        if type(paths) == str: self.paths_input = [paths,]

        self.data = DD.DataDict()

#        statusbar = mlib_progressbar.ProgressBar(len(self.paths_input))
#        statusbar.start()


        groupnames = (
            'ABandCloudScreen',
            #'Dimensions',
            'IMAPDOASPreprocessing',
            #'Metadata',
            'RetrievalHeader',
            'RetrievalResults',
            #'RetrievedStateVector',
            #'Shapes',
            'SoundingGeometry',
#            'SoundingHeader',
            'SpectralParameters'
        )

        #Important to sort here, so that r02 versions will replace r01 versions if duplicates present
        for fi,filer in enumerate(sorted(self.paths_input)):

#            statusbar.update(fi)
#            print

            thisdata = {}

            h5data = H.File(filer,'r')

            print "read",
            T = mlib_log.start_time()

            for group in groupnames:

                for key in h5data[group]:
                    combo = "GOSATL2/"+group+"/"+key
                    if mlib_string.any_within(dogo_lib_feature_filter.UNDESIRED_FEATURE_PATTERNS, combo): continue

                    raw = h5data[group][key][:]

                    #Ignore tiny files that don't contribute
                    if len(raw) < 2: break

                    thisdata[str(combo)] = raw

                #break out of this loop to if tiny file
                if len(raw) < 2: break

            #Skip to next file immediately without modifying thisdata if tiny file
            if len(raw) < 2: continue

            numpoints = len(thisdata["GOSATL2/SoundingGeometry/sounding_latitude"])

            # Handle surface type nonsense
            surface_types = {'Lambertian':0, 'Coxmunk,Lambertian':1, 'Coxmunk':2}

            thisdata['GOSATL2/RetrievalResults/surface_type'] = N.array(
                [surface_types[x.strip()] for x in h5data['RetrievalResults']['surface_type'][:]], dtype=N.int8)

            #Read in Metadata fields and expand them to include the entire record, replace them with integers
#            mode_types = { 'sample nadir' : 0, 'sample glint' : 1  , 'sample target' : 2 , 'sample transition' : 3 }
#            thisdata['L2/Metadata/AcquisitionMode'] = N.ones(numpoints, dtype=N.int8) * mode_types[ h5data['Metadata']['AcquisitionMode'][0].lower() ]

            #Read in RetrievalHeader and store whether we're in glint mode or not, only 0 or 1 will be present
            thisdata['GOSATL2/RetrievalHeader/glint_flag'] = h5data['RetrievalHeader']['glint_flag'][:]

            #Read in Gain SWIR mode (High or Medium)
            mode_types = { 'H' : 0, 'M' : 1 }
            thisdata['GOSATL2/RetrievalHeader/gain_swir' ] = N.ones(numpoints, dtype = N.int8) * mode_types[ h5data['RetrievalHeader']['gain_swir'][0][0][0] ]

            print N.int(mlib_log.end_time(T)),"flat",
            T = mlib_log.start_time()

            #Now run through the data structure and replace anything that's not a single-element object with a large series of single-element entries
            for head in sorted(thisdata):
                shaper = thisdata[head][0].shape
                if shaper > ():
                    fmt = mlib_formatting.tight_format_string(shaper[0])
                    for element in range(shaper[0]):
                        name = head+"_"+fmt%element
                        thisdata[name] = N.array([x[element] for x in thisdata[head]])
                    del thisdata[head]

            print N.int(mlib_log.end_time(T)),"feat",
            T = mlib_log.start_time()

            #Add in blended albedo as an ice detector
            thisdata['Mandrake/blended_albedo']            = 2.4 * thisdata['GOSATL2/RetrievalResults/albedo_o2_fph'] - 1.13 * thisdata['GOSATL2/RetrievalResults/albedo_strong_co2_fph']

            D2R = N.pi/180.0
            R2D = 180.0/N.pi
            thisdata['Mandrake/airmass']                   = 1/N.cos(thisdata['GOSATL2/SoundingGeometry/sounding_solar_zenith']*D2R) + 1/N.cos(thisdata['GOSATL2/SoundingGeometry/sounding_zenith']*D2R)

            thisdata['Mandrake/dP_fph'] = (
                thisdata['GOSATL2/RetrievalResults/surface_pressure_fph'        ] -
                thisdata['GOSATL2/RetrievalResults/surface_pressure_apriori_fph']
                )*0.01 #convert to hPa

            #Redundant with surface_pressure_delta_cld
            # thisdata['Mandrake/dP_cld'] = (
            #     thisdata['GOSATL2/ABandCloudScreen/surface_pressure_cld'        ] -
            #     thisdata['GOSATL2/ABandCloudScreen/surface_pressure_apriori_cld']
            #     )*0.01 #convert to hPa

            #Add in orbit number
#            thisdata['Metadata/StartOrbitNumber'] = h5data['Metadata']['StartOrbitNumber'][:] * N.ones(numpoints, dtype=N.int32)

            print N.int(mlib_log.end_time(T)),"aod",
            T = mlib_log.start_time()

            #Iterate over all permitted aerosol types
            #Note that: 3 = Ice, 4 = Water always, but this code discovers that by itself and DTRT
            aerosol_types = ["BC","DU","Ice","OC","SO","SS","Water"]
            for typer in aerosol_types:

                istype0 = [typer in x[0] for x in h5data['RetrievalResults']['aerosol_types'][:]]
                istype1 = [typer in x[1] for x in h5data['RetrievalResults']['aerosol_types'][:]]
                istype2 = [typer in x[2] for x in h5data['RetrievalResults']['aerosol_types'][:]]
                istype3 = [typer in x[3] for x in h5data['RetrievalResults']['aerosol_types'][:]]

                #Iterate over the altitude segregation levels
                for x in ("aod","aod_low","aod_mid","aod_high"):

                    thisdata['Mandrake/aerosol_'+typer+'_'+x] =  (
                        istype0 * h5data['RetrievalResults/aerosol_1_'+x][:] +
                        istype1 * h5data['RetrievalResults/aerosol_2_'+x][:] +
                        istype2 * h5data['RetrievalResults/aerosol_3_'+x][:] +
                        istype3 * h5data['RetrievalResults/aerosol_4_'+x][:]
                        )

                #Handle the special Gaussian log parameters
                for index in (0,1,2):

                    thisdata['Mandrake/aerosol_'+typer+'_gaussian_log_param_%d'%index] =  (
                        istype0 * h5data['RetrievalResults/aerosol_1_gaussian_log_param'][:,index] +
                        istype1 * h5data['RetrievalResults/aerosol_2_gaussian_log_param'][:,index] +
                        istype2 * h5data['RetrievalResults/aerosol_3_gaussian_log_param'][:,index] +
                        istype3 * h5data['RetrievalResults/aerosol_4_gaussian_log_param'][:,index]
                        )

                #Set the unused gaussian log params to sentinel values
                if len(typer) == 2: #(not ice or water)
                    aod = "Mandrake/aerosol_"+typer+"_aod"
                    p1  = "Mandrake/aerosol_"+typer+"_gaussian_log_param_0"
                    p2  = "Mandrake/aerosol_"+typer+"_gaussian_log_param_1"
                    p3  = "Mandrake/aerosol_"+typer+"_gaussian_log_param_2"
                    unused_mask = thisdata[aod] == 0.0
                    thisdata[p1][unused_mask] = -100.0
                    thisdata[p2][unused_mask] = -10.0
                    thisdata[p3][unused_mask] = -1.0

                #Also include the non-log-based versions, as linear relationships are also possible
                thisdata['Mandrake/aerosol_'+typer+'_height_HPa'     ] = thisdata['Mandrake/aerosol_'+typer+'_gaussian_log_param_1']*thisdata['GOSATL2/RetrievalResults/surface_pressure_fph']*0.01
                thisdata['Mandrake/aerosol_'+typer+'_width_sigma_HPa'] = thisdata['Mandrake/aerosol_'+typer+'_gaussian_log_param_2']*thisdata['GOSATL2/RetrievalResults/surface_pressure_fph']*0.01

            print N.int(mlib_log.end_time(T)),"feat2",
            T = mlib_log.start_time()

            #Add aerosol mixture terms
            thisdata['Mandrake/aerosol_dustwater_aod'          ] =   thisdata['Mandrake/aerosol_DU_aod'       ] + thisdata['Mandrake/aerosol_Water_aod']
            thisdata['Mandrake/aerosol_dustwatersalt_large_aod'] =   thisdata['Mandrake/aerosol_dustwater_aod'] + thisdata['Mandrake/aerosol_SS_aod'   ]
            thisdata['Mandrake/aerosol_BC_ICE_OC_SO_small_aod' ] = ( thisdata['Mandrake/aerosol_BC_aod'] + thisdata['Mandrake/aerosol_Ice_aod'] +
                                                                     thisdata['Mandrake/aerosol_OC_aod'] + thisdata['Mandrake/aerosol_SO_aod' ] )

            #Add log aerosol terms
            for mixture in ('dustwater','dustwatersalt_large','BC_ICE_OC_SO_small'):
                thisdata['Mandrake/aerosol_log_'+mixture+'_aod'] = N.maximum( -5 * N.ones(numpoints),
                                                                              N.log( thisdata['Mandrake/aerosol_'+mixture+"_aod"] )
                )

            #Add in snr variables
            thisdata['Mandrake/snr_sco2'] = thisdata['GOSATL2/SpectralParameters/signal_strong_co2_fph'] / thisdata['GOSATL2/SpectralParameters/noise_strong_co2_fph']
            thisdata['Mandrake/snr_wco2'] = thisdata['GOSATL2/SpectralParameters/signal_weak_co2_fph'  ] / thisdata['GOSATL2/SpectralParameters/noise_weak_co2_fph'  ]
            thisdata['Mandrake/snr_o2'  ] = thisdata['GOSATL2/SpectralParameters/signal_o2_fph'        ] / thisdata['GOSATL2/SpectralParameters/noise_o2_fph'        ]
            #add decimal year
            thisdata['Mandrake/decimal_year'] = mlib_time.sounding_ids_to_decimal_year( thisdata['GOSATL2/RetrievalHeader/sounding_id_reference'] )
            thisdata['Mandrake/J2000'       ] = mlib_time.sounding_ids_to_J2000       ( thisdata['GOSATL2/RetrievalHeader/sounding_id_reference'] )

            blank = thisdata['Mandrake/J2000'] * N.nan

            print N.int(mlib_log.end_time(T)),"rad",
            T = mlib_log.start_time()

            #Add in our own features for spectral radiance values, as we can't really use the whole spectra
            #Only do if they are present (aren't in Standard but are in James and Diagnostic versions)

#            if 'measured_radiance' in h5data['SpectralParameters']:

            #These are (instances,radiances) and (instances,wavelengths), simple
            radiance    = h5data['SpectralParameters']['measured_radiance'][:]
            #NOTE! The wavelengths change on a per-sounding basis! Have to find the ones we want.
            wavenumbers = h5data['SpectralParameters']['wavenumber'][:]

            #all wavenumber units (1/cm) Hideous
            mask_o2  = (wavenumbers[:,:] > 7000.0)
            mask_sc2 = (wavenumbers[:,:] < 5000.0)
            mask_wc2 = (wavenumbers[:,:] < 7000.0) & (wavenumbers[:,:] > 5000.0)

            #Numpy mask uses opposite convention, where True equals mask, so invert my masks above
            rad_o2  = Nmask.array (radiance, mask = ~mask_o2 )
            rad_sc2 = Nmask.array (radiance, mask = ~mask_sc2)
            rad_wc2 = Nmask.array (radiance, mask = ~mask_wc2)

            thisdata['Mandrake/mean_radiance_o2'  ]=Nmask.mean(rad_o2 ,axis=1,dtype=N.float64)
            thisdata['Mandrake/mean_radiance_sco2']=Nmask.mean(rad_sc2,axis=1,dtype=N.float64)
            thisdata['Mandrake/mean_radiance_wco2']=Nmask.mean(rad_wc2,axis=1,dtype=N.float64)

            thisdata['Mandrake/max_radiance_o2'  ]=Nmask.max(rad_o2 ,axis=1)
            thisdata['Mandrake/max_radiance_sco2']=Nmask.max(rad_sc2,axis=1)
            thisdata['Mandrake/max_radiance_wco2']=Nmask.max(rad_wc2,axis=1)

            thisdata['Mandrake/min_radiance_o2'  ]=Nmask.min(rad_o2 ,axis=1)
            thisdata['Mandrake/min_radiance_sco2']=Nmask.min(rad_sc2,axis=1)
            thisdata['Mandrake/min_radiance_wco2']=Nmask.min(rad_wc2,axis=1)

            thisdata['Mandrake/std_radiance_o2'  ]=Nmask.std(rad_o2 ,axis=1,dtype=N.float64)
            thisdata['Mandrake/std_radiance_sco2']=Nmask.std(rad_sc2,axis=1,dtype=N.float64)
            thisdata['Mandrake/std_radiance_wco2']=Nmask.std(rad_wc2,axis=1,dtype=N.float64)

            h5data.close()

            #Remove any regex characters from the names of keys in thisdata
            for key in thisdata:
                newkey = mlib_regex.strip_special_from_strings(key)
                if newkey != key:
                    thisdata[newkey] = thisdata[key]
                    del thisdata[key]

            #Append into self.data
            self.data.update(thisdata)

            print N.int(mlib_log.end_time(T))

#        statusbar.finish()

        print "float32",
        T = mlib_log.start_time()

        #Ensure Mandrake fields are float32
        for f in self.data.features:
            if (self.data[f].dtype == N.float64) and ("Mandrake" in f) and not ("J20" in f) and not ("radiance" in f) and not ("decimal" in f):
                self.data[f] = self.data[f].astype(N.float32, copy = False)

        #Ensure no useless features slipped in (usually from undoing matrices like the averaging kernel)
        for f in self.data.features:
            if mlib_string.any_within(dogo_lib_feature_filter.UNDESIRED_FEATURE_PATTERNS, f):
                if "gain_swir" in f: continue
                del self.data[f]

        print N.int(mlib_log.end_time(T)),"pandas",
        T = mlib_log.start_time()

        #DataFrame indexed by sounding_id
        if self.data.numfeatures() == 0:
            self.data  = PA.DataFrame({})
        else:
            #Turn into Panda Dataframe (powerful but pain in the butt to manipulate)
            self.data = PA.DataFrame(self.data.dictionary)
            sid_name  = [ x for x in self.data.columns.values if "sounding_id" in x ][0]

            #Handle duplicates
            self.data.drop_duplicates(subset = sid_name, take_last = True, inplace = True)

            #DataFrame indexed by sounding_id
            self.data.set_index( sid_name , inplace = True, drop = False )

            #Enforce that sounding_id is first entry
            cols = self.data.columns.tolist()
            cols = [x for x in cols if "sounding_id" in x] + sorted([x for x in cols if not ("sounding_id" in x)])
            self.data = self.data[cols]


        print N.int(mlib_log.end_time(T)),
