/* ============================================================================
   Your Path — public site content
   Plain data only. Rendering lives in site.js.
   ========================================================================== */
window.YourPathData = (function () {
  "use strict";


  const clusters = [
    { id: "tech", name: "Technology & computing", icon: "i-cpu",
      blurb: "Build, secure and make sense of the systems that everything else runs on." },
    { id: "engineering", name: "Engineering & the built environment", icon: "i-ruler",
      blurb: "Design and test the physical world: structures, machines, circuits and cities." },
    { id: "science", name: "Natural sciences & mathematics", icon: "i-atom",
      blurb: "Ask precise questions about how the world works and answer them with evidence." },
    { id: "health", name: "Health & life sciences", icon: "i-pulse",
      blurb: "Care for people and animals, and study how living things function." },
    { id: "society", name: "Psychology, education & society", icon: "i-users",
      blurb: "Understand people, learning, communities and how societies organise themselves." },
    { id: "business", name: "Business, finance, law & media", icon: "i-briefcase",
      blurb: "Run organisations, argue cases, move money and shape public conversation." },
    { id: "arts", name: "Arts, design & creative media", icon: "i-palette",
      blurb: "Make things people look at, read, watch, wear or listen to." },
    { id: "earth", name: "Agriculture, food & environment", icon: "i-leaf",
      blurb: "Feed people and look after land, water and the food chain." },
    { id: "service", name: "Hospitality, tourism & logistics", icon: "i-compass",
      blurb: "Look after guests, move goods and run the services people depend on." },
    { id: "public", name: "Public service, safety & specialised fields", icon: "i-shield",
      blurb: "Keep communities safe, informed and functioning." }
  ];

  /* Career names grouped by cluster. The detail for each pathway is held once,
     in the adaptive pathway library, so there is a single source of truth. */
  const clusterMembers = {
    tech: ["Computer Science", "Information Technology", "Information Systems",
      "Software Engineering", "Data Science & Analytics", "Cybersecurity"],
    engineering: ["Civil Engineering", "Mechanical Engineering", "Electrical Engineering",
      "Electronics Engineering", "Chemical Engineering", "Industrial Engineering",
      "Mechatronics / Robotics", "Architecture", "Urban & Regional Planning"],
    science: ["Mathematics", "Statistics", "Physics", "Chemistry", "Biology",
      "Environmental Science", "Geology / Earth Science", "Astronomy / Astrophysics"],
    health: ["Medicine", "Nursing", "Pharmacy", "Medical Technology / Medical Laboratory Science",
      "Dentistry", "Physical Therapy", "Occupational Therapy", "Public Health",
      "Nutrition & Dietetics", "Veterinary Medicine / Animal Science"],
    society: ["Psychology", "Education / Teaching", "Early Childhood Education",
      "Special Education", "Social Work", "Sociology",
      "Political Science / Public Policy", "International Relations", "Anthropology", "History"],
    business: ["Business Administration", "Accounting", "Finance", "Economics", "Marketing",
      "Entrepreneurship", "Human Resources", "Law / Legal Studies", "Criminology",
      "Communication / Media Studies", "Journalism", "Public Relations"],
    arts: ["Fine Arts", "Graphic Design", "Animation / 3D / Visual Effects",
      "Film / Broadcasting", "Music / Performing Arts", "Interior Design",
      "Fashion Design / Apparel"],
    earth: ["Agriculture / Agribusiness", "Agricultural Engineering",
      "Food Science & Technology", "Forestry / Natural Resources"],
    service: ["Hospitality Management", "Tourism Management",
      "Culinary Arts / Culinary Management", "Maritime Studies / Marine Transportation",
      "Marine Engineering", "Logistics & Supply Chain Management"],
    public: ["Public Administration", "Library & Information Science",
      "Emergency Management / Disaster Risk Reduction", "Aviation / Aeronautics",
      "Forensic Science", "Sports Science / Exercise Science"]
  };

  /* The five signals the questionnaire tracks. Used to turn a pathway's
     weighting into a plain sentence instead of a match percentage. */
  const signals = {
    Analytical: "working through problems with logic, data and evidence",
    Creative: "making, designing or inventing something original",
    People: "working closely with other people and explaining ideas",
    Learning: "building deep knowledge over a long period",
    Curiosity: "investigating how and why things work"
  };

  /* ------------------------------------------------------------- home content */

  const stats = [
    { value: "20", label: "questions per session, across 10 dimensions of interest" },
    { value: "10", label: "dimensions explored — never a single personality label" },
    { value: "0", label: "fake match percentages — we explain the reasoning instead" },
    { value: "Free", label: "for students — no ads, no data resale" }
  ];

  const steps = [
    { icon: "i-clipboard", title: "Answer 20 questions",
      text: "Scenarios, rankings, scales and open reflection, chosen to cover ten dimensions of interest rather than one narrow theme. Every session is different." },
    { icon: "i-chart", title: "Read the pattern",
      text: "See which signals repeated, where your answers disagreed, and what twenty questions genuinely cannot tell you." },
    { icon: "i-compass", title: "Compare pathways",
      text: "Several plausible directions with the subjects, skills, study routes and trade-offs of each — in words, not fake percentages." },
    { icon: "i-route", title: "Run one real test",
      text: "Every pathway comes with a small experiment you can finish this month, plus a roadmap tied to your grade." }
  ];

  const values = [
    { icon: "i-shield", title: "No fake precision",
      text: "We never show a “97% career match”. Selection weights decide which questions appear — they are not a personality score." },
    { icon: "i-scale", title: "Uncertainty is allowed",
      text: "“I don’t know yet” is a valid result. We label low confidence instead of hiding it behind a confident-sounding label." },
    { icon: "i-eye", title: "Your pressure, named",
      text: "Family expectations, peer choices, status and salary all shape answers. We surface them for reflection rather than deciding for you." },
    { icon: "i-lock", title: "Private by default",
      text: "Everything you enter stays in your own browser. Nothing is uploaded, nothing is sold, and you can erase it all in one click." }
  ];

  const testimonials = [
    { quote: "I came in expecting another “you should be a doctor or an engineer” quiz. It asked what I actually do on a free Sunday, then told me it wasn’t sure yet — which somehow helped more.",
      name: "Ariane", meta: "Grade 11" },
    { quote: "The pressure check was the useful part. I hadn’t noticed that every time I said “finance” I was describing what my relatives wanted, not what I enjoyed doing.",
      name: "Daniel", meta: "Grade 12" },
    { quote: "My counselor and I used the two pathways it suggested as a starting point, then looked up the real course requirements together. It gave us something concrete to work with.",
      name: "Priya", meta: "Grade 10" },
    { quote: "I thought career quizzes were a waste of time until one told me it wasn’t confident enough to recommend anything. That honesty is why I kept using it.",
      name: "Marco", meta: "First year college" }
  ];

  const faqs = [
    { q: "Does Your Path tell me which career to choose?",
      a: "No. It shows several plausible directions with their reasoning, trade-offs and alternatives, plus one small experiment for each. The decision stays yours — and “I don’t know yet” is a normal, honest result." },
    { q: "How accurate is a 20-question session?",
      a: "A session is one sample of evidence, not a measurement of who you are. It is good at finding directions worth testing and poor at predicting outcomes. Retaking it after a few months, or after running one of the experiments, gives genuinely new information." },
    { q: "What happens to my answers?",
      a: "They are stored in your own browser’s local storage and never uploaded. Using “Delete my data” in Profile, or clearing this site’s storage, removes your profile, answers, saved pathways and preferences." },
    { q: "Do I need to pay or create an account?",
      a: "Creating an account is free and there is no paid tier. An account lets you save pathways and keep a roadmap, but you can browse the whole pathway library without one." },
    { q: "Is this a replacement for a school counselor?",
      a: "No. Your Path is decision support for a conversation, not a substitute for one. Teachers, counselors, parents and professionals should stay part of it." },
    { q: "Why do you not show percentage matches?",
      a: "Because they would be invented. We can explain which of your answers pointed towards a pathway and where the evidence was thin, but we cannot honestly turn that into a number out of 100." }
  ];

  /* ------------------------------------------------------------------------
     Career experiments.

     The whole point of Your Path is that a pathway is never "a career you
     might like" — it is something you TEST. Every pathway gets a 7-day
     exploration a student can actually finish this month, using only free
     tools, and ending in the one question that matters:

         "Did you enjoy the actual work?"

     Days are deliberately small (20-90 minutes). `tools` must be free/legal.
     The `reflect` prompt never asks whether the student was good at it — only
     whether they want more of it. That distinction is the differentiator.
  -------------------------------------------------------------------------- */

  const experiments = {
    tech: { title: "Try Cybersecurity", days: [
      { day: 1, focus: "Learn basic networking", text: "Learn how an IP address, a port and a DNS lookup fit together. Write the path a web request takes from your laptop to a server, in your own words." },
      { day: 2, focus: "How attacks work", text: "Read how one common attack (phishing, weak passwords, or an unpatched service) actually succeeds. Summarise the weak link in two sentences." },
      { day: 3, focus: "Beginner-safe activity", text: "In a legal practice environment (a capture-the-flag beginner track or your own home router settings), find one misconfiguration or hidden clue. Do not touch any system you do not own." },
      { day: 4, focus: "Analyse a provided example", text: "Take a published, unedited breach write-up. Identify which control failed, and name one change that would have stopped it." },
      { day: 5, focus: "Harden something real", text: "Review your own accounts: password manager, two-factor authentication, device updates. Fix the weakest one and record what you changed." },
      { day: 6, focus: "Explain it", text: "Write a 150-word explanation of one security idea for a non-technical friend, using no jargon. If you cannot, you have found the gap in your understanding." },
      { day: 7, focus: "Reflect", text: "Re-read days 1-6 and answer honestly: did you enjoy the investigating, or only the idea of being someone who does security?" } ],
      tools: ["Free legal CTF beginner tracks", "Your own devices and router only"],
      reflect: "Did you enjoy the actual work — reading logs, tracing failures, being patient and methodical? Or did you enjoy the idea of it more than the practice?" },

    engineering: { title: "Try Engineering", days: [
      { day: 1, focus: "Find a real problem", text: "Find one object around you that is awkward or inefficient. Photograph it and describe precisely why it fails the person using it." },
      { day: 2, focus: "Sketch solutions", text: "Sketch three different fixes on paper. Do not filter for feasibility yet — quantity first, then judge." },
      { day: 3, focus: "Pick and constrain", text: "Choose one. List its constraints: materials, cost, strength, safety, size. Engineers design under constraints, not in spite of them." },
      { day: 4, focus: "Build a rough model", text: "Build the crudest version from card, tape, string or scrap. It will look wrong. The point is to find what breaks first." },
      { day: 5, focus: "Test and measure", text: "Test your model against day 1's problem. Measure something — time, length, weight, wobble. Numbers beat opinions." },
      { day: 6, focus: "Iterate once", text: "Change exactly one variable and retest. Record what improved and what got worse. Nothing improves without this step." },
      { day: 7, focus: "Reflect", text: "Look at your notes: did you enjoy the measuring and re-testing, or did you only enjoy the first idea?" } ],
      tools: ["Card, tape, string, scrap", "A ruler and a phone camera"],
      reflect: "Did you enjoy the actual work — measuring, failing, re-testing — or did you enjoy the imagining part and dislike the iteration?" },

    science: { title: "Try Scientific Research", days: [
      { day: 1, focus: "Ask a answerable question", text: "Write a question about something you can observe yourself, small enough to answer in a week. 'Why is the sky blue' is too big; 'which window gets warmer by 3pm' is answerable." },
      { day: 2, focus: "Predict", text: "Write your prediction and why you expect it. A hypothesis you can be wrong about is the point." },
      { day: 3, focus: "Design the method", text: "Define exactly what you will measure, how often, and with what. Decide what would count as disproving your prediction." },
      { day: 4, focus: "Collect data", text: "Take at least five measurements, at the same time each day. Write them down even when they look boring or wrong." },
      { day: 5, focus: "Look for a pattern", text: "Put your numbers in a table or simple chart. Write one sentence describing what you actually see, before trying to explain it." },
      { day: 6, focus: "Read a real paper", text: "Find one accessible study on your topic. Identify the question, the method, and one limitation the authors admit." },
      { day: 7, focus: "Reflect", text: "Compare your findings with the paper. Did the grinding, careful, repetitive part feel interesting or dull to you?" } ],
      tools: ["A notebook or spreadsheet", "Free public science papers"],
      reflect: "Did you enjoy the actual work — the slow, careful, repetitive collection of evidence — or would you rather read other people's conclusions?" },

    health: { title: "Try Medicine & Care", days: [
      { day: 1, focus: "Map the roles", text: "List five different jobs in one hospital (not only doctors). Describe what each actually does in a day." },
      { day: 2, focus: "Follow a real day", text: "Find an official careers video or interview with a practising clinician. Note every task they describe, including the unglamorous ones." },
      { day: 3, focus: "Learn one system", text: "Learn the anatomy and function of one body system properly (heart, kidneys, nervous system). Draw it and label it from memory." },
      { day: 4, focus: "Read a case", text: "Read one published case description. Write the symptoms, what the clinicians suspected, and how they confirmed it." },
      { day: 5, focus: "Practice communication", text: "Write the script you would use to explain a difficult diagnosis to a frightened 14-year-old. Notice how much of the skill is language, not science." },
      { day: 6, focus: "Check the cost", text: "Look up the actual training length, cost and working hours for your country. Medicine is a decade-long commitment; know it honestly." },
      { day: 7, focus: "Reflect", text: "Ask: did I enjoy biology, or did I enjoy being seen as someone who helps? Those are different motivations." } ],
      tools: ["Official hospital careers pages", "Public health authority materials"],
      reflect: "Did you enjoy the actual work — long training, bodily realities, difficult conversations — or the idea of a respected helping role?" },

    society: { title: "Try Psychology & People Work", days: [
      { day: 1, focus: "Observe without judging", text: "For one day, note three moments where someone changed their behaviour because others were present. Describe what you saw, not why." },
      { day: 2, focus: "Read a real study", text: "Take one well-known psychology study. Identify its question, method, result — and one limitation. Most famous studies have serious ones." },
      { day: 3, focus: "Use a real method", text: "Collect opinion data from eight classmates on a simple question, then write what the data can and cannot tell you." },
      { day: 4, focus: "Practise listening", text: "Have one 20-minute conversation where you only listen and ask, never advise. Almost nobody finds this easy." },
      { day: 5, focus: "Study a bias", text: "Learn one cognitive bias properly (confirmation, anchoring, availability). Find a real example from your own past." },
      { day: 6, focus: "Check the honesty", text: "Research what 'psychologist' actually requires in your country — the degree, the licence, the supervised hours. Write the real timeline." },
      { day: 7, focus: "Reflect", text: "Did you enjoy the research and reading, or the human contact, or both? They lead to different careers." } ],
      tools: ["Free psychology journals and podcasts", "Classmates, with permission"],
      reflect: "Did you enjoy the actual work — statistics, listening without solving, careful observation — or the idea of understanding people?" },

    business: { title: "Try Law, Business & Finance", days: [
      { day: 1, focus: "Read a real case", text: "Find a public legal case summary. Write the facts, the issue, both arguments, and the decision — separately, not mixed together." },
      { day: 2, focus: "Argue the other side", text: "Choose an issue you have an opinion on. Write the strongest honest argument for the side you disagree with." },
      { day: 3, focus: "Follow the money", text: "Pick a small local business. Work out how it earns, what it spends, and what one thing would sink it." },
      { day: 4, focus: "Read the fine print", text: "Take a real contract, terms of service, or loan agreement and summarise what you are actually agreeing to in plain language." },
      { day: 5, focus: "Model a decision", text: "Build a simple spreadsheet for a real choice (a purchase, a trip). Compare cost, benefit and risk. Change one assumption and see what breaks." },
      { day: 6, focus: "Draft something binding", text: "Write a short, precise agreement between two people — clear enough that a stranger could apply it without asking questions." },
      { day: 7, focus: "Reflect", text: "Did you enjoy precision, arguing, and detail, or would that level of exactness exhaust you?" } ],
      tools: ["Public court judgments", "A free spreadsheet"],
      reflect: "Did you enjoy the actual work — dense reading, exact wording, adversarial argument, detail-checking — or the idea of a secure profession?" },

    arts: { title: "Try Design & Creative Media", days: [
      { day: 1, focus: "Redesign a real thing", text: "Find a poster, app screen, or sign that confuses people. Write exactly what makes it fail before you change anything." },
      { day: 2, focus: "Redraw it", text: "Rebuild it with one specific audience and purpose in mind. Keep everything deliberate." },
      { day: 3, focus: "Learn one principle", text: "Study one design principle properly (contrast, hierarchy, or alignment) and explain how your redesign uses it." },
      { day: 4, focus: "Get real feedback", text: "Show both versions to three people and ask which one they understood faster. Listen without defending." },
      { day: 5, focus: "Start from a blank page", text: "Make something original for the same brief, with no reference to the original. This is much harder and much more revealing." },
      { day: 6, focus: "Show the process", text: "Line up your sketches and drafts in order. Write two sentences about what you changed and why." },
      { day: 7, focus: "Reflect", text: "Did you enjoy the revision cycles and the criticism, or only the first spark of an idea?" } ],
      tools: ["Free design tools", "Paper and a phone camera"],
      reflect: "Did you enjoy the actual work — repeated revisions, opening yourself to critique — or the idea of being creative?" },

    earth: { title: "Try Agriculture & Environment", days: [
      { day: 1, focus: "Survey your area", text: "Walk or map 200 metres around your home. Record every plant, animal, water source and waste point you notice." },
      { day: 2, focus: "Pick one system", text: "Choose one thing worth studying (a plant, a drainage point, a food item) and learn how it actually works." },
      { day: 3, focus: "Track it", text: "Observe your chosen system daily from here. Record what changes and what stays the same." },
      { day: 4, focus: "Find the trade-off", text: "Identify who benefits and who pays for how this system is currently managed. There is always a trade-off; find it." },
      { day: 5, focus: "Check the evidence", text: "Find official data or a study on your topic. Compare it with what you observed yourself." },
      { day: 6, focus: "Propose one change", text: "Write a workable, specific improvement — for a real place, a real budget, and real people." },
      { day: 7, focus: "Reflect", text: "Did you enjoy the fieldwork, being outdoors, and slow observation — or the science only in a theory form?" } ],
      tools: ["Your local area", "Official environment/agriculture data"],
      reflect: "Did you enjoy the actual work — outdoors, seasonal, patient observation — or the idea of helping the environment?" },

    service: { title: "Try Hospitality & Logistics", days: [
      { day: 1, focus: "Map a service", text: "Choose a restaurant, hotel, or delivery service. Write every step from the customer's decision to the outcome." },
      { day: 2, focus: "Find the friction", text: "Mark the three points where a customer would get annoyed, confused, or wait. These are where the job actually lives." },
      { day: 3, focus: "Plan a route", text: "Plan a real journey or delivery with a time and cost budget. Then find where it could realistically fail." },
      { day: 4, focus: "Serve someone", text: "Help one person complete a task or have a good experience, and pay attention to everything you had to manage quietly." },
      { day: 5, focus: "Handle a complaint", text: "Write how you would respond to an angry customer who is partly right. Fixing it matters more than winning it." },
      { day: 6, focus: "Improve the process", text: "Take the friction points from day 2 and propose one concrete change that removes the worst of them." },
      { day: 7, focus: "Reflect", text: "Did you enjoy the pace, the people, and the unpredictability — or would the constant interruption drain you?" } ],
      tools: ["A real local service to observe", "A notebook"],
      reflect: "Did you enjoy the actual work — fast-paced, customer-facing, always changing — or the idea of running something?" },

    public: { title: "Try Public Service & Safety", days: [
      { day: 1, focus: "Map a public service", text: "Choose one public service you actually use (transport, water, waste, health). Map who runs it and who pays for it." },
      { day: 2, focus: "Find the gap", text: "Identify one group of people this service fails or reaches poorly. Describe the failure precisely and without blame." },
      { day: 3, focus: "Read the rules", text: "Find the actual policy, law or regulation behind the service. Read a real section of it rather than a summary." },
      { day: 4, focus: "Learn from a real incident", text: "Read one published report on an emergency or public failure. Identify what failed and at which decision point." },
      { day: 5, focus: "Draft a plan", text: "Write a one-page practical plan to improve the gap from day 2 — with a realistic budget, timeline and owner." },
      { day: 6, focus: "Check the constraints", text: "List the legal, political and financial limits that would stop your plan working. Public service is mostly constraint management." },
      { day: 7, focus: "Reflect", text: "Did you enjoy procedure, evidence and compromise — or would the slowness of public systems frustrate you?" } ],
      tools: ["Official government portals", "Public incident reports"],
      reflect: "Did you enjoy the actual work — slow procedure, competing stakeholders, written evidence — or the idea of serving the public?" },
  };

  /* The ordered chain that turns a pathway into a plan. Kept here so both the
     roadmap and any future printable/exported version agree on the same order. */
  const roadmapChain = [
    "Career", "Skills", "Subjects", "Degree options",
    "Universities", "Exams", "Projects", "Experiments", "Next steps"
  ];

  return {
    clusters, clusterMembers, signals, stats, steps, values,
    testimonials, faqs, experiments, roadmapChain
  };
})();
