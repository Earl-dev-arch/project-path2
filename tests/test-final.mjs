// Full regression: load, exercise the new contradiction detector and the
// evidence instrumentation, and confirm nothing throws.
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

const out = {};
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
if (loadErr) {
  console.log(JSON.stringify(out, null, 2));
  process.exit(0);
}

const S = vm.runInContext("state", sb);
const run = (code) => vm.runInContext(code, sb);

// --- new functions exposed ------------------------------------------------
out.newFns = {};
for (const n of [
  "localCheckStatedVsEvidence",
  "localAddContradiction",
  "evidenceSummary",
  "renderEvidenceReadout",
  "trackSessionStarted",
  "trackSessionCompleted",
  "trackCareersExplored",
  "trackExperimentOpened",
  "trackExperimentDay",
  "trackReflection",
  "trackFeedback",
  "trackChange",
  "resetEvidence",
]) {
  out.newFns[n] = typeof sb.window[n];
}

// --- analytics: run the real flow and inspect the recorded counts ----------
try {
  S.user = { name: "S", grade: "Grade 11" };
  S.localAI = null;
  sb.window.newSession(); // sessions started +1
  run("trackSessionCompleted()"); // completed +1
  sb.window.toggleSave("Nursing"); // careers explored
  sb.window.toggleSave("Graphic Design");
  sb.window.startExperimentFromPathway("Nursing"); // opens health experiment
  sb.window.toggleExpDay("health", 1);
  sb.window.toggleExpDay("health", 1); // double-tick must not double count
  sb.window.toggleExpDay("health", 2);
  sb.window.setExpEnjoyment("health", "no"); // the honest "no"
  sb.window.setExpEnjoyment("health", "yes"); // change of mind replaces
  run("trackFeedback({useful:'Yes'})");
  run("trackChange('all reflections were yes','reworded the question')");

  const s = sb.window.evidenceSummary();
  out.evidence = {
    sessionsStarted: s.sessionsStarted,
    sessionsCompleted: s.sessionsCompleted,
    completionRate: s.completionRate,
    careersExplored: s.careersExplored,
    experimentsOpened: s.experimentsOpened,
    experimentDaysDone: s.experimentDaysDone,
    reflections: s.reflections,
    enjoyed: s.enjoyed,
    disliked: s.ruledOut,
    activeDays: s.activeDays,
    returned: s.returned,
    changeLog: s.changeLog,
    hasFeedback: !!s.feedback,
  };
  out.persistence = store.has("yp_evidence_v1");
  out.doubleTickCounted = s.experimentDaysDone === 2; // day 1 + day 2, not 3

  // readout renders
  sb.window.renderEvidenceReadout();
  const ro = id("#evidenceReadout").innerHTML;
  out.readoutChars = ro.length;
  out.readoutShowsRuledOut = ro.includes("ruled out");
  out.readoutShowsChangeLog = ro.includes("Changes made because of feedback");
} catch (e) {
  out.evidenceError = String((e && e.stack) || e)
    .split("\n")
    .slice(0, 3)
    .join(" | ");
}

// --- contradiction: stated pathway vs strongest signals -------------------
try {
  const a = {
    signals: {
      Analytical: 9,
      Creative: 1,
      People: 2,
      Learning: 3,
      Curiosity: 4,
    },
    history: new Array(9).fill({ id: "x", category: "problem", text: "math" }),
    contradictions: [],
    catEvidence: {},
  };
  sb.window.trackChange("a", "b");
  S.saved = ["Graphic Design"]; // a Creative pathway...
  run("localCheckStatedVsEvidence(__a)".replace("__a", "globalThis.__t"));
} catch (e) {
  out.contraSetupError = String(e).split("\n")[0];
}

// Call it directly with a proper object.
try {
  const a = {
    signals: {
      Analytical: 9,
      Creative: 1,
      People: 2,
      Learning: 3,
      Curiosity: 4,
    },
    history: new Array(9).fill({ id: "x", category: "problem", text: "math" }),
    contradictions: [],
    catEvidence: {},
  };
  S.saved = ["Graphic Design"]; // needs Creative; evidence says Analytical
  run("localCheckStatedVsEvidence(__a)".replace("__a", "globalThis.__a"));
} catch (e) {
  /* __a not global yet */
}

try {
  const a = {
    signals: {
      Analytical: 9,
      Creative: 1,
      People: 2,
      Learning: 3,
      Curiosity: 4,
    },
    history: new Array(9).fill({ id: "x", category: "problem", text: "math" }),
    contradictions: [],
    catEvidence: {},
  };
  sb.window.__a = a;
  S.saved = ["Graphic Design"];
  run("localCheckStatedVsEvidence(globalThis.__a)");
  out.contraMismatch =
    a.contradictions.length > 0 ? a.contradictions[0].signal : null;

  // Consistent case: evidence agrees with the stated pathway -> no contradiction
  const b = {
    signals: {
      Analytical: 9,
      Creative: 8,
      People: 2,
      Learning: 3,
      Curiosity: 4,
    },
    history: new Array(9).fill({
      id: "x",
      category: "creativity",
      text: "design",
    }),
    contradictions: [],
    catEvidence: {},
  };
  sb.window.__b = b;
  run("localCheckStatedVsEvidence(globalThis.__b)");
  out.contraMatching = b.contradictions.length;

  // Dedupe: calling twice must not duplicate the same signal
  run("localCheckStatedVsEvidence(globalThis.__a)");
  out.contraDeduped = a.contradictions.length;
} catch (e) {
  out.contraError = String((e && e.stack) || e)
    .split("\n")
    .slice(0, 3)
    .join(" | ");
}

console.log(JSON.stringify(out, null, 2));
