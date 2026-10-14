// Find the exact SVG element whose path 'd' Chrome rejects.
// Strategy: for each <path>, clone its 'd' into a fresh path element in a detached
// SVG and read getTotalLength(); if it throws or returns 0 while d is non-empty, flag it.
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const url = process.argv[2];
const port = 9347;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const profile = mkdtempSync(join(tmpdir(), "yp-svg-"));
const chrome = spawn(
  CHROME,
  [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--headless=new",
    "--window-size=1280,900",
    "about:blank",
  ],
  { stdio: "ignore" },
);

async function waitForPort() {
  for (let i = 0; i < 80; i++) {
    try {
      if ((await fetch(`http://127.0.0.1:${port}/json/version`)).ok)
        return true;
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
      msg.error
        ? reject(new Error(JSON.stringify(msg.error)))
        : resolve(msg.result);
    }
  });
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const mid = ++id;
      pending.set(mid, { resolve, reject });
      ws.send(JSON.stringify({ id: mid, method, params }));
    });
  return { send, close: () => ws.close() };
}

try {
  if (!(await waitForPort())) throw new Error("no port");
  const targets = await (
    await fetch(`http://127.0.0.1:${port}/json/list`)
  ).json();
  const page = targets.find((t) => t.type === "page");
  const cdp = await connect(page.webSocketDebuggerUrl);
  await cdp.send("Runtime.enable");
  await cdp.send("Page.enable");
  await cdp.send("Page.navigate", { url });
  await sleep(1500);

  const expr = `(() => {
    const results = [];
    document.querySelectorAll('path').forEach((p, i) => {
      const d = p.getAttribute('d') || '';
      if (!d) return;
      const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
      svg.setAttribute('viewBox','0 0 24 24');
      const c = document.createElementNS('http://www.w3.org/2000/svg','path');
      c.setAttribute('d', d);
      svg.appendChild(c);
      document.body.appendChild(svg);
      let len = -1;
      try { len = c.getTotalLength(); } catch(e) { len = 'THROW:'+e.name; }
      const owner = p.closest('a')?.getAttribute('aria-label') || p.parentElement?.parentElement?.className || '';
      if (len === 0 || typeof len === 'string') {
        results.push({ i, owner: String(owner).slice(0,40), len, head: d.slice(0,60) });
      }
      svg.remove();
    });
    return results;
  })()`;

  const r = await cdp.send("Runtime.evaluate", {
    expression: expr,
    returnByValue: true,
    awaitPromise: true,
  });
  console.log(JSON.stringify(r.result.value, null, 2));
  cdp.close();
} catch (e) {
  console.log("FATAL", e.message);
} finally {
  try {
    chrome.kill();
  } catch {}
  await sleep(400);
  try {
    rmSync(profile, { recursive: true, force: true });
  } catch {}
}
