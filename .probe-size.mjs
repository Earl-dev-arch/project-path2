// Compare: a tiny external script vs the huge app_scratch.js, both over file://,
// and an inline script, to isolate whether size (not content) is the blocker.
export default async function run(page, ui) {
  const inline = await page.evaluate(() => {
    const s = document.createElement("script");
    s.textContent = "window.__inlineRan = true;";
    document.body.appendChild(s);
    return window.__inlineRan === true;
  });

  const tinyTag = await page.evaluate(
    () =>
      new Promise((resolve) => {
        const s = document.createElement("script");
        s.src = ".probe-tiny.js";
        s.onload = () =>
          resolve({ loaded: true, ran: window.__tinyLoaded === true });
        s.onerror = () => resolve({ loaded: false });
        document.body.appendChild(s);
      }),
  );

  const bigTag = await page.evaluate(
    () =>
      new Promise((resolve) => {
        const s = document.createElement("script");
        s.src = "app_scratch.js";
        s.onload = () =>
          resolve({ loaded: true, showPage: typeof window.showPage });
        s.onerror = () => resolve({ loaded: false });
        document.body.appendChild(s);
      }),
  );

  return { inlineScriptRan: inline, tinyScript: tinyTag, bigScript: bigTag };
}
