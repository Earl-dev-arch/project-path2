// Drive real Chrome against the local file via DevTools Protocol.
// No server, no localhost: the page is opened as a file:// URL.
//
// Usage: node tests/browser/drive.mjs "<file url>" <outJsonPath>
import { spawn } from "node:child_process";
import { writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const url = process.argv[2];
const outPath = process.argv[3] || "qa-result.json";

const profile = mkdtempSync(join(tmpdir(), "yp-chrome-"));
const port = 9333;

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

// Minimal CDP client over websocket, using Node's built-in WebSocket (Node >= 22).
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
    } else if (msg.method) {
      events.push(msg);
    }
  });
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const mid = ++id;
      pending.set(mid, { resolve, reject });
      ws.send(JSON.stringify({ id: mid, method, params }));
    });
  return { send, events, close: () => ws.close() };
}

const result = {
  url,
  steps: [],
  consoleErrors: [],
  pageErrors: [],
  failedRequests: [],
};

try {
  if (!(await waitForPort()))
    throw new Error("Chrome DevTools port did not open");

  const targets = await (
    await fetch(`http://127.0.0.1:${port}/json/list`)
  ).json();
  const page = targets.find((t) => t.type === "page");
  const cdp = await connect(page.webSocketDebuggerUrl);

  await cdp.send("Runtime.enable");
  await cdp.send("Log.enable");
  await cdp.send("Network.enable");
  await cdp.send("Page.enable");

  // Record errors as they arrive.
  const rawEvents = cdp.events;
  const collect = setInterval(() => {
    while (rawEvents.length) {
      const e = rawEvents.shift();
      if (e.method === "Runtime.exceptionThrown") {
        result.pageErrors.push(
          String(
            e.params.exceptionDetails?.exception?.description ||
              e.params.exceptionDetails?.text ||
              "",
          ).slice(0, 300),
        );
      }
      if (e.method === "Log.entryAdded" && e.params.entry.level === "error") {
        result.consoleErrors.push(String(e.params.entry.text).slice(0, 300));
      }
      if (e.method === "Network.loadingFailed") {
        result.failedRequests.push(String(e.params.errorText).slice(0, 200));
      }
    }
  }, 100);

  async function evaluate(expr) {
    const r = await cdp.send("Runtime.evaluate", {
      expression: expr,
      returnByValue: true,
      awaitPromise: true,
    });
    if (r.exceptionDetails) {
      return {
        __error: String(
          r.exceptionDetails.exception?.description || r.exceptionDetails.text,
        ).slice(0, 300),
      };
    }
    return r.result.value;
  }

  async function goto(u) {
    await cdp.send("Page.navigate", { url: u });
    // Wait for the document to be ready AND content present.
    for (let i = 0; i < 60; i++) {
      const ready = await evaluate("document.readyState");
      const chars = await evaluate(
        '(document.body&&document.body.innerText||"").trim().length',
      );
      if (ready === "complete" && chars > 0) break;
      await sleep(150);
    }
    await sleep(400);
  }

  await goto(url);

  const t = (name, value) => result.steps.push({ name, value });

  // ---- 1. Does JS actually run now? --------------------------------------
  t("title", await evaluate("document.title"));
  t("bodyChars", await evaluate('(document.body.innerText||"").trim().length'));
  t("scriptsRun", await evaluate("typeof window.showPage"));
  t(
    "questionBankLength",
    await evaluate(
      'typeof QUESTION_BANK!=="undefined"?QUESTION_BANK.length:"missing"',
    ),
  );

  // ---- 2. Core functions exposed -----------------------------------------
  t(
    "exposed",
    await evaluate(`(() => {
    const names=['showPage','goTab','openLogin','openSignup','renderJourney','renderRoadmap',
      'renderPathways','renderExperiments','renderAnalysis','updateUI','toggleSave',
      'startExperimentFromPathway','toggleExpDay','setExpEnjoyment','saveSavedNote','resetEvidence'];
    const o={}; for(const n of names) o[n]=typeof window[n]; return o;
  })()`),
  );

  // ---- 3. Every button on the page has a handler or opens something ------
  t(
    "deadButtons",
    await evaluate(`(() => {
    const dead=[];
    document.querySelectorAll('button').forEach(b=>{
      const hasInline = b.hasAttribute('onclick');
      const hasId = b.id && (window[b.id]!==undefined);
      // A button with an inline onclick or a known id handler is considered wired.
      if(!hasInline && !hasId) dead.push((b.id||b.textContent||'').trim().slice(0,40));
    });
    return dead;
  })()`),
  );

  // ---- 4. All nav targets resolve to real sections ----------------------
  t(
    "navTargetsMissing",
    await evaluate(`(() => {
    const miss=[];
    document.querySelectorAll('[data-page]').forEach(a=>{
      const id=a.getAttribute('data-page');
      if(!document.getElementById(id)) miss.push(id);
    });
    return miss;
  })()`),
  );
  t(
    "tabTargetsMissing",
    await evaluate(`(() => {
    const miss=[];
    document.querySelectorAll('[data-tab]').forEach(b=>{
      const id='tab-'+b.getAttribute('data-tab');
      if(!document.getElementById(id)) miss.push(id);
    });
    return miss;
  })()`),
  );

  // ---- 5. Signup flow: consent gate -> form -> account -------------------
  await evaluate("window.openSignup && window.openSignup()");
  await sleep(400);
  t(
    "signupModalOpen",
    await evaluate(
      `!document.getElementById('signupModal').classList.contains('hidden')`,
    ),
  );
  t(
    "consentGatePresent",
    await evaluate(
      `!!document.getElementById('consentPolicies') && !!document.getElementById('consentAccept')`,
    ),
  );
  t(
    "consentAcceptDisabledInitially",
    await evaluate(`document.getElementById('consentAccept').disabled`),
  );

  // Tick consent boxes and check the button enables.
  await evaluate(
    `(()=>{const a=document.getElementById('consentPolicies');const b=document.getElementById('consentAge');if(a){a.checked=true;a.dispatchEvent(new Event('change'))}if(b){b.checked=true;b.dispatchEvent(new Event('change'))}})()`,
  );
  await sleep(200);
  t(
    "consentAcceptEnabledAfterTick",
    await evaluate(`!document.getElementById('consentAccept').disabled`),
  );

  // Advance to the signup form step.
  await evaluate(`document.getElementById('consentAccept').click()`);
  await sleep(300);
  t(
    "signupFormVisible",
    await evaluate(
      `!document.getElementById('signupStep').classList.contains('hidden')`,
    ),
  );

  // Fill and submit the signup form.
  t(
    "signupSubmitResult",
    await evaluate(`(() => {
    const f=document.getElementById('signupForm');
    if(!f) return 'no form';
    const set=(n,v)=>{const el=f.querySelector('[name="'+n+'"]'); if(el){el.value=v; return true} return false};
    set('name','QA Student'); set('email','qa.student@example.test'); set('password','secret123');
    set('grade','Grade 11');
    f.dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));
    return 'submitted';
  })()`),
  );
  await sleep(1200);
  t(
    "afterSignupUser",
    await evaluate(
      `(()=>{try{return JSON.parse(localStorage.getItem('yp_user_v3')||'null')?.email||null}catch(e){return 'parse-error'}})()`,
    ),
  );
  t(
    "dashboardActiveAfterSignup",
    await evaluate(
      `(document.querySelector('section.page.active')||{}).id||null`,
    ),
  );

  // ---- 6. Persistence across reload --------------------------------------
  const beforeReload = await evaluate(`localStorage.getItem('yp_user_v3')`);
  await goto(url);
  const afterReload = await evaluate(`localStorage.getItem('yp_user_v3')`);
  t(
    "persistenceUserSurvivesReload",
    beforeReload === afterReload && !!afterReload,
  );
  t(
    "loggedInAfterReload",
    await evaluate(`typeof state!=='undefined' && !!state.user`),
  );

  // ---- 7. Old admin backdoor must be gone --------------------------------
  t(
    "adminLoginRejected",
    await evaluate(`(() => {
    try {
      const f=document.getElementById('loginForm');
      if(!f) return 'no login form';
      const e=f.querySelector('[name="email"]'), p=f.querySelector('[name="password"]');
      if(e){e.value='admin@yourpath.demo'} if(p){p.value='admin123'}
      f.dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));
      return 'submitted';
    } catch(err){ return 'threw: '+err.message }
  })()`),
  );
  await sleep(900);
  t(
    "adminBackdoorCreatedAdmin",
    await evaluate(
      `(()=>{try{const u=JSON.parse(localStorage.getItem('yp_user_v3')||'null');return !!(u&&u.role==='admin')}catch(e){return 'parse-error'}})()`,
    ),
  );

  // ---- 8. Experiments + roadmap render with real data --------------------
  await evaluate(
    `(()=>{ if(window.state){state.user={name:'QA Student',grade:'Grade 11',country:'Philippines'};state.saved=['Nursing','Graphic Design'];} })()`,
  );
  t(
    "renderExperiments",
    await evaluate(
      `(()=>{try{window.renderExperiments();return document.getElementById('expGrid').innerHTML.length}catch(e){return 'ERR: '+e.message}})()`,
    ),
  );
  t(
    "expFamilyCards",
    await evaluate(`document.querySelectorAll('#expGrid .exp-card').length`),
  );
  t(
    "renderRoadmap",
    await evaluate(
      `(()=>{try{window.renderRoadmap();return document.getElementById('roadmap').innerHTML.length}catch(e){return 'ERR: '+e.message}})()`,
    ),
  );
  t(
    "roadmapChainRows",
    await evaluate(`document.querySelectorAll('#roadmap .chain-row').length`),
  );
  t(
    "roadmapRouteCards",
    await evaluate(`document.querySelectorAll('#roadmap .route-card').length`),
  );

  // ---- 9. Mobile responsiveness (real layout) ---------------------------
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 3,
    mobile: true,
  });
  await sleep(600);
  t(
    "mobile",
    await evaluate(`(() => {
    const d=document.documentElement;
    const overflow = d.scrollWidth - d.clientWidth;
    const wide=[];
    document.querySelectorAll('body *').forEach(el=>{
      const r=el.getBoundingClientRect();
      if(r.width>0 && r.right>d.clientWidth+2){
        const id=el.tagName.toLowerCase()+(el.id?'#'+el.id:'')+(el.className&&typeof el.className==='string'?'.'+el.className.split(' ').filter(Boolean).slice(0,2).join('.'):'');
        if(wide.length<12) wide.push(id+' w='+Math.round(r.width)+' right='+Math.round(r.right));
      }
    });
    return { viewport:d.clientWidth, scrollWidth:d.scrollWidth, horizontalOverflow:overflow, offenders:wide };
  })()`),
  );
  t(
    "mobileHamburgerVisible",
    await evaluate(
      `(()=>{const h=document.getElementById('hamb');return h?getComputedStyle(h).display:'missing'})()`,
    ),
  );
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: false,
  });

  clearInterval(collect);
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
  await sleep(600);
  try {
    rmSync(profile, { recursive: true, force: true });
  } catch {}
}
