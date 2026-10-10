// Part 5 regression: the experiment verdict must feed the roadmap chain.
// Verifies the loop closes — exploration result -> Experiments + Next steps lines.
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

// Shared store so app_scratch.js and the test observe the same localStorage.
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
  body: makeEl(),
  documentElement: makeEl(),
  getElementById: (id) => nodes.get(id) || null,
  querySelector: (sel) =>
    sel.startsWith("#") ? nodes.get(sel.slice(1)) || makeEl() : makeEl(),
  querySelectorAll: () => [],
  createElement: () => makeEl(),
  addEventListener: noop,
};

const sandbox = {
  document, localStorage, console,
  fetch: () => Promise.reject(new Error("no server in test")),
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
const out = {};

try {
  vm.runInContext(readFileSync("site-data.js", "utf8"), ctx, { filename: "site-data.js" });
  vm.runInContext(readFileSync("app_scratch.js", "utf8"), ctx, { filename: "app_scratch.js" });
  out.loadError = null;
} catch (e) {
  out.loadError = e.message;
}

if (!out.loadError) {
  // ---- 1. The chain helper is exposed and behaves for an untouched experiment.
  out.chainLineFn = typeof sandbox.window.experimentChainLine;
  out.nextStepFn = typeof sandbox.window.nextStepForExperiment;

  // Use a real pathway that maps to an experiment family.
  const name = "Cybersecurity";
  const exp = sandbox.window.experimentForPathway(name);
  out.pathwayMapped = !!exp;
  out.family = exp && exp.key;

  if (exp) {
    // Before doing any work: the chain still invites the student in.
    out.before = sandbox.window.experimentChainLine(exp).slice(0, 60);
    out.beforeIsInvitation = sandbox.window.experimentChainLine(exp).includes("7-day exploration");

    // ---- 2. Open the experiment from the pathway (the real CTA).
    sandbox.window.startExperimentFromPathway(name);
    out.openedEvidence = (JSON.parse(store.get("yp_evidence_v1") || "{}").experimentsOpened || []).length;

    // ---- 3. Tick three days: the chain should report partial progress.
    [1, 2, 3].forEach((d) => sandbox.window.toggleExpDay(exp.key, d));
    const partial = sandbox.window.experimentChainLine(exp);
    out.partialLine = partial;
    out.partialReportsProgress = partial.includes("day 3 of 7");
    out.partialStillPrompts = partial.includes("Finish the week");

    // ---- 4. Answer the honest question. The chain must now report the verdict
    //         and the Next steps line must change to match it.
    sandbox.window.setExpEnjoyment(exp.key, "yes");
    const afterYes = sandbox.window.experimentChainLine(exp);
    const nextYes = sandbox.window.nextStepForExperiment(exp);
    out.chainAfterYes = afterYes;
    out.chainConsumesVerdict = afterYes.includes("you enjoyed the actual work");
    out.chainStopsInviting = !afterYes.includes("7-day exploration");
    out.nextStepAfterYes = nextYes.slice(0, 70);
    out.nextStepPushesDeeper = /larger project/i.test(nextYes);

    // ---- 5. A "no" must read as a useful result, not a failure.
    sandbox.window.setExpEnjoyment(exp.key, "no");
    const nextNo = sandbox.window.nextStepForExperiment(exp);
    out.chainAfterNo = sandbox.window.experimentChainLine(exp);
    out.noIsFramedAsProgress = /progress, not failure/i.test(nextNo);
    out.noSuggestsAnotherFamily = /different pathway/i.test(nextNo);

    // ---- 6. "mixed" points at a neighbouring family instead of a commitment.
    sandbox.window.setExpEnjoyment(exp.key, "mixed");
    out.nextStepMixedCommitmentCaveat = /before you commit/i.test(
      sandbox.window.nextStepForExperiment(exp),
    );

    // ---- 7. Changing the answer must not double-count a reflection.
    const ev = JSON.parse(store.get("yp_evidence_v1") || "{}");
    out.reflectionsCountedOnce = (ev.reflections || []).length === 1;

    // ---- 8. The roadmap HTML actually contains the verdict-derived line.
    sandbox.window.setExpEnjoyment(exp.key, "no");
    sandbox.window.renderRoadmap();
    const rHtml = (nodes.get("roadmap") || { innerHTML: "" }).innerHTML;
    out.roadmapRendered = rHtml.length > 0;
    out.roadmapShowsRulingOut = /progress, not failure/i.test(rHtml);

    // ---- 9. Alternative routes must still be present (not only a degree).
    //         A pathway with its own curated `routes` uses those; a pathway
    //         without one falls back to the generic four. Either is valid, so
    //         assert the section rendered and that no route assumes a degree.
    out.roadmapHasAlternativeRoutes = /NOT ONLY A DEGREE/.test(rHtml);
    const p = sandbox.window.pathwayRecord("Cybersecurity");
    out.pathwayHasCuratedRoutes = !!(p && p.educationGuide && p.educationGuide.routes.length);
    out.curatedRouteCount = p ? p.educationGuide.routes.length : 0;
    // The self-directed route is the one that proves a degree is not assumed.
    out.hasNonDegreeRoute = /CTF|Bug Bounty|Self-taught|Certification|Certifications|Academy|Bootcamp|Diploma|Apprentice/i.test(rHtml);
    out.routeCardCount = (rHtml.match(/route-card/g) || []).length;
  }
}

console.log(JSON.stringify(out, null, 2));
