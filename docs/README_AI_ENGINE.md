# Your Path — Local AI from Scratch

This version does **not** use OpenAI, an API key, a cloud AI model, or a server-side AI service.

The questionnaire and dashboard are driven by a small explainable AI engine written in JavaScript.

## What the local AI does

- Uses the existing 1,000-question bank.
- Selects the first question with weighted randomness.
- Chooses every later question adaptively from the student's answers.
- Prioritizes dimensions where the AI has less evidence.
- Looks for repeated signals and simple contradictions.
- Detects response patterns that may deserve reflection around pressure, status, salary, parents, or peers without claiming to know the student's thoughts.
- Builds an interest map.
- Generates several pathway suggestions from transparent pathway profiles.
- Creates a 30-day, 6-month, and 1–2-year action roadmap.
- Keeps the data in browser localStorage for this prototype.

## Important

This is an **expert-system / adaptive decision engine**, not a trained large language model. A real LLM trained from scratch would require a large training corpus, substantial compute, and a much larger ML stack.

## Run

You can simply open `index.html` in a browser.

For a local web server:

```bash
python3 -m http.server 8080
```

Then open:

```text
http://localhost:8080
```

No API key is required.


### Expanded pathway catalog
The local AI now includes a broad cross-field catalog of 60+ course/career pathways, including computing, engineering, natural sciences, medicine and allied health, psychology, education, social sciences, law, business, finance, communication, arts/design, agriculture, food, hospitality, tourism, maritime, public service, aviation, safety, and sports science. The analysis returns up to 18 pathway options instead of only a few computer-related choices.
