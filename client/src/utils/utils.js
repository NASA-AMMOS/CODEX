import * as actionTypes from "constants/actionTypes";
import theme from "styles/theme.scss";
/* eslint import/no-webpack-loader-syntax: off */
import WorkerSocket from "worker-loader!workers/socket.worker";
import StreamSocket from "worker-loader!workers/stream.worker";

import ShelfPack from "@mapbox/shelf-pack";

import { generateCombination } from "gfycat-style-urls";
import { store } from "index";

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

/**
 * Get a new ID
 * @param {number} length (optional, default 5)
 */
export function createNewId(length = 5) {
    const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
    let out = "";
    for (let i = 0; i < length; i++) {
        out += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    return out;
}

/**
 * Create a memorable ID
 */
export function createMemorableId() {
    return generateCombination(3, "", true);
}

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

/**
 * Get the current session key on the application
 */
export function getGlobalSessionKey() {
    return store.getState().data.get("serverSessionKey");
}

export function makeSimpleRequest(request) {
    let cancel;
    const req = new Promise((resolve, reject) => {
        const socketWorker = new WorkerSocket();
        request.sessionkey = getGlobalSessionKey();

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

export function indicesInRange(data, min, max) {
    const indices = [];
    for (let i = 0; i < data.length; i++) {
        if (data[i] >= min && data[i] <= max) {
            indices.push(i);
        }
    }

    return indices;
}

export function createGradientStops(startColor, endColor, numStops) {
    const dummyCanvas = document.createElement("canvas");
    const ctx = dummyCanvas.getContext("2d");
    const grd = ctx.createLinearGradient(0, 0, numStops, 0);
    grd.addColorStop(0, startColor);
    grd.addColorStop(1, endColor);
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, numStops, 1);
    const imgData = ctx.getImageData(0, 0, numStops, 1);

    return [...Array(numStops).keys()].map(
        i =>
            `#${[0, 1, 2]
                .map(v => {
                    let hex = imgData.data[i * 4 + v].toString(16);
                    if (hex.length < 2) hex = "0" + hex;
                    return hex;
                })
                .join("")}`
    );
}

/**
 * Appends a unique id to a given name
 * @return {string} an augmented version of a name if it is not unique
 */
export function getUniqueGroupID(id) {
    const groups = store.getState().selections.groups;

    if (id === null || id === undefined) {
        return "Group " + groups.length;
    } else {
        let numStarting = 0;
        for (let group of groups) {
            if (group.id.substring(0, id.length) === id) numStarting++;
        }
        if (numStarting === 0) return id;
        else return getUniqueGroupID(id + " " + numStarting);
    }
}

/**
 * Make a streaming request to the backend. Calls a callback for every new message
 * @param {object} request request to send
 * @param {function} cb callback function
 * @returns {function} cancel function
 */
export function makeStreamRequest(request, cb) {
    const streamWorker = new StreamSocket();
    request.sessionkey = getGlobalSessionKey();

    let cancel = () => {
        streamWorker.postMessage(
            JSON.stringify({
                action: actionTypes.CLOSE_SOCKET
            })
        );
    };

    streamWorker.addEventListener("message", e => {
        const inMsg = JSON.parse(e.data);
        cb(inMsg);
    });

    streamWorker.postMessage(
        JSON.stringify({
            action: actionTypes.SIMPLE_REQUEST,
            request
        })
    );

    return cancel;
}

/**
 * Removes any row that has sentinel values from a dataset.
 * @param {array} array of data columns
 * @param {object} object with the sentinel values defined
 * @returns {array} data columns, with any row that has sentinel values returned.
 */
export function removeSentinelValues(cols, fileInfo) {
    const sentinelValues = [fileInfo.nan, fileInfo.inf, fileInfo.ninf];

    // If there aren't any sentinel values, avoid filtering.
    if (sentinelValues.every(val => val === null)) return cols;

    return unzip(
        zip(cols).filter(row => {
            return row.every(val => !sentinelValues.includes(val));
        })
    );
}

export function removeSentinelValuesRevised(data, fileInfo) {
    const sentinelValues = [fileInfo.nan, fileInfo.inf, fileInfo.ninf];

    data = data.toJS();

    // If there aren't any sentinel values, avoid filtering.
    if (sentinelValues.every(val => val === null)) return data;

    return unzip(
        zip(data.map(col => col.data)).filter(row => {
            return row.every(val => !sentinelValues.includes(val));
        })
    ).map((dataCol, idx) => Object.assign(data[idx], { data: dataCol }));
}

function getWindowContainerBounds() {
    const windowContainer = document.getElementById("windowContainer");
    const bounds = windowContainer.getBoundingClientRect();
    bounds.width = Math.floor(bounds.width);
    bounds.height = Math.floor(bounds.height);
    return bounds;
}

function createPackingObject(win, idx) {
    return {
        id: idx,
        width: win.get("width"),
        height: win.get("height"),
        winId: win.get("id"),
        x: win.get("x"),
        y: win.get("y")
    };
}

export function getNewWindowPosition(newWindow, windows) {
    // Default to top-left if this is the only window on screen
    if (windows.length === 0)
        return {
            x: 0,
            y: 0
        };

    const bounds = getWindowContainerBounds();
    const currentWindows = windows.filter(win => win.get("x") !== null).map(createPackingObject);

    // Build a matrix of occupied and unoccupied space, adding a 10px buffer to window borders
    const matrix = Array(bounds.height)
        .fill()
        .map((_, y) =>
            Array(bounds.width)
                .fill(0)
                .map((_, x) => true)
        );

    currentWindows.forEach(win => {
        for (let y = win.y; y < win.height + win.y + 10; y++) {
            for (let x = win.x; x < win.width + win.x + 10; x++) {
                matrix[y][x] = false;
            }
        }
    });

    // Search the matrix for available space and return the x and y coordinates if we find some
    let cache = Array(bounds.width).fill(0);
    const stack = [];
    const width = newWindow.get("width");
    const height = newWindow.get("height");

    for (let row = 0; row < bounds.height; row++) {
        cache = cache.map((col, idx) => (matrix[row][idx] ? col + 1 : 0));

        let currentWidth = 0;
        for (let col = 0; col < bounds.width; col++) {
            if (cache[col] >= height) {
                // We've found the start of a box that's tall enough
                currentWidth = cache[col] >= height ? currentWidth + 1 : 0;
            }

            if (currentWidth === width) {
                // And now we have one that's wide enough
                return { y: row - height + 1, x: col - width + 1 };
            }
        }
    }

    // No available space, default to a simpler heuristic
    return {
        x: windows.length * 30 + 10,
        y: windows.length * 30 + 10
    };
}

export function tileWindows(windows) {
    const bounds = getWindowContainerBounds();
    let sprite = new ShelfPack(bounds.width, bounds.height, { autoResize: false });

    // First try tiling windows at their current size.
    let packReqs = windows.map(createPackingObject);
    let packed = sprite.pack(packReqs);

    // Success - we can tile all windows on the first try
    if (packed.length === windows.length)
        return windows.map(win => {
            const packedIdx = packReqs.find(p => p.winId === win.get("id")).id;
            return win.set("x", packed[packedIdx].x).set("y", packed[packedIdx].y);
        });

    return windows;

    // // Shrink windows to their initial size and try tiling again
    // refAry.forEach(([key, cristalObj]) => {
    //     const windowType = props.windows.find(win => win.id === key).windowType;
    //     const { width, height } = windowSettings.initialSizes[windowType];
    //     cristalObj.state.width = width;
    //     cristalObj.state.height = height;
    // });

    // packReqs = createPackingObject(refAry);
    // sprite = new ShelfPack(bounds.width, bounds.height, { autoResize: false }); // For some reason the clear() method doesn't work with batch packing
    // packed = sprite.pack(packReqs);
    // if (packed.length === refAry.length) return tileWindowsFromPackedObject(refAry, packed);

    // console.log("Can't tile windows! Not enough space!");
}

export function getSelectionPalette() {
    return theme.selectionColorOptions
        .replace(/ /g, "")
        .replace(/"/g, "")
        .split(",");
}

export function getRGBFromHex(hex) {
    hex = hex.charAt(0) === "#" ? hex.substr(1) : hex;
    const rgb = parseInt(hex, 16);
    return [(rgb >> 16) & 0xff, (rgb >> 8) & 0xff, rgb & 0xff];
}

export function equalArrays(a, b) {
    if (a.length !== b.length) return false;
    return a.every((val, idx) => val === b[idx]);
}
