import * as types from "actions/dataTypes";

var socket;

function handleGraphDataRequest(msg) {
    const cid = Math.random()
        .toString(36)
        .substring(8);

    let socketString = "ws://localhost:8888/codex";

    socket = new WebSocket(socketString);

    socket.onclose = function() {
        console.log("Closed Data Socket");
    };

    socket.onopen = function() {
        console.log("Opened Data Socket");
        const outMsg = JSON.stringify({
            routine: "arrange",
            hashType: "feature",
            activity: "get",
            name: msg.selectedFeatures,
            cid
        });

        socket.send(outMsg);
    };

    // TODO: Use a transferable object to return the data array so we aren't copying it back to the main thread
    socket.onmessage = msg => {
        const inMsg = JSON.parse(msg.data);
        self.postMessage(JSON.stringify({ action: "data", data: inMsg.data }));
    };
}

self.addEventListener("message", function(e) {
    const msg = JSON.parse(e.data);
    switch (msg.action) {
        case types.GET_GRAPH_DATA:
            handleGraphDataRequest(msg);
            break;
    }
});
