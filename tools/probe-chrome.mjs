// Minimal timing probe: where does the CDP session stall?
const port = 9341;
import { spawn } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
console.log("t0 spawn");
const profile = mkdtempSync(join(tmpdir(), "yp-probe-"));
const chrome = spawn(
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-extensions",
    "--headless=new",
    "--allow-file-access-from-files",
    "about:blank",
  ],
  { stdio: ["ignore", "pipe", "pipe"] },
);
chrome.stderr.on("data", (d) => console.log("chrome stderr:", String(d).trim().slice(0, 200)));
chrome.on("exit", (c) => console.log("chrome exited", c));

try {
  let version = null;
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (r.ok) { version = await r.json(); console.log("version after", i * 150, "ms"); break; }
    } catch { }
    await sleep(150);
  }
  if (!version) throw new Error("no version");

  for (let i = 0; i < 40; i++) {
    const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
    console.log(`list try ${i}:`, JSON.stringify(list.map((t) => t.type)));
    const page = list.find((t) => t.type === "page" && t.webSocketDebuggerUrl);
    if (page) {
      console.log("page target found at try", i);
      console.log("ws url:", page.webSocketDebuggerUrl);
      const ws = new WebSocket(page.webSocketDebuggerUrl);
      await new Promise((res, rej) => {
        ws.addEventListener("open", () => { console.log("ws open"); res(); }, { once: true });
        ws.addEventListener("error", (e) => { console.log("ws error", e.message); rej(e); }, { once: true });
      });
      let id = 0;
      const pending = new Map();
      ws.addEventListener("message", (ev) => {
        const msg = JSON.parse(ev.data);
        if (msg.id && pending.has(msg.id)) {
          const { resolve } = pending.get(msg.id);
          pending.delete(msg.id);
          resolve(msg.result ?? msg.error);
        }
      });
      const send = (method, params = {}) =>
        new Promise((resolve) => {
          const mid = ++id;
          pending.set(mid, { resolve });
          ws.send(JSON.stringify({ id: mid, method, params }));
          setTimeout(() => { if (pending.has(mid)) { pending.delete(mid); resolve("TIMEOUT:" + method); } }, 4000);
        });
      console.log("Page.enable ->", JSON.stringify(await send("Page.enable")));
      console.log("Runtime.enable ->", JSON.stringify(await send("Runtime.enable")));
      console.log("navigate ->", JSON.stringify(await send("Page.navigate", { url: "about:blank" })));
      console.log("readyState ->", JSON.stringify(await send("Runtime.evaluate", { expression: "document.readyState", returnByValue: true })));
      ws.close();
      break;
    }
    await sleep(200);
  }
} catch (e) {
  console.log("ERROR", e.message);
} finally {
  try { chrome.kill(); } catch { }
  setTimeout(() => process.exit(0), 300).unref();
}
