// Validate each SVG path 'd' in index.html using the same rules a browser uses.
// A number may be followed by another number without separator only if the next
// starts with a sign or a decimal point. Otherwise the path is invalid.
import { readFileSync } from "node:fs";
const s = readFileSync("index.html", "utf8");

const re = /<path[^>]*\sd="([^"]+)"/g;
let m,
  idx = 0;
const bad = [];
const isNum = (t) => /^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(t);

function tokenizeNumbers(args) {
  // Mimic SVG number parsing: numbers can be glued when the next begins with . or sign
  const out = [];
  let i = 0;
  while (i < args.length) {
    const ch = args[i];
    if (ch === " " || ch === "," || ch === "\n" || ch === "\t" || ch === "\r") {
      i++;
      continue;
    }
    let j = i;
    if (args[j] === "+" || args[j] === "-") j++;
    while (j < args.length && /[0-9]/.test(args[j])) j++;
    if (args[j] === ".") {
      j++;
      while (j < args.length && /[0-9]/.test(args[j])) j++;
    }
    if (args[j] === "e" || args[j] === "E") {
      j++;
      if (args[j] === "+" || args[j] === "-") j++;
      while (j < args.length && /[0-9]/.test(args[j])) j++;
    }
    const tok = args.slice(i, j);
    if (tok === "" || tok === "+" || tok === "-" || tok === ".") {
      bad.push({ idx, near: args.slice(i, i + 20) });
      break;
    }
    out.push(tok);
    i = j;
  }
  return out;
}

while ((m = re.exec(s))) {
  const d = m[1];
  const segs = d.match(/[A-Za-z][^A-Za-z]*/g) || [];
  for (const seg of segs) {
    const cmd = seg[0];
    if (cmd.toLowerCase() === "z") continue;
    tokenizeNumbers(seg.slice(1).trim());
  }
  idx++;
}

console.log("paths scanned:", idx);
console.log("parse failures:", bad.length);
bad.forEach((b) => console.log(`  path#${b.idx}: near "${b.near}"`));
