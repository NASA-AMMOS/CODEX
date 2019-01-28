##-----------------------------------------------------------------
##-----------------------------------------------------------------
##
## Mandrake lib (mlib) for playing with strings
##
##-----------------------------------------------------------------
##-----------------------------------------------------------------

from mlib_iterable import is_not_iterable
from mlib_numeric  import unzip

def common_prefix(strings = None):
    """ Find the longest string that is a prefix of all the strings.

    >>> common_prefix(['hello_bob','hello_jane','hello_dan'])
    'hello_'

    >>> common_prefix(['joe','george'])
    ''

    >>> common_prefix(['joe','jerry'])
    'j'

    >>> common_prefix([])
    ''

    """
    if strings is None: return ''
    if len(strings) == 0: return ''

    prefix = strings[0]
    for s in strings:
        if len(s) < len(prefix):
            prefix = prefix[:len(s)]
        if not prefix:
            return ''
        for i in range(len(prefix)):
            if prefix[i] != s[i]:
                prefix = prefix[:i]
                break
    return prefix

#Force all strings in a list (or just one) to be padded to the largest size among them
#or to a user-specified length
def pad_to_length(strings, length = None, pad = "_"):

    if is_not_iterable(strings):
        strings = (strings,)

    #We need to calculate the length if not provided
    if length is None:
        length = max([len(x) for x in strings])

    #Form return list
    retlist = []
    for x in strings:
        if len(x) >= length:
            retlist.append(x[:length])
            continue
        retlist.append(x+pad*(length - len(x)))
    return retlist

#Reveal if any substrings in a list are present in a single potential given string
def any_within(substrings, potential_strings):
    """Looks for any match of the substring array elements in each of the potential_strings.
    If any are found, returns True.

    Try with single potential_string

    Basic use case positive
    >>> any_within(("LND_NA","LND_GL","SEA_GL"), "WL_SA_LND_NA_IN")
    True

    Basic use case negative
    >>> any_within(("LND_NA","LND_GL","SEA_GL"), "WL_SA_LAND_NA_IN")
    False

    If you don't provide substrings to seek, you fail
    >>> any_within((), "Hello")
    False

    One length list case
    >>> any_within(("one",), "this one")
    True

    Singleton-case
    >>> any_within ("one", "this one")
    True

    Now try with multiple potential_strings
    Basic use case positive
    >>> any_within(("LND_NA","LND_GL","SEA_GL"), ["WL_SA_LND_NA_IN", "WL_SA_LND_NA_IN"])
    [True, True]

    Basic use case negative
    >>> any_within(("LND_NA","LND_GL","SEA_GL"), ["WL_SA_LAND_NA_IN", "WL_SA_LAND_NA_IN"])
    [False, False]

    If you don't provide substrings to seek, you fail
    >>> any_within((), ["Hello","Hello"])
    [False, False]

    """

    if is_not_iterable(substrings): substrings = [substrings,]

    singleton_potential = is_not_iterable(potential_strings)
    if singleton_potential: potential_strings = [potential_strings,]

    answer = []
    for potential_string in potential_strings:
        matched = False
        for sub in substrings:
            if sub in potential_string:
                answer.append(True)
                matched = True
                break
        if not matched: answer.append(False)

    if singleton_potential: return answer[0]
    return answer

#Return only potential strings in a listthat do not contain any of the forbidden substrings
def eliminate_forbidden_substrings(forbidden_substrings, potential_string_array):
    return [x for x in potential_string_array if not any_within(forbidden_substrings,x)]

#perform a group substitution in a string given a dictionary of replacements
#intelligently apply the largest possible matches first, and do not match into already replaced values
def substitute_by_dictionary(instrings, sub_dict):

    """ Perform a group substitution in (list of) string given a dictionary of replacements
    Intelligently applies the largest possible matches first, and will not match into already replaced values.

    >>> substitute_by_dictionary(['hello there!',], {'hello': 'goodbye', 'there':'here'})
    ['goodbye here!']

    >>> substitute_by_dictionary([],{'one':'two'})
    []

    >>> substitute_by_dictionary("hello",{})
    'hello'

    >>> substitute_by_dictionary("hello",{'heck':'hell','hell':'heck','heck':'hell'})
    'hecko'

    """

    import re
    import numpy as N
    from mlib_numeric import consecutive_boolean_region_ranges

    singleton = is_not_iterable(instrings)
    if singleton: instrings = [instrings,]

    #General theory is to look for the longest subst strings first and mark them as taken
    #Moving from longest to shortest, proceed until all substitutions are planned
    #Then concatenate remaining regions with subbed areas in a single act.

    keys_by_length = [y[1] for y in sorted([(len(x),x) for x in sub_dict], reverse=True)]

    final_strings = []
    for instring in instrings:

        matched = N.array([False,]*len(instring))
        key_spans = {}
        for key in keys_by_length:
            #Discover where this key is present in the input string
            spans = [x.span() for x in re.finditer(key, instring)]
            #Remove any spans that have already been matched elsewhere
            spans = [x for x in spans if sum(matched[x[0]:x[1]]) == 0]

            for span in spans: matched[span[0]:span[1]] = True
            for span in spans: key_spans[span[0]] = sub_dict[key]

        #Discover the spans for unmatched text
        for span in consecutive_boolean_region_ranges(~matched): key_spans[span[0]] = instring[span[0]:span[1]+1]

        #Assemble the final string by moving a pointer along the first and expanding to the final
        final_strings.append("")
        for index in sorted(key_spans):
            final_strings[-1] += key_spans[index]

    if singleton: final_strings = final_strings[0]

    return final_strings

def partial_key_dictionary(dictionary, partial_key, multiple = False):
    """Takes a string and looks to see if it is a subset of any keys within a dictionary.
    If it is, it returns the dictionary's value for that larger key match.
    Multiple key hits will (always) return a list if multiple is true, otherwise the largest key is matched.

    >>> dic = {'This': 'This', 'This is four score and seven': 'This is four score and seven',
    ...        'That': 'That', 'That is also 55'             : 'That is also 55'}

    >>> partial_key_dictionary(dic, 'This')
    'This is four score and seven'

    >>> print partial_key_dictionary(dic, 'This', multiple = True)
    ['This', 'This is four score and seven']

    >>> print partial_key_dictionary(dic, 'four')
    This is four score and seven

    >>> print partial_key_dictionary(dic, 'four', multiple = True)
    ['This is four score and seven']

    >>> print partial_key_dictionary({}, 'four')
    None

    >>> print partial_key_dictionary(dic,'not in there')
    None

    >>> print partial_key_dictionary(dic, '')
    None

    >>> print partial_key_dictionary(dic, 'not in there', multiple = True)
    []

    """

    #Enforce that empty keyword matches no keywords
    if len(partial_key) == 0: return [] if multiple else None

    #First find the keys that match as substrings
    keys = [x for x in dictionary.keys() if partial_key in x]

    #Handle non-matching case immediately
    if len(keys) == 0: return [] if multiple else None

    #sort the keys by length and take only the longest if user doesn't want multiple returned
    if not multiple:
        _, keys = unzip( sorted( [ (len(x),x) for x in keys ] , reverse=True) )
        return dictionary[keys[0]]

    #return all hits
    return sorted([dictionary[x] for x in keys])


#------------------------

if __name__ == "__main__":
    import doctest
    from mlib_doctest import repo_path
    doctest.testmod()
