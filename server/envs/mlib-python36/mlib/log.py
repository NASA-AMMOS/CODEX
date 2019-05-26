# -----------------------------------------------------------------
# -----------------------------------------------------------------
#
#  Mandrake lib (mlib) for handling logging functions
#
# -----------------------------------------------------------------
# -----------------------------------------------------------------

import mlib.formatting as F
import mlib.memory
import time
import sys


def start_time():
    return time.time()


def end_time(starttime):
    return time.time() - starttime


# Takes in arguments of a start time as from time.time() and a label for the current activity.
# Optionally pass in some relevant itemnumber to report
def log_time_and_mem(start_time_in_seconds, activity_label="", relevant_number=None):
    number_comment = ""
    if relevant_number is not None: number_comment = ", number: " + F.SI(relevant_number)
    return "Time to %s: %s" % (activity_label,
                               F.humantime(time.time() - start_time_in_seconds)) + number_comment + ", memused: %s" % (
               mlib.memory.report_current_memory_usage())


# sends an error message to stderr and dies
def error(message):
    sys.stderr.write("***ERROR! " + message + "\n")
    sys.exit()


# seonds a warning message to stderr and continues
def warn(message):
    sys.stderr.write("***WARNING! " + message + "\n")
