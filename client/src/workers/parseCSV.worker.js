import Papa from "papaparse";

self.addEventListener("message", function(m) {
    m = m.data;
    var size = m.file.size;
    Papa.parse(m.file, {
        dynamicTyping: true,
        skipEmptyLines: true,
        step: function(row, parser) {
            postMessage({ row: row.data[0], progress: Math.round((row.meta.cursor / size) * 100) });
        },
        complete: function() {
            postMessage("complete");
        }
    });
});
