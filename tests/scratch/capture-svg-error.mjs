// Capture the exact source of the "attribute d: Expected number" error.
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const url = process.argv[2];
const port = 9348;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const profile = mkdtempSync(join(tmpdir(), "yp-svg2-"));
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
  const events = [];
  ws.addEventListener("message", (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error
        ? reject(new Error(JSON.stringify(msg.error)))
        : resolve(msg.result);
    } else if (msg.method) events.push(msg);
  });
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const mid = ++id;
      pending.set(mid, { resolve, reject });
      ws.send(JSON.stringify({ id: mid, method, params }));
    });
  return { send, events, close: () => ws.close() };
}

try {
  if (!(await waitForPort())) throw new Error("no port");
  const targets = await (
    await fetch(`http://127.0.0.1:${port}/json/list`)
  ).json();
  const page = targets.find((t) => t.type === "page");
  const cdp = await connect(page.webSocketDebuggerUrl);
  await cdp.send("Runtime.enable");
  await cdp.send("Log.enable");
  await cdp.send("Page.enable");
  await cdp.send("Page.navigate", { url });
  await sleep(2500);

  const errs = cdp.events.filter(
    (e) => e.method === "Log.entryAdded" && e.params.entry.level === "error",
  );
  const exc = cdp.events.filter((e) => e.method === "Runtime.exceptionThrown");

  console.log("LOG ERRORS:", errs.length);
  errs.forEach((e) => {
    const en = e.params.entry;
    console.log("  text:", en.text);
    console.log("  source:", en.source, "line:", en.lineNumber, "url:", en.url);
  });
  console.log("EXCEPTIONS:", exc.length);
  exc.forEach((e) => {
    const d = e.params.exceptionDetails;
    console.log("  text:", d.text);
    console.log("  url:", d.url, "line:", d.lineNumber);
    console.log(
      "  stack:",
      (d.stackTrace?.callFrames || [])
        .slice(0, 4)
        .map((f) => `${f.functionName}@${f.url}:${f.lineNumber}`)
        .join(" | "),
    );
  });
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
