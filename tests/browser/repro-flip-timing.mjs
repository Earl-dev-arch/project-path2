// Verifies the flip hand-over actually runs: clears storage, reloads, submits
// the demo credentials, then samples #dashboard for the yp-flip-in class at a
// few moments after the auth loader completes. Reports whether the animation
// was observed (class present) and that it is removed afterwards.
import { spawn } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const url = process.argv[2] || "file:///c:/Users/yuri/Documents/project-path2/public/index.html";
const port = 9341;

const profile = mkdtempSync(join(tmpdir(), "yp-flip-"));
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
      if (ctx && ctx.auxData && ctx.auxData.isDefault) currentContextId = ctx.id;
    }
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
    }
  });

  await send("Page.enable");
  await send("Runtime.enable");

  // Navigate to the app origin first so localStorage is same-origin and the
  // app script exists; evaluating on about:blank throws a SecurityError.
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

  // Wait for the app script to be ready.
  for (let i = 0; i < 40; i++) {
    const ready = await evaluate("typeof openLogin==='function'").catch(() => false);
    if (ready) break;
    await sleep(150);
  }

  // Clean storage and reload so ensureDemoAccount() seeds.
  await evaluate(`(() => { for (const k of Object.keys(localStorage)) { if (k.indexOf('yp_')===0) localStorage.removeItem(k); } })()`);
  await send("Page.reload", { ignoreCache: false });
  await sleep(900);
  for (let i = 0; i < 40; i++) {
    const ready = await evaluate("typeof openLogin==='function'").catch(() => false);
    if (ready) break;
    await sleep(150);
  }

  // Open login, fill demo creds, submit.
  await evaluate(`(() => { if (typeof openLogin==='function') openLogin(); })()`);
  await sleep(300);
  await evaluate(`(() => {
    const f = document.querySelector('#loginForm');
    f.querySelector('input[name="email"]').value = 'yourpath@gmail.com';
    f.querySelector('input[name="password"]').value = 'yourpath2026';
  })()`);
  await evaluate(`(() => { document.querySelector('#loginForm').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true })); })()`);

  // Sample the dashboard class across the hand-over window.
  const samples = [];
  for (let i = 0; i < 16; i++) {
    const s = await evaluate(`(() => {
      const d = document.getElementById('dashboard');
      const anim = d ? getComputedStyle(d).animationName : null;
      return {
        t: performance.now().toFixed(0),
        hasFlip: d ? d.classList.contains('yp-flip-in') : false,
        animName: anim,
        visible: d ? !d.classList.contains('hidden') : false,
      };
    })()`);
    samples.push(s);
    await sleep(200);
  }

  console.log(JSON.stringify({
    observedFlip: samples.some((s) => s.hasFlip),
    observedAnimName: samples.find((s) => s.animName && s.animName !== 'none')?.animName || null,
    finalVisible: samples[samples.length - 1].visible,
    finalHasFlip: samples[samples.length - 1].hasFlip,
    samples,
  }, null, 2));

  try { ws.close(); } catch {}
  chrome.kill();
  process.exit(0);
}

main().catch((e) => {
  console.log(JSON.stringify({ ok: false, error: String(e) }));
  try { chrome.kill(); } catch {}
  process.exit(1);
});
