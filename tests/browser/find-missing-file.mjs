// Find which local resource 404s (the drive suite surfaced one ERR_FILE_NOT_FOUND).
import { spawn } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const url = process.argv[2];
const profile = mkdtempSync(join(tmpdir(), "yp-404-"));
const port = 9345;

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
    "--window-size=1400,900",
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
  const failures = [];
  ws.addEventListener("message", (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.method === "Network.loadingFailed") {
      failures.push({ url: msg.params.requestId, err: msg.params.errorText });
    }
    if (msg.method === "Network.requestWillBeSent") {
      failures.push({ reqId: msg.params.requestId, url: msg.params.request.url });
    }
    if (msg.method === "Network.responseReceived") {
      const st = msg.params.response.status;
      if (st >= 400) failures.push({ bad: st, url: msg.params.response.url });
    }
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
      }, 20000).unref();
    });
  return { ws, send, failures };
}

try {
  if (!(await waitForPort())) throw new Error("no devtools port");
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const page = targets.find((t) => t.type === "page");
  const { ws, send, failures } = await connect(page.webSocketDebuggerUrl);
  await send("Page.enable");
  await send("Runtime.enable");
  await send("Network.enable");
  await send("Page.navigate", { url });
  await sleep(4000);

  const reqs = new Map();
  const bad = [];
  const reqMap = new Map();
  for (const f of failures) {
    if (f.reqId && f.url) reqMap.set(f.reqId, f.url);
  }
  for (const f of failures) {
    if (f.bad) bad.push(f.url);
    if (f.err && reqMap.has(f.url)) {
      bad.push(`${reqMap.get(f.url)} -> ${f.err}`);
    }
  }
  console.log("failed/4xx resources:");
  console.log(bad.length ? bad.join("\n") : "(none)");
  ws.close();
} catch (e) {
  console.log("ERROR", e.message);
} finally {
  try { chrome.kill(); } catch { }
  setTimeout(() => process.exit(0), 200).unref();
}
