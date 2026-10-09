# EVIDENCE

What to measure to decide whether Your Path works — and what the current numbers
already tell you (answer: nothing yet).

The goal is not _"we built an AI career website."_ There are already thousands of
those. The goal is one loop that genuinely works:

> Understand yourself → generate possibilities → understand **why** → compare →
> test careers → reflect → update your direction → build an education roadmap.

Everything below measures whether that loop actually closes, or whether people
bounce off it after one session.

---

## 1. The metrics

Seven metrics, in the order they become meaningful. The first four are pure
counts and need no interpretation. The last three are where the real reading is.

| #   | Metric                    | Stored as                             | What it actually tells you                                                                                                           |
| --- | ------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | **Sessions started**      | `sessionsStarted`                     | Top of funnel. Rising here with flat completion = the questionnaire is too long, not that the product is growing.                    |
| 2   | **Completion rate**       | `sessionsCompleted / sessionsStarted` | The first honest signal. A student who abandons at question 14 reveals nothing about the method — only about its length and framing. |
| 3   | **Careers explored**      | unique `careersExplored[]`            | Breadth of the exploration. A student who looks at 1 pathway is not exploring; they are confirming what they already thought.        |
| 4   | **Experiments opened**    | unique `experimentsOpened[]`          | Did they leave the reading phase and attempt the actual work?                                                                        |
| 5   | **Experiments completed** | `experimentDaysDone`                  | The differentiator, measured behaviourally. Counted in **days per opened experiment** so a 7-day finish is visible.                  |
| 6   | **Reflections recorded**  | `reflections[]`                       | Where each answer is `yes` / `mixed` / `no`. This is the payoff of the whole product.                                                |
| 7   | **Returned**              | `activeDays > 1`                      | The only real proof. Everything else can be produced by one enthusiastic sitting.                                                    |

### The one number that matters most

Not the completion rate — **the number of honest `no` answers.**

If every reflection comes back `yes`, students are treating _"Did you enjoy the
actual work?"_ as a test of themselves rather than a question about the work. The
feature has then failed in exactly the way it was built to avoid, and the
completion numbers will look _great_ while it happens. It is the single most
important thing to watch, and the easiest to mistake for success.

A healthy pattern is a spread: some `yes`, some `mixed`, and real `no` results
recorded as useful rather than as failure.

---

## 2. What the current numbers say

**Nothing. No student has used this build.**

No real-student testing has occurred (see `METHODOLOGY.md` §6). Every metric on
this page is currently zero, and no claim about the method's validity is
supported by evidence. Treat the rest of this document as instrumentation that
is ready to be read, not as findings.

What _is_ true, and verifiable by reading the code, is that the events are wired
to real user actions rather than to page views:

| Event             | Fired from                                      | Line of truth                                      |
| ----------------- | ----------------------------------------------- | -------------------------------------------------- |
| Session started   | `newSession()`                                  | every new questionnaire session, including retakes |
| Session completed | the 20th "Next" click                           | not on viewing the analysis tab                    |
| Careers explored  | `toggleSave`, `saveSavedNote`, experiment start | unique names, deduped                              |
| Experiment opened | `startExperimentFromPathway()`                  | only when a mapped experiment exists               |
| Experiment day    | `toggleExpDay()`, on tick only                  | unticking does not count                           |
| Reflection        | `setExpEnjoyment()`                             | changing an answer replaces, never double-counts   |
| Feedback          | the feedback form submit                        | free text also stored                              |
| Change made       | `trackChange()`                                 | currently called nowhere — see §5                  |

---

## 3. What is deliberately not collected

The instrument that measures students must not become a reason to distrust the
product. These are exclusions, not omissions:

**Never collected:** names, emails, phone numbers, school names, free-text
answers, individual question responses, signal values, device fingerprints, IP
addresses, or anything that survives clearing the site data.

**Nothing leaves the browser.** There is no network call in the tracking code.
No analytics provider, no endpoint, no beacon.

**Why counts only:** the moment a metric can be tied to a person, a student's
private uncertainty about their future becomes a record someone else could read.
That is not a trade worth making for a dashboard, and the metrics above are all
answerable without it.

**A student can see and clear everything.** The Feedback tab renders exactly
these numbers back to them, with a "Clear local evidence" button.

**What a real deployment must change, and must not:** the metrics move
server-side (it is the only way to see aggregate usage across devices), and the
prototype's `localStorage` limits are removed. What must **not** change is the
counts-not-identities rule. "We need better analytics" is the standard argument
for adding identifiers, and it is the argument to refuse here.

---

## 4. How to read the funnel

The loop fails at different points for different reasons. Use the counts to
locate which one, rather than averaging them into a single "engagement" number.

| Pattern                                       | Reading                                                     | Likely fix                                                                  |
| --------------------------------------------- | ----------------------------------------------------------- | --------------------------------------------------------------------------- |
| Started high, completed low                   | The questionnaire is too long or its framing is off-putting | Fewer questions, better opening; check where in the 20 the drop happens     |
| Completed high, careers explored low          | The analysis did not earn a second click                    | The reasoning may be too abstract to act on                                 |
| Careers explored high, experiments opened low | The experiments are buried, or the step looks like work     | Move the experiment CTA up; test its wording                                |
| Opened high, days completed ~1                | Day 1 is achievable and day 2 is not                        | The 7-day shape may be too long, or day 1 is too easy to feel like progress |
| Reflections all `yes`                         | **The honest question is being read as self-assessment**    | Reword the question; strengthen the `no` framing                            |
| Reflections all `no`                          | The mapping suggests work students do not enjoy             | The signal→pathway ordering needs recalibration                             |
| Active days = 1                               | No loop. It was a one-off curiosity                         | This is the failure the product exists to prevent                           |
| Change log empty                              | **Feedback is being collected and ignored**                 | See §5                                                                      |

The last two rows are the ones that matter. A tool with modest numbers and a
non-empty change log is healthier than one with impressive numbers and an empty
one.

---

## 5. What changed after feedback

The `changeLog` is currently **empty, because no feedback has been received.**
That is the honest state, and it is deliberately visible in the UI rather than
hidden behind a placeholder.

This metric exists because "we collect feedback" is easy to claim and
unverifiable. A log with entries — _date, what was observed, what changed_ —
cannot be filled in retrospectively without lying, because the date is the proof.
An empty log is the most useful possible signal: it means nothing has been
learned yet.

Recording a change:

```js
trackChange('reflections were all "yes"', "reworded the honest question");
```

The discipline that makes it meaningful:

- Log the **observation** and the **action**, not the intent.
- Log it when the change ships, not when it is planned.
- Log changes that _remove_ something. Most useful feedback deletes a feature.
- Never backfill. An empty log is a finding.

---

## 6. Privacy and consent for any real testing

Before this instrumentation is used with actual students:

1. **Consent, and guardian consent where required.** A minor using a career tool
   is not the same as an adult browsing a website.
2. **Shared or disposable devices.** This build keeps data in `localStorage`. On
   a shared device, export and clear between participants, or do not use it.
3. **Say what is recorded, before it is recorded.** The Feedback tab already
   shows the student their own counts; the consent step must too.
4. **No grades, names or schools.** If a session needs to be identifiable to be
   useful, that is a sign the metric is measuring the wrong thing.
5. **Deletion is real.** "Clear local evidence" must actually clear it — and in a
   server build, deletion must be as easy as collection.

---

## 7. Minimum viable evidence

Before claiming the loop works, all five of these should hold:

- [ ] ≥ 10 students complete a full 20-question session
- [ ] ≥ 5 students open an experiment and finish day 1
- [ ] ≥ 3 students reach day 7 of any experiment
- [ ] ≥ 1 student records a `no` and is told it was a useful result
- [ ] ≥ 1 student returns on a different day without being prompted

The numbers are small on purpose. They are not a sample size claim — they are the
minimum needed to see whether each stage of the loop can happen at all. If the
last two cannot be reached, the problem is not sample size. It is the product.
