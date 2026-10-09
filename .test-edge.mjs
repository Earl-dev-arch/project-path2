// Confirm the "no pathway chosen" roadmap offers pathways, not a broken CTA,
// and that the experiments tab survives a missing site-data.js.
import { readFileSync } from "node:fs";
import vm from "node:vm";

const noop = () => {};
const nodes = new Map();
function makeEl() {
  const el = {
    style: {},
    dataset: {},
    elements: [],
    classList: { add: noop, remove: noop, toggle: noop, contains: () => false },
    value: "",
    textContent: "",
    _html: "",
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
const store = new Map();

function makeSandbox() {
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

const out = {};

// Case A: everything present, no pathway chosen yet.
{
  const sb = makeSandbox();
  vm.runInContext(readFileSync("site-data.js", "utf8"), sb);
  vm.runInContext(readFileSync("app_scratch.js", "utf8"), sb);
  const S = vm.runInContext("state", sb);
  S.user = { name: "New Student", grade: "Grade 9" };
  sb.window.renderRoadmap();
  const rm = id("#roadmap").innerHTML;
  out.emptyState = {
    hasChain: rm.includes('class="chain"'),
    offersPathways:
      rm.includes('data-tab="pathways"') && rm.includes("Explore pathways"),
    hasBrokenExpCta:
      rm.includes("startExperimentFromPathway('')") ||
      rm.includes("startExperimentFromPathway('')"),
    chainRowCount: (rm.match(/chain-row/g) || []).length,
  };
}

// Case B: site-data.js missing -> experiments tab must explain, not throw.
{
  const sb = makeSandbox();
  let loadErr = null;
  try {
    vm.runInContext(readFileSync("app_scratch.js", "utf8"), sb);
  } catch (e) {
    loadErr = String(e).split("\n")[0];
  }
  out.withoutSiteData = { loadErr };
  if (!loadErr) {
    let renderErr = null;
    try {
      sb.window.renderExperiments();
    } catch (e) {
      renderErr = String(e).split("\n")[0];
    }
    out.withoutSiteData.renderErr = renderErr;
    out.withoutSiteData.showsExplanation =
      id("#expGrid").innerHTML.includes("site-data.js");
    let rmErr = null;
    try {
      sb.window.renderRoadmap();
    } catch (e) {
      rmErr = String(e).split("\n")[0];
    }
    out.withoutSiteData.roadmapErr = rmErr;
  }
}

console.log(JSON.stringify(out, null, 2));
