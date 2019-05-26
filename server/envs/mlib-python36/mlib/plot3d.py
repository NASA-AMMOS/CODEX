# -----------------------------------------------------------------
# -----------------------------------------------------------------
#
#  Mandrake lib (mlib) for awesome 3D plotting!
#
# -----------------------------------------------------------------
# -----------------------------------------------------------------

from mpl_toolkits.mplot3d import Axes3D
from matplotlib import cm
from matplotlib.ticker import LinearLocator, FormatStrFormatter
import pylab as P
import numpy as N


def plot_surface(x, y, z, xlabel="", ylabel="", zlabel="", filename=""):
    fig = P.figure()
    ax = fig.gca(projection='3d')

    X, Y = N.meshgrid(x, y)

    surf = ax.plot_surface(X, Y, z, rstride=1, cstride=1, cmap=cm.rainbow,
                           linewidth=0, antialiased=False)
    #    ax.set_zlim(-1.01, 1.01)

    ax.zaxis.set_major_locator(LinearLocator(10))
    ax.zaxis.set_major_formatter(FormatStrFormatter('%.01f'))

    fig.colorbar(surf, shrink=0.5, aspect=5)

    ax.set_xlabel(xlabel)
    ax.set_ylabel(ylabel)
    ax.set_zlabel(zlabel)

    P.savefig(filename, dpi=150)
