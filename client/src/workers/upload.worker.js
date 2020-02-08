let sock;

let UPLOAD_PERCENTAGE_USEFUL_UPDATE = 0.05;

function blobToBase64(blob, callback) {
    let reader = new self.FileReader();
    reader.readAsDataURL(blob);

    reader.onloadend = function() {
        callback(null, reader.result);
    };
}

//Send pieces of each files over the socket synchronously
function process(files, sessionkey) {
    //for( let j = 0; j < files.length; j++ ) {

    let blob = files[0];
    let buffer;
    let fileReader = new FileReader();
    fileReader.onload = function() {
        buffer = new Buffer(this.result, "binary");

        const BYTES_PER_CHUNK = 1024 * 1024;
        // 1MB chunk sizes.
        const SIZE = blob.size;

        let chunk;
        let start = 0;
        let end = BYTES_PER_CHUNK;

        //Send the first chunk
        sock.send(
            JSON.stringify({
                filename: blob.name,
                chunk: "",
                done: false
            })
        );

        sock.onmessage = function(e) {
            const r = JSON.parse(e.data);
            if (r.status === "streaming") {
                if (start < SIZE) {
                    chunk = buffer.slice(start, end);

                    sock.send(
                        JSON.stringify({
                            filename: blob.name,
                            chunk: chunk.toString("base64"),
                            done: false
                        })
                    );

                    const outMsg = {
                        status: "uploading " + start / SIZE,
                        percent: start / SIZE
                    };
                    if (
                        start / SIZE - self.lastPercentageStatus >
                        UPLOAD_PERCENTAGE_USEFUL_UPDATE
                    ) {
                        self.lastPercentageStatus = start / SIZE;
                        self.postMessage(JSON.stringify(outMsg));
                    }

                    start = end;
                    end = start + BYTES_PER_CHUNK;
                } else {
                    sock.send(
                        JSON.stringify({
                            filename: blob.name,
                            sessionkey,
                            done: true
                        })
                    );
                }
            } else if (r.status === "complete") {
                console.log("Upload Complete");
                self.postMessage(JSON.stringify(Object.assign(r, { filename: blob.name })));
                sock.close();
            } else if (r.status === "failure") {
                self.postMessage("Upload Failed");
                sock.close();
            }
        };
    };
    fileReader.readAsArrayBuffer(blob);
    //}
}

self.addEventListener("message", function(e) {
    // to try to only send useful updates, we'll only send updates when the the percentage
    // is more than 5% different from the previous value. hence, starting at -5 means that we'll
    // be starting on the leading edge (rather than the trailing edge)
    self.lastPercentageStatus = -1 * UPLOAD_PERCENTAGE_USEFUL_UPDATE;
    let files = [];
    for (let j = 0; j < e.data.files.length; j++) {
        files.push(e.data.files[j]);
    }
    if (files.length > 0) {
        let socketString = "ws://localhost:8888/upload";

        if (e.data.NODE_ENV === "production") socketString = "wss://codex.jpl.nasa.gov/upload";

        sock = new WebSocket(socketString);

        sock.onclose = function() {
            console.log("Closed Upload Socket");
        };
        sock.onopen = function() {
            console.log("Opened Upload Socket");
            process(files, e.data.sessionkey);
        };
    }
});
