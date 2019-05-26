# -----------------------------------------------------------------
# -----------------------------------------------------------------
#
#  Mandrake lib (mlib) for handling color issues
#
# -----------------------------------------------------------------
# -----------------------------------------------------------------

import matplotlib
import os

if os.name == 'posix' and "DISPLAY" not in os.environ:
    matplotlib.use('Agg')
else:
    matplotlib.use('TkAgg')


from mpltools import color as C
from mlib.iterable import is_not_iterable
# mpltools will set the display value with matplotlib.use() if its not updated before this call
from mpltools.color import LinearColormap
import numpy as N
from pprint import pprint as PP
import mlib.regex as R
import math
from decimal import Decimal, ROUND_HALF_UP

COLOR_DICT = {
    'midnight blue': [0.1, 0.1, 112 / 255.0],
    'blue': [0, 0, 1],
    'royal blue': [65 / 255.0, 105 / 255.0, 225 / 255.0],
    'sky blue': [135 / 255.0, 206 / 255.0, 235 / 255.0],
    'dark cyan': [0, 0.5, 1],
    'cyan': [0, 1, 1],
    'pale cyan': [0.75, 1, 1],
    'dark green': [0, 100 / 255.0, 0],
    'olive': [107 / 255.0, 142 / 255.0, 35 / 255.0],
    'green': [0, 1, 0],
    'spring green': [0, 1, 0.5],
    'gold': [184 / 255.0, 134 / 255.0, 11 / 255.0],
    'orange': [1, 0.5, 0],
    'bright orange': [1, 0.6, 0],
    'yellow': [1, 1, 0],
    'pale yellow': [1, 1, 0.75],
    'pale yellow': [238 / 255.0, 232 / 255.0, 170 / 255.0],
    'brick red': [178 / 255.0, 34 / 255.0, 34 / 255.0],
    'brown': [165 / 255.0, 42 / 255.0, 42 / 255.0],
    'dark brown': [87 / 255.0, 65 / 255.0, 47 / 255.0],
    'salmon': [250 / 255.0, 0.5, 114 / 255.0],
    'light salmon': [1, 160 / 255.0, 122 / 255.0],
    'maroon': [0.5, 0, 0],
    'light brown': [210 / 255.0, 105 / 255.0, 30 / 255.0],
    'red': [1, 0, 0],
    'pale red': [1, 99 / 255.0, 71 / 255.0],
    'sandy brown': [244 / 255.0, 164 / 255.0, 96 / 255.0],
    'peach': [1, 218 / 255.0, 185 / 255.0],
    'medium magenta': [139 / 255.0, 0, 139 / 255.0],
    'violet': [208 / 255.0, 32 / 255.0, 144 / 255.0],
    'hot pink': [1, 20 / 255.0, 147 / 255.0],
    'magenta': [1, 0, 1],
    'dark magenta': [0.5, 0, 0.5],
    'purple': [143 / 255.0, 21 / 255.0, 180 / 255.0],
    'eggplant': [36 / 255.0, 14 / 255.0, 37 / 255.0],
    'royal purple': [50 / 255.0, 0.0, 50 / 255.0],
    'pink': [1, 192 / 255.0, 203 / 255.0],
    'white': [1, 1, 1],
    'off-white': [230 / 255.0, 230 / 255.0, 230 / 255.0],
    'light gray': [204 / 255.0, 204 / 255.0, 204 / 255.0],
    'medium gray': [179 / 255.0, 179 / 255.0, 179 / 255.0],
    'steel gray': [128 / 255.0, 128 / 255.0, 128 / 255.0],
    'dark gray': [102 / 255.0, 102 / 255.0, 102 / 255.0],
    'deep gray': [77 / 255.0, 77 / 255.0, 77 / 255.0],
    'bright black': [51 / 255.0, 51 / 255.0, 51 / 255.0],
    'off-black': [26 / 255.0, 26 / 255.0, 26 / 255.0],
    'black': [0, 0, 0],
}

CUSTOM_CONSTRUCTED_COLORMAPS = [
    'afmhot_nowhite',  # removes the pure white color from the end of afmhot so can be used on white background
]

CUSTOM_LINEAR_SEGMENTED_COLORMAPS = {

    'bipolar_midrange':  # pleasant bipolar that doesn't focus too much on the black zero region or extreme outliers
        (
            (0.5, 1, 1),  # light cyan
            (0, 1, 1),  # cyan
            (0, 0.5, 1),  # pale blue
            (0, 0, 1),  # deep blue
            (0, 0, 0.5),  # dark blue
            (0, 0, 0),  # black
            (0.5, 0, 0),  # dark red
            (1, 0, 0),  # red
            (1, 0.5, 0),  # orange
            (1, 1, 0),  # yellow
            (1, 1, 0.5),  # pale yellow
        ),

    "rainbow_black_white":  # wide color range using as many colors as possible including white and black
        (
            (0, 0, 0),  # k
            (1, 0, 0),  # r
            (1, .5, 0),  # o
            (1, 1, 0),  # y
            (0, 1, 0),  # g
            (0, 0, 1),  # b
            (1, 0, 1),  # v
            (1, 1, 1),  # w
        ),

    "rainbow_black_red":  # rainbow with black placed above r
        (
            (0, 0, 0),  # k
            (1, 0, 0),  # r
            (1, .5, 0),  # o
            (1, 1, 0),  # y
            (0, 1, 0),  # g
            (0, 0, 1),  # b
            (1, 0, 1),  # v
        ),

    "rainbow_black_violet":  # rainbow with black placed below v
        (
            (1, 0, 0),  # r
            (1, .5, 0),  # o
            (1, 1, 0),  # y
            (0, 1, 0),  # g
            (0, 0, 1),  # b
            (1, 0, 1),  # v
            (0, 0, 0),  # k
        ),

    "hot_framed":  # uses all the hot colors framed from k to w
        (
            (0, 0, 0),  # k
            (1, 0, 0),  # r
            (1, 0.5, 0),  # o
            (1, 1, 0),  # y
            (1, 1, 1),  # w
        ),

    "cold_framed":  # uses all the cold colors framed from k to w
        (
            (0, 0, 0),  # k
            (0, 0, 1),  # b
            (1, 0.5, 1),  # c
            (1, 0, 1),  # v
        ),

    "bipolar_old":  # traditional cold/hot color split with black in the middle, nothing fancy
        (
            (1, 0, 1),  # v
            (1, 0.5, 1),  # c
            (0, 0, 1),  # b
            (0, 0, 0),  # k
            (1, 0, 0),  # r
            (1, 0.5, 0),  # o
            (1, 1, 0),  # y
        ),

    "rainbow_publish":  # rainbow colors that are easier to see on a projector or in print against a white background
        (
            (0, 0, 0),  # k
            (1, 0, 0),  # r
            (0, 1, 0),  # g
            (0, 0, 1),  # b
            (1, 0, 1),  # v
        ),

    "not_hot":  # widest range of all possible colors excepting the k-r-o-y-w hot span, not including black
        (
            COLOR_DICT['brown'],
            (0, 1, 0),  # g
            (0, 0, 1),  # b
            (1, 0, 1),  # v
        ),

}


# -----------------
def map_norm_rgb_to_hex(norm_rgb):
    """ Maps a normalized RGB tuple (0,1,1) to a Hex-based Web format #00FFFF.

    >>> map_norm_rgb_to_hex((0  ,0  ,0  ))
    '000000'

    >>> map_norm_rgb_to_hex((1  ,1  ,1  ))
    'ffffff'

    >>> map_norm_rgb_to_hex((0.7,0.5,0.2))
    'b38033'

    """

    # Remove alphas
    if len(norm_rgb) > 3:
        norm_rgb = norm_rgb[:3]

    hexvals = [hex(_round_half_up(x * 255))[2:] for x in norm_rgb]
    hexvals = [("0" + x if len(x) == 1 else x) for x in hexvals]
    return "".join(hexvals)


def _round_half_up(value):
    return int(Decimal(value).quantize(0, ROUND_HALF_UP))


def map_norm_rgb_to_colorcode(norm_rgb):
    """ Takes normalized RGB tuple (0,1,1) to an integer representing the #00FFFF format.

    >>> map_norm_rgb_to_colorcode((0  ,0  ,0  ))
    0

    >>> map_norm_rgb_to_colorcode((1  ,1  ,1  ))
    16777215

    >>> map_norm_rgb_to_colorcode((0.7,0.5,0.2))
    11763763

    """

    return int(map_norm_rgb_to_hex(norm_rgb), 16)


# -----------------
def complimentary(color_tuple):
    if len(color_tuple) == 3:
        return (1.0 - color_tuple[0],
                1.0 - color_tuple[1],
                1.0 - color_tuple[2])
    else:  # rgba case
        return (1.0 - color_tuple[0],
                1.0 - color_tuple[1],
                1.0 - color_tuple[2],
                color_tuple[3])


# -----------------
def terminal_textcolor(name=''):
    """ Returns a terminal ANSI escape sequence for color or certain text styles.

    >>> terminal_textcolor('black blink')
    '\\x1b[5;30m'

    >>> terminal_textcolor('white inverted')
    '\\x1b[7;37m'

    >>> terminal_textcolor('')
    '\\x1b[0;37m'

    """

    name = name.lower()
    fmt = '\x1b[%i;3%im'

    colors = ['black', 'red', 'green', 'yellow', 'blue', 'purple', 'cyan', 'white']
    col_dict = dict(zip(colors, range(len(colors))))
    col_dict['violet'] = col_dict['purple']  # redundant name

    style_dict = {'normal': 0, 'underline': 4, 'blink': 5, 'invert': 7, 'bold': 1}

    # Default to white text normal
    color = col_dict['white']
    style = style_dict['normal']

    for key in col_dict:
        if key in name: color = col_dict[key]

    for key in style_dict:
        if key in name: style = style_dict[key]

    return fmt % (style, color)

    # colors = dict({ 'black': 0,
    #            'red'  : 1,
    #            'green': 2,

    # if name == "black":
    #     return fmt%(1,0)
    # if name == "red":
    #     return fmt%(1,1)
    # if name == "green":
    #     return fmt%(1,2)
    # if name == "yellow":
    #     return fmt%(1,3)
    # if name == "blue":
    #     return fmt%(1,4)
    # if name == "violet":
    #     return fmt%(1,5)
    # if name == "purple":
    #     return fmt%(1,5)
    # if name == "cyan":
    #     return fmt%(1,6)
    # if name == "white":
    #     return fmt%(1,7)


# --------------
def quick_colormap(rgb_list, name="name"):
    """Quickly make a colormap out of a few specified RGB(A) values that will be equally spaced along the colormap linearly.

    >>> cm = quick_colormap( ( (60/255.0,0,60/255.0), (1.0,0,1.0), ) , name = "dark to light purple")
    >>> cm(0.0)
    (0.23529411764705882, 0.0, 0.23529411764705882, 1.0)
    >>> cm(1.0)
    (1.0, 0.0, 1.0, 1.0)
    >>> isinstance(cm, LinearColormap)
    True

    """

    return C.LinearColormap(name, rgb_list)


# --------------
def custom_constructed_colormaps(name):
    """Returns specially constructed colormaps that aren't merely LinearColormap calls, for instance by editing or merging
    existing colormaps. Acceptable names are stored in CUSTOM_CONSTRUCTED_COLORMAPS array.

    >>> isinstance(custom_constructed_colormaps('afmhot_nowhite'), LinearColormap)
    True

    >>> custom_constructed_colormaps('notamap')
    Traceback (most recent call last):
    Exception: Unknown custom constructed colormap: notamap

    """

    if not name in CUSTOM_CONSTRUCTED_COLORMAPS: raise Exception("Unknown custom constructed colormap: " + name)

    if name == "afmhot_nowhite":
        # retrieve the afmhot map at 10000 resolution (above what virtually any graph would need)
        # lop off the white portion (20%)
        return quick_colormap(color_span(1e4, palette='afmhot')[:-2000], "afmhot_nowhite")


# --------------
def custom_colormap(name):
    """ returns one of the custom colormaps as a colormap object if input is string.
    If input is a colormap, simply returns the object right back.

    >>> type(custom_colormap('rainbow_black_violet'))
    <class 'mpltools.color.LinearColormap'>

    >>> type(custom_colormap('gist_rainbow_r'))
    <class 'matplotlib.colors.LinearSegmentedColormap'>

    >>> type(custom_colormap('Greens'))
    <class 'matplotlib.colors.LinearSegmentedColormap'>

    >>> custom_colormap('not_here')
    Traceback (most recent call last):
    Exception: Colormap not present in custom colormaps: not_here

    """

    import pylab as P

    if isinstance(name, C.LinearSegmentedColormap):
        return name

    if name in [str(x) for x in P.colormaps()]:
        return P.cm.get_cmap(name)

    if name in CUSTOM_LINEAR_SEGMENTED_COLORMAPS:
        return quick_colormap(CUSTOM_LINEAR_SEGMENTED_COLORMAPS[name], name)

    if name in CUSTOM_CONSTRUCTED_COLORMAPS:
        return custom_constructed_colormaps(name)

    raise Exception("Colormap not present in custom colormaps: " + name)


# --------------
def color_span(number_elements, palette=None):
    """ Provides number_elements rgba values that span the given palette.
    Useful for coloring several lines.

    >>> N.array(color_span( 4, palette = "rainbow")).astype(N.float16)
    array([[ 0.5   ,  0.    ,  1.    ,  1.    ],
           [ 0.1666,  0.866 ,  0.866 ,  1.    ],
           [ 0.8335,  0.866 ,  0.5   ,  1.    ],
           [ 1.    ,  0.    ,  0.    ,  1.    ]], dtype=float16)

    #got violet & red, two extreme colors
    >>> N.array(color_span( 2, palette = "rainbow")).astype(N.float16)
    array([[ 0.5,  0. ,  1. ,  1. ],
           [ 1. ,  0. ,  0. ,  1. ]], dtype=float16)

    #got violet, last color in palette
    >>> color_span( 1, palette = "rainbow")
    [(0.5, 0.0, 1.0, 1.0)]

    >>> color_span( 0, palette = "rainbow")
    []
    """

    return map_values_to_rgba(N.linspace(0, 1, int(number_elements)), palette=palette)


# --------------
def map_values_to_rgba(values, palette=None, scale=False, uint8=False):
    """ Maps values (range 0 to 1) to (r,g,b) tuples based on a pallete.

    Args:
        values : normalized values from 0 to 1 that are to be mapped
        palette: a string representing the colormap to use.
                 Any valid P.cm.* string is recognized, as well as rainbow_index sets.
                 May also receive a specified colormap object.
                 If None (default) uses currently selected colormap
        scale  : If scale is True, will map values to range 0-1. Not normally preferred.
                 Will be ignored if a singleton value is passed in (can't scale a single value)
        uint8  : If True, will map data to range 0-255 and cast as N.uint8

    >>> import numpy as N

    Test basic usage
    >>> PP(map_values_to_rgba([0,1,2], palette = 'afmhot'))
    [(0.0, 0.0, 0.0, 1.0),
     (0.0078431372549019607, 0.0, 0.0, 1.0),
     (0.015686274509803921, 0.0, 0.0, 1.0)]

    Test basic usage with uint8
    >>> PP(map_values_to_rgba([0,1,2], palette = 'afmhot', uint8 = True))
    [array([  0,   0,   0, 255], dtype=uint8),
     array([  2,   0,   0, 255], dtype=uint8),
     array([  4,   0,   0, 255], dtype=uint8)]

    Test Int64 case
    >>> PP(map_values_to_rgba(N.array([0,1,2],dtype=N.int64), palette = 'afmhot'))
    [(0.0, 0.0, 0.0, 1.0),
     (0.0078431372549019607, 0.0, 0.0, 1.0),
     (0.015686274509803921, 0.0, 0.0, 1.0)]

    Custom colormap example
    >>> PP(map_values_to_rgba(N.linspace(0,1,10), palette = 'hot_framed' ))
    [(0.0, 0.0, 0.0, 1.0),
     (0.4392156862745098, 0.0, 0.0, 1.0),
     (0.8784313725490196, 0.0, 0.0, 1.0),
     (1.0, 0.16666666666666666, 0.0, 1.0),
     (1.0, 0.38627450980392158, 0.0, 1.0),
     (1.0, 0.61372549019607847, 0.0, 1.0),
     (1.0, 0.83333333333333326, 0.0, 1.0),
     (1.0, 1.0, 0.12156862745098039, 1.0),
     (1.0, 1.0, 0.5607843137254902, 1.0),
     (1.0, 1.0, 1.0, 1.0)]

    >>> PP(map_values_to_rgba(N.linspace(0,1,10), palette = 'gist_rainbow_r' ))
    [(1.0, 0.0, 0.75, 1.0),
     (0.65323955669224221, 0.0, 1.0, 1.0),
     (0.056479113384484192, 0.0, 1.0, 1.0),
     (0.0, 0.56159420289855067, 1.0, 1.0),
     (0.0, 1.0, 0.84334809192494209, 1.0),
     (0.0, 1.0, 0.23192072527935914, 1.0),
     (0.36036036036036029, 1.0, 0.0, 1.0),
     (0.97509273979862188, 1.0, 0.0, 1.0),
     (1.0, 0.43137254901960786, 0.0, 1.0),
     (1.0, 0.0, 0.16, 1.0)]

    Custom colormap example
    >>> PP(map_values_to_rgba(N.linspace(0,1,10), palette = 'cold_framed'))
    [(0.0, 0.0, 0.0, 1.0),
     (0.0, 0.0, 0.32941176470588235, 1.0),
     (0.0, 0.0, 0.6588235294117647, 1.0),
     (0.0, 0.0, 1.0, 1.0),
     (0.32941176470588235, 0.16470588235294117, 1.0, 1.0),
     (0.6705882352941176, 0.3352941176470588, 1.0, 1.0),
     (1.0, 0.5, 1.0, 1.0),
     (1.0, 0.32941176470588235, 1.0, 1.0),
     (1.0, 0.1647058823529412, 1.0, 1.0),
     (1.0, 0.0, 1.0, 1.0)]

    Singleton example
    >>> map_values_to_rgba(0.5, palette = 'cold_framed')
    (0.50588235294117645, 0.25294117647058822, 1.0, 1.0)

    Build in palette example
    >>> PP(map_values_to_rgba(N.linspace(0,1,10), palette = 'nipy_spectral'))
    [(0.0, 0.0, 0.0, 1.0),
     (0.42873137254901961, 0.0, 0.61307843137254903, 1.0),
     (0.0, 0.18301960784313726, 0.86670000000000003, 1.0),
     (0.0, 0.64446666666666663, 0.73336666666666672, 1.0),
     (0.0, 0.60915490196078426, 0.073198039215686239, 1.0),
     (0.0, 0.88499607843137262, 0.0, 1.0),
     (0.7999666666666666, 0.97776666666666667, 0.0, 1.0),
     (1.0, 0.67843137254901964, 0.0, 1.0),
     (0.89283725490196075, 0.0, 0.0, 1.0),
     (0.80000000000000004, 0.80000000000000004, 0.80000000000000004, 1.0)]

    Test scaling
    First pass in values only from 0 to 0.5
    >>> PP(map_values_to_rgba(N.linspace(0,0.5,10), palette = 'nipy_spectral'))
    [(0.0, 0.0, 0.0, 1.0),
     (0.4732294117647059, 0.0, 0.53983921568627447, 1.0),
     (0.42873137254901961, 0.0, 0.61307843137254903, 1.0),
     (0.0, 0.0, 0.72552352941176468, 1.0),
     (0.0, 0.18301960784313726, 0.86670000000000003, 1.0),
     (0.0, 0.54249803921568629, 0.86670000000000003, 1.0),
     (0.0, 0.64446666666666663, 0.73336666666666672, 1.0),
     (0.0, 0.66669999999999996, 0.5646882352941176, 1.0),
     (0.0, 0.60915490196078426, 0.073198039215686239, 1.0),
     (0.0, 0.73853137254901957, 0.0, 1.0)]

    Now pass them in again using scaling, will span to maximum colors available
    Will be equivalent to Build in pallete example two entries above
    >>> PP(map_values_to_rgba(N.linspace(0,0.5,10), palette = 'nipy_spectral', scale = True))
    [(0.0, 0.0, 0.0, 1.0),
     (0.42873137254901961, 0.0, 0.61307843137254903, 1.0),
     (0.0, 0.18301960784313726, 0.86670000000000003, 1.0),
     (0.0, 0.64446666666666663, 0.73336666666666672, 1.0),
     (0.0, 0.60915490196078426, 0.073198039215686239, 1.0),
     (0.0, 0.88499607843137262, 0.0, 1.0),
     (0.7999666666666666, 0.97776666666666667, 0.0, 1.0),
     (1.0, 0.67843137254901964, 0.0, 1.0),
     (0.89283725490196075, 0.0, 0.0, 1.0),
     (0.80000000000000004, 0.80000000000000004, 0.80000000000000004, 1.0)]

    """

    import pylab as P

    singleton = False
    if is_not_iterable(values):
        singleton = True
        values = [values, ]

    if scale and not singleton:
        values = N.array(values, dtype=float)
        values -= N.min(values)
        values /= float(N.max(values))

    if palette is None:
        palette = P.cm.cmapname

    cmap = custom_colormap(palette)

    retval = [cmap(x) for x in values]

    if uint8:
        retval = [(N.array(x) * 255).astype(N.uint8) for x in retval]

    if singleton:
        return retval[0]
    else:
        return retval


# --------------
def assign_color_cycle(palette, numseries):
    """ Selects numseries colors from a palette and assigns them to the current plot color cycle.

    >>> P.axis()
    (0.0, 1.0, 0.0, 1.0)
    >>> assign_color_cycle("gist_rainbow", 10)

    """
    # import pylab as P

    from cycler import cycler
    P.gca().set_prop_cycle(cycler('color', map_values_to_rgba(N.linspace(0, 1, numseries), palette)))


# --------------
def pale(rgb, percent_pale):
    """ Makes a color paler.
    Args:
        rgb: normalized rgb tuple (0,1,1)
        percent_pale: 0 = leave alone, 1 = Make entirely white
    Returns:
        paled_rgb: normalized rgb tuple

    #Modifying black turns only shades of grey
    >>> pale( ( 0  , 0  , 0  ), 0)
    (0, 0, 0)

    >>> pale( ( 0  , 0  , 0  ), 0.5)
    (0.5, 0.5, 0.5)

    >>> pale( ( 0  , 0  , 0  ), 1)
    (1, 1, 1)

    #Shades of primary colors
    >>> pale( ( 1  , 0  , 0  ), 0)
    (1, 0, 0)

    >>> pale( ( 0  , 1  , 0  ), 0.5)
    (0.5, 1.0, 0.5)

    >>> pale( ( 0  , 0  , 1  ), 1)
    (1, 1, 1)

    #Modifying white does nothing
    >>> pale( (1,1,1,0), 0)
    (1, 1, 1, 0)

    >>> pale( (1,1,1,1), 0.5)
    (1.0, 1.0, 1.0, 1)

    >>> pale( (1,1,1,0), 1)
    (1, 1, 1, 0)

    """

    # Handle transparency
    transparency = None
    if len(rgb) > 3:
        transparency = rgb[3]
        rgb = rgb[:3]

    rgb_pale = (
        (1 - rgb[0]) * percent_pale + rgb[0],
        (1 - rgb[1]) * percent_pale + rgb[1],
        (1 - rgb[2]) * percent_pale + rgb[2])

    if transparency is None: return rgb_pale
    return (rgb_pale[0], rgb_pale[1], rgb_pale[2], transparency)


# --------------
# def strip_escape_sequences(string):
#     """ Strips out color and other escape characters from a string, for terminals (and curses) where such are not supported.

#     >>>

#     """
#     groups = R.extract_groups("(.+)*(\^\[\[\d\;\d\d\w)*",string)
#     print groups


# --------------------------------
# --------------------------------
# --------------------------------

if __name__ == "__main__":
    import pylab as P

    import doctest
    from mlib._doctest import repo_path

    N.set_printoptions(legacy='1.13')
    doctest.testmod()
