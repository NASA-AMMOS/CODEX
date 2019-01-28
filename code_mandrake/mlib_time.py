##-----------------------------------------------------------------
##-----------------------------------------------------------------
##
## Mandrake lib (mlib) for handling time conversion and formatting
##
## mlib_time.py -- Date & Time class based on native Python datetime, time, and calendar
##                libraries. Represents a Date/Time as seconds past J2000 epoch
##                and provides various format conversions and date delta arithmetic.
##                Also includes some wonderful new smart functions that perform
##                desired transformations on a Do The Right Thing basis
##
##-----------------------------------------------------------------
##-----------------------------------------------------------------

import datetime, calendar, time, types, sys, re, math
import numpy as N
import mlib_types
import mlib_regex as R
from pprint import pprint as PP
from mlib_iterable import is_not_iterable
from mlib_numeric  import inr

#surprisingly, using a number starting with 0 is considered OCTAL and causes major problems here
#Actual definition of months according to calendar
MONTHS_BY_DOY = {
'Jan': (  0,  30),
'Feb': ( 31,  58),
'Mar': ( 59,  89),
'Apr': ( 90, 119),
'May': (120, 150),
'Jun': (151, 180),
'Jul': (181, 211),
'Aug': (212, 242),
'Sep': (243, 272),
'Oct': (273, 303),
'Nov': (304, 333),
'Dec': (334, 364),
}

MONTHS_BY_DECIMAL_YEAR = dict([( month, (MONTHS_BY_DOY[month][0]/364.0, MONTHS_BY_DOY[month][1]/364.0) ) for month in MONTHS_BY_DOY])

#Note that for horrific reasons, J2000 is defined as seconds past 2000/01/01 at 12:00:00 (NOON!)
#J1970 (Unix time) is defined from 1970/01/01 at 00:00:00 (midnight)

##CONSTANTS
SECONDS_IN_HOUR  = 60.0*60.0
SECONDS_IN_DAY   = 24.0*60.0*60.0
SECONDS_IN_YEAR  = SECONDS_IN_DAY*365.0
J2000_1970_EPOCH = 946684800 + 12*60*60 #2000/01/01,12:00:00 in seconds past 1970
J2000_MJD_EPOCH  = 220881600.0/SECONDS_IN_DAY+48988.0 #impossibly far in the past in days
LATEST_TIME      =  9999999999          #Highest (latest)  time in J2000 to care about... useful for initializations
EARLIEST_TIME    = -9999999999          #Lowest  (earlist) time in J2000 to care about... useful for initializations

#Old PERL leftover
#--------------------
def die    (str): raise Exception("***ERROR: "+str)

##BASE TRANSFORMATIONS
#--------------------
def expand_ymd(d): #expands 2004-8-2 to 20040802 and 04-12-12 to 20041212
    o=d
    d=d.replace('-','/').replace(':','/') #turn all divider characters into /
    if not d.find('/'): return o
    (y,m,d)=d.split('/')
    y="%04d"%(ensureYYYY(float(y)))
    m="%02d"%(float(m))
    d="%02d"%(float(d))
    return y+m+d

def ensureYYYY(y):
    if y>99: return y
    if y>50: return 1900+y
    return 2000+y

def ensureYY(y):
    return y%100

def convert_1970_to_J2000_epoch(t1970):
    return float(t1970)-J2000_1970_EPOCH

def convert_J2000_to_1970_epoch(t2000):
    return float(t2000)+J2000_1970_EPOCH

def convert_MJD_to_J2000_epoch(MJD):
    return (float(MJD)-J2000_MJD_EPOCH)*SECONDS_IN_DAY

def convert_J2000_to_MJD_epoch(t2000):
    return float(t2000)/SECONDS_IN_DAY+J2000_MJD_EPOCH

#transforms an hms string to a float hours
def hms_to_hours(str):
    return float(str[0:2])+float(str[2:4])/60.0+float(str[4:6])/3600.0

#Returns 'now' in desired format
def now(format = 'YYYYMMDDHHMMSSFF'):
    return from_J2000(to_J2000('now'), format = format)

def J2000_to_list(sec=0.0):
    #check for fractional seconds
    frac=0.0
    if sec > int(sec):
        frac=sec-int(sec)
        sec =int(sec)
    callist=list(time.gmtime(sec+J2000_1970_EPOCH))
    #add back in fractional seconds if present
    if frac > 0.0:
        callist[5]=callist[5]+frac
    return callist[0:6]
def list_to_J2000(inlist):
    #check for fractional seconds and remove
    clist=[0,0,0,0,0,0.0] #default to zeros everywhere
    clist[:len(inlist)]=inlist
    ss=clist[5]
    frac=0.0
    if ss > int(ss):
        frac=ss-int(ss)
        clist[5]=int(ss)
    #transform, adding fractional seconds afterwards
    return calendar.timegm(clist)-J2000_1970_EPOCH+frac

##INTELLIGENT FUNCTIONS
def valid_formats():
    return ('J2000',               #int or float bare number
            'J1970',               #same as J2000 except starts at 1970 epoch
            'MJD',                 #Counts number of days since 1859 or some thing
            'HHMMSS',              #string
            'YYMMDD',              #string
            'YYYYMMDD',            #string
            'YYMMDDHHMMSS',        #string .
            'YYYYMMDDHHMMSS',      #string .
            'YYYYMMDD_HHMMSS',     #string .
            'YYYYMMDDHHMMSSFF'#... #string Arbitrary precision format
            'YYMMDD_HHMMSS',       #string .
            'DOY',                 #string
            'HOD',"HOURSINDAY",    #string hours of day
            'MOD',"MINUTESINDAY",  #string minutes of day
            'SOD',"SECONDSINDAY",  #string seconds of day
            'YYDOY',               #string
            'YYYYDOY',             #string
            'LIST',                #list(y,m,d,h,m,s)
            'HMS',                 #string
            'YMD',                 #string
            'YMDHMS',              #string
            'GAIMSTRING',          #string yyyy/mm/dd,hh:mm:ss.frac
            'TENETHOURLY',         #string siteDOYlmm.yy.tenet
            'LOCALHMS',            #string HHMMSS.F adjusted for local time (requires longitude in deg)
            'LOCALHOUR',           #float hours into day local time (requires longitude in deg)
            'HOURLETTER',          #string a where a(a,x) for each hour of day
            'NOW+-hours'#,         #string now or nowUTC +- some hour value
            )

#shift is a relative shift for use with changing the NOW, usually ignored
def to_J2000(input,format=None,shift=0.0):
    """ Main routine that takes in nearly any time format and brings it to J2000 standard.

        Args:
            input : can be string, could be a list, could be a float
            format: specify how to interpret input. If None, code will guess.
            shift : If "NOW" is specified as the input, shift will shift the resulting value by shift seconds

        Input YYYYMMDD
        >>> to_J2000("20040606")
        139752000.0

        Input YYMMDD
        >>> to_J2000("040606", format='YYMMDD')
        139752000.0

        Input YYYYMMDDHHMMSS
        >>> to_J2000("20040606010101")
        139755661.0

        Input YYYYMMDDHHMMSS.FFF variants
        >>> to_J2000("20040606010101.111")
        139755661.111
        >>> to_J2000("040606010101.111", format = 'YYMMDDHHMMSS')
        139755661.111

        Input YYYYMMDDHHMMSSFFF variants
        >>> to_J2000("20040606010101111")
        139755661.111
        >>> to_J2000("040606010101111", format = 'YYMMDDHHMMSS')
        139755661.111

        Input YYMMDD_HHMMSS variants
        >>> to_J2000("040606_010101", format = 'YYMMDDHHMMSS')
        139755661.0
        >>> to_J2000("20040606_010101")
        139755661.0
        >>> to_J2000("20040606_010101.11")
        139755661.11

        Input Hour Letter format
        >>> to_J2000("c")
        -36000.0

        HHMMSS format
        >>> to_J2000("121212.1",'HHMMSS')
        732.1
        >>> to_J2000("121212",'HHMMSS')
        732.0

        J2000 format
        >>> to_J2000(10244201.1)
        10244201.1

        (YYYY,MM,DD,HH,MM,SS.FF) list format
        >>> to_J2000((2004,06,06,01,01,01.11))
        139755661.11

        YYDOY
        >>> to_J2000("04158","YYDOY")
        139752000.0

        DOY defaults to year 2000
        >>> to_J2000("158","DOY")
        13521600.0
        >>> to_J2000("20000606000000")
        13521600.0

        So-called GAIMSTRING format
        >>> to_J2000("2004/06/06,00:00:00.1")
        139752000.1

        So-called TENET format (XXXXDOYHMM.YY*)
        >>> to_J2000("help158a00.04.tenet","TENETHOURLY")
        139752000.0

        Can't test NOW option itself, unfortunately...

        NOW+(hours) option
        >>> to_J2000('now+1') - to_J2000('now')
        3600.0
        >>> to_J2000('nowutc+1') - to_J2000('nowutc')
        3600.0

    """

    sec = 0.0 #internal representation
    if format is None: format = ""
    else:  format = format.upper()
    if format=="J1970": return convert_1970_to_J2000_epoch(input)
    if format=="MJD"  : return convert_MJD_to_J2000_epoch (input)
    #assume J2000 seconds for any bare number
    if mlib_types.isint(input) or mlib_types.isfloat(input) or format.lower()=='j2000': return float(input)
    #if it's a list, simple... will be interpretted as y,m,d,hh,mm,ss with 0's in any unspecified slot
    elif mlib_types.isarray(input): return list_to_J2000(input)
    #if it's a string, could be many things
    elif isinstance(input,types.StringType):
        if input.lower()[:3]=="now":
            #Could be NOW or NOWUTC or NOWLOCAL (same as NOW)
            adjustment_hours = R.extract_groups("([-+\d\.\e\s]+)", input.lower()) #+- is in HOURS
            adjustment_hours = 0.0 if adjustment_hours is None else float(adjustment_hours.replace(" ",""))

            if "utc" in input.lower():
                return to_J2000(time.gmtime   ()[0:6]) + adjustment_hours*60.0*60.0 + shift #shift is passed in through function
            else:
                return to_J2000(time.localtime()[0:6]) + adjustment_hours*60.0*60.0 + shift #shift is passed in through function

        #Autoguess format based on length or user-specified request
        if len(input)>12 and format=="TENETHOURLY":
            (doy,hl,mm,y)=(int(input[4:7]),input[7:8],int(input[8:10]),int(input[11:13]))
            (yyyy,m,d)=J2000_to_list(list_to_J2000((ensureYYYY(int(y)),1,doy)))[0:3]
            return list_to_J2000((yyyy,m,d,ord(hl)-ord('a'),mm,0))

        #strip off any fractional second information first
        p=input.find('.')
        frac=0.0
        if p>=0:
            if input.find('tenet') < 0:
                frac=float(input[p:])
                input  =input[:p]

        if format=="DOY":
            return list_to_J2000((2000,1,int(input)))

        if format in ("HOD","HOURSINDAY"):
            return list_to_J2000((2000,1,1,int(input),0,0))

        if format in ("MOD","MINUTESINDAY"):
            return list_to_J2000((2000,1,1,0,int(input),0))

        if format in ("SOD","SECONDSINDAY"):
            return list_to_J2000( (2000,1,1,0,0,int(input) + frac) )

        if format=="YYDOY":
            return list_to_J2000( ( ensureYYYY(int(input[0:2])), 1, int(input[2:]) + frac ) )

        if format=="YYYYDOY":
            return list_to_J2000((int(input[0:4]),1,int(input[4:])))

        if len(input)==len('a') or format=='HOURLETTER':
            return list_to_J2000((2000,1,1,ord(input)-ord('a'),0,0))

        if len(input)==len('HHMMSS') and format in ('HHMMSS','HMS'):
            return list_to_J2000((2000,1,1,
                                  int(input[0:2]),
                                  int(input[2:4]),
                                  int(input[4:6])+frac))

        #extract out only the numbers, drop all other characters regardless of fanciness. It's all Y M D H M S F info anyway
        justdigits = R.keep_these_chars(input,set_to_keep='digits')

        #Handle the formats that only permit YY
        if format in ('YYMMDD','YYMMDDHHMMSS'):
            doubles = [ int(justdigits[i*2:i*2+2]) for i in range(len(justdigits)/2) ]
            #Change YY into YYYY
            doubles[0] = ensureYYYY(doubles[0])
            #Handle YYMMDD case
            if len(justdigits) == len('YYMMDD'): return list_to_J2000( doubles )
            #Handle YYMMDDHHMMSS case, which can include HHMMSSFFFFFFFF also
            return list_to_J2000( doubles[:6] ) + frac + float("0."+justdigits[12:])

        #Now we're handling YYYYMMDD or YYYYMMDDHHMMSSFFFFFFFFF
        if len(justdigits) > 8:
            return list_to_J2000((int(justdigits[ 0: 4]),
                                  int(justdigits[ 4: 6]),
                                  int(justdigits[ 6: 8]),
                                  int(justdigits[ 8:10]),
                                  int(justdigits[10:12]),
                                  int(justdigits[12:14]))) + frac + float("0."+justdigits[14:])
        else:
            return list_to_J2000((int(justdigits[ 0: 4]),
                                  int(justdigits[ 4: 6]),
                                  int(justdigits[ 6: 8]) ) )

        die("MTIME: Unknown string format",input)
    die("MTIME: Unknown input type to to_J2000:",input)

def from_J2000(sec=0,format="YYYYMMDD_HHMMSS",aux=None):
    """ Takes seconds since J2000 and converts it to a wide range of formats

    >>> from_J2000(139752000.11, format = "J2000")
    139752000.11

    >>> from_J2000(139752000   , format = "J2000")
    139752000

    >>> from_J2000(139752000.11, format = "J1970")
    1086480000.1100001

    >>> from_J2000(139752000, format = "MJD")
    53162.0

    >>> from_J2000(139752000.1, format = "LIST")
    [2004, 6, 6, 0, 0, 0.09999999403953552]
    >>> from_J2000(139752000  , format = "LIST")
    [2004, 6, 6, 0, 0, 0]

    >>> from_J2000(139752000.1, format = "HOURLETTER")
    'a'
    >>> from_J2000(139752000  , format = "HOURLETTER")
    'a'

    >>> from_J2000(139752000.1, format = "HMS")
    '000000.1'

    >>> from_J2000(139752000  , format = "HMS")
    '000000'

    >>> from_J2000(139752000.1, format = "YYMMDD")
    '040606'

    >>> from_J2000(139752000.1, format = "YYYYMMDD")
    '20040606'

    >>> from_J2000(139752000.1, format = "YYYYMMDDHHMMSS")
    '20040606000000.1'

    >>> from_J2000(139752000.12345, format = "YYYYMMDDHHMMSS")
    '20040606000000.12345'

    Test OCO-2 SID format
    >>> from_J2000(139752000.12345, format = "YYYYMMDDHHMMSSFF")
    '2004060600000012'

    >>> from_J2000(139752000      , format = "YYYYMMDDHHMMSSFF")
    '2004060600000000'

    >>> from_J2000(139752000.12345, format = "YYYYMMDD_HHMMSS")
    '20040606_000000.12345'

    >>> from_J2000(139752000      , format = "YYYYMMDD_HHMMSS")
    '20040606_000000'

    >>> from_J2000(139752000.12345, format = "YYMMDD_HHMMSS")
    '040606_000000.12345'

    >>> from_J2000(139752000      , format = "YYMMDD_HHMMSS")
    '040606_000000'

    >>> from_J2000(139752000.12345, format = "GAIMSTRING")
    '2004/06/06,00:00:00.12345'

    >>> from_J2000(139752000.12345, format = "DOY")
    '158'

    >>> from_J2000(139752000.12345, format = "YYDOY")
    '04158'

    >>> from_J2000(139752000.12345, format = "YYYYDOY")
    '2004158'

    >>> from_J2000(139752000.12345, format = "TENETHOURLY")
    'site158a00.04.tenet'

    Here, aux encodes the longitude in degrees of the local site to query in -180,180 measure
    >>> from_J2000(139752000.12345, format = "LOCALHMS", aux = 10.0)
    '004000.12345'

    >>> from_J2000(139752000      , format = "LOCALHMS", aux = 10.0)
    '004000'

    Test local hour capability, passing longitude to adjust for local time consideration (not timezones!)
    Handles any coordinate system of longitude so long as 0 = Greenwich
    >>> from_J2000(139752000.12345, format = "LOCALHMS", aux = 190.0)
    '124000.12345'
    >>> from_J2000(139752000.12345, format = "LOCALHMS", aux = -170.0)
    '124000.12345'
    >>> from_J2000(139752000.12345, format = "LOCALHOUR", aux = -170.0)
    12.666700958336394

    """
    #aux contains spare information, thusfar only used for site id's for filenames or longitude for localtime
    format=format.upper()
    if format == "J2000"                 : return sec
    if format == "J1970"                 : return convert_J2000_to_1970_epoch(sec)
    if format == "MJD"                   : return convert_J2000_to_MJD_epoch (sec)
    (y,m,d,hh,mm,ss)=J2000_to_list(sec)
    f=""
    if ss > int(ss): f=("%f"%(ss-int(ss))).strip('0') #remove leading and trailing 0
    if format == "LIST"                  : return [y,m,d,hh,mm,ss]
    if format == "HOURLETTER"            : return chr(hh+ord('a'))
    if format in("HOURSINDAY","HOD")     : return hh+mm/60.0+ss/3600.0
    if format in("MINUTESINDAY","MOD")   : return hh*60.0+mm+ss/60.0
    if format in("SECONDSINDAY","SOD")   : return (hh*60.0+mm)*60.0+ss
    if format in("HHMMSS","HMS")         : return "%02d%02d%02d"%(hh,mm,ss)+f
    if format in("YYMMDD","YMD")         : return "%02d%02d%02d"%(ensureYY(y),m,d)
    if format == "YYYYMMDD"              : return "%04d%02d%02d"%(y,m,d)
    if format in("YYMMDDHHMMSS","YMDHMS"): return "%02d%02d%02d%02d%02d%02d"%(ensureYY(y),m,d,hh,mm,ss)+f
    if format == "YYYYMMDDHHMMSS"        : return "%04d%02d%02d%02d%02d%02d"%(y,m,d,hh,mm,ss)+f
    if format == "YYYYMMDDHHMMSSFF"      : return "%04d%02d%02d%02d%02d%02d%02d"%(y,m,d,hh,mm,ss, 0 if len(f) == 0 else int(float(f)*100) )
    if format == "YYMMDD_HHMMSS"         : return "%02d%02d%02d_%02d%02d%02d"%(ensureYY(y),m,d,hh,mm,ss)+f
    if format == "YYYYMMDD_HHMMSS"       : return "%04d%02d%02d_%02d%02d%02d"%(y,m,d,hh,mm,ss)+f
    if format == "GAIMSTRING"            : return "%04d/%02d/%02d,%02d:%02d:%02d"%(y,m,d,hh,mm,ss)+f
    doy = time.gmtime(sec+J2000_1970_EPOCH)[7] #fetch doy
    if format == "DOY"                   : return "%03d"%doy
    if format == "YYDOY"                 : return "%02d%03d"%(ensureYY  (y),doy)
    if format == "YYYYDOY"               : return "%04d%03d"%(ensureYYYY(y),doy)
    if format == "TENETHOURLY"           :
        if aux is None: aux = "site"
        return "%4s%03d%1s%02d.%02d.tenet"%(aux,doy,chr(ord('a')+hh),mm,ensureYY(y))
    if format == "LOCALHMS" or format == "LOCALHOUR":
        if aux is None: aux = 0

        #ensure longitudes are -180 to 180 (works even if they already are)
        localtime = hh + mm/60.0 + ss/3600.0 + aux/360.0*24.0        #in this case, aux is longitude in deg
        localtime = math.fmod(localtime, 24)
        if localtime < 0.0 : localtime += 24
        if format == "LOCALHOUR": return localtime
        hh = int(localtime)
        mm = int((localtime - hh) * 60.0)
        ss = int((localtime - hh - mm / 60.0) * 3600.0 + 0.5)
        return "%02d%02d%02d"%(localtime,mm,ss)+f
    die("Unrecognized format string in from_J2000 "+format)

class Mtime:
    "Handles conversions between times and dates"
    #internal representation is seconds past J2000
    def __init__(self,input=None,format=None,aux=None,shift=0.0): #input is the time, format is the time format, and aux is any auxilliary information that may be required by the format
            self.shift= shift
            self.sec  = N.float64(0.0)
            self.set(input,format,aux)
    def set(self,input=None,format=None,aux=None):
        if not input: return self
        if isinstance(input,Mtime):
            self.sec  =input.sec
#            self.shift=input.shift
        else:
            self.sec  = to_J2000(input,format,self.shift)
#            self.shift= shift
        return self
    def to(self,format=None,aux=None):
        if not format: return self.sec
        return from_J2000(self.sec,format,aux)
    def now(self):
        self.sec = to_J2000("now","",self.shift)
        return self
    def nowUTC(self):
        self.sec = to_J2000("nowUTC","",self.shift)
        return self
    def nowset   (self,newnow): #this sets an offset from clock NOW to pretend to be other datetime, will be subtracted from all readouts
        self.shift = Mtime(newnow)-self.now()+0.0
        return self
    def nowsetUTC(self,newnow): #this sets an offset from clock NOW UTC to pretend to be other datetime, will be subtracted from all readouts
        self.shift = Mtime(newnow)-self.nowUTC()+0.0
        return self
    def shiftnow(self,shifter): #manually set the shift of now
        self.shift=shifter
        return self
    def addSeconds(self,s):
        self.sec+=s
        return self
    def addMinutes(self,m):
        self.sec+=m*60.0
        return self
    def addHours  (self,h):
        self.sec+=h*60.0*60.0
        return self
    def addDays   (self,d):
        self.sec+=d*60.0*60.0*24.0
        return self
    def addMonths (self,mi):
        (y,m,d,hh,mm,ss)=from_J2000(self.sec,"LIST")
        m+=mi
        while m > 12:
            y=y+1
            m-=12
        while m < 1:
            y=y-1
            m+=12
        self.sec=to_J2000((y,m,d,hh,mm,ss))
        return self
    def addYears (self,yi):
        (y,m,d,hh,mm,ss)=from_J2000(self.sec,"LIST")
        self.sec=to_J2000((y+yi,m,d,hh,mm,ss))
        return self
    def copy      (self):
        n=Mtime(self.sec,"","",self.shift)
        return n
    def makemidnight(self):
        (y,m,d,hh,mm,ss)=from_J2000(self.sec,"LIST")
        self.sec=to_J2000((y,m,d))
        return self
    def floor(self,interval): #round current object to a specified accuracy
        (y,m,d,hh,mm,ss)=from_J2000(self.sec,"LIST")
        interval=interval.lower()
        if   interval.find('year'  )>=0: self.sec=to_J2000((y, 1, 0,  0,  0,      0))
        elif interval.find('month' )>=0: self.sec=to_J2000((y, m, 1,  0,  0,      0))
        elif interval.find('day'   )>=0: self.sec=to_J2000((y, m, d,  0,  0,      0))
        elif interval.find('hour'  )>=0: self.sec=to_J2000((y, m, d, hh,  0,      0))
        elif interval.find('minute')>=0: self.sec=to_J2000((y, m, d, hh, mm,      0))
        elif interval.find('second')>=0: self.sec=to_J2000((y, m, d, hh, mm,int(ss)))
        else                           : die("Mtime: Floor: Malformed interval: "+interval)
        return self
    def __sub__(self,other):
        return Mtime(self.sec-other)
    def __abs__(self):
        return abs(self.sec)
    def __add__(self,other):
        return Mtime(self.sec+other)
    def __cmp__(self,other):
        return cmp(self.sec,other.sec)
    def __coerce__(self,other):
        if isinstance(other,types.FloatType) or isinstance(other,types.IntType) or isinstance(other,types.LongType):
            return (self.sec,other)
        if isinstance(other,types.StringType):
            return (from_J2000(self.sec,"YYYYMMDD_HHMMSS"),other)
        if isinstance(other,types.ListType) or isinstance(other,types.TupleType):
            return (from_J2000(self.sec,"LIST"),other)
    def __repr__(self):
        return from_J2000(self.sec,"YYYYMMDD_HHMMSS")

#--------------------
def J2000_to_sounding_ids(J2000, string = False):
    """  Create a sounding_id from J2000 values. "string" flag optionally returns strings instead of N.int64's

    N.int64 cases
    >>> J2000_to_sounding_ids(139755661.1234)
    2004060601010112
    >>> J2000_to_sounding_ids([139755661.1234,139755661.1234,139755661.1234])
    array([2004060601010112, 2004060601010112, 2004060601010112])
    >>> J2000_to_sounding_ids([])
    array([], dtype=int64)
    >>> J2000_to_sounding_ids(463429933.0)
    2014090806321300

    string cases
    >>> J2000_to_sounding_ids(139755661.1234,string=True)
    '2004060601010112'
    >>> J2000_to_sounding_ids([139755661.1234,139755661.1234,139755661.1234],string=True) #doctest: +NORMALIZE_WHITESPACE
    array(['2004060601010112', '2004060601010112', '2004060601010112'], dtype='|S16')
    >>> J2000_to_sounding_ids([], string=True) #doctest: +NORMALIZE_WHITESPACE
    array([], dtype='|S1')
    >>> J2000_to_sounding_ids(463429933.0, string=True)
    '2014090806321300'

    """

    singleton = is_not_iterable(J2000)
    if singleton: J2000 = (J2000,)

    if string:
        if len(J2000) < 1: return N.array([], dtype = str)
        retval = [        from_J2000(x,format="YYYYMMDDHHMMSSFF")  for x in J2000]
    else:
        if len(J2000) < 1: return N.array([], dtype = N.int64)
        retval = [N.int64(from_J2000(x,format="YYYYMMDDHHMMSSFF")) for x in J2000]

    if singleton: return retval[0]
    return N.array(retval)

#--------------------
def J2000_to_decimal_year(J2000):
    """ Convert J2000 values to decimal year.
    Note decimal years use midnight epoch of this year, while J2000 uses noon at 20000101.

    >>> J2000_to_decimal_year(139755661.1234)
    2004.430253079763

    Array case, used list comprehension to force Python to print out full precision, Numpy truncates to screen (values OK)
    >>> [x for x in J2000_to_decimal_year([139755661.1234,139755661.1235,139755661.1236])]
    [2004.4302530797629, 2004.4302530797661, 2004.430253079769]

    >>> J2000_to_decimal_year([])
    array([], dtype=float64)

    """

    singleton = is_not_iterable(J2000)
    if singleton: J2000 = (J2000,)
    if len(J2000) < 1: return N.array([])

    retval = []
    for t2000 in J2000:
        YYYY = from_J2000(t2000,'YYYYMMDD')[0:4]
        retval.append( ( t2000 - to_J2000(YYYY+"0101000000") ) / SECONDS_IN_YEAR + int(YYYY) )

    if singleton: return retval[0]
    return N.array(retval)

#--------------------
def decimal_year_to_sounding_ids(decimal_year):

    return J2000_to_sounding_ids(decimal_year_to_J2000(decimal_year))

#--------------------
def decimal_year_to_J2000(decimal_year):
    """ Convert decimal year to J2000. 12 hour difference in epoch.

    >>> decimal_year_to_J2000(J2000_to_decimal_year(139755661.1234))
    139755661.123403

    Test array case, used a list comprehension to force Python to print the entire numerical value (Numpy truncates)
    >>> [x for x in decimal_year_to_J2000(J2000_to_decimal_year([139755661.1234,139755661.1234]))]
    [139755661.12340301, 139755661.12340301]

    >>> decimal_year_to_J2000(J2000_to_decimal_year([]))
    array([], dtype=float64)

    """

    singleton = is_not_iterable(decimal_year)
    if singleton: decimal_year = (decimal_year,)
    if len(decimal_year) < 1: return N.array([])

    retval = []
    for dy in decimal_year:
        YYYY = "%04d"%(int(dy))
        retval.append( to_J2000(YYYY+"0101000000") + (dy - int(dy))*SECONDS_IN_YEAR )

    if singleton: return retval[0]

    return N.array(retval)

#--------------------
def sounding_ids_to_decimal_year(sounding_ids):
    """ convert sounding_ids (integers or strings) into decimal years

    Singleton input test val 1
    >>> sounding_ids_to_decimal_year("2004060601010111")
    2004.430253079338

    Singleton input test val 2
    >>> sounding_ids_to_decimal_year("2014090806352801")
    2014.6856839171105

    Array input
    >>> [x for x in sounding_ids_to_decimal_year([N.int64(2014090806352801),N.int(2004060601010111)])]
    [2014.6856839171105, 2004.4302530793379]

    Empty input
    >>> sounding_ids_to_decimal_year([])
    array([], dtype=float64)

    Handle int64 case array
    >>> [x for x in sounding_ids_to_decimal_year([N.int64(2014090806352801),N.int(2004060601010111)])]
    [2014.6856839171105, 2004.4302530793379]

    Handle int64 singleton value
    >>> sounding_ids_to_decimal_year(N.int64(2014090806352801))
    2014.6856839171105

    """

    singleton = is_not_iterable(sounding_ids)
    if singleton: sounding_ids = (sounding_ids,)
    if len(sounding_ids) < 1: return N.array([])

    #Handle integer sounding ID case
    if type(sounding_ids[0]) == N.int64: sounding_ids = [str(x) for x in sounding_ids]

    J2000 = [to_J2000(x) for x in sounding_ids]

    if singleton: return J2000_to_decimal_year(J2000[0])
    return J2000_to_decimal_year(J2000)

#--------------------
def sounding_ids_to_J2000(sounding_ids):
    """ Convert sounding_ids (strings or int64) to J2000.

    Singleton string
    >>> sounding_ids_to_J2000("2004060601010111")
    139755661.11

    Singleton int
    >>> sounding_ids_to_J2000(N.int64(2004060601010111))
    139755661.11

    Array string
    >>> [x for x in sounding_ids_to_J2000(["2004060601010111","2004060601010111"])]
    [139755661.11000001, 139755661.11000001]

    Array N.int64
    >>> [x for x in sounding_ids_to_J2000([ N.int64(2004060601010111), N.int64(2004060601010111) ])]
    [139755661.11000001, 139755661.11000001]

    Sanity check for forward + backward conversion
    >>> J2000_to_sounding_ids(sounding_ids_to_J2000("2004060601010111"))
    2004060601010111

    Empty input
    >>> sounding_ids_to_J2000([])
    array([], dtype=float64)

    """

    singleton = is_not_iterable(sounding_ids)
    if singleton: sounding_ids = (sounding_ids,)
    if len(sounding_ids) < 1: return N.array([])

    retval = [to_J2000(str(x)) for x in sounding_ids]

    if singleton: return retval[0]
    return N.array(retval)

#--------------------
def time_range_labels_for_decimal_years (rangetype, return_labels = True):
    """ Returns decimal year ranges and (optionally) labels for various time ranges.
    rangetype can be "year","month","week', or "season"

    >>> time_range_labels_for_decimal_years("year")
    ([[0.0, 1.0]], ['year'])

    >>> ranges, labels = time_range_labels_for_decimal_years("season")
    >>> ranges[0],ranges[-1],labels[0],labels[-1]
    ([0.1667, 0.3333], [0.8333, 1.1667], 'spring', 'winter')

    >>> ranges, labels = time_range_labels_for_decimal_years("month" )
    >>> ranges[0],ranges[-1],labels[0],labels[-1]
    ((0.0, 0.08241758241758242), (0.9175824175824175, 1.0), 'Jan', 'Dec')

    >>> ranges, labels = time_range_labels_for_decimal_years("week"  )
    >>> ranges[0],ranges[-1],labels[0],labels[-1]
    ((0.0, 0.019230769230769232), (0.9780821917808219, 1.0), 'w00', 'w51')

    >>> ranges, labels = time_range_labels_for_decimal_years("day"   )
    >>> ranges[0],ranges[-1],labels[0],labels[-1]
    ((0.0, 0.0027397260273972603), (0.9972602739726028, 1.0), 'd000', 'd364')

    >>> time_range_labels_for_decimal_years("season", return_labels = False)
    [[0.1667, 0.3333], [0.3333, 0.6666], [0.6666, 0.8333], [0.8333, 1.1667]]

    >>> time_range_labels_for_decimal_years("notsupported")
    Traceback (most recent call last):
    Exception: Invalid time range specification: notsupported

    """

    rangetype = rangetype.lower()

    #Sort out the kinds of labels to use
    if "year" in rangetype:
        if return_labels: labels = ['year', ]
        ranges = [ [0.0, 1.0] , ]

    elif "season" in rangetype:
        if return_labels: labels = ['spring', 'summer', 'fall', 'winter']
        ranges = [ [0.1667, 0.3333], [0.3333, 0.6666], [0.6666, 0.8333], [0.8333, 1.1667] ]

    elif "month" in rangetype:
        if return_labels: labels = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
        ranges = [MONTHS_BY_DECIMAL_YEAR[month] for month in labels]

    elif "week" in rangetype:
        if return_labels: labels = ["w%02d"%week  for week in range(0,52)]
        ranges = [(week*7/365.0,(week*7+7)/364.0) for week in range(0,52 )]

    elif "day" in rangetype:
        if return_labels: labels = ["d%03d"%day   for day  in range(0,365)]
        ranges = [(day   /365.0,(day   +1)/365.0) for day  in range(0,365)]
    else:
        raise Exception("Invalid time range specification: "+rangetype)


    if return_labels:
        return ranges, labels
    else:
        return ranges


#--------------------
def decimal_year_bins(decimal_year, groupby = 'month'):
    """ Accepts a vector of decimal years and returns the encompassing bins in terms of years, months, or weeks.

    >>> decimal_year_bins(N.linspace(2014,2015,10000), 'year'  )
    [(2014.0, 2015.0), (2015.0, 2016.0)]
    >>> bin_ranges = decimal_year_bins(N.linspace(2014,2015,10000), 'month' )
    >>> bin_ranges[0], bin_ranges[-1]
    ((2014.0, 2014.0824175824175), (2015.0, 2015.0824175824175))

    >>> bin_ranges = decimal_year_bins(N.linspace(2014,2015,10000), 'week'  )
    >>> bin_ranges[0], bin_ranges[-1]
    ((2014.0, 2014.0192307692307), (2015.0, 2015.0192307692307))

    >>> bin_ranges = decimal_year_bins(N.linspace(2014,2015,10000), 'day'   )
    >>> bin_ranges[0], bin_ranges[-1]
    ((2014.0, 2014.0027397260274), (2015.0, 2015.0027397260274))

    """

    year_min = N.min(int(N.min(decimal_year)))
    year_max = N.max(int(N.max(decimal_year)))

    ranges, labels = time_range_labels_for_decimal_years( groupby.lower() )

    retval    = []
    numpoints = []
    for year in range(year_min, year_max+1):

        for srange in ranges:

            range_min = year + srange[0]
            range_max = year + srange[1]

            numpoints.append(N.sum(inr(decimal_year, range_min, range_max, closed_upper = True)))
            retval   .append( ( range_min, range_max ) )

    #Check for zero contributions on left and right, unless user specified range
    #come in from left
    mask = N.array([True,]*len(numpoints))
    for i in range(0,len(numpoints)):
        if numpoints[i] == 0:
            mask[i] = False
            continue
        break
    #come in from right
    for i in range(0,len(numpoints)):
        if numpoints[len(numpoints)-1-i] == 0:
            mask[len(numpoints)-1-i] = False
            continue
        break

    #Apply masks from above
    return [rv for rv,msk in zip(retval, mask) if msk]

#--------------------
def month_str_to_number(vals):
    """ Converts a named month string to an integer value.

    >>> month_str_to_number('january')
    1

    >>> month_str_to_number('march')
    3

    >>> month_str_to_number(['january','february','march','april','may','june','july','august','september','october','november','december'])
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

    >>> month_str_to_number(['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'])
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

    >>> month_str_to_number([])
    []

    """

    months = {'jan': 1,
              'feb': 2,
              'mar': 3,
              'apr': 4,
              'may': 5,
              'jun': 6,
              'jul': 7,
              'aug': 8,
              'sep': 9,
              'oct': 10,
              'nov': 11,
              'dec': 12}

    singleton = is_not_iterable(vals)
    if singleton: vals = (vals,)

    answer = []
    for val in vals:
        match = [x for x in months if x in val.lower()]
        if len(match) >  1: raise Exception('Ambiguous month string encountered %s'%val)
        if len(match) == 0: raise Exception('Unmatched month string encountered %s'%val)
        answer.append(months[match[0]])

    if singleton: return answer[0]
    return answer

#--------------------
def convert_english_to_sid(vals):
    """ Converts DD-MMM-YY HH:MM:SS format to YYYYMMDDHHMMSS.

    >>> convert_english_to_sid( '01-JAN-16 03:01:15' )
    20160101030115

    >>> convert_english_to_sid([ '01-JAN-16 03:01:15', '01-JAN-16 03:01:15'] )
    [20160101030115, 20160101030115]

    >>> convert_english_to_sid([])
    []

    """

    singleton = is_not_iterable(vals)
    if singleton: vals = (vals,)

    answer = []
    for val in vals:
        if "nan" in val:
            answer.append(N.int64(-1))
            continue
        dd, mmm, yy, hh, mm, ss = R.extract_groups('(\d\d)-(...)-(\d\d) (\d\d):(\d\d):(\d\d)', val)
        answer.append( N.int64( "%04d"%ensureYYYY(int(yy)) +
                                "%02d"%month_str_to_number(mmm) +
                                "%02d"%int(dd) +
                                "%02d"%int(hh) +
                                "%02d"%int(mm) +
                                "%02d"%int(ss) ) )

    if singleton: return answer[0]
    return answer

#--------------------
def convert_englishdoy_to_sid(vals):
    """ Converts YYYY-DOYTHH:MM:SS.FFF to YYYYMMDDHHMMSS.

    >>> convert_englishdoy_to_sid( '2016-167T10:08:36.912' )
    20160615100837

    >>> convert_englishdoy_to_sid([ '2016-167T10:08:36.912', '2016-167T10:08:36.912' ])
    [20160615100837, 20160615100837]

    >>> convert_englishdoy_to_sid([])
    []

    >>> convert_englishdoy_to_sid( '2016-001T10:08:36.912' )
    20160101100837

    """

    singleton = is_not_iterable(vals)
    if singleton: vals = (vals,)

    answer = []
    for val in vals:
        if "nan" in val:
            answer.append(N.int64(-1))
            continue

        yyyy, doy, hh, mm, ss = R.extract_groups('(\d\d\d\d)-(\d\d\d)T(\d\d):(\d\d):(\d\d\.*\d*)', val)
        sid = from_J2000(to_J2000( ( int(yyyy),
                                     01,
                                     int(doy),
                                     int(hh),
                                     int(mm),
                                     int(float(ss)+0.5) ),
                         format = "YYYYMMDDHHMMSS" ) )
        answer.append( N.int64( sid.replace("_","") ) )

    if singleton: return answer[0]
    return answer

#--------------------
def label_ranges_from_decimal_year(decimal_year, label = 'season', limits = None, include_year = True, year_apostrophe = False):
    """ Takes a list of decimal years and returns labeled time ranges.
    Year labels are assigned at the beginning of a season.

    Args:
        label       : string that specifies what kind of labels to apply.
                      Valid values: season, month, week, day
        include_year: postpend the 2-digit year after each label
        limits      : decimal_year limits to label (useful for ignoring outlier data)
    Returns:
        labeled_ranges: list of pairs of (label, range) where range itself is (minDY, maxDY).
        counts        : number of points present in each range

    Season Case

    Base case
    >>> label_ranges_from_decimal_year(N.arange(2014,2015,0.1), label = 'season')
    ([('winter 13', (2013.8333, 2014.1667)), ('spring 14', (2014.1667, 2014.3333)), ('summer 14', (2014.3333, 2014.6666)), ('fall 14', (2014.6666, 2014.8333)), ('winter 14', (2014.8333, 2015.1667))], array([2, 2, 3, 2, 1]))

    Add apostrophe for year
    >>> label_ranges_from_decimal_year(N.arange(2014,2015,0.1),label = 'season',year_apostrophe = True)
    ([("winter '13", (2013.8333, 2014.1667)), ("spring '14", (2014.1667, 2014.3333)), ("summer '14", (2014.3333, 2014.6666)), ("fall '14", (2014.6666, 2014.8333)), ("winter '14", (2014.8333, 2015.1667))], array([2, 2, 3, 2, 1]))

    Without year shown
    >>> label_ranges_from_decimal_year(N.arange(2014,2015,0.1),label = 'season',include_year=False)
    ([('winter', (2013.8333, 2014.1667)), ('spring', (2014.1667, 2014.3333)), ('summer', (2014.3333, 2014.6666)), ('fall', (2014.6666, 2014.8333)), ('winter', (2014.8333, 2015.1667))], array([2, 2, 3, 2, 1]))

    Specify limits to include less date range than is actually in data (filtration + stability)
    >>> label_ranges_from_decimal_year(N.arange(2014,2015,0.1),label = 'season',limits = [2014.5,2015])
    ([('summer 14', (2014.3333, 2014.6666)), ('fall 14', (2014.6666, 2014.8333)), ('winter 14', (2014.8333, 2015.1667))], array([1, 2, 1]))

    Same thing, but without years
    >>> label_ranges_from_decimal_year(N.arange(2014,2015,0.1),label = 'season',limits = [2014.5,2015],include_year = False)
    ([('summer', (2014.3333, 2014.6666)), ('fall', (2014.6666, 2014.8333)), ('winter', (2014.8333, 2015.1667))], array([1, 2, 1]))

    Specify limits to include more date range than is actually in data (for plot stability)
    >>> label_ranges_from_decimal_year(N.arange(2014,2015,0.1),limits = [2013,2017])
    ([('winter 12', (2012.8333, 2013.1667)), ('spring 13', (2013.1667, 2013.3333)), ('summer 13', (2013.3333, 2013.6666)), ('fall 13', (2013.6666, 2013.8333)), ('winter 13', (2013.8333, 2014.1667)), ('spring 14', (2014.1667, 2014.3333)), ('summer 14', (2014.3333, 2014.6666)), ('fall 14', (2014.6666, 2014.8333)), ('winter 14', (2014.8333, 2015.1667)), ('spring 15', (2015.1667, 2015.3333)), ('summer 15', (2015.3333, 2015.6666)), ('fall 15', (2015.6666, 2015.8333)), ('winter 15', (2015.8333, 2016.1667)), ('spring 16', (2016.1667, 2016.3333)), ('summer 16', (2016.3333, 2016.6666)), ('fall 16', (2016.6666, 2016.8333)), ('winter 16', (2016.8333, 2017.1667))], array([0, 0, 0, 0, 2, 2, 3, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0]))

    Month Case

    With year
    >>> label_ranges_from_decimal_year(N.arange(2014,2015,0.1),label = 'month',limits = [2014.5,2015])
    ([('Jul 14', (2014.4972527472528, 2014.5796703296703)), ('Aug 14', (2014.5824175824175, 2014.6648351648353)), ('Sep 14', (2014.6675824175825, 2014.7472527472528)), ('Oct 14', (2014.75, 2014.8324175824175)), ('Nov 14', (2014.8351648351647, 2014.9148351648353)), ('Dec 14', (2014.9175824175825, 2015.0)), ('Jan 15', (2015.0, 2015.0824175824175))], array([0, 1, 1, 1, 1, 0, 0]))

    Without year
    >>> label_ranges_from_decimal_year(N.arange(2014,2015,0.1),label = 'month',limits = [2014.5,2015], include_year = False)
    ([('Jul', (2014.4972527472528, 2014.5796703296703)), ('Aug', (2014.5824175824175, 2014.6648351648353)), ('Sep', (2014.6675824175825, 2014.7472527472528)), ('Oct', (2014.75, 2014.8324175824175)), ('Nov', (2014.8351648351647, 2014.9148351648353)), ('Dec', (2014.9175824175825, 2015.0)), ('Jan', (2015.0, 2015.0824175824175))], array([0, 1, 1, 1, 1, 0, 0]))

    Week Case

    >>> label_ranges_from_decimal_year(N.arange(2014,2014.1,0.001),label = 'week')
    ([('w00 14', (2014.0, 2014.0192307692307)), ('w01 14', (2014.0191780821917, 2014.0384615384614)), ('w02 14', (2014.0383561643835, 2014.0576923076924)), ('w03 14', (2014.0575342465754, 2014.076923076923)), ('w04 14', (2014.0767123287671, 2014.0961538461538)), ('w05 14', (2014.0958904109589, 2014.1153846153845))], array([20, 19, 19, 19, 20,  4]))

    Without year
    >>> label_ranges_from_decimal_year(N.arange(2014,2014.1,0.001),label = 'week', include_year = False)
    ([('w00', (2014.0, 2014.0192307692307)), ('w01', (2014.0191780821917, 2014.0384615384614)), ('w02', (2014.0383561643835, 2014.0576923076924)), ('w03', (2014.0575342465754, 2014.076923076923)), ('w04', (2014.0767123287671, 2014.0961538461538)), ('w05', (2014.0958904109589, 2014.1153846153845))], array([20, 19, 19, 19, 20,  4]))


    Day Case

    >>> label_ranges_from_decimal_year(N.arange(2014,2014.01,0.001),label = 'day')
    ([('d000 14', (2014.0, 2014.0027397260274)), ('d001 14', (2014.0027397260274, 2014.0054794520547)), ('d002 14', (2014.0054794520547, 2014.0082191780823)), ('d003 14', (2014.0082191780823, 2014.0109589041097))], array([3, 3, 3, 1]))

    """

    decimal_year = N.array(decimal_year)

    #Apply limits if specified
    user_specified_limits = limits is not None
    if limits is not None: decimal_year = decimal_year[inr(decimal_year,limits[0],limits[1])]
    else                 : limits = ( decimal_year.min(), decimal_year.max() )

    #Need -1 to make sure we handle winter that brackets two years, plus take into consideration user-provided limits (could be larger)
    year_min = N.min((int(N.min(decimal_year))-2,int(limits[0])))
    year_max = N.max((int(N.max(decimal_year))  ,int(limits[1])))

    ranges, labels = time_range_labels_for_decimal_years( label.lower() )

    #Perform labeling
    retval    = []
    numpoints = []
    for year in range(year_min, year_max+1):

        for slabel, srange in zip(labels, ranges):

            range_min = year + srange[0]
            range_max = year + srange[1]

            numpoints.append(N.sum(inr(decimal_year, range_min, range_max, closed_upper = True)))

            worklabel = slabel
            if include_year:
                if not year_apostrophe:
                    worklabel += " " +("%04d"%year)[2:]
                else:
                    worklabel += " '"+("%04d"%year)[2:]

            retval.append( ( worklabel, (range_min, range_max) ) )

    #Check for zero contributions on left and right, unless user specified range
    if not user_specified_limits:
        #come in from left
        mask = N.array([True,]*len(numpoints))
        for i in range(0,len(numpoints)):
            if numpoints[i] == 0:
                mask[i] = False
                continue
            break
        #come in from right
        for i in range(0,len(numpoints)):
            if numpoints[len(numpoints)-1-i] == 0:
                mask[len(numpoints)-1-i] = False
                continue
            break

    #If user did specify ranges, ensure we don't return anything entirely outside them
    #Check to see if highest range value is greater than lowest limit, and lowest range value is less than highest limit
    else:
        mask = N.array([N.max(rng) >= limits[0] and N.min(rng) <= limits[1] for lab,rng in retval])

    #Apply masks from above
    return [rv for rv,msk in zip(retval, mask) if msk], N.array(numpoints)[mask]


if __name__ == "__main__":
    import doctest
    doctest.testmod()
