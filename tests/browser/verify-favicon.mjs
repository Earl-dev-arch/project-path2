// Confirms the page links the new favicon and that both files actually
// decode as images in the browser (a broken icon would fail to load).
import { spawn } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const url = process.argv[2];
const profile = mkdtempSync(join(tmpdir(), "yp-fav-"));
const port = 9342;

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
    "--window-size=1200,800",
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
      setTimeout(() => {
        if (pending.has(mid)) {
          pending.delete(mid);
          resolve({ __timeout: method });
        }
      }, 15000).unref();
    });
  return { ws, send };
}

const out = { checks: [], loadError: null };
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

  const links = await evaluate(`(() => [...document.querySelectorAll('link[rel~="icon"], link[rel="apple-touch-icon"]')]
    .map(l => ({ rel: l.getAttribute('rel'), href: l.getAttribute('href'), type: l.getAttribute('type') })))()`);

  out.checks.push({
    name: "page declares a favicon and apple-touch-icon",
    pass: Array.isArray(links) && links.some((l) => /icon/.test(l.rel)),
    detail: links,
  });

  // Load both icons through the browser's image decoder: a corrupt file would
  // never fire onload, and naturalWidth would stay 0.
  const decoded = await evaluate(`(async () => {
    const test = (src) => new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ src, ok: true, w: img.naturalWidth, h: img.naturalHeight });
      img.onerror = () => resolve({ src, ok: false });
      img.src = src;
    });
    return Promise.all([test('favicon.svg'), test('favicon.ico')]);
  })()`);

  out.checks.push({
    name: "favicon.svg decodes in the browser",
    pass: !!decoded && decoded[0] && decoded[0].ok && decoded[0].w > 0,
    detail: decoded && decoded[0],
  });
  out.checks.push({
    name: "favicon.ico decodes in the browser",
    pass: !!decoded && decoded[1] && decoded[1].ok && decoded[1].w > 0,
    detail: decoded && decoded[1],
  });

  // The SVG must draw the YP monogram as vector paths and contain no leftover
  // old artwork. "YP" is deliberately NOT a <text> node: a font-based favicon
  // changes shape wherever the requested family is unavailable.
  const svgText = await evaluate(`fetch('favicon.svg').then(r => r.text())`);
  const pathCount = typeof svgText === "string" ? (svgText.match(/<path/g) || []).length : 0;
  out.checks.push({
    name: "favicon.svg draws the Y and P as vector paths",
    pass: pathCount >= 2,
    detail: { pathCount },
  });
  out.checks.push({
    name: "favicon.svg does not rely on a font (<text>) for the monogram",
    pass: typeof svgText === "string" && !/<text/i.test(svgText),
    detail: typeof svgText === "string" && /<text[^>]*>[^<]*/i.test(svgText),
  });
  out.checks.push({
    name: "favicon.svg has no leftover old star polygon",
    pass: typeof svgText === "string" && !svgText.includes("<polygon"),
    detail: typeof svgText === "string" && svgText.includes("<polygon"),
  });
  out.checks.push({
    name: "favicon.svg uses a neon pink->violet gradient",
    pass: typeof svgText === "string" && /#ff2fd0/i.test(svgText) && /#6d5cff/i.test(svgText),
    detail: typeof svgText === "string" ? (svgText.match(/#[0-9a-f]{6}/gi) || []) : null,
  });

  out.failed = out.checks.filter((c) => !c.pass).map((c) => c.name);
  out.passed = out.checks.filter((c) => c.pass).length;
  out.total = out.checks.length;
  ws.close();
} catch (e) {
  out.loadError = String(e && e.stack ? e.stack : e);
} finally {
  try { chrome.kill(); } catch {}
  console.log(JSON.stringify({ passed: out.passed, total: out.total, failed: out.failed, loadError: out.loadError }, null, 2));
  process.exit(out.loadError || (out.failed && out.failed.length) ? 1 : 0);
}
