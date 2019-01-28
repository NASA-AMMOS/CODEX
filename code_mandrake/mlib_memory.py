##-----------------------------------------------------------------
##-----------------------------------------------------------------
##
## Mandrake lib (mlib) for dealing with program memory
##
##-----------------------------------------------------------------
##-----------------------------------------------------------------

import os
import cPickle
import resource
import mlib_formatting
import numpy as N

#Report memory footprint. This is an over-estimation, as Python requests always more memory than currently being used.
def report_current_memory_usage():
   return mlib_formatting.SI(resource.getrusage(resource.RUSAGE_SELF).ru_maxrss*1e3)+"B"

class TotalMemory(object):
   """ Takes a snapshot of free host memory, then differences future values to figure out how much memory was taken up.
   Don't expect reliability if other people are on the same system. """

   def __init__(self):
      self.baseline = TotalMemory.get_free_memory_gb()

   @staticmethod
   def get_free_memory_gb():
      data = {}
      with open('/proc/meminfo', 'r') as f:
         for line in f:
            key, value = line.strip().split(':')
            if key == 'MemFree':
               return float(value.strip().split(' ')[0]) / (1024*1024)
      return N.nan

   def __str__(self):
      current = TotalMemory.get_free_memory_gb()
      return '%.2f GB' % (self.baseline - current)

#Runs a function off in its own fork, lets it do its thing, yields its results, and destroys the fork to fully release memory
def run_and_reclaim_memory(func, *args, **kwds):
    pread, pwrite = os.pipe()
    pid = os.fork()
    if pid > 0:
        os.close(pwrite)
        with os.fdopen(pread, 'rb') as f:
            status, result = cPickle.load(f)
        os.waitpid(pid, 0)
        if status == 0:
            return result
        else:
            raise result
    else: 
        os.close(pread)
        try:
            result = func(*args, **kwds)
            status = 0
        except Exception, exc:
            result = exc
            status = 1
        with os.fdopen(pwrite, 'wb') as f:
            try:
                cPickle.dump((status,result), f, cPickle.HIGHEST_PROTOCOL)
            except cPickle.PicklingError, exc:
                cPickle.dump((2,exc), f, cPickle.HIGHEST_PROTOCOL)
        os._exit(0)
