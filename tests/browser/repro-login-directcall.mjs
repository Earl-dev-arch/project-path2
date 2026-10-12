// Calls the login form's onsubmit handler directly (rather than dispatching a
// synthetic Event) and awaits it, so we get a deterministic answer about
// whether the server-backed handler runs, what it returns, and whether the
// flip hand-over follows. Also probes the API endpoint directly.
import { spawn } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const url = process.argv[2] || "http://localhost:3000/";
const port = 9349;

const profile = mkdtempSync(join(tmpdir(), "yp-direct-"));
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
let ws;
let id = 0;
const pending = new Map();
let currentContextId = null;

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
  ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res, rej) => {
    ws.addEventListener("open", res, { once: true });
    ws.addEventListener("error", rej, { once: true });
  });
  ws.addEventListener("message", (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.method === "Runtime.executionContextCreated") {
      const ctx = msg.params && msg.params.context;
      if (ctx && ctx.auxData && ctx.auxData.isDefault)
        currentContextId = ctx.id;
    }
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error
        ? reject(new Error(JSON.stringify(msg.error)))
        : resolve(msg.result);
    }
  });

  await send("Page.enable");
  await send("Runtime.enable");
  await send("Page.navigate", { url });
  await sleep(700);

  const evaluate = async (expression) => {
    for (let i = 0; i < 40 && currentContextId === null; i++) await sleep(100);
    const r = await send("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
      ...(currentContextId !== null ? { contextId: currentContextId } : {}),
    });
    if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
    return r.result.value;
  };

  for (let i = 0; i < 40; i++) {
    const ready = await evaluate("typeof openLogin==='function'").catch(
      () => false,
    );
    if (ready) break;
    await sleep(150);
  }

  const out = {};

  // Probe the API directly from the page origin (this is what the handler does).
  out.api = await evaluate(`(async () => {
    try {
      const r = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'yourpath@gmail.com', password: 'yourpath2026' })
      });
      const text = await r.text();
      return { status: r.status, body: text.slice(0, 400) };
    } catch (e) { return { error: String(e) }; }
  })()`);

  // Open login, fill fields, then call the handler directly and await it.
  await evaluate(
    `(() => { if (typeof openLogin==='function') openLogin(); })()`,
  );
  await sleep(300);
  await evaluate(`(() => {
    const f = document.querySelector('#loginForm');
    f.querySelector('input[name="email"]').value = 'yourpath@gmail.com';
    f.querySelector('input[name="password"]').value = 'yourpath2026';
  })()`);

  out.callResult = await evaluate(`(async () => {
    const f = document.querySelector('#loginForm');
    const fakeEvent = { preventDefault(){}, target: f };
    try {
      await f.onsubmit(fakeEvent);
      return 'returned-ok';
    } catch (e) { return 'threw:' + String(e); }
  })()`);

  // Give the loader + flip time to complete.
  await sleep(3500);

  out.final = await evaluate(`(() => {
    const d = document.getElementById('dashboard');
    const u = JSON.parse(localStorage.getItem('yp_user_v3') || 'null');
    return {
      dashboardVisible: d ? !d.classList.contains('hidden') : false,
      userEmail: u ? u.email : null,
      reducedMotion: window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      loaderVisible: (()=>{const l=document.getElementById('authLoader');return l?!l.classList.contains('hidden'):null;})(),
    };
  })()`);

  console.log(JSON.stringify(out, null, 2));

  try {
    ws.close();
  } catch {}
  chrome.kill();
  process.exit(0);
}

main().catch((e) => {
  console.log(JSON.stringify({ ok: false, error: String(e) }));
  try {
    chrome.kill();
  } catch {}
  process.exit(1);
});
