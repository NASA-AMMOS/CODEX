import * as actionTypes from "constants/actionTypes";
import * as utils from "utils/utils";

export function requestServerExport() {
    const request = {
        routine: "download_code"
    };
    const { req } = utils.makeSimpleRequest(request);
    req.then(data => {
        const div = document.createElement("a");
        div.style.display = "none";
        div.href = "data:application/octet-stream;base64," + data.code;
        document.body.appendChild(div);
        div.setAttribute("download", "codex.py");
        div.click();
        document.body.removeChild(div);
    });
    return { type: actionTypes.NO_ACTION };
}
