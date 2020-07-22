class BootlegCache {
    constructor() {
        this.dtypes   = {}
        this.loaded   = {}
    }

    /**
     * Make a cache key
     * @param {str} name feature name
     * @param {obj} options options object (set downsample)
     * @return {str} cache key
     */
    make_key(name, {downsample}) {
        if (downsample) {
            return `feature:${name}/downsample/${downsample}`
        }
        return `feature:${name}`
    }


    /**
     * Check if cache has a key
     * @param {str} key cache key
     * @return {boolean} true if exists
     */
    has(key) {
        return (key in this.loaded && key in this.dtypes)
    }

    /**
     * Save into cache
     * @param {str} key cache key
     * @param {ArrayBuffer} buf data buffer
     * @param {TypedArray} dtype data type
     */
    set(key, buf, dtype) {
        this.loaded[key] = buf
        this.dtypes[key] = dtype
    }

    /**
     * Resolve a data type from the cache
     * @param {str} key cache key
     * @return {TypedArray} typed array from the cache
     */
    get(key) {
        if (!this.has(key)) {
            console.warn(`Cache key '${key}' does not exist!`)
        } else {
            return new this.dtypes[key](this.loaded[key])
        }
    }
}


class BootlegCodex {
    constructor(api_url, session) {
        this.session = session || `bootleg_${this.create_id()}`

        this.api_url = api_url

        this.features = []
        this.cache = new BootlegCache()
    }

    /* --- HELPERS --- */

    /**
     * Create an ID
     * @return {str} an identifier
     */
    create_id() {
        const alphabet = 'abcdef012345679'
        let id = ''
        for (let i = 0; i < 5; i++) {
            id += alphabet[Math.floor(Math.random() * alphabet.length)]
        }
        return id
    }


    /**
     * Buffer to base64
     * @param {Uint8Array} bytes arraybuffer-backed typed array of uint8's
     * @return {str} buffer str
     */
    arr_to_b64(bytes) {
        let binary = '';
        const len = bytes.length;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode( bytes[ i ] );
        }
        return window.btoa( binary );
    }

    /**
     * Create URL
     * @param {str} path  request path
     * @param {obj} query object containing k/v query params
     * @return {str} assembled URL
     */
    create_url(path, query) {
        const params = new URLSearchParams()

        for (let key in query) {
            if (query[key] !== null) {
                params.append(key, query[key])
            }
        }

        return `http://${this.api_url}/${path}?${params.toString()}`
    }

    /**
     * Map string to dtype constructor.
     * @param {str} dtype_str string representation of datatype
     * @return {TypedArray} array constructor
     */
    str_to_type(dtype_str) {
        let map = {
            'float32': Float32Array,
            'float64': Float64Array
        }

        return map[dtype_str]
    }


    /* --- CACHING --- */


    /* --- UPLOADER --- */

    /**
     * Upload a file to the server
     * @param {File} file_obj file object to upload
     *
     * @return {Promise} Promise that resolves on the conclusion of the file upload
     */
    async upload_file(file_obj) {
        console.log(file_obj.name)
        // create a buffer so we can chunk it
        const buf = await file_obj.arrayBuffer()

        console.log('buf len: ' + buf.byteLength)

        // will transfer in 1MiB chunks
        const CHUNK_SIZE = 1024 * 1024


        const make_chunk = (num) => {

            const size = Math.min(CHUNK_SIZE, (buf.byteLength - (num * CHUNK_SIZE)))

            return {
                sessionkey: this.session,
                filename: file_obj.name,
                done: false,
                chunk: this.arr_to_b64(
                    new Uint8Array(buf, num * CHUNK_SIZE, size)
                )
            }
        }

        // set up a websocket
        const upload = new WebSocket(`ws://${this.api_url}/upload`)

        // wait for it to open
        await new Promise((resolve, reject) => {
            upload.addEventListener('open', () => {
                resolve()
            })
        })

        // create the promise that will end the upload
        let end_prom = new Promise((resolve, reject) => {
            upload.addEventListener('message', m => {
                m = JSON.parse(m.data)

                if (m.status === 'complete') {
                    resolve(m)
                }
            })
        })

        // the end case here ensures that the last chunk will be sent even if it
        // is not quite long enough for a full chunk
        for (let i = 0; i <= (buf.byteLength / CHUNK_SIZE); i++) {
            console.log('sending chunk ' + i)
            upload.send(JSON.stringify(make_chunk(i)))
        }

        // finish the upload for real
        upload.send(JSON.stringify({
            sessionkey: this.session,
            filename: file_obj.name,
            done: true,
            chunk: ''
        }))

        // wait for the go-ahead from the server
        const stats = await end_prom

        this.features = stats.feature_names
    }

    /* --- FEATURE DOWNLOADING --- */

    /**
     * Resolve a feature
     * @param {str} name feature name
     * @param {int} downsample downsample or null
     * @return {Promise} promise that resolves to the feature
     */
    async get_feature(name, downsample) {
        downsample = downsample || null

        if (!this.features.includes(name)) {
            console.error(`No feature named '${name}'!`)
            return []
        }

        const key = this.cache.make_key(name, {downsample})

        // if we don't have this in the cache, then get the cache.
        if (!this.cache.has(key)) {
            const url = this.create_url('api/feature', {
                session: this.session,
                name,
                downsample
            })
            console.log(url)

            const res = await fetch(url)

            console.log(res.headers.get('X-Data-Type'))
            const dtype = this.str_to_type(
                res.headers.get('X-Data-Type')
            )


            const buf = await res.arrayBuffer()

            this.cache.set(key, buf, dtype)
        }

        return this.cache.get(key)
    }
}
