// Probe why the app scripts do not execute on the served page.
export default async function run(page, ui) {
  const requests = [];
  page.on("response", (r) => requests.push({ url: r.url(), status: r.status() }));
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e && e.message)));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push("CONSOLE: " + m.text());
  });

  await page.goto(page.url() + "?probe=" + Date.now(), { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);

  const info = await page.evaluate(async () => {
    const out = {};
    out.yp = typeof window.YourPathData;
    out.esc = typeof window.escapeHtml;
    // Fetch the data script the way the page would and try to run it here.
    const res = await fetch("site-data.js");
    out.dataFetchStatus = res.status;
    const text = await res.text();
    out.dataBytes = text.length;
    out.dataHead = text.slice(0, 40);
    try {
      new Function(text)();
      out.dataRunsInPage = "ran";
      out.ypAfterRun = typeof window.YourPathData;
    } catch (e) {
      out.dataRunsInPage = "threw: " + e.message;
    }
    return out;
  });

  return { info, requests, errors };
}
