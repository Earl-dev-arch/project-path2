// Reproduces the reported "why cant i log in to the demo account" issue.
// It clears storage, reloads the app, then submits the demo credentials
// (yourpath@gmail.com / yourpath2026) through the real login form and reports
// what the app actually did.
import { spawn } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const url = process.argv[2] || "http://localhost:3000/";
const port = 9339;

const profile = mkdtempSync(join(tmpdir(), "yp-demo-"));
const chrome = spawn(
  CHROME,
  [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-extensions",
    "--headless=new",
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

let ws;
let id = 0;
const pending = new Map();
let currentContextId = null;

async function connect(wsUrl) {
  ws = new WebSocket(wsUrl);
  await new Promise((res, rej) => {
    ws.addEventListener("open", res, { once: true });
    ws.addEventListener("error", rej, { once: true });
  });
  ws.addEventListener("message", (ev) => {
    const msg = JSON.parse(ev.data);
    // Track the live default execution context so evaluates always land on the
    // current document (a reload creates a brand new context).
    if (msg.method === "Runtime.executionContextCreated") {
      const ctx = msg.params && msg.params.context;
      if (process.env.YP_DEBUG) {
        console.error("CTX", JSON.stringify(ctx && ctx.auxData), ctx && ctx.id);
      }
      if (ctx && ctx.auxData && ctx.auxData.isDefault) {
        currentContextId = ctx.id;
      }
    }
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(JSON.stringify(msg.error)));
      else resolve(msg.result);
    }
  });
}

function send(method, params = {}) {
  const mid = ++id;
  return new Promise((resolve, reject) => {
    pending.set(mid, { resolve, reject });
    ws.send(JSON.stringify({ id: mid, method, params }));
  });
}

async function main() {
  if (!(await waitForPort())) {
    console.log(JSON.stringify({ ok: false, error: "chrome not ready" }));
    process.exit(1);
  }
  const targets = await (
    await fetch(`http://127.0.0.1:${port}/json/list`)
  ).json();
  const page = targets.find((t) => t.type === "page");
  await connect(page.webSocketDebuggerUrl);

  await send("Page.enable");
  await send("Runtime.enable");

  const evaluate = async (expression) => {
    // Wait for a live default context, then evaluate against it explicitly.
    for (let i = 0; i < 40 && currentContextId === null; i++) await sleep(100);
    const r = await send("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
      ...(currentContextId !== null ? { contextId: currentContextId } : {}),
    });
    if (r.exceptionDetails) {
      throw new Error(JSON.stringify(r.exceptionDetails));
    }
    return r.result.value;
  };

  const navigate = async (target) => {
    const done = new Promise((resolve) => {
      const handler = (ev) => {
        const msg = JSON.parse(ev.data);
        if (msg.method === "Page.loadEventFired") {
          ws.removeEventListener("message", handler);
          resolve();
        }
      };
      ws.addEventListener("message", handler);
    });
    await send("Page.navigate", { url: target });
    await done;
    await sleep(400);
  };

  await navigate(url);

  const out = {};
  out.diag = await evaluate(`(() => ({ href: location.href, hasStorage: (() => { try { return !!window.localStorage; } catch (e) { return 'ERR:' + e.message; } })() }))()`);

  // Start clean, then reload so ensureDemoAccount() seeds the demo account.
  await evaluate(`(() => {
    for (const k of Object.keys(localStorage)) {
      if (k.indexOf('yp_') === 0) localStorage.removeItem(k);
    }
  })()`);
  await navigate(url);

  out.seeded = await evaluate(`(() => {
    const raw = localStorage.getItem('yp_accounts_v3');
    const accs = raw ? JSON.parse(raw) : {};
    return { keys: Object.keys(accs), demo: accs['yourpath@gmail.com'] || null };
  })()`);

  // Open login and submit the demo credentials exactly as a user would.
  await evaluate(`(() => {
    if (typeof openLogin === 'function') openLogin();
    else document.querySelector('[data-open="loginModal"], #openLogin')?.click();
  })()`);
  await sleep(300);

  const filled = await evaluate(`(() => {
    const f = document.querySelector('#loginForm');
    if (!f) return false;
    f.querySelector('input[name="email"]').value = 'yourpath@gmail.com';
    f.querySelector('input[name="password"]').value = 'yourpath2026';
    return true;
  })()`);
  out.formFilled = filled;

  await evaluate(`(() => {
    document.querySelector('#loginForm').dispatchEvent(
      new Event('submit', { cancelable: true, bubbles: true })
    );
  })()`);
  await sleep(2600);

  out.afterLogin = await evaluate(`(() => {
    const user = JSON.parse(localStorage.getItem('yp_user_v3') || 'null');
    const toasts = window.__toasts ? window.__toasts.slice(-3) : [];
    const dashboard = document.getElementById('dashboard');
    const dashboardVisible = dashboard ? !dashboard.classList.contains('hidden') : false;
    const flip = dashboard ? dashboard.classList.contains('yp-flip-in') : false;
    const loaderVisible = (() => {
      const l = document.getElementById('authLoader');
      return l ? !l.classList.contains('hidden') : false;
    })();
    return { user, toasts, dashboardVisible, flip, loaderVisible };
  })()`);

  console.log(JSON.stringify(out, null, 2));

  try { ws.close(); } catch {}
  chrome.kill();
  process.exit(0);
}

main().catch((e) => {
  console.log(JSON.stringify({ ok: false, error: String(e) }));
  try { chrome.kill(); } catch {}
  process.exit(1);
});
