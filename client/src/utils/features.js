import { DEFAULT_DOWNSAMPLE } from "../constants/defaults";
import { getGlobalSessionKey } from "../utils/utils";
import { bcache } from "../index";

/*
 * Format and make a request to the frontend, returning a running Fetch request
 * @param {obj} query object containing query parameters
 * @return {Promise} promise resolving to the response object (headers + body)
 */
export const make_server_feature_request = query => {
    const params = new URLSearchParams();

    for (let key in query) {
        if (query[key]) {
            params.append(key, query[key]);
        }
    }

    const url = `${process.env.CODEX_SERVER_URL}/api/feature?${params.toString()}`;

    return fetch(url);
};

export const resolve_feature_key = (feature_name, downsample = DEFAULT_DOWNSAMPLE) => {
    return bcache.make_key("feature", feature_name, downsample);
};

export const resolve_feature = async (feature_name, downsample = DEFAULT_DOWNSAMPLE) => {
    // check if we've got the key already
    const key = bcache.make_key("feature", feature_name, downsample);

    if (bcache.has(key)) {
        return bcache.get(key);
    }

    // resolve a feature
    const res = await make_server_feature_request({
        name: feature_name,
        downsample: downsample,
        session: getGlobalSessionKey()
    });

    // get the data type from the headers object
    const dtype = bcache.str_to_dtype(res.headers.get("X-Data-Type"));

    // resolve the buffer from the response
    const buf = await res.arrayBuffer();

    bcache.add(key, buf, dtype);

    return bcache.get(key);
};
