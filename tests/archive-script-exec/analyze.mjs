// Offline analysis: split app_scratch.js into top-level statements and try to
// execute each one in isolation, so we can see which statement throws at load
// time (which would explain why functions defined after it never appear).
import { readFileSync } from "node:fs";
import vm from "node:vm";

const src = readFileSync("app_scratch.js", "utf8");

// ---- split into top-level statements, tracking depth outside strings -------
function splitTopLevel(s) {
  const chunks = [];
  let i = 0,
    depth = 0,
    start = 0;
  while (i < s.length) {
    const c = s[i];
    if (c === "/" && s[i + 1] === "/") {
      while (i < s.length && s[i] !== "\n") i++;
      continue;
    }
    if (c === "/" && s[i + 1] === "*") {
      i += 2;
      while (i < s.length && !(s[i] === "*" && s[i + 1] === "/")) i++;
      i += 2;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      const q = c;
      i++;
      while (i < s.length) {
        if (s[i] === "\\") {
          i += 2;
          continue;
        }
        if (s[i] === q) {
          i++;
          break;
        }
        i++;
      }
      continue;
    }
    if (c === "{") depth++;
    if (c === "}") {
      depth--;
      if (depth === 0) {
        chunks.push([start, i + 1]);
        start = i + 1;
      }
    }
    i++;
  }
  if (s.slice(start).trim()) chunks.push([start, s.length]);
  return chunks;
}

const chunks = splitTopLevel(src);
console.log("top-level chunks:", chunks.length);

const lineAt = (idx) => src.slice(0, idx).split("\n").length;

// ---- execute each chunk in a sandbox -------------------------------------
const store = new Map();
const noop = () => {};
function makeEl() {
  return new Proxy(
    {},
    {
      get(t, p) {
        if (p === "classList")
          return {
            add: noop,
            remove: noop,
            toggle: noop,
            contains: () => false,
          };
        if (p === "style" || p === "dataset") return {};
        if (p === "elements") return [];
        if (p === "querySelector") return () => makeEl();
        if (p === "querySelectorAll") return () => [];
        if (p === "getBoundingClientRect")
          return () => ({ top: 0, bottom: 0, left: 0, right: 0 });
        if (p === "getAttribute") return () => null;
        if (p === "toString") return () => "[el]";
        return typeof t[p] === "undefined" ? noop : t[p];
      },
      set(t, p, v) {
        t[p] = v;
        return true;
      },
    },
  );
}
const sandbox = {
  console,
  localStorage: {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
  },
  document: {
    querySelector: () => makeEl(),
    querySelectorAll: () => [],
    getElementById: () => makeEl(),
    createElement: () => makeEl(),
    addEventListener: noop,
    body: makeEl(),
    documentElement: makeEl(),
    scripts: [],
  },
  window: {},
  requestAnimationFrame: noop,
  IntersectionObserver: class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
  fetch: () => Promise.reject(new Error("no fetch")),
  setTimeout: () => 0,
  clearTimeout: noop,
  FormData: class {
    constructor() {}
    entries() {
      return [][Symbol.iterator]();
    }
  },
  Math,
  JSON,
  Object,
  Array,
  String,
  Number,
  Boolean,
  Date,
  Set,
  Map,
  RegExp,
  Error,
  Promise,
  isNaN,
  parseInt,
  parseFloat,
  encodeURIComponent,
  decodeURIComponent,
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
vm.createContext(sandbox);

const failures = [];
chunks.forEach(([a, b], n) => {
  const code = src.slice(a, b);
  const line = lineAt(a);
  try {
    vm.runInContext(code, sandbox, { filename: `chunk${n}@L${line}` });
  } catch (e) {
    failures.push({
      chunk: n,
      startLine: line,
      error: String((e && e.message) || e),
      head: code.slice(0, 120).replace(/\s+/g, " "),
    });
  }
});

console.log("\nfailures:", failures.length);
for (const f of failures.slice(0, 25)) {
  console.log(`- chunk ${f.chunk} @line ${f.startLine}: ${f.error}`);
  console.log(`    ${f.head}`);
}

console.log("\nglobals exposed after running all chunks:");
for (const name of [
  "showPage",
  "openLogin",
  "goTab",
  "renderJourney",
  "renderPathways",
  "renderQuestion",
  "updateUI",
  "toast",
]) {
  console.log(
    `  ${name}: ${typeof sandbox[name]}  (window: ${typeof sandbox.window[name]})`,
  );
}
