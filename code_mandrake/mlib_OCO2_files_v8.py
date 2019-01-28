##-----------------------------------------------------------------
##-----------------------------------------------------------------
##
## Mandrake lib (mlib) for reading OCO2 input files and aggregation
##
##-----------------------------------------------------------------
##-----------------------------------------------------------------

from mlib_numeric import flatten
import collections as C
import dogo_lib_feature_filter
import h5py as H
import mlib_datadict as DD
import mlib_formatting
import mlib_log
import mlib_progressbar
import mlib_regex
import mlib_shell as S
import mlib_string
import mlib_time
import numpy as N
import numpy.ma as Nmask
import mlib_numeric as NUM
import pandas as PA
import warnings

INCLUDE_AVERAGING_KERNEL = False

class OCO2_datafile:

    """Encapsulates an aggregated generic dataset"""

    data  = PA.DataFrame({})

    paths_glob      = ""
    paths_input     = []
    paths_available = []

    def __init__(self, glob = None, paths = None ):
        if glob is not None: self.set_glob(glob)
        if paths is not None: self.read(paths)

    def set_glob(self, glob):
        self.paths_glob = glob

    def read(self, action, paths):
        """stub for inheritance"""

    def scan_available_files(self):
        self.paths_available = sorted(S.glob(self.paths_glob))

    def get_paths_by_orbit(self, orbit, revision = None):

        #scan all available paths first and keep it, if haven't already
        if len(self.paths_available) == 0: self.scan_available_files()

        #make sure we're looking for a string of the proper formatting
#        orbit = "%05d"%(int(orbit))

#        print "Searching for",orbit

        orbit_paths = mlib_regex.matching_elements("_"+orbit,self.paths_available)

#        print "Found",orbit_paths

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

#        print "BY YYYYMMDD!",mlib_regex.matching_elements(yyyy+"/"+mm+"/"+dd,self.paths_available)

        return mlib_regex.matching_elements(yyyy+"/"+mm+"/"+dd,self.paths_available)

    def read_by_orbit(self, orbit, revision = None, action = ""):
        paths = self.get_paths_by_orbit(orbit, revision)
        print "PATHS",paths
        self.read(action, paths)

    def read_by_YYYYMMDD(self, identifier):
        paths = self.get_paths_by_YYYYMMDD(identifier)
        self.read(action, paths)

    def limit_files_by_date(self, date_start, date_end):
        """Filter down the list of available files by date, if possible"""

        if date_start is None: return
        if date_end   is None: return

        to_keep = []
        for filer in self.paths_available:
            extracted_date = mlib_regex.extract_groups("/(\d\d\d\d)/(\d\d)/(\d\d)/",filer)
            #If date cannot be determined, just keep it
            if extracted_date is None:
                to_keep.append(filer)
                continue

            yyyymmdd = "".join(extracted_date)
            if len(yyyymmdd) < 1:
                to_keep.append(filer)
                continue

            if yyyymmdd < date_start: continue
            if yyyymmdd > date_end  : continue

            to_keep.append(filer)

        self.paths_available = to_keep


class L1bSt(OCO2_datafile):

    """Encapsulates an aggregated L1bSt dataset as a Pandas DataFrame specified by a series of paths for the source data"""

    def read(self, action, paths):

        """Reads in one/several L1bSt (L1b Statistics) files from an array of paths"""

        self.paths_input = paths
        if type(paths) == str: self.paths_input = [paths,]

        self.data = DD.DataDict()

        #Important to sort here so that r02 versions replace r01
        for filer in sorted(self.paths_input):

            h    = H.File(filer,'r')
            fields = sorted([x for x in h['RadianceStatistics_spectra'] if not "flag" in x])

            #read in the fields and reshape by sounding_id
            for f in fields:
                raw = h['RadianceStatistics_spectra'][f][:]

                #If we have a tiny file, stop immediately and ignore
                if len(raw) < 2: break

                ff = "L1bSt/RadianceStatistics_spectra/"+f
                self.data.append(ff, raw.reshape(raw.size))

            #If a tiny file caused the loop to break, continue to next file without modifying self.data
            if len(raw) < 2: continue

        #fix the proper datatype (to avoid ridiculously long significant digits and wasted storage)
        # for f in self.data:
        #     if "sounding_id" in f:
        #         dtype = str
        #     else:
        #         dtype = N.float32
        #     self.data[f] = self.data[f].astype(dtype)

        #Ensure none of the fields are float64 that I just computed
        for f in self.data.features:
            if self.data[f].dtype == N.float64:
                self.data[f] = self.data[f].astype(N.float32, copy = False)

        #Turn into Panda Dataframe (powerful but pain in the butt to manipulate)
        self.data = PA.DataFrame(self.data.dictionary)
        sid_name = [ x for x in self.data.columns.values if "sounding_id" in x ][0]

        #Handle duplicates
        self.data.drop_duplicates(subset = sid_name, take_last = True, inplace = True)

        #DataFrame indexed by sounding_id
        if len(self.data) > 0:
            self.data.set_index( sid_name , inplace = True, drop = True )



class L1bSc(OCO2_datafile):

    """Encapsulates an aggregated L1bSc dataset as a Pandas DataFrame specified by a series of paths for the source data."""

    def read(self, action, paths):

        """Reads in one/several L1bSc (L1b per band info) files from an array of paths.
        If action contains 'addJames' then we only return the footprint specific information, otherwise return most.
        If action contains 'HighLat'  then only return highest latitude soundings."""

        self.paths_input = paths
        if type(paths) == str: self.paths_input = [paths,]

        self.data = DD.DataDict()

        #Important to sort here so that r02 versions replace r01
        for filer in sorted(self.paths_input):

            tiny = False

            h    = H.File(filer,'r')

            vars_per_band = [
                'footprint_altitude',
                'footprint_aspect',
                'footprint_slope',
                'footprint_surface_roughness',
                ]

            for f in vars_per_band:
                raw_o2   = h['FootprintGeometry'][f][:,:,0]
                raw_wco2 = h['FootprintGeometry'][f][:,:,1]
                raw_sco2 = h['FootprintGeometry'][f][:,:,2]

                #If we have a tiny file, stop immediately and ignore
                if len(raw_o2) < 2:
                    tiny = True
                    break

                #Append to building list
                ff = "L1bSc/FootprintGeometry/"+f+'_o2'
                raw_o2 = raw_o2    .reshape(raw_o2.size)
                self.data.append(ff, raw_o2  .copy())
                ff = "L1bSc/FootprintGeometry/"+f+'_wco2'
                raw_wco2 = raw_wco2.reshape(raw_wco2.size)
                self.data.append(ff, raw_wco2.copy())
                ff = "L1bSc/FootprintGeometry/"+f+'_sco2'
                raw_sco2 = raw_sco2.reshape(raw_sco2.size)
                self.data.append(ff, raw_sco2.copy())

                #Append the band differences as well
                ff = "L1bSc/FootprintGeometry/"+f+"_o2_minus_wco2"
                self.data.append(ff, raw_o2 - raw_wco2)
                ff = "L1bSc/FootprintGeometry/"+f+"_o2_minus_sco2"
                self.data.append(ff, raw_o2 - raw_sco2)
                ff = "L1bSc/FootprintGeometry/"+f+"_wco2_minus_sco2"
                self.data.append(ff, raw_wco2 - raw_sco2)

            #If a tiny file caused the loop to break, continue to next file
            if tiny: continue

            #Ensure sounding_id is added
            self.data.append('L1bSc/SoundingGeometry/sounding_id',h['SoundingGeometry']['sounding_id'][:])
            #Ensure orbit is added, deal with dimension
            self.data.append('L1bSc/Metadata/StartOrbitNumber',(h['Metadata']['StartOrbitNumber'][:],)*self.data.numsamples())

            #should we read in the rest?
            if not ('addjames' in action.lower()):

                #Get rid of Footprint nonsense if just getting l1b data raw
                for header in self.data.features:
                    if "FootprintGeo" in header: del self.data[header]

                #strange way to get directory of contents
                headers = []
                h.visit ( headers.append )
                headers = [str(x) for x in headers if h.get(x, getclass=True) != H.Group]

                vars_all = [
#                    'SoundingGeometry.+sounding_altitude$',
#                            'SoundingGeometry.+sounding_aspect$',
                    'SoundingGeometry.+land_fraction$',
                    'SoundingGeometry.+sounding_latitude$',
                    'SoundingGeometry.+sounding_longitude$',
                    'SoundingGeometry.+qual_flag$',
                    'SoundingGeometry.+slope$',
#                            'SoundingGeometry.+_solar_',
                    'SoundingGeometry.+surface_roughness$',
                    'SoundingGeometry.+zenith$',
                    'SoundingGeometry.+snr_o2$',
                    'SoundingGeometry.+snr_strong_co2$',
                    'SoundingGeometry.+snr_weak_co2$']

                matched_elements = mlib_regex.matching_elements(vars_all, headers, ignore_case = True, sort = True)

                for var in matched_elements:
                    self.data.append("L1bSc/"+var, h[var][:])

        #Check if we should be filtering for high latitude
        if "highlat" in action.lower():
            mask = ( N.abs(self.data['latitude']) > 70 ) | ( N.abs(self.data['latitude']) < -65 )
            self.data.apply_mask(mask)

        #Turn into Panda Dataframe (powerful but pain in the butt to manipulate)
        self.data = PA.DataFrame(self.data.dictionary)

        sid_name = [ x for x in self.data.columns.values if "sounding_id" in x ][0]

        #Handle duplicates
        self.data.drop_duplicates(subset = sid_name, take_last = True, inplace = True)

        #DataFrame indexed by sounding_id
        if len(self.data) > 0:
            if not ('addjames' in action.lower()):
                self.data.set_index( sid_name , inplace = True, drop = False )
            else:
                self.data.set_index( sid_name , inplace = True, drop = True  )

class ECMWF(OCO2_datafile):

    """Encapsulates an aggregated ECMWF dataset as a Pandas DataFrame specified by a series of paths for the source data"""

    def read(self, action, paths):

        """Reads in one/several ECMWF files from an array of paths"""

        self.paths_input = paths
        if type(paths) == str: self.paths_input = [paths,]

        self.data = DD.DataDict()

#        print "Going to read",paths

        #It's important to sort here, to ensure that r02 versions are taken instead of r01 versions (when possible)
        for filer in sorted(self.paths_input):

            h    = H.File(filer,'r')
            fields = [
                'boundary_layer_height_ecmwf',
                'high_cloud_cover_ecmwf',
                'low_cloud_cover_ecmwf',
                'medium_cloud_cover_ecmwf',
                'skin_temperature_ecmwf',
                'total_cloud_cover_ecmwf',
                'total_column_ice_water_ecmwf',
                'total_column_liquid_water_ecmwf',
                'total_column_water_vapor_ecmwf',
                'two_meter_temperature_ecmwf',
                'windspeed_u_ecmwf',
                'windspeed_v_ecmwf'
                ]

            #read in the fields and reshape by sounding_id
            for f in fields:
                raw = h['ECMWF'][f][:]

                #If we have a tiny file, break immediately and ignore
                if len(raw) < 2: break

                ff = "ECMWF/"+f
                self.data.append(ff, raw.reshape(raw.size))

            #read in the sounding_id
            raw = h['SoundingGeometry']['sounding_id'][:]
            ff  = 'ECMWF/sounding_id'
            self.data.append(ff, raw.reshape(raw.size))

            #If a tiny file caused the loop to break, continue to next file without modifying self.data
            if len(raw) < 2: continue

        #Compute the wind direction, then remove the windspeed components as redundant
        self.data['Mandrake/windspeed_direction_clockwise_from_north'] = 180.0/N.pi*N.arctan2(self.data['ECMWF/windspeed_u_ecmwf'],
                                                                                              self.data['ECMWF/windspeed_v_ecmwf']).astype(N.float32)
        del self.data['ECMWF/windspeed_u_ecmwf']
        del self.data['ECMWF/windspeed_v_ecmwf']

        #Turn into Panda Dataframe (powerful but pain in the butt to manipulate)
        self.data = PA.DataFrame(self.data.dictionary)
        if len(self.data) > 0:

            #Find the name of sounding_id's
            sid_name = [ x for x in self.data.columns.values if "sounding_id" in x ][0]

            #Handle duplicates
            self.data.drop_duplicates(subset = sid_name, take_last = True, inplace = True)

            #DataFrame indexed by sounding_id
            self.data.set_index( sid_name , inplace = True, drop = True )



class L2(OCO2_datafile):

    """Encapsulates an aggregated L2 dataset from Ops or James output"""

    def read(self, action, paths, allowed_modes = ('nadir','glint','target','transition'), progressbar = False ):
        """Reads in OCO2 h5 data from a list of specified paths.
        Optional argument restricts the AcquisitionMode as list of strings. Must be subset of 'nadir','glint','target','transition'. """

        #Handle the allowed modes by mapping them to integers using partial key maps
        modemap       = {'nadir':0, 'glint':1, 'target':2, 'transition': 3}
        allowed_modes = [ mlib_string.partial_key_dictionary(modemap, x) for x in allowed_modes ]

        self.paths_input = paths
        if type(paths) == str: self.paths_input = [paths,]

        self.data = DD.DataDict()

        if progressbar:
            statusbar = mlib_progressbar.ProgressBar(len(self.paths_input))
            statusbar.start()

        #Important to sort here, so that r02 versions will replace r01 versions if duplicates present
        for fi,filer in enumerate(sorted(self.paths_input)):

            if progressbar:
                statusbar.update(fi)
                print

            thisdata = {}

            h = H.File(filer,'r')

            groupnames = (
#                'AerosolResults',
                'AlbedoResults',
                'BRDFResults',
                'DispersionResults',
                #'L1bScSoundingReference',
                #'Dimensions',
                #'Metadata',
                #'RetrievedStateVector',
                #'Shapes',
                'L1bScSpectralParameters',
                'PreprocessingResults',
                'RetrievalGeometry',
                'RetrievalHeader',
                'RetrievalResults',
                'SpectralParameters'
                )

            print "read",
            T = mlib_log.start_time()

            #Immediately process the acquisition mode, as it might omit this entire file off the bat, but NOT if we are in James mode
            mode_this = mlib_string.partial_key_dictionary( modemap, h['Metadata']['AcquisitionMode'][0].lower().replace('sample ','') )
            #If we don't want to include particular modes, this is where we can nix this file. Each file can only have one mode within.
            #Saves a lot of time later on to not fully process undesired modes.
            if not mode_this in allowed_modes:
                print "SKIPPING disallowed mode",h['Metadata']['AcquisitionMode'][0], mode_this
                continue

            for group in groupnames:

                if group in h:
                    for key in h[group]:
                        combo = "L2/"+group+"/"+key
                        if mlib_string.any_within(dogo_lib_feature_filter.UNDESIRED_FEATURE_PATTERNS, combo): continue

                        raw = h[group][key][:]

                        #Ignore tiny files that don't contribute
                        if len(raw) < 2: break

                        thisdata[str(combo)] = raw

                    #break out of this loop also if tiny file
                    if len(raw) < 2: break

            #Skip to next file immediately without modifying thisdata if tiny file
            if len(raw) < 2: continue

            numpoints = len(thisdata["L2/RetrievalResults/iterations"])

            #If AlbedoResults are not present, add them in filled with -999999 sadly
            if "AlbedoResults" not in h:
                ALBEDO_FIELDS = [
                    'L2/AlbedoResults/albedo_apriori_o2_fph',
                    'L2/AlbedoResults/albedo_apriori_strong_co2_fph',
                    'L2/AlbedoResults/albedo_apriori_weak_co2_fph',
                    'L2/AlbedoResults/albedo_o2_fph',
                    'L2/AlbedoResults/albedo_slope_o2',
                    'L2/AlbedoResults/albedo_slope_strong_co2',
                    'L2/AlbedoResults/albedo_slope_uncert_o2',
                    'L2/AlbedoResults/albedo_slope_uncert_strong_co2',
                    'L2/AlbedoResults/albedo_slope_uncert_weak_co2',
                    'L2/AlbedoResults/albedo_slope_weak_co2',
                    'L2/AlbedoResults/albedo_strong_co2_fph',
                    'L2/AlbedoResults/albedo_uncert_o2_fph',
                    'L2/AlbedoResults/albedo_uncert_strong_co2_fph',
                    'L2/AlbedoResults/albedo_uncert_weak_co2_fph',
                    'L2/AlbedoResults/albedo_weak_co2_fph',
                    ]
                for key in ALBEDO_FIELDS: thisdata[key] = N.ones(numpoints,dtype=N.float32)*(-999999.0)

            #If BRDFResults are not present, add them in filled with -999999 sadly
            if "BRDFResults" not in h:
                BRDF_FIELDS = [
                    'L2/BRDFResults/brdf_anisotropy_parameter_o2',
                    'L2/BRDFResults/brdf_anisotropy_parameter_strong_co2',
                    'L2/BRDFResults/brdf_anisotropy_parameter_weak_co2',
                    'L2/BRDFResults/brdf_asymmetry_parameter_o2',
                    'L2/BRDFResults/brdf_asymmetry_parameter_strong_co2',
                    'L2/BRDFResults/brdf_asymmetry_parameter_weak_co2',
                    'L2/BRDFResults/brdf_breon_factor_o2',
                    'L2/BRDFResults/brdf_breon_factor_strong_co2',
                    'L2/BRDFResults/brdf_breon_factor_weak_co2',
                    'L2/BRDFResults/brdf_hotspot_parameter_o2',
                    'L2/BRDFResults/brdf_hotspot_parameter_strong_co2',
                    'L2/BRDFResults/brdf_hotspot_parameter_weak_co2',
                    'L2/BRDFResults/brdf_rahman_factor_o2',
                    'L2/BRDFResults/brdf_rahman_factor_strong_co2',
                    'L2/BRDFResults/brdf_rahman_factor_weak_co2',
                    'L2/BRDFResults/brdf_reflectance_apriori_o2',
                    'L2/BRDFResults/brdf_reflectance_apriori_strong_co2',
                    'L2/BRDFResults/brdf_reflectance_apriori_weak_co2',
                    'L2/BRDFResults/brdf_reflectance_o2',
                    'L2/BRDFResults/brdf_reflectance_slope_apriori_o2',
                    'L2/BRDFResults/brdf_reflectance_slope_apriori_strong_co2',
                    'L2/BRDFResults/brdf_reflectance_slope_apriori_weak_co2',
                    'L2/BRDFResults/brdf_reflectance_slope_o2',
                    'L2/BRDFResults/brdf_reflectance_slope_strong_co2',
                    'L2/BRDFResults/brdf_reflectance_slope_uncert_o2',
                    'L2/BRDFResults/brdf_reflectance_slope_uncert_strong_co2',
                    'L2/BRDFResults/brdf_reflectance_slope_uncert_weak_co2',
                    'L2/BRDFResults/brdf_reflectance_slope_weak_co2',
                    'L2/BRDFResults/brdf_reflectance_strong_co2',
                    'L2/BRDFResults/brdf_reflectance_uncert_o2',
                    'L2/BRDFResults/brdf_reflectance_uncert_strong_co2',
                    'L2/BRDFResults/brdf_reflectance_uncert_weak_co2',
                    'L2/BRDFResults/brdf_reflectance_weak_co2',
                    'L2/BRDFResults/brdf_weight_apriori_o2',
                    'L2/BRDFResults/brdf_weight_apriori_strong_co2',
                    'L2/BRDFResults/brdf_weight_apriori_weak_co2',
                    'L2/BRDFResults/brdf_weight_o2',
                    'L2/BRDFResults/brdf_weight_slope_apriori_o2',
                    'L2/BRDFResults/brdf_weight_slope_apriori_strong_co2',
                    'L2/BRDFResults/brdf_weight_slope_apriori_weak_co2',
                    'L2/BRDFResults/brdf_weight_slope_o2',
                    'L2/BRDFResults/brdf_weight_slope_strong_co2',
                    'L2/BRDFResults/brdf_weight_slope_uncert_o2',
                    'L2/BRDFResults/brdf_weight_slope_uncert_strong_co2',
                    'L2/BRDFResults/brdf_weight_slope_uncert_weak_co2',
                    'L2/BRDFResults/brdf_weight_slope_weak_co2',
                    'L2/BRDFResults/brdf_weight_strong_co2',
                    'L2/BRDFResults/brdf_weight_uncert_o2',
                    'L2/BRDFResults/brdf_weight_uncert_strong_co2',
                    'L2/BRDFResults/brdf_weight_uncert_weak_co2',
                    'L2/BRDFResults/brdf_weight_weak_co2',
                    ]
                for key in BRDF_FIELDS: thisdata[key] = N.ones(numpoints,dtype=N.float32)*(-999999.0)


            # Handle surface type nonsense
            surface_types = {'Lambertian':0, 'Coxmunk,Lambertian':1, 'Coxmunk':2, 'BRDF Soil': 3}

#            print "Surface Types observed in this file:", NUM.sortunique([x.strip() for x in h['RetrievalResults']['surface_type']])

            thisdata['L2/RetrievalResults/surface_type'] = N.array(
                [surface_types[x.strip()] for x in h['RetrievalResults']['surface_type']], dtype=N.int8)

            #Read in Metadata fields and expand them to include the entire record, replace them with integers
            thisdata['L2/Metadata/AcquisitionMode'] = N.ones(numpoints, dtype=N.int8) * mode_this

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
            # thisdata['Mandrake/blended_albedo']            = 2.4 * thisdata['L2/AlbedoResults/albedo_o2_fph'] - 1.13 * thisdata['L2/AlbedoResults/albedo_strong_co2_fph']

            #Add in various angles, sin(angle), cos(angle) terms for feature selection diagnostics
            D2R = N.pi/180.0
            R2D = 180.0/N.pi
            thisdata['Mandrake/airmass']                   = 1/N.cos(thisdata['L2/RetrievalGeometry/retrieval_solar_zenith']*D2R) + 1/N.cos(thisdata['L2/RetrievalGeometry/retrieval_zenith']*D2R)
            thisdata['Mandrake/airmass_pressure_weighted'] = thisdata['Mandrake/airmass'] * thisdata['L2/RetrievalResults/surface_pressure_fph'] / 101325.0 #Normalization by sea level pressure

            azm   = thisdata['L2/RetrievalGeometry/retrieval_solar_azimuth'] - thisdata['L2/RetrievalGeometry/retrieval_azimuth']
            mu    = N.cos(D2R*thisdata['L2/RetrievalGeometry/retrieval_zenith'      ])
            mu0   = N.cos(D2R*thisdata['L2/RetrievalGeometry/retrieval_solar_zenith'])
            dphi  = azm - 180.0
            scat  = R2D*N.arccos( -mu*mu0 + N.sqrt(1-mu*mu)*N.sqrt(1-mu0*mu0)*N.cos(D2R*dphi) )
#            theta = R2D*N.arccos( -mu*mu0 +  N.sin(thisdata['L2/RetrievalGeometry/retrieval_solar_zenith'])
#                                          *N.sin(thisdata['L2/RetrievalGeometry/retrieval_zenith'])
#                                          *N.cos(D2R * azm) )

            #NEW TERM TO ADD! True Solar Zenith Angle
            #Cos(SZA_true) = cos(SZA)cos(slope)+sin(SZA)sin(slope)cos(aspect-SolarAzimuth)

            thisdata['Mandrake/solar_zenith_true'] = R2D*N.arccos(
                N.cos(D2R*thisdata['L2/RetrievalGeometry/retrieval_solar_zenith'])*
                N.cos(D2R*thisdata['L2/RetrievalGeometry/retrieval_slope']) +

                N.sin(D2R*thisdata['L2/RetrievalGeometry/retrieval_solar_zenith'])*
                N.sin(D2R*thisdata['L2/RetrievalGeometry/retrieval_slope'])*

                N.cos(D2R*(thisdata['L2/RetrievalGeometry/retrieval_aspect'] - thisdata['L2/RetrievalGeometry/retrieval_solar_azimuth']))
                )

            # thisdata['Mandrake/cos_solar_zenith_true'] = N.cos(D2R*thisdata['Mandrake/solar_zenith_true'])
            # thisdata['Mandrake/sin_solar_zenith_true'] = N.sin(D2R*thisdata['Mandrake/solar_zenith_true'])

            thisdata['Mandrake/solar_minus_retrieval_azimuth'] = azm
            # thisdata['Mandrake/cos_retrieval_zenith'         ] = mu
            # thisdata['Mandrake/cos_solar_zenith'             ] = mu0
            thisdata['Mandrake/scattering_angle'             ] = scat
#            thisdata['Mandrake/theta_angle'                  ] = theta

            # thisdata['Mandrake/sin_retrieval_zenith'         ] = N.sin(D2R*thisdata['L2/RetrievalGeometry/retrieval_zenith'      ])
            # thisdata['Mandrake/sin_solar_zenith'             ] = N.sin(D2R*thisdata['L2/RetrievalGeometry/retrieval_solar_zenith'])

            # thisdata['Mandrake/sin_scattering_angle'         ] = N.sin(D2R*scat )
            # thisdata['Mandrake/cos_scattering_angle'         ] = N.cos(D2R*scat )

            # thisdata['Mandrake/sin_polarization_angle'       ] = N.sin(D2R*thisdata['L2/RetrievalGeometry/retrieval_polarization_angle'])
            # thisdata['Mandrake/cos_polarization_angle'       ] = N.cos(D2R*thisdata['L2/RetrievalGeometry/retrieval_polarization_angle'])

            # thisdata['Mandrake/sin_solar_minus_retrieval_azimuth' ] = N.sin(D2R*azm )
            # thisdata['Mandrake/cos_solar_minus_retrieval_azimuth' ] = N.cos(D2R*azm )

            #Add in airmass exponential forms for investigation
#            for B in (1.8, 1.9, 2.0, 2.2, 2.4, 2.6):
#                thisdata['Mandrake/expform_airmass_B_%03.1f'%B] = N.exp(B*(thisdata['Mandrake/airmass']-2.0))-1.0

            #Add in O'Dell dP_cld for confirmation purposes, comment out when confirmed
            #Redundant with L2/PreprocessingResults/surface_pressure_delta_abp * 0.01
            # thisdata['Mandrake/dP_cld'] = (
            #     thisdata['L2/PreprocessingResults/surface_pressure_abp'        ] -
            #     thisdata['L2/RetrievalResults/surface_pressure_apriori_fph'    ] - #note this term is equal to abp equivalent
            #     thisdata['L2/PreprocessingResults/surface_pressure_offset_abp' ]
            #     )*0.01

            thisdata['Mandrake/dP_fph'] = (
                thisdata['L2/RetrievalResults/surface_pressure_fph'        ] -
                thisdata['L2/RetrievalResults/surface_pressure_apriori_fph']
                )*0.01 #convert to hPa

            #Add in orbit number
            thisdata['L2/Metadata/StartOrbitNumber'] = h['Metadata']['StartOrbitNumber'][:] * N.ones(numpoints, dtype=N.int32)

            #Fix the non-water aerosols to only a sum... don't want to keep track of individual species
            # thisdata['Mandrake/aerosol_nonwater_aod'     ] = thisdata['L2/AerosolResults/aerosol_1_aod'     ] + thisdata['L2/AerosolResults/aerosol_2_aod'     ]
            # thisdata['Mandrake/aerosol_nonwater_aod_high'] = thisdata['L2/AerosolResults/aerosol_1_aod_high'] + thisdata['L2/AerosolResults/aerosol_2_aod_high']
            # thisdata['Mandrake/aerosol_nonwater_aod_low' ] = thisdata['L2/AerosolResults/aerosol_1_aod_low' ] + thisdata['L2/AerosolResults/aerosol_2_aod_low' ]
            # thisdata['Mandrake/aerosol_nonwater_aod_mid' ] = thisdata['L2/AerosolResults/aerosol_1_aod_mid' ] + thisdata['L2/AerosolResults/aerosol_2_aod_mid' ]

            print N.int(mlib_log.end_time(T)),"aod",
            T = mlib_log.start_time()

            #An array of the names of each of the 8 Aerosol types
            aerosol_types = h['Metadata']['AllAerosolTypes'][0]
            aod_levels    = ['','_low','_med','_high']

            #Map the Aerosol retrieved grid to individual aerosols retrieved
            thisdata['L2/AerosolResults/aerosol_total_aod'] = h['AerosolResults']['aerosol_total_aod'][:]
            for ai, aero in enumerate(aerosol_types):
                for Li, level in enumerate(aod_levels):
                    thisdata['Mandrake/aerosol_'+aero+'_aod'+level          ] = N.clip(h['AerosolResults']['aerosol_aod'          ][:,ai,Li],    0, 100)
                for pi in range(3):
                    thisdata['Mandrake/aerosol_'+aero+'_param_%d'        %pi] = N.clip(h['AerosolResults']['aerosol_param'        ][:,ai,pi], -100, 100)
                    thisdata['Mandrake/aerosol_'+aero+'_param_%d_apriori'%pi] = N.clip(h['AerosolResults']['aerosol_param_apriori'][:,ai,pi], -100, 100)
                    thisdata['Mandrake/aerosol_'+aero+'_param_%d_uncert' %pi] = N.clip(h['AerosolResults']['aerosol_param_uncert' ][:,ai,pi],   -1, 100)

            # #Iterate over all permitted aerosol types
            # #Note that: 3 = Ice, 4 = Water always, but this code discovers that by itself and DTRT
            # aerosol_types = ["BC","DU","Ice","OC","SO","SS","Water"]
            # for typer in aerosol_types:

            #     istype1 = [typer in x[1] for x in h['AerosolResults']['aerosol_types'][:]]
            #     istype2 = [typer in x[2] for x in h['AerosolResults']['aerosol_types'][:]]
            #     istype3 = [typer in x[3] for x in h['AerosolResults']['aerosol_types'][:]]

            #     #Iterate over the altitude segregation levels
            #     for x in ("aod","aod_low","aod_mid","aod_high"):

            #         thisdata['Mandrake/aerosol_'+typer+'_'+x] =  (
            #             istype0 * h['AerosolResults/aerosol_1_'+x][:] +
            #             istype1 * h['AerosolResults/aerosol_2_'+x][:] +
            #             istype2 * h['AerosolResults/aerosol_3_'+x][:] +
            #             istype3 * h['AerosolResults/aerosol_4_'+x][:]
            #             )

            #     #Handle the special Gaussian log parameters
            #     for index in (0,1,2):

            #         thisdata['Mandrake/aerosol_'+typer+'_gaussian_log_param_%d'%index] =  (
            #             istype0 * h['AerosolResults/aerosol_1_gaussian_log_param'][:,index] +
            #             istype1 * h['AerosolResults/aerosol_2_gaussian_log_param'][:,index] +
            #             istype2 * h['AerosolResults/aerosol_3_gaussian_log_param'][:,index] +
            #             istype3 * h['AerosolResults/aerosol_4_gaussian_log_param'][:,index]
            #             )

            #     #Set the unused gaussian log params to sentinel values
            #     if len(typer) == 2:
            #         aod = "Mandrake/aerosol_"+typer+"_aod"
            #         p1  = "Mandrake/aerosol_"+typer+"_gaussian_log_param_0"
            #         p2  = "Mandrake/aerosol_"+typer+"_gaussian_log_param_1"
            #         p3  = "Mandrake/aerosol_"+typer+"_gaussian_log_param_2"
            #         unused_mask = thisdata[aod] == 0.0
            #         thisdata[p1][unused_mask] = -100.0
            #         thisdata[p2][unused_mask] = -10.0
            #         thisdata[p3][unused_mask] = -1.0

                #Also include the non-log-based versions, as linear relationships are also possible
#                thisdata['Mandrake/aerosol_'+typer+'_height'] = N.exp(thisdata['Mandrake/aerosol_'+typer+'_gaussian_log_param_1'])
#                thisdata['Mandrake/aerosol_'+typer+'_width' ] = N.exp(thisdata['Mandrake/aerosol_'+typer+'_gaussian_log_param_2'])

                # #Also include the non-log-based versions, as linear relationships are also possible
                # thisdata['Mandrake/aerosol_'+typer+'_height_HPa'     ] = thisdata['Mandrake/aerosol_'+typer+'_gaussian_log_param_1']*thisdata['L2/RetrievalResults/surface_pressure_fph']*0.01
                # thisdata['Mandrake/aerosol_'+typer+'_width_sigma_HPa'] = thisdata['Mandrake/aerosol_'+typer+'_gaussian_log_param_2']*thisdata['L2/RetrievalResults/surface_pressure_fph']*0.01

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
            thisdata['Mandrake/snr_sco2'] = thisdata['L2/SpectralParameters/signal_strong_co2_fph'] / thisdata['L2/SpectralParameters/noise_strong_co2_fph']
            thisdata['Mandrake/snr_wco2'] = thisdata['L2/SpectralParameters/signal_weak_co2_fph'  ] / thisdata['L2/SpectralParameters/noise_weak_co2_fph'  ]
            thisdata['Mandrake/snr_o2'  ] = thisdata['L2/SpectralParameters/signal_o2_fph'        ] / thisdata['L2/SpectralParameters/noise_o2_fph'        ]

            source_names = {'O2':'o2','WCO2':'weak_co2','SCO2':'strong_co2'}
            for s1 in source_names:
                for s2 in source_names:
                    if s1 == s2: continue
                    thisdata['Mandrake/sig_ratio_%s_over_%s_fph'%(s1,s2)] = (   thisdata['L2/SpectralParameters/signal_%s_fph'  %source_names[s1]] /
                                                                              ( thisdata['L2/SpectralParameters/signal_%s_fph'  %source_names[s2]] + 1e-9 ))
                    thisdata['Mandrake/snr_ratio_%s_over_%s_l1b'%(s1,s2)] = (   thisdata['L2/L1bScSpectralParameters/snr_%s_l1b'%source_names[s1]] /
                                                                              ( thisdata['L2/L1bScSpectralParameters/snr_%s_l1b'%source_names[s2]] + 1e-9 ))

            #add footprint for convenience
            thisdata['Mandrake/footprint'              ] = N.array([x%10 for x in thisdata['L2/RetrievalHeader/sounding_id']], dtype=N.int8)

            #add decimal year
            thisdata['Mandrake/decimal_year'] = mlib_time.sounding_ids_to_decimal_year( thisdata['L2/RetrievalHeader/sounding_id'])
            thisdata['Mandrake/J2000'       ] = mlib_time.sounding_ids_to_J2000       ( thisdata['L2/RetrievalHeader/sounding_id'])

            blank = thisdata['Mandrake/J2000'] * N.nan

            print N.int(mlib_log.end_time(T)),"rad",
            T = mlib_log.start_time()

            #Add in our own features for spectral radiance values, as we can't really use the whole spectra
            #Only do if they are present (aren't in Standard but are in James and Diagnostic versions)

            if 'measured_radiance' in h['SpectralParameters']:

                #These are (instances,radiances) and (instances,wavelengths), simple
                radiance    = h['SpectralParameters']['measured_radiance']
                #NOTE! The wavelengths change on a per-sounding basis! Have to find the ones we want.
                wavelengths = h['SpectralParameters']['wavelength']

                #all wavelength numbers here in microns
                mask_o2  = (wavelengths[:,:] < 1.5) & (wavelengths[:,:] > 0.0) #have to handle -999999 codes
                mask_sc2 = (wavelengths[:,:] > 1.5) & (wavelengths[:,:] < 2.0)
                mask_wc2 =  wavelengths[:,:] > 2.0

                #Numpy mask uses opposite convention, where True equals mask, so invert my masks above
                rad_o2  = Nmask.array (radiance, mask = ~mask_o2 )
                rad_sc2 = Nmask.array (radiance, mask = ~mask_sc2)
                rad_wc2 = Nmask.array (radiance, mask = ~mask_wc2)

                thisdata['Mandrake/mean_radiance_o2'  ]=Nmask.mean(rad_o2 ,axis=1,dtype=N.float64)
                thisdata['Mandrake/mean_radiance_sco2']=Nmask.mean(rad_sc2,axis=1,dtype=N.float64)
                thisdata['Mandrake/mean_radiance_wco2']=Nmask.mean(rad_wc2,axis=1,dtype=N.float64)

#                thisdata['Mandrake/median_radiance_o2'  ]=Nmask.median(rad_o2 ,axis=1)
#                thisdata['Mandrake/median_radiance_sco2']=Nmask.median(rad_sc2,axis=1)
#                thisdata['Mandrake/median_radiance_wco2']=Nmask.median(rad_wc2,axis=1)

                thisdata['Mandrake/max_radiance_o2'  ]=Nmask.max(rad_o2 ,axis=1)
                thisdata['Mandrake/max_radiance_sco2']=Nmask.max(rad_sc2,axis=1)
                thisdata['Mandrake/max_radiance_wco2']=Nmask.max(rad_wc2,axis=1)

                thisdata['Mandrake/min_radiance_o2'  ]=Nmask.min(rad_o2 ,axis=1)
                thisdata['Mandrake/min_radiance_sco2']=Nmask.min(rad_sc2,axis=1)
                thisdata['Mandrake/min_radiance_wco2']=Nmask.min(rad_wc2,axis=1)

                thisdata['Mandrake/std_radiance_o2'  ]=Nmask.std(rad_o2 ,axis=1,dtype=N.float64)
                thisdata['Mandrake/std_radiance_sco2']=Nmask.std(rad_sc2,axis=1,dtype=N.float64)
                thisdata['Mandrake/std_radiance_wco2']=Nmask.std(rad_wc2,axis=1,dtype=N.float64)

            if INCLUDE_AVERAGING_KERNEL:
                print N.int(mlib_log.end_time(T)),"avgkrn",
                T = mlib_log.start_time()

                #precompute the sensitivity names for state vectors for all non ice and non water terms, to ensure constant presence
                #            all_possible_aod_sens = ['Aerosol Shape %s Logarithmic Gaussian for Coefficient %d'%(atype,loc) for atype in aerosol_types for loc in range(0,3)]

                #Add in diagonal elements of averaging kernel matrix, these represent sensitivities to various fit parameters
                #Stupidly, however, the number of elements changes frequently, even sounding by sounding
                #The returned array here is a num_soundings x num_vector_elements array of string names
                kernel             = h['RetrievalResults' ]['averaging_kernel_matrix'][:,:,:]
                state_vector_names = h['RetrievedStateVector']['state_vector_names']
                unique_names = list(set(list( flatten(state_vector_names) )))
                PREFIX = "Mandrake/avg_kernel_diag_"
                for name in unique_names:
                    if len(name) == 0: continue #ignore blank items
                    thisdata[PREFIX+name.replace(" ","_")] = []

                for i_sounding in range(len(state_vector_names)):
                    #copy in the specified kernel states
                    for i_name, name in enumerate(state_vector_names[i_sounding]):
                        if len(name) == 0: continue #Ignore the blank-named items
                        #Use the $ expression to ensure _1 doesn't match to _10
                        thisdata[PREFIX+name.replace(" ","_")] . append( kernel[i_sounding, i_name, i_name] )

                    #pad out the unused kernel states in the rest with 0 filler
                    for name in unique_names:
                        if len(name) == 0: continue #Ignore the blank-named items
                        if name in state_vector_names[i_sounding]: continue
                        thisdata[PREFIX+name.replace(" ","_")] . append( 0 )

            h.close()

            #James' aggregator doesn't add windspeed variables if over land like SDS does, so add them in with negative 999999 as filler.
            # for key in ('L2/RetrievalResults/wind_speed',
            #             'L2/RetrievalResults/wind_speed_apriori',
            #             'L2/RetrievalResults/wind_speed_uncert',
            #             'L2/RetrievalResults/fluorescence_at_reference',
            #             'L2/RetrievalResults/fluorescence_at_reference_apriori',
            #             'L2/RetrievalResults/fluorescence_at_reference_uncert',
            #             'L2/RetrievalResults/fluorescence_slope',
            #             'L2/RetrievalResults/fluorescence_slope_apriori',
            #             'L2/RetrievalResults/fluorescence_slope_uncert',
            #             'L2/PreprocessingResults/selection_priority'
            #             ):
            #     if not key in thisdata: thisdata[key] = N.zeros(numpoints, dtype = N.float32 ) - 999999


            #Remove any regex characters from the names of keys in thisdata
            for key in thisdata:
                newkey = mlib_regex.strip_special_from_strings(key)
                if newkey != key:
                    thisdata[newkey] = thisdata[key]
                    del thisdata[key]

            #Append into self.data
            self.data.update(thisdata)

            print N.int(mlib_log.end_time(T)),

        if progressbar:
            statusbar.finish()

        print "float32",
        T = mlib_log.start_time()

        #Ensure Mandrake fields are float32
        for f in self.data.features:
            if (self.data[f].dtype == N.float64) and ("Mandrake" in f) and not ("J20" in f) and not ("radiance" in f) and not ("decimal" in f):
                self.data[f] = self.data[f].astype(N.float32, copy = False)

        #Ensure no useless features slipped in (usually from undoing matrices like the averaging kernel)
        for f in self.data.features:
            if mlib_string.any_within(dogo_lib_feature_filter.UNDESIRED_FEATURE_PATTERNS, f):
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
