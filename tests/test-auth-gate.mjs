// Auth gate: an email that was never registered must NOT be accepted at login,
// and must never be silently turned into an account.
//
// The app wires its auth handlers with `$("#loginForm").onsubmit = ...`. The DOM
// shim below records every such assignment, so the test invokes exactly the
// handler the app installed — including any later override that caused the bug.
import { readFileSync as _readFileSync } from "node:fs";
import { dirname, resolve as _resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const APP_ROOT = _resolve(dirname(fileURLToPath(import.meta.url)), "..");
const readFileSync = (p, ...r) =>
  _readFileSync(typeof p === "string" ? _resolve(APP_ROOT, p) : p, ...r);

const noop = () => {};

// ---- DOM shim that captures onsubmit assignments -------------------------
const handlers = {};

function makeEl(id) {
  const el = {
    id: id || "",
    style: {}, dataset: {}, elements: [], value: "", textContent: "", _html: "",
    classList: { add: noop, remove: noop, toggle: noop, contains: () => false },
    addEventListener: noop, appendChild: noop, removeChild: noop,
    querySelector: () => makeEl(), querySelectorAll: () => [],
    getBoundingClientRect: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
    focus: noop, scrollIntoView: noop, click: noop,
    setAttribute: noop, getAttribute: () => null, removeAttribute: noop,
    reset: noop, offsetParent: null,
    // Checkboxes: the consent gate reads .checked and .disabled directly.
    checked: false, disabled: false,
  };
  Object.defineProperty(el, "innerHTML", {
    get() { return this._html; }, set(v) { this._html = String(v); },
  });
  let _onsubmit = null;
  Object.defineProperty(el, "onsubmit", {
    configurable: true, enumerable: true,
    get() { return _onsubmit; },
    set(fn) { _onsubmit = fn; if (id) handlers[id] = fn; },
  });
  return el;
}

const store = new Map();
const localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};

const ids = [...readFileSync("index.html", "utf8").matchAll(/id="([^"]+)"/g)].map((m) => m[1]);
const nodes = new Map(ids.map((i) => [i, makeEl(i)]));

const document = {
  body: makeEl(), documentElement: makeEl(),
  getElementById: (i) => nodes.get(i) || null,
  querySelector: (s) => (s.startsWith("#") ? nodes.get(s.slice(1)) || null : null) || makeEl(),
  querySelectorAll: () => [], createElement: (t) => makeEl(t), addEventListener: noop,
};

const sb = {
  document, localStorage,
  console: { log: noop, warn: noop, error: noop },
  fetch: () => Promise.reject(new Error("no server")),
  setTimeout, clearTimeout, setInterval, clearInterval,
  Date, Math, JSON, Object, Array, String, Number, Boolean, RegExp, Error,
  Promise, Symbol, Map, Set, WeakMap,
  requestAnimationFrame: noop,
  matchMedia: () => ({ matches: false, addEventListener: noop }),
  navigator: { userAgent: "node" },
};
sb.window = sb; sb.globalThis = sb;
sb.window.scrollTo = noop; sb.window.addEventListener = noop;
sb.window.location = { hash: "", href: "http://localhost/", reload: noop };
sb.alert = noop; sb.confirm = () => true;

const ctx = vm.createContext(sb);
const out = { checks: [] };
const check = (name, pass, detail) => out.checks.push({ name, pass, detail });

try {
  vm.runInContext(readFileSync("site-data.js", "utf8"), ctx, { filename: "site-data.js" });
  vm.runInContext(readFileSync("app_scratch.js", "utf8"), ctx, { filename: "app_scratch.js" });
  out.loadError = null;
} catch (e) {
  out.loadError = e.message + " @ " + (e.stack || "").split("\n")[1];
}

const run = (c) => vm.runInContext(c, ctx);

if (!out.loadError) {
  run(`
    window.__toasts = [];
    toast = (m) => { window.__toasts.push(String(m)); };
    startAISession = async () => {};
    ensureSession  = () => {};
    updateUI       = () => {};
    showPage       = () => {};
    goTab          = () => {};
    updateAIJourney= () => {};
    openLogin      = () => {};
    openSignup     = () => {};
    closeModal     = () => {};
  `);

  out.capturedHandlers = Object.keys(handlers);

  // Account creation is gated behind the consent checkboxes in the real UI.
  // Tick them, otherwise the consent wrapper blocks signup and every downstream
  // assertion fails for a reason that has nothing to do with auth. Read back,
  // because resetConsentGate() clears them when the modal opens and a silently
  // unticked box would misreport the whole suite.
  out.consentArmed = run(`
    (() => {
      const cp = document.getElementById('consentPolicies');
      const ca = document.getElementById('consentAge');
      if (cp) cp.checked = true;
      if (ca) ca.checked = true;
      return JSON.stringify({ policies: !!(cp && cp.checked), age: !!(ca && ca.checked) });
    })()
  `);

  const submit = async (formId, values) => {
    const h = handlers[formId];
    if (typeof h !== "function") return { error: "no handler for " + formId };
    const origFD = sb.FormData;
    sb.FormData = function () {
      return { entries: () => Object.entries(values)[Symbol.iterator]() };
    };
    try {
      await h({ preventDefault: noop, target: { elements: [] } });
    } catch (e) {
      return { error: e.message + " @ " + (e.stack || "").split("\n")[1] };
    } finally {
      sb.FormData = origFD;
    }
    return { ok: true };
  };

  const user = () => JSON.parse(store.get("yp_user_v3") || "null");
  const accounts = () => JSON.parse(store.get("yp_accounts_v3") || "{}");
  const lastToast = () => run("window.__toasts[window.__toasts.length-1] || ''");
  const dump = () => ({ accounts: Object.keys(accounts()), user: user(), toasts: run("window.__toasts") });

  await (async () => {
    // ---- 1. Signup creates an account (the only creation path). ----------
    const sg = await submit("signupForm", {
      name: "Real Student", email: "real@student.test", password: "secret123",
    });
    out.signupResult = sg;
    out.afterSignup = dump();
    check("signup handler ran", sg.ok === true, sg);
    check("signup created the account", !!accounts()["real@student.test"],
      Object.keys(accounts()));
    check("signup logged the user in", (user() || {}).email === "real@student.test",
      user());

    // ---- 2. THE BUG: unknown email at login must be refused. -------------
    store.delete("yp_user_v3");
    const before = Object.keys(accounts()).length;
    const ghost = await submit("loginForm", {
      email: "ghost@nowhere.test", password: "anything123",
    });
    out.ghostResult = ghost;
    check("login handler ran", ghost.ok === true, ghost);
    check("unknown email did NOT create an account",
      !accounts()["ghost@nowhere.test"], Object.keys(accounts()));
    check("account count unchanged", Object.keys(accounts()).length === before,
      { before, after: Object.keys(accounts()).length });
    check("unknown email did NOT log anyone in",
      (user() || {}).email !== "ghost@nowhere.test", { user: user() });
    out.ghostToast = lastToast();
    check("user was told to sign up first",
      /sign up first|no account found/i.test(out.ghostToast || ""), out.ghostToast);

    // ---- 3. Correct credentials for a real account still work. ----------
    const good = await submit("loginForm", {
      email: "real@student.test", password: "secret123",
    });
    check("real account CAN log in", (user() || {}).email === "real@student.test",
      { user: user(), result: good });

    // ---- 4. Wrong password is refused. ---------------------------------
    store.delete("yp_user_v3");
    await submit("loginForm", { email: "real@student.test", password: "wrongpass" });
    check("wrong password refused", (user() || {}).email !== "real@student.test",
      { user: user() });
    out.wrongPwToast = lastToast();

    // ---- 5. Email casing must not create a duplicate account. -----------
    store.delete("yp_user_v3");
    const countBeforeCase = Object.keys(accounts()).length;
    await submit("loginForm", { email: "REAL@STUDENT.TEST", password: "secret123" });
    check("uppercase email does not create a duplicate account",
      Object.keys(accounts()).length === countBeforeCase,
      { before: countBeforeCase, after: Object.keys(accounts()).length });
    check("uppercase email logs into the same account",
      (user() || {}).email === "real@student.test", { user: user() });

    // ---- 6. Signup must refuse an email that already exists. -----------
    const beforeDup = Object.keys(accounts()).length;
    await submit("signupForm", {
      name: "Impostor", email: "real@student.test", password: "different1",
    });
    check("duplicate signup does not overwrite the account",
      (accounts()["real@student.test"] || {}).name === "Real Student",
      accounts()["real@student.test"]);
    check("duplicate signup did not add an account",
      Object.keys(accounts()).length === beforeDup);
    out.dupToast = lastToast();
    check("duplicate signup redirected to login",
      /already exists/i.test(out.dupToast || ""), out.dupToast);

    // ---- 7. Signup must enforce a minimum password length. -------------
    const beforeShort = Object.keys(accounts()).length;
    await submit("signupForm", { name: "Short", email: "short@pw.test", password: "abc" });
    check("short password rejected at signup",
      !accounts()["short@pw.test"] && Object.keys(accounts()).length === beforeShort,
      { accounts: Object.keys(accounts()), toast: lastToast() });
  })();

  out.failed = out.checks.filter((c) => !c.pass).map((c) => c.name);
  out.passed = out.checks.filter((c) => c.pass).length;
  out.total = out.checks.length;
}

console.log(JSON.stringify(out, null, 2));
process.exit(out.failed && out.failed.length ? 1 : 0);
