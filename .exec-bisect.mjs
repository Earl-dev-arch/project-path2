// Offline execution bisect for app_scratch.js.
// Strategy: prepend `window.__L=<n>;` before each top-level statement so we can
// see the deepest statement reached, then execute the whole program in a vm.
// This is more reliable than prefix-compiling (unfinished literals are fine at
// runtime because every statement is complete by the time it runs).
import { readFileSync } from "node:fs";
import vm from "node:vm";

const src = readFileSync("app_scratch.js", "utf8");
const lines = src.split(/\r?\n/);

// Tag each top-level statement-start line with a marker on its own line above it.
const out = lines
  .map((l, i) => {
    const isTopStart =
      /^(function|const|let|var)\b/.test(l) ||
      /^window\./.test(l) ||
      /^document\./.test(l) ||
      /^\$\(/.test(l) ||
      /^\$\$\(/.test(l) ||
      /^\/\*/.test(l);
    return isTopStart ? `__L(${i + 1});${l}` : l;
  })
  .join("\n");

let deepest = 0;
const noop = () => {};
const el = new Proxy(
  {},
  {
    get(t, p) {
      if (p === "classList")
        return { add: noop, remove: noop, toggle: noop, contains: () => false };
      if (p === "style" || p === "dataset") return {};
      if (p === "elements") return [];
      if (p === "textContent" || p === "innerHTML" || p === "value") return "";
      if (p === "querySelector") return () => el;
      if (p === "querySelectorAll") return () => [];
      if (p === "getBoundingClientRect")
        return () => ({ top: 0, bottom: 0, left: 0, right: 0 });
      if (p === "getAttribute") return () => null;
      if (p === "toString") return () => "[el]";
      if (p === "then") return undefined;
      return noop;
    },
    set(t, p, v) {
      t[p] = v;
      return true;
    },
  },
);

const store = new Map();
const sandbox = {
  console,
  __L: (n) => {
    if (n > deepest) deepest = n;
  },
  localStorage: {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
  },
  document: {
    querySelector: () => el,
    querySelectorAll: () => [],
    getElementById: () => el,
    createElement: () => el,
    addEventListener: noop,
    body: el,
    documentElement: el,
    scripts: [],
  },
  requestAnimationFrame: noop,
  IntersectionObserver: class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
  fetch: () => ({ then: () => ({ catch: noop }) }),
  setTimeout: () => 0,
  clearTimeout: noop,
  setInterval: () => 0,
  FormData: class {
    constructor() {}
    entries() {
      return [][Symbol.iterator]();
    }
  },
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
sandbox.self = sandbox;
vm.createContext(sandbox);

let error = null,
  errLine = null;
try {
  vm.runInContext(out, sandbox, { filename: "app_scratch.js" });
} catch (e) {
  error = String((e && e.stack) || e);
  const m = error.match(/app_scratch\.js:(\d+)/);
  if (m) errLine = Number(m[1]);
}

console.log(
  JSON.stringify(
    {
      totalLines: lines.length,
      deepestStatementLineReached: deepest,
      atSourceLine: lines[deepest - 1]?.slice(0, 120),
      errorLine: errLine,
      errorAtSource: errLine ? lines[errLine - 1]?.slice(0, 120) : null,
      error: error ? error.split("\n").slice(0, 4).join(" | ") : null,
      exposed: {
        showPage: typeof sandbox.showPage,
        openLogin: typeof sandbox.openLogin,
        goTab: typeof sandbox.goTab,
        renderJourney: typeof sandbox.renderJourney,
        renderRoadmap: typeof sandbox.renderRoadmap,
        makeQuestionBank: typeof sandbox.makeQuestionBank,
        updateUI: typeof sandbox.updateUI,
        toast: typeof sandbox.toast,
      },
      questionBankLength: (() => {
        try {
          return sandbox.QUESTION_BANK.length;
        } catch {
          return "n/a";
        }
      })(),
    },
    null,
    2,
  ),
);
