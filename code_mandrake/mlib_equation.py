##-----------------------------------------------------------------
##-----------------------------------------------------------------
##
## Mandrake lib (mlib) for displaying and working with equation representation
##
##-----------------------------------------------------------------
##-----------------------------------------------------------------

import numpy as N

#--------------------------
def text_equation_simple_linear_fit( slope, intercept, style = 'intercept' , format = "%0.2g"):
    """ Returns a string representing a simple linear fit in the form 
    Y=mX+b or Y=m(X-Xmean)+b.

    Args:
        slope    : float, int, or str representing the slope of Y wrt X
        intercept: float, int, or str the Y intercept
        style    : "intercept" (default) produces Y = m X + b
                   "mean"                produces Y = m (X - Xmean)
        format   : The format string to use for slopes, intercepts, and means (if requested)
                   Defaults to "%0.2g"

    >>> text_equation_simple_linear_fit( 1.5, 0.2, style = 'intercept' )
    'Y = 1.5*X + 0.2'

    >>> text_equation_simple_linear_fit( 1.5, 0.2, style = 'mean'      )
    'Y = 1.5*(X - 0.13)'

    >>> text_equation_simple_linear_fit( 1.5, 0.2, format = "%0.3g" )
    'Y = 1.5*X + 0.2'

    >>> text_equation_simple_linear_fit( 1.5, 0.2, format = "%0.3f" )
    'Y = 1.500*X + 0.200'

    >>> text_equation_simple_linear_fit( 1.5, 0.2, format = "%d"    )
    'Y = 1*X + 0'

    """

    slope     = float(slope    )
    intercept = float(intercept)

    if "interc" in style.lower():
        return ("Y = "+format+"*X + "+format) % ( slope, intercept )

    if "mean" in style.lower():
        return ("Y = "+format+"*(X - "+format+")") % ( slope, intercept / slope )

    raise Exception("Unknown style "+style)


#--------------------------
def text_equation_MVLR (target_name, feature_names, slopes, intercept, slope_errors = None, intercept_error = None, meaned = False, units = "unitless", data_stats = None, short_names = False, format = "%0.2g", unicode = True):
    """ Constructs a text represetation for an multivariate linear fit in a variety of manners.
    If using units variable, assumes inputs were in sensitivty units (fully unitless) and maps back up to other units using data_stats
    and assuming standardization was used to normalize.

    Args:
        target_name     : name of target variable
        feature_names   : list of names of features used, should be iterable
        slopes          : list of slopes for each feature, same order as feature_names
        slope_errors    : the standard errors on the slopes, may be None if not available (default)
        intercept       : the target intercept
        intercept_error : the target intercept standard error, may be None if not available (default)
        meaned          : Use Y = m1(X1-X1mean) + m2(X2-X2mean) ... form, default False, only applies to full/unitful representation
        units           : "sensitivity"/"unitless"/"normalized" displays the equation as-is from the input values (default)
                           This mode is useful because the slopes can be interpretted as unitless "sensitivty" measures of feature importance
                          "target" adjusts units of slopes/intercepts to match the target values using data_stats[:]['target'].
                           This mode is useful to express the slopes meaninfully in terms of unitful target magnitude
                          "full"/"unitful"/"unnormalized" adjusts units of slopes/intercepts to the totally unnormalized case, using data_stats
                           This mode is useful as the actual equation evaluated "in the field" on unnormalized data
        data_stats      : A dict of dict of the form data_stats["mean" / "std"][feature_name]. Feature names must perfectly
                          correspond to feature_names values. Provides means and std's of the original data that, after normalization,
                          produced the slopes and intercepts passed.
        short_names     : Keep only the last portion of feature names after splitting by "/", default False
        format          : Format string to use on all numbers, default = %0.2g
        unicode         : Use plusminus character in unicode rather than +- combination, default True
   Returns:
        equation_text   : Unicode (for plusminus symbol) expression


    >>> import mlib_datadict as DD
    >>> data = DD.DataDict({'eaten/numcandy': [15, 31, 13, 47, 30], 'kid/height': [3.5, 4.7, 2, 2.5, 5], 'kid/weight': [40, 60, 30, 55, 90]})
    >>> data_stats = data.stats()
    >>> data.normalize()
    >>> import mlib_numeric as NUM
    
    >>> data.as_array(['height','weight'])
    array([[-0.0303851 , -0.65465367],
           [ 0.88116798,  0.21821789],
           [-1.16982646, -1.09108945],
           [-0.79001267,  0.        ],
           [ 1.10905625,  1.52752523]])

    >>> slopes, slope_e, interc, interc_e, results = NUM.linear_regression(data['numcandy'], data.as_array(['height','weight']))

    Full name, unitless
    >>> text_equation_MVLR ("eaten/numcandy", ['kid/height','kid/weight'], slopes, interc)
    'eaten/numcandy = (-0.74)kid/height + (1.1)kid/weight + 2.2e-16'

    Short name, unitless
    >>> text_equation_MVLR ("eaten/numcandy", ['kid/height','kid/weight'], slopes, interc, short_names = True)
    'numcandy = (-0.74)height + (1.1)weight + 2.2e-16'

    Include Errors
    >>> text_equation_MVLR ("eaten/numcandy", ['kid/height','kid/weight'], slopes, interc, slope_errors = slope_e, intercept_error = interc_e, short_names = True)
    u'numcandy = (-0.74 \\xb1 0.85)height + (1.1 \\xb1 0.85)weight + (2.2e-16 \\xb1 0.46)'

    Include errors, but without unicode
    >>> text_equation_MVLR ("eaten/numcandy", ['kid/height','kid/weight'], slopes, interc, slope_errors = slope_e, intercept_error = interc_e, short_names = True, unicode = False)
    'numcandy = (-0.74 +- 0.85)height + (1.1 +- 0.85)weight + (2.2e-16 +- 0.46)'

    Target Units, without errors, forgetting data_stats
    >>> text_equation_MVLR ("eaten/numcandy", ['kid/height','kid/weight'], slopes, interc, short_names = True, units = 'target')
    Traceback (most recent call last):
    Exception: Can't use target units without providing data_stats object

    Target Units, without errors
    >>> text_equation_MVLR ("eaten/numcandy", ['kid/height','kid/weight'], slopes, interc, units = 'target', data_stats = data_stats, format = "%0.2f", short_names = True)
    'numcandy = (-10.19)height + (15.25)weight + 27.20'

    Full Units, without errors
    >>> text_equation_MVLR ("eaten/numcandy", ['kid/height','kid/weight'], slopes, interc, units = 'full'  , data_stats = data_stats, format = "%0.2f", short_names = True)
    'numcandy = (-7.74)height + (0.67)weight + 17.98'

    Target Units, with errors
    >>> text_equation_MVLR ("eaten/numcandy", ['kid/height','kid/weight'], slopes, interc, units = 'target', data_stats = data_stats, format = "%0.2f", slope_errors = slope_e, intercept_error = interc_e, unicode = False, short_names = True)
    'numcandy = (-10.19 +- 11.79)height + (15.25 +- 11.79)weight + (27.20 +- 6.39)'

    Full Units, with errors
    >>> text_equation_MVLR ("eaten/numcandy", ['kid/height','kid/weight'], slopes, interc, units = 'full', data_stats = data_stats, format = "%0.2f", slope_errors = slope_e, intercept_error = interc_e, unicode = False, short_names = True)
    'numcandy = (-7.74 +- 8.96)height + (0.67 +- 0.51)weight + (17.98 +- 42.98)'

    Full Units, without errors, meaned
    >>> text_equation_MVLR ("eaten/numcandy", ['kid/height','kid/weight'], slopes, interc, units = 'full'  , data_stats = data_stats, format = "%0.4g", meaned = True, short_names = True)
    'numcandy = (-7.739)(height - 3.54) + (0.6657)(weight - 55) + 27.2'

    Full Units, with errors, meaned
    >>> text_equation_MVLR ("eaten/numcandy", ['kid/height','kid/weight'], slopes, interc, units = 'full'  , data_stats = data_stats, format = "%0.4g", meaned = True, slope_errors = slope_e, intercept_error = interc_e, unicode = False, short_names = True)
    'numcandy = (-7.739 +- 8.958)(height - 3.54) + (0.6657 +- 0.5147)(weight - 55) + (27.2 +- 42.98)'


    """

    def smartsign(val, fmt):
        if val < 0:
            return " - "+fmt%(-val)
        else:
            return " + "+fmt%val

    ds  = data_stats #quick pointer rename for brevity
    num = len(slopes)

    plusminus = u"\u00B1" if unicode else "+-"

    #Handle unit conversion on the slopes and intercepts + errors
    
    units = units.lower()
    if units in ("sensitivity","unitless","normalized"):
        #We assume that the input equation is already in unitless form.
        #If the user just wishe to display the equation slopes directly, this is also the appropriate setting, hence default
        if meaned: raise Exception("Can't use meaned form with unitless mode, feature means are already removed")
    elif units in ("target",):
        #Convert slopes and intercept into original target units, but leave features normalized
        if meaned: raise Exception("Can't use meaned form with target units, feature means are already removed")
        if ds is None: raise Exception("Can't use target units without providing data_stats object")
        intercept = intercept       * ds['std'][target_name] + ds['mean'][target_name]
        slopes    = N.array(slopes) * ds['std'][target_name]
        if intercept_error is not None: intercept_error = intercept_error       * ds['std'][target_name]
        if slope_errors    is not None: slope_errors    = N.array(slope_errors) * ds['std'][target_name] 
    elif units in ("full","unitful","unnormalized"):
        #Convert slopes and intercept into fully unitful values, hard to interpret, but necessary for new data
        if ds is None: raise Exception("Can't use full units without providing data_stats object")

        #intercept error is modified by both errors in slopes and errors in Y, subtracting covariance terms
        #This is insane to try and manually compute, so just do a brand new line fit using fully unitfied features
        #Maybe next time. UNDONE. *&*&*&*

        #Just ratio of target STD to feature STD adjustment
        slopes = [ slopes[i] * ds['std'][target_name] / ds['std'][feature_names[i]] for i in range(num)]

        if slope_errors is not None:
            slope_errors = [ slope_errors[i] * ds['std'][target_name] / ds['std'][feature_names[i]] for i in range(num)]

        #Gets a bit complicated, because the feature means subtract from the overall bias 
        int_feat_contrib = N.sum([ ds['mean'][feature_names[i]] * slopes[i] for i in range(num) ])
        intercept = ( 
            ds['mean'][target_name] + 
            ds['std' ][target_name] * intercept - 
            int_feat_contrib
            )

        #THIS IS A GROSS OVER-ESTIMATE OF THE INTERCEPT STDERR, true answer can be 1/3 of this but appears to
        #be too complex to generate in this simple manner
        if intercept_error is not None: 
            int_feat_err_contrib = N.sum([ (ds['mean'][feature_names[i]] * slope_errors[i])**2 for i in range(num) ])
            intercept_error = N.sqrt( (intercept_error * ds['std'][target_name])**2 + int_feat_err_contrib )

    #Shorten all the names if requested
    orig_feats = feature_names
    if short_names:
        target_name   = target_name.split('/')[-1]
        feature_names = [ x.split('/')[-1] for x in feature_names ]


    #Handle the two alternate modes of expression (meaned or intercept form)
    if not meaned:
        #Simpler intercept form: Y = m1*X1 + m2*X2 + ... + b, valid for all modes
        eq = target_name + " = "

        if slope_errors is not None:
            eq += " + ".join( [( "("+format+" "+plusminus+" "+format+")%s")%(slopes[i], slope_errors[i], feature_names[i]) for i in range(num)] )
            eq += " + (" + format%intercept + " " + plusminus + " " + format%intercept_error + ")"
        else:
            eq += " + ".join( [( "("+format                         +")%s")%(slopes[i],                  feature_names[i]) for i in range(num)] )
            eq += smartsign(intercept,format)
    else:
        #More complex meaned form: Y = m1(X1-X1mean) + m2(X2-X2mean) + .... + b, valid only for full unit case
        #Must adjust the intercept again and pull the feature means back out
        intercept += int_feat_contrib

        eq = target_name + " = "

        if slope_errors is not None:
            eq += " + ".join( [( "("+format + " " + plusminus + " " + format+")(%s - "+format+")")%(slopes[i], slope_errors[i], feature_names[i], ds['mean'][orig_feats[i]]) for i in range(num)] )
            eq += " + (" + format%intercept + " " + plusminus + " " + format%intercept_error + ")"
        else:
            eq += " + ".join( [( "("+format                 +")(%s - "+format+")")%(slopes[i],                  feature_names[i], ds['mean'][orig_feats[i]]) for i in range(num)] )
            eq += smartsign(intercept,format)

                              
    return eq


#--------------------------
#--------------------------
#--------------------------

if __name__ == "__main__":
    import doctest
    doctest.testmod()

