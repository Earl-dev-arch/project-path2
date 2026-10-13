import fs from "fs";
import path from "path";

const ROOT = path.resolve(
  new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"),
);

function stripHtml(src) {
  return src.replace(/<!--[\s\S]*?-->/g, "");
}

function stripCss(src) {
  let out = "";
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === "/" && src[i + 1] === "*") {
      const end = src.indexOf("*/", i + 2);
      i = end === -1 ? src.length : end + 2;
      continue;
    }
    if (c === '"' || c === "'") {
      const q = c;
      out += c;
      i++;
      while (i < src.length && src[i] !== q) {
        if (src[i] === "\\") {
          out += src[i];
          i++;
        }
        if (i < src.length) {
          out += src[i];
          i++;
        }
      }
      if (i < src.length) {
        out += src[i];
        i++;
      }
      continue;
    }
    out += c;
    i++;
  }
  return out;
}

function stripJs(src) {
  let out = "";
  let i = 0;
  const n = src.length;
  while (i < n) {
    const c = src[i];
    const d = src[i + 1];
    if (c === "/" && d === "/") {
      while (i < n && src[i] !== "\n") i++;
      continue;
    }
    if (c === "/" && d === "*") {
      const end = src.indexOf("*/", i + 2);
      i = end === -1 ? n : end + 2;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      const q = c;
      out += c;
      i++;
      while (i < n) {
        if (src[i] === "\\") {
          out += src[i];
          i++;
          if (i < n) {
            out += src[i];
            i++;
          }
          continue;
        }
        if (src[i] === q) {
          out += src[i];
          i++;
          break;
        }
        out += src[i];
        i++;
      }
      continue;
    }
    if (c === "/" && d !== "=" && d !== "/") {
      const prev = out.replace(/\s+$/, "").slice(-1);
      if (
        prev === "" ||
        "=([{,;:!&|?+-*%^~<>".includes(prev) ||
        /\b(return|typeof|case|in|of|instanceof|delete|void|do|else|yield|await)$/.test(
          out.replace(/\s+$/, ""),
        )
      ) {
        const end = src.indexOf("/", i + 1);
        if (end !== -1 && src.slice(i, end).indexOf("\n") === -1) {
          out += src.slice(i, end + 1);
          i = end + 1;
          continue;
        }
      }
    }
    out += c;
    i++;
  }
  return out;
}

const targets = [
  ["index.html", stripHtml],
  ["app_scratch.js", stripJs],
  ["site-data.js", stripJs],
  ["styles.css", stripCss],
  ["server/server.js", stripJs],
  ["server/schema.sql", stripSql],
  ["start-server.bat", stripBat],
  ["qa_login_gate.mjs", stripJs],
  ["server/package.json", null],
  ["package.json", null],
  ["render.yaml", stripYaml],
];

function stripSql(src) {
  return src
    .split("\n")
    .filter((line) => !/^\s*--/.test(line))
    .join("\n")
    .replace(/\/\*[\s\S]*?\*\//g, "");
}

function stripBat(src) {
  return src
    .split("\n")
    .filter((line) => !/^\s*(rem|::)\b/i.test(line))
    .join("\n");
}

function stripYaml(src) {
  return src
    .split("\n")
    .filter((line) => !/^\s*#/.test(line))
    .join("\n");
}

for (const [rel, fn] of targets) {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs) || !fn) continue;
  const before = fs.readFileSync(abs, "utf8");
  let after = fn(before);
  after = after.replace(/[ \t]+\n/g, "\n");
  after = after.replace(/\n{3,}/g, "\n\n");
  if (after !== before) {
    fs.writeFileSync(abs, after);
    console.log("stripped comments:", rel);
  }
}
