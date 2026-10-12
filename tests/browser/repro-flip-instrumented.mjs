// Instruments playAuthFlipTransition to prove the flip hand-over runs during a
// real demo login. It records every invocation (and whether the class landed on
// #dashboard) by wrapping the function before submitting the login form, then
// polls for the recorded call. This avoids racing the ~0.7s animation window.
import { spawn } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const url = process.argv[2] || "http://localhost:3000/";
const port = 9343;

const profile = mkdtempSync(join(tmpdir(), "yp-flipin-"));
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
  await sleep(600);

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

  const out = {};

  out.reducedMotion = await evaluate(
    `(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) || false`,
  );

  // Wait for app script readiness, then clear storage + reload to seed demo.
  for (let i = 0; i < 40; i++) {
    const ready = await evaluate(
      "typeof playAuthFlipTransition==='function'",
    ).catch(() => false);
    if (ready) break;
    await sleep(150);
  }

  await evaluate(`(() => {
    window.__flipCalls = [];
    const orig = window.playAuthFlipTransition;
    window.playAuthFlipTransition = function(cb){
      window.__flipCalls.push({ t: performance.now(), hasClass: document.getElementById('dashboard')?.classList.contains('yp-flip-in') || false });
      const ret = orig.apply(this, arguments);
      const d = document.getElementById('dashboard');
      window.__flipCalls[window.__flipCalls.length - 1].afterClass = d ? d.classList.contains('yp-flip-in') : false;
      window.__flipCalls[window.__flipCalls.length - 1].animName = d ? getComputedStyle(d).animationName : null;
      return ret;
    };
  })()`);

  // Submit demo credentials through the real form.
  await evaluate(
    `(() => { if (typeof openLogin==='function') openLogin(); })()`,
  );
  await sleep(300);
  await evaluate(`(() => {
    const f = document.querySelector('#loginForm');
    f.querySelector('input[name="email"]').value = 'yourpath@gmail.com';
    f.querySelector('input[name="password"]').value = 'yourpath2026';
  })()`);
  await evaluate(
    `(() => { document.querySelector('#loginForm').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true })); })()`,
  );

  // Poll for the recorded flip call (may take a couple seconds behind the loader).
  for (let i = 0; i < 40; i++) {
    const n = await evaluate(`(window.__flipCalls||[]).length`).catch(() => 0);
    if (n > 0) break;
    await sleep(200);
  }

  out.flipCalls = await evaluate(`JSON.stringify(window.__flipCalls || [])`);
  out.final = await evaluate(`(() => {
    const d = document.getElementById('dashboard');
    return {
      visible: d ? !d.classList.contains('hidden') : false,
      hasFlip: d ? d.classList.contains('yp-flip-in') : false,
      user: JSON.parse(localStorage.getItem('yp_user_v3') || 'null'),
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
