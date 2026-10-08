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

## Demo login
Admin:
admin@yourpath.demo
admin123

Any other email/password can enter the demo as a student.

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
