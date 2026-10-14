// Extract the three social paths and validate them the way the SVG spec requires:
// after a number, the next number must be preceded by a separator, OR begin with a
// sign (+/-), OR begin with a decimal point. Otherwise the tokenizer is ambiguous/illegal.
import { readFileSync } from "node:fs";
const s = readFileSync("index.html", "utf8");

const block = s.slice(s.indexOf('class="social-links"'));
const re = /class="social-link social-([a-z]+)"[\s\S]*?<path d="([^"]+)"/g;
let m;
const ARGC = { m: 2, l: 2, h: 1, v: 1, c: 6, s: 4, q: 4, t: 2, a: 7, z: 0 };

while ((m = re.exec(block))) {
  const name = m[1];
  const d = m[2];
  const segs = d.match(/[A-Za-z][^A-Za-z]*/g) || [];
  const issues = [];
  for (const seg of segs) {
    const cmd = seg[0].toLowerCase();
    if (cmd === "z") continue;
    const args = seg.slice(1).trim();
    // tokenize with SVG rules and flag illegal glue
    const toks = [];
    let i = 0;
    while (i < args.length) {
      const ch = args[i];
      if (/[\s,]/.test(ch)) {
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
      const tok = args.slice(i, j);
      if (tok === "" || tok === "+" || tok === "-" || tok === ".") {
        issues.push(
          `illegal token at "${args.slice(i, i + 16)}" in cmd=${cmd}`,
        );
        break;
      }
      toks.push(tok);
      i = j;
    }
    const need = ARGC[cmd];
    if (need && toks.length % need !== 0) {
      issues.push(
        `cmd=${cmd} has ${toks.length} numbers, not a multiple of ${need}`,
      );
    }
  }
  console.log(`--- ${name} ---`);
  console.log(`  issues: ${issues.length}`);
  issues.slice(0, 5).forEach((s) => console.log("    " + s));
}
