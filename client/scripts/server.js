const express = require("express");

const app = express();
const port = 3000;

app.use(express.static("dist"));
app.listen(port);
console.log(`Server running on port ${port}`);
console.log(`To access CODEX client via browser go to: `);
console.log(`   http://localhost:8000`);
