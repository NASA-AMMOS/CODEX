import mlib.plot as MP; MP.init()
import pylab as P
import seaborn as SB
import mlib.datadict as DD

# plots violin plots of distributions beside each other, labeled by user
# data_pop_list is a list of NdArrays
# limits are expressed as usual for y values, x-axis values are 0 to N-1 for N populations
# labels must have length = number of populations in data
# orientation will put violinplots up-down for "vertical" or left-right for "horizontal"
def plot_violin_groups(data_pop_list, labels=None, title="", xlabel="", ylabel="", filename=None,
                       dpi=150, orientation='vertical', samefig=False, xlim=None, ylim=None, palette=None):
    # Create our own figure unless user requests we don't
    if not samefig: fig = P.figure()

    if labels is None: labels = ["pop %d" % i for i in range(len(data_pop_list))]

    # Must assemble the data into a single 1D vector of all populations with repeating labels
    data = DD.DataDict()
    for array, label in zip(data_pop_list, labels):
        data.append('label', [label, ] * len(array))
        data.append('value', array)

    if "vert" in orientation.lower():
        x = data['label']
        y = data['value']
    else:
        x = data['value']
        y = data['label']

    SB.violinplot(x=x, y=y, palette=palette)

    if title is not None: P.title(title)
    if xlabel is not None: P.xlabel(xlabel)
    if ylabel is not None: P.ylabel(ylabel)
    if xlim is not None: P.xlim(xlim)
    if ylim is not None: P.ylim(ylim)

    mlib.plot.markplot()

    if "vert" in orientation.lower():
        mlib.plot.disable_axis_offset(x_axis=False)
    else:
        mlib.plot.disable_axis_offset(y_axis=False)

    if filename is not None: P.savefig(filename, dpi=dpi)

    return fig
