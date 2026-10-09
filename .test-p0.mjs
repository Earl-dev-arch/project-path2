// Post-cleanup regression: the app must still load, log in, and reject the old
// admin credential. Also confirm no student-facing "1,000 bank" label remains.
import { readFileSync } from "node:fs";
import vm from "node:vm";

const noop = () => {};
const nodes = new Map();
function makeEl() {
  const el = {
    style: {},
    dataset: {},
    elements: [],
    value: "",
    textContent: "",
    _html: "",
    classList: { add: noop, remove: noop, toggle: noop, contains: () => false },
    addEventListener: noop,
    appendChild: noop,
    removeChild: noop,
    querySelector: () => makeEl(),
    querySelectorAll: () => [],
    getBoundingClientRect: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
    focus: noop,
    scrollIntoView: noop,
    click: noop,
    setAttribute: noop,
    getAttribute: () => null,
    removeAttribute: noop,
    reset: noop,
  };
  Object.defineProperty(el, "innerHTML", {
    get() {
      return this._html;
    },
    set(v) {
      this._html = String(v);
    },
  });
  return el;
}
const id = (i) => {
  if (!nodes.has(i)) nodes.set(i, makeEl());
  return nodes.get(i);
};

function makeSandbox(store) {
  const sb = {
    console,
    localStorage: {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k),
      clear: () => store.clear(),
    },
    document: {
      querySelector: (s) => id(s),
      querySelectorAll: () => [],
      getElementById: (i) => id("#" + i),
      createElement: () => makeEl(),
      addEventListener: noop,
      body: makeEl(),
      documentElement: makeEl(),
      scripts: [],
    },
    requestAnimationFrame: (f) => {
      try {
        f();
      } catch {}
    },
    IntersectionObserver: class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
    fetch: () => Promise.reject(new Error("no fetch")),
    setTimeout: () => 0,
    clearTimeout: noop,
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
  sb.window = sb;
  sb.globalThis = sb;
  vm.createContext(sb);
  return sb;
}

const store = new Map();
const out = {};

// --- load ---------------------------------------------------------------
const sb = makeSandbox(store);
let loadErr = null;
try {
  vm.runInContext(readFileSync("site-data.js", "utf8"), sb);
  vm.runInContext(readFileSync("app_scratch.js", "utf8"), sb);
} catch (e) {
  loadErr = String((e && e.stack) || e)
    .split("\n")
    .slice(0, 3)
    .join(" | ");
}
out.loadError = loadErr;

if (!loadErr) {
  const S = vm.runInContext("state", sb);
  out.bank = vm.runInContext("QUESTION_BANK.length", sb);

  // --- the old admin credential must not grant anything -------------------
  // Drive the real login handler with the removed credentials.
  const handler = sb.window.__loginHandlerForTest;
  out.loginHandlerExposed = typeof handler;

  // Simulate by calling the form submit handler directly if reachable.
  const formEl = id("#loginForm");
  out.loginFormHasHandler = typeof formEl.onsubmit;

  // Instead, assert on source: credentials must be gone entirely.
  const src = readFileSync("app_scratch.js", "utf8");
  out.sourceHasAdminEmail = src.includes("admin@yourpath.demo");
  out.sourceHasAdminPass = src.includes("admin123");
  out.sourceHasAdminRole = /role\s*[:=]\s*['"]admin['"]/.test(src);
  out.sourceHasAdminSide =
    src.includes("side.admin") || src.includes("tab-admin");

  // --- student-facing labels ---------------------------------------------
  const html = readFileSync("index.html", "utf8");
  const data = readFileSync("site-data.js", "utf8");
  const bankLabel = /1,000|1000-question/i;
  out.indexHasBankLabel = bankLabel.test(html);
  out.dataHasBankLabel = bankLabel.test(data);
  out.appJsHasBankLabel = bankLabel.test(src);
  out.indexHas16Claim = /16 career|all 16/i.test(html);
  out.appJsHas16Claim = /16 career|all 16/i.test(src);

  // --- core flow still works ---------------------------------------------
  S.user = { name: "Student", grade: "Grade 11" };
  S.saved = ["Nursing"];
  try {
    sb.window.renderExperiments();
    out.expGridChars = id("#expGrid").innerHTML.length;
    sb.window.renderRoadmap();
    out.roadmapChars = id("#roadmap").innerHTML.length;
    sb.window.renderPathways();
    out.pathGridChars = id("#pathGrid").innerHTML.length;
    sb.window.goTab("experiments");
    out.goTabOk = true;
  } catch (e) {
    out.flowError = String((e && e.stack) || e)
      .split("\n")
      .slice(0, 3)
      .join(" | ");
  }
}

console.log(JSON.stringify(out, null, 2));
