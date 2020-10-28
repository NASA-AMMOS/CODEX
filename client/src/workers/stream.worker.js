import * as types from "../constants/actionTypes";

let socket;

function handleSimpleRequest(msg) {
    let socketString = `${process.env.CODEX_SERVER_URL}`.replace("https", "wss");
    socket = new WebSocket(socketString);

    socket.onclose = function() {
        console.log("Closed Stream Request Socket");
    };

    socket.onopen = function() {
        console.log("Opened Stream Request Socket");
        const cid = Math.random()
            .toString(36)
            .substring(8);
        const req = { ...msg.request, cid };
        const outMsg = JSON.stringify(req);
        socket.send(outMsg);
    };

    socket.onmessage = msg => {
        const inMsg = JSON.parse(msg.data);
        if (inMsg.message === "success") self.postMessage(JSON.stringify(inMsg));
    };
}

self.addEventListener("message", function(e) {
    const msg = JSON.parse(e.data);
    switch (msg.action) {
        case types.SIMPLE_REQUEST:
            handleSimpleRequest(msg);
            break;
        case types.CLOSE_SOCKET:
            if (socket) socket.close();
            break;
    }
});
