# -----------------------------------------------------------------
# -----------------------------------------------------------------
#
#  Mandrake lib (mlib) for handling standard flatfile handling
#
# -----------------------------------------------------------------
# -----------------------------------------------------------------

import numpy as N
import pandas as PA
import mlib.mtime
from mlib.iterable import is_iterable
import mlib.shell as S


# look up the index in headers of a partial string match, take the first hit blindly
def fastindex(headers, string):
    try:
        return [c for c, x in enumerate(headers) if string in x][0]
    except IndexError:
        raise IndexError("***ERROR: could not locate", string, "in", headers)


def fastarray(headers, string, data):
    return data[:, fastindex(headers, string)]


def read_header(filename):
    with S.smartopen(filename) as f:
        return N.array(f.readline().strip().split())


# quickly read in a WL given a flatfile infile (requires naming convention as used in v7)
def read_WL(infile_mainfile, maxrows=None):
    return read_as_pandas(infile_mainfile.replace(".txt.gz", "_WL.txt.gz"),
                          maxrows=maxrows, dtype=int).values.squeeze()


# quickly read in sounding ID's from a flatfile as strings
# first check to see if a precomputed sid file exists. If so, read it
# If not, extract it from the main file
def read_sounding_ids(infile, maxrows=None, force_extract=False, literal_filename=False):
    # Perform auto name change normally unless requested not to
    sids_file = infile if literal_filename else infile.replace(".txt.gz", ".sids.gz")

    # If sids file not present, read info from the main datafile
    if (not S.exists(sids_file)) or force_extract:
        return read_as_pandas(infile, usecols='sounding_id', maxrows=maxrows, dtype=str).values.squeeze()
    else:
        # Read existing sids file
        return read_as_pandas(sids_file, maxrows=maxrows, dtype=str, header=None).values.squeeze()


# quickly read in a flatfile
def read_flatfile(infile, usecols=None, maxrows=None, dtype=None, nosqueeze=False, delimiter=''):
    """ Reads in a standard Mandrake flatfile."""

    data = read_as_pandas(infile, usecols=usecols, maxrows=maxrows, dtype=dtype, delimiter=delimiter)

    if nosqueeze:
        return data.columns.values, data.values
    else:
        return data.columns.values.squeeze(), data.values.squeeze()


# Pass a bunch of approximate header names and receive the appropriate indices
def approx_headers_to_indices(names_desired, headers):
    if not is_iterable(names_desired): names_desired = [names_desired, ]
    return N.array([fastindex(headers, x) for x in names_desired])


# Pass a bunch of approximate header names and receive the matching fullnames
def approx_headers_to_full_headers(names_desired, headers):
    return headers[approx_headers_to_indices(names_desired, headers)]


# Return whether an approximate name is even present in the headers or not
def approx_headers_present(names_desired, headers):
    if not is_iterable(names_desired): names_desired = [names_desired, ]
    present = []
    for desired in names_desired:
        try:
            index = fastindex(headers, desired)
            present.append(True)
        except Exception:
            present.append(False)
    return N.array(present)


# This uses the awesome loading and typecasting of pandas to rapidly load the flatfile
# Saves factor of 4 memory somehow! But manipulating DataFrames as numerical arrays is painful
def read_as_pandas(filename, usecols=None, nrows=None, maxrows=None, dtype=None, header=0, delimiter=''):
    if len(delimiter) == 0: delimiter = '\\s+'

    # handle the singleton usecols case, cause read_csv doesn't and crashed with wild errors
    if usecols is not None:
        # singleton integer
        if type(usecols) in (N.int, N.int32, N.int64, int):
            usecols = [usecols, ]
        # singleton string
        elif type(usecols) in (str,):
            usecols = approx_headers_to_indices(usecols, read_header(filename))
        # array or list
        elif is_iterable(usecols):
            # array of strings
            if type(usecols[0]) in (str, N.string_):
                usecols = N.array(approx_headers_to_indices(usecols, read_header(filename)))

    data = PA.read_csv(S.smartopen(filename),
                       delimiter=delimiter,  # delim_whitespace = True       ,
                       usecols=usecols,
                       nrows=maxrows,
                       dtype=dtype,
                       header=header)  # header=0 means first row is header, set to None for no header at all
    # headers = data.columns.values

    # Should eventually convert programs to speak Panda, but not right now.
    return data


def safefloat(x):
    BADVAL = -999999

    try:
        return float(x)
    except ValueError:
        return BADVAL


def read_as_safe_floats(filename, max_samples=None, dtype=N.float64):
    data = []
    headers = []

    for c, line in enumerate(S.smartopen(filename)):

        if "#" in line:
            headers = line.strip().split()
            continue

        data.append([safefloat(x) for x in line.split()])

        if max_samples is not None:
            if c > max_samples + 1:
                print("**WARNING: Hit maximum samples to analyze. Will calculate based on", max_samples, "but still process entire file")
                break
    return headers, N.array(data, dtype=dtype)
