# Your Path v2

A responsive frontend prototype inspired by the supplied UI.

## Major upgrade: 1,000-question engine
The questionnaire engine creates exactly 1,000 deep prompts at runtime:
- 10 dimensions
- 20 deep stems per dimension
- 5 contexts per stem
- 20 questions are selected per session
- Weighted sampling without replacement
- Every dimension is ensured representation so one session does not accidentally ignore an important area
- The UI displays the configured first-draw selection probability for each selected question

The probability is ONLY a question-selection mechanism. It is not a psychological probability, confidence score, or career-match score.

## Accounts
Create an account from the Sign up dialog. Accounts are stored only in this
browser's localStorage, so they are local to this device.

There is **no admin account and no privilege escalation** in this build. Roles
and any elevated access must be granted by a server; a browser cannot be
trusted to decide them. Adding a hard-coded administrator credential to a
frontend would expose it to every visitor, so none exists here.

## Production requirements
This frontend stores demo data in localStorage. Do NOT use it for real student records.

For a production version:
- secure backend + PostgreSQL
- server-side authentication/session management
- HTTPS, encryption at rest and in transit
- role-based access control and audit logs
- rate limiting, CSRF protection, input validation
- age/guardian consent requirements where applicable
- clear privacy, retention, correction and deletion policies
- keep AI keys server-side
- document AI provider data retention
- current career/university data from attributable sources with timestamps
- human review for sensitive student-facing guidance
- aggregate analytics instead of exposing identifiable student data

`question-bank-spec.json` documents the 1,000-question composition and selection probabilities.


## Registration → Student Journey
After a student creates an account, the dashboard opens to a six-stage Student Journey: Register → Deep Questionnaire → AI Analysis → Pathways → Roadmap → Take Action & Track. The first card is populated from the new profile and the current stage is highlighted.


## Project layout

The app itself is four files at the repository root, and they must stay there:
`index.html` references `styles.css`, `site-data.js` and `app_scratch.js` by bare
relative path, so the root is the site root. Opening `index.html` directly still
works.

```text
index.html              the app shell (single page, tab-based)
styles.css              all styling
site-data.js            content data: clusters, signals, experiment catalog
docs/                   the written case for the project
  METHODOLOGY.md          how the method works and what it does not claim
  EVIDENCE.md             what to measure to know whether it works
  README_AI_ENGINE.md     the local explainable engine, no external AI
tools/                  maintenance scripts, no dependencies
  bank-size.mjs           report the real question-bank size
  make-ico.mjs            generate favicon.ico
  ico-to-png.mjs          render the favicon back to a PNG to inspect it
  serve.cjs               throwaway static server for local QA
tests/                  test suites — see tests/README.md
  test-*.mjs              run individually with `node tests/test-p0.mjs`
  browser/                real-browser drivers (need Chrome, not part of the suite)
  archive-script-exec/    abandoned debugging trail, kept as evidence
```

Tests and tools resolve the project root from their own file location, so they
run from any working directory.
