// Verify: socials render as styled buttons with valid SVG, no console SVG errors,
// resources section has the expanded link set.
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const url = process.argv[2];
const port = 9350;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const profile = mkdtempSync(join(tmpdir(), "yp-final-"));
const chrome = spawn(
  CHROME,
  [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--headless=new",
    "--allow-file-access-from-files",
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

const out = { checks: {}, errors: [] };
try {
  if (!(await waitForPort())) throw new Error("no port");
  const targets = await (
    await fetch(`http://127.0.0.1:${port}/json/list`)
  ).json();
  const cdp = await connect(
    targets.find((t) => t.type === "page").webSocketDebuggerUrl,
  );
  await cdp.send("Runtime.enable");
  await cdp.send("Log.enable");
  await cdp.send("Page.enable");
  const errs = [];
  const collect = setInterval(() => {
    while (cdp.events.length) {
      const e = cdp.events.shift();
      if (e.method === "Log.entryAdded" && e.params.entry.level === "error")
        errs.push(String(e.params.entry.text).slice(0, 160));
      if (e.method === "Runtime.exceptionThrown")
        errs.push(
          "EXC: " +
            String(
              e.params.exceptionDetails?.exception?.description ||
                e.params.exceptionDetails?.text ||
                "",
            ).slice(0, 160),
        );
    }
  }, 100);
  const evaluate = async (expr) => {
    const r = await cdp.send("Runtime.evaluate", {
      expression: expr,
      returnByValue: true,
      awaitPromise: true,
    });
    if (r.exceptionDetails)
      return {
        __error: String(
          r.exceptionDetails.exception?.description || r.exceptionDetails.text,
        ),
      };
    return r.result.value;
  };
  await cdp.send("Page.navigate", { url });
  for (let i = 0; i < 60; i++) {
    if ((await evaluate("document.readyState")) === "complete") break;
    await sleep(150);
  }
  await sleep(600);

  // Navigate to the about section and inspect the socials
  out.checks.socials = await evaluate(`(() => {
    const links = [...document.querySelectorAll('.social-link')];
    return {
      count: links.length,
      labels: links.map(a => a.querySelector('span')?.textContent),
      styled: links.map(a => { const s = getComputedStyle(a); return s.display === 'inline-flex' && s.borderRadius === '999px'; }),
      svgNonEmpty: links.map(a => { const p = a.querySelector('path'); return !!p && (p.getTotalLength() > 0); }),
      hrefs: links.map(a => a.href),
    };
  })()`);

  out.checks.resources = await evaluate(`(() => {
    const sec = document.getElementById('resources');
    const links = [...sec.querySelectorAll('.resources a')];
    return {
      count: links.length,
      titles: links.map(a => a.childNodes[0]?.textContent?.trim()).filter(Boolean),
      allHaveTargetBlank: links.every(a => a.target === '_blank'),
      allHaveRel: links.every(a => a.rel === 'noopener'),
    };
  })()`);

  clearInterval(collect);
  out.errors = errs;
  cdp.close();
  console.log(JSON.stringify(out, null, 2));
  process.exitCode = errs.length ? 1 : 0;
} catch (e) {
  out.errors.push(String(e.stack || e));
  console.log(JSON.stringify(out, null, 2));
  process.exitCode = 1;
} finally {
  try {
    chrome.kill();
  } catch {}
  await sleep(400);
  try {
    rmSync(profile, { recursive: true, force: true });
  } catch {}
}
