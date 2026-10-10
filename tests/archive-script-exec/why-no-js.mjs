// Why does no script execute, even inline? Check for a CSP meta / header,
// sandboxing, and whether JavaScript is enabled at all in this context.
export default async function run(page, ui) {
  const out = {};

  // 1. Does ANY inline JS run — including one present in the document from the start?
  out.canEval = await page.evaluate(() => {
    try {
      return eval("1+1");
    } catch (e) {
      return "ERR:" + e.message;
    }
  });

  // 2. Any Content-Security-Policy that could block inline scripts?
  out.cspMeta = await page.evaluate(() => {
    const m = document.querySelector(
      'meta[http-equiv="Content-Security-Policy"]',
    );
    return m ? m.getAttribute("content") : null;
  });

  // 3. Any sandbox attribute / weird document state?
  out.docState = await page.evaluate(() => ({
    readyState: document.readyState,
    contentType: document.contentType,
    hasBody: !!document.body,
    scriptCount: document.scripts.length,
  }));

  // 4. Did the page's own inline handlers/JS get blocked? Check a known
  //    inline-created listener by dispatching a click on a data-page link.
  out.clickWorked = await page.evaluate(() => {
    const before = typeof window.showPage;
    return { beforeShowPage: before };
  });

  // 5. Read the CSP actually delivered on the main document response.
  out.mainDocHeaders = await page.evaluate(() => "n/a-in-page");

  return out;
}
