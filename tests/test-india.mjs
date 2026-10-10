// Part 4 / India: verify the India pathway data renders for every pathway,
// and that the education view stays well-formed.
import { readFileSync as _readFileSync } from "node:fs";
import { dirname, resolve as _resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Tests live in tests/ but load the app from the project root, so they pass no
// matter which directory they are run from. A bare app filename is resolved
// against the root; an explicit path is left alone.
const APP_ROOT = _resolve(dirname(fileURLToPath(import.meta.url)), "..");
const APP_FILES = new Set([
  "index.html",
  "styles.css",
  "site-data.js",
  "app_scratch.js",
  "question-bank-spec.json",
  "favicon.ico",
  "favicon.png",
]);
const readFileSync = (p, ...rest) =>
  _readFileSync(
    typeof p === "string" && APP_FILES.has(p) ? _resolve(APP_ROOT, p) : p,
    ...rest,
  );
import vm from "node:vm";

const noop = () => {};
function makeEl() {
  const el = {
    style: {}, dataset: {}, elements: [], value: "", textContent: "", _html: "",
    classList: { add: noop, remove: noop, toggle: noop, contains: () => false },
    addEventListener: noop, appendChild: noop, removeChild: noop,
    querySelector: () => makeEl(), querySelectorAll: () => [],
    getBoundingClientRect: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
    focus: noop, scrollIntoView: noop, click: noop,
    setAttribute: noop, getAttribute: () => null, removeAttribute: noop, reset: noop,
  };
  Object.defineProperty(el, "innerHTML", {
    get() { return this._html; },
    set(v) { this._html = String(v); },
  });
  return el;
}

const store = new Map();
const localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};

const html = readFileSync("index.html", "utf8");
const ids = [...html.matchAll(/id="([^"]+)"/g)].map((m) => m[1]);
const nodes = new Map(ids.map((id) => [id, makeEl()]));

const document = {
  body: makeEl(), documentElement: makeEl(),
  getElementById: (id) => nodes.get(id) || null,
  querySelector: (s) => (s.startsWith("#") ? nodes.get(s.slice(1)) || makeEl() : makeEl()),
  querySelectorAll: () => [], createElement: () => makeEl(), addEventListener: noop,
};

const sandbox = {
  document, localStorage, console,
  fetch: () => Promise.reject(new Error("no server")),
  setTimeout, clearTimeout, setInterval, clearInterval,
  Date, Math, JSON, Object, Array, String, Number, Boolean, RegExp, Error,
  requestAnimationFrame: noop, matchMedia: () => ({ matches: false, addEventListener: noop }),
  navigator: { userAgent: "node" },
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
sandbox.window.scrollTo = noop;
sandbox.window.addEventListener = noop;
sandbox.window.location = { hash: "", href: "http://localhost/" };
sandbox.alert = noop;
sandbox.confirm = () => true;

const ctx = vm.createContext(sandbox);
const out = { pathways: [] };

try {
  vm.runInContext(readFileSync("site-data.js", "utf8"), ctx, { filename: "site-data.js" });
  vm.runInContext(readFileSync("app_scratch.js", "utf8"), ctx, { filename: "app_scratch.js" });
  out.loadError = null;
} catch (e) {
  out.loadError = e.message + "\n" + (e.stack || "").split("\n").slice(0, 4).join("\n");
}

if (!out.loadError) {
  // `pathways` is a top-level const inside the classic script, so it lives in
  // the VM context's lexical scope rather than on `window`. Ask the context
  // directly, then use the app's own pathwayRecord() for lookups.
  const pathways = vm.runInContext("pathways", ctx);
  out.pathwayCount = pathways.length;

  let withIndia = 0, withIndiaUnis = 0, withIndiaRoutes = 0, withIndiaExams = 0;
  const problems = [];

  for (const p of pathways) {
    const g = p.educationGuide || {};
    const hasUnis = !!(g.universities && g.universities.india);
    const hasRoutes = Array.isArray(g.indiaRoutes) && g.indiaRoutes.length >= 2;
    const examMentionsIndia = typeof g.tests === "string" && /India:/.test(g.tests);

    if (hasUnis) withIndiaUnis++;
    if (hasRoutes) withIndiaRoutes++;
    if (examMentionsIndia) withIndiaExams++;
    if (hasUnis || hasRoutes || examMentionsIndia) withIndia++;

    if (!hasUnis) problems.push(p.name + ": no universities.india");
    if (!hasRoutes) problems.push(p.name + ": no indiaRoutes");
    if (!examMentionsIndia) problems.push(p.name + ": tests has no India entry");

    // Routes must be well-formed and non-empty.
    (g.indiaRoutes || []).forEach((r, i) => {
      if (!r.title || !r.desc) problems.push(p.name + " route " + i + ": missing title/desc");
      if (/\/\//.test(r.title)) problems.push(p.name + " route " + i + ": suspicious title");
    });
  }

  out.withIndiaUnis = withIndiaUnis;
  out.withIndiaRoutes = withIndiaRoutes;
  out.withIndiaExams = withIndiaExams;
  out.totalIndiaRoutes = pathways.reduce((n, p) => n + ((p.educationGuide?.indiaRoutes) || []).length, 0);
  out.problems = problems;

  // Render the education view for EVERY pathway and assert India is present.
  const renderProblems = [];
  for (const p of pathways) {
    try {
      sandbox.window.renderEducation(p.name);
      const h = (nodes.get("educationContainer") || { innerHTML: "" }).innerHTML;
      if (!h || h.length < 500) renderProblems.push(p.name + ": rendered too little");
      if (!/India/.test(h)) renderProblems.push(p.name + ": India absent from render");
      if (!/INDIA ROUTES/.test(h)) renderProblems.push(p.name + ": India routes section absent");
      if (/undefined|\[object Object\]/.test(h)) renderProblems.push(p.name + ": leaked undefined/object");
    } catch (e) {
      renderProblems.push(p.name + ": threw " + e.message);
    }
  }
  out.renderProblems = renderProblems;

  // Sample one render to eyeball structure.
  sandbox.window.renderEducation("Data Science & Analytics");
  const sample = (nodes.get("educationContainer") || { innerHTML: "" }).innerHTML;
  out.sampleIndiaRouteTitles = [...sample.matchAll(/◈ ([^<]+)</g)].map((m) => m[1]).slice(0, 10);
  out.sampleHasISIRoute = /Indian Statistical Institute/.test(sample);
}

console.log(JSON.stringify(out, null, 2));
