// Drive the real app: open an experiment from a pathway, tick days, answer the
// honest question, then confirm the roadmap chain consumed the verdict.
export default async function run(page, ui) {
  const out = {};
  const errors = [];
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));

  // App loads with no console errors
  out.appLoaded = await page.evaluate(
    () => typeof window.startExperimentFromPathway === "function",
  );

  // 1. Open the experiment from a real pathway (the inline CTA path).
  await page.evaluate(() => window.startExperimentFromPathway("Cybersecurity"));
  await page.waitForTimeout(300);

  const cards = await page.locator("#expGrid .exp-card").count();
  out.expCardsRendered = cards;

  // 2. Tick 3 days via the real checkboxes.
  const checkboxes = page.locator("#expGrid .exp-card").first().locator('input[type="checkbox"]');
  out.dayCheckboxCount = await checkboxes.count();
  for (let i = 0; i < 3; i++) await checkboxes.nth(i).check();
  await page.waitForTimeout(300);

  // 3. The honest question appears, then answer "no" (the most important result).
  out.honestQuestionVisible = await page
    .locator("#expGrid .exp-ask")
    .first()
    .isVisible()
    .catch(() => false);

  await page.evaluate(() => window.setExpEnjoyment("tech", "no"));
  await page.waitForTimeout(300);

  // 4. The verdict renders, and the new chain-next line must be visible.
  out.verdictRendered = await page.locator("#expGrid .exp-verdict.no").count();
  const chainNext = page.locator("#expGrid .exp-chain-next").first();
  out.chainNextVisible = await chainNext.isVisible().catch(() => false);
  out.chainNextText = await chainNext.innerText().catch(() => "");

  // 5. The verdict must reach the roadmap chain.
  await page.evaluate(() => window.goTab("roadmaps"));
  await page.waitForTimeout(400);
  const roadmapText = await page.locator("#roadmap").innerText();
  out.roadmapHasChain = (await page.locator("#roadmap .chain-row").count()) === 9;
  out.roadmapConsumedVerdict = /did not enjoy the actual work/i.test(roadmapText);
  out.roadmapFramesNoAsProgress = /progress, not failure/i.test(roadmapText);

  // 6. Alternative routes still render (not only a degree).
  out.routeCards = await page.locator("#roadmap .route-card").count();
  out.hasNotOnlyDegreeTag = /NOT ONLY A DEGREE/.test(roadmapText);

  out.consoleErrors = errors;
  return out;
}
