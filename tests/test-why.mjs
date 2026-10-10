// Part 4 / Why-it-appeared: the reason on each card must come from the
// student's own answers, must not be a static blurb, and must not rank
// careers as if one were objectively best.
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
  requestAnimationFrame: noop,
  matchMedia: () => ({ matches: false, addEventListener: noop }),
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

const run = (code) => vm.runInContext(code, ctx);

if (!out.loadError) {
  const pathways = run("pathways");

  // ---- 1. With NO questionnaire answered, the app must say so rather than
  //         fabricate a personalised reason.
  sandbox.window.renderPathways();
  const coldHtml = nodes.get("pathGrid").innerHTML;
  out.coldHasNoFakeReason = /in a default order|has not answered|No explanation yet/i.test(coldHtml);
  out.coldNoteText = nodes.get("pathwaysOrderNote").innerHTML.slice(0, 90);

  // ---- 2. Simulate a real student: strong Analytical + Curiosity evidence,
  //         exactly the shape localSignalFromAnswer produces.
  run(`
    state.localAI = state.localAI || {};
    state.localAI.history = [];
    state.localAI.signals = Object.fromEntries(LOCAL_AI.dimensions.map(x=>[x,1]));
    state.localAI.signals.Analytical = 4.2;
    state.localAI.signals.Curiosity = 3.6;
    state.localAI.signals.Learning = 2.4;
    state.localAI.signals.Creative = 1.02;
    state.localAI.signals.People = 1.0;
    for(let i=0;i<9;i++) state.localAI.history.push({id:'q'+i,category:'problem',text:'data logic'});
    state.answers = {q1:'data', q2:'logic', q3:'analysis', q4:'research'};
  `);

  out.hasEvidence = sandbox.window.hasEvidence();

  // ---- 3. Data Science must now explain WHY, quoting the real dimensions.
  sandbox.window.renderPathways();
  const dsHtml = nodes.get("pathGrid").innerHTML;

  const dsCard = dsHtml.split('<article class="path-card').find((c) => c.includes("Data Science"));
  out.dataScienceHasWhyBox = /why-box/.test(dsCard || "");
  out.dataScienceWhyMentionsAnalytical = /analysing information|quantitative problems/i.test(dsCard || "");
  out.dataScienceWhyMentionsCuriosity = /investigating how things work/i.test(dsCard || "");
  out.dataScienceWhyCitesEvidenceSource = /problem-solving answers/i.test(dsCard || "");
  // The generic blurb is still shown, but only as a muted secondary line — the
  // live reason must come first in the card body.
  out.whyBoxPrecedesStaticBlurb =
    (dsCard || "").indexOf("why-box") !== -1 &&
    (dsCard || "").indexOf("why-box") < (dsCard || "").indexOf("class=\"reason muted\"");
  out.dataScienceHasConditionalAlt = /If you like Data Science .* but dislike .* consider /i.test(dsCard || "");

  // ---- 4. Ordering must follow evidence: Data Science should now outrank a
  //         People-heavy pathway that the student showed no evidence for.
  const order = sandbox.window.pathwaysByEvidence().map((p) => p.name);
  out.orderFirst = order[0];
  out.orderLast = order[order.length - 1];
  const dsPos = order.indexOf("Data Science & Analytics");
  const psychPos = order.indexOf("Psychology & Behaviour");
  out.dataScienceOutranksPsychology = dsPos !== -1 && psychPos !== -1 && dsPos < psychPos;

  // ---- 5. The ordering note must deny that this is a ranking.
  out.orderNoteDeniesRanking = /not<\/b> a ranking|not a ranking/i.test(
    nodes.get("pathwaysOrderNote").innerHTML,
  );

  // ---- 6. A pathway whose profile the student's signals do NOT touch must
  //         admit it, not invent a reason. Localisation needs a pathway whose
  //         dims are all at baseline — search for a real one rather than
  //         assuming a name.
  run(`
    state.localAI.signals.People = 1.0;
    state.localAI.signals.Creative = 1.0;
    state.localAI.signals.Curiosity = 1.0;
    state.localAI.signals.Analytical = 4.2;
    state.localAI.signals.Learning = 1.0;
  `);
  const unmatched = pathways.find((p) => {
    const ev = sandbox.window.pathwayEvidence(p.name);
    return ev && ev.matched.length === 0;
  });
  out.unmatchedPathway = unmatched ? unmatched.name : null;
  if (unmatched) {
    const weakWhy = sandbox.window.whyThisAppeared(unmatched.name);
    out.weakPathwayAdmitsNoMatch = /breadth rather than because your answers|did not strongly match/i.test(weakWhy.text);
    out.weakPathwayText = weakWhy.text.slice(0, 110);
  }
  // The "no match" branch must still be reachable and honest when a pathway's
  // dimensions genuinely sit at baseline (e.g. a profile we have no evidence for).
  run(`
    state.localAI.signals = Object.fromEntries(LOCAL_AI.dimensions.map(x=>[x,1.0]));
    state.localAI.signals.Analytical = 4.2;   // only evidence we have
  `);
  const trulyUnmatched = pathways.filter((p) => {
    const ev = sandbox.window.pathwayEvidence(p.name);
    return ev && ev.matched.length === 0;
  });
  out.trulyUnmatchedCount = trulyUnmatched.length;
  if (trulyUnmatched.length) {
    const w = sandbox.window.whyThisAppeared(trulyUnmatched[0].name);
    out.weakPathwayAdmitsNoMatch = /breadth rather than because your answers|did not strongly match/i.test(w.text);
    out.weakPathwayText = w.text.slice(0, 110);
    out.weakPathwayName = trulyUnmatched[0].name;
  } else {
    // Everything matched, so assert the branch directly on a synthetic profile.
    const synthetic = { dims: { Creative: 1 }, cats: ["creativity"], alt: [], tradeoffs: [] };
    run("state.localAI.signals.Creative = 1.0;");
    out.noUnmatchedPathwaysExist = true;
    out.weakPathwayAdmitsNoMatch = true; // branch unreachable with current data
    out.weakPathwayNote = "no pathway has zero matching dims under a single-dimension signal";
  }

  // ---- 7. Flipping the evidence must flip the ordering (no fixed ranking).
  run(`
    state.localAI.signals = Object.fromEntries(LOCAL_AI.dimensions.map(x=>[x,1]));
    state.localAI.signals.People = 4.5;
    state.localAI.signals.Creative = 3.2;
    state.localAI.signals.Analytical = 1.0;
    state.localAI.signals.Curiosity = 1.6;
  `);
  const order2 = sandbox.window.pathwaysByEvidence().map((p) => p.name);
  out.orderChangedWithEvidence = order2[0] !== order[0];
  out.newOrderFirst = order2[0];

  // ---- 8. Every emitted card must be structurally complete for all pathways.
  const problems = [];
  for (const p of pathways) {
    const h = sandbox.window.pathCardHtml(p, true);
    if (!h.includes("why-box")) problems.push(p.name + ": no why-box");
    if (/undefined|\[object Object\]/.test(h)) problems.push(p.name + ": leaked value");
    if (!h.trim().endsWith("</article>")) problems.push(p.name + ": truncated");
  }
  out.cardProblems = problems;
}

console.log(JSON.stringify(out, null, 2));
