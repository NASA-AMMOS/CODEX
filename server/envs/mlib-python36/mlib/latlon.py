# -----------------------------------------------------------------
# -----------------------------------------------------------------
#
#  Mandrake lib (mlib) for cool tricks on lat/lon maps or with data
#  associated.
#
# -----------------------------------------------------------------
# -----------------------------------------------------------------

import numpy as N
import mlib.numeric as NUM
import mlib.mtime
import mlib.progressbar
import collections as C
import mlib.iterable as I
import mlib.mtypes
import scipy.spatial as spsp
from pprint import pprint as PP
from mlib.progressbar import bar_nospam

METERS_PER_DEGREE_AT_EQUATOR = 111.0e3


# This wrapper chunks a time record by day, so the quadratic algorithm to find small areas doesn't go crazy
def find_coastal_small_areas_chunk(lon_lnd, lat_lnd, time_lnd, lon_sea, lat_sea, time_sea, max_distance_km,
                                   min_soundings_to_consider_sa=4, make_graphs=False, progressbar=False, sample_rate=1):
    TIME_GAP_TO_SEPARATE_CHUNKS = 15 * 60.0  # Bigger than 15 minutes, no way to span a small area across this

    # Inputs must be time-sorted for small area derivation and chunk size calculation
    timeorder_lnd = N.lexsort((time_lnd,))
    lon_lnd = lon_lnd[timeorder_lnd]
    lat_lnd = lat_lnd[timeorder_lnd]
    time_lnd = time_lnd[timeorder_lnd]

    timeorder_sea = N.lexsort((time_sea,))
    lon_sea = lon_sea[timeorder_sea]
    lat_sea = lat_sea[timeorder_sea]
    time_sea = time_sea[timeorder_sea]

    # First seek time breaks in time_lnd that identify seperate chunks (less land data, so this is efficient)
    # Note that these are index pairs to be used as (pair[0]:pair[1]) in the standard Python way.
    chunk_time_ranges_i = NUM.list_to_intervals(NUM.find_breaks_in_list(time_lnd, TIME_GAP_TO_SEPARATE_CHUNKS))
    print("Num chunks:", len(chunk_time_ranges_i))

    # Master list of small area ID's to return to user for each sounding (not time ordered)
    SA_lnd = N.zeros(len(time_lnd), dtype='int') - 1
    SA_sea = N.zeros(len(time_sea), dtype='int') - 1
    indices_lnd = N.arange(len(time_lnd))
    indices_sea = N.arange(len(time_sea))

    # Scroll through the time_breaks and process each chunk independently
    if progressbar:
        lister = bar_nospam(chunk_time_ranges_i)
    else:
        lister = chunk_time_ranges_i
    start_new_SA = 0
    for chunk_range_i in lister:
        # Get the associated window of time_sea that corresponds to this land chunk, plus & minus half the time gap
        # definition
        mask_sea = NUM.inr(time_sea,
                           time_lnd[chunk_range_i[0]] - TIME_GAP_TO_SEPARATE_CHUNKS / 2.0,
                           time_lnd[chunk_range_i[1] - 1] + TIME_GAP_TO_SEPARATE_CHUNKS / 2.0)

        # Get the range of indices this chunk pair will utilize
        chunk_indices_lnd = N.arange(chunk_range_i[0], chunk_range_i[1], 1)
        # Calculate the actual SA assignments on this sub-chunk, if any are found
        (chunk_SA_lnd,
         chunk_SA_sea) = find_coastal_small_areas(lon_lnd[chunk_indices_lnd], lat_lnd[chunk_indices_lnd],
                                                  time_lnd[chunk_indices_lnd],
                                                  lon_sea[mask_sea], lat_sea[mask_sea], time_sea[mask_sea],
                                                  max_dist_km=max_distance_km,
                                                  min_soundings_to_consider_sa=min_soundings_to_consider_sa,
                                                  make_graphs=False, progressbar=False,
                                                  assume_time_order=True)

        # Have to increase SA id's as we append them to the larger, non-chunked set, but only if they're not -1
        # special value
        chunk_SA_lnd[chunk_SA_lnd >= 0] += start_new_SA
        chunk_SA_sea[chunk_SA_sea >= 0] += start_new_SA
        start_new_SA = max(start_new_SA, N.max(chunk_SA_lnd) + 1)

        # handle time ordering when assigning chunk to SA
        SA_lnd[indices_lnd[timeorder_lnd][chunk_indices_lnd]] = chunk_SA_lnd
        SA_sea[indices_sea[timeorder_sea][mask_sea]] = chunk_SA_sea

    return SA_lnd, SA_sea


# Find coastal small areas in order of the highest data density per Coastal Small Area. Remove these points from
# consideration and continue looking for additional small areas until we can't find something suitable. Considers all
#  LND points as centers for Coastal Small Areas, as there's many less of these than ocean in general Sample_rate
# shows how many sounding id's should be skipped in initial SA size estimate (1 = consider everything, 2 = skip every
#  other). this is due to the extreme cost of evaluating every indices in a large dataset. This will make the SA's
# chosen not quite optimal. However, metrics show little actual difference and massive speedup. assume_time_order
# causes the function to skip ordering by time, assuming all is already well.
def find_coastal_small_areas(lon_lnd, lat_lnd, time_lnd,
                             lon_sea, lat_sea, time_sea,
                             max_dist_km, min_soundings_to_consider_sa=4, make_graphs=False, progressbar=False,
                             sample_rate=1, assume_time_order=False):
    max_duration_seconds_sa = 5 * 60.0  # number of seconds over-estimating how large a CSA can be

    # subfunction that calculates the size of an actual CSA if formed at this lnd point
    def SA_size(curindex,
                mask_lnd,
                mask_sea,
                times_lnd, lons_lnd, lats_lnd,
                times_sea, lons_sea, lats_sea,
                maxdist_km, maxtime):
        # Mask first affects results by assuring that there is a 0 size SA possibility on a masked out point
        if not mask_lnd[curindex]: return 0, [], []

        # Mask also affects results by preventing the use of any other masked out point
        # To achieve this, return ridiculous times for those that are masked out
        curtime = times_lnd[curindex]
        curlon = lons_lnd[curindex]
        curlat = lats_lnd[curindex]

        #        print "Curtime, lon, lat",curtime,curlon,curlat

        # only examine remotely possible times, to avoid needless computation Note that anywhere that is not in the
        # available mask has 5e9 seconds subtracted from its time, removing it from consideration This takes all
        # masking into consideration in returned results
        mask_time_lnd = N.abs(times_lnd - curtime - 5e10 * ~mask_lnd) <= maxtime
        mask_time_sea = N.abs(times_sea - curtime - 5e10 * ~mask_sea) <= maxtime

        #        print "Matching time points",N.sum(mask_time_lnd),N.sum(mask_time_sea)

        # check for spatial constraints within time mask, /2.0 to ensure entire distance span is < maxdist_km
        mask_space_lnd = latlon_to_km_distance(lons_lnd[mask_time_lnd],
                                               lats_lnd[mask_time_lnd],
                                               curlon, curlat) <= maxdist_km / 2.0
        mask_space_sea = latlon_to_km_distance(lons_sea[mask_time_sea],
                                               lats_sea[mask_time_sea],
                                               curlon, curlat) <= maxdist_km / 2.0

        #        print "Matching space & time points",N.sum(mask_space_lnd),N.sum(mask_space_sea)

        # count of this CSA is the minimum number of lnd or sea points present within
        num_SA = min(N.sum(mask_space_lnd), N.sum(mask_space_sea))

        # Select out the indices that would be included in this CSA
        indices_SA_lnd = N.arange(len(times_lnd))[mask_time_lnd][mask_space_lnd]
        indices_SA_sea = N.arange(len(times_sea))[mask_time_sea][mask_space_sea]
        return num_SA, indices_SA_lnd, indices_SA_sea

    # Form coastal small area ID's that specify which data is in which small areas.
    # These are the returned ID's per data point that the user wants (final output)
    SA_lnd = N.zeros(len(time_lnd), dtype='int') - 1
    SA_sea = N.zeros(len(time_sea), dtype='int') - 1

    # Sort the data for simplicity, but record the original order and its mapping to time-sorted AFTER being matched
    #    print "Sorting"
    if not assume_time_order:
        timeorder_lnd = N.lexsort((time_lnd,))
        timeorder_sea = N.lexsort((time_sea,))
        lon_lnd = lon_lnd[timeorder_lnd]
        lat_lnd = lat_lnd[timeorder_lnd]
        time_lnd = time_lnd[timeorder_lnd]
        lon_sea = lon_sea[timeorder_sea]
        lat_sea = lat_sea[timeorder_sea]
        time_sea = time_sea[timeorder_sea]
    else:
        timeorder_lnd = N.arange(len(time_lnd))
        timeorder_sea = N.arange(len(time_sea))

    indices_lnd = N.arange(len(time_lnd))
    indices_sea = N.arange(len(time_sea))
    if sample_rate == 1:
        indices_lnd_sampled = indices_lnd
        time_lnd_sampled = time_lnd
    else:
        indices_lnd_sampled = indices_lnd[::sample_rate]
        time_lnd_sampled = time_lnd[indices_lnd_sampled]

    # Record for the current datapoints that may or may not be considered for future SA's
    # A mask per sounding_id of data we know we no longer need to worry about, NOT SUBSAMPLED, TIME ORDERED
    mask_lnd_available = N.ones((len(indices_lnd),), dtype='bool')
    mask_sea_available = N.ones((len(indices_sea),), dtype='bool')

    if make_graphs:
        import pylab as P
        import mlib.log
        import mlib.plot as MP;
        MP.init()
        maxsize = None

    SA_cur = 0
    last_SA_count = min_soundings_to_consider_sa
    last_SA_indices = indices_lnd
    potential_SA_counts = indices_lnd_sampled * 0
    potential_SA_lnd_indices = [None, ] * len(indices_lnd_sampled)
    potential_SA_sea_indices = [None, ] * len(
        indices_lnd_sampled)  # This has size of indices_lnd because that's how many "arrangements" we're considering
    first_loop = True

    if progressbar:
        # progressbar is based on the mask of what soundings are still available, so bar is a tad longer than it should be
        bar = mlib.progressbar.ProgressBar(N.sum(mask_lnd_available))
        bar.start()
        subsample_period = N.sum(mask_lnd_available) / 2000

    while last_SA_count >= min_soundings_to_consider_sa:

        # update progress bar with how many soundings are still available for SA formation But only do it every once
        # in awhile or it overwhelms the log file with millions of progress bar images for Gigs of crap
        if progressbar and (N.random.randint(subsample_period) == 0):
            bar.update(N.sum(~mask_lnd_available))

        if make_graphs:
            print("Forming map of available SA sizes")
            T = mlib.log.start_time()

        # Figure out how much we need to update the time-series of available SA sizes
        lo_time = N.min(time_lnd[last_SA_indices])
        hi_time = N.max(time_lnd[last_SA_indices])
        mask_update_sampled = (time_lnd_sampled > lo_time - max_duration_seconds_sa) & (
                time_lnd_sampled < hi_time + max_duration_seconds_sa)

        # potential_SAs is an array of (SA_size, (indices used)). Complex, and not an Ndarray. So can't MASK into it,
        #  but can slice
        if progressbar and first_loop:
            print("Updating potential sizes of SA's")
            bar2 = mlib.progressbar.ProgressBar(N.sum(mask_update_sampled))
            bar2.start()

        sizes_and_indices = [None, ] * N.sum([mask_update_sampled])

        for c, i in enumerate(indices_lnd_sampled[mask_update_sampled]):
            # sizes_and_indices is now a very complex structure
            # it is (CSA_size, indices_lnd, indices_sea)
            sizes_and_indices[c] = SA_size(i,
                                           mask_lnd_available,
                                           mask_sea_available,
                                           time_lnd,
                                           lon_lnd,
                                           lat_lnd,
                                           time_sea,
                                           lon_sea,
                                           lat_sea,
                                           max_dist_km,
                                           max_duration_seconds_sa)
            if progressbar and first_loop: bar2.update(c)
        if progressbar and first_loop:
            bar2.finish()
            print
            first_loop = False

        potential_SA_counts[mask_update_sampled] = [x[0] for x in sizes_and_indices]

        if make_graphs: old = potential_SA_counts.copy()

        # Unbelievably annoying syntatic requirement to access this list of lists. Copy over each element directly?!
        # Assumes consecutive, but time-sorting guarentees that
        for c, i in enumerate(N.where(mask_update_sampled)[0]):
            potential_SA_lnd_indices[i] = sizes_and_indices[c][
                1]  # These indices lists are NOT sampled but whole array relevant
            potential_SA_sea_indices[i] = sizes_and_indices[c][
                2]  # These indices lists are NOT sampled but whole array relevant

        if make_graphs:
            print(mlib.log.log_time_and_mem(T, "Update size graph", SA_cur))

        # Pick the densest CSA in the (sampled) space
        pick_index = N.argmax(potential_SA_counts)
        last_SA_lnd_indices = potential_SA_lnd_indices[pick_index]
        last_SA_sea_indices = potential_SA_sea_indices[pick_index]
        last_SA_count = potential_SA_counts[pick_index]

        # If this is too small to count as a sounding, continue and trigger loop end
        if last_SA_count < min_soundings_to_consider_sa: continue

        #        print "Selected",SA_cur,last_SA_count

        # apply back to the original SA record, including the time ordering
        if N.max(SA_lnd[indices_lnd[timeorder_lnd][last_SA_lnd_indices]]) >= 0:
            print("WARNING! Overwriting existing SA lnd assignment")
            print("Picked index", pick_index, "for count", last_SA_count)
            #            print "Existing mask_available:",mask_available
            print("Count surface", potential_SA_counts[last_SA_indices])
            print("mask_available for chosen indices:", mask_available[last_SA_indices])
            print("Existing SA id assignment:", SA[indices[timeorder]])
            print("Would overwrite:", SA[indices[timeorder][last_SA_indices]])
            raise Exception("Attempting to overwrite existing SA assignment with new assignment")

        SA_lnd[indices_lnd[timeorder_lnd][last_SA_lnd_indices]] = SA_cur
        SA_sea[indices_sea[timeorder_sea][last_SA_sea_indices]] = SA_cur

        # Update mask with new forbidden points
        mask_lnd_available[last_SA_lnd_indices] = False
        mask_sea_available[last_SA_sea_indices] = False

        if make_graphs:
            print("Graphing debug plots of SA size plots vs index")
            # DEBUG plot the SA_size bins to show what we just selected
            if maxsize is None:
                maxsize = N.max(potential_SA_counts)
            P.close('all')
            P.plot(range(len(old)), old, 'b.', alpha=0.5, markersize=2, label='before selection')
            P.hold(True)
            P.plot(range(len(potential_SA_counts)), potential_SA_counts, 'r.', alpha=0.5, markersize=2,
                   label='after selection')
            P.xlabel('indices')
            P.title('Num soundings/SA, iter %04d, size %04d' % (SA_cur, last_SA_count))
            P.grid(True, alpha=0.5)
            P.ylim(0, maxsize)
            MP.nicelegend()
            P.savefig('potential_SA_count_grid_%04d.png' % SA_cur, dpi=150)

        #        print "Accepted SA",SA_cur,"with numpoints",last_SA_count,"unassigned",N.sum(mask_available)

        SA_cur += 1

    if progressbar:
        bar.finish()
        print

    return N.array(SA_lnd, dtype=int), N.array(SA_sea, dtype=int)


# This wrapper chunks a time record by day, so the quadratic algorithm to find small areas doesn't go crazy
def find_small_areas_chunk(lon, lat, time, max_distance_km, min_soundings_to_consider_sa=4,
                           max_time_gap_seconds=20 * 60,
                           make_graphs=False, progressbar=False, sample_rate=1):
    """ Splits up the observations to form into small areas into chunks separated by time gaps that could never be contained within a small area.
    This allows the O(N^2) small area algorithm to perform nearly O(N).

    Args:
        lon : 1D array of longitudes
        lat : 1D array of latitudes
        time: 1D array of time(seconds)
        max_distance_km: The largest distance span of a single small area possible
        min_soundings_to_consider_sa: smallest number of soundings within the small area to tolerate
        max_time_gap_seconds: The time gap that no small area could span. Defines the chunk divisions. GOSAT = 25*60, OCO2 = 5*60
        make_graphs: Produce diagnostic graphs of the Small Area process as you go
        progressbar: Use a progressbar to observe chunk progress
        sample_rate: Permits solutions for SA to only be sought every N observations.
                     Runtime is divided by this number, but only approximate solutions are then returned.
                     Leave at 1 for optimal solution.

    """

    # Inputs must be time-sorted for small area derivation and chunk size calculation
    timeorder = N.lexsort((time,))
    lon = lon[timeorder]
    lat = lat[timeorder]
    time = time[timeorder]

    # First seek time breaks that identify seperate chunks
    # Note that these are index pairs to be used as (pair[0]:pair[1]) in the standard Python way.
    chunk_time_ranges_i = NUM.list_to_intervals(NUM.find_breaks_in_list(time, max_time_gap_seconds))
    print("Num chunks:", len(chunk_time_ranges_i))

    # Master list of small area ID's to return to user for each sounding (not time ordered)
    SA = N.zeros(len(time), dtype='int') - 1
    indices = N.arange(len(SA))

    # Scroll through the time_breaks and process each chunk independently
    if progressbar:
        lister = bar_nospam(chunk_time_ranges_i)
    else:
        lister = chunk_time_ranges_i
    start_new_SA = 0
    for chunk_range_i in lister:
        # Get the range of indices this chunk pair will utilize
        chunk_indices = N.arange(chunk_range_i[0], chunk_range_i[1], 1)
        # Calculate the actual SA assignments on this sub-chunk, if any are found
        chunk_SA = find_small_areas(lon[chunk_indices], lat[chunk_indices], time[chunk_indices], max_distance_km,
                                    min_soundings_to_consider_sa=min_soundings_to_consider_sa,
                                    make_graphs=False, progressbar=False, sample_rate=sample_rate,
                                    assume_time_order=True)

        # Have to increase SA id's as we append them to the larger, non-chunked set, but only if they're not -1
        # special value
        chunk_SA[chunk_SA >= 0] += start_new_SA
        start_new_SA = max(start_new_SA, N.max(chunk_SA) + 1)

        # handle time ordering when assigning chunk to SA
        SA[indices[timeorder][chunk_indices]] = chunk_SA

    return SA


# Find small areas in a single dataset in order of the highest data density per Small Area specification is found.
# Remove these points from consideration and continue looking for additional small areas until we can't find
# something suitable. Sample_rate shows how many sounding id's should be skipped in initial SA size estimate (1 =
# consider everything, 2 = skip every other). this is due to the extreme cost of evaluating every indices in a large
# dataset. This will make the SA's chosen not quite optimal. However, metrics show little actual difference and
# massive speedup. assume_time_order causes the function to skip ordering by time, assuming all is already well.
def find_small_areas(lon, lat, time, max_dist_km, min_soundings_to_consider_sa=4,
                     make_graphs=False, progressbar=False, sample_rate=1, assume_time_order=False):
    max_duration_seconds_sa = 3 * 60.0  # number of seconds over-estimating how large a SA can be

    # subfunction that calculates the size of an actual SA if formed at this point
    def SA_size(curindex, mask, times, lons, lats, maxdist_km, maxtime):
        # Mask first affects results by assuring that there is a 0 size SA possibility on a masked out point
        if not mask[curindex]: return 0, []
        # Mask also affects results by preventing the use of any other masked out point
        # To achieve this, return ridiculous times for those that are masked out
        curtime = times[curindex]
        curlon = lons[curindex]
        curlat = lats[curindex]
        this_indices = N.arange(len(times))
        # only examine remotely possible times, to avoid needless computation Note that anywhere that is not in the
        # available mask has 5e9 seconds subtracted from its time, removing it from consideration This takes all
        # masking into consideration in returned results
        mask_time = N.abs(times - curtime - 5e10 * ~mask) <= maxtime
        # check for spatial constraints within time mask, /2.0 to ensure entire distance span is < maxdist_km
        mask_space = latlon_to_km_distance(lons[mask_time], lats[mask_time], curlon, curlat) <= maxdist_km / 2.0
        num_SA = N.sum(mask_space)
        indices_SA = this_indices[mask_time][mask_space]
        return num_SA, indices_SA

    # Form small area ID's that specify which data is in which small areas.
    # These are the returned ID's per data point that the user wants (final output)
    SA = N.zeros(len(time), dtype='int') - 1

    # Sort the data for simplicity, but record the original order and its mapping to time-sorted AFTER being matched
    #    print "Sorting"
    if not assume_time_order:
        timeorder = N.lexsort((time,))
        lon = lon[timeorder]
        lat = lat[timeorder]
        time = time[timeorder]
    else:
        timeorder = N.arange(len(time))

    indices = N.arange(len(time))
    if sample_rate == 1:
        indices_sampled = indices
        time_sampled = time
    else:
        indices_sampled = indices[::sample_rate]
        time_sampled = time[indices_sampled]

    # Record for the current datapoints that may or may not be considered for future SA's
    # A mask per sounding_id of data we know we no longer need to worry about, NOT SUBSAMPLED, TIME ORDERED
    mask_available = N.ones((len(indices),), dtype='bool')

    if make_graphs:
        import pylab as P
        import mlib.log
        maxsize = None

    SA_cur = 0
    last_SA_count = min_soundings_to_consider_sa
    last_SA_indices = indices
    potential_SA_counts = indices_sampled * 0
    potential_SA_indices = [None, ] * len(indices_sampled)
    first_loop = True

    if progressbar:
        # progressbar is based on the mask of what soundings are still available, so bar is a tad longer than it
        # should be
        bar = mlib.progressbar.ProgressBar(N.sum(mask_available))
        bar.start()

    while last_SA_count >= min_soundings_to_consider_sa:

        # update progress bar with how many soundings are still available for SA formation
        if progressbar: bar.update(N.sum(~mask_available))

        if make_graphs:
            print("Forming map of available SA sizes")
            T = mlib.log.start_time()

        # Figure out how much we need to update the time-series of available SA sizes
        lo_time = N.min(time[last_SA_indices])
        hi_time = N.max(time[last_SA_indices])
        mask_update_sampled = (time_sampled > lo_time - max_duration_seconds_sa) & (
                time_sampled < hi_time + max_duration_seconds_sa)

        # potential_SAs is an array of (SA_size, (indices used)). Complex, and not an Ndarray. So can't MASK into it,
        #  but can slice
        if progressbar and first_loop:
            print("Updating potential sizes of SA's")
            bar2 = mlib.progressbar.ProgressBar(N.sum(mask_update_sampled))
            bar2.start()

        sizes_and_indices = [None, ] * N.sum([mask_update_sampled])

        for c, i in enumerate(indices_sampled[mask_update_sampled]):
            sizes_and_indices[c] = SA_size(i,
                                           mask_available,
                                           time,
                                           lon,
                                           lat,
                                           max_dist_km,
                                           max_duration_seconds_sa)
            if progressbar and first_loop: bar2.update(c)
        if progressbar and first_loop:
            bar2.finish()
            print
            first_loop = False

        if make_graphs: old = potential_SA_counts.copy()

        potential_SA_counts[mask_update_sampled] = [x[0] for x in sizes_and_indices]

        # Unbelievably annoying syntatic requirement to access this list of lists. Copy over each element directly?!
        # Assumes consecutive, but time-sorting guarentees that
        for c, i in enumerate(N.where(mask_update_sampled)[0]):
            potential_SA_indices[i] = sizes_and_indices[c][
                1]  # These indice lists are NOT sampled but whole array relevant

        if make_graphs:
            print(mlib.log.log_time_and_mem(T, "Update size graph", SA_cur))

        # Pick the densest SA in the (sampled) space
        pick_index = N.argmax(potential_SA_counts)
        last_SA_indices = potential_SA_indices[pick_index]
        last_SA_count = potential_SA_counts[pick_index]

        # If this is too small to count as a sounding, continue and trigger loop end
        if last_SA_count < min_soundings_to_consider_sa: continue

        # apply back to the original SA record, including the time ordering
        if N.max(SA[indices[timeorder][last_SA_indices]]) >= 0:
            print("WARNING! Overwriting existing SA assignment")
            print("Picked index", pick_index, "for count", last_SA_count)
            #            print "Existing mask_available:",mask_available
            print("Count surface", potential_SA_counts[last_SA_indices])
            print("mask_available for chosen indices:", mask_available[last_SA_indices])
            print("Existing SA id assignment:", SA[indices[timeorder]])
            print("Would overwrite:", SA[indices[timeorder][last_SA_indices]])
            raise Exception("Attempting to overwrite existing SA assignment with new assignment")

        SA[indices[timeorder][last_SA_indices]] = SA_cur

        # Update mask with new forbidden points
        mask_available[last_SA_indices] = False

        if make_graphs:
            print("Graphing debug plots of SA size plots vs index")
            # DEBUG plot the SA_size bins to show what we just selected
            if maxsize is None:
                maxsize = N.max(potential_SA_counts)
            P.close('all')
            P.plot(range(len(old)), old, 'b.', alpha=0.5, markersize=2)
            P.hold(True)
            P.plot(range(len(potential_SA_counts)), potential_SA_counts, 'r.', alpha=0.5, markersize=2)
            P.xlabel('indices')
            P.title('Num soundings/SA, iter %04d' % SA_cur)
            P.grid(True, alpha=0.5)
            P.ylim(0, maxsize)
            P.savefig('potential_SA_count_grid_%04d.png' % SA_cur, dpi=150)

        #        print "Accepted SA",SA_cur,"with numpoints",last_SA_count,"unassigned",N.sum(mask_available)

        SA_cur += 1

    if progressbar:
        bar.finish()
        print

    return SA


# -------------------------------
def mask_out_coastless(lon, lat):
    """
    This routine masks out regions wherein no coastline can ever be found
    This speeds up routines seeking coastlines, mostly by removing dense ocean points
    """

    # min lat, max lat, min lon, max lon
    regions_to_remove = {'South Pacific south of Easter Island': (-90, -29, -174, -80),
                         'North Pole': (65, 90, -180, 180),
                         'South Pole': (-90, -60, -180, 180),
                         'South Atlantic 1': (-53, -20, -38, -13),
                         'South Atlantic 2': (-50, -34, -54, -13.5),
                         'Equatorial Atlantic': (10, 36.5, -58.5, -27),
                         'South Indian Ocean': (-7.5, -37, 64, 96),
                         'Arctic Ocean': (74, 157, -44.5, -90),
                         'Central Pacific': (-7, 45, -126, -153),
                         'South Pacific north of Easter Island': (-25, 17.5, -105.5, -137),
                         'West of Australia': (-12, -90, 99.5, 111),
                         'SW Pacific': (49, -11.7, 177, 180),
                         'SW Pacific 2': (49, -11.7, -180, -160.5),
                         'South Pacific east of Easter Island': (-3, -90, -82, -106),
                         'South of Africa': (-36.5, -90, -32, 67),
                         'Bay of Bengal': (19.5, -90, 90, 87),
                         'North Pacific': (40, -1.6, 145, 180),
                         'North Pacific 2': (40, -1.6, -180, -160.5)
                         }

    mask = N.ones(len(lat), dtype='bool')

    for region in regions_to_remove:
        mask[NUM.inr(lat, *regions_to_remove[region][:2]) &
             NUM.inr(lon, *regions_to_remove[region][2:])] = False

    return mask


# -------------------------------
def latlon_to_km_distance(lon1, lat1, lon2, lat2):
    """Calculate the great circle distance between two points on the earth (specified in decimal degrees). Haversine.
    """
    # convert decimal degrees to radians
    lon1, lat1, lon2, lat2 = map(N.deg2rad, [lon1, lat1, lon2, lat2])
    # haversine formula
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = N.sin(dlat / 2) ** 2 + N.cos(lat1) * N.cos(lat2) * N.sin(dlon / 2) ** 2
    c = 2.0 * N.arcsin(N.sqrt(a))
    km = 6367.0 * c

    return km


# -------------------------------
def ensure_integer_full_sounding_ids(sounding_ids):
    """Checks for and verifies that soundings are of the proper OCO-2 format and are in integer representation.

    Args:
        sounding_ids: Either string or N.int64 format
    Returns:
        sounding_ids: in N.int64 format

    Correct string case
    >>> sounding_ids = ("2006010101010111", #full frame
    ...                 "2006010101010112",
    ...                 "2006010101010113",
    ...                 "2006010101010114",
    ...                 "2006010101010115",
    ...                 "2006010101010116",
    ...                 "2006010101010117",
    ...                 "2006010101010118",
    ...                 "2006010101010223", #half frame
    ...                 "2006010101010224",
    ...                 "2006010101010225",
    ...                 "2006010101010226",
    ...                 "2006010101010333", #single frame
    ...                 "2006010101010444") #single frame

    >>> ensure_integer_full_sounding_ids(sounding_ids)
    array([2006010101010111, 2006010101010112, 2006010101010113,
           2006010101010114, 2006010101010115, 2006010101010116,
           2006010101010117, 2006010101010118, 2006010101010223,
           2006010101010224, 2006010101010225, 2006010101010226,
           2006010101010333, 2006010101010444])

    Correct int case
    >>> sounding_ids = (2006010101010111, 2006010101010112, 2006010101010113)
    >>> ensure_integer_full_sounding_ids(sounding_ids)
    (2006010101010111, 2006010101010112, 2006010101010113)

    Incorrect string case
    >>> sounding_ids = ("20060101010101", "20060101010101")
    >>> ensure_integer_full_sounding_ids(sounding_ids)
    Traceback (most recent call last):
    Exception: Must provide sounding_ids that include YYYYMMDDHHMMSSRF

    Empty case
    >>> ensure_integer_full_sounding_ids(())
    ()

    """

    if len(sounding_ids) < 1: return sounding_ids

    # Ensure sounding_ids are integers
    if not mlib.mtypes.isint(sounding_ids[0]):
        if mlib.mtypes.isstr(sounding_ids[0]):
            sounding_ids = N.array([N.int64(x) for x in sounding_ids])
        else:
            raise Exception("Unknown data passed as sounding_ids: %s" % (type(sounding_ids[0])))
    # Ensure integer sounding_ids are of sufficient length to include footprints
    if N.min(sounding_ids) < 1000000000000000:
        raise Exception("Must provide sounding_ids that include YYYYMMDDHHMMSSRF")

    return sounding_ids


# -------------------------------
def mask_complete_frames(sounding_ids, min_footprints_per_frame=8):
    """Return mask for only those frames with sufficient footprints per frame.

    Args:
        sounding_ids            : sounding ids (OCO-2 style) of the form YYYYMMDDHHMMSSRF where R is fractional second and F is footprint # 1-8
        min_footprints_per_frame: Frames with less than this number of member footprints will not be selected
    Returns:
        mask                    : Boolean Numpy mask of only those soundings within sufficiently full frames

    >>> sounding_ids = ("2006010101010111", #full frame
    ...                 "2006010101010112",
    ...                 "2006010101010113",
    ...                 "2006010101010116",
    ...                 "2006010101010117",
    ...                 "2006010101010118",
    ...                 "2006010101010223", #half frame
    ...                 "2006010101010224",
    ...                 "2006010101010114",
    ...                 "2006010101010115",
    ...                 "2006010101010225",
    ...                 "2006010101010226",
    ...                 "2006010101010333", #single frame
    ...                 "2006010101010444") #single frame
    >>> sounding_ids = N.array(sounding_ids)

    Should only keep single full frame
    >>> sorted(sounding_ids[mask_complete_frames (sounding_ids, min_footprints_per_frame = 8)])
    ['2006010101010111', '2006010101010112', '2006010101010113', '2006010101010114', '2006010101010115', '2006010101010116', '2006010101010117', '2006010101010118']

    Should keep full and half frame
    >>> sorted(sounding_ids[mask_complete_frames (sounding_ids, min_footprints_per_frame = 4)])
    ['2006010101010111', '2006010101010112', '2006010101010113', '2006010101010114', '2006010101010115', '2006010101010116', '2006010101010117', '2006010101010118', '2006010101010223', '2006010101010224', '2006010101010225', '2006010101010226']

    Should keep all frames
    >>> sorted(sounding_ids[mask_complete_frames (sounding_ids, min_footprints_per_frame = 1)])
    ['2006010101010111', '2006010101010112', '2006010101010113', '2006010101010114', '2006010101010115', '2006010101010116', '2006010101010117', '2006010101010118', '2006010101010223', '2006010101010224', '2006010101010225', '2006010101010226', '2006010101010333', '2006010101010444']

    Empty case
    >>> mask_complete_frames ( () )
    array([], dtype=bool)

    """

    if len(sounding_ids) < 1: return N.array((), dtype=bool)

    sounding_ids = ensure_integer_full_sounding_ids(sounding_ids)

    # drop footprints
    frames = sounding_ids / 10

    # Eliminate any frames that aren't sufficiently complete to include
    counts = C.Counter(frames)
    mask = N.array([counts[x] >= min_footprints_per_frame for x in frames])

    return mask


# -------------------------------
def mask_following_footprints(lons, lats, sounding_ids, orbits,
                              max_delta_angle_degrees=2.5,
                              min_footprints_per_frame=6,
                              progressbar=False):
    """Find soundings whose frames are aligned with the spacecraft's ground track.
    This algorithm cannot positively identify a following footprint frame at the precise end of an orbit's soundings.
    I call these following footprints; OCO-2 calibration calls them Streak Fleats (ugh!)

    Args:
        lons                    : iterable of longitudes
        lats                    : iterable of latitudes
        sounding_ids            : sounding ids (OCO-2 style) of the form YYYYMMDDHHMMSSRF where R is fractional second and F is footprint # 1-8
        orbits                  : Each orbit should be handled separately (natural chunking)
        max_delta_angle_degrees : The maximum difference between frame angle and ground track heading to determine following_footstep
        min_footprints_per_frame: Frames with less than this number of member footprints will not be selected
        progressbar             : Display a progress bar for user feedback


    >>> sounding_ids = N.array(
    ...                (2006010101010111, #full frame
    ...                 2006010101010112,
    ...                 2006010101010113,
    ...                 2006010101010114,
    ...                 2006010101010115,
    ...                 2006010101010116,
    ...                 2006010101010117,
    ...                 2006010101010118,
    ...                 2006010101010223, #half frame
    ...                 2006010101010224,
    ...                 2006010101010225,
    ...                 2006010101010226,
    ...                 2006010101010333, #single frame
    ...                 2006010101010444, #single frame
    ...                 2006010101020111, #full frame 1 minute later
    ...                 2006010101020112,
    ...                 2006010101020113,
    ...                 2006010101020114,
    ...                 2006010101020115,
    ...                 2006010101020116,
    ...                 2006010101020117,
    ...                 2006010101020118,
    ...                 2006010101110111, #full frame 10 minutes later
    ...                 2006010101110112,
    ...                 2006010101110113,
    ...                 2006010101110114,
    ...                 2006010101110115,
    ...                 2006010101110116,
    ...                 2006010101110117,
    ...                 2006010101110118,
    ...                 2006010102010111, #full frame 60 minutes later
    ...                 2006010102010112,
    ...                 2006010102010113,
    ...                 2006010102010114,
    ...                 2006010102010115,
    ...                 2006010102010116,
    ...                 2006010102010117,
    ...                 2006010102010118) )

    >>> num = len(sounding_ids)

    Spacecraft drifting only east
    >>> spacecraft_lon = N.array( (0,)*8 + (1,)*4 + (2,) * 1 + (3,) * 1 + (4,) * 8 + (5,) * 8 + (6,) * 8)
    >>> spacecraft_lat = (0,)*num
    >>> orbits = (1,)*num

    Footprints arrayed also only west-east in footprint order, varying by .001 to .008 longitude from spacecraft location
    >>> footprint_dlon = (sounding_ids%10) / 100.0
    >>> footprint_dlat = (0,)*num

    Should only take last full-8 frames (3)
    >>> mask_following_footprints (spacecraft_lon + footprint_dlon,
    ...                           spacecraft_lat + footprint_dlat,
    ...                           sounding_ids,
    ...                           orbits,
    ...                           max_delta_angle_degrees = 4,
    ...                           min_footprints_per_frame = 6)
    array([ True,  True,  True,  True,  True,  True,  True,  True, False,
           False, False, False, False, False,  True,  True,  True,  True,
            True,  True,  True,  True,  True,  True,  True,  True,  True,
            True,  True,  True, False, False, False, False, False, False,
           False, False], dtype=bool)

    Now should also take half-4 frame
    >>> mask_following_footprints (spacecraft_lon + footprint_dlon,
    ...                           spacecraft_lat + footprint_dlat,
    ...                           sounding_ids,
    ...                           orbits,
    ...                           max_delta_angle_degrees = 4,
    ...                           min_footprints_per_frame = 4)
    array([ True,  True,  True,  True,  True,  True,  True,  True,  True,
            True,  True,  True, False, False,  True,  True,  True,  True,
            True,  True,  True,  True,  True,  True,  True,  True,  True,
            True,  True,  True, False, False, False, False, False, False,
           False, False], dtype=bool)

    Test a very large list
    >>> num = int(1e4)
    >>> sounding_ids = [2001010101010123 + x for x in range(num)]
    >>> lons         = N.linspace(-170, 170, num)
    >>> lats         = N.linspace(-89 ,  89, num)
    >>> orbits       = (1,)*num
    >>> len(mask_following_footprints (lons, lats, sounding_ids, orbits))
    10000

    """

    if len(lats) * len(lons) == 0:
        return N.array([], dtype=bool)

    # Validate input
    if N.max(lats) > 90 or N.min(lats) < -90:
        raise Exception("Invalid values passed for latitudes")
    # Ensure sounding_ids are valid integers
    sounding_ids = ensure_integer_full_sounding_ids(sounding_ids)

    num = len(sounding_ids)

    # Setup return values
    mask_following_footprints = N.zeros(num, dtype=bool)
    indices = N.arange(num)

    # Sort all inputs by sounding_id to ensure frame ordering assumptions are upheld
    # Unfortunately does copy data
    sounding_ids, lons, lats, orbits, indices = NUM.sort_arrays_by_first(sounding_ids, lons, lats, orbits, indices)

    # Scroll through the time_breaks and process each chunk independently
    if progressbar:
        lister = bar_nospam(NUM.sortunique(orbits))
    else:
        lister = NUM.sortunique(orbits)

    orbit_dict = {}
    for orbit in lister:
        orbit_mask = orbits == orbit
        olats = lats[orbit_mask]
        olons = lons[orbit_mask]
        osids = sounding_ids[orbit_mask]
        oind = indices[orbit_mask]

        # Must gather up frames to perform calculations
        frame_ids = N.array([x[:15] for x in osids.astype('string')])
        footprints = N.array([N.int8(x[15]) - 1 for x in osids.astype('string')])
        frame_unique = N.unique(frame_ids)

        # if min_footprints_per_frame == 4:
        #     import pdb
        #     pdb.set_trace()

        # Compute between sequential frames to figure out heading
        frame_dict = {}
        for i in range(len(frame_unique) - 1):
            mask1 = frame_ids == frame_unique[i]
            footprints1 = footprints[mask1]

            # Disregard frames1 with too few footprints
            if len(footprints1) < min_footprints_per_frame: continue

            lats1 = olats[mask1]
            lons1 = olons[mask1]

            mask2 = frame_ids == frame_unique[i + 1]
            footprints2 = footprints[mask2]

            lats2 = olats[mask2]
            lons2 = olons[mask2]

            # Ensure at least 1 common footprint in frame 1 and frame 2
            common_footprints = N.in1d(footprints1, footprints2)
            if N.sum(common_footprints) < 1: continue

            # Pick first matching footprint common to both frames and calculate heading from that
            pickone = footprints1[common_footprints][0]
            heading = calculate_compass_bearing((lats1[footprints1 == pickone][0], lons1[footprints1 == pickone][0]),
                                                (lats2[footprints2 == pickone][0], lons2[footprints2 == pickone][0]))

            # Calculate the frame alignment for frame 1
            alignment = calculate_compass_bearing((lats1[0], lons1[0]),
                                                  (lats1[-1], lons1[-1]))

            # Compare heading and alignment (want to be nearly the same, or 180 apart is OK too)
            # Disregard if greater than tolerance
            da = delta_angle(alignment, heading)
            if ((da > max_delta_angle_degrees) and
                    (delta_angle(da, 180) > max_delta_angle_degrees)): continue

            # Keep frame 1, mask back to master list
            mask_following_footprints[oind[mask1]] = True

    return mask_following_footprints


# #------------------------------- def mask_following_footsteps_notwork (lons, lats, sounding_ids, max_angle_degrees
# = 4, min_footprints_per_frame = 6, ground_track_secs = 600.0, progressbar = False, n_jobs = 10): """Find soundings
# whose frames are aligned with the spacecraft's ground track. I call these following footsteps; OCO-2 calibration
# calls them Streak Fleats (ugh!)

#     Args:
#         lons                    : iterable of longitudes
#         lats                    : iterable of latitudes
#         sounding_ids            : sounding ids (OCO-2 style) of the form YYYYMMDDHHMMSSRF where R is fractional
#                                   second and F is footprint # 1-8
#         max_angle_degrees       : The maximum difference between frame angle and ground track heading to determine
#                                    following_footstep
#         ground_track_secs       : How far back in time to look at frames to determine ground track vector
#         min_footprints_per_frame: Frames with less than this number of member footprints will not be selected
#         progressbar             : Display a progress bar for user feedback
#         n_jobs                  : The number of jobs to spawn, -1 equals the number of cores, 1 means single thread,
#                                    default 10


#     >>> sounding_ids = N.array(
#     ...                (2006010101010111, #full frame
#     ...                 2006010101010112,
#     ...                 2006010101010113,
#     ...                 2006010101010114,
#     ...                 2006010101010115,
#     ...                 2006010101010116,
#     ...                 2006010101010117,
#     ...                 2006010101010118,
#     ...                 2006010101010223, #half frame
#     ...                 2006010101010224,
#     ...                 2006010101010225,
#     ...                 2006010101010226,
#     ...                 2006010101010333, #single frame
#     ...                 2006010101010444, #single frame
#     ...                 2006010101020111, #full frame 1 minute later
#     ...                 2006010101020112,
#     ...                 2006010101020113,
#     ...                 2006010101020114,
#     ...                 2006010101020115,
#     ...                 2006010101020116,
#     ...                 2006010101020117,
#     ...                 2006010101020118,
#     ...                 2006010101110111, #full frame 10 minutes later
#     ...                 2006010101110112,
#     ...                 2006010101110113,
#     ...                 2006010101110114,
#     ...                 2006010101110115,
#     ...                 2006010101110116,
#     ...                 2006010101110117,
#     ...                 2006010101110118,
#     ...                 2006010102010111, #full frame 60 minutes later
#     ...                 2006010102010112,
#     ...                 2006010102010113,
#     ...                 2006010102010114,
#     ...                 2006010102010115,
#     ...                 2006010102010116,
#     ...                 2006010102010117,
#     ...                 2006010102010118) )

#     >>> num = len(sounding_ids)

#     Spacecraft drifting only east
#     >>> spacecraft_lon = N.array( (0,)*8 + (1,)*4 + (2,) * 1 + (3,) * 1 + (4,) * 8 + (5,) * 8 + (6,) * 8)
#     >>> spacecraft_lat = (0,)*num

#     Footprints arrayed also only west-east in footprint order, varying by .001 to .008 longitude
#     from spacecraft location
#     >>> footprint_dlon = (sounding_ids%10) / 100.0
#     >>> footprint_dlat = (0,)*num

#     Should only take first two full-8 frames
#     >>> mask_following_footsteps_notwork (spacecraft_lon + footprint_dlon,
#     ...                           spacecraft_lat + footprint_dlat,
#     ...                           sounding_ids,
#     ...                           max_angle_degrees = 4,
#     ...                           min_footprints_per_frame = 6)
#     array([ True,  True,  True,  True,  True,  True,  True,  True, False,
#            False, False, False, False, False,  True,  True,  True,  True,
#             True,  True,  True,  True, False, False, False, False, False,
#            False, False, False, False, False, False, False, False, False,
#            False, False], dtype=bool)

#     Now should also take half-4 frame
#     >>> mask_following_footsteps_notwork (spacecraft_lon + footprint_dlon,
#     ...                           spacecraft_lat + footprint_dlat,
#     ...                           sounding_ids,
#     ...                           max_angle_degrees = 4,
#     ...                           min_footprints_per_frame = 4)
#     array([ True,  True,  True,  True,  True,  True,  True,  True,  True,
#             True,  True,  True, False, False,  True,  True,  True,  True,
#             True,  True,  True,  True, False, False, False, False, False,
#            False, False, False, False, False, False, False, False, False,
#            False, False], dtype=bool)

#     Now should take only full-8 frames but all of them
#     >>> mask_following_footsteps_notwork (spacecraft_lon + footprint_dlon,
#     ...                           spacecraft_lat + footprint_dlat,
#     ...                           sounding_ids,
#     ...                           max_angle_degrees = 4,
#     ...                           min_footprints_per_frame = 6, ground_track_secs = 60*60*24)
#     array([ True,  True,  True,  True,  True,  True,  True,  True, False,
#            False, False, False, False, False,  True,  True,  True,  True,
#             True,  True,  True,  True,  True,  True,  True,  True,  True,
#             True,  True,  True,  True,  True,  True,  True,  True,  True,
#             True,  True], dtype=bool)

#     Test a very large list
#     >>> num = int(1e5)
#     >>> sounding_ids = [2001010101010123 + x for x in range(num)]
#     >>> lons         = N.linspace(-170, 170, num)
#     >>> lats         = N.linspace(-89 ,  89, num)
#     >>> len(mask_following_footsteps_notwork (lons, lats, sounding_ids))
#     100000

#     """

#     #Validate input
#     if N.max(lats) > 90 or N.min(lats) < -90:
#         raise Exception("Invalid values passed for latitudes")
#     #Ensure sounding_ids are valid integers
#     sounding_ids = ensure_integer_full_sounding_ids(sounding_ids)

#     num = len(sounding_ids)

#     #Sort for easier frame counting and processing
#     matching_indices = N.arange(num)
#     sounding_ids, matching_indices, lons, lats = NUM.sort_arrays_by_first(sounding_ids, matching_indices, lons, lats)

#     #Convert sounding_ids into frame and footprint
#     footprints   = sounding_ids%10
#     #drop footprints
#     frames = sounding_ids/10

#     #Remove incomplete frames
#     mask = mask_complete_frames (sounding_ids, min_footprints_per_frame = min_footprints_per_frame)
#     frames, matching_indices, footprints, lons, lats = frames[mask], matching_indices[mask], footprints[mask],
#     lons[mask], lats[mask]

#     #Determine frame alignments and mean lat/lons
#     indices_per_frame, frames_unique  = NUM.indices_per_group_id ( frames, sort_indices = True )
#     frames_unique, indices_per_frames = NUM.sort_arrays_by_first(frames_unique, indices_per_frame)

#     lats_per_frame = [ lats[indices_per_frame[i]] for i in range(len(indices_per_frame)) ]
#     lons_per_frame = [ lons[indices_per_frame[i]] for i in range(len(indices_per_frame)) ]
#     mean_lat_per_frame = [ N.mean(x) for x in lats_per_frame ]
#     mean_lon_per_frame = [ N.mean(x) for x in lons_per_frame ]
#     footprint_bearing_per_frame = [ calculate_compass_bearing ( ( _lats[0], _lons[0] ), ( _lats[-1],
#    _lons[-1] ) ) for _lats, _lons in zip(lats_per_frame, lons_per_frame) ]

#     #Determine nearest neighbor to each frame to determine ground track bearing
#     time_tree = spsp.cKDTree(N.atleast_2d(frames_unique).T, balanced_tree = False)

#     #Here is the memory explosion! Neighor_indices gets absolutely massive for large datasets.
#     #Must process each chunk all the way into track_bearing, then drop list as no longer needed
#     track_bearing_per_frame = []
#     CHUNK_SIZE = 10000
#     for i_chunk in range(0,len(frames_unique), CHUNK_SIZE):
#         frames_unique_chunk = frames_unique[i_chunk:i_chunk+CHUNK_SIZE]
#         neighbor_indices = time_tree.query_ball_point ( x = N.atleast_2d(frames_unique_chunk).T,
#                                                         r = ground_track_secs*10, p = 1, n_jobs = n_jobs )

#         #Process neighbor lists to determine bearing
#         for i_frame in range( len( frames_unique_chunk ) ):

#         #If there was only a single neighbor and nothing else, can't compute meaningful ground track bearing
#             if len(neighbor_indices[i_frame]) < 2:
#                 track_bearing_per_frame.append ( N.nan )
#                 continue

#             ind = N.array(neighbor_indices[i_frame])

#             bearing = calculate_compass_bearing( (mean_lat_per_frame[ind[ 0]], mean_lon_per_frame[ind[ 0]]) ,
#                                                  (mean_lat_per_frame[ind[-1]], mean_lon_per_frame[ind[-1]]) )

#             track_bearing_per_frame.append ( bearing )

#     #Turn bearings into dictionaries for fast lookup
#     track_bearing_per_frame     = dict( zip( frames_unique,     track_bearing_per_frame ) )
#     footprint_bearing_per_frame = dict( zip( frames_unique, footprint_bearing_per_frame ) )

#     #Compare footprint bearing with track bearing for each individual sounding (not just unique soundings)

#     #With is required for nan processing, else Warnings generated
#     with N.errstate(invalid='ignore'):
#         mask_following_footstep = [ N.abs( delta_angle(track_bearing_per_frame    [_frame],
#                                                        footprint_bearing_per_frame[_frame]) )
#                                                        < max_angle_degrees for _frame in frames ]

#     matching_indices = matching_indices[N.array(mask_following_footstep)]

#     #map back to original sounding order
#     mask_following_footstep = N.zeros(num, dtype = bool)
#     mask_following_footstep[matching_indices] = True

#     return mask_following_footstep

# -------------------------------
def calculate_compass_bearing(pointA, pointB):
    """ Calculates the bearing between two lat,lon points.
    Does not handle well through poles; answers are rubbish.
    (by Jerome Renard: https://gist.github.com/jeromer)

    Args:
        pointA: Tuple (lat, lon) of first point
        pointB: Tuple (lat, lon) of second point
    Returns:
        bearing: Compass bearing in degrees

    Straight north
    >>> calculate_compass_bearing( (0, 0), (1, 0) )
    0.0

    Straight East
    >>> calculate_compass_bearing( (0, 0), (0, 1) )
    90.0

    Straight South
    >>> calculate_compass_bearing( (0, 0), (-1, 0) )
    180.0

    Straight West
    >>> calculate_compass_bearing( (0, 0), (0, -1) )
    270.0

    Degenerate case on north pole!
    Code doesn't handle this
    >>> calculate_compass_bearing( (90, 0), (90, 90) )
    45.0

    Nan case
    >>> calculate_compass_bearing( (0, 0), (0, N.nan) )
    nan

    """
    if (type(pointA) != tuple) or (type(pointB) != tuple):
        raise TypeError("Only tuples are supported as arguments")

    lat1 = N.deg2rad(pointA[0])
    lat2 = N.deg2rad(pointB[0])

    diffLong = N.deg2rad(pointB[1] - pointA[1])

    x = N.sin(diffLong) * N.cos(lat2)
    y = N.cos(lat1) * N.sin(lat2) - (N.sin(lat1) * N.cos(lat2) * N.cos(diffLong))

    initial_bearing = N.arctan2(x, y)

    # Now we have the initial bearing but N.arctan2 return values
    # from -180 to +180 which is not what we want for a compass bearing
    # The solution is to normalize the initial bearing as shown below
    initial_bearing = N.rad2deg(initial_bearing)
    compass_bearing = (initial_bearing + 360) % 360

    return compass_bearing


# -------------------------------
# def mask_latlon_ellipse(lon1,lat1,lon2,lat2,max_lat_at_equator,max_lon_at_equator):
#     """ Returns a mask for pop1 """
#     ratio = max_lon_at_equator / float(max_lat_at_equator)
#     max_dist = mlib.latlon.latlon_to_km_distance_NS_EW(max_lon_at_equator, max_lat_at_equator, 0.0, 0.0)

#     for i in range(num1):
#        dist_lon, dist_lat = mlib.latlon.latlon_to_km_distance_NS_EW(lon1[i           ], lat1[i           ],
#                                                                     lon2[matches[i,:]], lat2[matches[i,:]] )
#        rmask = dist_lon*dist_lon + ratio*ratio * dist_lat*dist_lat < max_dist[0]*max_dist[0]
#        matches[i,:][matches[i,:]] = rmask

# -------------------------------
def latlon_to_km_distance_NS_EW(lon1, lat1, lon2, lat2):
    """Calculate the great circle distance between two points on the
    Earth, but return it as the North-South and East-West components separately.
    Haversine related.
    Returns km_distance_lon, km_distance_lat

    >>> latlon_to_km_distance_NS_EW(0.0,0.0,1.0,0.0)
    (111.12511347447897, 0.0)

    >>> latlon_to_km_distance_NS_EW(0.0,0.0,0.0,1.0)
    (0.0, 111.12511347447897)

    >>> latlon_to_km_distance_NS_EW(0.0,0.0,1.0,1.0)
    (111.12229243698749, 111.12229243698746)

    Nearer the poles, angular distance means less physical distance.
    >>> latlon_to_km_distance_NS_EW(70.0,70.0,71.0,71.0)
    (82.836822136133506, 82.836822136133492)

    >>> lon1 = [ 0, 1, 2, 3]
    >>> lat1 = [ 0, 1, 2, 3]
    >>> lon2 = [10,11,12,13]
    >>> lat2 = [10,11,12,13]
    >>> latlon_to_km_distance_NS_EW(lon1,lat1,lon2,lat2)
    (array([ 1108.41517211,  1107.48022054,  1106.37698089,  1105.1063056 ]), array([ 1108.41517211,  1107.48022054,  1106.37698089,  1105.1063056 ]))

    >>> latlon_to_km_distance_NS_EW([],[],[],[])
    (nan, nan)

    Handle case where one argument is a singleton while the others are not
    >>> latlon_to_km_distance_NS_EW(lon2,lat2,0,0)
    (array([ 1108.41517211,  1218.59735546,  1328.58931489,  1438.37291571]), array([ 1108.41517211,  1218.59735546,  1328.58931489,  1438.37291571]))

    >>> latlon_to_km_distance_NS_EW(0,0,lon2,lat2)
    (array([ 1108.41517211,  1218.59735546,  1328.58931489,  1438.37291571]), array([ 1108.41517211,  1218.59735546,  1328.58931489,  1438.37291571]))

    """
    # Handle blank array
    if (
            (I.is_iterable(lon1) and len(lon1) == 0) or
            (I.is_iterable(lon2) and len(lon2) == 0) or
            (I.is_iterable(lat1) and len(lat1) == 0) or
            (I.is_iterable(lat2) and len(lat2) == 0)
    ): return N.nan, N.nan

    d = latlon_to_km_distance(lon1, lat1, lon2, lat2)

    # Handle singleton to singleton case
    if I.is_not_iterable(d):
        if lon1 == lon2: return 0.0, d
        angle = N.arctan((lat2 - lat1) / float(lon2 - lon1))
        return N.abs(d * N.cos(angle)), N.abs(d * N.sin(angle))

    dist_lon = d * 0.0
    dist_lat = d * 0.0

    if I.is_iterable(lon1):
        lon1 = N.array(lon1)
        lat1 = N.array(lat1)
    if I.is_iterable(lon2):
        lon2 = N.array(lon2)
        lat2 = N.array(lat2)

    # Handle entirely N/S cases
    mask = lon1 != lon2
    dist_lon[~mask] = 0.0
    dist_lat[~mask] = d[~mask]

    # Force lat/lon to be array at this point for simplicity
    if I.is_not_iterable(lon1): lon1 = N.array([lon1, ] * len(mask))
    if I.is_not_iterable(lon2): lon2 = N.array([lon2, ] * len(mask))
    if I.is_not_iterable(lat1): lat1 = N.array([lat1, ] * len(mask))
    if I.is_not_iterable(lat2): lat2 = N.array([lat2, ] * len(mask))

    # Handle general case
    angle = N.arctan((lat2[mask] - lat1[mask]) / N.float64(lon2[mask] - lon1[mask]))
    dist_lon[mask] = N.abs(d[mask] * N.cos(angle))
    dist_lat[mask] = N.abs(d[mask] * N.sin(angle))
    return dist_lon, dist_lat


# Find geographic and temporal matches between datapoints in two sets,
# mask keeps only points near other points to consider
# max-time should be in same units, but max_dist_meters must be in meters
def mask_mutually_nearby_data_spacetime(lon1, lat1, time1, lon2, lat2, time2, max_dist_meters, max_time,
                                        return_nearest_indices=False):
    # map to x,y,z for a better distance metric for the kdtree
    # assume alt = 0 for conversion

    print("   Translating lat/lon to XYZ")
    (x1, y1, z1) = LLH_to_ECEF_xyz(lon1, lat1, lat1 * 0.0)
    (x2, y2, z2) = LLH_to_ECEF_xyz(lon2, lat2, lat2 * 0.0)

    # mapping between distance and time distances is hard.
    # different units, so need constant to normalize them together
    # then convert two distances into a single permitted distance
    # Do this by normalizing time to have distance units by ratio of permitted ranges
    relative_weight_space_to_time = max_dist_meters / float(max_time)

    # Create a "distance tree" object

    print("   Making trees")
    kdtree1 = spsp.cKDTree(zip(x1, y1, z1, relative_weight_space_to_time * time1))
    kdtree2 = spsp.cKDTree(zip(x2, y2, z2, relative_weight_space_to_time * time2))

    # First look for points in data2 that are sufficiently close to data1
    print("   Mapping set 2 to set 1, nearest neighbor only")
    dists21, indices21 = kdtree1.query(x=zip(x2, y2, z2, relative_weight_space_to_time * time2),
                                       k=1,
                                       p=2,
                                       )
    # mask21 = dists21 < max_dist_meters Now use indices21 to check for TWO independent conditions in space AND time,
    #  not the combined metric used to find nearest neighbor
    print("   Applying hard cutoff matching filter to nearest neighbors")
    mask21 = (
            ((time2 - time1[indices21]) <= max_time) &
            (N.sqrt(
                (x2 - x1[indices21]) ** 2 + (y2 - y1[indices21]) ** 2 + (z2 - z1[indices21]) ** 2) < max_dist_meters)
    )

    # Second look for points in data1 that are sufficiently close to data2
    print("   Mapping set 1 to set 2, nearest neighbor only")
    dists12, indices12 = kdtree2.query(x=zip(x1, y1, z1, relative_weight_space_to_time * time1),
                                       k=1,
                                       p=2,
                                       )
    # mask12 = dists12 < max_dist_meters Now use indices21 to check for TWO independent conditions in space AND time,
    #  not the combined metric used to find nearest neighbor
    print("   Applying hard cutoff matching filter to nearest neighbors")
    mask12 = (
            ((time1 - time2[indices12]) <= max_time) &
            (N.sqrt(
                (x1 - x2[indices12]) ** 2 + (y1 - y2[indices12]) ** 2 + (z1 - z2[indices12]) ** 2) < max_dist_meters)
    )

    # Return the nearest indices as well
    if return_nearest_indices:
        return mask12, mask21, indices12, indices21

    # Just return the mask of nearest data
    return mask12, mask21


# --------------------------
def mask_mutually_nearby_data(lon1, lat1, lon2, lat2, max_dist_meters):
    """ Find geographic (spatial) matches between datapoints in two sets,

    Args:
        lon1            : longitude points (degrees) from population 1
        lat1            : latitude  points (degrees) from population 1
        lon2            : longitude points (degrees) from population 2
        lat2            : latitude  points (degrees) from population 2
        max_dist_meters : Max distance in meters matching points can be away from the opposite set points.

    Returns:
        mask12 : A mask for near points in population 1
        mask21 : A mask for near points in population 2

    A 45 degree line
    >>> pop1_lon = [ 0, 1, 2, 3, 4 ]
    >>> pop1_lat = [ 0, 1, 2, 3, 4 ]

    A crossing 45 degree line
    >>> pop2_lon = [ 0, 1, 2.0001, 3, 4 ]
    >>> pop2_lat = [ 4, 3, 2.0001, 1, 0 ]

    No overlap
    >>> PP(mask_mutually_nearby_data( pop1_lon, pop1_lat, pop2_lon, pop2_lat, 0 ))
    (array([False, False, False, False, False], dtype=bool),
     array([False, False, False, False, False], dtype=bool))

    Extremely strict requirement selects only matching point in the center
    >>> PP(mask_mutually_nearby_data( pop1_lon, pop1_lat, pop2_lon, pop2_lat, 100 ))
    (array([False, False,  True, False, False], dtype=bool),
     array([False, False,  True, False, False], dtype=bool))

    Permit roughly 1 degree of matching
    >>> PP(mask_mutually_nearby_data( pop1_lon, pop1_lat, pop2_lon, pop2_lat, METERS_PER_DEGREE_AT_EQUATOR*1.5 ))
    (array([False,  True,  True,  True, False], dtype=bool),
     array([False,  True,  True,  True, False], dtype=bool))

    Permit roughly 2 degrees of matching
    >>> PP(mask_mutually_nearby_data( pop1_lon, pop1_lat, pop2_lon, pop2_lat, METERS_PER_DEGREE_AT_EQUATOR*3 ))
    (array([ True,  True,  True,  True,  True], dtype=bool),
     array([ True,  True,  True,  True,  True], dtype=bool))

    Empty populations
    >>> PP(mask_mutually_nearby_data( [], [], pop2_lon, pop2_lat, 1 ))
    (array([], dtype=bool), array([False, False, False, False, False], dtype=bool))

    >>> PP(mask_mutually_nearby_data( pop1_lon, pop1_lat, [], [], 1 ))
    (array([False, False, False, False, False], dtype=bool), array([], dtype=bool))

    Nan case is handled automatically, simply won't match anything to the N.nan and it automatically doesn't match anything else
    >>> pop1_lon = [ 0, 1, 2, 3, N.nan ]
    >>> PP(mask_mutually_nearby_data( pop1_lon, pop1_lat, pop2_lon, pop2_lat, METERS_PER_DEGREE_AT_EQUATOR*3 ))
    (array([ True,  True,  True,  True, False], dtype=bool),
     array([ True,  True,  True,  True,  True], dtype=bool))

    Mismatching lat/lon population arrays
    >>> mask_mutually_nearby_data( [], pop1_lat, pop2_lon, pop2_lat, 1 )
    Traceback (most recent call last):
    Exception: Lon and Lat for population 1 must be equal length 0 vs 5

    >>> mask_mutually_nearby_data( pop1_lon, [], pop2_lon, pop2_lat, 1 )
    Traceback (most recent call last):
    Exception: Lon and Lat for population 1 must be equal length 5 vs 0

    >>> mask_mutually_nearby_data( pop1_lon, pop1_lat, [], pop2_lat, 1 )
    Traceback (most recent call last):
    Exception: Lon and Lat for population 2 must be equal length 0 vs 5

    >>> mask_mutually_nearby_data( pop1_lon, pop1_lat, pop2_lon, [], 1 )
    Traceback (most recent call last):
    Exception: Lon and Lat for population 2 must be equal length 5 vs 0
    """

    if len(lon1) != len(lat1): raise Exception(
        'Lon and Lat for population 1 must be equal length %d vs %d' % (len(lon1), len(lat1)))
    if len(lon2) != len(lat2): raise Exception(
        'Lon and Lat for population 2 must be equal length %d vs %d' % (len(lon2), len(lat2)))

    if len(lon1) == 0 or len(lon2) == 0: return N.zeros(len(lon1), dtype=bool), N.zeros(len(lon2), dtype=bool)

    # map to x,y,z for a better distance metric for the kdtree
    # assume alt = 0 for conversion

    (x1, y1, z1) = LLH_to_ECEF_xyz(lon1, lat1, [0.0, ] * len(lat1))
    (x2, y2, z2) = LLH_to_ECEF_xyz(lon2, lat2, [0.0, ] * len(lat2))

    # Create a "distance tree" object

    kdtree1 = spsp.cKDTree(zip(x1, y1, z1))
    kdtree2 = spsp.cKDTree(zip(x2, y2, z2))

    # First look for points in data2 that are sufficiently close to data1
    dists21, indices21 = kdtree1.query(x=zip(x2, y2, z2),
                                       k=1,
                                       p=2,
                                       )
    mask21 = dists21 < max_dist_meters

    # Second look for points in data1 that are sufficiently close to data2
    dists12, indices12 = kdtree2.query(x=zip(x1, y1, z1),
                                       k=1,
                                       p=2,
                                       )
    mask12 = dists12 < max_dist_meters

    return mask12, mask21


# ---------------------------------
def mask_mutually_nearby_data_1D(var1, var2, max_dist):
    """Find direct 1D matches between datapoints in two sets to a given max_distance (say, time).

    Args:
            var1: First  list of elements to consider (symmetric with var2)
            var2: Second list of elements to consider (symmetric with var1)
        max_dist: The maximum distance to consider a matching element

    Returns:
        mask1: A boolean mask array showing which elements of var1 are considered to have matched into var2
        mask2: A boolean mask array showing which elements of var2 are considered to have matched into var1

    Array case
    >>> in1 = N.array([1, 5, 4, 6, 8, 7, 10])
    >>> in2 = N.array([17.1, 11.5, 9.9, 6.9, 4.2])
    >>> PP(mask_mutually_nearby_data_1D ( in1, in2, 2 ))
    (array([False,  True,  True,  True,  True,  True,  True], dtype=bool),
     array([False,  True,  True,  True,  True], dtype=bool))

    Standard case
    >>> PP(mask_mutually_nearby_data_1D ( [1, 2, 3, 4, 5], [1, 0, -1, 2], 1 ))
    (array([ True,  True,  True, False, False], dtype=bool),
     array([ True,  True, False,  True], dtype=bool))

    Only precise matches
    >>> PP(mask_mutually_nearby_data_1D ( [1, 2, 3, 4, 5], [1, 0, -1, 2], 0 ))
    (array([ True,  True, False, False, False], dtype=bool),
     array([ True, False, False,  True], dtype=bool))

    Everything matches
    >>> PP(mask_mutually_nearby_data_1D ( [1, 2, 3, 4, 5], [1, 0, -1, 2], 100 ))
    (array([ True,  True,  True,  True,  True], dtype=bool),
     array([ True,  True,  True,  True], dtype=bool))

    Empty list 1
    >>> PP(mask_mutually_nearby_data_1D ( [], [1,2,3], 1 ))
    (array([], dtype=bool), array([False, False, False], dtype=bool))

    Empty list 2
    >>> PP(mask_mutually_nearby_data_1D ( [1,2,3], [], 1 ))
    (array([False, False, False], dtype=bool), array([], dtype=bool))

    """

    # Handle empty lists
    if len(var1) == 0 or len(var2) == 0: return N.zeros(len(var1), dtype=bool), N.zeros(len(var2), dtype=bool)

    # Ensure we are handling Narrays for indexing purposes
    if not mlib.mtypes.isnarray(var1): var1 = N.array(var1)
    if not mlib.mtypes.isnarray(var2): var2 = N.array(var2)

    # sort times for set 1
    var1s = N.sort(var1)

    # Find the insertion indices of all points in var2 to their location in the sorted var1s list
    # Searchsorted gives the RIGHT-most index of the pair that bracket the insertion point
    R_i = N.searchsorted(var1s, var2)
    R_i = N.minimum(R_i, len(var1s) - 1)
    L_i = N.maximum(R_i - 1, 0)

    # Make a mask for set2 that removes anything not "close" to set1
    mask2 = ((N.abs(var1s[L_i] - var2) <= max_dist) |
             (N.abs(var1s[R_i] - var2) <= max_dist))
    del var1s

    # Remove var2 elements that didn't match var1 close enough.
    # This can speed up the next step considerably, by not attempting to match to points we already know can't match
    # sort times for set 2
    var2s = N.sort(var2[mask2])

    # Find the insertion indices of all points in var1 to their location in the sorted, reduced var2s list
    R_i = N.searchsorted(var2s, var1)
    R_i = N.minimum(R_i, len(var2s) - 1)
    L_i = N.maximum(R_i - 1, 0)

    # Make a mask for set1 that removes anything not "close" to set2
    mask1 = ((N.abs(var2s[L_i] - var1) <= max_dist) |
             (N.abs(var2s[R_i] - var1) <= max_dist))

    # Return masks
    return mask1, mask2


# Find ECEF x,y,z (meters) from lat, lon, altitude
# Assumes lat, lon in degrees and alt in meters
def LLH_to_ECEF_xyz(lon, lat, alt):
    # convert angles to radians
    lat = N.deg2rad(lat)
    lon = N.deg2rad(lon)

    rad = N.float64(6378137.0)  # Radius of the Earth (in meters)
    f = N.float64(1.0 / 298.257223563)  # Flattening factor WGS84 Model

    cosLat = N.cos(lat)
    sinLat = N.sin(lat)
    FF = (1.0 - f) ** 2
    C = 1 / N.sqrt(cosLat ** 2 + FF * sinLat ** 2)
    S = C * FF

    x = (rad * C + alt) * cosLat * N.cos(lon)
    y = (rad * C + alt) * cosLat * N.sin(lon)
    z = (rad * S + alt) * sinLat

    # in meters
    return x, y, z


# Converts latitude/longitude to equivalent grid index
# gridnum is the number of grids being used for the globe
# Assumes -180 to 180 longitude
def lat_to_grid(lat, gridnum):
    return int((lat + 90) / 180.0 * gridnum)


def lon_to_grid(lon, gridnum):
    return int((lon + 180) / 360.0 * gridnum)


# Converts from -180 to 180 longitude range to 0-360 range
def lon_180_to_360(lon_180):
    if I.is_not_iterable(lon_180):
        return lon_180 % 360
    return N.array([x % 360 for x in lon_180])


def lon_360_to_180(lon_360):
    if I.is_not_iterable(lon_360):
        return (lon_360 + 180.0) % 360 - 180.0
    return N.array([(x + 180.0) % 360 - 180.0 for x in lon_360])


# Returns the squared angular distance in degrees for quick comparison of proximity on globe
# Distorts heavily near poles
def angular_distance_squared(coord1_lat, coord1_lon, coord2_lat, coord2_lon):
    return (coord1_lat - coord2_lat) ** 2 + (coord1_lon - coord2_lon) ** 2


# Calculate alignment angle between arbitrary number of points.
# This angle is zero when delta_lat is zero and delta_lon positive
def angular_alignment(lats, lons):
    # Just punt and use the first and last latitude/longitude pairs to figure out slope
    # avoid divide by zero and just return correct answer
    if lons[-1] == lons[0]: return 90.0
    return N.arctan((lats[-1] - lats[0]) / N.float64(lons[-1] - lons[0])) * 180 / N.pi


# Calculate angular heading from two sets of (lat,lon) pairs in terms of theta between equator and current heading
# This angle is zero when delta_lat is zero and delta_lon positive
# Values range from -90 to 90.
# Insensitive to heading speed, just direction. So quadrant -1,-1 is the same as 1,1, as they lie on the same line
# angular_heading = atan(delta_lat/delta_lon) in degrees
def angular_heading(latlon1, latlon2):
    """ Returns angular heading.

    Args:
        latlon1: A tuple (lat, lon) defining the beginning of the vector
        latlon2: A tuple (lat, lon) defining the end       of the vector
    Returns:
        heading: angle from equator (equator = 0, poleward = 90)

    Integer case
    >>> angular_heading( (0, 0), (1, 1) )
    45.0

    Floating case
    >>> angular_heading( (0.0, 0.0), (1.0, 1.0) )
    45.0

    NaN handling
    >>> angular_heading( (0, 0), (1, N.nan) )
    nan

    """

    # avoid divide by zero case of pole-ward heading
    if latlon2[1] == latlon1[1]: return 90.0

    return N.arctan((latlon2[0] - latlon1[0]) / N.float64(latlon2[1] - latlon1[1])) * 180.0 / N.pi


# --------------------------------
def delta_angle(ang1, ang2):
    """
    Finds the delta angle between two angular measurements handling modulo degrees correctly.

    Args:
       ang1 & ang2: May be ints, floats, lists, or Narrays. If both are Narrays, must be of same length.

    Returns:
       delta_lon  : The distance between ang1 and ang2 in degrees. May be singleton or array.

    >>> delta_angle(360, 361)
    1.0

    >>> delta_angle(-900, -902)
    2.0

    Same point test wrapping
    >>> delta_angle (180, -180)
    0.0

    Standard int use
    >>> delta_angle (170, 180)
    10.0

    >>> delta_angle (-170, 180)
    10.0

    Standard float use
    >>> delta_angle (170.0, 180.0)
    10.0

    List case singleton
    >>> delta_angle ((170,), (180,))
    array([ 10.])

    List case Blowup (wrong dimensions)
    >>> delta_angle ((170,180), (180,170,160)) #doctest: +NORMALIZE_WHITESPACE
    Traceback (most recent call last):
    ValueError: operands could not be broadcast together with shapes (2,) (3,)

    List case multiple standard
    >>> delta_angle ((170,180), (180,-170))
    array([ 10.,  10.])

    List case empty
    >>> delta_angle ((),())
    array([], dtype=float64)

    Narray case standard
    >>> delta_angle(N.array((1,2,3)),N.array((4,5,6)))
    array([ 3.,  3.,  3.])

    NaN case
    >>> delta_angle(N.nan, 0)
    nan

    """

    # With is required for nan processing, else Warnings generated
    with N.errstate(invalid='ignore'):
        dist = N.array(ang1) - N.array(ang2)
        return N.min((dist % 360.0, (-dist) % 360.0), axis=0)


# determine which data is within a bounding box around a specific point
# center lat/lon are single values defining the center of the box to accept
# lat_delta, lon_delta are the "radii" along lon and lat directions to include
# lat_array and lon_array hold the possible points to sub-select within the box
def bounding_box(center_lat, center_lon, lat_delta, lon_delta, lat_array, lon_array):
    """
    Creates a mask for data within a specified bounding box (inclusive).
    Handles longitude wrapping correctly.
    All longitudes must be -180 to 180.

    Args:
       center_lat: Center of box latitude
       center_lon: Center of box longitude
       lat_delta : The distance from the center to the maximum latitude  of the box
       lon_delta : The distance from the center to the maximum longitude of the box
       lat_array : Array of lat data to test whether in box or not
       lon_array : Array of lon data to test whether in box or not

    Returns:
       mask      : A mask over the array variables specifying whether in box or not


    >>> box_c_lat = 0
    >>> box_c_lon = 0
    >>> box_d_lat = 10
    >>> box_d_lon = 10

    Singleton testing center of box
    >>> bounding_box (box_c_lat, box_c_lon, box_d_lat, box_d_lon, 0, 0)
    True

    List of internal points
    >>> bounding_box (box_c_lat, box_c_lon, box_d_lat, box_d_lon, (-10, 0, 10), (-10, 0, 10))
    array([ True,  True,  True], dtype=bool)

    List of external points in lat only
    >>> bounding_box (box_c_lat, box_c_lon, box_d_lat, box_d_lon, (-30, -20, -12), (-10, 0, 10))
    array([False, False, False], dtype=bool)

    List of external points in lon only
    >>> bounding_box (box_c_lat, box_c_lon, box_d_lat, box_d_lon, (-10, 0, 10), (-30, -20, -12))
    array([False, False, False], dtype=bool)

    Empty comparison list
    >>> bounding_box (box_c_lat, box_c_lon, box_d_lat, box_d_lon, (), ())
    array([], dtype=bool)

    """

    return (
            (N.abs(N.array(lat_array) - N.array(center_lat)) <= lat_delta) &
            (delta_angle(lon_array, center_lon) <= lon_delta)
    )


# determine which data is within a bounding ellipse around a specific point
# center lat/lon are single values defining the center of the ellipse to accept
# lat_radius, lon_radius are the "radii" along lon and lat directions to include
# lat_array and lon_array hold the possible points to sub-select within the ellipse
def bounding_ellipse(center_lat, center_lon, lat_radius, lon_radius, lat_array, lon_array):
    """
    Creates a mask for data within a specified bounding ellipse (inclusive).
    Handles longitude wrapping correctly.
    All longitudes must be -180 to 180.

    Args:
       center_lat: Center of ellipse latitude
       center_lon: Center of ellipse longitude
       lat_radius: The distance from the center to the maximum latitude  of the ellipse
       lon_radius: The distance from the center to the maximum longitude of the ellipse
       lat_array : Array of lat data to test whether in ellipse or not
       lon_array : Array of lon data to test whether in ellipse or not

    Returns:
       mask      : A mask over the array variables specifying whether in ellipse or not


    >>> ellip_c_lat = 0
    >>> ellip_c_lon = 0
    >>> ellip_d_lat = 10
    >>> ellip_d_lon = 10

    Singleton testing center of box
    >>> bounding_ellipse (ellip_c_lat, ellip_c_lon, ellip_d_lat, ellip_d_lon, 0, 0)
    True

    List of internal points to a box, but corner points are NOT in ellipse
    >>> bounding_ellipse (ellip_c_lat, ellip_c_lon, ellip_d_lat, ellip_d_lon, (-10, 0, 10), (-10, 0, 10))
    array([False,  True, False], dtype=bool)

    List of external points in lat only
    >>> bounding_ellipse (ellip_c_lat, ellip_c_lon, ellip_d_lat, ellip_d_lon, (-30, -20, -12), (-10, 0, 10))
    array([False, False, False], dtype=bool)

    List of external points in lon only
    >>> bounding_ellipse (ellip_c_lat, ellip_c_lon, ellip_d_lat, ellip_d_lon, (-10, 0, 10), (-30, -20, -12))
    array([False, False, False], dtype=bool)

    Empty comparison list
    >>> bounding_ellipse (ellip_c_lat, ellip_c_lon, ellip_d_lat, ellip_d_lon, (), ())
    array([], dtype=bool)

    """

    # scale lon importance down by lat/lon limit to permit elipse rather than circle acceptance
    # calculate angular distance

    return (N.array(lat_array) - center_lat) ** 2 + (
            delta_angle(lon_array, center_lon) * lat_radius / float(lon_radius)) ** 2 <= lat_radius * lat_radius


# if __name__ == "__main__":


# print "\nChecking directional angles" for pointset in [ ( (0,0),( 10,10) ) , ( (0,0),(-10,-10) ) , ( (0,0),(-10,
# 10) ) , ( (0,0),( 10,-10) ) ]: latlon1 = pointset[0] latlon2 = pointset[1] print "angular_heading  :",latlon1,
# latlon2, "%0.2f"%angular_heading  (latlon1, latlon2),"degrees" print "angular_alignment:",latlon1, latlon2,
# "%0.2f"%angular_alignment((latlon1[0],latlon2[0]),(latlon1[1],latlon2[1])),"degrees"

# print "\nChecking lat/lon relations" for pointset in [ ( (0,0),( 10, 5) ) , ( (0,0),(  5,10) )  ]: latlon1 =
# pointset[0] latlon2 = pointset[1] print "angular_heading  :",latlon1, latlon2, "%0.2f"%angular_heading  (latlon1,
# latlon2),"degrees" print "angular_alignment:",latlon1, latlon2, "%0.2f"%angular_alignment((latlon1[0],latlon2[0]),
# (latlon1[1],latlon2[1])),"degrees"

# print "\nChecking extreme angles" for pointset in [ ( (0,0),( 10,0 ) ) , ( (0,0),(  0, 10) ) , ( (0,0),(-10,0 ) ) ,
#  ( (0,0),(  0,-10) ) ]: latlon1 = pointset[0] latlon2 = pointset[1] print "angular_heading  :",latlon1, latlon2,
# "%0.2f"%angular_heading  (latlon1, latlon2),"degrees" print "angular_alignment:",latlon1, latlon2,
# "%0.2f"%angular_alignment((latlon1[0],latlon2[0]),(latlon1[1],latlon2[1])),"degrees"

# --------------------
# ---------------------
# --------------------

if __name__ == "__main__":
    import doctest
    from mlib._doctest import repo_path

    N.set_printoptions(legacy='1.13')
    doctest.testmod()
