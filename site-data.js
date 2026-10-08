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
    { value: "78", label: "career pathways, each with a first test you can run" },
    { value: "1,000", label: "deep questions in the bank" },
    { value: "10", label: "dimensions of interest explored per session" },
    { value: "Free", label: "for students — no ads, no data resale" }
  ];

  const steps = [
    { icon: "i-clipboard", title: "Answer 20 questions",
      text: "A balanced set drawn from a 1,000-question bank: scenarios, rankings, scales and open reflection. Every session is different." },
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

  return { clusters, clusterMembers, signals, stats, steps, values, testimonials, faqs };
})();
