var sock;

function blobToBase64( blob, callback ) {
    var reader = new self.FileReader();
    reader.readAsDataURL( blob );

    reader.onloadend = function () {
        callback( null, reader.result );
    };
}

//Send pieces of each files over the socket synchronously
function process( files ) {

    //for( var j = 0; j < files.length; j++ ) {

        var blob = files[0];
        var buffer;
        var fileReader = new FileReader();
        fileReader.onload = function() {
            buffer = new Buffer( this.result, 'binary' );

            const BYTES_PER_CHUNK = 1024 * 1024;
            // 1MB chunk sizes.
            const SIZE = blob.size;

            var chunk;
            var start = 0;
            var end = BYTES_PER_CHUNK;

            //Send the first chunk
            sock.send( JSON.stringify({
                filename: blob.name,
                chunk: '',
                done: false
            }) );

            sock.onmessage = function(e) {
                const r = JSON.parse( e.data );
                if( r.status === 'streaming' ) {
                    if( start < SIZE ) {
                        chunk = buffer.slice( start, end );
   
                        sock.send( JSON.stringify({
                            filename: blob.name,
                            chunk: chunk.toString('base64'),
                            done: false
                        }) );
            
                        self.postMessage( 'Uploading ' + ( start / SIZE ) );
            
                        start = end;
                        end = start + BYTES_PER_CHUNK;
                    }
                    else {
                        sock.send( JSON.stringify({
                            filename: blob.name,
                            done: true
                        }) );
                    }
                }
                else if( r.status === 'complete' ) {
                    self.postMessage( 'Upload Complete' );
                    sock.close();
                }
                else if( r.status === 'failure' ) {
                    self.postMessage( 'Upload Failed' );
                    sock.close();
                }
            };
        };
        fileReader.readAsArrayBuffer(blob);
    //}
}


self.addEventListener( 'message', function(e) {
    let files = [];
    for( var j = 0; j < e.data.files.length; j++ ) {
        files.push( e.data.files[j] );
    }
    if( files.length > 0 ) {
        let socketString = 'ws://localhost:8888/upload';
        
        if( e.data.NODE_ENV === 'production' )
            socketString = 'wss://codex.jpl.nasa.gov/upload';
    
        sock = new WebSocket( socketString );
        
        sock.onclose = function() {
            console.log( 'Closed Upload Socket' );
        };
        sock.onopen = function() {
            console.log( 'Opened Upload Socket' );
            process( files );
        };

    }

} );