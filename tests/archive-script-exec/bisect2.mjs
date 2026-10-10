// Bisect using the already-loaded <script> content (no fetch, so it works on file://).
export default async function run(page, ui) {
  const out = await page.evaluate(async () => {
    // Re-acquire the script source via XHR-free means: inject a fresh classic
    // script that copies itself is not possible, so read it through the
    // browser cache using a synchronous XMLHttpRequest, which file:// permits.
    let src;
    try {
      const xhr = new XMLHttpRequest();
      xhr.open("GET", "app_scratch.js", false);
      xhr.send(null);
      src = xhr.responseText;
    } catch (e) {
      return { xhrError: String(e) };
    }
    if (!src) return { empty: true };

    const lines = src.split(/\r?\n/);
    const starts = [];
    lines.forEach((l, i) => {
      if (
        /^(function|const|let|var)\b/.test(l) ||
        /^window\./.test(l) ||
        /^document\./.test(l) ||
        /^\$\(/.test(l) ||
        /^\$\$\(/.test(l)
      )
        starts.push(i + 1);
    });

    const results = [];
    for (const n of starts) {
      const prefix = lines.slice(0, n).join("\n");
      let status = "ok";
      try {
        new Function(prefix);
      } catch (e) {
        status = String(e.message);
      }
      results.push({ line: n, status });
    }

    const lastOk = [...results].reverse().find((r) => r.status === "ok");
    const firstBad = results.find((r) => r.status !== "ok");

    return {
      srcChars: src.length,
      totalLines: lines.length,
      statementStarts: starts.length,
      deepestLineThatStillCompiles: lastOk ? lastOk.line : null,
      firstLineThatFails: firstBad ? firstBad.line : null,
      firstFailureMessage: firstBad ? firstBad.status : null,
      failingLineText: firstBad ? lines[firstBad.line - 1] : null,
    };
  });
  return out;
}
