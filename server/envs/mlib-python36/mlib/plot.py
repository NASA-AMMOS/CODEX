# -----------------------------------------------------------------
# -----------------------------------------------------------------
#
#  Mandrake lib (mlib) for handling TCCON .nc files, reading TCCON
#  results, activity reports, site lists, etc.
#
# -----------------------------------------------------------------
# -----------------------------------------------------------------

import sys
import matplotlib
import numpy as N
import mlib.numeric as NUM
from mlib.iterable import is_iterable, is_not_iterable
import mlib.mtypes
import mlib.latlon as MLL
import pickle

import mlib.equation
import mlib.mtime

# This special string causes matplotlib to ensure all labels, ticks, etc. are within the graph boundaries
# Rather bizarre it isn't checked by default
# P.rcParams.update({'figure.autolayout': True})

# This is the default OCO2 data version to use unless specified
DEFAULT_VERSION = "v7"

DEFAULT_DASHES = [1, 1e-10]  # Effectively a solid line, kludge
NO_DASHES = [1e-10, 1]  # Effectively nonexistant

# Needed to suppress graphics warnings for tight axis that are actually needed
import warnings

warnings.filterwarnings("ignore", "This figure includes Axes that are not compatible with tight_layout")


# ----------------------------------------
def init(backend=None, interactive=False):
    """ An initialization function that selects the appropriate backend for matplotlib rendering.
    Invoke during import command to mlib.plot as:
         import mlib.plot as MP; MP.init(interactive = True)
         import mlib.plot as MP; MP.init() #for no-term requirement png renderer

    Args:
        backend    : If specified, will use the precise backend specified by the user. Default 'Agg' that requires no term.
        interactive: If True, use 'TkAgg' backend that supports dynamic, interactive graphing
    Returns:
        exports P and Basemap as pylab module and Basemap function for later use, properly back-ended

    """

    if backend is None:
        backend = 'TkAgg' if interactive else 'Agg'

    matplotlib.use(backend)

    global P
    global Basemap
    global C
    import pylab as P
    from mpl_toolkits.basemap import Basemap
    import mlib.color as C

#  ----------------------------------------
#  Functions
#  ----------------------------------------

def text_box(x, y, text, boxstyle='round', facecolor='wheat', alpha=0.5, verticalalignment='top', fontsize=14):
    """ Displays a text box on an existing plots in unitless display coordinates.
    Args:
        x                : 0-1 left-right position
        y                : 0-1 bottom-top position
        text             : the text to display. May be multiline.
        fontsize         : the size of the text to display
        verticalalignment: top/middle/bottom vertical alignment
        alpha            : Alpha of line + background but not text itself. Alpha = 0 means only text shown. Default 0.5.
        boxstyle         : circle, darrow, larrow, rarrow, round, round4, roundtooth, sawtooth, square

    """

    props = dict(boxstyle=boxstyle, facecolor=facecolor, alpha=alpha)

    return P.gca().text(x, y, text, transform=P.gca().transAxes, fontsize=fontsize,
                        verticalalignment=verticalalignment, bbox=props)


# --------------
def shadow_text(x, y, text, color=(1, 1, 1), shadow=(0, 0, 0), alpha=1, fontsize=8):
    """ Plots the requested text as well as a shadow color.
    Shadow shift is relative to current axis; call this function AFTER axis are known and set.

    Args:
        x: x coordinate of text
        y: y coordinate of text
        text: Test to draw
        fontsize: size of the text
        color   : the foreground color of the text
        shadow  : the shadow's color. If None, will not plot shadow.
        alpha   : opacity of text
    """

    SHADOW_SHIFT = 0.001

    (xmin, xmax, ymin, ymax) = P.axis()
    deltax = (xmax - xmin) * SHADOW_SHIFT
    deltay = (ymax - ymin) * SHADOW_SHIFT

    if shadow is not None: P.text(x + deltax, y - deltay, text, color=shadow, alpha=alpha, fontsize=fontsize)
    P.text(x, y, text, color=color, alpha=alpha, fontsize=fontsize)


# --------------
def apply_vmin_vmax(array, vmin, vmax):
    """ Manually scale an array to incorporate concepts of vmin, vmax for compatibility with plotting functions that otherwise don't support it.

    >>> apply_vmin_vmax(range(10), 0, 10)
    array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])

    >>> apply_vmin_vmax(range(10), 5, 10)
    array([5, 5, 5, 5, 5, 5, 6, 7, 8, 9])

    >>> apply_vmin_vmax(range(10), 0, 5 )
    array([0, 1, 2, 3, 4, 5, 5, 5, 5, 5])

    Empty case
    >>> apply_vmin_vmax([], 0, 10)
    array([], dtype=float64)

    """

    work = [(x if x < vmax else vmax) for x in array]
    work = [(x if x > vmin else vmin) for x in work]

    return N.array(work)


# --------------------------------
def plot_relation_circle(labels, connections, connection_indices=None, separations=None,
                         label_colors=None, label_palette="gist_rainbow",
                         start_pos=90, max_lines=None, title="", filename=None, dpi=150,
                         face_color=(0, 0, 0), start_between=True, separation_delta=10,
                         node_width=None, text_color=None, node_edgecolor=(0, 0, 0),
                         linewidth=1.5, connection_palette="afmhot",
                         vmin=None, vmax=None, colorbar=True, colorbar_size=0.5,
                         node_linewidth=2.0, colorbar_pos=(0.0, 0.0),
                         fontsize_title=12, fontsize_labels=10, fontsize_colorbar=10,
                         padding=6.0
                         ):
    """ Makes a relationship circle that shows connectivity between different labeled nodes aranged around a circle.
    Args:
        labels       : Ordered series of names for the elements to connect
        connections  : Either a 2D matrix of the relative strengths of connections between all elements in labels
                       or a 1D list of connection strengths along with connection_indices
                       Abs(connections) is used for the plotting
        connection_indices: A tuple of lists defining the indices of label elements that share connection strengths in the 1D connections
        separations : Indices into labels that should be shown as a wider gap for grouping
        label_colors : RGB/A tuples for each element in label
        label_palette: if label_colors is None, uses this palette to equispace label elements
        start_pos    : Angle at which labels begin, default 90
        max_lines    : Show only the top max_lines connections by strength. Default None (no limit).
        filename     : If None, will not save. Otherwise saves to this location.
        dpi          : Dpi of saved file. Default 150.
        face_color   : Background color of final plot, default 'white', 'black' is also excellent.
        start_between: Causes the start position to align between the labels, default True
        separation_delta  : The number of degrees used to define group separations
        node_width        : The width colored for each node in degrees. If None, autofilled.
        text_color        : The color to be used for the text. Default None uses negative of face_color.
        node_edgecolor    : The color of lines around nodes. Default 'k'.
        linewidth         : Float line width to use for connections
        connection_palette: The palette to use for coloring connection strength
        vmin              : Minimum colormap value for connections
        vmax              : Maximum colormap value for connections
        colorbar          : Whether or not to display a colorbar, boolean
        title             : Plot title
        padding           : Space to add around figure to accomodate long labels (6.0)
        colorbar_size     : Float size of colorbar, fraction of entire plot (0.5)
        node_linewidth    : Width of lines around nodes
        colorbar_pos      : Location of colorbar (x,y)
        fontsize_title    : Font size for the title  (12)
        fontsize_labels   : Font size for the labels (10)
        fontsize_colorbar : Font size for colorbar   (10)

    >>> labels = ["Yoda","Darth Vader","Luke","Leia"]
    >>> connections = [ [ 9, 0, 5, 4],
    ...                 [ 0, 9, 3, 2],
    ...                 [ 5, 3, 9, 4],
    ...                 [ 4, 2, 4, 9] ]
    >>> separations = [0,2,]

    >>> import mlib.shell as S
    >>> basedir = repo_path() + '/doctest_working/graphics/relationcircle/'
    >>> S.rm   (basedir)
    >>> S.mkdir(basedir)

    >>> plot_relation_circle(labels, connections, separations,                        filename = basedir + 'test1.png')
    >>> plot_relation_circle(labels, connections, separations, separation_delta = 20, filename = basedir + 'test2.png')
    >>> plot_relation_circle(labels, connections, separations, start_between = False, filename = basedir + 'test3.png')

    1D connection weights with indices
    >>> connections = [9, 8, 7, 6, 5]
    >>> connection_indices = [ [0, 1, 2, 3, 0],
    ...                        [2, 3, 1, 1, 3] ]
    >>> plot_relation_circle(labels, connections, connection_indices = connection_indices, separations = separations,
    ...                      filename = basedir + 'test4.png')

    """

    import mne
    from mne.connectivity import spectral_connectivity
    from mne.viz import circular_layout, plot_connectivity_circle

    if text_color is None:
        text_color = C.complimentary(face_color)

    if label_colors is None:
        label_colors = C.color_span(len(labels), label_palette)

    connections = N.array(connections, dtype=float)
    if connections.ndim == 1:
        if connection_indices is None:
            raise Exception(
                "Must provide either 2D connections matrix, or 1D list along with (1D,1D) connection_indices")
        else:
            connection_indices = [N.array(connection_indices[0], dtype=int), N.array(connection_indices[1], dtype=int)]

    node_angles = circular_layout(labels,
                                  labels,
                                  start_pos=start_pos,
                                  group_boundaries=separations,
                                  start_between=start_between,
                                  group_sep=separation_delta,
                                  )

    plot_connectivity_circle(connections,
                             labels,
                             indices=connection_indices,
                             n_lines=max_lines,
                             node_angles=node_angles,
                             node_colors=label_colors,
                             title=title,
                             show=False,
                             node_width=node_width,
                             facecolor=face_color,
                             node_edgecolor=node_edgecolor,
                             linewidth=linewidth,
                             colormap=connection_palette,
                             vmin=vmin,
                             vmax=vmax,
                             colorbar=colorbar,
                             colorbar_size=colorbar_size,
                             node_linewidth=node_linewidth,
                             colorbar_pos=colorbar_pos,
                             fontsize_title=fontsize_title,
                             fontsize_names=fontsize_labels,
                             fontsize_colorbar=fontsize_colorbar,
                             padding=padding,
                             textcolor=text_color,
                             )

    if filename is not None:
        P.savefig(filename, facecolor=face_color, dpi=dpi)


# A more convenient colorbar that defaults to not having label offsets
# -------------------------------------
def nicecolorbar(mappable=None, source=None, clabel=None, offset=False, **kwargs):
    if source is None: source = P

    # Supported kwargs are ticks = [desired ticks], orientation = 'horizontal'/'vertical'

    formatter = matplotlib.ticker.ScalarFormatter(useOffset=offset)

    from types import ModuleType
    if isinstance(source, ModuleType) or isinstance(source, matplotlib.figure.Figure):
        # orientation "horizontal/vertical" for P.colorbar
        # fraction specifies fraction of original axis to use for colorbar
        c = source.colorbar(mappable=mappable, format=formatter, fraction=0.02, **kwargs)
    elif isinstance(source, Basemap):
        # location "top/bottom/left/right" for map.colorbar
        # size specifies percentage(string) of original axis to use for colorbar
        c = source.colorbar(mappable, format=formatter, size='1%', **kwargs)
    else:
        raise Exception("Don't recognize type of source specified: " + str(source))

    if clabel is not None: c.set_label(clabel)

    return c


# -------------------------------------
def visible_axes(visible_axes_list=['bottom', 'left'], axis=None):
    """ Makes a graph easier to read by removing the right and top lines and unnecessary tick lines.

    >>> import mlib.shell as S
    >>> basedir = repo_path() + '/doctest_working/graphics/visible_axes/'
    >>> S.rm   (basedir)
    >>> S.mkdir(basedir)

    >>> P.close('all')
    >>> _ = P.plot([1,2,3,4],[1,2,3,4])
    >>> visible_axes()
    >>> P.savefig(basedir + 'visible_axes_default.png')

    >>> P.close('all')
    >>> _ = P.plot([1,2,3,4],[1,2,3,4])
    >>> visible_axes(['bottom',])
    >>> P.savefig(basedir + 'visible_axes_bottom.png')

    >>> P.close('all')
    >>> _ = P.plot([1,2,3,4],[1,2,3,4])
    >>> visible_axes(['top',])
    >>> P.savefig(basedir + 'visible_axes_top.png')

    >>> P.close('all')
    >>> _ = P.plot([1,2,3,4],[1,2,3,4])
    >>> visible_axes(['left',])
    >>> P.savefig(basedir + 'visible_axes_left.png')

    >>> P.close('all')
    >>> _ = P.plot([1,2,3,4],[1,2,3,4])
    >>> visible_axes(['right',])
    >>> P.savefig(basedir + 'visible_axes_right.png')

    >>> P.close('all')
    >>> _ = P.plot([1,2,3,4],[1,2,3,4])
    >>> visible_axes(['left','top','bottom','right',])
    >>> P.savefig(basedir + 'visible_axes_all.png')

    """
    if axis is None:
        ax = P.gca()
    else:
        ax = axis

    visible_axes_list = [x.lower() for x in visible_axes_list]

    # Turn axis on or off depending on passed visible_axes_list variable
    for side in ['top', 'left', 'right', 'bottom']:
        ax.spines[side].set_visible(side in visible_axes_list)

    # Force the tick marks and labels to follow suit
    ax.tick_params(labeltop=False, top="top" in visible_axes_list,
                   labelbottom="bottom" in visible_axes_list, bottom="bottom" in visible_axes_list,
                   labelleft="left" in visible_axes_list, left="left" in visible_axes_list,
                   labelright=False, right="right" in visible_axes_list,
                   )

    # if not "top" in visible_axes_list: ax.tick_params(label

    # #Turn off top and right tick marks if requested
    # if "top"   not in visible_axes_list: ax.get_xaxis().tick_bottom()
    # if "right" not in visible_axes_list: ax.get_yaxis().tick_left  ()

    # #Turn off tick marks on the bottom or left axis if not included (different command)
    # if "bottom" not in visible_axes_list: P.tick_params(axis='x', which='both', bottom='off', top='off', labelbottom='off', labeltop='off')
    # if "left"   not in visible_axes_list: P.tick_params(axis='y', which='both', bottom='off', top='off', labelbottom='off', labeltop='off')


# Prevents the annoying "offset" subtraction from axis labels that Matplotlib often defaults to
# Operates on both axis by default unless otherwise specified
# -------------------------------------
def disable_axis_offset(x_axis=True, y_axis=True):
    formatter = matplotlib.ticker.ScalarFormatter(useOffset=False)
    ax = P.gca()
    if x_axis:
        ax.xaxis.set_major_formatter(formatter)
    if y_axis:
        ax.yaxis.set_major_formatter(formatter)


# Leaves a small mark in the lower left of the plot
# Records Mandrake, date of graph generation, and data version #
# for future reference
# -------------------------------------
def markplot(version=DEFAULT_VERSION, label=""):
    # import mlib.mtime
    string = "L.M.\n"
    mtime = mlib.mtime.Mtime()
    mtime.now()
    string += mtime.to("YYMMDD")
    if len(version) > 0: string += "\n" + version
    if len(label) > 0: string += ' ' + label
    return tiny_textbox(string, loc="lower left")


# Places a very small (xx-small) block of text wherever the user specifies
# location is expressed using strings for convenience, or absolute cords accepted
# possible loc = select from (lower/bottom, center/middle, upper/top) and (left, middle/center, right) or (x_abs, yabs)
# note loc strings are always Up/Down Left/Right order
# color is any valid color
# rotation is horizontal, vertical, or angle
# -------------------------------------
def tiny_textbox(text="", loc='lower right', color='k', rotation='horizontal'):
    if mlib.mtypes.isstr(loc):
        loc = loc.lower()
        UD, LR = loc.split(' ')
        if UD in ("lower", "bottom"):
            y = 0.01
            vert_text_align = "bottom"
        elif UD in ("center", "middle"):
            y = 0.5
            vert_text_align = "center"
        elif UD in ("upper", "top"):
            y = 1 - 0.01
            vert_text_align = "top"
        else:
            raise Exception("Illegal location specifier " + loc)
        if LR in ("left"):
            x = 0.01
            horiz_text_align = "left"
        elif LR in ("center", "middle"):
            x = 0.5
            horiz_text_align = "center"
        elif LR in ("right"):
            x = 1 - 0.01
            horiz_text_align = "right"
        else:
            raise Exception("Illegal location specifier " + loc)
    else:
        x, y = loc

    return P.figtext(x, y, text, size='xx-small', ha=horiz_text_align, va=vert_text_align,
                     color=color, rotation=rotation)


# -------------------------------------
def significant_ticks(miner, maxer, roughly_how_many):
    """ Create a label span that has as little decimal accuracy as needed.
    Does not necessarily line up with the max or min values, but regular
    values within the range using whatever decimal accuracy is required.
    Do not use these as an axis for miner, maxer but for tick labels.

    Args:
        miner: min value to accomodate
        maxer: max value to accomodate
        roughly_how_many: suggestion of how many you'd like (though the actual number varies depending on limits)

    >>> significant_ticks(0, 1, 10)
    array([ 0. ,  0.1,  0.2,  0.3,  0.4,  0.5,  0.6,  0.7,  0.8,  0.9,  1. ])

    >>> significant_ticks(0, 1, 2)
    array([ 0.,  1.])

    >>> significant_ticks(-0.001, 1, 10)
    array([-0. ,  0.1,  0.2,  0.3,  0.4,  0.5,  0.6,  0.7,  0.8,  0.9,  1. ])

    >>> significant_ticks(-1, -1.01, 3)
    array([-1.   , -1.005, -1.01 ])

    """

    # what decimal level will we support?
    delta = (maxer - miner) / float(roughly_how_many - 1)
    decimal_sig = NUM.first_decimal_of_sig(delta)
    sigdelta = N.round(delta, -decimal_sig)
    # get actual limits to the resolution of our sig decimals
    sigmin = N.round(miner, -decimal_sig)
    sigmax = N.round(maxer, -decimal_sig)
    # Craft the scaling from resolved min and max
    # magic number 0.99 is to ensure we get that last tick out

    return N.arange(sigmin, sigmax + sigdelta * 0.99, sigdelta)


# assumed current figure/axis has a graph in with decimal years on X-axis
# labels them with text descriptors of the beginning of months at the top of the graph
# MAKE SURE you immediately save the figure, or the axis may change and alter these relationships
def label_decimal_years(index_year=2015):
    # import mlib.mtime
    ax = P.axis()
    lx, rx = ax[:2]
    by, ty = ax[2:]

    ypos = (ty - by) * 0.95 + by

    years_to_consider = N.arange(N.floor(lx), N.ceil(rx) + 1)

    for year in years_to_consider:
        for month in mlib.mtime.MONTHS_BY_DOY:
            x = year + mlib.mtime.MONTHS_BY_DOY[month][0] / 365.0
            if lx <= x <= rx:
                P.text(x, ypos, month + " %4d" % (index_year + year), rotation='vertical', size='xx-small')


# -------------------------------------
def ticks_globe_degrees(miner, maxer):
    """ Returns a useful scale for lat/lon angles for plotting.
    Args:
        miner: minimum lat/lon degree
        maxer: maximum lat/lon degree

    >>> ticks_globe_degrees( -10, 10)
    array([-10.,  -5.,   0.,   5.,  10.])

    >>> ticks_globe_degrees( -180, 180) #doctest: +ELLIPSIS +NORMALIZE_WHITESPACE
    array([-180., -160., -140., -120., ..., 140.,  160.,  180.])

    >>> ticks_globe_degrees(30, 60)
    array([ 30.,  38.,  46.,  54.,  62.])

    >>> ticks_globe_degrees(30, 36)
    array([ 30.,  32.,  34.,  36.])

    >>> ticks_globe_degrees(30, 33)
    array([ 30.  ,  30.75,  31.5 ,  32.25,  33.  ])

    >>> ticks_globe_degrees(30, 31)
    array([ 30.  ,  30.25,  30.5 ,  30.75,  31.  ])

    """

    d_angle = maxer - miner
    if d_angle == 0.0: raise Exception("max and min identical, no range possible")

    if d_angle >= 180 - 45:
        return significant_ticks(miner, maxer, 16)
    elif d_angle >= 45:
        return significant_ticks(miner, maxer, 11)
    elif d_angle > 10:
        return significant_ticks(miner, maxer, 5)
    elif d_angle > 4:
        return significant_ticks(miner, maxer, 5)
    else:
        return N.linspace(miner, maxer, 5)


# -------------------------------------
def global_scatterplot_multiseries(x_pop_list, y_pop_list, title="", xlabel="", ylabel="",
                                   filename=None, palette="rainbow_black_red", projection='cyl',
                                   limits=[-180, 180, -90, 90],
                                   colors=None, labels=None, markersize=5, markeralpha=1.0, markertype='.',
                                   legend=True, marginal_bins=25, legend_alpha=0.9, legend_loc='best',
                                   legend_font='small', dpi=150,
                                   resolution='l', background=None, samefig=False, legend_markersize=None,
                                   grid_dashes=DEFAULT_DASHES, grid_alpha=0.5, linewidth=None, linestyle='-',
                                   linealpha=None,
                                   ):
    """ Creates a scatterplot for multiple populations of x/y data (no z value supported). A variety of useful options are included.
    Final results are mapped onto the Earth background.

    Args:
        x_pop_list : A list of lists/arrays defining the longitude x-coordinates for each population/point [(xpoints),]*numpops
        y_pop_list : Same for y, latitude [(ypoints),]*numpops
        title      : The title of the graph
        ylabel     : Ylabel to place on the graph (not currently working due to display location problem)
        xlabel     : Xlabel to place on the graph (not currently working due to display location problem)
        filename   : If None, no file written out. Otherwise specifies path and file to write at end.
        palette    : A string representing any colormap known, or a specific cmap object.
        colors     : A list of r,g,b tuples for each population, if None will automatically map to palette. Singleton r,g,b maps to all.
        labels     : A list of string labels for each population, if None will automatically generate "pop NN" for each.
        markersize : Marker size in plot
        markeralpha: Transparency of markers
        markertype : Types can be '.','o','t', etc.
        samefig    : If True, will make this plot on top of the current figure. Otherwise makes a new figure.
        background : The earth background, can be types "bluemarble", "etopo", or "shadedrelief", or None
        resolution : of the country borders. None, 'c'rude, 'l'ow, 'i'ntermediane, 'h'igh, 'f'ull
        grid_alpha : Alpha of the gridlines
        grid_dashes: The style of the gridlines in obscure [num pixels on, num pixels off] format
        legend_markersize: Size of markers to use in the legend, not the plot
        marginal_bins: Number of bins to use on each x or y coordinate to show the marginal histograms, None for no display
        linewidth  : If not None, will draw lines between points as well, specify linewidth here
        linealpha  : If not None, will draw lines. Alpha of drawn lines
        linestyle  : Style is a standard char '-',':','--',etc. default '-'

    Returns:
        figure    : Always returns the current figure so that additional edits to the graph may be performed.

    >>> pop1_lon = N.linspace(-180,180,100)
    >>> pop1_lat = N.linspace(-90 , 90,100)
    >>> pop2_lon = [N.cos(i/360.0*2*N.pi)*180 for i in range(360)]
    >>> pop2_lat = [N.sin(i/180.0*2*N.pi)*90  for i in range(360)]
    >>> x, y = N.meshgrid(N.linspace(90,180,200), N.linspace(-15,15,200))
    >>> pop3_lon = x.reshape(x.size)
    >>> pop3_lat = y.reshape(y.size)

    >>> import mlib.shell as S
    >>> basedir = repo_path() + '/doctest_working/graphics/global_scatterplot_multiseries/'
    >>> S.rm   (basedir)
    >>> S.mkdir(basedir)

    >>> h = global_scatterplot_multiseries ( [pop1_lon, pop2_lon, pop3_lon] , [pop1_lat, pop2_lat, pop3_lat], title = 'Basic test of global_scatterplot_multiseries', palette = "rainbow_black_red", filename = basedir+"test1.png", legend_markersize = 15, labels=("Linear", "Loopy", "denseblock"), marginal_bins = 50 )
    >>> h = global_scatterplot_multiseries ( [pop1_lon, pop2_lon, pop3_lon] , [pop1_lat, pop2_lat, pop3_lat], title = 'with lines test of global_scatterplot_multiseries', palette = "rainbow_black_red", filename = basedir+"test2.png", legend_markersize = 15, labels=("Linear", "Loopy", "denseblock"), marginal_bins = 10 , linewidth = 20, linealpha = 1.0,)

    Test empty case, no populations
    >>> h = global_scatterplot_multiseries( (), (), filename = basedir+"test_empty.png" )

    Test populations with no content
    >>> h = global_scatterplot_multiseries( ( (), () ), ( (), () ), filename = basedir+"test_empty2.png" )

    """

    # Get number of populations for plotting
    numpops = len(x_pop_list)

    # Span colors if user didn't specify
    if colors is None: colors = C.color_span(numpops, palette)

    # label the populations, otherwise generate basic population labels
    if labels is None: labels = ["pop %d" % x for x in range(numpops)]

    # Expand out singleton preferences to full pop array
    if is_not_iterable(markersize): markersize = [markersize, ] * numpops
    if is_not_iterable(markeralpha): markeralpha = [markeralpha, ] * numpops
    if is_not_iterable(markertype): markertype = [markertype, ] * numpops
    if is_not_iterable(colors): colors = [colors, ] * numpops

    # Create our own figure unless user requests we don't
    if not samefig: fig = P.figure()

    map = Basemap(projection=projection,
                  resolution=resolution,
                  llcrnrlon=limits[0],
                  llcrnrlat=limits[2],
                  urcrnrlon=limits[1],
                  urcrnrlat=limits[3],
                  )

    # each of these has a scale factor, scale=0.5 will reduce resolution image by 1/2
    if background is not None:
        if "marble" in background.lower(): map.bluemarble()
        if "topo" in background.lower(): map.etopo()
        if "relief" in background.lower(): map.shadedrelief()

    # draw coastlines, country boundaries, fill continents.
    if resolution is not None:
        # You CAN set transparency on the coastlines, but at higher resolution this looks horrible
        map.drawcoastlines()
        map.drawcountries()

    # draw the edge of the map projection region (the projection limb)
    map.drawmapboundary()

    # Figure out the meridian and parallel labels that make sense here
    meridians = ticks_globe_degrees(limits[0], limits[1])
    parallels = ticks_globe_degrees(limits[2], limits[3])
    map.drawmeridians(meridians, labels=[0, 0, 0, 1], color=(0.0, 0.0, 0.0), fontsize=5, alpha=grid_alpha,
                      dashes=grid_dashes)
    map.drawparallels(parallels, labels=[1, 0, 0, 0], color=(0.0, 0.0, 0.0), fontsize=5, alpha=grid_alpha,
                      dashes=grid_dashes)

    P.hold(True)

    # Plot the actual poulations
    for pop in range(numpops):

        mx, my = map(x_pop_list[pop], y_pop_list[pop])

        # Plot points for this population
        map.plot(mx, my, markertype[pop],
                 markersize=markersize[pop],
                 markerfacecolor=colors[pop],
                 markeredgecolor=colors[pop],
                 alpha=markeralpha[pop],
                 label=labels[pop]
                 )

        # If user specified line arguments, also add line between points
        if (linewidth is not None) or (linealpha is not None):
            map.plot(mx, my, linestyle,
                     color=colors[pop],
                     lw=linewidth,
                     alpha=linealpha,
                     label="_nolabel_",
                     )

    for pop in range(numpops):

        mx, my = map(x_pop_list[pop], y_pop_list[pop])

        # Plot marginals
        if not marginal_bins in (None, False):
            bins, counts = NUM.binned_stat(mx, limits=limits[0:2], bins=marginal_bins)
            # counts must now be normalized to take up bottom 10% of y axis
            counts = (counts / (N.max(counts) + 0.0000001) * 180 * 0.1 - 90).astype(int)
            map.plot(bins, counts, '-', linewidth=2.5, color='k', alpha=1)
            map.plot(bins, counts, '-', linewidth=2, color=colors[pop], alpha=1)

            bins, counts = NUM.binned_stat(my, limits=limits[2:], bins=marginal_bins)
            # counts must now be normalized to take up left 10% of x axis
            counts = (counts / (N.max(counts) + 0.0000001) * 360 * 0.1 - 180).astype(int)
            map.plot(counts, bins, '-', linewidth=2.5, color='k', alpha=1)
            map.plot(counts, bins, '-', linewidth=2, color=colors[pop], alpha=1)

    if legend and numpops > 1: nicelegend(framealpha=legend_alpha, loc=legend_loc, markersize=legend_markersize,
                                          size=legend_font)

    if title is not None: P.title(title)
    if xlabel is not None: P.xlabel(xlabel)
    if ylabel is not None: P.ylabel(ylabel)

    visible_axes()
    disable_axis_offset()
    #    P.tight_layout()
    markplot()

    if filename is not None: P.savefig(filename, dpi=dpi, bbox_inches='tight', pad_inches=0.1)

    return fig


# Makes a global (sphere) scatterplot of x and y colored by specified Z variable (not multipopulation) or by Group designation
# resolution is None (don't draw boundaries), 'c'rude, 'l'ow, 'i'ntermediane, 'h'igh, 'f'ull
# background puts an image as the background, valid entries are "bluemarble", "etopo", or "shadedrelief"
# groups specifies the grouping of the x,y points
# z (optional) specifies a data point value to color by
# func specifies a function to apply to an entire group's z values and color by the groups' overall func(z's) value
# -------------------------------------
def global_scatterplot_groups(x, y, groups=None, z=None, func=None, title="", xlabel="", ylabel="", clabel="",
                              filename=None, palette="gist_rainbow_r", projection='cyl', limits=[-180, 180, -90, 90],
                              markersize=5, markertype='.', colorbar=True, dpi=150, resolution='l', background="",
                              zlimits=None, samefig=False, grid_dashes=DEFAULT_DASHES, grid_alpha=0.5):
    """ A global map scatterplot of populations of X, Y, Z. Instead of multiseries, these x & y are segregated into populations by the
    group variable with optional functions applies to the groups. Like a histogram merged into a multiseries.

    >>> pop1_lon = N.linspace(-180,180,100)
    >>> pop1_lat = N.linspace(-90 , 90,100)
    >>> pop1_grp = N.linspace(   0,  4,100).astype(int)
    >>> pop2_lon = [N.cos(i/360.0*2*N.pi)*180 for i in range(360)]
    >>> pop2_lat = [N.sin(i/180.0*2*N.pi)*90  for i in range(360)]
    >>> pop2_grp = N.linspace(   5,  9,360).astype(int)
    >>> x, y = N.meshgrid(N.linspace(90,180,200), N.linspace(-15,15,200))
    >>> pop3_lon = x.reshape(x.size)
    >>> pop3_lat = y.reshape(y.size)
    >>> pop3_grp = N.linspace(  10, 14,len(pop3_lon)).astype(int)
    >>> X = list(pop1_lon) + list(pop2_lon) + list(pop3_lon)
    >>> Y = list(pop1_lat) + list(pop2_lat) + list(pop3_lat)
    >>> G = list(pop1_grp) + list(pop2_grp) + list(pop3_grp)
    >>> Z = N.array(G) * 5.0

    >>> h = global_scatterplot_groups( X, Y, groups = G, title = "basic test of global_scatterplot_groups", clabel = 'clabel', filename = repo_path()+"/doctest_working/global_scatterplot_groups_1.png", markersize = 20)

    """

    # think about if x, y, and maybe z are totally empty arrays

    # First figure out if we're coloring by group ID, z values, or a function of z values per group

    if z is None and func is None and groups is None:
        raise Exception("Must specify either z values, group values, and/or a func to apply over groups")

    if len(x) != len(y):
        raise Exception("Length of longitudes must match length of latitudes")

    if z is not None and len(z) != len(x):
        raise Exception("Specified color data must match length of latitudes")

    if z is None and func is None:
        # simple, color by group ID in order group ID's are encountered in data
        colors = N.float32(groups)
        # replace whatever group ID's are being used with a simple index of group identity
        # groupIDs = NUM.unique(groups)
        # index_by_group = dict([ ( g, i ) for i,g in enumerate(groupIDs)])
        # colors = [ index_by_group[g] for g in groups ]

    if z is not None:
        # Not too hard, color by user-specified z value
        colors = N.float32(z)

    if func is not None and z is None:
        # Someone requested a function of the data but didn't provide z values
        raise Exception('Cannot specify function without also providing z values for computation')

    if func is not None:
        # Harder, color by function applied over z values in each group
        groups = N.array(groups)
        colors = N.float32(groups * 0.0)
        for g in set(groups):
            z = N.float64(z)
            colors[groups == g] = func(z[groups == g])

    if zlimits is None:
        if len(colors) > 0:
            zlimits = [N.min(colors), N.max(colors)]
        else:
            zlimits = [None, None]

    # Make our own figure unless user requests we don't
    if not samefig:
        fig = P.figure()
        fig.add_subplot(1, 1, 1)

    map = Basemap(projection=projection,
                  resolution=resolution,
                  llcrnrlon=limits[0],
                  llcrnrlat=limits[2],
                  urcrnrlon=limits[1],
                  urcrnrlat=limits[3],
                  )

    # each of these has a scale factor scale=0.5 will reduce resolution image by 1/2
    if "marble" in background: map.bluemarble()
    if "topo" in background: map.etopo()
    if "relief" in background: map.shadedrelief()

    # draw coastlines, country boundaries, fill continents.
    if resolution is not None:
        # You CAN set transparency on the coastlines, but at higher resolution this looks horrible due to intersecting lines
        map.drawcoastlines()
        map.drawcountries()

    # draw the edge of the map projection region (the projection limb)
    map.drawmapboundary()

    # Figure out the meridian and parallel labels that make sense here
    meridians = ticks_globe_degrees(limits[0], limits[1])
    parallels = ticks_globe_degrees(limits[2], limits[3])
    map.drawmeridians(meridians, labels=[0, 0, 0, 1], color=(0.0, 0.0, 0.0), fontsize=5, alpha=grid_alpha,
                      dashes=grid_dashes)
    map.drawparallels(parallels, labels=[1, 0, 0, 0], color=(0.0, 0.0, 0.0), fontsize=5, alpha=grid_alpha,
                      dashes=grid_dashes)

    # Plot
    # lw=0 turns off the black line on the outside of the markers
    sp = P.scatter(x, y, s=markersize, marker=markertype, c=colors, alpha=1, cmap=C.custom_colormap(palette), lw=0,
                   vmin=zlimits[0], vmax=zlimits[1])

    if colorbar and len(colors) > 0:
        # When using a basemap colorbar, use location = top/right/left/bottom rather than orientation='horizontal/vertical'
        c = nicecolorbar(sp, source=map, location='right', clabel=clabel)

    if title is not None: P.title(title)
    if xlabel is not None: P.xlabel(xlabel)
    if ylabel is not None: P.ylabel(ylabel)

    visible_axes()
    disable_axis_offset()
    markplot()

    # Pull the left axis back on the graph
    #    fig.tight_layout()
    #    P.subplots_adjust(left=0.35, right=0.95, top=0.95, bottom=0.05)
    #    P.tight_layout(rect=(.1,.1,0.9,0.9))

    if filename is not None: P.savefig(filename, dpi=dpi)  # ,bbox_inches='tight',pad_inches=2)

    return fig


# x,y are just random points. They will be aggregated automatically.
# log, if set to true, will take the log(count) of each bin value, overwriting specified reduce functions
# Bins specifies number of bins. Can also be array [40,20] to specify x,y bins.
# fit_line can be True (single segment line fit) or an array of x-points for a piecewise linear fit
# equation_style can be intercept (y=mx+b), meaned (y=m(x-b)), or both (show both in sequence)
# square forces the x and y axis to be the same

def plot_heatmap_square(x, y, z=None, log=False, bins=50, limits=None, func="count",
                        zlimits=None, colorbar=True, xlabel=None, ylabel=None, clabel=None,
                        title=None, filename=None, true_line=False, fit_line=True, show_equation=True, dpi=150,
                        equation_style='intercept',
                        fit_type='raw', square=False, axis=None, palette=None,
                        xticks=None, yticks=None):
    """ Takes a collection of x,y points and assembles a heatmap (2D histogram).
    Args:
        x, y     : data series to plot
        z        : Optional data value to aggregate into bins formed by x,y
        log      : Take log of counts within bins
        bins     : Single int results in intxint grid, (int, int) tuple results in similar grid,
                   or (array, array) for specific bin centers
        limits   : Extent of drawing (x1,x2,y1,y2)
        func     : Function to be applied within each bin when merging values
        zlimits  : Colorscale limits for resulting zvalues, be they count or func(data) within each bin
        colorbar : True if a colorbar is desired
        xlabel   : X label for axis
        ylabel   : Y label for axis
        clabel   : Label for colorbar
        title    : Title for graph
        filename : If set, graph is saved to this name. Extension provides format. None will not save graph.
        true_line: Plot a y = x line on the graph, often useful with square = True to show perfect equality for comparison
        fit_line : Fit a line to the graph and overplot it.
        show_equation: Display the fit equation if computed
        dpi      : The dpi to save the figure
        equation_style: 'intercept' uses m,b intercept form, 'mean' uses (x-x0) method, 'both' displays both styles
        fit_type : 'raw' indicates standard linear fit, 'binned' first bins the data
        square   : Causes the axes to be set to equal x/y max/min
        axis     : The axis to use for plotting
        palette  : The palette to apply to z values
        xticks   : The x-ticks to use
        yticks   : The y-ticks to use
    Returns:
        handle   : A handle to the current plot

    Make some square data to test algorithm
    >>> X = [9,]*10   + range(10) + [0,]*10   + range(10)
    >>> Y = range(10) + [9,]*10   + range(10) + [0,]*10
    >>> P.close('all')
    >>> _ = plot_heatmap_square(X, Y, filename = repo_path()+'/doctest_working/heatmap_square1.png', limits = (0,9,0,9), bins=(10,10))

    """

    if palette is None: palette = P.cm.hot

    if axis is None:
        P.figure()
        axis = P

    # Remove any infinite or NaN values in x or y and remove them
    if N.isinf(y).any() or N.isnan(y).any() or N.isinf(x).any() or N.isnan(x).any():
        mask = (~N.isinf(y)) & (~N.isnan(y)) & (~N.isinf(x)) & (~N.isnan(x))
        x = x[mask]
        y = y[mask]

    userclabel = None
    if clabel is not None:
        userclabel = clabel

    if mlib.mtypes.isstr(func):
        if func.lower() == "std":
            function = N.std
            clabel = 'stdev'
        elif func.lower() == 'mean':
            function = N.mean
            clabel = 'mean'
        elif func.lower() in ('count', 'counts'):
            z = N.ones(len(x), dtype=N.int64)
            function = N.sum
            clabel = 'counts'
        elif func.lower() in ('min', 'minimum'):
            function = N.min
            clabel = 'min'
        elif func.lower() in ('max', 'maximum'):
            function = N.max
            clabel = 'max'
        elif func.lower() in ('mode'):
            function = N.mode
            clabel = 'mode'
    else:
        # assume it is a function being passed
        function = func
        clabel = func.__name__

    if log:
        function = NUM.log10count
        # There must be something to count in the bins, so use x as the z values
        z = x
        clabel = 'Log10(counts)'

    if limits is None:
        limits = (N.min(x), N.max(x), N.min(y), N.max(y))

    if square:
        miner = N.min((limits[0], limits[2]))
        maxer = N.max((limits[1], limits[3]))
        limits = (miner, maxer, miner, maxer)

    if (zlimits is None) and (z is not None):
        vmin = N.min(z)
        vmax = N.max(z)

    if (zlimits is None):
        vmin = None
        vmax = None
    else:
        vmin, vmax = zlimits

    if is_iterable(bins):
        binx, biny = bins
    else:
        binx, biny = bins, bins

    # Sort x,y in terms of x to avoid graphing problems later
    if z is None:
        x, y = NUM.sort_arrays_by_first(x, y)
    else:
        x, y, z = NUM.sort_arrays_by_first(x, y, z)

    x_bins, y_bins, z_grid = NUM.binned_stat_2d(x, y, z=z, func=function, binsx=binx, binsy=biny, limitsx=limits[0:2],
                                                limitsy=limits[2:4])

    dx = x_bins[1] - x_bins[0]
    dy = y_bins[1] - y_bins[0]

    extent = [N.min(x_bins) - dx, N.max(x_bins) + dx, N.min(y_bins) - dy, N.max(y_bins) + dy]

    handle = P.imshow(P.flipud(z_grid.transpose()), extent=extent, aspect='auto',
                      interpolation='none', cmap=palette, vmin=vmin, vmax=vmax)
    axis.axis(limits)

    if xticks is not None:
        if is_not_iterable(xticks):
            # jump by specified xticks value, but ensure we also include the final limit value for labeling
            P.xticks(list(set(list(N.arange(limits[0], limits[1], xticks)) + [limits[1], ])))
        else:
            # just use the array specified as the precise ticks
            P.xticks(xticks)

    if yticks is not None:
        if is_not_iterable(yticks):
            # jump by specified xticks value, but ensure we also include the final limit value for labeling
            P.yticks(list(set(list(N.arange(limits[0], limits[1], yticks)) + [limits[1], ])))
        else:
            # just use the array specified as the precise ticks
            P.yticks(yticks)

    if colorbar:
        nicecolorbar(handle, clabel=userclabel if userclabel else clabel)

    if xlabel: axis.xlabel(xlabel)
    if ylabel: axis.ylabel(ylabel)
    if title: axis.title(title)

    # Handle if user just wants a single line fit (traditional)

    if mlib.mtypes.isbool(fit_line) and fit_line:

        if (fit_type is not None) and ("binned median" == fit_type.lower()):
            x, y = NUM.binned_stat(x, bins=50, limits=limits[:2], y=y, func='median')

        m, b, ypredict, R2_adj = NUM.simple_linear_fit(y, x)
        #        P.plot(x, ypredict, '-b', alpha=0.3, linewidth=4)

        # Plot the fit line
        axis.plot(x, ypredict, '-b', alpha=0.3, linewidth=4, label='linear fit')

        if show_equation:

            # import mlib.equation

            (Lx, Rx, Ly, Ry) = axis.axis()

            eqtext = []

            if ("both" in equation_style.lower()) or ("intercept" in equation_style.lower()):
                eqtext.append(mlib.equation.text_equation_simple_linear_fit(m, b, style='intercept'))
            if ("both" in equation_style.lower()) or ("meaned" in equation_style.lower()):
                eqtext.append(mlib.equation.text_equation_simple_linear_fit(m, b, style='mean'))
            eqtext = "\n".join(eqtext) + "\nR2 %0.2f" % R2_adj

            axis.text((Rx - Lx) * 0.02 + Lx,
                      (Ry - Ly) * 0.02 + Ly,
                      eqtext,
                      color=(.9, .9, 1), size='small')

    # Process user-specified x breakpoints for piecewise linear fit

    if is_iterable(fit_line):

        # remove any specified x-breaks that are beyond any actual data
        fit_line = [b for b in fit_line if b < N.max(x)]

        xpredict, ypredict, coef_arr = NUM.piecewise_linear_fit(x, y, x_break_points=fit_line, fit_type=fit_type)

        # Plot the fit line, broken into relevant pieces
        last_x = N.min(x)
        eqlabels = []
        for breakx in list(fit_line) + [N.max(xpredict), ]:
            mask = (last_x < xpredict) & (xpredict < breakx)
            eqlabels.append("[%0.1f < X < %0.1f]: " % (last_x, breakx))
            last_x = breakx
            axis.plot(xpredict[mask], ypredict[mask], '-b', alpha=0.3, linewidth=4)

        if show_equation:

            (Lx, Rx, Ly, Ry) = axis.axis()

            eqtext = []
            for i in range(len(coef_arr)):
                if ("both" in equation_style.lower()) or ("intercept" in equation_style.lower()):
                    eqtext.append("%s = %0.2g*(%s) + %0.2g" % ('Y', coef_arr[i][0], 'X', coef_arr[i][1]))
                if ("both" in equation_style.lower()) or ("meaned" in equation_style.lower()):
                    eqtext.append(
                        "%s = %0.2g*(%s + %0.2g)" % ('Y', coef_arr[i][0], 'X', coef_arr[i][1] / coef_arr[i][0]))
            eqtext = "\n".join(eqtext)

            axis.text((Rx - Lx) * 0.02 + Lx,
                      (Ry - Ly) * 0.02 + Ly,
                      eqtext, color=(.9, .9, 1), size='small')

    # Handle if the user wants a y = x true line for comparison

    if true_line:
        (xmin, xmax, ymin, ymax) = axis.axis()
        gmin = N.min((xmin, ymin))
        gmax = N.max((ymax, xmax))
        axis.plot((gmin, gmax), (gmin, gmax), 'w--', alpha=0.5, linewidth=1)
        # Restore original axis, so we don't pull the graph away from the data
        axis.axis((xmin, xmax, ymin, ymax))

    visible_axes()
    disable_axis_offset()
    markplot()

    if filename is not None: axis.savefig(filename, dpi=dpi)

    return handle


# x,y are just random points. They will be aggregated automatically.
# log_count, if set to true, will take the log(count) of each bin value
# gridsize specifies number of hex's. Can also be array [40,20] to specify x,y. This is a sensitive parameter, as too large a value can
# virtually obscure small datasets due to the irregular tiling of the hex's. Leaving None will auto-calculate based on data size
# fit_line can be True (single segment line fit) or an array of x-points for a piecewise linear fit
# equation_style can be intercept (y=mx+b), meaned (y=m(x-b)), or both (show both in sequence)
# square forces the x and y axis to be the same
def plot_heatmap_hex(x, y, z=None, log=False, gridsize=None, limits=None, func="count",
                     zlimits=None, colorbar=True, xlabel=None, ylabel=None, clabel=None,
                     title=None, filename=None, fit_line=True, show_equation=True, dpi=150, equation_style='intercept',
                     fit_type='raw', square=False, axis=None, palette=None):
    if palette is None: palette = P.cm.hot

    if axis is None:
        P.figure()
        axis = P

    # Remove any infinite or NaN values in x or y and remove them
    if N.isinf(y).any() or N.isnan(y).any() or N.isinf(x).any() or N.isnan(x).any():
        mask = ~N.isinf(y) & ~N.isnan(y) & ~N.isinf(x) & ~N.isnan(x)
        x = x[mask]
        y = y[mask]

    # Approximate grid sizes that look good vs. number of data to be plotted (assuming not entirely overlapped)
    # 1000000 ~ 300
    # 1000 ~ 50
    # 100 ~
    # 10 ~ 10
    # If gridsize is not specified, attempt to guess
    if gridsize is None:
        gridsize = int(max(10, 5.0 * len(x) ** 0.3))

    # Sort x,y in terms of x to avoid graphing problems later
    x, y = NUM.sort_arrays_by_first(x, y)

    userclabel = None
    if clabel is not None:
        userclabel = clabel

    if func.lower() == "std":
        function = N.std
        clabel = 'stdev'
    elif func.lower() == 'mean':
        function = N.mean
        clabel = 'mean'
    elif func.lower() in ('count', 'counts'):
        function = N.sum
        clabel = 'counts'
    elif func.lower() in ('min', 'minimum'):
        function = N.min
        clabel = 'min'
    elif func.lower() in ('max', 'maximum'):
        function = N.max
        clabel = 'max'

    if limits is None:
        limits = (N.min(x), N.max(x), N.min(y), N.max(y))

    if square:
        miner = N.min((limits[0], limits[2]))
        maxer = N.max((limits[1], limits[3]))
        limits = (miner, maxer, miner, maxer)

    if (zlimits is None) and (z is not None):
        vmin = N.min(z)
        vmax = N.max(z)

    if (zlimits is None):
        vmin = None
        vmax = None
    else:
        vmin, vmax = zlimits

    if log:
        clabel = 'log10 ' + clabel

    handle = axis.hexbin(x, y, C=z, bins="log" if log else None,
                         cmap=palette, gridsize=gridsize,
                         extent=limits,
                         reduce_C_function=function,
                         vmin=vmin, vmax=vmax
                         )

    axis.axis(limits)

    if colorbar:
        nicecolorbar(handle, clabel=userclabel if userclabel else clabel)

    if xlabel: axis.xlabel(xlabel)
    if ylabel: axis.ylabel(ylabel)
    if title: axis.title(title)

    # Handle if user just wants a single line fit (traditional)

    if type(fit_line) == type(True) and fit_line:

        if (fit_type is not None) and ("binned median" == fit_type.lower()):
            x, y = NUM.binned_stat(x, bins=50, limits=limits[:2], y=y, func='median')

        ypredict, coefs, error = NUM.fitline(x, y, order=1)

        # Plot the fit line
        axis.plot(x, ypredict, '-b', alpha=0.5, linewidth=4)

        if show_equation:

            (Lx, Rx, Ly, Ry) = axis.axis()

            eqtext = []
            if ("both" in equation_style.lower()) or ("intercept" in equation_style.lower()):
                eqtext.append("%s = %0.2g*(%s) + %0.2g" % ('Y', coefs[0], 'X', coefs[1]))
            if ("both" in equation_style.lower()) or ("meaned" in equation_style.lower()):
                eqtext.append("%s = %0.2g*(%s + %0.2g)" % ('Y', coefs[0], 'X', coefs[1] / coefs[0]))
            eqtext = "\n".join(eqtext)

            axis.text((Rx - Lx) * 0.02 + Lx,
                      (Ry - Ly) * 0.02 + Ly,
                      eqtext,
                      color=(.9, .9, 1), size='small')

    # Process user-specified x breakpoints for piecewise linear fit

    if is_iterable(fit_line):

        # remove any specified x-breaks that are beyond any actual data
        fit_line = [b for b in fit_line if b < N.max(x)]

        xpredict, ypredict, coef_arr = NUM.piecewise_linear_fit(x, y, x_break_points=fit_line, fit_type=fit_type)

        # Plot the fit line, broken into relevant pieces
        last_x = N.min(x)
        eqlabels = []
        for breakx in list(fit_line) + [N.max(xpredict), ]:
            mask = (last_x < xpredict) & (xpredict < breakx)
            eqlabels.append("[%0.1f < X < %0.1f]: " % (last_x, breakx))
            last_x = breakx
            axis.plot(xpredict[mask], ypredict[mask], '-b', alpha=0.5, linewidth=4)

        if show_equation:

            (Lx, Rx, Ly, Ry) = axis.axis()

            eqtext = []
            for i in range(len(coef_arr)):
                if ("both" in equation_style.lower()) or ("intercept" in equation_style.lower()):
                    eqtext.append("%s = %0.2g*(%s) + %0.2g" % ('Y', coef_arr[i][0], 'X', coef_arr[i][1]))
                if ("both" in equation_style.lower()) or ("meaned" in equation_style.lower()):
                    eqtext.append(
                        "%s = %0.2g*(%s + %0.2g)" % ('Y', coef_arr[i][0], 'X', coef_arr[i][1] / coef_arr[i][0]))
            eqtext = "\n".join(eqtext)

            axis.text((Rx - Lx) * 0.02 + Lx,
                      (Ry - Ly) * 0.02 + Ly,
                      eqtext, color=(.9, .9, 1), size='small')

    visible_axes()
    disable_axis_offset()
    markplot()

    if filename is not None: axis.savefig(filename, dpi=dpi)

    return handle


# Makes a plot of several values on a single histogram, with intelligently chosen limits to span them all
# optional weight_list performs functions on weights instead of bin count
# func is the function to apply within each bin
# normalize can be None (don't), "peak" (normalize peak values to 1), or "area" ( sum of area equal to one / frequency )
# cumulative will form the integrated curve, the "cumulative distribution function", of the histogram given whatever normalization has been requested
# show_gaussian_fit will graphically represent the STD and MEAN of each population as thin crosses floating beneath the histogram
# xticks controls precisely which ticks to use. A single value represents a spacing, or an array the precise xticks to use
# legend controls whether a legend will be shown. legend = None lets the code decide (no for 1 series, yes for >1 series)
# returns the fit mu and sigma for each population.
# bins must be an integer or an array of valid bin centers
# yaxis is boolean, False indicates don't even plot Y axis values at all. Default True
def plot_histogram_multiseries(val_list, weights=None, filename=None, bins=80,
                               limits=None, xlabel=None, ylabel=None, title=None,
                               func=None, normalize=None, samefig=False,
                               colors=None, labels=None, palette="gist_rainbow",
                               dpi=150, styles='-', widths=2.0, alphas=1.0,
                               log=False, cumulative=False, show_gaussian_fit=True,
                               xticks=None, legend=None,
                               return_gaussian_fit=False, ignore_outliers=False,
                               grid=False, yaxis=True, legend_font='x-small'):
    # Can't work if there aren't any arrays passed at all
    if len(val_list) == 0: return

    numpops = len(val_list)

    # Only show a legend automatically if there are at least two populations
    if legend is None: legend = numpops > 1

    # Gather the total number of values to histogram in any population
    numtotal = N.sum([len(_list) for _list in val_list])

    # Add weights if not provided
    if weights is None:
        func = 'count'
        weights = [N.ones_like(x) for x in val_list]
    if len(weights) != len(val_list): raise Exception("Weights and Bin values must be equal in length")

    # Remove any nan's present in the incoming data, can't handle it later
    # Unpleasant that we need to copy the data
    mask = [(~N.isnan(x)) & (~N.isnan(y)) for x, y in zip(val_list, weights)]
    data_list = [N.array(val_list[i])[mask[i]] for i in range(numpops)]
    weights = [N.array(weights[i])[mask[i]] for i in range(numpops)]
    del mask

    # If normalize = True, assume area method
    if normalize == True: normalize = "area"
    if normalize == False: normalize = None

    # If widths, styles, or alphas are not iterable, expand properly
    if is_not_iterable(widths): widths = [widths, ] * numpops
    if is_not_iterable(styles): styles = [styles, ] * numpops
    if is_not_iterable(alphas): alphas = [alphas, ] * numpops

    # Only make a new figure if the user hasn't asked us not to
    if not samefig: P.figure()

    # Autoscale if limits are not specified
    if limits is None:
        limits = [NUM.armin(*data_list), NUM.armax(*data_list)]

    # Only empty arrays were passed
    if limits[0] is None: return

    # Just plot by palette color if no colors specified, unique to each population (else use user-provided colors)
    if colors is None:
        if numpops > 1:
            colors = C.color_span(numpops, palette=palette)
        else:
            colors = [(0, 0, 1), ]

    # label the populations, otherwise generate basic population labels
    if labels is None: labels = ["pop %d" % x for x in range(numpops)]

    # Store the sigma and mu of each population if useful
    pop_mu = []
    pop_sigma = []

    for i, (series, weights) in enumerate(zip(data_list, weights)):

        if len(series) > 0:
            bins, counts = NUM.binned_stat(series, y=weights, bins=bins, limits=limits, func=func,
                                           ignore_outliers=ignore_outliers)
        else:
            continue

        # Apply normalization
        if normalize is not None:
            if normalize.lower() == "peak":
                counts /= float(max(counts))
            elif normalize.lower() == "area":
                counts /= float(N.sum(counts))

        # Transform to cumulative distribution if requested
        if cumulative: counts = N.cumsum(counts)

        # Apply log(y) if requested
        if log:
            # handle zero values in histogram by raising them to 1/100th the lowest non-zero value displayed in the histogram currently
            smallval = N.min(counts[counts > 0])
            counts[counts == 0] = smallval / 100.0
            counts = N.log10(counts)

        # Actual plotting
        P.plot(bins, counts, styles[i], color=colors[i], label=labels[i], linewidth=widths[i], alpha=alphas[i])

        # Calculate Gaussian fits
        if show_gaussian_fit or return_gaussian_fit:
            popsd = N.std(N.array(series, dtype=N.float64), ddof=1)
            popmn = N.mean(series)

        # Store for returning
        if return_gaussian_fit:
            pop_sigma.append(popsd)
            pop_mu.append(popmn)

        # Plot the fits on the graph
        if show_gaussian_fit:
            HEIGHT = 1 / 6.0 * N.max(counts)

            P.errorbar([popmn, ], [3 * HEIGHT, ], fmt='+',
                       xerr=popsd, yerr=HEIGHT / 2.0,
                       alpha=0.6, color=colors[i])
            P.text(popmn, 3 * HEIGHT,
                   "sg %0.3g" % (popsd), size=8, horizontalalignment='center', weight='bold', alpha=0.6)
            P.text(popmn, 3 * HEIGHT - HEIGHT / 2.0,
                   "mu %0.3g" % (popmn), size=8, horizontalalignment='center', weight='bold', alpha=0.6)

        P.hold(True)

    if grid: P.grid(True, alpha=0.25)

    if xlabel is not None: P.xlabel(xlabel)
    if ylabel is not None: P.ylabel(ylabel)
    if title is not None: P.title(title)

    P.xlim(limits)

    if xticks is not None:
        if is_not_iterable(xticks):
            # jump by specified xticks value, but ensure we also include the final limit value for labeling
            P.xticks(list(set(list(N.arange(limits[0], limits[1], xticks)) + [limits[1], ])))
        else:
            # just use the array specified as the precise ticks
            P.xticks(xticks)

    if legend and numtotal > 0: nicelegend(size=legend_font)

    markplot()
    disable_axis_offset()
    if not yaxis:
        visible_axes(['bottom', ])
    else:
        visible_axes()

    if filename is not None: P.savefig(filename, dpi=dpi)  # ,bbox_inches='tight')

    if return_gaussian_fit:
        return P.gcf(), pop_mu, pop_sigma
    else:
        return P.gcf()


# Takes in point lat,lon,Z data and grids it THEN plots it on the global map
def global_heatmap_square(lons, lats, z=None, title="", xlabel="", ylabel="", filename=None,
                          palette='afmhot', projection='cyl', limits=[-180, 180, -90, 90],
                          vmin=None, vmax=None, contour=False, wrap_coordinates=False,
                          axis=None, func=None, bins=10, colorbar=True, clabel=None,
                          min_counts_per_bin=0, dpi=150, grid_dashes=DEFAULT_DASHES,
                          log=False, show_value_color=None):
    if is_iterable(bins):
        binx, biny = bins
    else:
        binx, biny = bins, bins

    # Bin the data into a huge grid, reduced by func
    lon_array, lat_array, z_grid = NUM.binned_stat_2d(lons, lats, z=z, func=func, binsx=binx, binsy=biny,
                                                      limitsx=limits[0:2], limitsy=limits[2:4])
    # Bin the data into a count grid
    lon_array, lat_array, count_grid = NUM.binned_stat_2d(lons, lats, binsx=binx, binsy=biny, limitsx=limits[0:2],
                                                          limitsy=limits[2:4])

    # Nan out bins where the count is too low
    z_grid_corrected = z_grid[:]
    z_grid_corrected[count_grid < min_counts_per_bin] = N.nan

    # If log is requested, do it
    if log:
        z_grid_corrected = N.log10(z_grid_corrected + 1.0)

    # Plot
    sc = global_plot_grid(lon_array, lat_array, z_grid_corrected, title=title,
                          xlabel=xlabel, ylabel=ylabel, filename=filename,
                          palette=palette, projection=projection, limits=limits,
                          vmin=vmin, vmax=vmax, contour=contour, axis=axis,
                          label_lon=False, label_lat=False, colorbar=colorbar,
                          clabel=clabel, dpi=dpi, grid_dashes=grid_dashes,
                          show_value_color=show_value_color)

    # Return the image handle, the z_grid generated, and the count_grid
    return sc, z_grid, count_grid


# Makes a global (whole Earth) gridplot of x(lons) and y(lats) colored by matrix z
def global_plot_grid(lons, lats, z,
                     title="", xlabel="", ylabel="", filename=None, palette='jet', projection='cyl',
                     limits=[-180, 180, -90, 90], vmin=None, vmax=None,
                     contour=False, wrap_coordinates=False, axis=None, clabel=None, show_value_color=None,
                     label_lon=False, label_lat=True, colorbar=True, dpi=150, grid_dashes=DEFAULT_DASHES,
                     grid_alpha=0.5):
    if axis is None:
        P.figure()
        axis = P.gca()
    else:
        P.sca(axis)

    if (N.isnan(N.nanmax(lons)) or
            N.isnan(N.nanmax(lats)) or
            N.isnan(N.nanmax(z))
    ):
        print("Skipping global_plot_grid, only NaN's found in grid to plot or axis to label")
        return

    palette = eval('P.cm.' + palette)

    if vmin is None: vmin = N.nanmin(z)
    if vmax is None: vmax = N.nanmax(z)

    # Arbitrary bump up to prevent degeneracies
    if vmin == vmax: vmax += 1.0

    gridnumx = len(lons)
    gridnumy = len(lats)

    # If wrap_coordinates is on, assume all lon/lat values are in proper coordinate system and wrap them around the globe until they are plottable
    if wrap_coordinates:
        lons = NUM.wrap_val_to_range(lons, -180, 180)
    else:
        if (N.max(lons) > 180):
            print("ERROR! Longitude specified that is beyond 180 limit. Are you in a different longitude coordinate?")
            sys.exit()

        if (N.min(lons) < -180):
            print("ERROR! Longitude specified that is below -180 limit. Are you in a different longitude coordinate?")
            sys.exit()

    # set up orthographic map projection with
    # perspective of satellite looking down at 50N, 100W.
    # use low resolution coastlines.
    # don't plot features that are smaller than 1000 square km.
    # Crude, Low, Intermediate, High, Full for resolutions
    map = Basemap(projection=projection,
                  resolution='l',
                  llcrnrlon=limits[0],
                  llcrnrlat=limits[2],
                  urcrnrlon=limits[1],
                  urcrnrlat=limits[3],
                  ax=axis,
                  fix_aspect=False,
                  #                  lat_0 = -90, lon_0 = 0.0#, width = 360, height = 180
                  )  # ,area_thresh=1000.)
    # draw coastlines, country boundaries, fill continents.
    map.drawcoastlines()
    map.drawcountries()
    #    map.fillcontinents(color='grey')

    # draw the edge of the map projection region (the projection limb)
    map.drawmapboundary()
    # draw lat/lon grid lines every 30 degrees.
    labels = [1, 0, 1, 1] if label_lon else [0, 0, 0, 0]

    delta_lon = MLL.delta_angle(lons[1], lons[0])
    map.drawmeridians(lons - delta_lon / 2.0, labels=labels, linewidth=0.5, color=(0.0, 0.0, 0.0), fontsize=5,
                      alpha=grid_alpha, dashes=grid_dashes)
    labels = [1, 0, 1, 1] if label_lat else [0, 0, 0, 0]
    delta_lat = N.abs(lats[1] - lats[0])
    map.drawparallels(lats - delta_lat / 2.0, labels=labels, linewidth=0.5, color=(0.0, 0.0, 0.0), fontsize=5,
                      alpha=grid_alpha, dashes=grid_dashes)

    # Make a contour plot
    if contour:

        # expand the x, y lon's and lat's to match the 2D nature of z
        x, y = N.meshgrid(lons, lats)

        if vmax is not None:
            levels = N.arange(vmin, vmax + 1, (vmax - vmin + 1) / 20.0)
        else:
            levels = 20

        CS1 = map.contour(x, y, z.transpose(), levels, colors='k', linewidths=0.5)
        CS2 = map.contourf(x, y, z.transpose(), CS1.levels, cmap=palette)

        if colorbar:
            cb = nicecolorbar(CS2, source=map, location='bottom', clabel=clabel,
                              ticks=significant_ticks(vmin, vmax, 10))
        #            cb.set_ticks(significant_ticks(vmin,vmax,10))

        returnval = CS2

    # Or just show the data grid itself without blurring
    else:

        # We are coloring based on the z variable
        sc = map.imshow(z.transpose(), interpolation='none', vmin=vmin, vmax=vmax, cmap=palette, aspect='auto')

        if colorbar:
            nicecolorbar(sc, source=map, location='bottom', clabel=clabel, ticks=significant_ticks(vmin, vmax, 10))
        #            formatter = matplotlib.ticker.ScalarFormatter( useOffset = False )
        #            cb = map.colorbar(sc, format = formatter, location='bottom')#, shrink=0.5)
        #            cb.set_ticks(significant_ticks(vmin,vmax,10))

        returnval = sc

    # If user requests showing the values on the grid, put them there now
    if show_value_color is not None:
        for i_lon in range(len(lons)):
            for i_lat in range(len(lats)):
                if N.isnan(z[i_lon, i_lat]): continue
                P.text(lons[i_lon], lats[i_lat], "%d" % z[i_lon, i_lat], fontsize='xx-small',
                       color=show_value_color,
                       horizontalalignment='center',
                       verticalalignment='center',
                       )

    P.title(title)
    if len(xlabel) > 0: P.xlabel(xlabel)
    if len(ylabel) > 0: P.ylabel(ylabel)

    #    markplot()
    disable_axis_offset()
    visible_axes()
    P.tight_layout()

    if filename is not None: P.savefig(filename, dpi=dpi, bbox_inches='tight')

    return returnval


# draws a rectangle
def rectangle(x1, x2, y1, y2, color='k', alpha=0.1, label='_nolabel_'):
    from matplotlib.patches import Rectangle
    rect = Rectangle((x1, y1), x2 - x1, y2 - y1, fill=True, fc=color, edgecolor='none',
                     alpha=alpha, visible=True, label=label)  # label='_nolegend_')
    P.gca().add_patch(rect)


# draws an irregular polygon
def polygon(x, y, color='k', alpha=0.1, label=""):
    from matplotlib.patches import Polygon
    poly = Polygon(zip(x, y), fill=True, fc=color, ec=color, lw=0.0, alpha=alpha, edgecolor='none', visible=True,
                   label=label)
    P.gca().add_patch(poly)


# -----------------
def plot_varyline(X, Y, colors=(0, 0, 1), alphas=0.5, linewidths=2, label=None, samefig=True):
    """ Plot a single curve with almost every aspect alterable along its length.

    >>> NUM = 1000
    >>> X=N.linspace(0,1.0,NUM)
    >>> Y=N.sin(2*3.14159*X)

    >>> P.close('all')
    >>> plot_varyline(X,Y)
    >>> P.savefig(repo_path()+"/doctest_working/varyline1.png",dpi=150)

    >>> P.close('all')
    >>> plot_varyline(X,Y, colors = C.color_span(NUM, palette = 'plasma'))
    >>> P.savefig(repo_path()+"/doctest_working/varyline2.png",dpi=150)

    >>> P.close('all')
    >>> plot_varyline(X,Y, colors = C.color_span(NUM, palette = 'plasma'), alphas = N.linspace(0.1,1,NUM))
    >>> P.savefig(repo_path()+"/doctest_working/varyline3.png",dpi=150)

    >>> P.close('all')
    >>> plot_varyline(X,Y, colors = C.color_span(NUM, palette = 'plasma'), alphas = N.linspace(0.1,1,NUM), linewidths = N.linspace(1,10,NUM), label = "Test")
    >>> _ = P.legend()
    >>> P.savefig(repo_path()+"/doctest_working/varyline4.png",dpi=150)

    """

    coltest = N.array(colors)

    # Expand out all line options on a per-point basis
    if coltest.ndim < 2: colors = [colors, ] * len(X)
    if is_not_iterable(alphas): alphas = [alphas, ] * len(X)
    if is_not_iterable(linewidths): linewidths = [linewidths, ] * len(X)

    # To do alphas, we must modify the RGBA alphas values manually
    colors = [(x[0], x[1], x[2], a) for x, a in zip(colors, alphas)]

    # arrange points as linecollection requires
    points = N.array([X, Y]).T.reshape(-1, 1, 2)
    segments = N.concatenate([points[:-1], points[1:]], axis=1)
    lc = matplotlib.collections.LineCollection(segments, linewidths=linewidths, colors=colors, label=label)

    # perform actual plotting
    if not samefig: P.figure()
    ax = P.gca()
    ax.add_collection(lc)
    ax.set_xlim(N.min(X), N.max(X))
    ax.set_ylim(N.min(Y), N.max(Y))


# -----------------
def plot_varyregion(x, y_lower=None, y_upper=None, y=None, widths=None, colors='k', alphas=0.1, label=""):
    """ Draws shaded region between y_lower and y_upper. Supports advanced changing parameters along curve.
    Args:
        x: x-values
        colors: a single RGBA color or an array len(x) of RGBA for gradual change
        alphas: a single alpha value or an array len(x) of alpha values
        mode1:
        y      , widths  : May specify the  y-values for the plot along with the widths (y units) (scalar or array) parameter. Leave None otherwise.
        mode2:
        y_lower, y_upper: May specify instead the y_lower and y_upper curves directly. Leave None otherwise

    >>> NUM = 100
    >>> X=N.linspace(0,1.0,NUM)
    >>> Y =N.sin(2*3.14159*X)
    >>> N.random.seed(0)
    >>> Y2=-Y+N.random.random(NUM)*0.05

    >>> P.close('all')
    >>> plot_varyregion(X, y = Y , widths = 0.1)
    >>> plot_varyregion(X, y = Y2, widths = 0.1)
    >>> P.savefig(repo_path()+"/doctest_working/plot_varyregion1.png",dpi=150)

    >>> P.close('all')
    >>> plot_varyregion(X, y = Y , widths = 0.1, colors = C.color_span(NUM, palette = 'plasma'))
    >>> plot_varyregion(X, y = Y2, widths = 0.1, colors = C.color_span(NUM, palette = 'plasma'))
    >>> P.savefig(repo_path()+"/doctest_working/plot_varyregion2.png",dpi=150)

    >>> P.close('all')
    >>> plot_varyregion(X,y = Y , widths = 0.1,  colors = C.color_span(NUM, palette = 'plasma'), alphas = N.linspace(0.1,1,NUM))
    >>> plot_varyregion(X,y = Y2, widths = 0.1,  colors = C.color_span(NUM, palette = 'plasma'), alphas = N.linspace(0.1,1,NUM))
    >>> P.savefig(repo_path()+"/doctest_working/plot_varyregion3.png",dpi=150)

    >>> P.close('all')
    >>> plot_varyregion(X, y = Y , widths = N.linspace(0,1,NUM), colors = C.color_span(NUM, palette = 'plasma'), alphas = N.linspace(0.1,1,NUM), label = "Test")
    >>> plot_varyregion(X, y = Y2, widths = N.linspace(0,1,NUM), colors = C.color_span(NUM, palette = 'plasma'), alphas = N.linspace(0.1,1,NUM), label = "Test2")
    >>> _ = P.legend()
    >>> P.savefig(repo_path()+"/doctest_working/plot_varyregion4.png",dpi=150)

    >>> P.close('all')
    >>> plot_varyregion(X, y_lower = Y  - 0.05, y_upper = Y  + 0.05)
    >>> plot_varyregion(X, y_lower = Y2 - 0.05, y_upper = Y2 + 0.05)
    >>> P.savefig(repo_path()+"/doctest_working/plot_varyregion5.png",dpi=150)


    """

    # Sanitize inputs
    if (y_lower is None and y_upper is not None) or (y_lower is not None and y_upper is None):
        raise Exception('Must provide both y_lower and y_upper, or y and widths')
    if (y_lower is None and widths is None) or (y_lower is None and y is None):
        raise Exception('Must provide both y_lower and y_upper, or y and widths')

    if len(x) < 2: return

    # compute y_lower and y_upper if not provided
    if y_lower is None:
        y_lower = N.array(y) - N.array(widths) / 2.0
        y_upper = N.array(y) + N.array(widths) / 2.0

    # Expand out options on a per-point basis
    coltest = N.array(colors)
    if coltest.ndim < 2: colors = [colors, ] * len(x)
    if is_not_iterable(alphas): alphas = [alphas, ] * len(x)

    OVERLAP = (x[1] - x[0]) * 0.00

    numpoints = len(x)

    for i in range(numpoints - 1):
        # Make sure only one segment is labelled, but choose one from ~the center instead of zero index. More
        # representative?
        _label = label if (i + 1) % int(numpoints / 2 + 1) == 0 else "_nolegend_"

        polygon([x[i], x[i + 1] + OVERLAP, x[i + 1] + OVERLAP, x[i]],
                [y_lower[i], y_lower[i + 1], y_upper[i + 1], y_upper[i]],
                color=colors[i], alpha=alphas[i], label=_label)

    P.axis('tight')


# determines the optimal placement of a piece of text
# into an existing graph. Just makes a histogram grid
# and seeks the point that overlaps the least data.
# axis is (x1,x2,y1,y2) graph limits.
def best_graph_text_placement(xdata, ydata, axis):
    (xmin, xmax, ymin, ymax) = axis

    # adjust mins and maxes to leave off 10% around borders
    dx0 = (xmax - xmin) / 10.0
    dy0 = (ymax - ymin) / 10.0
    xmin += dx0
    xmax -= dx0
    ymin += dy0
    ymax -= dy0

    # start algorithm
    dx = xmax - xmin
    dy = ymax - ymin

    # create a grid for histogram
    GRIDSIZE = 100
    EFFECT_RADIUS = 10
    grid = N.zeros((GRIDSIZE, GRIDSIZE))

    xis = N.floor((N.array(xdata) - xmin) / dx * GRIDSIZE)
    yis = N.floor((N.array(ydata) - ymin) / dy * GRIDSIZE)

    # make pseudo-potential graph where only the closest (most significant)
    # particle field dominates the grid's response
    for xi, yi in zip(xis, yis):
        # fill the grid with a 1/r potential
        # around this datapoint... unless something is already
        # in that cell that is larger (more powerful repulsion)
        # only worry about EFFECT_RADIUS cells away
        xi = int(xi)
        yi = int(yi)

        xleft = max(xi - EFFECT_RADIUS, 0)
        yleft = max(yi - EFFECT_RADIUS, 0)
        xright = min(xi + EFFECT_RADIUS, GRIDSIZE - 1)
        yright = min(yi + EFFECT_RADIUS, GRIDSIZE - 1)
        for xt in range(xleft, xright + 1):
            for yt in range(yleft, yright + 1):
                grid[xt, yt] = max(1.0 / (abs(xi - xt) + abs(yi - yt) + 1.0), grid[xt, yt])

    # Now just look for the location with the least intense field
    # This represents the grid least affected by a nearest point
    # Can use numpy to find min along one axis only :(
    minval = 9e99
    for yt in range(0, GRIDSIZE):
        xt = N.argmin(grid[:, yt])
        if grid[xt, yt] < minval:
            minval = grid[xt, yt]
            bestx = xt
            besty = yt

    # Transform back into data coordinates, and we're done!
    return (bestx / float(GRIDSIZE) * dx + xmin,
            besty / float(GRIDSIZE) * dy + ymin)


def plot_hex_map(lat, lon, data, func, filename, clabel=None, MIN=None, MAX=None):
    print("Plotting", filename)
    P.close('all')
    limits = [-180, 180, -90, 90]
    map = Basemap(projection='cyl',
                  resolution='l',
                  llcrnrlon=limits[0],
                  llcrnrlat=limits[2],
                  urcrnrlon=limits[1],
                  urcrnrlat=limits[3],
                  )
    map.drawcoastlines()
    map.drawmapboundary()
    x, y = map(lon, lat)
    im = map.hexbin(x, y, C=data, reduce_C_function=func, gridsize=72, cmap=P.get_cmap('gist_rainbow_r'), vmin=MIN,
                    vmax=MAX)
    #    formatter = matplotlib.ticker.ScalarFormatter( useOffset = False )
    #    cbar = map.colorbar(im, location='right', pad="5%", format = formatter)
    cbar = nicecolorbar(im, clabel=clabel, source=map, location='right', pad="5%")
    P.title(filename.replace(".png", ""))
    markplot()
    disable_axis_offset()
    visible_axes()
    P.savefig(filename, dpi=200)


def plot_globe_grid(griddata, filename, clabel=None, MIN=None, MAX=None):
    A = griddata.transpose()

    print("Plotting", filename)
    P.close('all')
    limits = [-180, 180, -90, 90]
    map = Basemap(projection='cyl',
                  resolution='l',
                  llcrnrlon=limits[0],
                  llcrnrlat=limits[2],
                  urcrnrlon=limits[1],
                  urcrnrlat=limits[3],
                  )
    map.drawcoastlines()
    map.drawmapboundary()

    ny = A.shape[0];
    nx = A.shape[1]

    im = map.imshow(A, interpolation='none', vmin=MIN, vmax=MAX, cmap=P.get_cmap('gist_rainbow_r'))
    #    formatter = matplotlib.ticker.ScalarFormatter( useOffset = False )
    #    cbar = map.colorbar(im,format = formatter, location='right',pad="5%")
    cbar = nicecolorbar(im, clabel=clabel, source=map, location='right', pad="5%")
    P.title(filename.replace("png", ""))
    markplot()
    disable_axis_offset()
    visible_axes()
    P.tight_layout()
    P.savefig(filename, dpi=200)


# This is an improved legend function that defaults to nice-looking output and can receive a "size" keyword just like
#  the P.txt function instead of a horrible fontproperties object. It does not receive labels or handles directly; it
#  assumes these have been specified already in appropriate plotting function calls using "label=" notation. Valid
# sizes are (size in points), xx-small, x-small, small, medium, large, x-large, xx-large Also adjusts words like
# "middle" to "center" for compatability with loc argument Using a framealpha will show the underlying shadow,
# so the code automatically turns shadow off with any transparency. numpoints specifies how many points to include.
# Default is two if you have lines shown, often not what you want. We set default to 1 markersize chanegs the size of
#  the shown markers in the legend for clarity, useful if the graph is plotting very small markers
def nicelegend(loc='best', borderpad=0.1, size='x-small', framealpha=1.0, fancybox=True, shadow=False, numpoints=1,
               handles=None, labels=None, markersize=None, facecolor=(1, 1, 1)):
    import matplotlib.font_manager as F

    if framealpha < 1.0:
        shadow = False

    #    legend.get_frame().set_facecolor('#00FFCC')

    loc2 = loc.replace("middle", "center").replace("top", "upper").replace("bottom", "lower")

    if (handles is not None) and (labels is not None):

        L = P.legend(handles, labels, loc=loc2,
                     borderpad=borderpad,
                     prop=F.FontProperties(size=size),
                     framealpha=framealpha,
                     fancybox=fancybox,
                     shadow=shadow,
                     numpoints=numpoints)

    elif handles is not None:

        L = P.legend(handles, loc=loc2,
                     borderpad=borderpad,
                     prop=F.FontProperties(size=size),
                     framealpha=framealpha,
                     fancybox=fancybox,
                     shadow=shadow,
                     numpoints=numpoints)

    elif labels is not None:

        L = P.legend(labels, loc=loc2,
                     borderpad=borderpad,
                     prop=F.FontProperties(size=size),
                     framealpha=framealpha,
                     fancybox=fancybox,
                     shadow=shadow,
                     numpoints=numpoints)
    else:

        L = P.legend(loc=loc2,
                     borderpad=borderpad,
                     prop=F.FontProperties(size=size),
                     framealpha=framealpha,
                     fancybox=fancybox,
                     shadow=shadow,
                     numpoints=numpoints)

    # Sometimes None is returned for the legend handle causing an exception
    # Don't understand why, but it might be because of empty plots with no data...
    # In any case, just skip setting these aux variables and return if None case exists
    if L is not None:
        L.get_frame().set_alpha(framealpha)
        L.get_frame().set_facecolor(facecolor)

        if markersize is not None:
            for lh in L.legendHandles:
                lh._legmarker.set_markersize(markersize)

    return L


# returns an RGB from a given palette (usually rainbow) based on the index ranging from 0 to 1
# can also provide a palette as a list of RGB tuples
# def rainbow_index(index, palette = None):
#     """ Returns an RGB color code from a given palette, based on an index ranging from 0 to 1.
#     Args:
#         index: value between 0 and 1, inclusive
#     Returns:
#         (r, g, b) each scaled to 0 - 1

#     Invalid cases
#     >>> rainbow_index( 1.5 )
#     Traceback (most recent call last):
#     Exception: index must be between zero and one, inclusive

#     >>> rainbow_index( -0.1 )
#     Traceback (most recent call last):
#     Exception: index must be between zero and one, inclusive

#     """

#     if index<0 or index>1: raise Exception("index must be between zero and one, inclusive")

#     if palette is None:        palette="rainbow"

#     if type(palette)==type("s"):

#        #This palette is optimized for uniformity of perception and colorblind friendliness
#         if palette == "sron_rainbow":
#            x = index
#            r = (0.472 - 0.567*x + 4.05*x*x) / (1.0 + 8.72*x - 19.17*x*x + 14.1*x**3)
#            g = 0.108932 - 1.22635*x + 27.284*x*x - 98.577*x**3 + 163.3*x**4 - 131.395*x**5 + 40.634*x**6
#            b = 1.0 / (7 + 3.54 * x - 68.5 *x*x +243*x**3 -297*x**4 +125*x**5)
#            if r < 0 or g < 0 or b < 0:
#                raise Exception("index "+str(x)+" resulted in rgb (%f, %f, %f)"%(r,g,b))
#            return (r,g,b)
#         if palette == "sron_sepia":
#            x = index
#            from scipy.special import erf
#            r =  1.0  - 0.392 * (1 + erf((x - 0.869) / 0.255))
#            g = 1.021 - 0.456 * (1 + erf((x - 0.527) / 0.376))
#            b = 1.0   - 0.493 * (1 + erf((x - 0.272) / 0.309))
#            if r < 0 or g < 0 or b < 0:
#                raise Exception("index "+str(x)+" resulted in rgb (%f, %f, %f)"%(r,g,b))
#            return (r,g,b)
#         if palette == "sron_bipolar":
#            x = index
#            r = 0.237 - 2.13*x + 26.92*x*x - 65.5*x**3 + 63.5 *x**4 -22.36*x**5
#            g = ((0.572+1.524*x-1.811*x*x)/(1-0.291*x+0.1574*x*x))**2
#            b = 1.0/(1.579-4.02*x+12.92*x*x-31.4*x**3+48.6*x**4-23.36*x**5)
#            if r < 0 or g < 0 or b < 0:
#                raise Exception("index "+str(x)+" resulted in rgb (%f, %f, %f)"%(r,g,b))
#            return (r,g,b)

#         if palette.lower()=="extended":
#             palette = ( (0,  0  ,0  ),  #k
#                         (1  ,0  ,0  ),  #r
#                         (1, .5  ,0  ),  #o
#                         (1  ,1  ,0  ),  #y
#                         (0  ,1  ,0  ),  #g
#                         (0  ,0  ,1  ),  #b
#                         (1  ,0  ,1  ),  #v
#                         (1  ,1  ,1  ) ) #w

#         elif palette.lower()=="rainbow":
#             palette = ( (1  ,0  ,0  ),  #r
#                         (1, .5  ,0  ),  #o
#                         (1  ,1  ,0  ),  #y
#                         (0  ,1  ,0  ),  #g
#                         (0  ,0  ,1  ),  #b
#                         (1  ,0  ,1  ) ) #v

#         elif palette.lower()=="rainbow_black_red":
#             palette = ( (0,  0  ,0  ),  #k
#                         (1  ,0  ,0  ),  #r
#                         (1, .5  ,0  ),  #o
#                         (1  ,1  ,0  ),  #y
#                         (0  ,1  ,0  ),  #g
#                         (0  ,0  ,1  ),  #b
#                         (1  ,0  ,1  ) ) #v

#         elif palette.lower()=="rainbow_black_redreverse":
#             palette = ( (1  ,0  ,0  ),  #r
#                         (1, .5  ,0  ),  #o
#                         (1  ,1  ,0  ),  #y
#                         (0  ,1  ,0  ),  #g
#                         (0  ,0  ,1  ),  #b
#                         (1  ,0  ,1  ),  #v
#                         (0,  0  ,0  ) ) #k

#         elif palette.lower()=="hot":
#             palette = ( (0  ,0  ,0),  #k
#                         (1  ,0  ,0),  #r
#                         (1  ,0.5,0),  #o
#                         (1  ,1  ,0),  #y
#                         (1  ,1  ,1) ) #w
#         elif palette.lower()=="cold":
#             palette = ( (0  ,0  ,0),  #k
#                         (0  ,0  ,1),  #b
#                         (1  ,0.5,1),  #c
#                         (1  ,0  ,1) ) #v
#         elif palette.lower()=="bipolar":
#             palette = (
#                (1  ,0  ,1),  #v
#                (1  ,0.5,1),  #c
#                (0  ,0  ,1),  #b
#                (0  ,0  ,0),  #k
#                (1  ,0  ,0),  #r
#                (1  ,0.5,0),  #o
#                (1  ,1  ,0)   #y
#                )
#         elif palette.lower()=="rainbowprint":
#            palette = ( (0,  0  ,0  ),  #k
#                        (1  ,0  ,0  ),  #r
#                        (0  ,1  ,0  ),  #g
#                        (0  ,0  ,1  ),  #b
#                        (1  ,0  ,1  ) ) #v
#         else:
#             raise Exception("color palette not found in rainbow_index: "+palette)

#     #first generate edge duplicates to frame palette and make edges easier
# #    palette=(palette[0],)+palette+(palette[-1],)

#     num_colors=len(palette)

#     #figure out which RGB pairs to use
#     leftf=    index*(num_colors-1)
#     left =int(leftf)
#     lw   =1-(leftf-left)
#     right=left+1
#     rw   =1-lw

#     if right>len(palette)-1:
#         right=len(palette)-1

#     r = palette[left][0] * lw + palette[right][0] * rw
#     g = palette[left][1] * lw + palette[right][1] * rw
#     b = palette[left][2] * lw + palette[right][2] * rw

# #    print "index %.1f - r,g,b i"%(index),
# #    print "(%.2f %.2f %.2f) %f"%(r,g,b,(r+g+b)/3.0)
# #    print "left weight right weight",left,lw,right,rw

#     return (r,g,b)

# This interpolates point data onto a specified grid using a variety of interpolation methods and optionally
# overplots the original scatter data onto the interpolated answer for verification numbins can be a single integer (
# number of bins for both x and y interpolation) or a tuple (num_x,num_y) vmax,vmin specify the color range settings,
#  default scale to data bipolar forces zero in the center of the colormap and resets default colormap to bwr palette
#  can be any valid string name of a colormap or a colormap object scatter_size may be set with a variable to use to
# define the scatterplot sizes or left to None where it will be constant noscatter will skip the scatterplot overlay
# epsilon helps the RBF kernel know how far to spread the data. None autofits. Smaller numbers mean larger smoothing
# ranges. Use to fix NaN's.
def scatterplot_with_interpolated_grid(x, y, z, filename, numbins=10,
                                       vmax=None, vmin=None, bipolar=False, palette=None,
                                       xlabel=None, ylabel=None, title=None, clabel=None,
                                       colorbar=True, scatter_size=None, noscatter=False,
                                       dpi=150, epsilon=None, function='gaussian'):
    import scipy.interpolate as SPI
    P.figure()

    xmin, ymin, zmin = map(N.min, (x, y, z))
    xmax, ymax, zmax = map(N.max, (x, y, z))

    if vmin is None: vmin = zmin
    if vmax is None: vmax = zmax

    # Force v extents to be bipolar
    if bipolar:
        ext = N.max((N.abs(vmin), N.abs(vmax)))
        vmin = -ext
        vmax = ext

    # How many bins?
    if is_iterable(numbins):
        numbin_x = numbins[0]
        numbin_y = numbins[1]
    else:
        numbin_x = numbins
        numbin_y = numbins

    # Colormap stuff
    if palette is None:
        palette = "coolwarm" if bipolar else "gist_rainbow_r"

    dx = (xmax - xmin)
    dy = (ymax - ymin)
    xi, yi = (N.linspace(xmin, xmax, numbin_x),
              N.linspace(ymin, ymax, numbin_y))
    xi, yi = N.meshgrid(xi, yi)

    # RBF kernel needs everything to be in scaled x,y space, so it doesn't interpret a spatial meaning that might not be there

    rbf = SPI.Rbf(x / dx, y / dy, z, epsilon=epsilon, function=function)
    zi = rbf(xi / dx, yi / dy)

    #    zi = SPI.griddata((x,y),z,(xi,yi),method=method)

    z_masked = N.ma.masked_invalid(zi)
    cmap = P.get_cmap(palette)
    cmap.set_bad(color='m', alpha=1)
    cmap.set_over(C.COLOR_DICT['pale yellow'])
    cmap.set_under(C.COLOR_DICT['pale cyan'])

    sc = P.pcolormesh(xi, yi, zi, vmin=vmin, vmax=vmax, cmap=cmap, shading='gouraud')

    if colorbar:
        cb = nicecolorbar(sc, clabel=clabel)
    P.grid(True, alpha=0.5)
    if xlabel is not None: P.xlabel(xlabel)
    if ylabel is not None: P.ylabel(ylabel)
    if title is not None: P.title(title)

    if not noscatter:
        P.hold(True)
        P.scatter(x, y, c=z,
                  s=scatter_size,
                  alpha=1.0, vmin=vmin, vmax=vmax, cmap=palette, edgecolor='w')

    P.axis([xmin, xmax, ymin, ymax])
    markplot()
    disable_axis_offset()
    visible_axes()
    P.savefig(filename, dpi=dpi)


# A simple scatterplot, not that different than a normal matplotlib graph, wrapped identically to my
# other plotting routines for convenience. If z_pop_list, colors by z. Otherwise, just by group. Colors are ignored if z_pop is specified.
# colors will be scaled over the entire support of z_pop together.
# colorbar only functions is z_pop_list is provided, otherwise ignored
# If colors are specified, ignores palette setting
# clabel labels the color bar
#        shade_size : Add a "shade" point beneath each point of a given vector
#        shade_color: If None will use population's own color. Otherwise this r,g,b or r,g,b,a value, or [(rgba),]
#        shade_alpha: Alpha to use in shade, usually kept very small. Default 0.1. May be [float,]*numpops

def scatterplot_multiseries(x_pop_list, y_pop_list, z_pop_list=None, x_err_pop_list=None, y_err_pop_list=None,
                            title="", xlabel="", ylabel="",
                            filename=None, palette="gist_rainbow_r", colors=None, labels=None,
                            markersize=5, markeralpha=1.0, markertype='.',
                            legend=True, legend_alpha=0.9, legend_loc='best', legend_font='xx-small',
                            dpi=150, samefig=False, legend_markersize=None, clabel=None, colorbar=True,
                            limits=None, linewidth=None, linestyle='-', linealpha=None,
                            shade_size=None, shade_color=None, shade_alpha=0.1,
                            ):
    """ Wrapper around a scatterplot to use my conventions and conveniences.

    >>> pop1_x = N.linspace(-180,180, 100)
    >>> pop1_y = N.linspace(-90 , 90, 100)
    >>> pop1_s = N.linspace(  1 , 100, 100)
    >>> pop2_x = [N.cos(i/360.0*2*N.pi)*180 for i in range(360)]
    >>> pop2_y = [N.sin(i/180.0*2*N.pi)*90  for i in range(360)]
    >>> pop2_s = N.linspace(  1 , 100, 360)
    >>> x, y = N.meshgrid(N.linspace(90,180,200), N.linspace(-15,15,200))
    >>> pop3_x = x.reshape(x.size)
    >>> pop3_y = y.reshape(y.size)
    >>> pop3_s = N.linspace(  1 , 100, x.size)

    >>> h = scatterplot_multiseries( [pop1_x, pop2_x, pop3_x] , [pop1_y, pop2_y, pop3_y], title = 'Basic test of scatterplot_multiseries', palette = "gist_rainbow_r", filename = repo_path()+"/doctest_working/scatterplot_multiseries_1.png", legend_markersize = 15, labels=("Linear", "Loopy", "Denseblock") )
    >>> h = scatterplot_multiseries( [pop1_x, pop2_x, pop3_x] , [pop1_y, pop2_y, pop3_y], title = 'Basic test of scatterplot_multiseries', palette = "gist_rainbow_r", filename = repo_path()+"/doctest_working/scatterplot_multiseries_2.png", legend_markersize = 15, labels=("Linear", "Loopy", "Denseblock"), shade_size = [pop1_s, pop2_s, pop3_s], shade_color = None, shade_alpha = 0.1 )
    >>> h = scatterplot_multiseries( [pop1_x, pop2_x, pop3_x] , [pop1_y, pop2_y, pop3_y], title = 'Basic test of scatterplot_multiseries', palette = "gist_rainbow_r", filename = repo_path()+"/doctest_working/scatterplot_multiseries_3.png", legend_markersize = 15, labels=("Linear", "Loopy", "Denseblock"), shade_size = [pop1_s, pop2_s, pop3_s], shade_color = [0.5,0.5,0.5], shade_alpha = 0.1 )

    """

    # Get number of populations for plotting
    numpops = len(x_pop_list)

    # Just plot by rainbow color if no colors specified, unique to each population (else use user-provided colors)
    if colors is None and z_pop_list is None: colors = C.map_values_to_rgba(N.linspace(0, 1, numpops), palette=palette)

    # label the populations, otherwise generate basic population labels
    if labels is None: labels = ["pop %d" % x for x in range(numpops)]

    # Expand out singleton preferences to full pop array
    if is_not_iterable(markersize): markersize = [markersize, ] * numpops
    if is_not_iterable(markeralpha): markeralpha = [markeralpha, ] * numpops
    if is_not_iterable(markertype): markertype = [markertype, ] * numpops
    if is_not_iterable(colors): colors = [colors, ] * numpops

    if shade_size is not None:
        if len(shade_size) != numpops: raise Exception('Number of shadepoint populations must match x/y data')
        if is_not_iterable(shade_alpha): shade_alpha = [shade_alpha, ] * numpops
        # default shade colors match original population
        if shade_color is None:
            shade_color = colors
        else:
            if is_not_iterable(shade_color): shade_color = [shade_color, ] * numpops

    # Handle x error bars
    if x_err_pop_list is not None:
        if len(x_err_pop_list) != numpops: raise Exception('Number of x_err populations must match x/y data')
        if is_not_iterable(x_err_pop_list): x_err_pop_list = N.zeros_like(x_pop_list) + x_err_pop_list

    # Handle y error bars
    if y_err_pop_list is not None:
        if len(y_err_pop_list) != numpops: raise Exception('Number of y_err populations must match x/y data')
        if is_not_iterable(y_err_pop_list): y_err_pop_list = N.zeros_like(x_pop_list) + y_err_pop_list

    # Handle the case of passed-in z values
    if z_pop_list is not None:
        z_max = N.max(z_pop_list)
        z_min = N.min(z_pop_list)
        if len(z_pop_list) != numpops: raise Exception("z_pop_list must match number of populations in x/y_pop_list")

    # Create our own figure unless user requests we don't
    if not samefig: samefig = P.figure()

    P.hold(True)

    # Plot the actual populations
    for pop in range(numpops):

        if z_pop_list is None:

            if shade_size is not None:
                P.scatter(x_pop_list[pop],
                          y_pop_list[pop],
                          c=[shade_color[pop], ] * len(x_pop_list[pop]),
                          s=shade_size[pop],
                          marker='o',
                          alpha=shade_alpha[pop],
                          edgecolor='none',
                          label="_nolabel_",
                          )

            sc = P.scatter(x_pop_list[pop],
                           y_pop_list[pop],
                           c=[colors[pop], ] * len(x_pop_list[pop]),
                           s=markersize[pop],
                           marker=markertype[pop],
                           alpha=markeralpha[pop],
                           edgecolor='none',
                           label="_nolabel_",
                           )

            if x_err_pop_list is not None or y_err_pop_list is not None:
                # Some gyrations necessary to separate out colors of interest

                P.errorbar(x_pop_list[pop],
                           y_pop_list[pop],
                           xerr=x_err_pop_list[pop] if x_err_pop_list is not None else None,
                           yerr=y_err_pop_list[pop] if y_err_pop_list is not None else None,
                           c='k',
                           alpha=markeralpha[pop],
                           label="_nolabel_",
                           )

            # make a bogus plot just to make legend work, unbelievably
            if legend:
                P.plot([N.nan, ], [N.nan, ],
                       color=colors[pop],
                       markersize=markersize[pop],
                       marker=markertype[pop],
                       alpha=markeralpha[pop],
                       label=labels[pop],
                       )

            # If user specified line arguments, also add line between points
            if linewidth is not None or linealpha is not None:
                P.hold(True)
                P.plot(x_pop_list[pop], y_pop_list[pop],
                       linestyle,
                       color=colors[pop],
                       lw=linewidth,
                       alpha=linealpha,
                       label="_nolabel_",
                       )

        else:

            if shade_size is not None:
                P.scatter(x_pop_list[pop], y_pop_list[pop],
                          c=z_pop_list[pop],
                          s=shade_size[pop],
                          marker='o',
                          alpha=shade_alpha[pop],
                          edgecolor='none',
                          vmin=z_min,
                          vmax=z_max,
                          cmap=palette,
                          label='_nolabel_',
                          )

            sc = P.scatter(x_pop_list[pop], y_pop_list[pop],
                           c=z_pop_list[pop],
                           s=markersize[pop],
                           marker=markertype[pop],
                           alpha=markeralpha[pop],
                           label=labels[pop],
                           vmin=z_min,
                           vmax=z_max,
                           cmap=palette,
                           edgecolor='none',
                           )

            # If user specified line arguments, also add line between points
            if linewidth is not None or linealpha is not None:
                P.hold(True)
                P.plot(x_pop_list[pop], y_pop_list[pop],
                       linestyle,
                       color=colors[pop],
                       lw=linewidth,
                       alpha=linealpha,
                       label="_nolabel_",
                       )

    if colorbar and (z_pop_list is not None):
        cb = nicecolorbar(sc, clabel=clabel)

    if legend: nicelegend(framealpha=legend_alpha, loc=legend_loc, markersize=legend_markersize, size=legend_font)

    if title is not None: P.title(title)
    if xlabel is not None: P.xlabel(xlabel)
    if ylabel is not None: P.ylabel(ylabel)

    markplot()
    disable_axis_offset()
    visible_axes()
    #    P.tight_layout()

    P.grid(True, alpha=0.5)

    if limits is not None: P.axis(limits)

    if filename is not None: P.savefig(filename, dpi=dpi)  # ,bbox_inches='tight')

    return samefig


# This interpolates point data onto a specified grid using a variety of interpolation methods
# and optionally overplots the original scatter data onto the interpolated answer for verification
# numbins can be a single integer (number of bins for both x and y interpolation) or a tuple (num_x,num_y)
# vmax,vmin specify the color range settings, default scale to data
# bipolar forces zero in the center of the colormap and resets default colormap to bwr
# palette can be any valid string name of a colormap or a colormap object
# scatter_size may be set with a variable to use to define the scatterplot sizes or left to None where it will be constant
# noscatter will skip the scatterplot overlay
# function defines the interpolation basis, multiquadric, inverse, gaussian, linear, cubic, quintic, thin_plate
# epsilon helps the RBF kernel know how far to spread the data. None autofits. Smaller numbers mean larger smoothing ranges. Use to fix NaN's.
# NOW ON A GLOBAL MAP with BASEMAP!
# x = lon, y = lat
def scatterplot_with_interpolated_grid_globalmap(x, y, z, filename, numbins=10,
                                                 vmax=None, vmin=None, bipolar=False, palette=None,
                                                 xlabel=None, ylabel=None, title=None, clabel=None,
                                                 colorbar=True, scatter_size=None, noscatter=False,
                                                 dpi=150, epsilon=None, projection='cyl', limits=[-180, 180, -90, 90],
                                                 wrap_coordinates=False, label_lon=False, label_lat=True,
                                                 function='gaussian', grid_dashes=DEFAULT_DASHES, grid_alpha=0.5):
    import scipy.interpolate as SPI
    P.figure()

    # If wrap_coordinates is on, assume all lon/lat values are in proper coordinate system and wrap them around the globe until they are plottable
    if wrap_coordinates:
        x = NUM.wrap_val_to_range(x, -180, 180)
    else:
        if (N.max(x) > 180):
            print("ERROR! Longitude specified that is beyond 180 limit. Are you in a different longitude coordinate?")
            sys.exit()

        if (N.min(x) < -180):
            print("ERROR! Longitude specified that is below -180 limit. Are you in a different longitude coordinate?")
            sys.exit()

    #    xmin, ymin, zmin = map(N.min,(x,y,z))
    #    xmax, ymax, zmax = map(N.max,(x,y,z))

    xmin, xmax, ymin, ymax = limits
    zmin, zmax = N.min(z), N.max(z)

    if vmin is None: vmin = zmin
    if vmax is None: vmax = zmax

    # Force v extents to be bipolar
    if bipolar:
        ext = N.max((N.abs(vmin), N.abs(vmax)))
        vmin = -ext
        vmax = ext

    # How many bins?
    if is_iterable(numbins):
        numbin_x = numbins[0]
        numbin_y = numbins[1]
    else:
        numbin_x = numbins
        numbin_y = numbins

    # Colormap stuff
    if palette is None:
        palette = "coolwarm" if bipolar else "gist_rainbow_r"

    # set up orthographic map projection with
    # perspective of satellite looking down at 50N, 100W.
    # use low resolution coastlines.
    # don't plot features that are smaller than 1000 square km.
    # Crude, Low, Intermediate, High, Full for resolutions
    mapi = Basemap(projection=projection,
                   resolution='l',
                   llcrnrlon=limits[0],
                   llcrnrlat=limits[2],
                   urcrnrlon=limits[1],
                   urcrnrlat=limits[3],
                   #                  ax = axis,
                   fix_aspect=False,
                   #                  lat_0 = -90, lon_0 = 0.0#, width = 360, height = 180
                   )  # ,area_thresh=1000.)
    # draw coastlines, country boundaries, fill continents.
    mapi.drawcoastlines()
    mapi.drawcountries()
    #    mapi.fillcontinents(color='grey')

    # draw the edge of the map projection region (the projection limb)
    mapi.drawmapboundary()
    meridians = ticks_globe_degrees(limits[0], limits[1])
    parallels = ticks_globe_degrees(limits[2], limits[3])
    labels = [1, 0, 1, 1] if label_lon else [0, 0, 0, 0]
    mapi.drawmeridians(meridians, labels=labels, color=(0.0, 0.0, 0.0), fontsize=5, alpha=grid_alpha,
                       dashes=grid_dashes)
    labels = [1, 0, 1, 1] if label_lat else [0, 0, 0, 0]
    mapi.drawparallels(parallels, labels=labels, color=(0.0, 0.0, 0.0), fontsize=5, alpha=grid_alpha,
                       dashes=grid_dashes)

    # RBF stuff
    dx = (xmax - xmin)
    dy = (ymax - ymin)
    xi, yi = (N.linspace(xmin, xmax, numbin_x),
              N.linspace(ymin, ymax, numbin_y))
    xi, yi = N.meshgrid(xi, yi)

    # RBF kernel needs everything to be in scaled x,y space, so it doesn't interpret a spatial meaning that might not be there

    rbf = SPI.Rbf(x / dx, y / dy, z, epsilon=epsilon, function=function)
    zi = rbf(xi / dx, yi / dy)

    #    print "RBF report",N.sum(N.isnan(zi)),"nans /",len(zi)

    z_masked = N.ma.masked_invalid(zi)
    cmap = P.get_cmap(palette)
    cmap.set_bad(color='m', alpha=1)
    cmap.set_over(C.COLOR_DICT['pale yellow'])
    cmap.set_under(C.COLOR_DICT['pale cyan'])

    sc = mapi.pcolormesh(xi, yi, zi, vmin=vmin, vmax=vmax, cmap=cmap, shading='gouraud')

    if colorbar:
        nicecolorbar(sc, clabel=clabel)
    #        formatter = matplotlib.ticker.ScalarFormatter( useOffset = False )
    #        cb = P.colorbar(format = formatter)#(sc)
    #        if clabel is not None: cb.set_label(clabel)
    #    mapi.grid(True,alpha=0.5)
    if xlabel is not None: P.xlabel(xlabel)
    if ylabel is not None: P.ylabel(ylabel)
    if title is not None: P.title(title)

    if not noscatter:
        P.hold(True)
        mapi.scatter(x, y, c=z,
                     s=scatter_size,
                     alpha=1.0, vmin=vmin, vmax=vmax, cmap=palette, edgecolor='w')

    P.axis([xmin, xmax, ymin, ymax])
    markplot()
    disable_axis_offset()
    visible_axes()
    P.tight_layout()
    P.savefig(filename, dpi=dpi, bbox_inches='tight')


# Create a deluxe bar chart that has both labels for populations and group names (typical bar chart labels)
# Only required argument are the values of the bar chart
# if group_names_pop_list is not provided, axis will not be labeled
# Colors specifies a series of colors for each population. If None, will use palette to auto-generate
# ylimits is a tuple specifying y-axis range, will only serve to clip portions of graph. None autoscales
# labels describe each population for the legend
# bar_separation sets the distance between groups of bars in units of bar width (1 = one bar width)
# yerr_pop_list will print y-error bars
# show_bar_values will print the number of each bar's value above the bar itself
# grid_alpha sets alpha of grid (0 or None means no grid)
# group_rotation applies to the x-axis labels and can be "horizontal","vertical", or an integer degrees
# group_textsize shrinks or increases the size of the text used to label the x axis
def barchart_multiseries(yval_pop_list, group_names_pop_list=None, title="", ylabel="", filename=None,
                         palette="rainbow_black_red", ylimits=None, colors=None, labels=None, legend=True,
                         legend_alpha=0.9, legend_loc='best', dpi=150, samefig=False, bar_separation=1.0,
                         yerr_pop_list=None, show_bar_values=False, grid_alpha=0.25,
                         group_rotation='horizontal', group_textsize='small'):
    # Get number of populations for plotting
    numpops = len(yval_pop_list)

    # discover the longest population (if not all the same size)
    maxnumy = N.max([len(ys) for ys in yval_pop_list])

    # Just plot by rainbow color if no colors specified, unique to each population (else use user-provided colors)
    if colors is None: colors = C.color_span(numpops, palette)
    if len(colors) != numpops: raise Exception("Color array length must match number of input populations")

    # label the populations, otherwise generate basic population labels
    if labels is None: labels = ["pop %d" % x for x in range(numpops)]
    if len(labels) != numpops: raise Exception("Labels array length must match number of input populations")

    if grid_alpha is None: grid_alpha = 0.0

    # label the groups, otherwise generate numeric labels
    if group_names_pop_list is None: group_names_pop_list = ["group %d" % x for x in range(numpops)]

    # if no yerr specified, ensure None for each population
    if yerr_pop_list is None: yerr_pop_list = [None, ] * numpops
    if len(yerr_pop_list) != numpops: raise Exception("y_err array length must match number of input populations")

    # Create our own figure unless user requests we don't
    if not samefig: fig = P.figure()

    P.hold(True)

    barwidth = 1.0 / float(numpops + bar_separation)

    # Plot the actual populations
    rects = []
    for pop in range(numpops):

        bar_centers = N.arange(len(yval_pop_list[pop])) + (pop + 0.5) * barwidth
        rects.append(
            P.bar(bar_centers, yval_pop_list[pop], barwidth, color=colors[pop], yerr=yerr_pop_list[pop], ecolor='k'))

        if show_bar_values:
            for rect in rects[-1]:
                height = rect.get_height()
                showheight = height
                if ylimits is not None:
                    height = N.min((height, ylimits[1]))
                if showheight < 2:
                    format = "%0.1f"
                else:
                    format = "%d"
                P.text(rect.get_x() + rect.get_width() / 2.0, 1.05 * height, format % showheight, size='xx-small',
                       ha='center', va='bottom')

    if legend and numpops > 1:
        nicelegend(handles=[rects[i][0] for i in range(numpops)], labels=labels, framealpha=legend_alpha,
                   loc=legend_loc)

    if title is not None: P.title(title)
    if ylabel is not None: P.ylabel(ylabel)

    P.grid(True, alpha=grid_alpha)

    if ylimits is not None: P.ylim(ylimits)

    markplot()
    disable_axis_offset()
    visible_axes()

    ax = P.gca()
    group_centers = N.arange(maxnumy) + numpops * barwidth / 2.0
    ax.set_xticks(group_centers)
    ax.set_xticklabels(group_names_pop_list, rotation=group_rotation, size=group_textsize, visible=True)

    if filename is not None: P.savefig(filename, dpi=dpi)

    return fig


def saveplot(obj, fname):
    """
    Save the current interactive plot.

    Call signature:

        saveplot(fname)

    Arguements:
        *obj*:
            A matplotlib object that you which to be saved.
        *fname*:
            A string containing the path to where pickled object will be saved.

    Output:
        A pickle matplotlb object that can be later reloaded.

    Usage:
    >>> import matplotlib.pyplot as plt
    >>> from mlib.plot import saveplot
    >>> x = [1,2,3,4,5]   #Generate sample data
    >>> y = [1,4,9,16,25]
    >>> plot = plt.plot(x, y)
    >>> saveplot(plot, 'sample_plot') # This will save current plot to 'sample_plot.pkl'
    """

    if not fname.endswith('.pkl'):
        fname += '.pkl'

    with open(fname, 'wb') as f:
        pickle.dump(obj, f)


# def loadplot(fname):
#     """
#     Load a previously saved interactive plot and display it.

#     Call signature:

#         loadplot(fname)

#     Arguements:
#         *fname*:
#             A string containing the path to where pickled object has been saved.

#     Output:
#         None.

#     Usage:
#     >>> from mlib.plot import loadplot
#     >>> loadplot('sample_plot.pkl') # File must already have been generated using 'saveplot'. '.pkl' extension must be included.

#     ^^^ The above code snipped will load and show the saved plot. ^^^


#     To have the command line tool, add the following to your ~/.bashrc

#         function showplot {
#             python /path/to/DOGO/loadplot.py $1
#         }

#     To display any plt from the commandline

#     """
#     new_plot = []
#     with open(fname, 'rb') as f:
#         new_plot = pickle.load(f)
#         matplotlib.pyplot.show()

# -----------------------
def plot_confusion_matrix(confusion_matrix, filename=None, labels=None, title='Confusion matrix', cmap='afmhot',
                          samefig=False):
    """Plots a traditional confusion matrix with 0-based integer class assignments.

    Args:
        confusion_matrix: An NxN array produced by mlib.classification.confusion_matrix (truth is first index, pred is second)
        filename        : Filename to store output
        labels          : Text labels to assign to classes 0, 1, 2...
        title           : Graph title
        cmap            : Any built-in matplotlib colormap
        samefig         : Whether to close all previous graphs or not, default False = close all previous

    Values:
        figure          : Returns a figure handle as per gcf()

    """

    if not samefig: P.close('all')

    num_labels = confusion_matrix.shape[0]
    tick_marks = N.arange(num_labels)

    if labels is None: labels = tick_marks

    P.imshow(confusion_matrix, interpolation='nearest', cmap=cmap)
    P.title(title)
    P.colorbar()
    P.xticks(tick_marks, labels, rotation=45)
    P.yticks(tick_marks, labels)
    P.tight_layout()
    P.ylabel('True label')
    P.xlabel('Predicted label')
    if filename is not None: P.savefig(filename, dpi=150)
    return P.gcf()


# -----------------------
def plot_distribution_matrix(distribution_matrix, bins, norm_each=False, legend=False,
                             filename=None, labels=None, title='Distribution Matrix'):
    """Plots a distribution matrix (integer truth classes mapped to raw floating output values from classifier).
    This is the generalization of a confusion matrix to examine a pre-threshold-assigned classifier/regressor system.

    Args:
        distribution_matrix: A 2D matrix (num_classes, num_hist_bins) for each class distribution
        bins               : The x-axis bin values defined for each distribution plot
        norm_each          : Normalize each distribution separately? Default: False
        legend             : Provide a legend including status of numclasses. Default False.
        filename           : Filename to store output
        labels             : Array of text labels to assign to classes (e.g. "bird", "cat", ...)
        title              : Graph title
        cmap               : Any built-in matplotlib colormap

    Values:
        figure             : Returns a figure handle as per gcf()


    >>> import mlib.shell as S
    >>> basedir = repo_path() + '/doctest_working/graphics/plot_distribution_matrix/'
    >>> S.rm   (basedir)
    >>> S.mkdir(basedir)

    >>> from mlib.classification import distribution_matrix
    >>> N.random.seed(0)
    >>> Y_truth = [0,1,2,3,3,3,]*100
    >>> Y_pred  = N.random.random(len(Y_truth)) + Y_truth - 0.5
    >>> bins, dist_matrix = distribution_matrix(Y_truth, Y_pred, bins = 100)

    Normalized by overall count (imbalanced class counts will make minority distributions smaller)
    >>> fig = plot_distribution_matrix(dist_matrix, bins, filename = basedir+'base_options.png')

    Normalized by peak individually to draw attention to distribution profile, not amplitude
    >>> fig = plot_distribution_matrix(dist_matrix, bins, filename = basedir+'base_options_norm_each.png', norm_each = True, legend = True)

    Label test
    >>> fig = plot_distribution_matrix(dist_matrix, bins, filename = basedir+'base_options_label.png', labels = ['a','b','c','d'])

    """

    num_labels = distribution_matrix.shape[0]
    tick_marks = N.arange(num_labels)

    if labels is None:
        labels = ["%d" % i for i in tick_marks]

    else:
        if len(labels) != num_labels: raise Exception("Number of labels must match number of classes in matrix")

    if len(bins) != distribution_matrix.shape[1]: raise Exception("Mismatching bins and distribution_matrix")

    # squeeze returns only a 1D array of axis objects instead of a degenerate 2D matrix
    fig, subaxes = P.subplots(num_labels, sharex=True, sharey=True, squeeze=True)

    # Normalize each distribution by its peak value to ignore class imbalance amplitude issues
    if norm_each:
        temp = N.zeros_like(distribution_matrix, dtype=float)
        for iclass in range(num_labels):
            temp[iclass, :] = distribution_matrix[iclass, :] / float(N.max(distribution_matrix[iclass, :]))
        distribution_matrix = temp

    for iplot, axis in enumerate(subaxes):
        axis.plot(bins,
                  distribution_matrix[iplot, :],
                  label="%s: %d" % (labels[iplot], N.sum(distribution_matrix[iplot, :])),
                  linewidth=3,
                  alpha=0.75)
        axis.set_ylabel(labels[iplot], rotation=0)
        visible_axes(['bottom', ], axis=axis)

    subaxes[0].set_title(title)
    P.tight_layout()
    subaxes[-1].set_xlabel('Predicted')
    subaxes[-1].set_xticks(tick_marks)
    subaxes[-1].set_xticklabels(labels)
    if filename is not None: P.savefig(filename, dpi=150)
    return fig


# -----------------------
def select_region():
    """ This should be run after a plot has been made. It permits a user to select a region from the graph and have it
    returns as a series of vertices.

    NOTE: This is not compatible with 'Agg' backend above, must disable

    Commands:
            SHIFT + LMB: Select a vertex
            SHIFT + RMB: Auto-close shape and exit

    Returns:
            vertices: a list of twoples (x,y) of the specified vertices
    """

    #    matplotlib.use('TkAgg') #Try to enable interactive plotting

    class ROI:

        def __init__(self):
            self.previous_point = []
            self.start_point = []
            self.line = None
            self.vertices = []

            self.fig = P.gcf()
            self.fig.canvas.draw()

        def motion_notify_callback(self, event):
            if event.inaxes:
                axes = event.inaxes
                x, y = event.xdata, event.ydata

                # we are currently moving an active line around before selecting, keep that shift button held!
                if event.button == None and self.line != None and event.key == 'shift':
                    self.line.set_data([self.previous_point[0], x],
                                       [self.previous_point[1], y])
                    self.fig.canvas.draw()

        def button_press_callback(self, event):
            if event.inaxes:
                x, y = event.xdata, event.ydata
                axes = event.inaxes
                # Press shift and left mouse buttom to define points
                if (event.key == 'shift') and (event.button == 1):
                    self.vertices.append((x, y))
                    if self.line == None:  # if there is no line, create a line
                        self.line = P.Line2D([x, x],
                                             [y, y],
                                             marker='s')
                        self.start_point = [x, y]
                        self.previous_point = self.start_point
                        axes.add_line(self.line)
                        self.fig.canvas.draw()
                    # otherwise add a segment
                    else:
                        self.line = P.Line2D([self.previous_point[0], x],
                                             [self.previous_point[1], y],
                                             marker='o')
                        self.previous_point = [x, y]
                        event.inaxes.add_line(self.line)
                        self.fig.canvas.draw()

                # Press shift and right mouse buttom to auto-close region
                if (event.button == 3) and (event.key == 'shift') and (self.line != None):
                    self.vertices.append(self.vertices[0])
                    P.close()

    cursor = ROI()
    P.gcf().canvas.mpl_connect('motion_notify_event', cursor.motion_notify_callback)
    P.gcf().canvas.mpl_connect('button_press_event', cursor.button_press_callback)
    P.show()

    return cursor.vertices


# -----------------------
def mask_contained_points(x, y, vertices):
    """ Returns a mask specifying which of the x and y points are within the specified vertices.

    Arguments:
             x: list or ndArray of x values
             y: list or ndArray of y values
      vertices: list of twoples (x,y) of vertices specifying a closed region

    >>> x = range( 0, 10)
    >>> y = range(10, 20)

    Define vertices as a square encompassing half the data
    >>> vertices = [(0,0),(0,15),(5,15),(5,0),(0,0)]

    >>> mask = mask_contained_points(x, y, vertices)

    There are only 4 matched points, because x=0 is on vertices boundary and thus not inside, as is y=15
    >>> N.sum(mask)
    4

    >>> mask
    array([False,  True,  True,  True,  True, False, False, False, False, False], dtype=bool)

    """

    from matplotlib.path import Path as PATH
    return PATH(vertices).contains_points(zip(x, y))


# -----------------------
def text_box_multicolor(x, y, list_of_text, list_of_colors, fontsize=5,
                        boxstyle='round', boxfacecolor='none', boxedgecolor='none', boxlinewidth=1,
                        boxalpha=1.0, align_stack='vertical'):
    """ Creates a text box with strings that support multicolor.

    Args:
        x: x location (0-1) to be placed
        y: y location (0-1) to be placed
        list_of_text  : a list of text strings that are to be individually colored
        list_of_colors: rgb or string specifications of colors for each text string
        fontsize      : the fontsize to use for all text
        boxstyle      : None (do not have box), 'round', 'square'
        boxfacecolor  : Background box coloration ('none', rgb, colorstring)
        boxedgecolor  : Same for box edge
        boxlinewidth  : thicknness of edge line
        boxalpha      : Alpha of background box, default 1
        align_stack   : 'vertical' will stack the strings vertically, while 'horizontal' will append horizontally

    """

    from matplotlib.offsetbox import HPacker, VPacker, TextArea, AnnotationBbox

    ax = P.gca()
    textareas = [TextArea(text,
                          textprops=dict(color=textcol,
                                         size=fontsize)) for text, textcol in zip(list_of_text, list_of_colors)]

    if "horiz" in align_stack.lower():
        packer = HPacker
    else:
        packer = VPacker

    txt = packer(children=textareas,
                 align="baseline",
                 pad=0, sep=0)

    propdict = {'fc': boxfacecolor,
                'ec': boxedgecolor,
                'boxstyle': boxstyle,
                'alpha': boxalpha
                }

    bbox = AnnotationBbox(txt, xy=(x, y),
                          xycoords='axes fraction',  # 'data' in data units,
                          frameon=boxstyle is not None,
                          box_alignment=(0.5, 0.5),  # alignment center, center
                          bboxprops=propdict,
                          )

    ax.add_artist(bbox)


# -----------------------
def plot_relational_matrix(labels=None, value_matrix=None, label_label_dict_values=None,
                           sort_block=False, sort_alpha=False,
                           filename=None, title='Relation Matrix', cmap='afmhot', samefig=False,
                           colorbar=False, clim=None, fontsize=5, dpi=150):
    """ Plots precomputed value_matrix between every label and every other label as a matrix (such as correlations).
        Must either pass labels and value_matrix, or a dictionary of dictionaries specifying matrix values by label name.

    Args:
        labels:         iterable of strings that label each of the items to relate (optional)
        value_matrix:   numarray( num_labels x num_labels ) with value_matrix relating each pair of labels (optional)
        label_label_dict_values: dictionary of dictionaries of values such that vals[label1][label2] yields value (optional)

        sort_block: sort the labels to maximize a block-diagonal representation
        sort_alpha: sort the labels by alphanumeric

        clim      : tuple specifying the max/min values to scale the colorbar to
        fontsize  : fontsize for the labels, may need to be very small

    Returns:
        labels:         label array in the order as shown on plot. Will be identical to labels if block_diagonal is False.

    This is an unoptimized correlation matrix. Sorted version should isolate that feature 2 is only weekly correlated and isolate it
    >>> values = N.array([ [ 3.0, 1, 1, 2], [1, 3, 1, 1], [ 1, 1, 3, 2], [2, 1, 2, 3] ]) / 3.0
    >>> labels = ["Dog","Cat","Eel","Sun"]

    The same data in dict form
    >>> valdict = { 'dog': {'dog': 3, 'cat': 1, 'eel': 1, 'sun': 2},
    ...             'cat': {'dog': 1, 'cat': 3, 'eel': 1, 'sun': 1},
    ...             'eel': {'dog': 1, 'cat': 1, 'eel': 3, 'sun': 2},
    ...             'sun': {'dog': 2, 'cat': 1, 'eel': 2, 'sun': 3} }

    >>> import mlib.shell as S
    >>> basedir = repo_path() + '/doctest_working/graphics/relational_matrix/'
    >>> S.rm   (basedir)
    >>> S.mkdir(basedir)

    >>> plot_relational_matrix (labels, values, filename = basedir + 'relational_matrix.png', clim=(0,1))
    ['Dog', 'Cat', 'Eel', 'Sun']

    >>> plot_relational_matrix (label_label_dict_values = valdict, filename = basedir + 'relational_matrix_dict.png', clim=(0,3))
    ['eel', 'sun', 'dog', 'cat']

    >>> values = N.array([[ 1,0,1,0],[0,2,0,2],[1,0,1,0],[0,2,0,2.0]])
    >>> labels = ['a','c','d','b']

    >>> plot_relational_matrix (labels, values, filename = basedir + 'relational_matrix_alpha.png', clim=(0,2), sort_alpha = True)
    ['a', 'b', 'c', 'd']

    >>> plot_relational_matrix (labels, values, filename = basedir + 'relational_matrix_block.png', clim=(0,2), sort_block = True)
    ['a', 'd', 'c', 'b']

    """

    # Sanity check options
    if sort_block and sort_alpha:
        raise Exception('Cannot sort by both block and alphanumeric')

    if (value_matrix is not None and labels is None) or (value_matrix is None and labels is not None):
        raise Exception('Must specify both value_matrix and labels together')

    if (label_label_dict_values is not None and (labels is not None or value_matrix is not None)):
        raise Exception('If dictionary value input specified, labels and value_matrix must not be specified')

    # If dict_values is specified, transform the data into the labels, matrix representation
    if label_label_dict_values is not None:
        labels = label_label_dict_values.keys()
        value_matrix = N.zeros((len(labels), len(labels)), dtype=type(label_label_dict_values[labels[0]][labels[0]]))
        for i, Li in enumerate(labels):
            for j, Lj in enumerate(labels):
                value_matrix[i, j] = label_label_dict_values[Li][Lj]

    # Sort by alphanumeric if requested
    if sort_alpha:
        sortorder = N.argsort(labels)
        newlabels = N.array(labels)[sortorder]
        vmatrix = value_matrix[:, sortorder][sortorder, :]

    elif sort_block:
        import sklearn as SKL
        import scipy.cluster.hierarchy as SCH

        value_matrix[N.isnan(value_matrix)] = 0.0
        value_matrix[~N.isfinite(value_matrix)] = 0.0

        pwd = SKL.metrics.pairwise.pairwise_distances(value_matrix, metric="minkowski", p=1)

        H = SCH.linkage(pwd, method='centroid')
        d1 = SCH.dendrogram(H, orientation='right', no_plot=True)
        d2 = SCH.dendrogram(H, no_plot=True)
        idx1 = d1['leaves']
        idx2 = d2['leaves']
        vmatrix = value_matrix[idx1, :][:, idx2]
        newlabels = N.array(labels)[idx1]

    else:
        newlabels = labels
        vmatrix = value_matrix

    # Begin plotting based on value_matrix
    if not samefig: P.close('all')

    num_labels = len(labels)
    tick_marks = N.arange(num_labels)
    vmin, vmax = clim if clim is not None else (N.min(value_matrix),
                                                N.max(value_matrix))

    handle = P.imshow(vmatrix, interpolation='nearest', cmap=C.custom_colormap(cmap), vmin=vmin, vmax=vmax)
    if colorbar: nicecolorbar(handle, orientation="vertical", ticks=significant_ticks(vmin, vmax, 10))
    P.xticks(tick_marks, newlabels, fontsize=fontsize, rotation=90)
    P.yticks(tick_marks, newlabels, fontsize=fontsize)
    P.title(title)
    P.tight_layout()
    visible_axes()
    if filename is not None: P.savefig(filename, dpi=dpi)
    return list(newlabels)


# --------------------------------
# --------------------------------
# --------------------------------

if __name__ == "__main__":
    init()
    import doctest
    from mlib._doctest import repo_path

    #    doctest.run_docstring_examples(plot_relational_matrix, globals())
    N.set_printoptions(legacy='1.13')
    doctest.testmod()
