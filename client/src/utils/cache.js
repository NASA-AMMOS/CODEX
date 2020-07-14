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
     * Insert into the cache
     *
     * @param {str} hash hash string to store the blob under
     * @param {ArrayBuffer} blob binary blob to store
     * @param {TypedArray} dtype data type of the array (Uint8Array, Float32Array, etc.)
     */
    add(hash, blob, dtype) {
        this.cache[hash] = blob;
        this.dtypes[dtype] = dtype;
    }

    /**
     * Get a typed array representing the data
     * @param {str} hash string keying the hash array
     * @return {TypedArray} a typed array corresponding to the data stored
     */
    get(hash) {
        this.__guard(hash);

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
