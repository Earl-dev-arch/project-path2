// What is the real question-bank size? Report it so labels can be truthful.
// Survives the app being launched from any directory.
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const noop = () => {};
const el = new Proxy(
  {},
  {
    get(t, p) {
      if (p === "classList")
        return { add: noop, remove: noop, toggle: noop, contains: () => false };
      if (p === "style" || p === "dataset") return {};
      if (p === "elements") return [];
      if (p === "querySelector") return () => el;
      if (p === "querySelectorAll") return () => [];
      if (p === "getBoundingClientRect")
        return () => ({ top: 0, bottom: 0, left: 0, right: 0 });
      if (p === "getAttribute") return () => null;
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
const sb = {
  console,
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
vm.runInContext(readFileSync(resolve(ROOT, "site-data.js"), "utf8"), sb);
vm.runInContext(readFileSync(resolve(ROOT, "app_scratch.js"), "utf8"), sb);

const bank = vm.runInContext("QUESTION_BANK", sb);
const cats = vm.runInContext("categoryConfig", sb);
const perCat = {};
for (const q of bank) perCat[q.category] = (perCat[q.category] || 0) + 1;

console.log(
  JSON.stringify(
    {
      totalQuestions: bank.length,
      totalBankConst: vm.runInContext("TOTAL_BANK", sb),
      dimensions: cats.length,
      perCategory: perCat,
      pathwaysInCatalog: vm.runInContext("pathways.length", sb),
      pathwayNames: vm.runInContext("pathways.map(p=>p.name)", sb),
    },
    null,
    2,
  ),
);
