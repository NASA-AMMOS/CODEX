# -----------------------------------------------------------------
# -----------------------------------------------------------------
#
#  Mandrake lib (mlib) for formatting numbers, strings, etc.
#
# -----------------------------------------------------------------
#  -----------------------------------------------------------------

import sys
import numpy as N
import mlib.mtypes

SEC_IN_YEAR = 365.0 * 24.0 * 60.0 * 60.0
SEC_IN_MONTH = (365 / 12.0) * 24.0 * 60.0 * 60.0
SEC_IN_WEEK = 7 * 24.0 * 60.0 * 60.0
SEC_IN_DAY = 24.0 * 60.0 * 60.0
SEC_IN_HOUR = 60.0 * 60.0
SEC_IN_MIN = 60.0


def tight_format_string(array):
    """ Return formatting string appropriate to encapsulate the largest integer in a passed array.

    Call without integer values
    >>> tight_format_string([1,5,0.1])
    Traceback (most recent call last):
    Exception: Makes no sense to call this for non-integer data

    Standard case
    >>> tight_format_string([1,4,10,100,])%10
    '010'
    >>> tight_format_string([1,4,10,100,])%100
    '100'
    >>> tight_format_string([1,4,10,100,])
    '%03d'

    Singleton case
    >>> tight_format_string(1)%1
    '1'
    >>> tight_format_string(1)
    '%01d'

    Negative singleton
    >>> tight_format_string(-1)%(-1)
    '-1'
    >>> tight_format_string(-1)
    '% 02d'

    Negative integers
    >>> tight_format_string((-10, -100))%(-10)
    '-010'
    >>> tight_format_string((-10, -100))
    '% 04d'

    Empty case
    >>> tight_format_string(())
    '%d'

    Mixed integers
    >>> tight_format_string((-10,0,10))%0
    ' 00'
    >>> tight_format_string((-10,0,10))
    '% 03d'

    """

    if array is None: return "%d"

    from mlib.iterable import is_not_iterable
    if is_not_iterable(array): array = [array, ]

    if len(array) == 0: return "%d"

    newarr = N.array(array)
    if mlib.mtypes.isint(newarr[0]):
        negative = (newarr < 0).any()
        maxer = N.max(N.abs(array))
        sizer = int(N.log10(maxer)) + 1
        if negative: sizer += 1
        return "%" + (" " if negative else "") + "0" + "%dd" % (sizer)
    raise Exception('Makes no sense to call this for non-integer data')


# Return float/int as comma-grouped string
def commas(num):
    n2 = str(num)

    dec = ""
    if "." in n2:
        n2, dec = n2.split(".")

    out = ""
    while len(n2) > 0:
        if len(n2) > 3:
            out = "," + n2[-3:] + out
            n2 = n2[:-3]
        else:
            out = n2 + out
            n2 = ""

    if len(dec) == 0:
        return out
    else:
        return out + "." + dec


# Convert simple seconds to a SI version of the best unit available
def humantime(seconds, decimals=None):
    y = seconds / SEC_IN_YEAR
    if y >= 1.0: return SI(y, decimals=decimals) + "years"

    m = seconds / SEC_IN_MONTH
    if m >= 1.0: return "%0.2f " % (m) + "months"

    w = seconds / SEC_IN_WEEK
    if w >= 1.0: return "%0.2f " % (w) + "weeks"

    d = seconds / SEC_IN_DAY
    if d >= 1.0: return "%0.2f " % (d) + "days"

    h = seconds / SEC_IN_HOUR
    if h >= 1.0: return "%0.2f " % (h) + "hours"

    mm = seconds / SEC_IN_MIN
    if mm >= 1.0: return "%0.2f " % (mm) + "min"

    return SI(seconds) + " sec"


# Convert SI version of human time units back to seconds
def toseconds(humantimestring):
    import mlib.regex

    humantimestring = humantimestring.lower().replace(",", "")

    multiplier = 1
    if "min" in humantimestring: multiplier = SEC_IN_MIN
    if "hour" in humantimestring: multiplier = SEC_IN_HOUR
    if "day" in humantimestring: multiplier = SEC_IN_DAY
    if "week" in humantimestring: multiplier = SEC_IN_WEEK
    if "month" in humantimestring: multiplier = SEC_IN_MONTH
    if "year" in humantimestring: multiplier = SEC_IN_YEAR

    return float(mlib.regex.extract_groups("([0-9.+]+)", humantimestring)[0]) * multiplier


# Converts 145189 to 145k, using SI postfix such as k, M, G, T, P, E, Z, Y
# if postfix specified, will express number in specified units. Otherwise, will auto-determine appropriate postfix
# format may be "string"/"str", "float", or "int". Ints will be rounded. Default is string.
# decimals describes how many decimals of accuracy to maintain
# commas indicates to use commas as grouping for pretty-printing, only valid for string output
def SI(num, postfix=None, format="string", decimals=None, _commas=True):
    # If a string is passed in, treat as number
    if type(num) == type(""):
        if "," in num: num = num.replace(",", "")
        if "." in num:
            num = float(num)
        else:
            num = int(num)

    if decimals is None:
        if mlib.mtypes.isint(num):
            decimals = 0
        else:
            decimals = 2  # len(str(num).split('.')[-1])

    format = format.lower()

    if postfix == 'K': postfix = 'k'

    formats = ("string", "str", "float", "int")
    postfixes = N.array(('', 'k', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y'))
    exponents = (N.array(range(len(postfixes)))) * 3
    postfix_to_exponent = dict(zip(postfixes, exponents))

    # test for unknown format
    if not format in ("string", "float", "int"):
        print("Error! Specified format", format, "not recognized among", formats)
        sys.exit()

    # If no postfix specified, auto-determine best postfix
    if postfix is None:
        if float(num) == 0.0:
            exponent = 0
        else:
            exponent = int(N.log10(num))
        pref_dist = exponent - exponents
        pref_dist[pref_dist < 1] = N.max(exponents)  # ensure no negative values are picked
        postfix_index = N.argmin(pref_dist)
        postfix = postfixes[postfix_index]

    # test for unknown postfix code
    if not postfix in postfixes:
        print("Error! Specified postfix", postfix, "isn't recognized among", postfixes)
        sys.exit()

    # new value
    num /= 10.0 ** postfix_to_exponent[postfix]

    # Format output for return value
    if (format == "float"):
        return num

    if (format == "int"):
        return N.round(num)

    if (format == "str") or (format == "string"):
        # break value into left and right of decimal
        if not _commas:
            return ("%0." + str(decimals) + "f%s") % (num, postfix)
        else:
            wholenum = ("%0." + str(decimals) + "f") % num
            if "." in wholenum:
                wholenum = float(wholenum)
            else:
                wholenum = int(wholenum)
            return commas(wholenum) + postfix


# Return pretty fraction between two values
def prettyfraction(val1, val2, decimals=0):
    """ Prints two numbers in a pretty ratio with SI-type unit reduction.

    >>> prettyfraction(1,2)
    '1 / 2 = 50.0%'

    >>> prettyfraction(1,1e9)
    '1 / 1,000M = 0.0%'

    >>> prettyfraction(0,1)
    '0 / 1 = 0.0%'

    >>> prettyfraction(N.nan,10)
    'nan / 10 = nan%'

    >>> prettyfraction(0,N.nan)
    '0 / nan = nan%'

    >>> prettyfraction(N.nan,N.nan)
    'nan / nan = nan%'

    """

    if N.isnan(val1) or N.isnan(val2):
        return "%g / %g = nan%%" % (val1, val2)

    return SI(val1, decimals=decimals) + " / " + SI(val2, decimals=decimals) + " = %0.1f%%" % (
                val1 / float(val2 + 1e-99) * 100)


# Return a string reformatted to a user-specified length
def fixstr(strval, length, justify='left'):
    just = justify.lower()
    if ('left' in just) or ('lft' in just) or ('lt' in just) or ("l" in just):
        justchar = "-"
    elif ('right' in just) or ('rt' in just) or ("r" in just):
        justchar = " "
    else:
        print("WARNING: mlib.formatting.fixstr invalid justification requested", justify)
        return "?" * length

    # Clip string if necessary
    val = strval[:length]

    # formulate proper formatting command
    string_to_eval = '"%' + justchar + '%ds"' % length + "%val"
    return eval(string_to_eval)


# --------------------------------
# --------------------------------
# --------------------------------

if __name__ == "__main__":
    import doctest
    from mlib._doctest import repo_path

    doctest.testmod()
