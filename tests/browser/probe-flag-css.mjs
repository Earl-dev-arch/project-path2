// One-off diagnostic: why is the flag 15px wide instead of 20px?
import { spawn } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const url = process.argv[2];
const profile = mkdtempSync(join(tmpdir(), "yp-probe-"));
const port = 9336;

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
    "--window-size=1400,1200",
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

try {
  if (!(await waitForPort())) throw new Error("no port");
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const page = targets.find((t) => t.type === "page");
  const { ws, send } = await connect(page.webSocketDebuggerUrl);
  await send("Page.enable");
  await send("Runtime.enable");
  await send("Page.navigate", { url });
  await sleep(3000);

  const r = await send("Runtime.evaluate", {
    expression: `(() => {
      const fn = window.renderEducation;
      if (typeof fn === 'function') fn('Software Engineering & Development');
      const flag = document.querySelector('#educationContainer .country-flag');
      if (!flag) return { err: 'no flag node' };
      const cs = getComputedStyle(flag);
      const sheets = [...document.styleSheets].map((s, i) => {
        let flagRules = [];
        try {
          flagRules = [...s.cssRules]
            .filter(r => r.selectorText && /(^|,)\\s*\\.?fi(\\.fis)?\\s*(,|$)/.test(r.selectorText))
            .map(r => r.selectorText + ' { ' + r.style.cssText + ' }');
        } catch (e) { flagRules = ['(unreadable)']; }
        return { i, href: s.href ? String(s.href).slice(-45) : '(inline)', flagRules };
      });
      return {
        classes: flag.className,
        width: cs.width, height: cs.height, lineHeight: cs.lineHeight,
        fontSize: cs.fontSize, display: cs.display,
        matched: (flag.matches && flag.matches('.fi.fis')) || false,
        sheets,
        linkOrder: [...document.querySelectorAll('link[rel=stylesheet]')].map(l => String(l.href).slice(-45)),
      };
    })()`,
    returnByValue: true,
  });
  console.log(JSON.stringify(r.result.value, null, 1));
  ws.close();
} catch (e) {
  console.log("ERROR", e.message);
} finally {
  try { chrome.kill(); } catch { }
}
