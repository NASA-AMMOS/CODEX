# -----------------------------------------------------------------
# -----------------------------------------------------------------
#
#  Mandrake lib (mlib) for regex support
#
# -----------------------------------------------------------------
# -----------------------------------------------------------------

import re
from mlib.iterable import is_not_iterable

SPECIAL_CHARS = ('\\', '(', ')', '^', '$', '.', '|', '?', '*', '+', '[', '{')


# -----------------
def enforce_literal(string_array):
    """ Converts a string containing potentially functional characters for RegEx evaluation into a standard string using backslashes.
   string_array may be a list or array of strings or a singleton string.

   Should not modify this untroublesome string

   >>> print(enforce_literal("The Quick Brown Fox Jumped Over the L8zy dog!"))
   The Quick Brown Fox Jumped Over the L8zy dog!

   Parenthesis and brackets are especially troublesome (except for right bracket, interestingly)

   >>> print(enforce_literal("I want (this) dog! Bra[cket]"))
   I want \(this\) dog! Bra\[cket]

   Use all the special characters in a single go!

   Doctest string answers have extra \\ characters due to doctest's parser... reduce all \\ chars to \ to comprehend output

   >>> print(enforce_literal("\\ () [] ^ $ . | ? * {}"))
   \\\\ \(\) \[] \^ \$ \. \| \? \* \{}

   Array case
   >>> enforce_literal(["hi","th3re","(pattern?)"])
   ['hi', 'th3re', '\\\\(pattern\\\\?\\\\)']
   """

    was_singleton = is_not_iterable(string_array)
    was_string = isinstance(string_array, str)
    if was_string:
        string_array = [string_array, ]
    retvals = []

    for string in string_array:
        # '\\' must come first or else will match backslashes added by later chars
        for char in SPECIAL_CHARS:
            string = string.replace(char, '\\' + char)
        retvals.append(string)
    if len(retvals) == 1:
        retvals = retvals[0]
    return retvals


# -----------------
def strip_special_from_strings(string_array):
    """ Remove any characters special to regular expressions from an input string or array of strings.

   Singleton case

   >>> print(strip_special_from_strings("Th3 qu1ck br0wn D0G jumped 0ver the LAZY F0x! (What did you mean?)"))
   Th3 qu1ck br0wn D0G jumped 0ver the LAZY F0x! What did you mean

   Array case

   >>> print(strip_special_from_strings(["Hey","There","(pattern.?)"]))
   ['Hey', 'There', 'pattern']

   """
    was_string = isinstance(string_array, str)
    if was_string:
        string_array = [string_array, ]
    retvals = []
    for string in string_array:
        for char in SPECIAL_CHARS: string = string.replace(char, "")
        retvals.append(string)
    if was_string:
        retvals = retvals[0]
    return retvals


# -----------------
def extract_groups(patternstring, stringlist, results_per_string=False):
    """ Extracts out groups specified by patternstring from any of the strings in stringlist.
    Args:
        stringlist        : may be a list or array of strings, or a singleton string.
        patternstring     : must be a singletone strong. It MUST contain some parenthesis specifiers to demark groups.
        results_per_string: if True, will ensure that empty matching sets are provided for any non-matching strings for alignment.

    Array case, notice only two matches found because central string is not a match.

    >>> extract_groups("va(lid[^\s])",["valid?","This is not a valid sentence.","This is valid! valid!"])
    ['lid?', 'lid!']

    Use per_string option to report on each string tested instead. Notice it now returns a list of lists

    >>> extract_groups("va(lid[^\s])",["valid?","This is not a valid sentence.","This is valid! valid!"],results_per_string = True)
    [('lid?',), (), ('lid!',)]

    Test singleton case

    >>> extract_groups("va(lid[^\s])","This is valid! valid!")
    'lid!'

    >>> extract_groups("va(lid[^\s])","This is valid! valid!",results_per_string = True)
    [('lid!',)]

    >>> print(extract_groups("va(lidr[^\s])","This is valid! valid!"))
    None

    >>> print(extract_groups("(a test of nested groups ([\w]+)one)", "a test of nested groups justlikethisone"))
    ('a test of nested groups justlikethisone', 'justlikethis')

    >>> print(extract_groups("va(lidr[^\s])","This is valid! valid!",results_per_string = True))
    [()]

    Test multiple groups in patternstring

    >>> extract_groups("test_(\d\d)_rank_(\d\d)_type_([\.\d]+)","test_01_rank_02_type_0.325")
    ('01', '02', '0.325')

    >>> extract_groups("test_(\d\d)_rank_(\d\d)_type_([\.\d]+)","test_01_rank_02_type_0.325",results_per_string = True)
    [('01', '02', '0.325')]

    >>> extract_groups("test_(\d\d)_rank_(\d\d)_type_([\.\d]+)",["test_01_rank_02_type_0.325","test_02_rank_03_type_1.436"])
    [('01', '02', '0.325'), ('02', '03', '1.436')]

    """

    singleton = False
    if isinstance(stringlist, str):
        stringlist = [stringlist, ]
        singleton = True

    pattern = re.compile(patternstring)

    multiple_groups = False
    results = []
    for string in stringlist:
        match = pattern.search(string)
        # record no match if requested
        if match is None and results_per_string:
            results.append(())
            continue
        if match is None:
            continue
        groups = match.groups()
        # Handle singleton group search
        if match and len(groups) == 1 and not results_per_string:
            results.append(groups[0])
            continue
        # Handle array group search
        if match:
            multiple_groups = True
            results.append(groups)

    # Handle empty singleton case (no matches at all)
    if len(results) == 0 and singleton:
        return None

    # Handle singleton result
    if singleton:
        if len(results) == 1 and not results_per_string:
            return results[0]
        else:
            return results

    return results


# ------------------
def matching_elements(patternlist, stringlist, unique=True, sort=False, unmatched=False, indices=False,
                      force_literal=False, ignore_case=False):
    """ Return the string array elements that match any of the list of provided patterns.

   Args:
       patternlist  : a singleton pattern string or an array of pattern strings that decide if an element is returned
       stringlist   : a singleton string or array of strings to scan over and optionally return if matching
       unique       : if True, post-process return results to ensure all matches are unique (no duplicates)
       sort         : if True, sort the returned elements
       unmatched    : reverse the logic to return elements that do NOT match the patterns
       indices      : return the indices of the matching elements instead of their values
       force_literal: treat special RegEx characters in the patterns as simple strings; do not regex process them
       ignore_case  : during matching, ignore case

   Singleton pattern, singletone string case

   >>> matching_elements("pattern","Does this have my pattern?")
   ['Does this have my pattern?']

   Singleton pattern, array string case

   >>> matching_elements("pattern",["Does this have my pattern?","Not my patern"])
   ['Does this have my pattern?']

   Blank string case

   >>> matching_elements("pattern",[])
   []

   Blank pattern case matches anything, also 1 element array test (returns 1 element list, not singleton)

   >>> matching_elements("",["Yes?",])
   ['Yes?']

   Empty list of patterns returns no matches
   >>> matching_elements([], ['Testing',])
   []

   Array pattern, array string case, with sorting

   >>> matching_elements(["Yes","No"],['Um Yes','Um No','Um Maybe','YesNo'], sort=True)
   ['Um No', 'Um Yes', 'YesNo']

   Unmatched test

   >>> matching_elements(["Yes","No"],['Um Yes','Um No','Um Maybe','YesNo'], unmatched=True)
   ['Um Maybe']

   Indices test with sorting

   >>> matching_elements(["Yes","No"],['Um Yes','Um No','Um Maybe','YesNo'], indices=True, sort=True)
   [1, 0, 3]

   Ignore case test

   >>> matching_elements(["yes","no"],['Um Yes','Um No','Um Maybe','YesNo'], ignore_case = True)
   ['Um Yes', 'YesNo', 'Um No']

   Disable unique element return

   >>> matching_elements(["yes","no"],['Um Yes','Um No','Um Maybe','YesNo','YesNo'], ignore_case = True, unique=False)
   ['Um Yes', 'Um No', 'YesNo', 'YesNo']

   Wrong way to try and match characters that are special Regex chars (matched any character B u or l)

   >>> matching_elements('[Bull]',['Steven [Singularity] Hawking','John [Bull] Durham'])
   ['Steven [Singularity] Hawking', 'John [Bull] Durham']

   Right way to match special characters

   >>> matching_elements('[Bull]',['Steven [Singularity] Hawking','John [Bull] Durham'], force_literal = True)
   ['John [Bull] Durham']

   """

    import numpy as N

    # Force the list case even if singleton strings are passed in
    if isinstance(patternlist, str):
        patternlist = [patternlist, ]
    if isinstance(stringlist, str):
        stringlist = [stringlist, ]
    if len(patternlist) == 0:
        return []

    if force_literal:
        patternlist = [enforce_literal(x) for x in patternlist]

    matches = []
    for pattern in patternlist:
        pattern = re.compile(pattern, flags=re.I if ignore_case else 0)
        matches.append([pattern.search(string) is not None for string in stringlist])

    # Mask the strings that had no match or at least one match, depending on user request
    if unmatched:
        return_string_flag = N.sum(matches, axis=0) == 0
    else:
        return_string_flag = N.sum(matches, axis=0) > 0

    # Select out the flagged strings
    matching_list = [s for m, s in zip(return_string_flag, stringlist) if m]

    # Remove redundant strings
    if unique:
        matching_list = list(set(matching_list))

    # Sort returned strings
    if sort:
        matching_list = sorted(matching_list)

    # Return integer arrays of matching strings instead of strings themselves
    if indices:
        stringlist = N.array(stringlist)
        matching_list = [N.where(x == stringlist)[0][0] for x in matching_list]

    return matching_list


# ------------------
def keep_these_chars(stringlist, chars_to_keep=None, set_to_keep=None, ignore_case=False):
    """ Efficiently filters out any and all characters except those specified to keep.
   Preserves original character order. Can specify characters to keep or use preset sets.
   Specifying characters appends to specified set.


   Keep specific characters
   >>> keep_these_chars("changemeEE1:2:3:-4.17159","test")
   'ee'

   Ignore case
   >>> keep_these_chars("changemeEE1:2:3:-4.17159","test",ignore_case = True)
   'eeEE'

   Keep only certain sets
   >>> keep_these_chars("changemeEE1:2:3:-4.17159",set_to_keep = 'digits')
   '123417159'
   >>> keep_these_chars("changemeEE1:2:3:-4.17159",set_to_keep = 'alpha')
   'changemeEE'
   >>> keep_these_chars("changemeEE1:2:3:-4.17159",set_to_keep = 'numeric')
   'ee123-4.17159'
   >>> keep_these_chars("changemeEE1:2:3:-4.17159",set_to_keep = 'alphanumeric')
   'changemeEE123-4.17159'

   Works on arrays of input strings too
   >>> keep_these_chars([ "a1a2", "b1b2", "c[1]", "[d-0.175]"],set_to_keep = 'digits')
   ['12', '12', '1', '0175']
   >>> keep_these_chars([ "a1a2", "b1b2", "c[1]", "[d-0.175]"],set_to_keep = 'alpha')
   ['aa', 'bb', 'c', 'd']
   """

    import string

    charset = {
        'digits': string.digits,
        'numeric': string.digits + ".e+-",
        'alpha': string.ascii_letters,
        'letters': string.ascii_letters,
        'alphanumeric': string.ascii_letters + string.digits + ".+-",
        'punctuation': string.punctuation
    }

    # Decide which characters will be preserved
    if chars_to_keep is None:
        chars_to_keep = ""
    if set_to_keep is not None:
        chars_to_keep += charset[set_to_keep.lower()]
    if ignore_case:
        chars_to_keep = chars_to_keep.lower() + chars_to_keep.upper()

    charset = set("".join(list(charset.values())))
    chars_to_keep = set(chars_to_keep)

    mask = "".join(list(charset - chars_to_keep))
    table_filt = str.maketrans("", "", mask)

    if isinstance(stringlist, str):
        return stringlist.translate(table_filt)
    return [x.translate(table_filt) for x in stringlist]


if __name__ == "__main__":
    import doctest

    doctest.testmod()
