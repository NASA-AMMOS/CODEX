##-----------------------------------------------------------------
##-----------------------------------------------------------------
##
## Mandrake lib (mlib) for handling shell manipulation
##
##-----------------------------------------------------------------
##-----------------------------------------------------------------

import os
import random
from mlib_iterable import is_iterable, is_not_iterable
from mlib_numeric import flatten
import shutil
import glob as G
from time import sleep as sleep_seconds

PROTECTED_PATHS = [
    '/home/mandrake',
    '/home/mandrake/DOGO',
    '/home/mandrake/oco2_analysis',
    '~',
    '~/DOGO',
    '~/oco2_analysis',
    '/scratch-science2/validation/mandrake',
    '/scratch-science2/validation/mandrake/analysis',
    '/scratch-science2/validation/mandrake/data',
    '/scratch-science2/validation/mandrake/OCO2_B7_training',
    '/scratch-science2/validation/mandrake/OCO2_v7_retraining',
                   ]
#------------------------
def sleep(sec_to_sleep):
    return sleep_seconds(sec_to_sleep)

#------------------------
def glob(globspec):
    """ Attempts to execite a glob. In certain situations, glob can return "IndexError: string index out of range."
    Handle this for the user and keep trying until it stops that pathological behavior.

    Try on valid case
    >>> glob(repo_path()+"/doctest_files/dogo_direct/example_genefiles/*")
    ['/home/mandrake/DOGO/doctest_files/dogo_direct/example_genefiles/pareto']

    Try on invalid path
    >>> glob("/neverexists/*")
    []

    Try on multiple globs
    >>> glob([repo_path()+"/doctest_files/dogo_direct/example_genefiles/*", repo_path()+"/doctest_files/dogo_direct/example_genefiles/*"])
    ['/home/mandrake/DOGO/doctest_files/dogo_direct/example_genefiles/pareto', '/home/mandrake/DOGO/doctest_files/dogo_direct/example_genefiles/pareto']

    """

    if is_not_iterable(globspec): globspec = [globspec,]

    globbed = False
    while not globbed:
        try:
            files = flatten([list(G.glob(x)) for x in globspec])
            globbed = True
        except IndexError:
            #Nothing above should ever provide an index error unless the disk is being bizarre
            pass

    return files

#------------------------
def cd(path):
    """ Simply changes the current directory. """
    os.chdir(path)

def cwd():
    """ Simply returns current directory. """
    return os.getcwd()

def exists(path):
    """ Checks to see whether a file or directory exists. """
    return os.path.exists(path)

#Creates an empty file, or updates an existing file's modification time
def touch(filename):
    with open(filename, 'a'): os.utime(filename, None)

#returns the process ID of the parent process
def pid():
    return os.getpid()

#returns the IP of the current system
def get_ip():
    import socket
    return socket.gethostbyname(socket.gethostname())

#returns the hostname of the current system
def get_hostname():
    import socket
    return socket.gethostname()

#forms a symlink and doesn't error out if there's already one there
def symlink(sourcefile,destinationfile):
    try:
        os.symlink(sourcefile,destinationfile)
    except (IOError, OSError):
        pass

#changes directory
def chdir(newdir):
    os.chdir(newdir)

#makes a directory safely even if it already exists (no os exception thrown)
def mkdir(newdir):
    try:
        os.makedirs(newdir)
    except (IOError, OSError):
        pass

def rm(targets):
    """
    Copies a lot of os functionality so we can just have a unified interface (no exception thrown if missing)
    Also removes directories and symbolic links.
    Can handle globs. Be careful!
    Will fail on read only files.

    Args:
        targets: a singleton path or list of paths

    >>> testfile = repo_path()+"/doctest_working/testfile.txt"
    >>> with open(testfile,"w") as f: f.write("yikes")
    >>> exists(testfile)
    True
    >>> rm(testfile)
    >>> exists(testfile)
    False

    >>> mkdir(testfile)
    >>> exists(testfile)
    True
    >>> rm(testfile)
    >>> exists(testfile)
    False

    >>> mkdir(testfile)
    >>> with open(testfile+"/blah.txt","w") as f: f.write("yikes")
    >>> exists(testfile)
    True
    >>> rm(testfile)
    >>> exists(testfile)
    False


    """

    if is_not_iterable(targets): targets = [targets,]

    for target in targets:

        expanded_target = glob(target)

        for path in expanded_target:

            fullpath = full_file_path(path)

            if fullpath in PROTECTED_PATHS:
                raise Exception('Attempt to remove a protected path: '+fullpath)
            else:
                try:
                    os.unlink(path)
                    continue
                except (IOError, OSError):
                    pass

                try:
                    shutil.rmtree(path, ignore_errors = True)
                except (IOError, OSError):
                    pass

#Returns a shell command as an array of response lines
#def  exa   (command      ):
#    return os.popen(command).readlines()

import subprocess as SP
def  exa   (command      ):
    results = SP.Popen(command, shell=True, stdout=SP.PIPE, stderr=SP.PIPE)
    return results.stdout.readlines() + results.stderr.readlines()

#Returns a shell command as a single string of all responses
def  ex    (command      ):
    return "".join(exa(command))
#    return "".join(os.popen(command).readlines())

#Returns a shell command with the command echoed first as a huge string
def eex    (command      ):
    return command+"\n"+ex(command)

#Runs a shell command in the background
#Returns errorcode, NOT results (they aren't ready yet, of course)
def exb    (command      ):
    return SP.call(command, shell=True)
#    return os.system(command)

def cp(oldpaths, newpath):
    """Can accept an array of oldpaths to copy to the new (presumably dir). Won't get merged, just overwritten if it's a file by accident."""
    if is_not_iterable(oldpaths): oldpaths = [oldpaths,]
    for oldpath in oldpaths:
        for filer in glob(oldpath):
            try:
                shutil.copy(filer, newpath)
            except (IOError, OSError, shutil.Error):
                pass

def mv(oldpaths, newpath):
    """Move or rename files. Can accept array of oldpaths, premusable for a directory destination. Won't get merged if not dir.
    Also accepts globs. CANNOT REPLACE EXISTING FILES!"""
    if is_not_iterable(oldpaths): oldpaths = [oldpaths,]
    for oldpath in oldpaths:
        for filer in glob(oldpath):
            try:
                shutil.move(filer, newpath)
            except (IOError, OSError, shutil.Error) as e:
                pass

#Occasionally checks a series of logfiles for "Done." to be present, signalling process completion
def wait_for_files_to_be_done(loglist, recheck_seconds = 5):
    done = False

    while not done:

        done_array  = []
        error_array = []

        for f in loglist:
            try:
                contents = "".join(open(f).readlines())
            except (IOError, OSError):
                contents = "error"
            done_array .append("Done." in contents        )
            error_array.append("error" in contents.lower())
            error_array.append("exception" in contents.lower())

        ndone = sum( done_array)
        nerr  = sum(error_array)
        nlogs = len(loglist)

        done = ndone == len(loglist)

        print "%d/%d done"%(ndone,nlogs)," ","%d/%d err"%(nerr,nlogs)
        if not done:
            sleep(recheck_seconds)


#Joins an array with newline characters and writes it into a file with smartopen
#Assumes the elements of the array have a good REPR definition
def write_array(filename, array):
   with open(filename,'w') as f: f.write("\n".join([x.__str__() for x in array])+"\n")

#Super simple function that writes a string to a file
def write_string(filename, string):
   with open(filename,"w") as f: f.write(string)

#an open command that figures out whether it should use gzip or not
def smartopen(filename, mode='r'):
    import gzip
    if filename[-3:].lower()==".gz":
        return gzip.open(filename,mode)
    else:
        return      open(filename,mode)

#Determine how many lines are in a file (txt or gzipped txt)
def count_lines(path): return sum([1 for x in smartopen(path)])

#Cleanses a string to be safe as a filename
def remove_illegal_filename_characters(proposal):
    safer = proposal.replace(" ","_")
    for char in ("%" , "(", ")",
                 "," , "[", "]",
                 "*" , '"', "'",
                 ":" , ";", "|",
                 "?" , "{", "}",
                 '\0'):
        safer = safer.replace(char,"")
    return safer

#returns a "safe" file string using random
#numbers and process ID's
def generate_safe_temporary_filename(baselabel = ""):
   randpart ="%019d" % ( random.uniform(1, 1e19) )
   pidpart  ="%06d"  % ( os.getpid()             )
   return baselabel + pidpart + randpart

#returns the features of a file that you might actually care about
#instead of the plethora of system information that os.stat offers
#Returns an array if an array was passed, otherwise singleton values
def file_stats(paths):

    wasiterable = is_iterable(paths)

    #Force this to be an array call
    if not wasiterable: paths = (paths,)

    #st_mode  - protection bits,
    #st_ino   - inode number,
    #st_dev   - device,
    #st_nlink - number of hard links,
    #st_uid   - user id of owner,
    #st_gid   - group id of owner,
    #st_size  - size of file, in bytes,
    #st_atime - time of most recent access,
    #st_mtime - time of most recent content modification,
    #st_ctime - platform dependent; time of most recent metadata change on Unix, or the time of creation on Windows)

    #All times are in seconds since epoch, January 1st, 1970

    sizes = []
    times = []
    uids  = []

    for path in paths:
        (mode, ino, dev, nlink, uid, gid, size, atime, mtime, ctime) = os.stat(path)

        sizes.append(size )
        times.append(mtime)
        uids .append(uid  )

    #Return size (bytes), mtime (seconds system time last modified), and uid (unique integer assigned to each user)

    if wasiterable:
        return sizes, times, uids

    return size, mtime, uid

def file_size(paths):
    sizes, times, uids = file_stats(paths)
    return sizes

def file_time(paths):
    sizes, times, uids = file_stats(paths)
    return times

def file_size_time(paths):
    sizes, times, uids = file_stats(paths)
    return sizes, times

def file_age(paths):
    """ Returns file age in seconds. """
    import time
    sizes, times, uids = file_stats(paths)
    return time.time() - times

def full_file_path(path):
    """ Plays with strings only (doesn't evaluate on the actual directory system) to get the full intended path. """
    #For some reason this doesn't work if a trailing slash is included
    if path[-1] == '/': path = path[:-1]
    return os.path.dirname( os.path.abspath(path) ) + '/' + path.split('/')[-1]

def islink(path):
    """ Says if a file is a link or not. """
    return os.path.islink(path)

#------------------------
def cat (paths):
    """Return a file or list of files catted together as a single text string.

    >>> workfile = repo_path()+"/doctest_working/workfile.txt"
    >>> with open(workfile,"w") as f: f.write("Test1\\nTest2\\nTest3\\n")

    Standard use
    >>> print cat(workfile)
    Test1
    Test2
    Test3
    <BLANKLINE>

    List example
    >>> len(cat([workfile,workfile,workfile]).split("\\n")) == 12
    False

    Error
    >>> cat("nothere")
    Traceback (most recent call last):
    IOError: [Errno 2] No such file or directory: 'nothere'

    """

    if not is_iterable(paths): paths = (paths,)

    answer = []
    for path in paths:
        with open(path) as f: answer.append( f.read() )
    return "".join( answer )

#------------------------
def truncate_tail(filepath, N, blocksize = 1024):
    """ Truncates a text file to keep only the last N lines (like tail). Modifies the file on disk.

    >>> filepath = repo_path()+"/doctest_working/workfile.txt"
    >>> with open(filepath,"w") as f: f.write("\\n".join(["Line %d"%i for i in range(100)]))

    >>> truncate_tail(filepath, 10)
    >>> print open(filepath,"r").read()
    Line 90
    Line 91
    Line 92
    Line 93
    Line 94
    Line 95
    Line 96
    Line 97
    Line 98
    Line 99
    <BLANKLINE>

    >>> truncate_tail(filepath, 1)
    >>> print open(filepath,"r").read()
    Line 99
    <BLANKLINE>

    Attempt to truncate larger than a file actually is
    >>> with open(filepath,"w") as f: f.write("\\n".join(["Line %d"%i for i in range(2)]))
    >>> truncate_tail(filepath,10)
    >>> print open(filepath,"r").read()
    Line 0
    Line 1
    <BLANKLINE>

    """

    keep_text = tail(filepath, N, blocksize = blocksize)
    with open(filepath,"w") as f: f.write(keep_text)

#------------------------
def truncate_head(filepath, N):
    """ Truncates a text file to keep only the first N lines (like head). Modifies the file on disk.

    >>> filepath = repo_path()+"/doctest_working/workfile.txt"
    >>> with open(filepath,"w") as f: f.write("\\n".join(["Line %d"%i for i in range(100)]))

    >>> truncate_head(filepath, 10)
    >>> print open(filepath,"r").read()
    Line 0
    Line 1
    Line 2
    Line 3
    Line 4
    Line 5
    Line 6
    Line 7
    Line 8
    Line 9
    <BLANKLINE>

    >>> truncate_head(filepath, 1)
    >>> print open(filepath,"r").read()
    Line 0
    <BLANKLINE>

    Attempt to truncate larger than a file actually is
    >>> with open(filepath,"w") as f: f.write("\\n".join(["Line %d"%i for i in range(2)]))
    >>> truncate_head(filepath,10)
    >>> print open(filepath,"r").read()
    Line 0
    Line 1

    """

    keep_text = head(filepath, N)
    with open(filepath,"w") as f: f.write(keep_text)

#------------------------
def head(filepath, N):
    """ Retrieve the first N lines of a file.

    >>> filepath = repo_path()+"/doctest_working/workfile.txt"
    >>> with open(filepath,"w") as f: f.write("\\n".join(["Line %d"%i for i in range(100)]))

    >>> print head(filepath, 1)
    Line 0
    <BLANKLINE>

    >>> print head(filepath, 10)
    Line 0
    Line 1
    Line 2
    Line 3
    Line 4
    Line 5
    Line 6
    Line 7
    Line 8
    Line 9
    <BLANKLINE>

    >>> rm(filepath)

    """

    try:
        with open(filepath) as f: return "".join([next(f) for x in xrange(N)])
    except StopIteration:
        with open(filepath) as f: return f.read()

#------------------------
def tail(filepath, N, blocksize = 1024 ):
    """ Retrieve the last N lines of a file. Functions quickly by sucking in blocks and checking for newline chars.

    >>> filepath = repo_path()+"/doctest_working/workfile.txt"
    >>> with open(filepath,"w") as f: f.write("\\n".join(["Line %d"%i for i in range(100)]))

    >>> print tail(filepath, 1)
    Line 99
    <BLANKLINE>

    >>> print tail(filepath, 10)
    Line 90
    Line 91
    Line 92
    Line 93
    Line 94
    Line 95
    Line 96
    Line 97
    Line 98
    Line 99
    <BLANKLINE>

    >>> rm(filepath)

    """

    f = open(filepath,'r')
    f.seek(0, 2)
    block_end_byte = f.tell()
    lines_to_go = N
    block_number = -1
    blocks = [] # blocks of size blocksize, in reverse order starting
                # from the end of the file
    while lines_to_go > 0 and block_end_byte > 0:
        if (block_end_byte - blocksize > 0):
            # read the last block we haven't yet read
            f.seek(block_number*blocksize, 2)
            blocks.append(f.read(blocksize))
        else:
            # file too small, start from begining
            f.seek(0,0)
            # only read what was not read
            blocks.append(f.read(block_end_byte))
        lines_found = blocks[-1].count('\n')
        lines_to_go -= lines_found
        block_end_byte -= blocksize
        block_number -= 1
    all_read_text = ''.join(reversed(blocks))
    return '\n'.join(all_read_text.splitlines()[-N:])+"\n"


# import subprocess

# def command_return_string(command,options):
#     return subprocess.Popen([command,options], stdout=subprocess.PIPE)

# def command_return_array(command,options):
#     return subprocess.Popen([command,options], stdout=subprocess.PIPE).split("\n")

# def command_nowait(command,options):
#     subprocess.Popen([command,options])
#--------------------------------
#--------------------------------
#--------------------------------

if __name__ == "__main__":
    import doctest
    from mlib_doctest import repo_path
    doctest.testmod()
