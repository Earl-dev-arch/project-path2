export default async function run(page, ui) {
  // Click the real "Explore Careers" nav link so the app routes itself.
  await page.getByRole("link", { name: "Explore Careers" }).first().click();
  await page.waitForSelector("#publicPaths .path-card", { timeout: 10000 });
  await page.waitForTimeout(400);

  const info = await page.evaluate(() => {
    const cards = [...document.querySelectorAll("#publicPaths .path-card")];
    return {
      cardCount: cards.length,
      emojisInGrid: (
        (document.getElementById("publicPaths")?.innerText || "").match(
          /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu,
        ) || []
      ).length,
      titles: cards.slice(0, 4).map((c) => ({
        text: c.querySelector("h3")?.textContent.trim(),
        iconPaths: c.querySelectorAll(
          "h3 svg path, h3 svg polyline, h3 svg circle, h3 svg rect, h3 svg line, h3 svg polygon",
        ).length,
        iconColor: c.querySelector("h3 svg")
          ? getComputedStyle(c.querySelector("h3 svg")).color
          : null,
      })),
    };
  });

  // Scroll the grid to the top of the viewport for a clean screenshot.
  await page.evaluate(() => {
    document.querySelector("#publicPaths").scrollIntoView({ block: "start" });
    window.scrollBy(0, -80);
  });
  await page.waitForTimeout(300);
  return info;
}
