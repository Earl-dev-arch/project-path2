// Offline bisect: find the first top-level statement whose compilation of the
// prefix up to it fails. This avoids executing anything, so no DOM is needed,
// and matches what the browser does when it compiles the whole classic script.
import { readFileSync } from "node:fs";

const src = readFileSync("app_scratch.js", "utf8");
const lines = src.split(/\r?\n/);

// Candidate statement starts: lines beginning at column 0 with a top-level keyword.
const starts = [];
lines.forEach((l, i) => {
  if (
    /^(function|const|let|var)\b/.test(l) ||
    /^window\./.test(l) ||
    /^document\./.test(l) ||
    /^\$\(/.test(l) ||
    /^\$\$\(/.test(l)
  )
    starts.push(i + 1);
});

function compiles(code) {
  try {
    // Compile only. A program with unresolved identifiers still compiles fine.
    new Function(code);
    return { ok: true };
  } catch (e) {
    return { ok: false, message: String(e.message) };
  }
}

let deepestOk = null;
let firstBad = null;
for (const n of starts) {
  const prefix = lines.slice(0, n).join("\n");
  const r = compiles(prefix);
  if (r.ok) deepestOk = n;
  else if (!firstBad) firstBad = { line: n, message: r.message };
}

console.log("total lines            :", lines.length);
console.log("statement starts       :", starts.length);
console.log("deepest prefix that compiles up to line :", deepestOk);
if (firstBad) {
  console.log("FIRST line where the prefix fails       :", firstBad.line);
  console.log("reason                                  :", firstBad.message);
  const from = Math.max(0, firstBad.line - 6);
  console.log("--- source around it ---");
  for (let i = from; i < firstBad.line; i++) {
    console.log(String(i + 1).padStart(5), lines[i].slice(0, 160));
  }
} else {
  console.log("no failing prefix found");
}
