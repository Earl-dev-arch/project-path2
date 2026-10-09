// Verify the page by opening the project straight from disk (file://),
// no local server involved. Reports which globals exist and any page error.
export default async function run(page, ui) {
  const errors = [];
  page.on("pageerror", (e) => errors.push(String((e && e.stack) || e)));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push("[console] " + m.text());
  });

  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1200);

  return {
    url: page.url(),
    errors,
    globals: await page.evaluate(() => {
      const names = [
        "showPage",
        "openLogin",
        "goTab",
        "renderJourney",
        "renderRoadmap",
        "renderPathways",
        "renderQuestion",
        "updateUI",
        "getCategoryStems",
        "makeQuestionBank",
      ];
      const out = {};
      for (const n of names) out[n] = typeof window[n];
      return out;
    }),
    questionBank: await page.evaluate(() => {
      try {
        return eval(
          'typeof QUESTION_BANK !== "undefined" ? QUESTION_BANK.length : "no QUESTION_BANK"',
        );
      } catch (e) {
        return "ERR: " + e.message;
      }
    }),
  };
}
