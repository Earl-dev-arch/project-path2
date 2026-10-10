// Final check: drive the app by placing the file's own source into an inline
// script created AFTER load. If the site then works, the code is fine and the
// only problem is how file:// refuses to execute external scripts.
export default async function run(page, ui) {
  // Read the source locally is impossible (CORS on file://), so instead take a
  // different route: append the script with a data: URL built from... we cannot
  // read the file. So we verify by checking that the ORIGINAL tag never fired.
  const out = {};

  out.inlineFromStart = await page.evaluate(() => {
    // Inject an inline script with a unique global; inline scripts DO run in
    // normal documents, so this isolates "inline works" vs "external file://".
    const s = document.createElement("script");
    s.textContent = 'window.__inlineMarker = "ran-at-" + Date.now();';
    document.body.appendChild(s);
    return window.__inlineMarker || "NOT RUN";
  });

  out.externalTinyAgain = await page.evaluate(
    () =>
      new Promise((res) => {
        const s = document.createElement("script");
        s.src = ".probe-tiny.js?v=" + Date.now();
        s.onload = () =>
          setTimeout(
            () =>
              res({
                onloadFired: true,
                tinyGlobal: typeof window.__tinyLoaded,
              }),
            100,
          );
        s.onerror = () => res({ onloadFired: false });
        document.body.appendChild(s);
      }),
  );

  return out;
}
