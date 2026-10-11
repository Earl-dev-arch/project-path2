export default async function run(page, ui) {
  const result = { steps: [] };

  // Open the questionnaire via the app's own entry point.
  await page.evaluate(() => {
    // The questionnaire tab button is labelled "Questionnaire".
    const btn = [...document.querySelectorAll(".side")].find((b) =>
      /question|interview/i.test(b.textContent),
    );
    if (btn) btn.click();
  });
  await page.waitForTimeout(600);

  // Answer whatever is on screen with the first option / a scale value,
  // driving the real Next button so capture() + recordLocalSignal() run.
  for (let i = 0; i < 20; i++) {
    const state = await page.evaluate(() => {
      const opts = [
        ...document.querySelectorAll(".option input, .scale label"),
      ];
      if (opts.length) {
        const pick = opts[0].querySelector ? opts[0] : null;
        const input = pick ? pick.querySelector("input") : opts[0];
        if (input) {
          input.click();
          return "picked-option";
        }
      }
      const ta = document.querySelector("#answerOpen");
      if (ta) {
        ta.value = "I like building and analysing systems, data and design.";
        ta.dispatchEvent(new Event("input", { bubbles: true }));
        return "typed-open";
      }
      const sel = document.querySelectorAll("#answerRank select");
      if (sel.length) {
        sel.forEach((s, idx) => {
          s.value = String(Math.min(idx + 1, 5));
          s.dispatchEvent(new Event("change", { bubbles: true }));
        });
        return "ranked";
      }
      return "nothing";
    });
    result.steps.push(state);

    const finished = await page.evaluate(() => {
      const btn = document.querySelector("#next");
      if (!btn) return "no-next-button";
      const label = btn.textContent;
      btn.click();
      return /finish/i.test(label) ? "finished" : "next";
    });
    await page.waitForTimeout(120);
    if (finished === "finished") break;
  }

  await page.waitForTimeout(500);

  // What did we end up on, and are the pathway cards ordered by evidence?
  result.summary = await page.evaluate(() => {
    const note = document.getElementById("pathwaysOrderNote");
    const grid = document.getElementById("pathGrid");
    const cards = grid
      ? [...grid.querySelectorAll(".path-card")]
          .slice(0, 4)
          .map((c) => c.querySelector("h3")?.textContent.trim())
      : [];
    const why =
      grid && grid.querySelector(".path-card .why-box p")
        ? grid.querySelector(".path-card .why-box p").textContent.trim()
        : null;
    return {
      orderNote: note ? note.textContent.trim().slice(0, 90) : null,
      topCards: cards,
      firstWhy: why ? why.slice(0, 160) : null,
      weakCards: grid
        ? grid.querySelectorAll(".path-card.why-weak").length
        : null,
    };
  });

  return result;
}
