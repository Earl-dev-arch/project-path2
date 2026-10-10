// Check whether the ORIGINAL <script src> tag actually loaded its resource.
// A silent console + undefined globals can mean the script request never
// completed, rather than a parse/run error.
export default async function run(page, ui) {
  const requests = [];
  const responses = [];
  const failures = [];
  page.on("request", (r) => requests.push(r.url()));
  page.on("response", (r) =>
    responses.push({ url: r.url(), status: r.status() }),
  );
  page.on("requestfailed", (r) =>
    failures.push({ url: r.url(), err: r.failure()?.errorText }),
  );

  await page.reload({ waitUntil: "load" });
  await page.waitForTimeout(1500);

  const scripts = await page.evaluate(() =>
    [...document.scripts].map((s) => ({
      src: s.src || "(inline)",
      readyState: s.readyState,
      hasSrc: !!s.src,
    })),
  );

  return {
    responses,
    failures,
    scripts,
    globals: await page.evaluate(() => ({
      showPage: typeof window.showPage,
      openLogin: typeof window.openLogin,
      renderRoadmap: typeof window.renderRoadmap,
      errHandler: typeof window.onerror,
    })),
  };
}
