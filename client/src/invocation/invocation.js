export default class Invocation {
    constructor() {
        let socketString = "ws://localhost:8888/codex";
        if (process.env.NODE_ENV == "production") socketString = "wss://codex.jpl.nasa.gov/codex";

        this.vars = {
            sockUrl: socketString,
            sockOn: false,
            callbacks: {},
            ccid: 0, //current caller id
            callHistory: []
        };

        this.sock = new WebSocket(this.vars.sockUrl);
        this.sock.onopen = () => {
            console.log("Sock opened on: " + this.vars.sockUrl);
        };
        this.sock.onclose = () => {
            console.log("Sock closed on: " + this.vars.sockUrl);
        };
        this.sock.onmessage = e => {
            let messageValid = false;
            let d;
            try {
                d = JSON.parse(e.data);
                messageValid = true;
            } catch (x) {}

            console.log("%cReceived " + d.cid, "background: #0b8000; padding: 0px 4px 0px 4px;", d);

            if (messageValid) {
                if (d.message === "success") {
                    this.vars.callbacks[d.cid](d);
                } else {
                    console.warn("Warning - Socket message unsuccessful: " + d.message);
                }
                delete this.vars.callbacks[d.cid];
            } else {
                console.warn("WARNING - Invalid message from socket: " + e.data);
            }
        };
    }

    getNewCId() {
        return this.vars.ccid++;
    }

    invoke(call, callback) {
        if (typeof callback === "function") {
            var cid = this.getNewCId();
            call.cid = cid;
            this.vars.callbacks[call.cid] = callback;

            this.vars.callHistory.push(call);
            this.sock.send(JSON.stringify(call));
            console.log(
                "%cSent " + call.cid,
                "background: #005799; padding: 0px 4px 0px 4px;",
                call
            );
        }
    }
}

export let invocation = new Invocation();
