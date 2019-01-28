##-----------------------------------------------------------------
##-----------------------------------------------------------------
##
## Mandrake lib (mlib) for tracing warnings back to their source
##
##-----------------------------------------------------------------
##-----------------------------------------------------------------

import traceback
import warnings
import sys

def warn_with_traceback(message, category, filename, lineno, file=None, line=None):
    traceback.print_stack()
    log = file if hasattr(file,'write') else sys.stderr
    log.write(warnings.formatwarning(message, category, filename, lineno, line))

#Add to your code if you want to see a continuous traceback

# import mlib_traceback
# import warnings
# warnings.showwarning = mlib_traceback.warn_with_traceback
# warnings.simplefilter("always")

#Or just add warnings.simplefilter("error") to make all warnings errors

# To select a specific warning as an error using regex:
# import warnings
# warnings.filterwarnings("error", "overflow.encountered.in.multiply")

#To silence a warning and then restore ALL warnings
# warnings.simplefilter('ignore' , RuntimeWarning )
# warnings.resetwarnings()


