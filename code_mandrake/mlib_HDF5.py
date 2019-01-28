##-----------------------------------------------------------------
##-----------------------------------------------------------------
##
## Mandrake lib (mlib) for handling HDF5 files
##
##-----------------------------------------------------------------
##-----------------------------------------------------------------

import numpy as N
import mlib_shell as S
import mlib_formatting
from mlib_iterable import is_iterable
from mlib_iterable import is_not_iterable
from mlib_progressbar import bar_nospam
import mlib_string
import collections as C
import mlib_types
import time
import h5py
import gc #garbage collection

##-----------------------------------------------------------------
#Utility functions for converting headers to indices
##-----------------------------------------------------------------

#look up the index in headers of a partial string match,
#take the shortest matching header as most likely correct
#return index
# def fastindex(headers, string):
#     #find all matching headers
#     matches = [(len(x),c) for c,x in enumerate(headers) if string in x]
#     if len(matches) == 0: raise IndexError("***ERROR: could not locate "+string+" in ",headers)
#     #sort the matches by size (increasing)
#     matches = sorted(matches)
#     #return the shortest match's index
#     return matches[0][1]

#Pass a bunch of approximate header names and receive the appropriate indices
#Ensure that the smallest matching header is returned for each, so that
#xco2 matches to xco2 instead of xco2_uncertainty or xco2_apriori
# def approx_headers_to_indices(names_desired, headers):
#     if not is_iterable(names_desired): names_desired=[names_desired,]
#     return N.array([ fastindex(headers, x) for x in names_desired ])

#Pass a bunch of approximate header names and receive the matching fullnames
# def approx_headers_to_full_headers(names_desired, headers):
#     headers = N.array(headers)
#     return headers[approx_headers_to_indices(names_desired, headers)]

#Ensure that usecols (can be indices or strings, singleton or array) ends up as an array of indices
#only uses headers if needed for conversion to indices
# def sanitize_usecols_to_indices(usecols, headers = None):
#     #handle the singleton usecols case
#     if usecols is not None:
#         #singleton integer
#         if   type(usecols) in (N.int, N.int32, N.int64, int):
#             usecols = [usecols,]
#         #singleton string
#         elif type(usecols) in (str, N.string_):
#             usecols = approx_headers_to_indices(usecols,headers)
#         #array or list
#         elif is_iterable(usecols):
#             #array of strings
#             if type(usecols[0]) in (str, N.string_):
#                 usecols = approx_headers_to_indices(usecols, headers)
#     return usecols

##-----------------------------------------------------------------
#These functions permit access to HDF5 files as written directly by H5PY
#and user programs. Files are rational, HDFVIEW compliant, and legible.
#Numpy and Python objects may be stored in this way.
#Some compression schemes are HDFVIEW compliant, while others are not.
#Recommend using None compression, as difference in filesize ~2.5 at most
#and significant speedup results
#
#Data is returned as a dictionary of NDarrays whose types are defined
#within the HDF file itself.
#
#DataDict flag will instead return a DataDict object with ordered headers
#randomsample, if set to an integer, will randomly sample the file N times without replacement (from the number of rows present in maxrows)
# if randomsample > numrows in the file, no random sampling is performed and the whole file is taken.
#if mask provided, is applied to all requested feature columns. Supercedes randomsample and maxrows
#usecols specifies which features/columns/datasets to read, None indicates read all. May be integer indices or string names.
#ignorecols specifies whcih features/columns/datasets to ignore, overwriting usecols when in conflict.
#with_replacement causes the randomsample function to use replacement during draws
#randomseed INT, resets the random seed if requested for reproducable behavior
#retry, default None, otherwise (max_tries, num_seconds_wait)
##-----------------------------------------------------------------

def read(filename, usecols = None, ignorecols = None, DataDict = True, maxrows = None, randomsample = None, with_replacement = False, mask = None, literal = False, randomseed = None, progressbar = False, retry = None):

    """Read in an hdf5 file and return as data object."""

    import mlib_datadict as DD

    #handle mask sanitization. Strangely, h5py requires either a boolean array or a LIST of integers.
    #To avoid complexity, just transform into a boolean mask (we know these are fast and work well)
    if mask is not None:
        if not (isinstance(mask, N.ndarray) and mlib_types.isbool(mask[0])):
            #convert mask into a boolean mask, because otherwise things go awry quickly
            temp = N.zeros(read_numrows(filename),dtype='bool')
            mask = N.array(mask)
            temp[mask] = True
            mask = temp

    headers = read_headers(filename, retry = retry)
    #use a DataDict because of its impressive usecols header selection
    data = DD.DataDict()
    data.features = headers

    #resolve usecols to full headers in file
    if usecols is not None:
        usecols = data.resolve_features(usecols, multiple=True, literal = literal)

    #test for empty usecols list (but not None), so return empty dataset
    if usecols is not None and len(usecols) == 0:
        if DataDict: return DD.DataDict()
        else       : return {}

    if ignorecols is not None:
        ignorecols = data.resolve_features(ignorecols, multiple=True, literal = literal)

    thismask = None

    if maxrows is not None: maxrows = int(maxrows)

    #Turn off randomsample if requested equal to or more points than are in the file
    if (randomsample is not None):

        numrows = read_numrows(filename)
        if maxrows is None: maxrows = numrows
        if  randomsample >= numrows:
            randomsample = None
        else:
            if randomseed is not None: N.random.seed(randomseed)
            indices = N.random.choice(range(int(maxrows)), int(randomsample), replace = with_replacement)
            thismask = N.zeros((numrows,),dtype='bool')
            thismask[indices] = True

    #Handle user-specified mask case directly
    if mask is not None:
        thismask = mask

    #perform reading, retry every retry[1] seconds if IOError encountered to avoid problemmatic file system
    data     = {}
    hdf5file = retry_h5file(filename,'r',retry)

    if progressbar:
        itera = bar_nospam(headers)
    else:
        itera = headers

    for head in itera:
        if (usecols is None) or (head in usecols):
            if (ignorecols is None) or not (head in ignorecols):
                #handle random sampling case
                if thismask is not None:
                    if maxrows is not None:
                        data[head] = hdf5file[head][:maxrows][thismask]
                    else:
                        data[head] = hdf5file[head]          [thismask]
                #handle non-sampled but maxrows limited case
                else:
                    if maxrows is not None:
                        data[head] = hdf5file[head][:maxrows]
                    else:
                        data[head] = hdf5file[head][:]          #alternative to the .value method that's horribly slow

    if DataDict:
        import mlib_datadict
        data = mlib_datadict.DataDict(data)

    hdf5file.close()

    return data

#returns a simple Numpy array for a single column by name or index
def read_column(filename, column, maxrows = None, randomsample = None, literal = False, mask = None, retry = None):

    data = read(filename, usecols = [column,], maxrows = maxrows, randomsample = randomsample, mask = mask, literal = literal, retry = retry)

    #Handle failure to find column name
    if len(data.features) == 0: return N.array([])

    #If multiple columns were returned, select the one with the smallest name
    smallest_feat = sorted([(len(x),x) for x in data.features])[0][1]
    return data[smallest_feat]

def retry_h5file(filename, mode = 'r', retry = None):

    """Attaches to a h5file with some amount of retry persistence for a laggy file system.

    Arguments:
             filename: Path to h5 file
             mode    : 'r', 'w', etc.
             retry   : (number_of_retries_max, num_seconds_to_sleep_between_retries); None (default) = (1, 0)

    """

    if retry is None: retry = (1, 0)

    #perform reading, retry every retry[1] seconds if IOError encountered to avoid problemmatic file system
    num_tries = 0
    while True:

        try:
            return h5py.File(filename,'r')

        except (IOError,):
            num_tries +=1
            if num_tries == retry[0]: raise
            time.sleep(retry[1])

#returns the headers (feature names,  column headers) present in the store
def read_headers(filename, retry = None):

    f = retry_h5file(filename,'r', retry)
    #visit is a strange function; it calls a given function for every container in the HDF file
    headers = []
    f.visit(headers.append)
    #remove the directory-only containers and keep the actual data arrays
    headers = [str(x) for x in headers if f.get(x, getclass=True) != h5py.Group]
    f.close()
    return headers

#returns the contents of the store attribute 'numrows' that we use to store the size of the file
#this is by our own convention, and a general HDF file will not have this as columns can be of varying lengths
def read_numrows(filename, retry = None):
    with retry_h5file(filename,'r',retry) as f:
        try:
            numrows = f.attrs['numrows']
        except:
            #No numrows element, so we need to manually take the length of the first column
            headers = read_headers(filename            )
            var     = read_column (filename, headers[0])
            numrows = len(var)
    return numrows

def read_numrows_numfeats(filename):
    numrows   = read_numrows(filename)
    numfeats = len(read_headers(filename))
    return numrows, numfeats

#scan through an HDF5 file and report vital details, especially those that might cause later problems
def test(filename):

    retstr = ""
    allok = True

    try:
        numrows = read_numrows(filename)
    except Exception:
        numrows = None

    if numrows is None:
        retstr += "***Warning: Numrows attribute is not present\n"
        allok = False

    headers = read_headers(filename)

    if len(headers) < 1:
        allok = False
        retstr += "***Warning: No columns/features/datasets included in this file\n"

    type_per_feature   = {}
    numrow_per_feature = {}
    numnan_per_feature = {}
    numbad_per_feature = {}
    BADVALS = (-999999, -999)
    for h in headers:
        coldata = read_column(filename, h)
        numrow_per_feature[h] = len(coldata)
        numnan_per_feature[h] = N.sum(N.isnan(coldata))
        numbad_per_feature[h] = N.sum(N.in1d(coldata, BADVALS))
        type_per_feature  [h] = coldata.dtype

    most_common_length = N.median([numrow_per_feature[h] for h in headers])

    if (numrows is not None) and (numrows != most_common_length):
        allok = False
        retstr += "***Warning: Numrows attribute does not match most common column length\n"

    for h in sorted(headers):
        outstring = ""

        if numrow_per_feature[h] != most_common_length:
            outstring += "BADNUMROWS "
        else:
            outstring += "           "

        if numnan_per_feature[h] > 0:
            outstring += "NANPRESENT "
        else:
            outstring += "           "

        if numbad_per_feature[h] > 0:
            outstring += "BADPREVENT "
        else:
            outstring += "           "

        retstr += outstring+" "+mlib_formatting.prettyfraction(numrow_per_feature[h], most_common_length)+" "+h+" "+str(type_per_feature[h])+"\n"

    return retstr


#Uses the native h5py library to write a dictionary of NDarrays
#compressionlevel only used for gzip compression type
#compressionmethod = ['lzf','gzip',None]
#data can be a dictionary of NDarrays/lists or a DataDict object
def write(filename, data, compressionmethod = None, compressionlevel = 9, bar = False):
    import mlib_datadict as DD

    data = DD.DataDict(data)
    numsamples, numfeatures = data.numsamples_numfeatures()

    #'latest' uses the latest and greatest HDF technology for improved performance
    #but may be less compatible with older HDF readers. If so, use 'earliest' to
    #increase compatibility. Default is 'earliest' alas.
    store = h5py.File(filename,'w', libver='latest')

    #Write an attribute describing the number of soundings included to the head file itself
    store.attrs['numrows'] = numsamples

    #Show progress bar if requested
    if bar:
        from mlib_progressbar import bar_nospam
        f = bar_nospam(data.features)
    else:
        f = data.features

    for key in f:

        if data[key].dtype == 'O': raise Exception('Cannot store dtype to HDF, must cast as |S or other familar type: '+key+' '+repr(data[key].dtype))

        if compressionmethod == "lzf":
            dset = store.create_dataset(key, data = data[key],
                                        compression = compressionmethod,
                                        shuffle = True) #Shuffle can increase compression with no significant speed penalty
        elif compressionmethod == None:
            dset = store.create_dataset(key, data = data[key],)

        elif compressionmethod == "gzip":
            dset = store.create_dataset(key, data = data[key],
                                        compression = compressionmethod,
                                        compression_opts = compressionlevel,
                                        shuffle = True) #Shuffle can increase compression with no significant speed penalty

    store.close()

#Makes a copy of an existing h5 file and applies a subselection mask
#number_desired specifies the final number of rows desired, if left None must specify a mask_to_keep
#with_replacement guides the sub_selection if number_desired is specified
#preselection_mask separates out a sub-population that should be first selected from before truly randomly sampling
#mask_to_keep overrides the above options and select precise the boolean mask / indices in the user mask
def copy_subset(infile, outfile, number_desired = None, with_replacement = False, mask_to_keep = None,
                preselect = None, compressionmethod = None, compressionlevel = 9, bar = False):
    if number_desired is None and mask_to_keep is None:
        #just copy the file directly, nothing to do
        S.ex("cp "+infile+" "+outfile)
        return

    data = read(infile, DataDict = True)

    if mask_to_keep is not None:
        data.apply_mask(mask_to_keep)
    else:
        data = data.create_subsample( number_desired, with_replacement = with_replacement, preselect = preselect)

    write (outfile, data, compressionmethod = compressionmethod, compressionlevel = compressionlevel, bar = bar)

#alternative method for writing that simply opens a store, permitting user to iteratively add datasets (columns) as needed
def write_open(filename, numrows = N.nan):
    store = h5py.File(filename,'w')
    store.attrs['numrows'] = numrows
    return store

#similar to write_open, but first copies all the fields currently in infile into outfile, then leaves open for additions
#features_to_ignore is an array of feature patterns to not include in the copy over (useful if you are going to recompute them)
def copy_and_leave_open(infilename, outfilename, features_to_ignore = []):

    store = h5py.File(outfilename,'w')

    #copy over the numrows attribute
    store.attrs['numrows'] = read_numrows(infilename)

    #copy over all existing data
    for h in read_headers(infilename):
        if mlib_string.any_within(features_to_ignore, h): continue
        store[h] = read_column(infilename, h)

    #return open h5 object for further writing, do not yet close
    return store

#Add a new column (dataset) to an open store or replace one already there
def write_column(store, column_name, column_data, dtype = None):
    if dtype is not None:
        store.create_dataset(column_name, data = column_data.astype(dtype))
    else:
        store.create_dataset(column_name, data = column_data)

#close an open store, included for syntactic completeness
def write_close(store):
    store.close()

#add or replace a data column in an existing H5 file
def add_column_to_file(filename, column_name, column_data):
    store = h5py.File(filename)
    if column_name in store: del store[column_name]
    store[column_name] = column_data
    store.close()

#delete a column to an existing H5 file
def delete_column_from_file(filename, column_name):
    store = h5py.File(filename)
    if column_name in store: del store[column_name]
    store.close()

#rename a column in an existing H5 file
def rename_column_in_file(filename, old_column_name, new_column_name):
    store = h5py.File(filename)
    if not old_column_name in store: raise Exception("Old column name not found in h5file: "+old_column_name)
    if     new_column_name in store: raise Exception("New column name already present in h5file: "+new_column_name)
    store.move(old_column_name, new_column_name)
    store.close()

#combine two existing HDF5 files together by simply grouping their columns together into a single new file
#Takes numrows from the first file to combine naively
#Checks for column name collisions and renames appropriately if found
#Warns if the number of rows (samples) is not the same in the two files, but proceeds
#"no_warn = True" overrides warnings and makes process silent
def combine_files(outfilename, *infilenames, **kwargs):

    warn = ("no_warn" not in kwargs) or (not kwargs["no_warn"])

    if len(infilenames) < 2:
        raise Exception("Must pass at least two files to combine")

    #Report on numrows for each file if requested
    if warn:
        numrows = N.array([read_numrows(x) for x in infilenames])
#        print numrows
        if (numrows - N.mean(numrows) != 0).any():
            print "***Warning! Combined files with differing numrows"
            for n,f in zip(numrows, infilenames):
                print n,":",f

    outfile = write_open(outfilename, read_numrows(infilenames[0]))

    headers_used = {}
    for fi, infile in enumerate(infilenames):
        for h in read_headers(infile):
            if h in headers_used:
                new_h = h+"(%d)"%fi
                if warn: print "***Warning! Feature collision required rename",h,new_h
            else:
                new_h = h

            headers_used[new_h] = True

            write_column(outfile, new_h, read_column(infile, h))

#Compare whether two files are identical in all the ways HDF files matter, not in a byte-sense
#report will return a string list of what's different
def compare_files(file1, file2, report = False):

    #Check quick things first
    if read_numrows(file1) != read_numrows(file2):
        if report: return False, "Numrows attribute set differently %d/%d"%(read_numrows(file1), read_numrows(file2))
        else     : return False

    headers1 = read_headers(file1)
    headers2 = read_headers(file2)

    if len(headers1) != len(headers2):
        if report: return False, "Header number differs %d/%d"%(len(headers1),len(headers2))
        else     : return False

    if headers1 != headers2:
        if report: return False, "Header elements differ, non-common headers: "+" ".join([x for x in headers1+headers2 if (not x in headers1) or (not x in headers2) ])
        else     : return False

    #Do comprehensive data comparison
    for feat in headers1:
        d1 = read_column(file1, feat)
        d2 = read_column(file2, feat)
        if ( (d1 != d2) & ~ (N.isnan(d1) & N.isnan(d2)) ).any():
            if report: return False, "Feat %s data differs"%feat
            else     : return False

    if report: return True, "Match"
    else     : return True



##-----------------------------------------------------------------
#These functions are written specifically to handle
#Pandas objects. They utilize entirely the Pandas HDF5Store interface.
#Advantages include very fancy data load slicing, and native Pandas Dataframe
#storage. Normal HDF5 can't handle Pandas data types.
#Disadvantages include bizarre internal HDF file layout (irrational) and more
#complex interface (hopefully abstracted away in these wrappers)
#
#Data returned as a Pandas DataFrame object
##-----------------------------------------------------------------

#DATAFRAME_NAME = 'dataframe'

    #Can also include chunksize=nrows and iterator=True to return pieces of the file for iterative processing!
    #Where command can handle conditional row selection
    #where='A=["foo","bar"] & B=1'

# #where can be a string or array of strings describing conditions to require before loading data
# #these can be abbreviated headers and will be expanded to the smallest matching header
# #Example forms: (xco2 < 340) & (xco2 > 300) & (roughness < 0.1) & (flag != 4)
# def read_pandas(filename, maxrows = None, usecols = None, where = None):
#     import pandas as PA
#     headers = read_headers_pandas(filename)
#     if usecols is not None: usecols = sanitize_usecols_to_indices(usecols, headers)
#     if maxrows is not None: maxrows = int(maxrows)

#     #support the where option to perform conditional subselection
#     #This is, in general, an array of string conditionals such as 'roughness < 6'
#     #want user to be able to freely use subsets of column names unless they are ambiguous
#     if where is not None:
#         raise Exception(
# """'where' option not currently enabled due to extremely limited relevance.
# Uncomment code to activate.
# Save HDF files as data_columns=True to permit access.
# Extreme write times will result.""")
#         # if is_not_iterable(where): where=[where,]
#         # headers = read_headers_pandas(filename)
#         # where = expand_column_names_in_selection(where, headers)

#     dataframe = PA.read_hdf(filename,DATAFRAME_NAME, start = 0, stop = maxrows, columns = headers[usecols], where = where)
#     return dataframe

# def read_headers_pandas(filename):
#     import pandas as PA
#     dataframe = PA.read_hdf(filename, DATAFRAME_NAME, start = 0, stop = 0)
#     return dataframe.columns.values

# def read_numrows_pandas(filename):
#     import pandas as PA
#     with PA.HDFStore(filename,mode='r') as f:
#         numrows = f.get_storer(DATAFRAME_NAME).nrows
#     return numrows

# #NOTE! Using data_columns = True (all columns can be used as an index) cause orders of magnitude slow-down in
# #file writing and an increase in file size (quote %'s here for read, write, and disk size).
# #However, it is required if you think you want to conditionally load only certain data
# #Suggests that for DOGO programs, we want to bless certain columns to be indexable in this way
# def write_pandas(filename, data, mode='w', compressionmethod = None, complevel = 9):
#     import pandas as PA
#     if compressionmethod is None: complevel = 0
#     store = PA.HDFStore(filename, complevel=complevel, complib=compressionmethod, mode=mode)
#     store.put(DATAFRAME_NAME, PA.DataFrame(data), format='table')#, data_columns = True)
#     store.close()



#--------------------------------
def subsample ( infile, outfile, num_req, group_by = None, link = True , bar = False):
    """ Subsamples an h5 file either with random sampling with replacement or via a grouping selection.
    Args:
        infile  : An input h5 file
        outfile : The output h5 file to produce (or simply link to if appropriate)
        num_req : The number of samples requested. Will return as close to this number as possible.
        group_by: A feature / header / column name to group by. Selections will be made for entire groups only.
        link    : Make a softlink if the file is already beneath the desired size. False will make a new file instead.
        bar     : Whether to generate a progressbar or not during writing. Default false.
    Returns:
        num_accepted: The number of samples selected. Will not always equal the number requested. May be smaller or (slightly) larger.

    >>> infile  = repo_path()+"/doctest_files/sample_oco2.h5"
    >>> outfile = repo_path()+"/doctest_working/sample_oco2_subsamp.h5"

    >>> numrows = read_numrows(infile)
    >>> numrows
    1000

    >>> S.rm(outfile)

    Request too many samples, so just copies file. First with linking
    >>> subsample(infile, outfile, numrows * 2, link = True)
    1000
    >>> S.exists(outfile)
    True
    >>> numrows == read_numrows(outfile)
    True
    >>> S.islink(outfile)
    True

    >>> S.rm(outfile)

    Do it again, but don't permit linking. Now it'll be copy of the original.
    >>> subsample(infile, outfile, numrows * 2, link = False)
    1000
    >>> S.exists(outfile)
    True
    >>> numrows == read_numrows(outfile)
    True
    >>> S.islink(outfile)
    False

    >>> S.rm(outfile)

    Now request half the file, so we really have to work
    >>> N.random.seed(0)
    >>> subsample(infile, outfile, numrows / 2)
    500
    >>> S.exists(outfile)
    True
    >>> read_numrows(outfile)
    500

    >>> S.rm(outfile)

    Finally, request half the file but by grouping the feature "SA"
    >>> N.random.seed(0)
    >>> subsample(infile, outfile, numrows / 2, group_by = 'SA')
    672
    >>> S.exists(outfile)
    True

    Note that because we required it to select entire groups, the number of captured samples is at LEAST our request and likely larger
    >>> read_numrows(outfile)
    672

    Now check to see how many group ID's are left and their counts
    >>> SA = read_column(infile, 'SA')
    >>> C.Counter(SA)
    Counter({1000009: 328, 1000005: 240, 1000013: 190, 1000016: 127, 1000017: 115})

    >>> SA = read_column(outfile, 'SA')
    >>> C.Counter(SA)
    Counter({1000005: 240, 1000013: 190, 1000016: 127, 1000017: 115})

    """

    #If we selected more than's in the file, just copy the file
    if num_req >= read_numrows(infile):
        if link:
            S.symlink(infile, outfile)
        else:
            S.cp     (infile, outfile)

        num_accepted = read_numrows(infile)

    else:

        #Handle simple random selection case
        if group_by is None:
#            print "Selecting mask, random sample without replacement"
            mask = N.random.choice(read_numrows(infile), num_req, replace = False)
            num_accepted = len(mask)

        else:
            group_ids       = read_column(infile, group_by)
            group_id_counts = C.Counter(group_ids)

            ids_accepted = []
            num_accepted = 0
            for id in N.random.choice(group_id_counts.keys(), len(group_id_counts), replace = False):
                ids_accepted += [id,]
                num_accepted += group_id_counts[id]
                if num_accepted >= num_req: break

#            print "Forming group_ids mask by random sampling without replacement USING group_idsid (won't break up any small areas)"
            mask = N.in1d(group_ids, ids_accepted)

#        print "Reading/writing each subsampled feature"
        features = read_headers(infile)
        out      = write_open(outfile, num_accepted)
        for feat in (bar_nospam(features) if bar else features): write_column(out, feat, read_column(infile, feat, mask = mask) )

    return num_accepted

#--------------------------------
def unify_iterated_files(source_paths, min_filesize_bytes = 3000, max_memory_bytes = 490e9, destination_path = None, verbose = False, progressbar = False):
    """ This function reads in a potentially large number of .h5 files and merges them into a single destination file.
    Uncommon features are padded to ensure all data is properly tabulated and included in final file.
    Uniqueness of files and the special field sounding_id are guarenteed, making this more specific to GOSAT/OCO2 data processing at the moment.
    The last mention of a sounding_id will be kept based on alphanumeric sorting of input filenames.

    Args:
        source_paths      : A list of h5 dataset paths to include. Globs ok.
        min_filesize_bytes: Any files with a size below this, in bytes, will not be unified
        max_memory_bytes  : The maximum memory (approximate) to use during unification. This determines how many "trips" are necessary.
                            The more memory available, the faster the unification. Default: 3.5e9 (GB)
        destination_path  : A complete path specification for the output .h5 file.
                            If None (default), will auto-generate using the most common prefix among the input paths.
        verbose           : Boolean flag on whether to print status or silently proceed. (default False)
        progressbar       : Display a textual progressbar to update user on time remaining (default False)

    Prepare the source paths
    >>> testdir = repo_path() + "/doctest_working/unify/"
    >>> S.rm   (testdir)
    >>> S.mkdir(testdir)
    >>> S.cp(repo_path() + "/doctest_files/unify/*.h5", testdir)

    Create a new unified file
    >>> unify_iterated_files(testdir + "*.h5", verbose = False)

    Very that all observations ended up in the appended file
    >>> infiles  = [x for x in S.glob(testdir+'*.h5') if not "unified" in x]
    >>> destfile = [x for x in S.glob(testdir+'*.h5') if     "unified" in x][0]
    >>> numsamp_source = [read_numrows(x) for x in infiles]
    >>> numsamp_dest   = read_numrows(destfile)
    >>> numsamp_dest == N.sum(numsamp_source)
    True

    Verify the same features in source and destination
    >>> feat_source = [read_headers(x) for x in infiles]
    >>> feat_dest   =  read_headers(destfile)
    >>> N.all([N.all(N.array(sorted(featlist)) == N.array(sorted(feat_dest))) for featlist in feat_source])
    True

    This will force the test to use small feature groups of 5
    >>> unify_iterated_files(testdir + "*.h5", verbose = True, max_memory_bytes = 4000)
    Removing destination path from source paths
    <BLANKLINE>
    Output file set to       : /home/mandrake/DOGO/doctest_working/unify/Data_acos_L2f_09042_unified.h5
    Files discovered to unify: 3
    <BLANKLINE>
    Files that are sufficiently large 3
    Scanning files to unify
    Header Report for 3 files
    timesseen type header
    --------- ---- ------
    3 float32 GOSATL2/ABandCloudScreen/albedo_o2_cld_0
    3 float32 GOSATL2/ABandCloudScreen/albedo_o2_cld_1
    3 float64 GOSATL2/ABandCloudScreen/dispersion_multiplier_cld
    3 float32 GOSATL2/ABandCloudScreen/noise_o2_cld
    3 float32 GOSATL2/ABandCloudScreen/reduced_chi_squared_o2_cld
    3 float32 GOSATL2/ABandCloudScreen/reduced_chi_squared_o2_threshold_cld
    3 float32 GOSATL2/ABandCloudScreen/signal_o2_cld
    3 float32 GOSATL2/ABandCloudScreen/snr_o2_cld
    3 float32 GOSATL2/ABandCloudScreen/surface_pressure_apriori_cld
    3 float32 GOSATL2/ABandCloudScreen/surface_pressure_cld
    3 float32 GOSATL2/ABandCloudScreen/surface_pressure_delta_cld
    3 float32 GOSATL2/ABandCloudScreen/surface_pressure_offset_cld
    3 float32 GOSATL2/ABandCloudScreen/temperature_offset_cld
    3 float32 GOSATL2/IMAPDOASPreprocessing/co2_ratio_idp
    3 float32 GOSATL2/IMAPDOASPreprocessing/delta_d_idp
    3 float32 GOSATL2/IMAPDOASPreprocessing/delta_d_uncert_idp
    3 float32 GOSATL2/IMAPDOASPreprocessing/h2o_ratio_idp
    3 float32 GOSATL2/IMAPDOASPreprocessing/o2_ratio_p_idp
    3 float32 GOSATL2/IMAPDOASPreprocessing/o2_ratio_s_idp
    3 float32 GOSATL2/IMAPDOASPreprocessing/out_of_band_transmission_p_idp
    3 float32 GOSATL2/IMAPDOASPreprocessing/out_of_band_transmission_s_idp
    3 float32 GOSATL2/IMAPDOASPreprocessing/total_offset_fit_relative_755nm_p_idp
    3 float32 GOSATL2/IMAPDOASPreprocessing/total_offset_fit_relative_755nm_s_idp
    3 float32 GOSATL2/IMAPDOASPreprocessing/total_offset_fit_relative_771nm_p_idp
    3 float32 GOSATL2/IMAPDOASPreprocessing/total_offset_fit_relative_771nm_s_idp
    3 int8 GOSATL2/RetrievalHeader/ct_observation_points
    3 float32 GOSATL2/RetrievalHeader/dispersion_offset_shift_0
    3 float32 GOSATL2/RetrievalHeader/dispersion_offset_shift_1
    3 float32 GOSATL2/RetrievalHeader/dispersion_offset_shift_2
    3 float32 GOSATL2/RetrievalHeader/exposure_duration
    3 int32 GOSATL2/RetrievalHeader/exposure_index
    3 int8 GOSATL2/RetrievalHeader/gain_swir
    3 int8 GOSATL2/RetrievalHeader/glint_flag
    3 int64 GOSATL2/RetrievalHeader/sounding_id_reference
    3 uint32 GOSATL2/RetrievalHeader/sounding_qual_flag
    3 float32 GOSATL2/RetrievalResults/aerosol_total_aod
    3 float32 GOSATL2/RetrievalResults/aerosol_total_aod_high
    3 float32 GOSATL2/RetrievalResults/aerosol_total_aod_low
    3 float32 GOSATL2/RetrievalResults/aerosol_total_aod_mid
    3 float32 GOSATL2/RetrievalResults/albedo_apriori_o2_fph
    3 float32 GOSATL2/RetrievalResults/albedo_apriori_strong_co2_fph
    3 float32 GOSATL2/RetrievalResults/albedo_apriori_weak_co2_fph
    3 float32 GOSATL2/RetrievalResults/albedo_o2_fph
    3 float32 GOSATL2/RetrievalResults/albedo_slope_o2
    3 float32 GOSATL2/RetrievalResults/albedo_slope_strong_co2
    3 float32 GOSATL2/RetrievalResults/albedo_slope_uncert_o2
    3 float32 GOSATL2/RetrievalResults/albedo_slope_uncert_strong_co2
    3 float32 GOSATL2/RetrievalResults/albedo_slope_uncert_weak_co2
    3 float32 GOSATL2/RetrievalResults/albedo_slope_weak_co2
    3 float32 GOSATL2/RetrievalResults/albedo_strong_co2_fph
    3 float32 GOSATL2/RetrievalResults/albedo_uncert_o2_fph
    3 float32 GOSATL2/RetrievalResults/albedo_uncert_strong_co2_fph
    3 float32 GOSATL2/RetrievalResults/albedo_uncert_weak_co2_fph
    3 float32 GOSATL2/RetrievalResults/albedo_weak_co2_fph
    3 float32 GOSATL2/RetrievalResults/co2_vertical_gradient_delta
    3 float64 GOSATL2/RetrievalResults/dispersion_offset_apriori_o2
    3 float64 GOSATL2/RetrievalResults/dispersion_offset_apriori_strong_co2
    3 float64 GOSATL2/RetrievalResults/dispersion_offset_apriori_weak_co2
    3 float64 GOSATL2/RetrievalResults/dispersion_offset_o2
    3 float64 GOSATL2/RetrievalResults/dispersion_offset_strong_co2
    3 float64 GOSATL2/RetrievalResults/dispersion_offset_weak_co2
    3 int16 GOSATL2/RetrievalResults/diverging_steps
    3 float32 GOSATL2/RetrievalResults/dof_full_vector
    3 float32 GOSATL2/RetrievalResults/fluorescence_at_reference
    3 float32 GOSATL2/RetrievalResults/fluorescence_slope
    3 float32 GOSATL2/RetrievalResults/h2o_scale_factor
    3 int16 GOSATL2/RetrievalResults/iterations
    3 float32 GOSATL2/RetrievalResults/last_step_levenberg_marquardt_parameter
    3 int8 GOSATL2/RetrievalResults/outcome_flag
    3 float32 GOSATL2/RetrievalResults/surface_pressure_apriori_fph
    3 float32 GOSATL2/RetrievalResults/surface_pressure_fph
    3 float32 GOSATL2/RetrievalResults/surface_pressure_uncert_fph
    3 int8 GOSATL2/RetrievalResults/surface_type
    3 float32 GOSATL2/RetrievalResults/temperature_offset_fph
    3 float32 GOSATL2/RetrievalResults/temperature_offset_uncert_fph
    3 float32 GOSATL2/RetrievalResults/wind_speed
    3 float32 GOSATL2/RetrievalResults/wind_speed_apriori
    3 float32 GOSATL2/RetrievalResults/wind_speed_uncert
    3 float32 GOSATL2/RetrievalResults/xco2
    3 float32 GOSATL2/RetrievalResults/xco2_apriori
    3 float32 GOSATL2/RetrievalResults/xco2_uncert
    3 float32 GOSATL2/RetrievalResults/xco2_uncert_interf
    3 float32 GOSATL2/RetrievalResults/xco2_uncert_noise
    3 float32 GOSATL2/RetrievalResults/xco2_uncert_smooth
    3 float32 GOSATL2/RetrievalResults/zero_level_offset_apriori_o2
    3 float32 GOSATL2/RetrievalResults/zero_level_offset_o2
    3 float32 GOSATL2/RetrievalResults/zero_level_offset_uncert_o2
    3 float32 GOSATL2/SoundingGeometry/sounding_altitude
    3 float32 GOSATL2/SoundingGeometry/sounding_altitude_max
    3 float32 GOSATL2/SoundingGeometry/sounding_altitude_min
    3 float32 GOSATL2/SoundingGeometry/sounding_altitude_stddev
    3 float32 GOSATL2/SoundingGeometry/sounding_altitude_uncert
    3 float32 GOSATL2/SoundingGeometry/sounding_aspect
    3 float32 GOSATL2/SoundingGeometry/sounding_at_angle
    3 float32 GOSATL2/SoundingGeometry/sounding_at_angle_error
    3 float32 GOSATL2/SoundingGeometry/sounding_azimuth
    3 float32 GOSATL2/SoundingGeometry/sounding_ct_angle
    3 float32 GOSATL2/SoundingGeometry/sounding_ct_angle_error
    3 float32 GOSATL2/SoundingGeometry/sounding_glint_angle
    3 float32 GOSATL2/SoundingGeometry/sounding_land_fraction
    3 float32 GOSATL2/SoundingGeometry/sounding_latitude
    3 float32 GOSATL2/SoundingGeometry/sounding_longitude
    3 float32 GOSATL2/SoundingGeometry/sounding_slope
    3 float32 GOSATL2/SoundingGeometry/sounding_solar_azimuth
    3 float32 GOSATL2/SoundingGeometry/sounding_solar_zenith
    3 float32 GOSATL2/SoundingGeometry/sounding_zenith
    3 float32 GOSATL2/SpectralParameters/noise_o2_fph
    3 float32 GOSATL2/SpectralParameters/noise_strong_co2_fph
    3 float32 GOSATL2/SpectralParameters/noise_weak_co2_fph
    3 float32 GOSATL2/SpectralParameters/reduced_chi_squared_o2_fph
    3 float32 GOSATL2/SpectralParameters/reduced_chi_squared_strong_co2_fph
    3 float32 GOSATL2/SpectralParameters/reduced_chi_squared_weak_co2_fph
    3 float32 GOSATL2/SpectralParameters/relative_residual_mean_square_o2
    3 float32 GOSATL2/SpectralParameters/relative_residual_mean_square_strong_co2
    3 float32 GOSATL2/SpectralParameters/relative_residual_mean_square_weak_co2
    3 float32 GOSATL2/SpectralParameters/residual_mean_square_o2
    3 float32 GOSATL2/SpectralParameters/residual_mean_square_strong_co2
    3 float32 GOSATL2/SpectralParameters/residual_mean_square_weak_co2
    3 float32 GOSATL2/SpectralParameters/signal_o2_fph
    3 float32 GOSATL2/SpectralParameters/signal_strong_co2_fph
    3 float32 GOSATL2/SpectralParameters/signal_weak_co2_fph
    3 float32 GOSATL2/SpectralParameters/snr_o2_l1b_0
    3 float32 GOSATL2/SpectralParameters/snr_o2_l1b_1
    3 float32 GOSATL2/SpectralParameters/snr_strong_co2_l1b_0
    3 float32 GOSATL2/SpectralParameters/snr_strong_co2_l1b_1
    3 float32 GOSATL2/SpectralParameters/snr_weak_co2_l1b_0
    3 float32 GOSATL2/SpectralParameters/snr_weak_co2_l1b_1
    3 float64 Mandrake/J2000
    3 float32 Mandrake/NCEP_T700
    3 float32 Mandrake/aerosol_BC_aod
    3 float32 Mandrake/aerosol_BC_aod_high
    3 float32 Mandrake/aerosol_BC_aod_low
    3 float32 Mandrake/aerosol_BC_aod_mid
    3 float32 Mandrake/aerosol_BC_gaussian_log_param_0
    3 float32 Mandrake/aerosol_BC_gaussian_log_param_1
    3 float32 Mandrake/aerosol_BC_gaussian_log_param_2
    3 float32 Mandrake/aerosol_DU_aod
    3 float32 Mandrake/aerosol_DU_aod_high
    3 float32 Mandrake/aerosol_DU_aod_low
    3 float32 Mandrake/aerosol_DU_aod_mid
    3 float32 Mandrake/aerosol_DU_gaussian_log_param_0
    3 float32 Mandrake/aerosol_DU_gaussian_log_param_1
    3 float32 Mandrake/aerosol_DU_gaussian_log_param_2
    3 float32 Mandrake/aerosol_Ice_aod
    3 float32 Mandrake/aerosol_Ice_aod_high
    3 float32 Mandrake/aerosol_Ice_aod_low
    3 float32 Mandrake/aerosol_Ice_aod_mid
    3 float32 Mandrake/aerosol_Ice_gaussian_log_param_0
    3 float32 Mandrake/aerosol_Ice_gaussian_log_param_1
    3 float32 Mandrake/aerosol_Ice_gaussian_log_param_2
    3 float32 Mandrake/aerosol_OC_aod
    3 float32 Mandrake/aerosol_OC_aod_high
    3 float32 Mandrake/aerosol_OC_aod_low
    3 float32 Mandrake/aerosol_OC_aod_mid
    3 float32 Mandrake/aerosol_OC_gaussian_log_param_0
    3 float32 Mandrake/aerosol_OC_gaussian_log_param_1
    3 float32 Mandrake/aerosol_OC_gaussian_log_param_2
    3 float32 Mandrake/aerosol_SO_aod
    3 float32 Mandrake/aerosol_SO_aod_high
    3 float32 Mandrake/aerosol_SO_aod_low
    3 float32 Mandrake/aerosol_SO_aod_mid
    3 float32 Mandrake/aerosol_SO_gaussian_log_param_0
    3 float32 Mandrake/aerosol_SO_gaussian_log_param_1
    3 float32 Mandrake/aerosol_SO_gaussian_log_param_2
    3 float32 Mandrake/aerosol_SS_aod
    3 float32 Mandrake/aerosol_SS_aod_high
    3 float32 Mandrake/aerosol_SS_aod_low
    3 float32 Mandrake/aerosol_SS_aod_mid
    3 float32 Mandrake/aerosol_SS_gaussian_log_param_0
    3 float32 Mandrake/aerosol_SS_gaussian_log_param_1
    3 float32 Mandrake/aerosol_SS_gaussian_log_param_2
    3 float32 Mandrake/aerosol_Water_aod
    3 float32 Mandrake/aerosol_Water_aod_high
    3 float32 Mandrake/aerosol_Water_aod_low
    3 float32 Mandrake/aerosol_Water_aod_mid
    3 float32 Mandrake/aerosol_Water_gaussian_log_param_0
    3 float32 Mandrake/aerosol_Water_gaussian_log_param_1
    3 float32 Mandrake/aerosol_Water_gaussian_log_param_2
    3 float32 Mandrake/airmass
    3 float32 Mandrake/blended_albedo
    3 float32 Mandrake/dP_fph
    3 float64 Mandrake/decimal_year
    3 float32 Mandrake/logBC_ICE_OC_SO
    3 float32 Mandrake/logdustwater
    3 float32 Mandrake/logdustwatersalt
    3 float32 Mandrake/max_radiance_o2
    3 float32 Mandrake/max_radiance_sco2
    3 float32 Mandrake/max_radiance_wco2
    3 float64 Mandrake/mean_radiance_o2
    3 float64 Mandrake/mean_radiance_sco2
    3 float64 Mandrake/mean_radiance_wco2
    3 float32 Mandrake/min_radiance_o2
    3 float32 Mandrake/min_radiance_sco2
    3 float32 Mandrake/min_radiance_wco2
    3 float32 Mandrake/snr_o2
    3 float32 Mandrake/snr_sco2
    3 float32 Mandrake/snr_wco2
    3 float64 Mandrake/std_radiance_o2
    3 float64 Mandrake/std_radiance_sco2
    3 float64 Mandrake/std_radiance_wco2
    <BLANKLINE>
    Total number of headers discovered 200
    <BLANKLINE>
    Num Redundant SID's: 0 / 92 = 0.0%
    <BLANKLINE>
    Writing out final file
    Will process 5 features at a time in 40 groups

    Very that all observations ended up in the appended file
    >>> numsamp_dest   = read_numrows(destfile)
    >>> numsamp_dest == N.sum(numsamp_source)
    True

    Verify the same features in source and destination
    >>> feat_dest   =  read_headers(destfile)
    >>> N.all([N.all(N.array(sorted(featlist)) == N.array(sorted(feat_dest))) for featlist in feat_source])
    True

    Does not test the redundant issues of OCO2 data

    """

    import mlib_datadict as DD

    files_to_unify = N.array(sorted(S.glob(source_paths)))

    #Figure out output name
    final_filename = destination_path if destination_path is not None else ( mlib_string.common_prefix(files_to_unify) +
                                                                             "_unified.h5" ).replace("__","_")

    if final_filename in files_to_unify:
        if verbose: print "Removing destination path from source paths"
        files_to_unify = N.array([x for x in files_to_unify if not x == final_filename])

    if verbose: print
    if verbose: print "Output file set to       :",final_filename
    if verbose: print "Files discovered to unify:",len(files_to_unify)
    if verbose: print

    filesizes      = N.array([S.file_size(x) for x in files_to_unify])

    #Remove files that are so small they are functionally useless
    mask = filesizes > min_filesize_bytes
    files_to_unify = files_to_unify[mask]
    filesizes      = filesizes     [mask]

    if verbose: print "Files that are sufficiently large",len(files_to_unify)

    #Remove files that are absolutely identical in size to another with the same name except for timestamp
    #This is very specific to datanames generated by util_prepare_data scripts.
    name_reduced   = [x[:-16] for x in files_to_unify]
    namecount      = C.Counter(name_reduced)
    repeat_names   = [x for   x in namecount if namecount[x] > 1]
    mask = N.ones(len(filesizes),dtype='bool')
    for rname in repeat_names:
        indices = [c for c,x in enumerate(name_reduced) if rname == x]
        sizes   = [filesizes[x] for x in indices]
        sortsize = sorted(sizes)
        if sortsize[0] == sortsize[-1]:
            #equal sizes for all files mean all but last one are to be ignored
            for i in indices[:-1]:
                mask[i]=False
    if N.sum(mask) < len(mask):
        if verbose: print "Detected repeated files:",mlib_formatting.prettyfraction(len(repeat_names),len(files_to_unify))
        if verbose: print "-"+"\n-".join(repeat_names)
        files_to_unify = files_to_unify[mask]
        filesizes      = filesizes     [mask]

    #Remove files that are identical in granule information but one has an r and one does not. Preferentially take r options.
    name_reduced           = [x[:-16] for x in files_to_unify]
    unwanted_forward_names = [x for y in name_reduced for x in name_reduced if y.replace("r02","r01") == x+"r"]
    mask = ~ N.in1d(name_reduced, unwanted_forward_names)
    if N.sum(mask) < len(mask):
        if verbose: print "Detected r01/r02 files:",mlib_formatting.prettyfraction(len(unwanted_forward_names),len(files_to_unify))
        if verbose: print "-"+"\n-".join(unwanted_forward_names)
        files_to_unify = files_to_unify[mask]
        filesizes      = filesizes     [mask]


    #First just populate our data structure for the SIDS seen, the file containing the SID, the file size, and ensure headers match
    if verbose: print "Scanning files to unify"

    register_sids_in_file = {}
    sids_seen             = {}

    sids     = []
    filesize = []
    filename = []

    sids_in_file_array = {}
    sids_in_file_set   = {}
    take_in_file = {}
    sids_count   = C.Counter()

    all_headers      = C.Counter()
    header_types     = {}
    headers_per_file = {}

    iterator = bar_nospam(files_to_unify) if progressbar else files_to_unify
    for filer in iterator:

        #Study headers to make superset of all available
        try:
            headers_per_file[filer] = read_headers(filer)
        except (IOError,):
            if verbose: print "FAILURE to access file",filer
            continue
        all_headers.update(headers_per_file[filer])
        if not "L2/RetrievalResults/wind_speed" in headers_per_file[filer]:
            print "No wind speed:",filer
        for h in headers_per_file[filer]:
            if h not in header_types:
                sample = read_column(filer, h, maxrows = 1)
                header_types[h] = sample.dtype

        #record the SID's we saw
        these_sids = read_column(filer, 'sounding_id')
        sids_in_file_array[filer] =     these_sids
        sids_in_file_set  [filer] = set(these_sids)
        #Initially mark all SID's as valid except zero SID's, which are never valid
        take_in_file[filer] = N.array(these_sids > 0)
        #Record how many times we've seen SID's
        sids_count.update([x for x in these_sids if x > 0])

    fmt = mlib_formatting.tight_format_string(all_headers.values())
    if verbose: print "Header Report for %d files"%len(files_to_unify)
    if verbose: print "timesseen type header"
    if verbose: print "--------- ---- ------"
    for h in sorted(all_headers):
        if verbose: print fmt%all_headers[h],header_types[h],h

    all_headers = sorted(all_headers)

    if verbose: print
    if verbose: print "Total number of headers discovered",len(all_headers)

    if verbose: print
    sids_redundant = [x for x in sids_count if sids_count[x] > 1]
    if verbose: print "Num Redundant SID's:",mlib_formatting.prettyfraction(len(sids_redundant),len(sids_count))

    if len(sids_redundant) > 0:
        if verbose: print "Redundant SID's:",N.array(sids_redundant)
        if verbose: print "Handling..."

        #Make a dict so we don't spam the user with thousands of redundant SID's in the same file pairs
        already_reported = {}

        #Figure out which of the redundant SID records are the one we will keep based on file order (time) and file size

        iterator = bar_nospam(sids_redundant) if progressbar else sids_redundant
        for sid in iterator:

            redundant_indices = [i for i,x in enumerate(files_to_unify) if sid in sids_in_file_set[x]]
            redundant_files   = [files_to_unify[i] for i in redundant_indices]

            files_involved = " ".join(redundant_files)

            if not files_involved in already_reported:
                if verbose: print "\n-Resolving example sid",sid
                if verbose: print "-"+"\n-".join(redundant_files)
                if verbose: print "-file indices:",redundant_indices
                already_reported[files_involved] = True

        #     sizes = [filesizes[c] for c in redundant_indices]

        #     #there is a biggest file, so take that one
        #     sortsize = sorted(sizes)
        #     if sortsize[-1] > sortsize[-2]:
        #         #Turn off all mentions of SID that aren't in biggest file
        #         biggest_file = N.argmax(sizes)
        #         for i,f in enumerate(redundant_files):
        #             if not i == biggest_file:
        # #                if verbose: print "--Turning off in",f
        #                 take_in_file[f][sids_in_file[f] == sid] = False

            #There is NOT a biggest file, so take the last one mentioned
            for f in redundant_files[:-1]:
        #        if verbose: print "--Turning off in",f
                take_in_file[f][sids_in_file_array[f] == sid] = False

        #Check to ensure we've gotten rid of all SID's
        if verbose: print "\nChecking to ensure no redundant SID's remain"
        check_count = C.Counter()
        for f in sids_in_file_array:
            check_count.update(sids_in_file_array[f][take_in_file[f]])

        if N.max(check_count.values()) > 1:
            if verbose: print "ERROR! We did not remove the redundancy"
            if verbose: print "Redundant SID's remain",[x for x in check_count if check_count[x] > 1]
            raise Exception("Unresolved redundant SID's present")

        #If Verbose: Print some stats
        total_sids_seen   = len(sids_count)
        total_sids_unique = N.sum([N.sum(take_in_file[x]) for x in take_in_file])
        if verbose: print "Unifying unique/all sids:",mlib_formatting.prettyfraction(total_sids_unique, total_sids_seen)

    del sids_in_file_set, sids_count, sids_in_file_array

    #---

    if len(files_to_unify) == 0:
        if verbose: print "No source files to process"
        return

    if verbose: print
    if verbose: print "Writing out final file"

    #Deduce how many features we could simultaneously load into memory with some quick calculations
    numsamples = N.sum([N.sum(take_in_file[x]) for x in files_to_unify])
    bytes_per_feature  = numsamples * 8
    num_simultaneous_features = N.max((1,N.min((int(max_memory_bytes / bytes_per_feature), len(all_headers)))))
    num_groups                = int(len(all_headers) / float(num_simultaneous_features) + 0.9999999999999)
    if verbose: print "Will process %d features at a time in %d groups"%(num_simultaneous_features, num_groups)

    #Begin the unification
    store = write_open(final_filename, numsamples)

    #Create feature groups to process simultaneously
    num = num_simultaneous_features
    featgroups = [all_headers[i*num:(i+1)*num] for i in range(num_groups)]

    import dogo_lib_feature_filter

    for featgroup in featgroups:

        data_group = DD.DataDict()

        #read in the column from each infile
        iterator = bar_nospam(files_to_unify) if progressbar else files_to_unify
        for filer in iterator:

            #Read in the feature group all at once
            data_this = read(filer, featgroup, literal = True)

            #Reject undesirable observations due to redundancy
            data_this.apply_mask(take_in_file[filer])

            #Check for any missing headers and pad them if necessary
            for header in featgroup:
                if data_this.resolve_features(header, literal=True) is None:
                    numrows = N.sum(take_in_file[filer])
                    data_this[header] = N.zeros((numrows,), N.float32)

                    if not mlib_string.any_within(dogo_lib_feature_filter.FEATURE_PATTERNS_TO_ZERO_FILL_WHEN_ABSENT, header):
                        data_this[header] *= N.nan
                        #If the column was previous of an int sort, must transform to float32 to handle a nan
                        if mlib_types.isint(header_types[header]):
                            if header in data_group.features: data_group[header] = data_group[header].astype(N.float32)

            data_group.update(data_this)

        for feat in data_group.features:
            #,True indicates literal matching only
            write_column(store, feat, data_group[feat, True])

        #Collect the trash to ensure we're not taking up more memory than necessary (this is a huge process)
        del data_group, data_this
        gc.collect()

    store.close()


if __name__ == "__main__":
    import doctest
    from mlib_doctest import repo_path
    doctest.testmod()
