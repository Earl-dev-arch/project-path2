import { readFileSync } from "node:fs";
const s = readFileSync("index.html", "utf8");

// Pull each social svg path d attribute
const socialBlock = s.slice(
  s.indexOf('class="social-links"'),
  s.indexOf("</div>", s.indexOf('class="social-links"')),
);
const re = /class="social-link social-([a-z]+)"[\s\S]*?<path d="([^"]+)"/g;
let m;
while ((m = re.exec(socialBlock))) {
  const name = m[1];
  const d = m[2];
  // Validate path data: split into command segments and try to parse numbers
  const segs = d.match(/[A-Za-z][^A-Za-z]*/g) || [];
  const problems = [];
  for (const seg of segs) {
    const cmd = seg[0];
    const args = seg.slice(1).trim();
    const nums = args.length ? args.split(/[\s,]+/).filter(Boolean) : [];
    // Commands that take numbers
    if (/[MmLlHhVvCcSsQqTtAaZz]/.test(cmd) && cmd.toLowerCase() !== "z") {
      for (const n of nums) {
        if (!/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(n)) {
          problems.push({ cmd, badToken: n, seg: seg.slice(0, 60) });
        }
      }
    }
  }
  // Look specifically for the classic "4.919.058" gluing bug
  const glue = d.match(/\d\.\d{3}\.\d/);
  console.log(`--- ${name} ---`);
  console.log(`  path length: ${d.length}`);
  console.log(
    `  glued-decimal bug (\\d.\\d{3}.\\d): ${glue ? glue[0] : "none"}`,
  );
  console.log(`  bad numeric tokens: ${problems.length}`);
  problems
    .slice(0, 4)
    .forEach((p) =>
      console.log(`     cmd=${p.cmd} token=${p.badToken} in "${p.seg}..."`),
    );
}
