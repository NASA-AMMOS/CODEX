# -----------------------------------------------------------------
# -----------------------------------------------------------------
#
#  Mandrake lib (mlib) for reading IDL save files
#
# -----------------------------------------------------------------
# -----------------------------------------------------------------

import scipy.io as SIO


def read_IDL_sav(filename):
    dictionary = SIO.readsav(filename, python_dict=True)
    return dictionary
