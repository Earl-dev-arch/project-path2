import { readFileSync, writeFileSync } from "node:fs";
const p = "index.html";
let s = readFileSync(p, "utf8");

// Fix Discord typo: arc command missing flag parameters.
const d1 = "a0.076 0.076 0 0.084 0.029";
if (s.includes(d1)) {
  s = s.replace(d1, "a0.076 0.076 0 0 0 0.084 0.029");
  console.log("discord arc fixed");
} else console.log("discord fragment not found (already fixed?)");

// Fix Instagram typo: second arc has lost its flags and radius.
const i1 = "a1.150 1.150 0 0 -2.300 Z";
if (s.includes(i1)) {
  s = s.replace(i1, "a1.150 1.150 0 0 0 -0.001 -2.299 Z");
  console.log("instagram arc fixed");
} else console.log("instagram fragment not found (already fixed?)");

writeFileSync(p, s);
