// Observes the #dashboard element for the yp-flip-in class using a
// MutationObserver installed before login. Unlike function hooking this is
// reliable regardless of how the app resolves playAuthFlipTransition, and it
// cannot miss the ~0.7s animation window because the observer fires on change.
import { spawn } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const url = process.argv[2] || "http://localhost:3000/";
const port = 9345;

const profile = mkdtempSync(join(tmpdir(), "yp-observer-"));
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

  // Wait for app readiness.
  for (let i = 0; i < 40; i++) {
    const ready = await evaluate("typeof openLogin==='function'").catch(
      () => false,
    );
    if (ready) break;
    await sleep(150);
  }

  // Install a MutationObserver on #dashboard that records class additions.
  await evaluate(`(() => {
    window.__flipEvents = [];
    const d = document.getElementById('dashboard');
    if (!d) return false;
    const obs = new MutationObserver(() => {
      if (d.classList.contains('yp-flip-in')) {
        window.__flipEvents.push({ t: performance.now(), anim: getComputedStyle(d).animationName, dur: getComputedStyle(d).animationDuration });
      }
    });
    obs.observe(d, { attributes: true, attributeFilter: ['class'] });
    return true;
  })()`);

  // Submit demo credentials.
  await evaluate(
    `(() => { if (typeof openLogin==='function') openLogin(); })()`,
  );
  await sleep(300);
  const filled = await evaluate(`(() => {
    const f = document.querySelector('#loginForm');
    if (!f) return false;
    f.querySelector('input[name="email"]').value = 'yourpath@gmail.com';
    f.querySelector('input[name="password"]').value = 'yourpath2026';
    return true;
  })()`);
  out.formFilled = filled;
  await evaluate(
    `(() => { document.querySelector('#loginForm').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true })); })()`,
  );

  // Wait for the flip event to be recorded (behind the auth loader).
  for (let i = 0; i < 60; i++) {
    const n = await evaluate(`(window.__flipEvents||[]).length`).catch(() => 0);
    if (n > 0) break;
    await sleep(200);
  }

  out.flipEvents = await evaluate(`JSON.stringify(window.__flipEvents || [])`);
  out.state = await evaluate(`(() => {
    const d = document.getElementById('dashboard');
    const u = JSON.parse(localStorage.getItem('yp_user_v3') || 'null');
    const modal = document.getElementById('authModal');
    return {
      dashboardVisible: d ? !d.classList.contains('hidden') : false,
      dashboardHasFlip: d ? d.classList.contains('yp-flip-in') : false,
      userEmail: u ? u.email : null,
      modalHidden: modal ? modal.classList.contains('hidden') : null,
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
