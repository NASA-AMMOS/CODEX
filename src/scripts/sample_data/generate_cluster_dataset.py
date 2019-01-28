import numpy as N

#Make several events centered at different latitudes, longitudes, and times
#Some events take place at the same location but not the same time,
#while others at the same time but not the same location.
#Only fully seperable when considering auxilliary variable voltage.
#A useless variable windspeed will also be provided that is nearly identical for all



def make_event(data, center_lat , delta_lat,
                     center_lon , delta_lon,
                     center_time, delta_time,
                     center_volt, delta_volt,
                     center_wind, delta_wind,
                                             numsamples, answer):

    data['latitude' ].extend(list(N.random.normal(center_lat , delta_lat , numsamples)))
    data['longitude'].extend(list(N.random.normal(center_lon , delta_lon , numsamples)))
    data['time'     ].extend(list(N.random.normal(center_time, delta_time, numsamples)))
    data['voltage'  ].extend(list(N.random.normal(center_volt, delta_volt, numsamples)))
    data['windspeed'].extend(list(N.random.normal(center_wind, delta_wind, numsamples)))
    data['answer'   ].extend([answer,]*numsamples)

    return data

############
############
############
############

data={}

data['latitude' ] = []
data['longitude'] = []
data['time'     ] = []
data['voltage'  ] = []
data['windspeed'] = []
data['answer'   ] = []

NUMSAMP = 1000

#Make event 1
CTIME1 = 100.0
DTIME1 =  25.0
CLAT_1 =  25.0
DLAT_1 =  10.0
CLON_1 = 100.0
DLON_1 =  50.0
CVOLT1 =   5.0
DVOLT1 =   1.0
CWIND  =  50.0
DWIND  =  10.0

data = make_event(data, CTIME1, DTIME1,
                        CLAT_1, DLAT_1,
                        CLON_1, DLON_1,
                        CVOLT1, DVOLT1,
                        CWIND , DWIND , NUMSAMP, 0)


#Make event 2, same time as event 1 but different location and voltage
CTIME2 = CTIME1
DTIME2 = DTIME1
CLAT_2 = -25.0
DLAT_2 =  10.0
CLON_2 = 100.0
DLON_2 =  50.0
CVOLT2 =  10.0
DVOLT2 =   1.0

data = make_event(data, CTIME2, DTIME2,
                        CLAT_2, DLAT_2,
                        CLON_2, DLON_2,
                        CVOLT2, DVOLT2,
                        CWIND , DWIND , NUMSAMP, 1)

#Make event 3, later time but covers both event 1 and 2 locations
CTIME3 = 200.0
DTIME3 =  27.0
CLAT_3 =   0.0
DLAT_3 =  50.0
CLON_3 = 120.0
DLON_3 =  70.0
CVOLT3 =   7.5
DVOLT3 =   2.0

data = make_event(data, CTIME3, DTIME3,
                        CLAT_3, DLAT_3,
                        CLON_3, DLON_3,
                        CVOLT3, DVOLT3,
                        CWIND , DWIND , NUMSAMP, 2)

#Make event 4, completely different in terms of wind speed alone
CTIME4 = 200.0
DTIME4 =  27.0
CLAT_4 =   0.0
DLAT_4 =  50.0
CLON_4 = 120.0
DLON_4 =  70.0
CVOLT4 =   7.5
DVOLT4 =   2.0
CWIND4 =   2.0
DWIND4 =   1.0

data = make_event(data, CTIME4, DTIME4,
                        CLAT_4, DLAT_4,
                        CLON_4, DLON_4,
                        CVOLT4, DVOLT4,
                        CWIND4, DWIND4, NUMSAMP, 3)

keys = sorted(data.keys())
with open('sample_file_cluster.csv',"w") as f:
    f.write("#"+" ".join(keys)+"\n")
    for i in range(len(data['longitude'])):
        f.write(" ".join([str(data[key][i]) for key in keys])+"\n")
