// Verifies the "remember who created the account" behavior end to end:
//  1) creating an account stores who created it + the details used
//  2) reopening signup prefills the form (no password)
//  3) submitting that same email again goes to login with the email filled in
//  4) an unknown email still cannot log in
import { spawn } from "node:child_process";
import { writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const url = process.argv[2];
const outPath = process.argv[3] || "verify-account-recall.json";

const profile = mkdtempSync(join(tmpdir(), "yp-chrome-"));
const port = 9334;

const chrome = spawn(
  CHROME,
  [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-extensions",
    "--headless=new",
    "--allow-file-access-from-files",
    "--window-size=1280,900",
    "about:blank",
  ],
  { stdio: "ignore", detached: false },
);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitForPort() {
  for (let i = 0; i < 80; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (r.ok) return true;
    } catch {}
    await sleep(150);
  }
  return false;
}

async function connect(wsUrl) {
  const ws = new WebSocket(wsUrl);
  await new Promise((res, rej) => {
    ws.addEventListener("open", res, { once: true });
    ws.addEventListener("error", rej, { once: true });
  });
  let id = 0;
  const pending = new Map();
  ws.addEventListener("message", (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(JSON.stringify(msg.error)));
      else resolve(msg.result);
    }
  });
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const mid = ++id;
      pending.set(mid, { resolve, reject });
      ws.send(JSON.stringify({ id: mid, method, params }));
    });
  return { ws, send };
}

const out = { checks: [], loadError: null };
let chromeExit = null;
chrome.on("exit", (c) => (chromeExit = c));

try {
  if (!(await waitForPort())) throw new Error("Chrome DevTools port never opened");
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  let page = targets.find((t) => t.type === "page");
  if (!page) throw new Error("no page target");

  const { ws, send } = await connect(page.webSocketDebuggerUrl);
  await send("Page.enable");
  await send("Runtime.enable");

  await send("Page.navigate", { url });
  await sleep(2500);

  const evaluate = async (expr) => {
    const r = await send("Runtime.evaluate", {
      expression: expr,
      returnByValue: true,
      awaitPromise: true,
    });
    if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
    return r.result.value;
  };

  const boot = await evaluate(`document.querySelectorAll('.page').length`);
  out.checks.push({ name: "page loaded with app content", pass: boot > 0, detail: boot });
  if (!boot) throw new Error("app did not render");

  // ---- 1. Create a real account ------------------------------------------
  await evaluate(`window.openSignup && window.openSignup()`);
  await sleep(400);
  const gate = await evaluate(`(() => {
    // Tick both required consent boxes, then continue to the form step.
    const pol = document.getElementById('consentPolicies');
    const age = document.getElementById('consentAge');
    const accept = document.getElementById('consentAccept');
    if (pol) { pol.checked = true; pol.dispatchEvent(new Event('change')); }
    if (age) { age.checked = true; age.dispatchEvent(new Event('change')); }
    return { disabled: accept ? accept.disabled : 'no button' };
  })()`);
  out.checks.push({ name: "consent accept enables after ticking both boxes", pass: gate.disabled === false, detail: gate });
  await sleep(200);
  await evaluate(`document.getElementById('consentAccept').click()`);
  await sleep(300);

  const created = await evaluate(`(() => {
    const f = document.getElementById('signupForm');
    if (!f) return 'no form';
    f.elements['name'].value = 'Ada Lovelace';
    f.elements['email'].value = 'ada@student.test';
    f.elements['password'].value = 'secret123';
    f.elements['phone'].value = '+63 900 000';
    f.elements['age'].value = '17';
    f.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    return 'submitted';
  })()`);
  out.checks.push({ name: "account created", pass: created === "submitted", detail: created });
  await sleep(600);

  const stored = await evaluate(`(() => {
    const accs = JSON.parse(localStorage.getItem('yp_accounts_v3') || '{}');
    const last = JSON.parse(localStorage.getItem('yp_last_signup_v3') || 'null');
    return {
      account: accs['ada@student.test'] || null,
      last,
    };
  })()`);
  out.checks.push({
    name: "account remembers its creator (creatorEmail)",
    pass: !!stored.account && stored.account.creatorEmail === "ada@student.test",
    detail: stored.account && stored.account.creatorEmail,
  });
  out.checks.push({
    name: "last signup details saved for recall",
    pass: !!stored.last && stored.last.email === "ada@student.test" && stored.last.name === "Ada Lovelace",
    detail: stored.last,
  });
  out.checks.push({
    name: "password is NOT written into the recall store",
    pass: !stored.last || !("password" in stored.last),
    detail: stored.last ? Object.keys(stored.last) : null,
  });

  // ---- 2. Reopen signup: the form should be prefilled ---------------------
  // Simulate a fresh visit: reload the page so only localStorage survives.
  await send("Page.navigate", { url });
  await sleep(2500);
  await evaluate(`window.openSignup && window.openSignup()`);
  await sleep(400);
  const prefilled = await evaluate(`(() => {
    const f = document.getElementById('signupForm');
    return {
      name: f.elements['name'].value,
      email: f.elements['email'].value,
      phone: f.elements['phone'].value,
      age: f.elements['age'].value,
      password: f.elements['password'].value,
    };
  })()`);
  out.checks.push({
    name: "reopening signup on a later visit prefills the remembered details",
    pass: prefilled.email === "ada@student.test" && prefilled.name === "Ada Lovelace" && prefilled.phone === "+63 900 000",
    detail: prefilled,
  });
  out.checks.push({
    name: "prefill never fills the password",
    pass: prefilled.password === "",
    detail: prefilled.password,
  });

  // ---- 3. Submitting the same email again goes to login, email filled -----
  await evaluate(`(() => {
    // tick consent, advance to the form, then re-submit the existing email
    const pol = document.getElementById('consentPolicies');
    const age = document.getElementById('consentAge');
    if (pol) { pol.checked = true; pol.dispatchEvent(new Event('change')); }
    if (age) { age.checked = true; age.dispatchEvent(new Event('change')); }
  })()`);
  await sleep(200);
  await evaluate(`document.getElementById('consentAccept').click()`);
  await sleep(300);
  await evaluate(`(() => {
    const f = document.getElementById('signupForm');
    f.elements['password'].value = 'secret123';
    f.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
  })()`);
  await sleep(900);
  const dup = await evaluate(`(() => {
    const loginEmail = document.querySelector("#loginForm input[name='email']");
    return {
      loginVisible: !document.getElementById('loginModal').classList.contains('hidden'),
      signupClosed: document.getElementById('signupModal').classList.contains('hidden'),
      loginEmail: loginEmail ? loginEmail.value : null,
      userEmail: JSON.parse(localStorage.getItem('yp_user_v3') || 'null')?.email || null,
    };
  })()`);
  out.checks.push({
    name: "duplicate email routes to the login form",
    pass: dup.loginVisible === true,
    detail: dup,
  });
  out.checks.push({
    name: "login form has the remembered email prefilled",
    pass: dup.loginEmail === "ada@student.test",
    detail: dup.loginEmail,
  });
  out.checks.push({
    name: "user is recalled as the account creator",
    pass: dup.userEmail === "ada@student.test",
    detail: dup.userEmail,
  });

  // ---- 4. Unknown email still refused at login ----------------------------
  const ghost = await evaluate(`(async () => {
    const f = document.getElementById('loginForm');
    f.elements['email'].value = 'stranger@nowhere.test';
    f.elements['password'].value = 'hunter22';
    f.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    await new Promise(r => setTimeout(r, 200));
    const accs = JSON.parse(localStorage.getItem('yp_accounts_v3') || '{}');
    return { accounts: Object.keys(accs), toast: (window.__toasts || []).slice(-1)[0] || '' };
  })()`);
  out.checks.push({
    name: "unknown email still cannot sign in or create an account",
    pass: ghost.accounts.length === 1 && ghost.accounts[0] === "ada@student.test",
    detail: ghost,
  });

  out.failed = out.checks.filter((c) => !c.pass).map((c) => c.name);
  out.passed = out.checks.filter((c) => c.pass).length;
  out.total = out.checks.length;

  ws.close();
} catch (e) {
  out.loadError = String(e && e.stack ? e.stack : e);
} finally {
  try { chrome.kill(); } catch {}
  writeFileSync(outPath, JSON.stringify(out, null, 2));
  console.log(JSON.stringify({ passed: out.passed, total: out.total, failed: out.failed, loadError: out.loadError }, null, 2));
  process.exit(out.loadError || (out.failed && out.failed.length) ? 1 : 0);
}
