// Verifies the login hand-over actually applies the flip animation to the
// dashboard. Logs in with the demo account, then observes the class list of
// #dashboard for the duration of the auth-loader -> workspace hand-over and
// reports whether "yp-flip-in" ever appeared.
import { spawn } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const url = process.argv[2] || "http://localhost:3000/";
const port = 9351;

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
    "--window-size=1280,900",
    "about:blank",
  ],
  { stdio: "ignore", detached: false },
);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ws;
let id = 0;
const pending = new Map();

function send(method, params = {}) {
  const mid = ++id;
  return new Promise((resolve, reject) => {
    pending.set(mid, { resolve, reject });
    ws.send(JSON.stringify({ id: mid, method, params }));
  });
}

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

async function main() {
  if (!(await waitForPort())) {
    console.log(JSON.stringify({ ok: false, error: "chrome not ready" }));
    process.exit(1);
  }

  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const page = targets.find((t) => t.type === "page");
  ws = new WebSocket(page.webSocketDebuggerUrl);

  const results = { consoleErrors: [] };
  ws.addEventListener("message", (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id).resolve(msg.result);
      pending.delete(msg.id);
    } else if (msg.method === "Runtime.consoleAPICalled" && msg.params.type === "error") {
      results.consoleErrors.push(msg.params.args.map((a) => a.value).join(" "));
    }
  });

  await new Promise((r) => ws.addEventListener("open", r));
  await send("Runtime.enable");
  await send("Page.enable");
  await send("Page.navigate", { url });
  await sleep(2500);

  // Fill the login form and submit, then watch #dashboard for the flip class.
  const res = await send("Runtime.evaluate", {
    awaitPromise: true,
    returnByValue: true,
    expression: `(async () => {
      const set = (sel, val) => {
        const el = document.querySelector(sel);
        el.value = val;
        el.dispatchEvent(new Event('input', { bubbles: true }));
      };
      const email = document.querySelector('#loginForm [name="email"]');
      const pass = document.querySelector('#loginForm [name="password"]');
      email.value = 'YourPath@gmail.com';
      pass.value = 'yourpath2026';
      email.dispatchEvent(new Event('input', { bubbles: true }));
      pass.dispatchEvent(new Event('input', { bubbles: true }));

      const dashboard = document.getElementById('dashboard');
      let sawFlip = false;
      // Headless Chrome reports prefers-reduced-motion: reduce, and in that mode
      // playAuthFlipTransition adds the class and immediately removes it in the
      // same tick — so a MutationObserver that later calls contains() races and
      // can miss it. Instead wrap the function and sample the class list
      // synchronously, right after the app applies it.
      const orig = window.playAuthFlipTransition;
      if (typeof orig === 'function') {
        window.playAuthFlipTransition = function (cb) {
          orig.apply(this, arguments);
          if (dashboard.classList.contains('yp-flip-in')) sawFlip = true;
        };
      } else {
        const obs = new MutationObserver(() => {
          if (dashboard.classList.contains('yp-flip-in')) sawFlip = true;
        });
        obs.observe(dashboard, { attributes: true, attributeFilter: ['class'] });
      }

      document.getElementById('loginForm').requestSubmit();
      await new Promise(r => setTimeout(r, 2600));
      return {
        sawFlip,
        dashboardVisible: !dashboard.classList.contains('hidden'),
        userEmail: (state && state.user && state.user.email) || null
      };
    })()`,
  });

  console.log(JSON.stringify({ final: res.result.value, consoleErrors: results.consoleErrors }, null, 2));
  ws.close();
  chrome.kill();
}

main().catch((e) => {
  console.log(JSON.stringify({ ok: false, error: String(e) }));
  process.exit(1);
});
