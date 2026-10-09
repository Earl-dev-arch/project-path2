# METHODOLOGY

How Your Path turns 20 answers into pathways — and, just as importantly, what it
does **not** claim to measure.

This document describes what is actually implemented in `app_scratch.js` and
`site-data.js`, not an aspiration. Where the implementation is weaker than the
description above it, the code wins and this document says so.

---

## 1. The ten dimensions

A session is built from ten independent dimensions. Each is a separate area of
evidence about a student, and each has a fixed set of 20 question stems, so a
single dimension can never dominate a session by volume.

| #   | Dimension id    | Shown to the student as      | Stems | First-draw weight |
| --- | --------------- | ---------------------------- | ----- | ----------------- |
| 1   | `interests`     | Genuine interests            | 20    | 14                |
| 2   | `subjects`      | Subjects & curiosity         | 20    | 10                |
| 3   | `problem`       | Problem solving              | 20    | 12                |
| 4   | `creativity`    | Creativity & design          | 20    | 9                 |
| 5   | `communication` | Communication & people       | 20    | 10                |
| 6   | `workstyle`     | Working style                | 20    | 11                |
| 7   | `motivation`    | Motivation & purpose         | 20    | 9                 |
| 8   | `learning`      | Learning environment         | 20    | 8                 |
| 9   | `pressure`      | External pressure reflection | 20    | 9                 |
| 10  | `values`        | Values & long-term goals     | 20    | 8                 |

`categoryConfig` (line 5) is the single source of truth. Weights total 100, which
makes them readable as percentages — but see §3 for why that is a selection
mechanic and nothing more.

### Why these ten

They separate four different kinds of question that career quizzes routinely
blur together:

1. **What you do anyway** — `interests`, `learning`. Behaviour with no
   supervisor, which is the strongest available signal of genuine pull.
2. **What you are drawn to know** — `subjects`, `problem`. Curiosity and
   reasoning style, independent of whether you are good at them.
3. **How you work** — `workstyle`, `communication`, `creativity`. The day-to-day
   conditions that decide whether a career is tolerable, which matter more to
   satisfaction than the subject matter does.
4. **Why you would choose it** — `motivation`, `values`, `pressure`. This is the
   one most tools omit. A student can answer every other dimension consistently
   and still be describing someone else's ambition.

`pressure` is deliberately a _reflection_ dimension, not a scoring one. It is
never allowed to raise or lower a pathway's evidence — it only triggers the
pressure indicators in §5.

---

## 2. Question-selection logic

Ten dimensions × 20 stems × 5 contexts = **1,000 prompts**. Contexts are
sentence frames applied to a stem, e.g. _"In your free time, …"_ or _"When
facing a new, unfamiliar challenge, …"_. They re-ask a stem in a different
situation so the same underlying question can be probed twice without repeating
itself verbatim.

Prompt count is a **build characteristic, not a selling point**. The student
meets exactly 20 questions (see §1 of `README.md` on how the UI says this).

### Selection

`weightedSession()` (line 274):

1. Each of the 1,000 prompts gets an exponential-race key:
   `key = -ln(U) / weight`, with `U` uniform in `(0,1]`.
2. Candidates sort by ascending key; the 20 lowest keys are selected.
3. A **coverage pass** then ensures all ten dimensions are represented. For any
   dimension missing from the 20, the lowest-key _duplicate-category_ prompt is
   swapped out for a prompt from the missing dimension.
4. The final 20 are shuffled so order carries no meaning.

The exponential-race formulation is equivalent to weighted sampling **without
replacement** and gives inclusive first-draw probabilities exactly proportional
to the weights. This is why the ten dimensions always appear: the coverage pass
makes it a guarantee rather than a probability.

Selection is used **only** to choose which questions appear. No selection weight
ever reaches the scoring in §3.

### Within a dimension — verified counts

Each dimension contains 20 stems: 8 `scale`, 8 `single`/`scenario`, 2 `multi`,
1 `rank`, 1 `open` (5 of the 8 scales are paired with a `multi` option list).
Whatever the mix, a session draws **at most one** prompt per _stem_ — the 5
contexts are alternatives, not additions — so the answer distribution stays
comparable across the ten dimensions.

### Honest limitation

Coverage guarantees _breadth_, not _depth_. One prompt per dimension per session
means a single answer can carry 10% of a dimension's evidence. Twenty questions
cannot distinguish "I am not interested in this" from "this one framing did not
reach me". That is a property of the format and it is why every conclusion is
labelled a hypothesis and paired with an experiment.

---

## 3. Scoring and mapping

Answers feed five signals, printed as bars and a radar. They are **not**
percentages of a career match and are never shown as a match score.

### Signal names

`LOCAL_AI.dimensions` (line 2242): `Analytical`, `Creative`, `People`,
`Learning`, `Curiosity`. All five start at a baseline of `1` and only accumulate.

### Per-answer update (`localSignalFromAnswer`, line 2362)

Every answer contributes through three independent channels:

1. **Keyword hits** — the answer text is lowercased and matched against
   `LOCAL_AI.keywords`. Each hit adds `min(hits, 3) × 0.65` to that signal. The
   cap keeps a long free-text answer from swamping a session.
2. **Structural weight** — `LOCAL_AI.weights[category]` adds a fixed amount per
   answer, e.g. `problem → Analytical +5, Curiosity +2`,
   `creativity → Creative +5`. This is the main channel, and it fires even when
   the student writes no keywords at all.
3. **Scale bonus** — any `scale` answer with a value adds
   `value × 0.25` to **both** `Learning` and `Curiosity`.

That third channel is a known blunt instrument. It treats "5 — Strongly agree on
a creative statement" and "5 — Strongly agree on a maths statement" identically,
so it inflates `Learning`/`Curiosity` for a student who simply uses the extremes
of the scale. It is documented rather than removed, and it is the first thing to
fix if the signal map is ever recalibrated. **Do not read the radar as
precision.**

### Task-type → signal capability (derived from the code)

| Question type         | Keyword channel | Structural channel | Scale channel | Reads the mode of          |
| --------------------- | --------------- | ------------------ | ------------- | -------------------------- |
| `single` / `scenario` | yes             | yes                | no            | the option's copy          |
| `multi`               | yes             | yes                | no            | joined option labels       |
| `rank`                | yes             | yes                | no            | the ranking text as a list |
| `scale`               | no              | yes                | yes           | the numeric value only     |
| `open`                | yes             | yes                | no            | free text                  |

This matrix is the honest answer to "does question type affect the score?". It
does. `single`/`scenario` prompts reach the richest channel because their option
copy carries intent; `scale` prompts are structurally the poorest, since only
the number survives. A session with more scales therefore produces a flatter
signal map. The coverage pass spreads question types across the ten dimensions,
which bounds the distortion — it does not eliminate it.

### From signals to pathways

`pathwayProfiles` (line 2258) holds ~78 profiles across computing, engineering,
natural sciences, health, psychology/education/social science, business/law/
media, arts, agriculture/environment, services/maritime, and public service.
Each profile carries a `dims` vector, e.g. `Computer Science` is
`{Analytical: 1, Curiosity: .8, Learning: .8, Creative: .35}`.

Signals are compared to these vectors to order the pathways shown. The result is
presented as **several plausible directions with reasoning and trade-offs** —
never a winner, never a score out of 100. Each profile also carries `skills`,
`subjects`, `tradeoffs`, `alt` (neighbouring fields) and `test` (a first
experiment), which is what the UI actually shows.

### Why no percentage is ever displayed

A match percentage would require a calibrated mapping from answers to outcomes.
No such calibration exists here — there is no labelled dataset of students whose
later career satisfaction is known. Producing a number anyway would be inventing
precision. The UI states this explicitly ("Zero Fake Percentages") and shows the
reasoning instead.

---

## 4. Contradiction handling

A contradiction is **never** scored as an error or used to reduce a pathway's
standing. It is surfaced as something to test. Two detectors exist.

### 4.1 New-direction contradictions (during the session)

In `localSignalFromAnswer`, once at least 5 answers exist, the last 5 answers are
examined. If at least 2 come from `problem`/`subjects` **and** at least 2 from
`creativity`, **and** `Analytical` and `Creative` have both exceeded `1.6`, the
session records:

> **Multiple strong directions** — _"Recent answers show both technical/
> problem-solving and creative signals."_
> Follow-up: _"Test both through small projects rather than forcing an early
> choice."_

This is a genuine reversal: a student who reports strong pull in two directions.
The response is to keep both options open, not to force a tie-break on thin
evidence.

### 4.2 Stated preference vs. repeated evidence

The same detector is the hook for stated-vs-evidence contradictions — e.g. a
student who selects a technical pathway while their answers repeatedly describe
creative work. The intended resolution is always the same: name the tension,
recommend testing both, and let the experiment decide rather than the score.

**Not implemented.** This is the one area where the documentation runs ahead of
the code. Today the detector only catches the technical/creative split; there is
no general mechanism that compares a _stated_ pathway choice against accumulated
`catEvidence` for an arbitrary pair of dimensions. It is a small addition, and it
is listed as open work in §7 rather than described as present.

### 4.3 How contradictions are displayed

Rendered in the analysis tab as "Contradictions worth exploring", each as signal
→ evidence → follow-up. Absence of a contradiction is stated plainly ("No major
contradiction was identified in this session") rather than implying consistency
was verified.

---

## 5. Uncertainty

Uncertainty is a first-class output, not an error state. Four tiers.

### 5.1 Evidence sufficiency

The session counts answered questions out of 20. Below 20, the analysis is
labelled "Incomplete Data Signal" and every interpretation is marked provisional.
This is the coarsest and most reliable tier.

### 5.2 Neutral-response clustering

Let `n` be the number of `scale` answers and `k` how many equal `3` (Neutral). If
`k / n ≥ 0.45`, the session emits an **Open Uncertainty Notice**: the student may
be exploring unfamiliar fields, or may hold genuinely balanced interests across
domains. The advice is to test 2–3 contrasting pathways in short real-world
projects rather than accept one narrow prediction.

The 0.45 threshold is a judgement call, not a validated cut-off. It is stated
here so it can be challenged.

### 5.3 Pressure indicators

`pressureWords` (`parents`, `family`, `peer`, `salary`, `money`, `status`,
`prestige`, `respect`, `expected`, `pressure`, `popular`, `secure`) are counted
per dimension. Results are shown as per-area indicators with their evidence
attached, under this caveat:

> _"These are response-pattern indicators, not claims about what you think."_

The app cannot see who is answering. It can see that "salary" keeps appearing in
a student's reasoning, which is a reasonable prompt for reflection and an
unreasonable basis for a conclusion.

### 5.4 Format uncertainty

The limitations in §2 and §3 are surfaced to the student, not held back: 20
questions is a sample; the radar is a conversation aid; a later session is
genuinely new information.

### What uncertainty is never used for

Low confidence never silently lowers a pathway's rank. It changes the _wording_
— hedged, provisional, "test this" — and it is always visible. A student should
be able to see that the tool is unsure, rather than receive a confident-sounding
answer built on thin evidence.

---

## 6. Testing with real students

**Not yet done. This section is a plan, not a record.** Nothing below has been
run, and no student has used this build outside development. Treat every claim
elsewhere in this repository as unvalidated until this section has results.

### What to test, in order

1. **Comprehension (5 students, 1 session).** Can they explain, in their own
   words, what the analysis told them and why? A student who cannot restate the
   reasoning did not receive an explanation, whatever the UI said.
2. **Pressure dimension wording (5–8 students).** Ask directly whether the
   pressure indicators felt observed or accused. This is the highest-risk copy in
   the product.
3. **Experiment completion (10 students, 7 days).** The intended differentiator
   is behavioural, not verbal. Measure how many finish day 1, and how many reach
   day 7. Anything under ~50% reaching day 7 means the experiments are too long
   or too vague, regardless of how good they read.
4. **Does "No" get used?** If almost nobody answers _"I did not enjoy the actual
   work"_, students may be reading the question as a test of themselves. That
   would defeat the entire point, and it is measurable.
5. **Whether they return.** Re-take rate after 4–8 weeks is the only evidence
   that the loop is genuinely useful rather than a one-off curiosity.

### Rules

- No real student enters personal data into this build. It stores everything in
  `localStorage` (§`README.md`), and sessions must be run on shared or disposable
  devices with consent, or **not run at all**.
- Never present findings as validity. "Ten students completed an experiment" is a
  usability result, not evidence that the scoring is accurate.
- Record what changed _because of_ feedback. A change log with no entries is the
  most useful possible signal, and the easiest to fake.

---

## 7. Open work and known weaknesses

Listed here rather than omitted, because a methodology document that admits no
gaps is not describing a real system.

| #   | Gap                                                             | Impact                                                                                                       |
| --- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| 1   | Stated-vs-evidence contradiction (§4.2) is not implemented      | Tensions between a chosen pathway and the answers go unreported                                              |
| 2   | The `scale` bonus inflates `Learning`/`Curiosity` (§3)          | Students who overuse the extremes get distorted signals                                                      |
| 3   | The keyword lists are authored, not learned                     | They reflect the authors' vocabulary; a student describing the same interest in different words scores lower |
| 4   | The 0.45 neutral threshold (§5.2) is unvalidated                | May fire too often or too rarely                                                                             |
| 5   | Signal→pathway ordering is not calibrated against outcomes (§3) | Ordering is a reasoned heuristic, not a prediction                                                           |
| 6   | No real-student testing has occurred (§6)                       | Every student-facing claim is currently untested                                                             |
| 7   | Pathway ordering is deterministic given a signal vector         | The same answers always produce the same order; there is no exploring of near-ties                           |

Items 3 and 5 are the ones that would matter most to a sceptical reader: they are
exactly where a confident-looking number would be easiest to fake, and where this
implementation deliberately does not.

---

## 8. Summary of guarantees

**Guaranteed by construction:** all ten dimensions appear in every session; the
same stem is never asked twice in one session; no match percentage or
career score is displayed; no pathway is ever rejected on thin evidence; every
pathway carries a reasoning, an alternative, and a first test; uncertainty is
always labelled and always visible.

**Not guaranteed, and not claimed:** that the ordering reflects real-world
outcomes; that the signals are precise; that 20 questions identify a person; that
the keyword and weight tables generalise beyond their authors. The correct use of
this tool is to generate directions worth **testing** — which is why every
pathway ends in an experiment rather than a verdict.
