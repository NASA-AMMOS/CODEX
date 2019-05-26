import * as actionTypes from "constants/actionTypes";

/* eslint import/no-webpack-loader-syntax: off */
import WorkerSocket from "worker-loader!workers/socket.worker";

/**
 * Get a unique id number per idName
 * @param {string} idName
 * Ex: getId( 'cat' ); getId( 'cat' ); getId( 'dog' ); getId( 'cat' );
 *     -> 0, 1, 0, 2
 */
let getIdIds = {};
export const getId = idName => {
    if (getIdIds.hasOwnProperty(idName)) {
        getIdIds[idName]++;
    } else {
        getIdIds[idName] = 0;
    }
    return getIdIds[idName];
};

export function unzip(ary) {
    return ary.reduce((acc, item) => {
        item.forEach((val, idx) => {
            acc[idx] = acc[idx] || [];
            acc[idx].push(val);
        });
        return acc;
    }, []);
}

export function zip(ary) {
    return ary[0].reduce((acc, val, idx) => {
        const newRow = [val];
        for (let i = 1; i < ary.length; i++) {
            newRow.push(ary[i][idx]);
        }
        acc.push(newRow);
        return acc;
    }, []);
}

export function makeSimpleRequest(request) {
    let cancel;
    const req = new Promise((resolve, reject) => {
        const requestObject = {};
        const socketWorker = new WorkerSocket();
        
        socketWorker.addEventListener("message", e => {
            const inMsg = JSON.parse(e.data);

            inMsg.algorithmName = request.algorithmName;
            resolve(inMsg);
        });

        socketWorker.postMessage(
            JSON.stringify({
                action: actionTypes.SIMPLE_REQUEST,
                request
            })
        );

        cancel = _ => {
            socketWorker.postMessage(
                JSON.stringify({
                    action: actionTypes.CLOSE_SOCKET
                })
            );
        };
    });

    return { req, cancel };
}

export function range(start, stop) {
    const values = [];
    for (let i = start; i < stop; i++) {
        values.push(i);
    }
    return values;
}
