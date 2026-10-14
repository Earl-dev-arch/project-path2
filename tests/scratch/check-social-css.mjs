import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const url = process.argv[2];
const port = 9351;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const profile = mkdtempSync(join(tmpdir(), "yp-css-"));
const chrome = spawn(
  CHROME,
  [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    "--no-first-run",
    "--headless=new",
    "--allow-file-access-from-files",
    "--window-size=1280,900",
    "about:blank",
  ],
  { stdio: "ignore" },
);
async function wait() {
  for (let i = 0; i < 80; i++) {
    try {
      if ((await fetch(`http://127.0.0.1:${port}/json/version`)).ok) return;
    } catch {}
    await sleep(150);
  }
  throw new Error("no port");
}
try {
  await wait();
  const targets = await (
    await fetch(`http://127.0.0.1:${port}/json/list`)
  ).json();
  const ws = new WebSocket(
    targets.find((t) => t.type === "page").webSocketDebuggerUrl,
  );
  await new Promise((res, rej) => {
    ws.addEventListener("open", res, { once: true });
    ws.addEventListener("error", rej);
  });
  let id = 0;
  const pending = new Map();
  ws.addEventListener("message", (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) {
      const p = pending.get(m.id);
      pending.delete(m.id);
      m.error
        ? p.reject(new Error(JSON.stringify(m.error)))
        : p.resolve(m.result);
    }
  });
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const mid = ++id;
      pending.set(mid, { resolve, reject });
      ws.send(JSON.stringify({ id: mid, method, params }));
    });
  await send("Runtime.enable");
  await send("Page.enable");
  await send("Page.navigate", { url });
  for (let i = 0; i < 60; i++) {
    const r = await send("Runtime.evaluate", {
      expression: "document.readyState",
      returnByValue: true,
    });
    if (r.result.value === "complete") break;
    await sleep(150);
  }
  await sleep(500);
  const r = await send("Runtime.evaluate", {
    returnByValue: true,
    expression: `(() => {
    const a = document.querySelector('.social-link');
    const s = getComputedStyle(a);
    return { display: s.display, radius: s.borderRadius, padding: s.padding, bg: s.backgroundColor, sectionVisible: getComputedStyle(document.getElementById('about')).display, rectW: Math.round(a.getBoundingClientRect().width), rectH: Math.round(a.getBoundingClientRect().height) };
  })()`,
  });
  console.log(JSON.stringify(r.result.value, null, 2));
  ws.close();
} catch (e) {
  console.log("FATAL", e.message);
} finally {
  try {
    chrome.kill();
  } catch {}
  await sleep(300);
  try {
    rmSync(profile, { recursive: true, force: true });
  } catch {}
}
