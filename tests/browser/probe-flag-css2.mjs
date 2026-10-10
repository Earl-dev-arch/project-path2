// Diagnostic 2: dump EVERY rule that matches the flag element, with its origin.
import { spawn } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const url = process.argv[2];
const profile = mkdtempSync(join(tmpdir(), "yp-probe2-"));
const port = 9337;

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
  await send("DOM.enable");
  await send("CSS.enable");
  await send("Page.navigate", { url });
  await sleep(3000);

  const nodeId = (
    await send("Runtime.evaluate", {
      expression: `(() => {
        const fn = window.renderEducation;
        if (typeof fn === 'function') fn('Software Engineering & Development');
        window.__flagEl = document.querySelector('#educationContainer .country-flag');
        return true;
      })()`,
      returnByValue: true,
    })
  ).result.value;

  const doc = await send("DOM.getDocument", { depth: -1 });
  const { nodeId: id } = await send("DOM.querySelector", {
    nodeId: doc.root.nodeId,
    selector: "#educationContainer .country-flag",
  });

  const matched = await send("CSS.getMatchedStylesForNode", { nodeId: id });
  const out = {
    attributes: matched.inlineStyle,
    matchedRules: (matched.matchedCSSRules || []).map((r) => ({
      origin: r.rule.origin,
      selector: r.rule.selectorList.text,
      width: r.rule.style.width,
      height: r.rule.style.height,
      fontSize: r.rule.style.fontSize,
      lineHeight: r.rule.style.lineHeight,
      props: r.rule.style.cssProperties.filter((p) => ["width", "height", "line-height", "font-size", "display"].includes(p.name)).map((p) => `${p.name}:${p.value}${p.implicit ? " (implicit)" : ""}${p.disabled ? " (disabled)" : ""}`),
    })),
    inherited: (matched.inherited || []).map((h) => (h.matchedCSSRules || []).map((r) => `${r.rule.selectorList.text} { ${r.rule.style.cssProperties.map(p => p.name + ":" + p.value).join("; ")} }`)).flat(),
    inline: matched.inlineStyle ? matched.inlineStyle.cssProperties.map((p) => `${p.name}:${p.value}`) : [],
  };
  console.log(JSON.stringify(out, null, 1));
  ws.close();
} catch (e) {
  console.log("ERROR", e.message);
} finally {
  try { chrome.kill(); } catch { }
}
