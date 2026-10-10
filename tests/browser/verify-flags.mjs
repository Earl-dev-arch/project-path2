// Verifies "Target Universities & Programs" renders SVG flag sprites
// (from lipis/flag-icons) for every country card and uses NO emoji flags.
import { spawn } from "node:child_process";
import { writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const url = process.argv[2];
const outPath = process.argv[3] || "verify-flags.json";

const profile = mkdtempSync(join(tmpdir(), "yp-flags-"));
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
  const requests = [];
  ws.addEventListener("message", (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.method === "Network.requestWillBeSent") requests.push(msg.params.request.url);
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
  return { ws, send, requests };
}

const out = { checks: [], loadError: null };

try {
  if (!(await waitForPort())) throw new Error("Chrome DevTools port never opened");
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const page = targets.find((t) => t.type === "page");
  if (!page) throw new Error("no page target");

  const { ws, send, requests } = await connect(page.webSocketDebuggerUrl);
  await send("Page.enable");
  await send("Runtime.enable");
  await send("Network.enable");

  await send("Page.navigate", { url });
  await sleep(3000);

  const evaluate = async (expr) => {
    const r = await send("Runtime.evaluate", {
      expression: expr,
      returnByValue: true,
      awaitPromise: true,
    });
    if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
    return r.result.value;
  };

  // Render the education tab for a pathway that has curated guides.
  const rendered = await evaluate(`(() => {
    const fn = (typeof renderEducation === 'function' && renderEducation) || window.renderEducation;
    if (typeof fn !== 'function') return 'no renderEducation';
    fn('Software Engineering & Development');
    const box = document.getElementById('educationContainer');
    if (!box || !box.innerHTML.trim()) return 'empty';
    return 'ok';
  })()`);
  out.checks.push({ name: "education panel renders", pass: rendered === "ok", detail: rendered });
  await sleep(1500);

  const cardInfo = await evaluate(`(() => {
    const cards = [...document.querySelectorAll('#educationContainer .country-card')];
    return cards.map(c => {
      const flag = c.querySelector('.country-flag');
      const cs = flag ? getComputedStyle(flag) : null;
      return {
        name: c.querySelector('.country-card-head b')?.textContent.trim(),
        flagClass: flag ? flag.className : null,
        bgImage: cs ? cs.backgroundImage : null,
        width: cs ? cs.width : null,
        height: cs ? cs.height : null,
        textHasPua: /[\\u{1F1E6}-\\u{1F1FF}]/u.test(c.textContent),
      };
    });
  })()`);

  out.checks.push({
    name: "every country card rendered",
    pass: Array.isArray(cardInfo) && cardInfo.length === 8,
    detail: Array.isArray(cardInfo) ? cardInfo.map((c) => c.name) : cardInfo,
  });

  const names = (cardInfo || []).map((c) => c.name);
  const expected = ["Philippines", "United States", "United Kingdom", "India", "Canada", "Singapore", "Australia", "Europe (EU)"];
  out.checks.push({
    name: "country names are correct",
    pass: JSON.stringify(names) === JSON.stringify(expected),
    detail: names,
  });

  const codesOk = (cardInfo || []).every((c) => c.flagClass && /(^|\s)fi(\s|$)/.test(c.flagClass) && /(^|\s)fis(\s|$)/.test(c.flagClass) && /(^|\s)fi-[a-z]{2}(\s|$)/.test(c.flagClass));
  out.checks.push({
    name: "each card has a flag-icons <span class=\"fi fis fi-xx\">",
    pass: codesOk,
    detail: (cardInfo || []).map((c) => c.flagClass),
  });

  const spriteOk = (cardInfo || []).every((c) => c.bgImage && c.bgImage.includes("flags") === false ? c.bgImage !== "none" : c.bgImage !== "none");
  out.checks.push({
    name: "flag sprite resolves to a non-empty background-image",
    pass: spriteOk,
    detail: (cardInfo || []).map((c) => c.bgImage),
  });

  const sizedOk = (cardInfo || []).every((c) => c.width === "20px" && c.height === "20px");
  out.checks.push({ name: "flags are sized 20x20", pass: sizedOk, detail: (cardInfo || []).map((c) => `${c.width}x${c.height}`) });

  const noEmoji = (cardInfo || []).every((c) => c.textHasPua === false);
  out.checks.push({ name: "no emoji flag characters in the cards", pass: noEmoji });

  // The whole education panel must be free of regional-indicator emoji.
  const emojiInPanel = await evaluate(`(() => {
    const html = document.getElementById('educationContainer').innerHTML;
    const m = html.match(/[\\u{1F1E6}-\\u{1F1FF}]/gu);
    return m || [];
  })()`);
  out.checks.push({
    name: "no regional-indicator emoji anywhere in the education panel",
    pass: Array.isArray(emojiInPanel) && emojiInPanel.length === 0,
    detail: emojiInPanel,
  });

  // The flag-icons CSS itself was requested and not 404'd.
  const cssReq = requests.filter((u) => u.includes("flag-icons"));
  out.checks.push({ name: "flag-icons stylesheet was requested", pass: cssReq.length > 0, detail: cssReq });

  // Education panel still renders its other sections.
  const sections = await evaluate(`(() => {
    const h = [...document.querySelectorAll('#educationContainer h3')].map(x => x.textContent.trim());
    return h;
  })()`);
  out.checks.push({
    name: "other education sections intact",
    pass: sections.includes("Target Universities & Programs") && sections.includes("Relevant Degrees"),
    detail: sections,
  });

  out.failed = out.checks.filter((c) => !c.pass).map((c) => c.name);
  out.passed = out.checks.filter((c) => c.pass).length;
  out.total = out.checks.length;
  out.cards = cardInfo;
  ws.close();
} catch (e) {
  out.loadError = String(e && e.stack ? e.stack : e);
} finally {
  try { chrome.kill(); } catch {}
  writeFileSync(outPath, JSON.stringify(out, null, 2));
  console.log(JSON.stringify({ passed: out.passed, total: out.total, failed: out.failed, loadError: out.loadError }, null, 2));
  process.exit(out.loadError || (out.failed && out.failed.length) ? 1 : 0);
}
