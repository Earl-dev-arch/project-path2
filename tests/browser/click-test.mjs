// Click every button the previous pass flagged, and observe whether anything
// changes. Proves or disproves "dead button" claims behaviourally.
import { spawn } from "node:child_process";
import { writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const url = process.argv[2];
const outPath = process.argv[3] || "qa-result3.json";
const profile = mkdtempSync(join(tmpdir(), "yp-chrome-"));
const port = 9335;

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
    "--window-size=1280,900",
    "about:blank",
  ],
  { stdio: "ignore" },
);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
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
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) {
      const p = pending.get(m.id);
      pending.delete(m.id);
      m.error
        ? p.reject(new Error(JSON.stringify(m.error)))
        : p.resolve(m.result);
    } else if (m.method) events.push(m);
  });
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const mid = ++id;
      pending.set(mid, { resolve, reject });
      ws.send(JSON.stringify({ id: mid, method, params }));
    });
  return { send, events, close: () => ws.close() };
}

const result = { url, buttons: [], pageErrors: [] };
try {
  if (!(await waitForPort())) throw new Error("no devtools");
  const targets = await (
    await fetch(`http://127.0.0.1:${port}/json/list`)
  ).json();
  const cdp = await connect(
    targets.find((t) => t.type === "page").webSocketDebuggerUrl,
  );
  await cdp.send("Runtime.enable");
  await cdp.send("Page.enable");

  const raw = cdp.events;
  setInterval(() => {
    while (raw.length) {
      const e = raw.shift();
      if (e.method === "Runtime.exceptionThrown")
        result.pageErrors.push(
          String(e.params.exceptionDetails?.exception?.description || "").slice(
            0,
            200,
          ),
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
        __error: String(r.exceptionDetails.exception?.description || "").slice(
          0,
          200,
        ),
      };
    return r.result.value;
  };

  await cdp.send("Page.navigate", { url });
  for (let i = 0; i < 60; i++) {
    if (
      (await evaluate("document.readyState")) === "complete" &&
      (await evaluate('(document.body.innerText||"").length')) > 0
    )
      break;
    await sleep(150);
  }
  await sleep(500);

  // Define a stable signature of "the page did something".
  const SIG = `(() => {
    const active = document.querySelector('section.page.active')?.id || '';
    const tab = document.querySelector('.tab.active')?.id || '';
    const openModals = [...document.querySelectorAll('.modal-backdrop')].filter(m=>!m.classList.contains('hidden')).map(m=>m.id).join(',');
    const toast = (document.getElementById('toast')?.textContent||'').trim();
    const bodyLen = (document.body.innerText||'').length;
    return active+'|'+tab+'|'+openModals+'|'+toast+'|'+bodyLen;
  })()`;

  // Identify each flagged button by a stable selector, then click it in isolation.
  const targetsInfo = await evaluate(`(() => {
    const out=[];
    const want=['Log in','Sign up free','Start Exploring','Log out','Build my roadmap','Next question','Privacy notice','I agree — Continue','Accept','Essential only','Cancel'];
    document.querySelectorAll('button').forEach((b,i)=>{
      const t=(b.textContent||'').replace(/\\s+/g,' ').trim();
      if(want.some(w=>t.includes(w))){
        b.setAttribute('data-qa-idx', String(i));
        out.push({ idx:i, text:t.slice(0,32), cls:(b.className||'').slice(0,24) });
      }
    });
    return out;
  })()`);

  for (const info of targetsInfo) {
    const before = await evaluate(SIG);
    const clicked = await evaluate(`(() => {
      const b=document.querySelector('[data-qa-idx="${info.idx}"]');
      if(!b) return 'gone';
      b.click();
      return 'clicked';
    })()`);
    await sleep(500);
    const after = await evaluate(SIG);
    result.buttons.push({
      text: info.text,
      cls: info.cls,
      clicked,
      changed: before !== after,
      before: String(before).slice(0, 60),
      after: String(after).slice(0, 60),
    });
    // Reset to a clean public state between probes.
    await evaluate(`(() => {
      document.querySelectorAll('.modal-backdrop').forEach(m=>m.classList.add('hidden'));
      try{ if(typeof state!=='undefined' && state.user){ state.user=null; saveState(); updateUI(); } }catch(e){}
      try{ showPage('home'); }catch(e){}
    })()`);
    await sleep(250);
  }

  cdp.close();
  writeFileSync(outPath, JSON.stringify(result, null, 2));
  console.log("OK ->", outPath);
} catch (e) {
  result.fatal = String((e && e.stack) || e);
  try {
    writeFileSync(outPath, JSON.stringify(result, null, 2));
  } catch {}
  console.log("FATAL:", result.fatal.split("\n")[0]);
} finally {
  try {
    chrome.kill();
  } catch {}
  await sleep(500);
  try {
    rmSync(profile, { recursive: true, force: true });
  } catch {}
}
