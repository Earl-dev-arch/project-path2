// Checks the dashboard sidebar: it should be laid out vertically and follow
// the page as the user scrolls (sticky), staying reachable on tall content.
import { spawn } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const url = process.argv[2];
const profile = mkdtempSync(join(tmpdir(), "yp-side-"));
const port = 9343;

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
    "--window-size=1440,900",
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
        if (pending.has(mid)) { pending.delete(mid); resolve({ __timeout: method }); }
      }, 20000).unref();
    });
  return { ws, send };
}

const out = { checks: [], loadError: null, metrics: {} };
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

  // Sign up through the real flow so the dashboard (and its sidebar) is live.
  await evaluate(`(() => {
    if (typeof openSignup !== 'function') return 'no openSignup';
    openSignup();
    const p = document.getElementById('consentPolicies');
    const a = document.getElementById('consentAge');
    if (p) { p.checked = true; p.dispatchEvent(new Event('change')); }
    if (a) { a.checked = true; a.dispatchEvent(new Event('change')); }
    return 'ok';
  })()`);
  await sleep(500);
  await evaluate(`document.getElementById('consentAccept').click()`);
  await sleep(400);
  await evaluate(`(() => {
    const f = document.getElementById('signupForm');
    f.elements['name'].value = 'QA Student';
    f.elements['email'].value = 'qa.sidebar@student.test';
    f.elements['password'].value = 'secret123';
    f.elements['age'].value = '17';
    f.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    return 'submitted';
  })()`);
  await sleep(4000);
  await evaluate(`(() => { if (typeof showPage === 'function') showPage('dashboard'); return true; })()`);
  await sleep(1200);

  const layout = await evaluate(`(() => {
    const sb = document.querySelector('.sidebar');
    if (!sb) return { err: 'no sidebar' };
    const cs = getComputedStyle(sb);
    const items = [...sb.querySelectorAll('.side')];
    const rects = items.map(b => b.getBoundingClientRect());
    // Are the items stacked top-to-bottom (vertical) rather than in a row?
    const vertical = rects.every((r, i) => i === 0 || r.top >= rects[i-1].top - 2);
    const distinctTops = new Set(rects.map(r => Math.round(r.top))).size;
    return {
      position: cs.position,
      top: cs.top,
      flexDirection: cs.flexDirection,
      itemCount: items.length,
      vertical,
      distinctTops,
      sidebarHeight: Math.round(sb.getBoundingClientRect().height),
      viewportH: window.innerHeight,
      docH: document.documentElement.scrollHeight,
      anchorTop: Math.round(sb.getBoundingClientRect().top),
    };
  })()`);
  out.metrics.layout = layout;

  out.checks.push({
    name: "sidebar exists with nav items",
    pass: !!layout && layout.itemCount > 5,
    detail: layout,
  });
  out.checks.push({
    name: "nav items are stacked vertically",
    pass: !!layout && layout.vertical === true && layout.distinctTops > 5,
    detail: layout && { vertical: layout.vertical, distinctTops: layout.distinctTops },
  });
  out.checks.push({
    name: "sidebar is sticky",
    pass: !!layout && layout.position === "sticky",
    detail: layout && layout.position,
  });

  // Scroll down and confirm the sidebar followed (did not scroll away).
  // The page uses scroll-behavior: smooth, so wait for the position to settle.
  // Scroll to a mid-point that is definitely reachable for this document.
  const scrolled = await evaluate(`(async () => {
    const maxY = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo({ top: Math.max(0, Math.round(maxY * 0.6)), behavior: 'instant' });
    let last = -1;
    for (let i = 0; i < 40; i++) {
      await new Promise(r => setTimeout(r, 100));
      const y = Math.round(window.scrollY);
      if (y === last) break;
      last = y;
    }
    const sb = document.querySelector('.sidebar');
    const r = sb.getBoundingClientRect();
    const cs = getComputedStyle(sb);
    return {
      scrollY: Math.round(window.scrollY),
      sidebarTop: Math.round(r.top),
      sidebarBottom: Math.round(r.bottom),
      sidebarHeight: Math.round(r.height),
      viewportH: window.innerHeight,
      position: cs.position,
      overflowY: cs.overflowY,
      topOffset: parseFloat(cs.top),
    };
  })()`);
  out.metrics.scrolled = scrolled;

  out.checks.push({
    name: "page actually scrolled",
    pass: !!scrolled && scrolled.scrollY > 200,
    detail: scrolled && scrolled.scrollY,
  });
  // It should be pinned at its sticky offset (top: 96px), not scrolled away.
  out.checks.push({
    name: "sidebar followed the scroll (pinned at its sticky offset)",
    pass: !!scrolled && Math.abs(scrolled.sidebarTop - scrolled.topOffset) <= 3,
    detail: scrolled && { sidebarTop: scrolled.sidebarTop, expected: scrolled.topOffset },
  });
  // Regression guard: before the fix the sidebar scrolled far off the top.
  out.checks.push({
    name: "sidebar did not scroll off the top of the page",
    pass: !!scrolled && scrolled.sidebarTop > -5,
    detail: scrolled && scrolled.sidebarTop,
  });
  out.checks.push({
    name: "sidebar stays inside the viewport (bottom not cut off)",
    pass: !!scrolled && scrolled.sidebarBottom <= scrolled.viewportH + 2,
    detail: scrolled && { sidebarBottom: scrolled.sidebarBottom, viewportH: scrolled.viewportH },
  });

  // Every nav item, including the last, must be reachable by scrolling the
  // sidebar's own scroll area (the nav is taller than the window).
  const lastItem = await evaluate(`(() => {
    const sb = document.querySelector('.sidebar');
    const items = [...sb.querySelectorAll('.side')];
    const last = items[items.length - 1];
    sb.scrollTop = sb.scrollHeight;
    const sr = sb.getBoundingClientRect();
    const r = last.getBoundingClientRect();
    return {
      label: last.textContent.trim().split(/\\s+/)[0],
      itemTop: Math.round(r.top),
      itemBottom: Math.round(r.bottom),
      sidebarTop: Math.round(sr.top),
      sidebarBottom: Math.round(sr.bottom),
      viewportH: window.innerHeight,
      canScroll: sb.scrollHeight > sb.clientHeight,
      scrollTop: Math.round(sb.scrollTop),
    };
  })()`);
  out.metrics.lastItem = lastItem;
  out.checks.push({
    name: "last nav item is reachable (visible after scrolling the nav)",
    pass:
      !!lastItem &&
      lastItem.itemTop >= lastItem.sidebarTop - 2 &&
      lastItem.itemBottom <= lastItem.sidebarBottom + 2,
    detail: lastItem,
  });

  out.failed = out.checks.filter((c) => !c.pass).map((c) => c.name);
  out.passed = out.checks.filter((c) => c.pass).length;
  out.total = out.checks.length;
  ws.close();
} catch (e) {
  out.loadError = String(e && e.stack ? e.stack : e);
} finally {
  try { chrome.kill(); } catch {}
  console.log(JSON.stringify({
    passed: out.passed, total: out.total, failed: out.failed, loadError: out.loadError,
    metrics: out.metrics,
  }, null, 2));
  process.exit(out.loadError || (out.failed && out.failed.length) ? 1 : 0);
}
