# Tests

Run any suite directly with Node — there is no test runner and no dependencies:

```bash
node tests/test-p0.mjs
```

Each suite loads the real `site-data.js` and `app_scratch.js` from the project
root into a Node `vm` context with a minimal DOM shim, then drives the app's own
functions. Paths are resolved relative to the test file, so the suites pass from
any working directory.

## The suites

| File             | What it protects                                                                                                                                                                                            |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `test-p0.mjs`    | Post-cleanup regression: the app loads, log in works, the old admin credential is rejected, no stale "1,000 bank" label remains. Also counts rendered characters in `#expGrid`, `#roadmap` and `#pathGrid`. |
| `test-edge.mjs`  | Empty state (no pathway chosen) and the experiments tab surviving a missing `site-data.js`.                                                                                                                 |
| `test-final.mjs` | The evidence/tracking layer — every `track*` function, persistence, and that ticking a day twice does not double-count.                                                                                     |
| `test-part5.mjs` | The experiment verdict feeds the roadmap chain (`Experiments` and `Next steps` lines change on `yes` / `mixed` / `no`).                                                                                     |
| `test-india.mjs` | All 16 curated pathways render India data: `universities.india`, `indiaRoutes`, India entrance exams.                                                                                                       |
| `test-why.mjs`   | The "why this appeared" reasoning engine: reasons come from the student's own signals, not a static blurb; ordering follows evidence and is not a ranking; every card is structurally complete.             |

## Known pre-existing condition

`test-final.mjs` reports a `contraSetupError`. This predates the current work —
it is a harness limitation (internal `localAnalysis` state is not reachable from
outside the VM context), not an app failure. Verify with `git stash`.

## browser/

Scripts for driving a real browser. These need a browser and are not part of the
default suite — see `drive.mjs` for the DevTools Protocol driver, which uses the
locally installed Chrome.

`scripts-probe.mjs` and `part5-drive.mjs` are diagnostic. They document an
**unresolved, pre-existing condition**: scripts loaded over `http://` return 200
with zero console errors but never execute, so `window.YourPathData` stays
`undefined`. The same file runs correctly when evaluated inside the page via
`new Function()`, which points at the headless environment rather than the app
code. This has not been proven either way.

## archive-script-exec/

An abandoned investigation into that same condition, kept rather than deleted
because it is the evidence trail. Nothing here is part of the build or the test
suite. `why-no-js.mjs` states the question; the `bisect*` and `probe-*` files are
attempts to answer it; `final-check.mjs` is where it was left.
