##-----------------------------------------------------------------
##-----------------------------------------------------------------
##
## Mandrake lib (mlib) for handling science data as a dictionary
##
##-----------------------------------------------------------------
##-----------------------------------------------------------------

import numpy as N
import mlib_iterable as I
import mlib_regex
import mlib_types
import mlib_numeric as NUM
import mlib_shell as S
from pprint import pprint as PP

#The below action is to remove the following:
#mlib_datadict.py: FutureWarning: in the future, boolean array-likes will be handled as a boolean array index
import warnings
warnings.simplefilter(action = "ignore", category = FutureWarning)

#-----------------------
def resolve_features(features_all, keys, multiple = False, literal = False, ignore_case = False, exists = False):
    """ Quickly access the resolve_features capability of DataDicts without requiring an object creation.
    Fully tested in DataDict implementation below.

    >>> import mlib_HDF5 as H
    >>> testfile = repo_path()+"/doctest_files/sample_oco2.h5"
    >>> features = H.read_headers(testfile)

    >>> print resolve_features( features, 'xco2$' )
    L2/RetrievalResults/xco2

    >>> print resolve_features( features, 'xco2$', multiple = True )
    ['Mandrake/TCCON_median_xco2', 'L2/RetrievalResults/xco2']

    >>> print resolve_features( features, 'xco2', multiple = True )
    ['Mandrake/TCCON_median_xco2', 'L2/RetrievalResults/xco2', 'L2/RetrievalResults/xco2_apriori', 'L2/RetrievalResults/xco2_uncert', 'Mandrake/xco2_preliminary_bias_ppm', 'Multimodel/xco2_median', 'L2/RetrievalResults/xco2_uncert_interf', 'L2/RetrievalResults/xco2_uncert_smooth', 'L2/RetrievalResults/xco2_uncert_noise']

    """
    worker = DataDict(dict(zip(features_all,[ [], ]*len(features_all))))
    return worker.resolve_features(keys, multiple = multiple, literal = literal, ignore_case = ignore_case, exists = exists)


#Supremely handy wrapper around dicts with an ordered key list (headers)
#Headers are called features (for Machine Learning data use), equivalent with columns
#Data Dicts support:
# - safe append (empty lists are auto-initialized)
# - supports integer-based, boolean mask, or string-based access to features
# - all features contain NDarrays of custom types as per initialization
# - appending a singleton value or an array will always intelligently result in a 1D array, no lists of lists

#-----------------------
#-----------------------
#-----------------------
class DataDict:

    dictionary = {}
    features   = []

    #--------------------------------------------------------------------
    def __init__(self, indict = None, usecols =  None, deepcopy = False, mask = None, delimiter = '\\s+', maxrows = None):
        """ Initializes new DataDict.

        Args:
            indict   : Dictionary, Pandas DataFrame, another DataDict, or a (list of) string filename to copy into the new object.
                       DataFrames automatically use deepcopy = True
            usecols  : Only copies the specified headers from the original object, can be substrings, only works on DataDict indict values
            deepcopy : perform a deep copy of the specified dictionary, to prevent crosstalk in arrays
            mask     : Apply a row mask during loading, only works on file loading at this time
            delimiter: The regex delimiter for reading CSV/TXT files, default repeated white space
            maxrows  : The maximum number of rows to read. Only implemented for h5 and csv file reading currently

        Take in a dictionary

        >>> DataDict({'one':[1,2,3],'two':[2,3,4],'three':[3,4,5]})
          one: [1 2 3]
        three: [3 4 5]
          two: [2 3 4]
        DataDict (3) features x (3) samples
        <BLANKLINE>

        Demonstration that assignment doesn't deep copy
        >>> a = DataDict({'one':[1,2,3],'two':[2,3,4],'three':[3,4,5]})
        >>> b = a
        >>> b['one']=[3,2,1]
        >>> a['one']
        array([3, 2, 1])

        Test shape function
        >>> DataDict({'one':[1,2,3],'two':[2,3,4],'three':[3,4,5]}).shape()
        (3, 3)
        >>> DataDict({'one':[1,2,3],'two':[2,3,4],'three':[3,4,5]}).numsamples_numfeatures()
        (3, 3)
        >>> DataDict({'one':[1,2,3],'two':[2,3,4],'three':[3,4,5]}).numrows()
        3
        >>> DataDict({'one':[1,2,3],'two':[2,3,4],'three':[3,4,5]}).numfeatures()
        3

        Take in two columns from a dictionary

        >>> DataDict({'one':[1,2,3],'two':[2,3,4],'three':[3,4,5]}, usecols = ['one','three'])
          one: [1 2 3]
        three: [3 4 5]
        DataDict (2) features x (3) samples
        <BLANKLINE>

        Take in another datadict

        >>> DataDict(DataDict({'one':[1,2,3],'two':[2,3,4],'three':[3,4,5]}))
          one: [1 2 3]
        three: [3 4 5]
          two: [2 3 4]
        DataDict (3) features x (3) samples
        <BLANKLINE>

        Take in two columns from a datadict

        >>> DataDict(DataDict({'one':[1,2,3],'two':[2,3,4],'three':[3,4,5]}),usecols = ['one','three'])
          one: [1 2 3]
        three: [3 4 5]
        DataDict (2) features x (3) samples
        <BLANKLINE>

        Ensure we are not cross-contaminating arrays between input data and self.dictionary

        >>> DataDict(DataDict({'one':[1,2,3],'two':[2,3,4],'three':[3,4,5]},deepcopy = True))
          one: [1 2 3]
        three: [3 4 5]
          two: [2 3 4]
        DataDict (3) features x (3) samples
        <BLANKLINE>

        Take in only selected headers from a DataDict

        >>> DataDict(DataDict({'one':[1,2,3],'two':[2,3,4],'three':[3,4,5]}),usecols=['tw',])
        two: [2 3 4]
        DataDict (1) features x (3) samples
        <BLANKLINE>

        Read in from a Pandas DataFrame

        >>> import pandas as PA
        >>> df = PA.DataFrame({'hello':[1,2,3],'goodbye':[3,4,5]})
        >>> DataDict(df)
        goodbye: [3 4 5]
          hello: [1 2 3]
        DataDict (2) features x (3) samples
        <BLANKLINE>

        Read a single column from a Pandas DataFrame
        >>> import pandas as PA
        >>> df = PA.DataFrame({'hello':[1,2,3],'goodbye':[3,4,5]})
        >>> DataDict(df,usecols='hello')
        hello: [1 2 3]
        DataDict (1) features x (3) samples
        <BLANKLINE>

        Read in a csv file
        >>> testfile = repo_path()+"/doctest_files/threshold_CMPLX_05_relative_residual_mean_square_weak_co2.txt"
        >>> DataDict(testfile) #doctest: +ELLIPSIS +NORMALIZE_WHITESPACE
        Transparency: [  1 ... 100]
        >L2/SpectralParameters/relative_residual_mean_square_weak_co2: [  0.00171786 ... 0.0568785 ]
        >ratio_killed: [ 6.30985000e-01 ...  2.54389000e-06]
        DataDict (3) features x (100) samples
        <BLANKLINE>

        Read in an h5 file
        >>> testfile = repo_path()+"/doctest_files/sample_oco2.h5"
        >>> data = DataDict(testfile)
        >>> data.numsamples_numfeatures()
        (1000, 321)

        Read in a list of h5 files
        >>> testfile = repo_path()+"/doctest_files/sample_oco2.h5"
        >>> data = DataDict([testfile, testfile, testfile])
        >>> data.numsamples_numfeatures()
        (3000, 321)


        """

        usecols = I.makeiter(usecols)

        if indict is not None:

            #dictionary case
            if isinstance(indict, dict):
                if usecols is None: usecols = indict.keys()
                self.dictionary = {}
                if deepcopy:
                    for key in usecols: self[key] = indict[key][:]
                else:
                    for key in usecols: self[key] = indict[key]

                self.regenerate_sorted_features()

                #make all internal arrays into 1D numpy arrays
                for h in self.dictionary: self.dictionary[h] = N.array([self.dictionary[h],]).squeeze()

            #DataDict case
            elif isinstance(indict, DataDict):
                if deepcopy:
                    new = indict.deep_copy(usecols = usecols)
                else:
                    new = indict.     copy(usecols = usecols)
                self.dictionary = new.dictionary
                self.features   = new.features

            #string (filename) or iterator of strings case
            elif mlib_types.isstr(indict) or ( mlib_types.isarray(indict) and mlib_types.isstr(indict[0]) ):

                testval = indict if I.is_not_iterable(indict) else indict[0]
                if (".h5" == testval.lower()[-3:]) or (".hdf5" == testval.lower()[-5:]):
                    self.read_h5 (indict, mask = mask, usecols = usecols, maxrows = maxrows)
                else: #txt case
                    self.read_csv(indict, mask = mask, usecols = usecols, maxrows = maxrows, delimiter = delimiter)

            #Pandas case, placed in else because we don't want to load Pandas unless we have to
            else:
                from pandas import DataFrame
                if isinstance(indict, DataFrame):
                    if usecols is None: usecols = indict.columns.values.tolist()
                    self.features   = usecols
                    self.dictionary = dict( [ (feat, N.array(indict[feat])) for feat in usecols] )
                else:
                    raise Exception("Must pass dictionary or DataDict or Pandas.DataFrame to initialize DataDict, not "+str(type(indict)))
        else:
            self.dictionary = {}
            self.features   = []

    #------------------
    def resolve_features(self, keys, multiple = False, literal = False, ignore_case = False, exists = False):
        """ Resolve integer index or (sub)string reference to specific header/feature/column names.
        Supports full regex substrings.

        Args:
            keys       : the indices, strings, boolean mask, or substrings to match to full header names. Blank strings match nothing.
            multiple   : False=take the smallest (shortest name) match (singleton), True=keep all matches & ensure list return always
            literal    : Do not match as substrings, return only literal (complete) string matches
            ignore_case: Match regardless of case, default False
            exists     : Test only if features exist
                         For boolean case, returns [True,]*sum(mask). No way to fail
                         For int indices , returns [True,]*len(indices). No way to fail
                         for string case , returns [True/False,]*len(keys) whether each key matched something
        Returns:
            singleton match string or (if multiple) list of fully expanded matching header/feature/column names

        Null usage case
        >>> DataDict({'one':[1,2],'two':[2,3],'thr':[3,4],'four':[4,5]}).resolve_features([])
        []

        Basic use case, resolve to shortest matching field
        >>> DataDict({'one':[1,2],'two':[2,3],'thr':[3,4],'four':[4,5]}).resolve_features('o')
        'one'

        Test beginning and end regex anchors
        >>> DataDict({'one':[1,2],'two':[2,3],'thr':[3,4],'four':[4,5]}).resolve_features('^o')
        'one'
        >>> DataDict({'one':[1,2],'two':[2,3],'thr':[3,4],'four':[4,5]}).resolve_features('o$')
        'two'

        Blank string matches nothing... ensure this is true
        >>> print DataDict({'one':[1,2],'two':[2,3],'thr':[3,4],'four':[4,5]}).resolve_features('')
        None

        Permit multiple matches instead
        >>> DataDict({'one':[1,2],'two':[2,3],'thr':[3,4],'four':[4,5]}).resolve_features('o',multiple=True)
        ['four', 'two', 'one']

        Handle case (note attempting to match and failing returns [] empty set)
        >>> DataDict({'one':[1,2],'two':[2,3],'thr':[3,4],'four':[4,5]}).resolve_features('O',multiple=True)
        []
        >>> DataDict({'one':[1,2],'two':[2,3],'thr':[3,4],'four':[4,5]}).resolve_features('O',multiple=True,ignore_case=True)
        ['four', 'two', 'one']

        Literal can return multiple values if specified multiple
        >>> DataDict({'one':[1,2],'onetwo':[2,3]}).resolve_features('One',multiple=True, literal=True, ignore_case = True)
        ['one']

        Failure to match in normal case returns None
        >>> print DataDict({'one':[1,2],'onetwo':[2,3]}).resolve_features('One')
        None

        Multiple index selection by integers
        >>> DataDict({'one':[1,2],'onetwo':[2,3]}).resolve_features([1,0])
        ['onetwo', 'one']

        Boolean mask usecols case (single return result)
        >>> DataDict({'one':[1,2],'two':[2,3],'thr':[3,4],'four':[4,5]}).resolve_features([True,False,False,False])
        ['four']

        Boolean mask usecols case (multiple return result)
        >>> DataDict({'one':[1,2],'two':[2,3],'thr':[3,4],'four':[4,5]}).resolve_features([True,False,False,True])
        ['four', 'two']

        Boolean mask usecols case with mismatching length
        >>> DataDict({'one':[1,2],'two':[2,3],'thr':[3,4],'four':[4,5]}).resolve_features([True,False,True])
        Traceback (most recent call last):
        Exception: Boolean mask must match number of features present

        Single index selection by integer
        >>> DataDict({'one':[1,2],'onetwo':[2,3]}).resolve_features(1)
        'onetwo'

        If need answer as a list no matter singleton, use multiple=True
        >>> DataDict({'one':[1,2],'onetwo':[2,3]}).resolve_features(1,multiple=True)
        ['onetwo']

        Can even mix indices and substrings, plus non-matching elements
        >>> DataDict({'one':[1,2],'onetwo':[2,3]}).resolve_features(['one',1,'onetwo',0,'nothere'])
        ['one', 'onetwo']

        Full regex commands are accepted
        >>> DataDict({'one':[1,2],'onetwo':[2,3]}).resolve_features('o',multiple=True)
        ['onetwo', 'one']
        >>> DataDict({'one':[1,2],'onetwo':[2,3]}).resolve_features('o$',multiple=True)
        ['onetwo']

        Now test exists mode

        Null usage case
        >>> DataDict({'one':[1,2],'two':[2,3],'thr':[3,4],'four':[4,5]}).resolve_features([], exists = True)
        []

        Basic use case, resolve to shortest matching field
        >>> DataDict({'one':[1,2],'two':[2,3],'thr':[3,4],'four':[4,5]}).resolve_features('o', exists = True)
        True

        Blank string matches nothing... ensure this is true
        >>> print DataDict({'one':[1,2],'two':[2,3],'thr':[3,4],'four':[4,5]}).resolve_features('', exists = True)
        False

        Permit multiple matches instead
        >>> DataDict({'one':[1,2],'two':[2,3],'thr':[3,4],'four':[4,5]}).resolve_features('o',multiple=True, exists = True)
        True

        Handle case (note attempting to match and failing returns [] empty set)
        >>> DataDict({'one':[1,2],'two':[2,3],'thr':[3,4],'four':[4,5]}).resolve_features('O',multiple=True, exists = True)
        False
        >>> DataDict({'one':[1,2],'two':[2,3],'thr':[3,4],'four':[4,5]}).resolve_features('O',multiple=True,ignore_case=True, exists = True)
        True

        Literal can return multiple values if specified multiple
        >>> DataDict({'one':[1,2],'onetwo':[2,3]}).resolve_features('One',multiple=True, literal=True, ignore_case = True, exists = True)
        True

        Failure to match in normal case returns None
        >>> print DataDict({'one':[1,2],'onetwo':[2,3]}).resolve_features('One', exists = True)
        False

        Multiple index selection by integers
        >>> DataDict({'one':[1,2],'onetwo':[2,3]}).resolve_features([1,0], exists = True)
        [True, True]

        Boolean mask usecols case (single return result)
        >>> DataDict({'one':[1,2],'two':[2,3],'thr':[3,4],'four':[4,5]}).resolve_features([True,False,False,False], exists = True)
        [True]

        Single index selection by integer
        >>> DataDict({'one':[1,2],'onetwo':[2,3]}).resolve_features(1, exists = True)
        True

        Can even mix indices and substrings, plus non-matching elements
        >>> DataDict({'one':[1,2],'onetwo':[2,3]}).resolve_features(['one',1,'onetwo',0,'nothere'], exists = True)
        [True, True, True, True, False]

        Full regex commands are accepted
        >>> DataDict({'one':[1,2],'onetwo':[2,3]}).resolve_features('o',multiple=True, exists = True)
        True
        >>> DataDict({'one':[1,2],'onetwo':[2,3]}).resolve_features('o$',multiple=True, exists = True)
        True

        """

        was_iterable = I.is_iterable(keys)

        #If asked for no keys as an interable array, return empty array
        if was_iterable and len(keys) == 0: return []

        #Handle boolean case, just masks feature names and returns
        if was_iterable and mlib_types.isbool(keys[0]):
            if len(keys) != len(self.features): raise Exception ("Boolean mask must match number of features present")
            if exists:
                return [True,]*N.sum(keys)
            else:
                return list(N.array(self.features)[N.array(keys)])

        if not was_iterable: keys = [keys,]

        retval = []
        for key in keys:

            #These are indices into self.header
            if mlib_types.isint(key):
                if exists:
                    retval.append(True)
                else:
                    retval.append(self.features[key])
                continue

            #These are direct or substring or regex matches to headers
            if mlib_types.isstr(key):

                #Skip blank string matching... match to nothing
                if len(key) == 0:
                    if exists: retval.append(False) #Keep track of what doesn't work for exists case
                    continue

                if not literal:
                    matches = mlib_regex.matching_elements(key, self.features, ignore_case=ignore_case)
                else:
                    if ignore_case:
                        matches = [x for x in self.features if x.lower() == key.lower() ]
                    else:
                        matches = [x for x in self.features if x == key]

                #immediately know the answer if exists case
                if exists:
                    retval.append(len(matches) > 0)
                    continue

                #if no matches, skip recording feature at all
                if len(matches) == 0: continue

                #If user wants all hits, keep them all
                if multiple:
                    retval.append(matches)
                else:
                    #Otherwise select shorted string that matches (least redundant).
                    #This can get into trouble, but you have to resolve somehow
                    matches = [(len(x),x) for x in matches]

                    #sort the matches by size (increasing)
                    matches = sorted(matches)

                    #return the shortest match's name
                    retval.append(matches[0][1])

                continue

            raise Exception("Unsupported type for feature access "+str(type(key)))

        #Return immediately if exists case
        if exists:
            if was_iterable: return retval
            return retval[0]

        #Return unique list of matched features
        if was_iterable or multiple:
            #ensure unique list is returned
            from mlib_numeric import unique
            return unique(NUM.flatten([retval,]))

        #singleton case expects single answer returned
        retval = NUM.flatten(retval)
        if len(retval) == 0: return None
        return retval[0]


    #---------------------------------------------------------
    def deep_copy(self, usecols = None, literal = False):
        """ Perform a deep copy of this datadict all the way down to the numpy array columns.

        >>> first  = DataDict({'one':[1,2,3,4],'two':[4,3,2,1]})
        >>> second = first.deep_copy()
        >>> second['one'][2] = 9e9
        >>> first
        one: [1 2 3 4]
        two: [4 3 2 1]
        DataDict (2) features x (4) samples
        <BLANKLINE>

        >>> second
        one: [         1          2 9000000000          4]
        two: [4 3 2 1]
        DataDict (2) features x (4) samples
        <BLANKLINE>

        >>> DataDict().deep_copy()
        DataDict (0) features x (0) samples

        """
        new = DataDict()

        if usecols is None:
            usecols = self.features[:]
        else:
            usecols = self.resolve_features(usecols, literal = literal)

        new.features = usecols
        for h in usecols:
            new.dictionary[h] = self.dictionary[h].copy()
        return new

    #---------------------------------------------------------
    def copy(self, usecols = None, literal = False):
        """ Perform a shallow copy of this datadict, with only pointers to arrays passed.
        Saves memory, but if you change the new datadict's arrays, the one ones will change.

        >>> first  = DataDict({'one':[1,2,3,4],'two':[4,3,2,1]})
        >>> second = first.copy()
        >>> second['one'][2] = 9e9
        >>> first
        one: [         1          2 9000000000          4]
        two: [4 3 2 1]
        DataDict (2) features x (4) samples
        <BLANKLINE>

        >>> second
        one: [         1          2 9000000000          4]
        two: [4 3 2 1]
        DataDict (2) features x (4) samples
        <BLANKLINE>

        >>> DataDict().copy()
        DataDict (0) features x (0) samples

        """
        new = DataDict()

        if usecols is None:
            usecols = self.features[:]
        else:
            usecols = self.resolve_features(usecols, literal = literal)

        new.features = usecols
        for h in usecols:
            new.dictionary[h] = self.dictionary[h]
        return new

    #---------------------------------------------------------
    def append(self, field, thing_to_add, literal = False):
        """ Adds (or appends to) a specified feature. Literal requires precision name, or else regex will be used to append.

        Adding a new field, basic usage
        >>> example = DataDict({'one':[1,2],'two':[2,3]})
        >>> example.append('newfield',[3,4])
        >>> print example
             one: [1 2]
             two: [2 3]
        newfield: [3 4]
        DataDict (3) features x (2) samples
        <BLANKLINE>

        Appending a new field, then adding more
        >>> example=DataDict({})
        >>> example.append('one',[1,2,3])
        >>> example.append('one',[4,5,6])
        >>> example.append('two',[6,5,4,3,2,1])
        >>> print example
        one: [1 2 3 4 5 6]
        two: [6 5 4 3 2 1]
        DataDict (2) features x (6) samples
        <BLANKLINE>

        Appending to a substring of an existing name is dangerous, could add to the existing column or make a new if needed
        >>> example=DataDict({})
        >>> example.append('longname',[1,2,3])
        >>> example.append('long'    ,[4,5,6])
        >>> print example
        longname: [1 2 3 4 5 6]
        DataDict (1) features x (6) samples
        <BLANKLINE>

        To make explicit, set literal = True. No substring matching is then performed.
        >>> example=DataDict({})
        >>> example.append('longname',[1,2,3])
        >>> example.append('long'    ,[4,5,6],literal=True)
        >>> print example
        longname: [1 2 3]
            long: [4 5 6]
        DataDict (2) features x (3) samples
        <BLANKLINE>

        Make sure we can add multidimensional arrays. Not the primary purpose of DataDict, but it can be helpful
        >>> example=DataDict({})
        >>> example.append('2dstruct',[[1,2,3],[4,5,6]])
        >>> print example
        2dstruct: [[1 2 3]
         [4 5 6]]
        DataDict (1) features x (6) samples
        <BLANKLINE>

        >>> example.append('2dstruct',[[7,8,9],[10,11,12]])
        >>> print example
        2dstruct: [[ 1  2  3]
         [ 4  5  6]
         [ 7  8  9]
         [10 11 12]]
        DataDict (1) features x (12) samples
        <BLANKLINE>

        """

        field_resolved = self.resolve_features(field, literal=literal)

        #extend thing_to_add and ensure it's now a 1D array, hard to do if it's a singleton
        if I.is_not_iterable(thing_to_add):
            thing_to_add = N.array((thing_to_add,))
        else:
            #We are dealing with iterable stuff
            #Check if it isn't already an ndarray, and make it so
            if not mlib_types.isnarray(thing_to_add): thing_to_add = N.array(thing_to_add)
            #Don't make it 1D. That's needless limitation
            #thing_to_add = thing_to_add.reshape(thing_to_add.size)
        if field_resolved in self.dictionary:
            #Here we need to check that kind of item we are appending. 1D vs nD
            if len(self.dictionary[field_resolved].shape) == 1:
                self.dictionary[field_resolved] = N.hstack((self.dictionary[field_resolved], thing_to_add))
            else:
                self.dictionary[field_resolved] = N.vstack((self.dictionary[field_resolved], thing_to_add))
        else:
            self.dictionary[field] = thing_to_add
            self.features += [field,]

    #----------------
    def update(self, incoming_dictionary):
        """ Takes existing datadict or dictionary and appends it to the current data store, using literal feature names

        >>> example = DataDict({'olddata':[1,2,3]})
        >>> example.update({'olddata':[4,5,6],'newdata':[6,5,4,3,2,1]})
        >>> print example
        olddata: [1 2 3 4 5 6]
        newdata: [6 5 4 3 2 1]
        DataDict (2) features x (6) samples
        <BLANKLINE>

        Complex header name example that requires literal handling, not regex
        >>> example.update({'log[p(cluster 2) / p(cluster 1)]': [-13.04065 , -13.0614  , -14.35786 ],
        ...                 '#sounding_id'                    : [2014090811253031, 2014090811253071, 2014090811253072 ]})
        >>> example['log']
        array([-13.04065, -13.0614 , -14.35786])
        >>> example['sounding']
        array([2014090811253031, 2014090811253071, 2014090811253072])
        >>> example['newdata']
        array([6, 5, 4, 3, 2, 1])
        >>> sorted(example.features)
        ['#sounding_id', 'log[p(cluster 2) / p(cluster 1)]', 'newdata', 'olddata']

        """

        incoming = DataDict(incoming_dictionary)
        for key in incoming.features:
            #funky double index notation indicates literal name matching
            self.append(key, incoming[key, True], literal = True)

    #----------------------
    def __setitem__(self, key, thing_to_set):
        """ Overwrites an item with key.
        Key is default interpretted as literal, to avoid invisible bugs and accidentally overwritten data.
        Key may be a 2 element list, with second element a boolean for Literal matching, default True

        Base usecase demonstrating literal match to sets (new feature names)
        >>> example = DataDict({})
        >>> example['longname'] = [1,2,3]
        >>> example['long'    ] = [4,5,6]
        >>> print example
        longname: [1 2 3]
            long: [4 5 6]
        DataDict (2) features x (3) samples
        <BLANKLINE>

        Base usecase demonstrating regex match to set (be careful!)
        >>> example = DataDict({})
        >>> example['longname'       ] = [1,2,3]
        >>> example['long'    , False] = [4,5,6]
        >>> print example
        longname: [4 5 6]
        DataDict (1) features x (3) samples
        <BLANKLINE>

        Reset example
        >>> example = DataDict({})
        >>> example['longname'] = [1,2,3]
        >>> example['long'    ] = [4,5,6]

        Get and Set together to overwrite existing name
        >>> example['longname'] = example['longname'] + 1
        >>> example['longname']
        array([2, 3, 4])

        Index access is available, but be careful to know your headers well
        >>> example[0] = example[0] + 1
        >>> example['longname']
        array([3, 4, 5])

        Self-referential +=
        >>> example[0] += 1
        >>> example['longname']
        array([4, 5, 6])

        Self-referential *=
        >>> example[0] *= 2
        >>> example['longname']
        array([ 8, 10, 12])

        Explicitly overwrite existing feature
        >>> example['long'] = [12,13,14]
        >>> example['long']
        array([12, 13, 14])

        Reset example
        >>> example = DataDict({})
        >>> example['long2name'] = [1,2,3]
        >>> example['long3nam' ] = [1,2,3]
        >>> example
        long2name: [1 2 3]
         long3nam: [1 2 3]
        DataDict (2) features x (3) samples
        <BLANKLINE>

        Self-referential += works on matching too!
        >>> example['long2name'] += 1
        >>> example['long2name']
        array([2, 3, 4])
        >>> example['long2',False] += 1
        >>> example['long2name']
        array([3, 4, 5])

        Hits the closest, shortest match, not all matches
        >>> example['long',False] +=1
        >>> example
        long2name: [3 4 5]
         long3nam: [2 3 4]
        DataDict (2) features x (3) samples
        <BLANKLINE>

        """

        #Extract out a literal flag if it exists
        if isinstance(key, tuple):
            literal = bool(key[1])
            key = key[0]
        else:
            #Default value
            literal = True

        #Resolve to existing full name
        resolved_key = self.resolve_features(key, literal=literal)

        #If there's no match and an integer index was used, we cannot proceed
        if resolved_key is None and mlib_types.isint(key):
            raise Exception("Index specified beyond range of DataDict: "+str(key))
        #New feature specified
        if resolved_key is None:
            self.dictionary[key]  = N.array(thing_to_set).squeeze()
            self.features         += [key,]
        else:
            self.dictionary[resolved_key] = N.array(thing_to_set).squeeze()

    #Retrieve a value from the dictionary given any valid key type
    #----------------------
    def __getitem__(self, key):
        """ Main method of retrieving a data column by name or index.
        Second index may be used to specify literal (True) or regex-matching (default, False)

        >>> example = DataDict({'one':[1,2,3],'two':[4,5,6]})

        Access by strings
        >>> example['one']
        array([1, 2, 3])
        >>> example['two']
        array([4, 5, 6])
        >>> example['on']
        array([1, 2, 3])
        >>> example['t']
        array([4, 5, 6])

        Access by literal strings
        >>> example['on' ,  True]
        Traceback (most recent call last):
        Exception: ("'on' not found in:", ['one', 'two'])
        >>> example['on' , False]
        array([1, 2, 3])

        Access by indices
        >>> example[0]
        array([1, 2, 3])
        >>> example[1]
        array([4, 5, 6])

        Out of Bounds index
        >>> example[2]
        Traceback (most recent call last):
        IndexError: list index out of range

        Not present string
        >>> example['manga']
        Traceback (most recent call last):
        Exception: ("'manga' not found in:", ['one', 'two'])

        Complex header names
        >>> example = DataDict({'log[p(cluster 2) / p(cluster 1)]': [1,2,3], 'plain': [4,5,6]})
        >>> example['log']
        array([1, 2, 3])
        >>> example['plain']
        array([4, 5, 6])

        >>> example = DataDict({'log[p(cluster 2) / p(cluster 1)]': [-13.04065 , -13.0614  , -14.35786 ],
        ...                     '#sounding_id'                    : [2014090811253031, 2014090811253071, 2014090811253072 ]})
        >>> example['log'     ]
        array([-13.04065, -13.0614 , -14.35786])
        >>> example['sounding']
        array([2014090811253031, 2014090811253071, 2014090811253072])

        """

        #Extract out a literal flag if it exists
        if isinstance(key, tuple):
            literal = bool(key[1])
            key = key[0]
        else:
            #Default value
            literal = False

        origkey = key
        key = self.resolve_features(key, literal = literal)
        if key is None:
            raise Exception("'%s' not found in:"%origkey,self.features)
        else:
            return self.dictionary[key]

    def __delitem__(self, key):
        """ Remove matching items from dictionary and header list.
        Multiple matches will be performed unless literal is specified.
        Default not literal.

        Full string case
        ----------------
        >>> example = DataDict({'one':[1,2,3],'two':[4,5,6]})
        >>> del example['one']
        >>> example
        two: [4 5 6]
        DataDict (1) features x (3) samples
        <BLANKLINE>

        Index case
        ----------
        >>> example = DataDict({'one':[1,2,3],'two':[4,5,6]})
        >>> del example[0]
        >>> example
        two: [4 5 6]
        DataDict (1) features x (3) samples
        <BLANKLINE>

        Literal Case
        -------------
        >>> example = DataDict({'one':[1,2],'two':[4,5],'three':[5,6],'four':[6,7],'five':[7,8]})
        >>> example.features
        ['five', 'four', 'one', 'three', 'two']

        Does nothing, as no matches found literally
        >>> del example['f',True]
        >>> example.features
        ['five', 'four', 'one', 'three', 'two']

        this does, allow multiple matches
        >>> del example['f',False]
        >>> example.features
        ['one', 'three', 'two']
        """

        #Extract out a literal flag if it exists
        if isinstance(key, tuple):
            literal = bool(key[1])
            key = key[0]
        else:
            #Default value
            literal = False

        keys = self.resolve_features(key, multiple = not literal, literal = literal)
        if keys is not None:
            #Remove entries from headers
            self.features = [x for x in self.features if not x in keys]
            #Remove entries from dictionary
            for key in keys:
                del self.dictionary[key]
    #-----------------------------------
    def reorder_features(self, new_header_list):
        """ reorder headers by user specification. Must contain the precise same strings as the original or fails.

        Valid use

        >>> ex = DataDict({'one':[1,2],'onetwo':[2,3]})
        >>> ex
           one: [1 2]
        onetwo: [2 3]
        DataDict (2) features x (2) samples
        <BLANKLINE>
        >>> ex.reorder_features(['onetwo','one'])
        >>> ex
        onetwo: [2 3]
           one: [1 2]
        DataDict (2) features x (2) samples
        <BLANKLINE>


        Invalid use

        >>> ex = DataDict({'one':[1,2],'onetwo':[2,3]})
        >>> ex.reorder_features(['one','two'])
        Traceback (most recent call last):
        Exception: Feature onetwo was not represented in new ordering
        """

        #Check both lists are mutually inclusive (equal length guarenteed implicitly)
        for feat in self.features:
            if not feat in new_header_list:
                raise Exception("Feature "+feat+" was not represented in new ordering")
        for feat in new_header_list:
            if not feat in self.features:
                raise Exception("Feature "+feat+" represented in new ordering, but not current dictionary")

        self.features = new_header_list

    #-----------------------------------
    def regenerate_sorted_features(self):
        """ Simply recreate the header list from the sorted keys in the dictionary. """
        self.features = sorted(self.dictionary.keys())

    #-----------------------------------
    def numsamples_numfeatures(self):
        """ Returns both the number of features present and the number of samples (of the first feature)

        >>> DataDict({'one':[1,2,4],'onetwo':[2,3,4]}).numsamples_numfeatures()
        (3, 2)
        >>> DataDict().numsamples_numfeatures()
        (0, 0)

        """
        numfeatures = len(self.features)
        if numfeatures == 0: return 0,0
        numsamples  = self.dictionary[self.dictionary.keys()[0]].size
        return numsamples, numfeatures

    #-----------------------------------
    #synonym with numsamples_numfeatures
    def shape(self): return self.numsamples_numfeatures()

    #Return the number of features/columns/headers
    def numfeatures(self): return len(self.features)
    def numcolumns (self): return len(self.features)
    def numheaders (self): return len(self.features)

    #Return the number of samples based on the first feature
    def numsamples(self): return self.numsamples_numfeatures()[0]
    def numrows   (self): return self.numsamples_numfeatures()[0]

    #Check if a data dict is empty of features or samples
    def isempty(self): return N.prod(self.numsamples_numfeatures()) == 0
    #-----------------------------------

    #-----------------------------------
    def numsamples_per_feature(self):
        """ Number of samples per feature as a list... should be equal, but let's make sure.

        Basic functionality
        -------------------
        >>> DataDict({'one':[1,2,4],'onetwo':[2,3,4]}).numsamples_per_feature()
        [3, 3]
        >>> DataDict().numsamples_per_feature()
        []
        """
        return [self.dictionary[h].size for h in self.features]

    #-----------------------------
    def check_equal_samples(self):
        """ Check to ensure there are equal numbers of samples per feature.

        >>> DataDict({'one':[1,2,4],'onetwo':[2,3,4]}).check_equal_samples()
        True
        >>> DataDict({'one':[1,2,4],'onetwo':[2,3]}).check_equal_samples()
        False
        >>> DataDict().check_equal_samples()
        True
        """
        samples = self.numsamples_per_feature()
        if len(samples) == 0: return True
        return N.min(samples) == N.max(samples)

    #--------------------------
    def apply_mask(self, mask):
        """ Applies a boolean or index mask to all features

        >>> ex = DataDict({'one':N.arange(4),'onetwo':N.arange(10,14)})
        >>> ex
           one: [0 1 2 3]
        onetwo: [10 11 12 13]
        DataDict (2) features x (4) samples
        <BLANKLINE>
        >>> ex.apply_mask([True,False,True,False])
        >>> ex
           one: [0 2]
        onetwo: [10 12]
        DataDict (2) features x (2) samples
        <BLANKLINE>

        Empty case
        >>> ex = DataDict({})
        >>> ex.apply_mask([])
        >>> ex
        DataDict (0) features x (0) samples

        """

        for key in self.dictionary:
            self.dictionary[key] = self.dictionary[key][N.array(mask)]


    #--------------------------
    def mask_keep_these_values(self, usecols, vals_to_keep, remove_these_values = False):
        """ Generate mask that keeps only the specified values in the feature specified.
        Useful for sub-selecting based on flags and other integer values.
        Applies the mask to the current datadict immediately.

        Args:
            usecols     : feature specification, will take closest match only
            vals_to_keep: the specific values to keep; not appropriate for floating point values
            remove_these_values: If true than removes only these values instead of keeping them, reverses function
        Returns:
            mask        : rows that are (or are not) the specified values

        >>> ex = DataDict({'one':N.arange(4),'two':N.arange(14,10,-1)})
        >>> ex
        one: [0 1 2 3]
        two: [14 13 12 11]
        DataDict (2) features x (4) samples
        <BLANKLINE>

        Keep only feature one == 1 or 2
        ----------------------------------
        >>> mask = ex.mask_keep_these_values('one', [1,2])
        >>> ex.apply_mask(mask)
        >>> ex
        one: [1 2]
        two: [13 12]
        DataDict (2) features x (2) samples
        <BLANKLINE>

        Keep only feature two == 13
        >>> mask = ex.mask_keep_these_values('two', 13)
        >>> ex.apply_mask(mask)
        >>> ex
        one: [1]
        two: [13]
        DataDict (2) features x (1) samples
        <BLANKLINE>

        >>> mask = ex.mask_keep_these_values('two', [])
        >>> ex.apply_mask(mask)
        >>> ex
        one: []
        two: []
        DataDict (2) features x (0) samples
        <BLANKLINE>

        >>> ex = DataDict({'one':N.arange(4),'two':N.arange(14,10,-1)})
        >>> ex
        one: [0 1 2 3]
        two: [14 13 12 11]
        DataDict (2) features x (4) samples
        <BLANKLINE>

        Remove only feature one == 1 or 2
        ----------------------------------
        >>> mask = ex.mask_keep_these_values('one', [1,2], remove_these_values = True)
        >>> ex.apply_mask(mask)
        >>> ex
        one: [0 3]
        two: [14 11]
        DataDict (2) features x (2) samples
        <BLANKLINE>

        """

        feature   = self.resolve_features(usecols)
        singleton = I.is_not_iterable(vals_to_keep)
        if singleton: vals_to_keep = [vals_to_keep,]

        if len(vals_to_keep) == 0:
            mask = N.zeros(self.numsamples(),dtype=bool)
        else:
            mask = N.sum([self.dictionary[feature] == x for x in vals_to_keep], axis=0) > 0
            #reverse the mask if we are removing the specified values instead
            if remove_these_values: mask = ~mask

        return mask

    #--------------------------
    def mask_out_nans(self, usecols = None):
        """ Will form a mask based on all usecol specified features and mask out any rows that contain NaN's.
        Returns the mask used.

        >>> ex = DataDict({'a':[1, 2, 3, 4, 5, N.nan],
        ...                'b':[1, 2, 3, 4, 5, 6    ],
        ...                'c':[N.nan, 2, 3, 4, 5, 6]})

        >>> test = ex.deep_copy()
        >>> test.mask_out_nans('a')
        array([ True,  True,  True,  True,  True, False], dtype=bool)
        >>> test
        a: [ 1.  2.  3.  4.  5.]
        b: [1 2 3 4 5]
        c: [ nan   2.   3.   4.   5.]
        DataDict (3) features x (5) samples
        <BLANKLINE>

        >>> test = ex.deep_copy()
        >>> test.mask_out_nans('b')
        array([ True,  True,  True,  True,  True,  True], dtype=bool)
        >>> test
        a: [  1.   2.   3.   4.   5.  nan]
        b: [1 2 3 4 5 6]
        c: [ nan   2.   3.   4.   5.   6.]
        DataDict (3) features x (6) samples
        <BLANKLINE>

        >>> test = ex.deep_copy()
        >>> test.mask_out_nans('c')
        array([False,  True,  True,  True,  True,  True], dtype=bool)
        >>> test
        a: [  2.   3.   4.   5.  nan]
        b: [2 3 4 5 6]
        c: [ 2.  3.  4.  5.  6.]
        DataDict (3) features x (5) samples
        <BLANKLINE>

        All feature test
        >>> test = ex.deep_copy()
        >>> test.mask_out_nans()
        array([False,  True,  True,  True,  True, False], dtype=bool)
        >>> test
        a: [ 2.  3.  4.  5.]
        b: [2 3 4 5]
        c: [ 2.  3.  4.  5.]
        DataDict (3) features x (4) samples
        <BLANKLINE>

        >>> test = DataDict({})
        >>> test.mask_out_nans()
        array([], dtype=bool)
        >>> test
        DataDict (0) features x (0) samples
        """

        #If no headers are provided, use them all
        if usecols is None: usecols = self.features
        else              : usecols = self.resolve_features(usecols, multiple=True)

        if len(usecols) > 0:

            #Form mask for no nans in ANY of the specified features
            mask = N.all([~N.isnan(self.dictionary[feat]) for feat in usecols], axis=0)
            self.apply_mask(mask)
            return mask

        else:

            return N.array([],dtype=bool)


    #--------------------------
    def tokenize(self, usecols = None):
        """ Text and binary features are tokenized (replaced with unique integers corresponding to specific entries).
        Returns a dictionary of the tokens used.
        This works on the current DataDict in-place

        Args:
            usecols: (optional) the columns to tokenize
        Returns:
            tokendict: A dictionary of feature:(token list) pairs to decode assignments.

        >>> ex = DataDict({'a':[1 , 2, 3, 4, 5, N.nan],
        ...                'b':[1 , 2, 3, 4, 5, 6    ],
        ...                'c':['hello', 'hello', 'goodbye', 'goodbye', 'unique1', 'unique2'],
        ...                'd':[True, False, True, True, False, False]})

        Nothing should happen if it's invoked only on columns that are real or int
        >>> test = ex.deep_copy()
        >>> test.tokenize('a')
        {}

        >>> test = ex.deep_copy()
        >>> test.tokenize('b')
        {}

        String case
        >>> test = ex.deep_copy()
        >>> tokendict = test.tokenize('c')
        >>> for x in sorted(tokendict): print x,tokendict[x]
        c {0: 'goodbye', 1: 'hello', 2: 'unique1', 3: 'unique2'}
        >>> test
        a: [  1.   2.   3.   4.   5.  nan]
        b: [1 2 3 4 5 6]
        c: [1 1 0 0 2 3]
        d: [ True False  True  True False False]
        DataDict (4) features x (6) samples
        <BLANKLINE>

        Boolean case
        >>> test = ex.deep_copy()
        >>> tokendict = test.tokenize('d')
        >>> for x in sorted(tokendict): print x,tokendict[x]
        d {0: False, 1: True}
        >>> test
        a: [  1.   2.   3.   4.   5.  nan]
        b: [1 2 3 4 5 6]
        c: ['hello' 'hello' 'goodbye' 'goodbye' 'unique1' 'unique2']
        d: [1 0 1 1 0 0]
        DataDict (4) features x (6) samples
        <BLANKLINE>

        All feature test
        >>> test = ex.deep_copy()
        >>> tokendict = test.tokenize()
        >>> for x in sorted(tokendict): print x,tokendict[x]
        c {0: 'goodbye', 1: 'hello', 2: 'unique1', 3: 'unique2'}
        d {0: False, 1: True}
        >>> test
        a: [  1.   2.   3.   4.   5.  nan]
        b: [1 2 3 4 5 6]
        c: [1 1 0 0 2 3]
        d: [1 0 1 1 0 0]
        DataDict (4) features x (6) samples
        <BLANKLINE>

        >>> test = DataDict({})
        >>> test.tokenize()
        {}
        """

        #If there is no data in the datadict, do nothing and return empty tokenization
        if self.numsamples == 0: return {}

        #If no headers are provided, use them all
        if usecols is None: usecols = self.features
        else              : usecols = self.resolve_features(usecols, multiple=True)

        #If no usecols are present, then do nothing and return an empty token dictionary
        if len(usecols) == 0: return {}

        tokendict = {}
        for feat in usecols:
            #handle boolean case
            if mlib_types.isbool(self.dictionary[feat][0]):
                tokendict[feat]       = dict(zip(range(2), [False, True]))
                self.dictionary[feat] = self.dictionary[feat].astype(int)
            #handle string case
            elif mlib_types.isstr(self.dictionary[feat][0]):
                uniquevals            = NUM.sortunique(self.dictionary[feat])   #the unique values to tokenize
                tokendict[feat]       = dict(zip(range(len(uniquevals)), uniquevals)) #new to old values to aid decoding
                mapdict               = dict(zip(uniquevals, range(len(uniquevals)))) #old to new value mapping for replacement
                self.dictionary[feat] = N.array([mapdict[x] for x in self.dictionary[feat]])

        return tokendict


    #--------------------------
    def sort_by(self, feature, func = None):
        """ Sort the rows in the DataDict by the specified feature/column.
        If func is supplied, applies this to the specified function first and sorts by results.

        >>> ex = DataDict({'one':N.arange(4),'two':N.arange(14,10,-1)})
        >>> ex
        one: [0 1 2 3]
        two: [14 13 12 11]
        DataDict (2) features x (4) samples
        <BLANKLINE>

        Reverse by sorting by 'two' column
        ----------------------------------
        >>> ex.sort_by('o$')
        >>> ex
        one: [3 2 1 0]
        two: [11 12 13 14]
        DataDict (2) features x (4) samples
        <BLANKLINE>

        Reverse back to normal by sorting by negative of current 'two' column
        ----------------------------------
        >>> ex.sort_by('o$',func = lambda x: -x)
        >>> ex
        one: [0 1 2 3]
        two: [14 13 12 11]
        DataDict (2) features x (4) samples
        <BLANKLINE>
        """
        if func is None:
            order = N.lexsort((self[feature],))
        else:
            order = N.lexsort((func(self[feature]),))
        for key in self.dictionary:
            self.dictionary[key] = self.dictionary[key][order]

    #-----------------------
    def iterate_samples(self, usecols = None):
        """ iterator that generates tuples of the requested fields to support "for (x,y,z) in datadict()

        Full dump
        ---------
        >>> ex = DataDict({'one':N.arange(4),'two':N.arange(14,10,-1)})
        >>> for val in ex.iterate_samples(): print val
        ...
        [0, 14]
        [1, 13]
        [2, 12]
        [3, 11]

        Select a single column by a regex
        >>> for val in ex.iterate_samples("e$"): print val
        ...
        [0]
        [1]
        [2]
        [3]

        Select by index
        >>> for val in ex.iterate_samples(1): print val
        ...
        [14]
        [13]
        [12]
        [11]
        """

        #If no headers are provided, use them all
        if usecols is None: usecols = self.features
        else              : usecols = self.resolve_features(usecols, multiple=True)

        if len(usecols) == 0: yield []

        for i in range(self.numsamples()):
#            if len(usecols) == 1:
#                yield self.dictionary[usecols[0]][i]
#            else:
            yield [self.dictionary[feat][i] for feat in usecols]

    #------------
    def rename_feature(self, oldname, newname, literal = False):
        """ Renames a feature from oldname to newname. Oldname may be any resolvable feature reference.
        Newname must be a string of the new name to use. Must also be unique.

        >>> data = DataDict({'hello':[1,2,3], 'bye':[4,5,6], 'whoa':[7,8,9]})
        >>> data
          bye: [4 5 6]
        hello: [1 2 3]
         whoa: [7 8 9]
        DataDict (3) features x (3) samples
        <BLANKLINE>

        simple case
        >>> data.rename_feature('bye','goodbye')
        >>> data
        goodbye: [4 5 6]
          hello: [1 2 3]
           whoa: [7 8 9]
        DataDict (3) features x (3) samples
        <BLANKLINE>

        Reference by index (note, does not re-order feature names when renaming)
        >>> data.rename_feature(0, 'used_to_be_zero')
        >>> data
        used_to_be_zero: [4 5 6]
                  hello: [1 2 3]
                   whoa: [7 8 9]
        DataDict (3) features x (3) samples
        <BLANKLINE>

        Attempt to make a non-unique renaming
        >>> data.rename_feature('whoa','used_to_be_zero')
        Traceback (most recent call last):
        Exception: Suggested new feature name matches existing feature name: used_to_be_zero

        """

        #Resolve the old name
        oldname = self.resolve_features(oldname, multiple = False, literal = literal)

        #See if it resolves literally to anything existing in the features
        if self.resolve_features(newname, literal = True) is not None:
            raise Exception('Suggested new feature name matches existing feature name: '+newname)

        #Slickly move the feature to the new name
        self.dictionary[newname] = self.dictionary.pop(oldname)
        #Also rename the entry in the features array
        self.features[N.where(N.array(self.features) == oldname)[0][0]] = newname

    #-----------
    def remove_nonvarying_features(self):
        """ Remove features that are constant or always nan. Won't do anything to features that can't have N.min performed.
        Returns a list of the features removed.

        >>> data = DataDict({'hello':[1,2,3], 'bye':[4,5,6], 'whoa':[1,1,1], 'yikes':[N.nan,N.nan,N.nan], 'ok':[1,2,N.nan]})

        >>> data.remove_nonvarying_features()
        ['whoa', 'yikes']

        >>> data
          bye: [4 5 6]
        hello: [1 2 3]
           ok: [  1.   2.  nan]
        DataDict (3) features x (3) samples
        <BLANKLINE>

        """

        removed = []
        for feat in self.features[:]:
            #Nonvarying row can have all identical entries or be entirely nan
            try:
                if ( N.min(self.dictionary[feat]) == N.max(self.dictionary[feat]) or
                     N.sum(N.isnan(self.dictionary[feat])) == self.numrows() ) :
                    removed.append(feat)
                    del self[feat]
            except (ValueError, TypeError):
                pass

        return removed

    #------------
    def read_csv(self, filename, usecols = None, maxrows = None, delimiter = None, skipfooter = 0, mask = None):
        """ Read in a csv format file(s) into current datadict. First line is assumed to be header.
        Initial #header formulation will have # symbol removed automatically

        Args:
            filename  : path or iterator of paths to read, multiple infiles must have identical features
            usecols   : string or iterator of string specifying the columns to use, regex OK
            maxrows   : maximum number of samples to take per input file
            delimiter : Default None uses all whitespace as delimiter. Otherwise uses specified character.
            skipfooter: Number of lines (default 0) to skip at end of file. Sometimes necessary due to strange end of file conditions.
                        Only works if delimiter specified, oddly
            mask      : Apply a final row mask on returned results

        >>> testfile  = repo_path()+"/doctest_files/threshold_CMPLX_05_relative_residual_mean_square_weak_co2.txt"
        >>> testfilec = repo_path()+"/doctest_files/flatfile.csv"
        >>> data = DataDict()

        Read single file
        >>> data.read_csv(testfile)
        >>> data.numsamples_numfeatures()
        (100, 3)

        >>> data #doctest: +ELLIPSIS +NORMALIZE_WHITESPACE
        Transparency: [  1 ... 100]
        >L2/SpectralParameters/relative_residual_mean_square_weak_co2: [  0.00171786 ... 0.0568785 ]
        >ratio_killed: [ 6.30985000e-01 ... 2.54389000e-06]
        DataDict (3) features x (100) samples
        <BLANKLINE>

        Read same file but with , instead of whitespace delimiter (can't handle regex)
        >>> data.read_csv(testfilec, delimiter = ',')
        >>> data.numsamples_numfeatures()
        (100, 3)

        Read a single file & single column
        >>> data.read_csv(testfile, usecols = 'kill')
        >>> data #doctest: +ELLIPSIS +NORMALIZE_WHITESPACE
        >ratio_killed: [ 6.30985000e-01 ... 2.54389000e-06]
        DataDict (1) features x (100) samples
        <BLANKLINE>

        Read single file, all features, limited rows
        >>> data.read_csv(testfile, maxrows = 10    )
        >>> data #doctest: +ELLIPSIS +NORMALIZE_WHITESPACE
                                                         Transparency: [ 1  2       ... 9 10]
        >L2/SpectralParameters/relative_residual_mean_square_weak_co2: [ 0.00171786 ... 0.0017116 ]
                                                        >ratio_killed: [ 0.630985   ... 0.637223]
        DataDict (3) features x (10) samples
        <BLANKLINE>

        Attempt to read nonexistent file
        >>> data.read_csv("badfile")
        Traceback (most recent call last):
        Exception: Cannot locate file badfile

        Read multiple files
        >>> data.read_csv([testfile,testfile,testfile])
        >>> data.numsamples_numfeatures()
        (300, 3)

        Read multiple files mismatching
        >>> wrongfile = repo_path()+"/doctest_files/dogo_pareto_2016042703154300.txt"
        >>> data.read_csv([testfile,wrongfile])
        Traceback (most recent call last):
        Exception: Attempting to read multiple csv files with dissimilar available features

        """

        singleton = I.is_not_iterable(filename)
        if singleton: filename = [filename,]

        import pandas as PA

        #Pandas needs help to do feature substring matches
        #Base on initial file only
        if usecols is not None:
            with open(filename[0],'r') as f: headers = f.readline()
            if delimiter is None:
                usecols = resolve_features(headers.strip().split(), usecols)
            else:
                usecols = resolve_features(headers.strip().split(delimiter), usecols)
            if I.is_not_iterable(usecols): usecols = [usecols,]

        self.dictionary = {}
        self.features   = []
        for filer in filename:
            if not S.exists(filer): raise Exception("Cannot locate file "+filer)
            if delimiter is None:
                dataframe = PA.read_csv( filer                         ,
                                         delim_whitespace = True       ,
                                         usecols          = usecols    ,
                                         nrows            = maxrows    ,
                                         header           = 0           ) #header=0 means first row is header
            else:
                dataframe = PA.read_csv( filer                         ,
                                         delimiter        = delimiter  ,
                                         engine           = 'python'   ,
                                         usecols          = usecols    ,
                                         nrows            = maxrows    ,
                                         header           = 0          ,
                                         skipfooter       = skipfooter ) #sometimes needed due to strange end of file conditions

            if len(self.features)> 0:
                if ( len(dataframe.columns.values.tolist()) != len(self.features) ) or N.any( N.array(dataframe.columns.values.tolist()) != N.array(self.features) ):
                    raise Exception("Attempting to read multiple csv files with dissimilar available features")

            self.update(dataframe)

        #get rid of leading # if present
        if self.features[0][0] == "#": self.rename_feature( self.features[0], self.features[0][1:] )

        #Convert any 'O' datatypes to '|S' strings
        for feat in self.features:
            if self.dictionary[feat].dtype == 'O': self.dictionary[feat] = self.dictionary[feat].astype('|S')

        #Apply mask
        if mask is not None: self.apply_mask(mask)


    #------------
    def read_h5(self, filename, usecols = None, maxrows = None, mask = None):
        """ Read in an h5 format file as a datadict.

        >>> testfile = repo_path()+"/doctest_files/sample_oco2.h5"
        >>> data = DataDict()

        Read entire file
        >>> data.read_h5(testfile                  )
        >>> data.numsamples_numfeatures()
        (1000, 321)

        Read a single column with regex
        >>> data.read_h5(testfile, usecols = 'xco2$')
        >>> data.numsamples_numfeatures()
        (1000, 2)
        >>> data.features
        ['L2/RetrievalResults/xco2', 'Mandrake/TCCON_median_xco2']

        Read a single column with maxval limit
        >>> data.read_h5(testfile, maxrows = 10    , usecols = 'xco2$')
        >>> data.numsamples_numfeatures()
        (10, 2)

        Try to read a nonexistant file
        >>> data.read_h5("badfile")
        Traceback (most recent call last):
        IOError: Unable to open file (Unable to open file: name = 'badfile', errno = 2, error message = 'no such file or directory', flags = 0, o_flags = 0)

        Test multiple file read
        >>> data.read_h5([testfile,testfile,testfile])
        >>> data.numsamples_numfeatures()
        (3000, 321)

        Multiple file read with usecol
        >>> data.read_h5([testfile,testfile,testfile], usecols = 'xco2$')
        >>> data.numsamples_numfeatures()
        (3000, 2)

        Test multiple file read on mismatching files (different headers)
        >>> wrongfile = repo_path()+"/doctest_files/svego_test.h5"
        >>> data.read_h5([testfile,wrongfile])
        Traceback (most recent call last):
        Exception: Attempting to read multiple h5 files with dissimilar available features

        """

        import mlib_HDF5 as H

        singleton = I.is_not_iterable(filename)
        if singleton: filename = [filename,]

        #Read in the requested columns from each sourcefile
        self.dictionary = {}
        self.features   = []
        for filer in filename:
            data = H.read(filer, usecols = usecols, maxrows = maxrows, mask = mask)
            #If this isn't the first file, check for mismatching features in the multiple files
            if len(self.features)> 0:
                if ( len(data.features) != len(self.features) ) or N.any( N.array(data.features) != N.array(self.features) ):
                    raise Exception("Attempting to read multiple h5 files with dissimilar available features")
            #Have to pass as dictionary because at this point the DataDict class isn't recognizable for some reason to isinstance
            self.update(data.dictionary)

    #------------
    def write_csv(self, filename, usecols = None):
        """ Writes out a space-delimited text file containing the DataDict or a subset of its features

        >>> import mlib_HDF5 as H
        >>> path = repo_path()
        >>> infile  = path+  "/doctest_files/sample_oco2.h5"
        >>> chkfile = path+  "/doctest_files/sample_oco2.txt"
        >>> outfile = path+"/doctest_working/sample_oco2.txt"
        >>> worker = H.read (infile)
        >>> worker.write_csv(outfile)
        >>> import filecmp
        >>> print filecmp.cmp(outfile, chkfile)
        True

        >>> worker = H.read(infile, usecols = 'Results/xco2$')
        >>> worker.write_csv(outfile)

        """
        if usecols is None: usecols = self.features
        if I.is_not_iterable(usecols): usecols = [usecols,]
        usecols = self.resolve_features(usecols)

        if filename[-3:].lower() == ".gz":
            import gzip
            access = gzip.open
        else:
            access = open

        with access(filename,"w") as f:
            f.write("#"+" ".join(usecols)+"\n")
            for vals in self.iterate_samples(usecols):
                f.write(" ".join([str(x) for x in vals])+"\n")

    #------------
    def write_HDF(self, filename, usecols = None):
        """ Writes out an h5 file containing the DataDict or a subset of its features with numrows attribute set

        >>> import mlib_HDF5 as H
        >>> path = repo_path()
        >>> infile  = path+  "/doctest_files/sample_oco2.h5"
        >>> outfile = path+"/doctest_working/sample_oco2.h5"
        >>> worker = H.read (infile)
        >>> worker.write_HDF(outfile)
        >>> H.compare_files(outfile, infile)
        True
        """

        if usecols is None: usecols = self.features
        usecols = self.resolve_features(usecols)
        import mlib_HDF5 as H
        H.write(filename, self)

    #------------
    def create_subsample(self, num_desired = None, with_replacement = False, return_indices = False, preselect = None, usecols = None,
                         randomseed = None, mask = None):
        """ Subsample a datadict by features and/or samples. Returns a new DataDict.

        Args:
            num_desired     : how many samples are desired, if None selects all of them
            with_replacement: Draw  randomly like a replacement draw. Useful for bootstrapping. Default False. Ignores preselection.
            return_indices  : Also return a list of the indices selected from the original DataDict's samples
            preselect       : a boolean mask or list of indices to select first before the randomized subsample proceeds.
            usecols         : regex or indices to specify the features to carry forward in the subsample
            randomseed      : If set with an integer, resets the Numpy global random seed for reproducibility
            mask            : Simply take a boolean mask or specified indices, overrides all other settings except usecols

        >>> N.random.seed(0)

        Specify a user mask boolean
        >>> DataDict({'one':N.arange(10),'two':N.arange(20,10,-1)}).create_subsample(mask = [True,]*3+[False,]*7)
        one: [0 1 2]
        two: [20 19 18]
        DataDict (2) features x (3) samples
        <BLANKLINE>

        Demonstrate this is a deep_copy and will not harm parent datadict
        >>> parent = DataDict({'one':[1,2,3,4],'two':[4,3,2,1]})
        >>> sub    = parent.create_subsample()
        >>> sub['one'][2] = 90
        >>> sub
        one: [ 1  3 90  4]
        two: [4 2 3 1]
        DataDict (2) features x (4) samples
        <BLANKLINE>
        >>> parent
        one: [1 2 3 4]
        two: [4 3 2 1]
        DataDict (2) features x (4) samples
        <BLANKLINE>

        Specify a user mask indices
        >>> DataDict({'one':N.arange(10),'two':N.arange(20,10,-1)}).create_subsample(mask = [0,1,2])
        one: [0 1 2]
        two: [20 19 18]
        DataDict (2) features x (3) samples
        <BLANKLINE>

        Ensure new data is not linked to old data
        >>> d1 = DataDict({'one':N.arange(10),'two':N.arange(20,10,-1)})
        >>> d2 = d1.create_subsample()
        >>> d2['one'] = [9,]*10
        >>> d1['one']
        array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])

        Take a simple random sample, without replacement, for all columns
        >>> DataDict({'one':N.arange(10),'two':N.arange(20,10,-1)}).create_subsample(4,randomseed = 0)
        one: [8 9 4 2]
        two: [12 11 16 18]
        DataDict (2) features x (4) samples
        <BLANKLINE>

        Use replacement so duplication is allowed
        >>> DataDict({'one':N.arange(10),'two':N.arange(20,10,-1)}).create_subsample(4,with_replacement=True,randomseed = 0)
        one: [5 3 0 3]
        two: [15 17 20 17]
        DataDict (2) features x (4) samples
        <BLANKLINE>

        Preselect first element
        >>> DataDict({'one':N.arange(10),'two':N.arange(20,10,-1)}).create_subsample(4,preselect = [0,],randomseed = 0)
        one: [2 0 3 8]
        two: [18 20 17 12]
        DataDict (2) features x (4) samples
        <BLANKLINE>

        Take only one feature
        >>> DataDict({'one':N.arange(10),'two':N.arange(20,10,-1)}).create_subsample(4,preselect = [0,],randomseed = 0,usecols=['on'])
        one: [2 0 3 8]
        DataDict (1) features x (4) samples
        <BLANKLINE>

        Return some indices
        >>> DataDict({'one':N.arange(10),'two':N.arange(20,10,-1)}).create_subsample(4,preselect = [0,],randomseed = 0,usecols=['on'],return_indices = True)
        (one: [2 0 3 8]
        DataDict (1) features x (4) samples
        , array([2, 0, 3, 8]))

        Test unspecified call (copies everything)
        >>> DataDict({'one':N.arange(10),'two':N.arange(20,10,-1)}).create_subsample()
        one: [2 3 4 6 0 9 5 1 8 7]
        two: [18 17 16 14 20 11 15 19 12 13]
        DataDict (2) features x (10) samples
        <BLANKLINE>
        """

        if randomseed is not None: N.random.seed(randomseed)

        from mlib_numeric import subsample_indices
        newDataDict = DataDict()
        numrows = self.numrows()

        if mask is not None:
            indices = N.arange(self.numrows())[N.array(mask)]
        else:
            if num_desired is None: num_desired = numrows
            indices = subsample_indices(num_available = numrows, num_desired = num_desired, with_replacement = with_replacement,
                                        preselect = preselect)

        #Sort out features to copy over
        if usecols is None:
            usecols = self.features[:]
        else:
            usecols = self.resolve_features(usecols, multiple = True)

        #Perform data copying with our new mask
        for feat in usecols: newDataDict.append(feat, self.dictionary[feat][indices])

        if return_indices:
            return newDataDict, indices
        else:
            return newDataDict

    #------------------
    def stats(self, usecols = None):
        """ Return stats on all/some features. Result is a dictionary['std'/'mean'/'max'/'min'/'median'][feats]

        >>> data = DataDict({'eaten/numcandy': [15, 31, 13, 47, 30], 'kid/height': [3.5, 4.7, 2, 2.5, 5], 'kid/weight': [40, 60, 30, 55, 90]})

        >>> PP(data.stats())
        {'max': {'eaten/numcandy': 47, 'kid/height': 5.0, 'kid/weight': 90},
         'mean': {'eaten/numcandy': 27.199999999999999,
                  'kid/height': 3.54,
                  'kid/weight': 55.0},
         'median': {'eaten/numcandy': 30.0, 'kid/height': 3.5, 'kid/weight': 55.0},
         'min': {'eaten/numcandy': 13, 'kid/height': 2.0, 'kid/weight': 30},
         'std': {'eaten/numcandy': 13.827508813954884,
                 'kid/height': 1.3164345787011218,
                 'kid/weight': 22.912878474779198}}

        >>> PP(data.stats("num"))
        {'max': {'eaten/numcandy': 47},
         'mean': {'eaten/numcandy': 27.199999999999999},
         'median': {'eaten/numcandy': 30.0},
         'min': {'eaten/numcandy': 13},
         'std': {'eaten/numcandy': 13.827508813954884}}

        >>> DataDict({'one':[],}).stats()
        {'std': {}, 'max': {}, 'min': {}, 'median': {}, 'mean': {}}

        >>> DataDict({}).stats()
        {'std': {}, 'max': {}, 'min': {}, 'median': {}, 'mean': {}}

        """
 # doctest: +NORMALIZE_WHITESPACE +ELLIPSIS
        stats = {
        'mean'  : {},
        'std'   : {},
        'max'   : {},
        'min'   : {},
        'median': {},
        }

        if self.numsamples() == 0: return stats

        if usecols is None:
            usecols = self.features[:]
        else:
            usecols = self.resolve_features(usecols, multiple = True)

        for feat in usecols:
            stats['std'   ][feat] = N.std   (self.dictionary[feat].astype(N.float64), ddof=1) #divide by sqrt(N-1) like the rest of humanity
            stats['mean'  ][feat] = N.mean  (self.dictionary[feat])
            stats['max'   ][feat] = N.max   (self.dictionary[feat])
            stats['min'   ][feat] = N.min   (self.dictionary[feat])
            stats['median'][feat] = N.median(self.dictionary[feat])

        return stats

    #------------------
    def normalize(self, kind = "standardize", usecols = None, literal = False):
        """ Normalizes specified features in the desired normalization manner.

        Args:
            kind        : default "standardize," any kind supported by NUM.normalize
            usecols     : the features to normalize, default all
            literal     : force only literal feature name matching

        >>> test = DataDict({'one':N.arange(10),'two':N.arange(20,10,-1)})
        >>> test.normalize()
        >>> test #doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
        one: [-1.48630108 -1.15601195 ...   1.48630108]
        two: [ 1.48630108  1.15601195 ...  -1.48630108]
        DataDict (2) features x (10) samples
        <BLANKLINE>

        >>> test = DataDict({'one':N.arange(10),'two':N.arange(20,10,-1)})
        >>> test.normalize(usecols = 'one')
        >>> test
        one: [-1.48630108 -1.15601195 -0.82572282 -0.49543369 -0.16514456  0.16514456
          0.49543369  0.82572282  1.15601195  1.48630108]
        two: [20 19 18 17 16 15 14 13 12 11]
        DataDict (2) features x (10) samples
        <BLANKLINE>

        """

        if usecols is None:
            usecols = self.features[:]
        else:
            usecols = self.resolve_features(usecols, multiple = not literal, literal = literal)

        from mlib_numeric import normalize
        for feat in usecols:
            self.dictionary[feat] = normalize(self.dictionary[feat], kind = kind)

    #------------------
    def __eq__(self, other):
        """ Compare a datadict with an other.

        >>> test1 = DataDict({'one':N.arange(10),'two':N.arange(20,10,-1)  })
        >>> test2 = DataDict({'one':N.arange(10),'two':N.arange(20,10,-1)+1})
        >>> test1 == 2
        False
        >>> test1 == None
        False
        >>> test1 == test1
        True
        >>> test1 == test2
        False
        >>> test1 == test1.deep_copy()
        True

        """

        if not isinstance(other, DataDict): return False
        if not (N.array(self.features) == N.array(other.features)).all(): return False
        for feat in self.features:
            if not (self.dictionary[feat] == other[feat]).all(): return False
        return True

    #------------------
    def __repr__(self):
        """ String representation of DataDict, tested in virtually every function above. """

        numsamps, numfeats = self.numsamples_numfeatures()

        if numfeats == 0:
            return "DataDict (0) features x (0) samples"

        outstring = ""
        maxlength = max([len(x) for x in self.features])
        fmt = "% "+str(maxlength)+"s"
        for h in self.features:
            outstring += fmt%h+": "+str(self.dictionary[h])+"\n"

        outstring +="DataDict (%d) features x (%d) samples\n"%(numfeats, numsamps)

        sample_array = N.array(self.numsamples_per_feature())

        typical_length = N.median(sample_array)

        if N.sum(N.abs(sample_array - typical_length)) > 0:

            outstring +="*****Warning! Varying length features\n"

            for i,h in enumerate( sorted(self.features)):
                outstring += h+" %d"%(self.dictionary[h].size)
                if self.dictionary[h].size != typical_length: outstring += " *****"
                outstring += "\n"

        return outstring
    #-----------------------
    def nbytes(self):
        """ Returns the number of bytes required for this datadict, approximate but close.

        >>> DataDict({'one':N.arange(1000),'two':N.arange(2000,1000,-1)}).nbytes()
        16392
        >>> DataDict({}).nbytes()
        352
        """
        import sys
        total = sys.getsizeof(self.dictionary) + sys.getsizeof(self.features)
        for feat in self.features: total += self.dictionary[feat].nbytes
        return total

    #-----------------------
    def as_array(self, usecols = None, mask = None, literal = False):
        """ Return the data within the DataDict as a 2D Numpy Array for computation (samples x features).

        Args:
            usecols: specifies regex or index features to include
            mask   : only include data specified by mask (boolean or indices)
            literal: Treat all usecol specifiers as literal, full strings

        Take entire array
        >>> DataDict({'one':N.arange(10),'two':N.arange(20,10,-1)}).as_array()
        array([[ 0, 20],
               [ 1, 19],
               [ 2, 18],
               [ 3, 17],
               [ 4, 16],
               [ 5, 15],
               [ 6, 14],
               [ 7, 13],
               [ 8, 12],
               [ 9, 11]])

        Take only the last four samples
        >>> DataDict({'one':N.arange(10),'two':N.arange(20,10,-1)}).as_array(mask = [False,]*6 + [True,]*4)
        array([[ 6, 14],
               [ 7, 13],
               [ 8, 12],
               [ 9, 11]])

        Take only the first feature
        >>> DataDict({'one':N.arange(10),'two':N.arange(20,10,-1)}).as_array(mask = [False,]*6 + [True,]*4, usecols = 0)
        array([[6],
               [7],
               [8],
               [9]])

        Match by feature name
        >>> DataDict({'one':N.arange(10),'onetwo':N.arange(20,10,-1)}).as_array(usecols = "one")[:5]
        array([[20,  0],
               [19,  1],
               [18,  2],
               [17,  3],
               [16,  4]])

        Match by feature name
        >>> DataDict({'one':N.arange(10),'onetwo':N.arange(20,10,-1)}).as_array(usecols = "one", literal = True)[:5]
        array([[0],
               [1],
               [2],
               [3],
               [4]])

        Match by feature name, demonstrate order is preserved
        >>> test = DataDict({'a':[1,2,3,4],'b':[2,3,4,5],'c':[3,4,5,6],'d':[4,5,6,7]})
        >>> test.features
        ['a', 'b', 'c', 'd']
        >>> test.as_array()
        array([[1, 2, 3, 4],
               [2, 3, 4, 5],
               [3, 4, 5, 6],
               [4, 5, 6, 7]])

        >>> test.as_array(usecols = ['d','c','b','a'])
        array([[4, 3, 2, 1],
               [5, 4, 3, 2],
               [6, 5, 4, 3],
               [7, 6, 5, 4]])


        """
        if usecols is None:
            usecols = self.features
        else:
            usecols = self.resolve_features(usecols, multiple = True, literal = literal)
        if mask is None:
            mask = N.ones(self.numrows(), dtype='bool')

        return N.array([self.dictionary[h][N.array(mask)] for h in usecols]).T

    #-----------------------
    def unchanging_features(self):
        """ Returns a list of all features that do not change over their entire span.
        Useful for pre-filtertation for regression purposes.

        >>> data = DataDict({'one':N.arange(10),'two':N.arange(20,10,-1), 'three':[1,]*10})
        >>> data.unchanging_features()
        ['three']

        >>> data = DataDict({'one':N.arange(10),'two':N.arange(20,10,-1)})
        >>> data.unchanging_features()
        []

        >>> data = DataDict({'one':[],})
        >>> data.unchanging_features()
        []

        >>> data = DataDict({})
        >>> data.unchanging_features()
        []

        """

        if self.numsamples() == 0: return []

        return [feat for feat in self.features if N.max(self.dictionary[feat]) == N.min(self.dictionary[feat])]

    #-----------------------
    def identical_scaled_features(self):
        """ Performs standardization and compares data for equal features.
        Faster than correlation and still finds many related features.
        Wastes memory.

        Compare entire vector
        >>> data = DataDict({'one':N.arange(10),'two':N.arange(20,10,-1), 'three':[1,]*10, 'four':N.arange(10)+1})
        >>> data.identical_scaled_features()
        [('four', 'one'), ('four', 'two'), ('one', 'two')]

        Specify how many points to compare
        >>> data = DataDict({'one':N.arange(10),'two':N.arange(20,10,-1), 'three':[1,]*10})
        >>> data.identical_scaled_features()
        [('one', 'two')]

        Compare uncorrelated data
        >>> data = DataDict({'one':N.arange(10),'three':[1,]*10})
        >>> data.identical_scaled_features()
        []

        Empty case
        >>> data = DataDict({})
        >>> data.identical_scaled_features()
        []


        """

        #Make normalized copy of our data (expensive)
        normdata = self.deep_copy()
        normdata.normalize()

        #Take abs of data to ensure no nonsense about ascending/descending data reversing signs
        for feat in normdata.features: normdata[feat] = N.abs(normdata[feat])

        samefeats = []

        #Only compare the 2nd to last feature because need a pair
        for ifeat,feat in enumerate(self.features[:-1]):
            #Only compare features to the right because you've already compared those to the left above
            for ifeat2,feat2 in enumerate(self.features[ifeat+1:]):
                if N.all(normdata[feat2] == normdata[feat]):
                    samefeats += [(feat,feat2),]

        return samefeats

    #-----------------------
    def function_on_groups(self, feature_to_group, func, usecols = None, literal = False, multiple = True, progressbar = False):
        """ Group values in feature_to_group, then perform function "func" on each group for every feature specified in usecols.
        Args:
            feature_to_group: case 1: single string feature name to group by, governed by literal
                              case 2: an iterable of length self.numrows to use as the grouping ID's
            func            : reference to a function that returns either a single result or a vector of same length as input
            usecols         : column references to use, goverened by literal and multiple
            literal         : whether to include only literal matches in specified features, default False
            multiple        : whether to permit wildcard matches to multiple usecols, default True
            progressbar     : whether to print a progressbar to the screen or not

        >>> ex = DataDict( { 'group_id': N.linspace(-2,2,10).astype(int),
        ...                  'feat1'   : N.arange(10)-100,
        ...                  'feat2'   : N.arange(10)+100,  } )
        >>> ex
           feat1: [-100  -99  -98  -97  -96  -95  -94  -93  -92  -91]
           feat2: [100 101 102 103 104 105 106 107 108 109]
        group_id: [-2 -1 -1  0  0  0  0  1  1  2]
        DataDict (3) features x (10) samples
        <BLANKLINE>

        Affect all feats
        >>> ex1 = ex.deep_copy()
        >>> ex1.function_on_groups('group_id', NUM.subtract_median)
        >>> ex1
           feat1: [ 0.  -0.5  0.5 -1.5 -0.5  0.5  1.5 -0.5  0.5  0. ]
           feat2: [ 0.  -0.5  0.5 -1.5 -0.5  0.5  1.5 -0.5  0.5  0. ]
        group_id: [-2 -1 -1  0  0  0  0  1  1  2]
        DataDict (3) features x (10) samples
        <BLANKLINE>

        Affect only feat1
        >>> ex2 = ex.deep_copy()
        >>> ex2.function_on_groups('group_id', NUM.subtract_median, usecols = 'feat1')
        >>> ex2
           feat1: [ 0.  -0.5  0.5 -1.5 -0.5  0.5  1.5 -0.5  0.5  0. ]
           feat2: [100 101 102 103 104 105 106 107 108 109]
        group_id: [-2 -1 -1  0  0  0  0  1  1  2]
        DataDict (3) features x (10) samples
        <BLANKLINE>

        """

        #Resolve features to affect
        if usecols is None:
            usecols = self.features
        else:
            usecols = self.resolve_features(usecols, multiple = True, literal = literal)

        #Did the user pass in the data to group by, or do we use one of our own features?
        if I.is_iterable(feature_to_group):
            grouping_data = feature_to_group
        else:
            feature_to_group = self.resolve_features(feature_to_group, multiple = False, literal = literal)
            grouping_data = self.dictionary[feature_to_group]

        #Determine indices for each group
        group_indices, unique_group_ids = NUM.indices_per_group_id(grouping_data)

        if progressbar:
            from mlib_progressbar import bar_nospam
            vals = bar_nospam(usecols)
        else:
            vals = usecols

        #Perform func on specified groups for each feature requested
        for feat in vals:
            #Don't process the grouping feature in this way, nevermind if use passed in own array to use for group_ids
            if I.is_iterable(feature_to_group) or ( feat != feature_to_group ):
                self.dictionary[feat] = NUM.function_on_groups(self.dictionary[feat], group_indices, func = func)

    #-----------------------
    def highly_correlated_features(self, number_to_compare = None):
        """ Returns a list of all features that can be constructed as a linear model of another single feature.
        Only returns the "rightmost" of the dependant pair. Useful for pre-filtration for regression purposes.
        EXTREMELY SLOW.

        Compare entire vector
        >>> data = DataDict({'one':N.arange(10),'two':N.arange(20,10,-1), 'three':[1,]*10, 'four':N.arange(10)+1})
        >>> data.highly_correlated_features()
        [('four', 'one'), ('four', 'two'), ('one', 'two')]

        Specify how many points to compare
        >>> data = DataDict({'one':N.arange(10),'two':N.arange(20,10,-1), 'three':[1,]*10})
        >>> data.highly_correlated_features(5)
        [('one', 'two')]

        Compare uncorrelated data
        >>> data = DataDict({'one':N.arange(10),'three':[1,]*10})
        >>> data.highly_correlated_features()
        []

        Empty case
        >>> data = DataDict({})
        >>> data.highly_correlated_features()
        []

        """

        import mlib_correlation as C
        CORRELATION_FOR_EQUALITY = 0.9999999
        corrfeats = []

        if (number_to_compare is None) or (number_to_compare >= self.numrows()):
            mask = N.array([True,]*self.numrows())
        else:
            number_to_compare = int(number_to_compare)
            mask = N.array([True,]*number_to_compare + [False,]*(self.numrows() - number_to_compare))
            N.random.shuffle(mask)

        #Only compare the 2nd to last feature because need a pair
        for ifeat,feat in enumerate(self.features[:-1]):
            #Only compare features to the right because you've already compared those to the left above
            for ifeat2,feat2 in enumerate(self.features[ifeat+1:]):
                if N.abs(C.pearson_correlation(self.dictionary[feat][mask],self.dictionary[feat2][mask])) > CORRELATION_FOR_EQUALITY:
                    corrfeats += [(feat,feat2),]

        return corrfeats

    #-----------------------
    def keep_matching_values(self, match_feat, match_values, assume_unique = True):
        """ Applies a filter to the current datadict that keeps only feature elements found within match_values.

        Args:
            match_feat   : resolvable regex of feature column to match, shortest single match taken
            match_values : values to match in datadict[match_feat]
            assume_unique: if True, faster algorithm is used to perform matching that will miss multiple, redundant values.

        Returns:
            num_removed  : The number of rows removed.

        Simple inclusive case, assume_unique=True
        >>> data = DataDict({'id':['a','b','c','d','e','f'] })
        >>> data.keep_matching_values('id',['a','f'])
        4
        >>> data
        id: ['a' 'f']
        DataDict (1) features x (2) samples
        <BLANKLINE>

        Simple exclusive case, assume_unique=True
        >>> data = DataDict({'id':['a','b','c','d','e','f'] })
        >>> data.keep_matching_values('id',['g','h'])
        6
        >>> data
        id: []
        DataDict (1) features x (0) samples
        <BLANKLINE>

        feature not present
        >>> data.keep_matching_values('nothere',[1,2])
        Traceback (most recent call last):
        KeyError: None

        Empty case, assume_unique=True
        >>> data = DataDict({'id':['a','b','c','d','e','f'] })
        >>> data.keep_matching_values('id',[])
        6
        >>> data
        id: []
        DataDict (1) features x (0) samples
        <BLANKLINE>

        Empty dict, assume_unique = True
        >>> data = DataDict({})
        >>> data.keep_matching_values('id',['hi',])
        0
        >>> data
        DataDict (0) features x (0) samples

        Simple inclusive case, assume_unique=False
        >>> data = DataDict({'id':['a','a','b','b','c','c'] })
        >>> data.keep_matching_values('id',['a','c','a','c'], assume_unique=False)
        2
        >>> data
        id: ['a' 'a' 'c' 'c']
        DataDict (1) features x (4) samples
        <BLANKLINE>

        Empty case, assume_unique=False
        >>> data = DataDict({'id':['a','a','b','b','c','c'] })
        >>> data.keep_matching_values('id',[], assume_unique=False)
        6
        >>> data
        id: []
        DataDict (1) features x (0) samples
        <BLANKLINE>

        Empty dict, assume_unique = False
        >>> data = DataDict({})
        >>> data.keep_matching_values('id',['hi',], assume_unique=False)
        0
        >>> data
        DataDict (0) features x (0) samples
        """

        mask_dd, mask_val = self.mask_matching_values(match_feat, match_values, assume_unique = assume_unique)

        self.apply_mask(mask_dd)

        return N.sum(~mask_dd)

    #-----------------------
    def mask_matching_values(self, match_feat, match_values, assume_unique = True):
        """ Returns a boolean mask for values in datadict that match specified values in the specified feature.

        Args:
            match_feat   : resolvable regex of feature column to match, shortest single match taken
            match_values : values to match in datadict[match_feat]
            assume_unique: if True, faster algorithm is used to perform matching that will miss multiple, redundant values.

        Returns:
            mask_dd      : Boolean Ndarray mask of which datadict elements are present in match_values
            mask_vals    : Boolean Ndarray mask of which match_values are present in datadict elements

        >>> data  = DataDict({'id':['a','b','c','d','e','f'], 'count':range(6)})
        >>> empty = DataDict({})

        Simple inclusive case, assume_unique=True
        >>> data.mask_matching_values('id',['a','f'])
        (array([ True, False, False, False, False,  True], dtype=bool), array([ True,  True], dtype=bool))

        Redundant inclusive case, assume_unique=True, Note erroneous second mask due to redundant values
        >>> data.mask_matching_values('id',['a','f','a','f'])
        (array([ True, False, False, False, False,  True], dtype=bool), array([False, False,  True,  True], dtype=bool))

        Simple exclusive case, assume_unique=True
        >>> data.mask_matching_values('id',['g','h'])
        (array([False, False, False, False, False, False], dtype=bool), array([False, False], dtype=bool))

        Mixed inclusive and exclusive
        >>> data.mask_matching_values('id',['a','g','f','h'])
        (array([ True, False, False, False, False,  True], dtype=bool), array([ True, False,  True, False], dtype=bool))

        feature not present
        >>> data.mask_matching_values('nothere',[1,2])
        Traceback (most recent call last):
        KeyError: None

        Empty case, assume_unique=True
        >>> data.mask_matching_values('id',[])
        (array([False, False, False, False, False, False], dtype=bool), array([], dtype=bool))

        Empty dict, assume_unique = True
        >>> empty.mask_matching_values('id',['hi',])
        (array([], dtype=bool), array([False], dtype=bool))

        >>> data  = DataDict({'id':['a','a','b','b','c','c'], 'count':range(6)})

        Simple inclusive case, assume_unique=False
        >>> PP(data.mask_matching_values('id',['a','c'], assume_unique=False))
        (array([ True,  True, False, False,  True,  True], dtype=bool),
         array([ True,  True], dtype=bool))

        Redundant inclusive case, assume_unique=False
        >>> PP(data.mask_matching_values('id',['a','c','a','c'], assume_unique=False))
        (array([ True,  True, False, False,  True,  True], dtype=bool),
         array([ True,  True,  True,  True], dtype=bool))

        Simple exclusive case, assume_unique=False
        >>> PP(data.mask_matching_values('id',['g','h'], assume_unique=False))
        (array([False, False, False, False, False, False], dtype=bool),
         array([False, False], dtype=bool))

        Empty case, assume_unique=False
        >>> data.mask_matching_values('id',[], assume_unique=False)
        (array([False, False, False, False, False, False], dtype=bool), array([], dtype=bool))

        Empty dict, assume_unique = False
        >>> empty.mask_matching_values('id',['hi',], assume_unique=False)
        (array([], dtype=bool), array([False], dtype=bool))

        """

        #Find matching indices into current dictionary
        idx_val, idx_dd = self.matching_indices( match_feat, match_values, assume_unique = assume_unique, omit_mismatch = True )

        #If we can't assume uniqueness, then we receive a list of lists. Flatten the indices provided.
        if not assume_unique:
            idx_dd  = NUM.sortunique(NUM.flatten(idx_dd ))
            idx_val = NUM.sortunique(NUM.flatten(idx_val))

        mask_dd  = N.zeros(self.numrows()   , dtype=bool)
        mask_val = N.zeros(len(match_values), dtype=bool)
        if len(idx_val) > 0: mask_dd [idx_val ] = True
        if len(idx_dd ) > 0: mask_val[idx_dd  ] = True

        return mask_dd, mask_val

    #-----------------------
    def matching_indices(self, match_feat, match_values, assume_unique = True, omit_mismatch = False):
        """ Performs a quick match between match_values and the match_feat feature,
           returning the matching indices into the dictionary for each value.
           -1's are used for no match, because N.nan cannot be an integer index

        Args:
            match_feat    : resolvable regex, shortest single match taken
            match_values  : values to locate in datadict[match_feat] and record their indices
            assume_unique : if True, only a single index (or -1) is returned for each match_values. Much faster.
                            if False, an array of matching indices is provided per match_value. Much slower.
            omit_mismatch : Supresses -1 index returns when assume_unique is True. No effect if assume_unique is False. Default False.

        Returns:
            if assume_unique, these are N.array(len(match_values)) of matching indices with -1 indicating no match
            otherwise         these are lists(lists(indices)) indicating matching indices for each querry value

            datadict_index_for_each_val: The indices into the datadict for each provided value
            val_index_for_each_datadict: The indices into the values   for each datadict element


        >>> data  = DataDict({'id':['a','b','c','d','e','f'], 'count':range(6)})
        >>> empty = DataDict({})

        Simple inclusive case, assume_unique=True
        >>> data.matching_indices('id',['a','f'])
        (array([0, 5]), array([ 0, -1, -1, -1, -1,  1]))

        Simple inclusive case, assume_unique=True
        >>> data.matching_indices('id',['a','f'], omit_mismatch = True)
        (array([0, 5]), array([0, 1]))

        Redundant inclusive case, assume_unique=True
        >>> data.matching_indices('id',['a','f','a','f'])
        (array([0, 5, 0, 5]), array([ 2, -1, -1, -1, -1,  3]))

        Simple exclusive case, assume_unique=True
        >>> data.matching_indices('id',['g','h'])
        (array([-1, -1]), array([-1, -1, -1, -1, -1, -1]))

        Mixed inclusive and exclusive
        >>> data.matching_indices('id',['a','g','f','h'])
        (array([ 0, -1,  5, -1]), array([ 0, -1, -1, -1, -1,  2]))

        feature not present
        >>> data.matching_indices('nothere',[1,2])
        Traceback (most recent call last):
        KeyError: None

        Empty case, assume_unique=True
        >>> data.matching_indices('id',[])
        (array([], dtype=int64), array([], dtype=int64))

        Empty dict, assume_unique = True
        >>> empty.matching_indices('id',['hi',])
        (array([], dtype=int64), array([], dtype=int64))

        >>> data  = DataDict({'id':['a','a','b','b','c','c'], 'count':range(6)})

        Simple inclusive case, assume_unique=False
        >>> PP(data.matching_indices('id',['a','c'], assume_unique=False))
        ([array([0, 1]), array([4, 5])],
         [array([0]),
          array([0]),
          array([], dtype=int64),
          array([], dtype=int64),
          array([1]),
          array([1])])

        Redundant inclusive case, assume_unique=False
        >>> PP(data.matching_indices('id',['a','c','a','c'], assume_unique=False))
        ([array([0, 1]), array([4, 5]), array([0, 1]), array([4, 5])],
         [array([0, 2]),
          array([0, 2]),
          array([], dtype=int64),
          array([], dtype=int64),
          array([1, 3]),
          array([1, 3])])

        Simple exclusive case, assume_unique=False
        >>> PP(data.matching_indices('id',['g','h'], assume_unique=False))
        ([array([], dtype=int64), array([], dtype=int64)],
         [array([], dtype=int64),
          array([], dtype=int64),
          array([], dtype=int64),
          array([], dtype=int64),
          array([], dtype=int64),
          array([], dtype=int64)])

        Empty case, assume_unique=False
        >>> data.matching_indices('id',[], assume_unique=False)
        ([], [[], [], [], [], [], []])

        Empty dict, assume_unique = False
        >>> empty.matching_indices('id',['hi',], assume_unique=False)
        ([[]], [])
        """

        #Handle an empty datadict first
        if len(self.features) == 0 or len(match_values) == 0:
            return ( [[],]*len(match_values) if not assume_unique else N.array([],dtype=int),
                     [[],]*self.numrows()    if not assume_unique else N.array([],dtype=int)  )

        #resolve feature
        match_feat = self.resolve_features(match_feat)

        #Assuming uniqueness in both lists enables us to utilize a fast dictionary lookup method
        if assume_unique:

            lookup = dict(zip(self.dictionary[match_feat], range(len(self.dictionary[match_feat]))))
            dd_idx_for_each_val = N.array( [ (lookup[x] if x in lookup else -1) for x in match_values                ], dtype=int )

            lookup = dict(zip(match_values               , range(len(match_values               ))))
            val_idx_for_each_dd = N.array( [ (lookup[x] if x in lookup else -1) for x in self.dictionary[match_feat] ], dtype=int )

            #Strip out -1 indices if requested (normal behavior)
            if omit_mismatch:
                dd_idx_for_each_val = N.array([x for x in dd_idx_for_each_val if x > -1])
                val_idx_for_each_dd = N.array([x for x in val_idx_for_each_dd if x > -1])

        #Handle the fully general, slow case using where
        else:

            match_values = N.array(match_values)

            dd_idx_for_each_val = [ N.where(self.dictionary[match_feat] == x)[0] for x in match_values ]
            val_idx_for_each_dd = [ N.where(match_values == x)[0] for x in self.dictionary[match_feat] ]

        return dd_idx_for_each_val, val_idx_for_each_dd

if __name__ == "__main__":
    import doctest
    from mlib_doctest import repo_path
    doctest.testmod()
#    doctest.run_docstring_examples(DataDict.read_csv, globals())
