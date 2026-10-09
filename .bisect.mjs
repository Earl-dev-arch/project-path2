// Bisect the failing point: run progressively larger prefixes of the script
// in a fresh Function inside the page and report where compilation/execution
// first fails. Reports the deepest successfully executed top-level statement.
export default async function run(page, ui) {
  const out = await page.evaluate(async () => {
    const src = await (await fetch("app_scratch.js")).text();
    const lines = src.split(/\r?\n/);

    // Statement start lines: a line beginning at column 0 with a keyword.
    const starts = [];
    lines.forEach((l, i) => {
      if (
        /^(function|const|let|var)\b/.test(l) ||
        /^window\./.test(l) ||
        /^document\./.test(l) ||
        /^\$\(/.test(l) ||
        /^\$\$\(/.test(l)
      ) {
        starts.push(i + 1);
      }
    });

    const results = [];
    for (const n of starts) {
      const prefix = lines.slice(0, n).join("\n");
      let status = "ok";
      try {
        // eslint-disable-next-line no-new-func
        new Function(prefix);
      } catch (e) {
        status = String(e.message);
      }
      results.push({ line: n, status });
    }

    const lastOk = [...results].reverse().find((r) => r.status === "ok");
    const firstBad = results.find((r) => r.status !== "ok");

    return {
      totalStatementStarts: starts.length,
      deepestLineThatStillCompiles: lastOk ? lastOk.line : null,
      firstLineThatFails: firstBad ? firstBad.line : null,
      firstFailureMessage: firstBad ? firstBad.status : null,
      failingLineText: firstBad ? lines[firstBad.line - 1] : null,
      // Show the 3 statements around the failure for context.
      context: firstBad
        ? lines.slice(Math.max(0, firstBad.line - 4), firstBad.line + 2)
        : null,
    };
  });
  return out;
}
