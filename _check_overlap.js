const fs = require("fs");
const s = fs.readFileSync("app_scratch.js", "utf8");
const cards = [...s.matchAll(/^\s*name:"([^"]+)",\s*$/gm)].map((m) => m[1]);
const profs = [...s.matchAll(/\{name:'([^']+)',icon:/g)].map((m) => m[1]);
console.log("CARDS", cards.length, JSON.stringify(cards));
console.log("PROFILES", profs.length);
const set = new Set(profs);
console.log("MATCHING NAMES:", JSON.stringify(cards.filter((c) => set.has(c))));
console.log(
  "NON-MATCHING CARDS:",
  JSON.stringify(cards.filter((c) => !set.has(c))),
);
