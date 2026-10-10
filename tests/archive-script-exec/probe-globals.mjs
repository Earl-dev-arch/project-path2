// Decisive test: is the app_scratch.js source reachable to the page at all, and
// does evaluating it inside the page create the globals?
// We obtain the source WITHOUT network by reading it from the already-parsed
// script element is impossible, so instead we test the simplest probes.
export default async function run(page, ui) {
  const out = {};

  // Probe 1: can we set and read a global at all from evaluate?
  out.globalRoundTrip = await page.evaluate(() => {
    window.__probe = 42;
    return window.__probe;
  });

  // Probe 2: count script tags and whether they are classic.
  out.scripts = await page.evaluate(() =>
    [...document.scripts].map((s) => ({
      src: s.src || "(inline)",
      type: s.type || "(classic)",
      async: s.async,
      defer: s.defer,
      textLen: (s.textContent || "").length,
    })),
  );

  // Probe 3: does a known top-level const from the file exist at all?
  out.probeConsts = await page.evaluate(() => {
    const names = [
      "STORE",
      "state",
      "categoryConfig",
      "contexts",
      "QUESTION_BANK",
      "pathways",
    ];
    const res = {};
    for (const n of names) {
      try {
        res[n] = typeof eval(n);
      } catch (e) {
        res[n] = "ERR:" + e.constructor.name;
      }
    }
    return res;
  });

  // Probe 4: is there a MIME/type problem? Read the Content-Type the browser saw.
  const resp = await page.evaluate(async () => {
    try {
      const r = await fetch("app_scratch.js");
      const t = await r.text();
      return { ok: r.ok, ctype: r.headers.get("content-type"), len: t.length };
    } catch (e) {
      return { err: String(e) };
    }
  });
  out.scriptFetch = resp;

  out.pageUrl = page.url();
  return out;
}
