import * as types from "../constants/actionTypes";

let socket;

function handleGraphDataRequest(msg) {
    const cid = Math.random()
        .toString(36)
        .substring(8);

    let socketString = `${process.env.CODEX_SERVER_URL}/codex`;

    socket = new WebSocket(socketString);

    socket.onclose = function() {
        //console.log("Closed Graph Socket");
    };

    socket.onopen = function() {
        //console.log("Opened Graph Socket");
        const outMsg = JSON.stringify({
            routine: "arrange",
            hashType: "feature",
            sessionkey: msg.sessionkey,
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

function handleAlgorithmRequest(msg) {
    const cid = Math.random()
        .toString(36)
        .substring(8);

    let socketString = "ws://localhost:8888/codex";

    socket = new WebSocket(socketString);

    socket.onclose = function() {
        console.log("Closed Algorithm Socket");
    };

    socket.onopen = function() {
        console.log("Opened Algorithm Socket");
        msg.request.cid = cid;
        const outMsg = JSON.stringify(msg.request);
        socket.send(outMsg);
    };

    // TODO: Use a transferable object to return the data array so we aren't copying it back to the main thread
    socket.onmessage = msg => {
        const inMsg = JSON.parse(msg.data);
        console.log(inMsg);
        if (inMsg.data) self.postMessage(JSON.stringify(inMsg));
    };
}

function handleHelpTextRequest(msg) {
    const socketString = "ws://localhost:8888/codex";
    socket = new WebSocket(socketString);

    socket.onclose = function() {
        console.log("Closed Help Text Socket");
    };

    socket.onopen = function() {
        console.log("Opened Help Text Socket");
        const cid = Math.random()
            .toString(36)
            .substring(8);
        const outMsg = JSON.stringify({
            routine: "guidance",
            guidance: msg.path,
            sessionkey: msg.sessionkey,
            identification: cid,
            cid
        });
        socket.send(outMsg);
    };

    // TODO: Use a transferable object to return the data array so we aren't copying it back to the main thread
    socket.onmessage = msg => {
        const inMsg = JSON.parse(msg.data);
        console.log(inMsg);
        if (inMsg.message === "success") self.postMessage(JSON.stringify(inMsg));
    };
}

function handleSimpleRequest(msg) {
    const socketString = `${process.env.CODEX_SERVER_URL}/codex`;
    socket = new WebSocket(socketString);

    socket.onclose = function() {
        console.log("Closed Request Socket");
    };

    socket.onopen = function() {
        console.log("Opened Request Socket");
        const cid = Math.random()
            .toString(36)
            .substring(8);
        const req = { ...msg.request, cid };
        const outMsg = JSON.stringify(req);
        socket.send(outMsg);
    };

    socket.onmessage = msg => {
        const inMsg = JSON.parse(msg.data);
        console.log(inMsg);
        if (inMsg.message === "success") self.postMessage(JSON.stringify(inMsg));
    };
}

self.addEventListener("message", function(e) {
    const msg = JSON.parse(e.data);
    switch (msg.action) {
        case types.GET_GRAPH_DATA:
            handleGraphDataRequest(msg);
            break;
        case types.GET_ALGORITHM_DATA:
            handleAlgorithmRequest(msg);
            break;
        case types.GET_HELP_TEXT:
            handleHelpTextRequest(msg);
            break;
        case types.SIMPLE_REQUEST:
            handleSimpleRequest(msg);
            break;
        case types.CLOSE_SOCKET:
            if (socket) socket.close();
            break;
    }
});
