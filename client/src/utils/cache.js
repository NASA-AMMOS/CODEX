/**
 * Cache handler for CODEX.
 *
 * This is like a redux store, but unlike a redux store does not require that a
 * copy is made on every change.
 *
 * The cache also stores the data types
 */
class BlobCache {
    constructor() {
        this.cache = {}; // <hash, blob>
        this.dtypes = {}; // <hash, dtype>
    }

    /**
     * Check to see if the requested hash is in the cache, and has an associated
     * data type.
     *
     * @return bool true if it's in there
     */
    has(hash) {
        return hash in this.cache && hash in this.dtypes;
    }

    /**
     * [INTERNAL] Guard the calling method against cache misses
     */
    __guard(hash) {
        if (!this.has(hash)) {
            throw new TypeError(`Cache does not contain hash '${hash}'!`);
        }
    }

    /**
     * Map a data type to a string
     * @param {str} key data type string
     * @return {TypedArray prototype} prototype for corresponding typed array
     */
    str_to_dtype(key) {
        const map = {
            float32: Float32Array,
            float64: Float64Array,

            int8: Int8Array,
            uint8: Uint8Array,

            int16: Int16Array,
            uint16: Uint16Array,

            int32: Int32Array,
            uint32: Uint32Array
        };

        return map[key];
    }

    /**
     * Make a key
     * @param {str} type type of data being stored (metric, feature, etc)
     * @param {str} feature name of data
     * @param {num} downsample (if applicable)
     * @return {str} key
     */
    make_key(type, name, downsample) {
        if (downsample) {
            return `${type}:${name}/downsample/${downsample}`;
        }
        return `${type}:${name}`;
    }

    /**
     * Insert into the cache
     *
     * @param {str} hash hash string to store the blob under
     * @param {ArrayBuffer} blob binary blob to store
     * @param {TypedArray} dtype data type of the array (Uint8Array, Float32Array, etc.)
     */
    add(hash, blob, dtype) {
        this.cache[hash] = blob;
        this.dtypes[hash] = dtype;
    }

    /**
     * Add a native array to the cache
     * @param {str} hash hash to store under
     * @param {Array} arr array to store
     */
    add_native(hash, arr) {
        this.cache[hash] = [...arr];
        this.dtypes[hash] = null;
    }

    /**
     * Get a (typed) array representing the data
     * @param {str} hash string keying the hash array
     * @return {TypedArray} a typed array corresponding to the data stored
     */
    get(hash) {
        this.__guard(hash);

        if (this.dtypes[hash] === null) {
            return this.cache[hash];
        }

        // construct a typed array backed by this entry in the cache
        return new this.dtypes[hash](this.cache[hash]);
    }

    /**
     * Get the underlying raw blob for a hash key
     * @param {str} hash string keying the hash array
     * @return {ArrayBuffer} the underlying blob
     */
    get_raw(hash) {
        this.__guard(hash);

        return this.cache[hash];
    }

    /**
     * Drop a hash
     * @param {str} hash string keying the hash array
     */
    delete(hash) {
        this.__guard(hash);
        delete this.cache[hash];
    }
}

export default BlobCache;
