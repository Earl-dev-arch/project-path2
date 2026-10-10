// Screenshot the dashboard mid-scroll to confirm the sidebar follows.
import { spawn } from "node:child_process";
import { writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const url = process.argv[2];
const outPath = process.argv[3] || "sidebar-preview.png";
const profile = mkdtempSync(join(tmpdir(), "yp-sbshot-"));
const port = 9344;

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
    "--window-size=1440,900",
    "about:blank",
  ],
  { stdio: "ignore", detached: false },
);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitForPort() {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (r.ok) return true;
    } catch { }
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
      pending.get(msg.id)(msg.result ?? msg.error);
      pending.delete(msg.id);
    }
  });
  const send = (method, params = {}) =>
    new Promise((resolve) => {
      const mid = ++id;
      pending.set(mid, resolve);
      ws.send(JSON.stringify({ id: mid, method, params }));
      setTimeout(() => {
        if (pending.has(mid)) { pending.delete(mid); resolve({ __timeout: method }); }
      }, 25000).unref();
    });
  return { ws, send };
}

try {
  if (!(await waitForPort())) throw new Error("no devtools port");
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const page = targets.find((t) => t.type === "page");
  const { ws, send } = await connect(page.webSocketDebuggerUrl);
  await send("Page.enable");
  await send("Runtime.enable");
  await send("Page.navigate", { url });
  await sleep(3000);

  const evaluate = async (expr) => {
    const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true });
    if (r && r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
    return r ? r.result?.value : undefined;
  };

  // Sign up so the dashboard sidebar exists.
  await evaluate(`(() => {
    if (typeof openSignup !== 'function') return 'no';
    openSignup();
    const p = document.getElementById('consentPolicies');
    const a = document.getElementById('consentAge');
    if (p) { p.checked = true; p.dispatchEvent(new Event('change')); }
    if (a) { a.checked = true; a.dispatchEvent(new Event('change')); }
    return 'ok';
  })()`);
  await sleep(500);
  await evaluate(`document.getElementById('consentAccept').click()`);
  await sleep(400);
  await evaluate(`(() => {
    const f = document.getElementById('signupForm');
    f.elements['name'].value = 'QA Student';
    f.elements['email'].value = 'qa.sbshot@student.test';
    f.elements['password'].value = 'secret123';
    f.elements['age'].value = '17';
    f.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    return 'submitted';
  })()`);
  await sleep(4000);
  await evaluate(`(() => { if (typeof showPage === 'function') showPage('dashboard'); return true; })()`);
  await sleep(1000);

  // Mid-scroll: this is where the old build lost the sidebar entirely.
  const info = await evaluate(`(async () => {
    const maxY = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo({ top: Math.round(maxY * 0.6), behavior: 'instant' });
    await new Promise(r => setTimeout(r, 500));
    const sb = document.querySelector('.sidebar').getBoundingClientRect();
    return {
      scrollY: Math.round(window.scrollY), maxY,
      sidebarTop: Math.round(sb.top), sidebarBottom: Math.round(sb.bottom),
      viewportH: window.innerHeight,
      docScrollW: document.documentElement.scrollWidth,
      clientW: document.documentElement.clientWidth,
    };
  })()`);
  console.log("mid-scroll:", JSON.stringify(info));

  const shot = await send("Page.captureScreenshot", { format: "png" });
  writeFileSync(outPath, Buffer.from(shot.data, "base64"));
  console.log("wrote " + outPath);
  ws.close();
} catch (e) {
  console.log("ERROR", e.message);
} finally {
  try { chrome.kill(); } catch { }
  setTimeout(() => process.exit(0), 200).unref();
}
