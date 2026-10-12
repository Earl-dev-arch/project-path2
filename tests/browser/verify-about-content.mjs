// Verifies the About section explains what the site is for, its purpose,
// and what it does — with the added blocks rendering and visible.
export default async function run(page, ui) {
  const out = {};

  // Open the About page.
  await page.evaluate(() => {
    if (typeof window.show === "function") window.show("about");
    else window.location.hash = "#about";
  });
  await page.waitForTimeout(400);

  out.about = await page.evaluate(() => {
    const sec = document.getElementById("about");
    if (!sec) return { found: false };
    const blocks = Array.from(sec.querySelectorAll(".about-block"));
    const cs = getComputedStyle(sec);
    return {
      found: true,
      visible: cs.display !== "none",
      headings: blocks.map((b) =>
        b.querySelector("h3") ? b.querySelector("h3").textContent.trim() : null,
      ),
      hasList: !!sec.querySelector(".about-list li"),
      listItems: sec.querySelectorAll(".about-list li").length,
      textLen: (sec.innerText || "").replace(/\s+/g, " ").trim().length,
    };
  });

  // Heading font size sanity (the CSS block must be applied, not unstyled).
  out.styled = await page.evaluate(() => {
    const h = document.querySelector("#about .about-block h3");
    if (!h) return null;
    return getComputedStyle(h).fontSize;
  });

  out.failed = [];
  if (!out.about.found) out.failed.push("about section not found");
  if (!out.about.visible) out.failed.push("about section hidden");
  if (!out.about.headings || out.about.headings.length < 3)
    out.failed.push("expected at least 3 about-blocks (what/purpose/does)");
  if (!out.about.hasList) out.failed.push("about-list missing");
  if (out.about.textLen < 400) out.failed.push("about text suspiciously short");

  return out;
}
