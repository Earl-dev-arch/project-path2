const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const STORE={user:"yp_user_v3",answers:"yp_answers_v3",saved:"yp_saved_v3",cookie:"yp_cookie_v3",session:"yp_question_session_v3",accounts:"yp_accounts_v3",history:"yp_history_v3",savedNotes:"yp_saved_notes_v3",experiments:"yp_experiments_v3"};
const state={user:JSON.parse(localStorage.getItem(STORE.user)||"null"),answers:JSON.parse(localStorage.getItem(STORE.answers)||"{}"),saved:JSON.parse(localStorage.getItem(STORE.saved)||"[]"),session:JSON.parse(localStorage.getItem(STORE.session)||"null"),accounts:JSON.parse(localStorage.getItem(STORE.accounts)||"{}"),history:JSON.parse(localStorage.getItem(STORE.history)||"[]"),savedNotes:JSON.parse(localStorage.getItem(STORE.savedNotes)||"{}"),experiments:JSON.parse(localStorage.getItem(STORE.experiments)||"{}"),qIndex:0,compareSelected:[],eduPathway:null};

const categoryConfig=[
 {id:"interests",label:"Genuine interests",weight:14},
 {id:"subjects",label:"Subjects & curiosity",weight:10},
 {id:"problem",label:"Problem solving",weight:12},
 {id:"creativity",label:"Creativity & design",weight:9},
 {id:"communication",label:"Communication & people",weight:10},
 {id:"workstyle",label:"Working style",weight:11},
 {id:"motivation",label:"Motivation & purpose",weight:9},
 {id:"learning",label:"Learning environment",weight:8},
 {id:"pressure",label:"External pressure reflection",weight:9},
 {id:"values",label:"Values & long-term goals",weight:8}
];

const contexts=[
 {id:"freetime",prefix:"In your free time,",suffix:"during an open weekend"},
 {id:"project",prefix:"When working on a school or group project,",suffix:"during collaborative teamwork"},
 {id:"online",prefix:"When browsing and self-learning online,",suffix:"when exploring new topics independently"},
 {id:"challenge",prefix:"When facing a new, unfamiliar challenge,",suffix:"when tackling an unsolved problem"},
 {id:"future",prefix:"When planning your future goals,",suffix:"when envisioning your ideal career path"}
];

function getCategoryStems(){
 return {
  interests:[
   {format:c=>`${c.prefix} which type of activity keeps you so engaged that you lose track of time?`,type:"scenario",options:["Building, coding, or assembling technical systems from scratch","Sketching, editing video, or crafting visual art and stories","Analyzing data, scientific evidence, or solving logic puzzles","Organizing events, helping friends, or discussing big social ideas","Experimenting with physical tools, hardware, or nature"]},
   {format:c=>`${c.prefix} what kind of video or article do you naturally click on first?`,type:"single",options:["Deep dives into how software, machines, or algorithms work","Creative tutorials on design, animation, storytelling, or music","Explanations of human psychology, philosophy, or social behavior","Scientific breakthroughs in astronomy, medicine, or environment","Business case studies, entrepreneurship, and economics"]},
   {format:c=>`I find myself genuinely curious about how complicated systems and mechanisms operate behind the scenes (${c.suffix}).`,type:"scale"},
   {format:c=>`Which of these activity areas spark your highest genuine curiosity (${c.suffix})?`,type:"multi",options:["Writing software, apps, or game logic","Graphic design, UX/UI, and digital media","Scientific experiments & environmental research","Community organizing, mentoring & counseling","Financial analysis, investing & market trends","Robotics, mechanics & physical engineering","Creative writing, journalism & podcasting","Healthcare, biology & clinical medicine"]},
   {format:c=>`Rank what gives you the greatest sense of accomplishment (${c.suffix}), from 1 (Highest) to 5 (Lowest):`,type:"rank",options:["Building a functional tool or system that runs smoothly","Creating a beautiful visual design or expressive story","Solving a complex puzzle or uncovering hidden patterns in data","Helping someone overcome a difficult personal or academic hurdle","Leading a team to successfully execute an ambitious plan"]},
   {format:c=>`${c.prefix} if you could shadow any professional for an entire week, who would you pick?`,type:"scenario",options:["A lead software architect or AI engineer developing new platforms","A creative director or product designer shaping innovative products","A research scientist or data analyst discovering new breakthroughs","A clinical psychologist, doctor, or community advocate helping people","A startup founder or executive making high-impact decisions"]},
   {format:c=>`I would gladly spend hours refining a project even if no one grades or inspects it (${c.suffix}).`,type:"scale"},
   {format:c=>`${c.prefix} when you encounter a new hobby or topic, what part do you want to explore first?`,type:"single",options:["The fundamental rules, technical documentation, and underlying mechanics","The visual aesthetics, creative possibilities, and expressive style","The practical applications and real-world utility","The community, culture, and stories of the people involved","The history, theory, and foundational concepts"]},
   {format:c=>`${c.prefix} which type of project would you voluntarily initiate without being prompted?`,type:"scenario",options:["Automating a repetitive task or building an interactive web tool","Creating a digital illustration, video essay, or musical piece","Conducting an investigation or analyzing statistics on a topic I love","Hosting a discussion group, workshop, or community initiative","Drafting a business plan or strategy for an idea I believe in"]},
   {format:c=>`I am energized by solving intricate technical or logical challenges (${c.suffix}).`,type:"scale"},
   {format:c=>`${c.prefix} what kind of question makes you want to research the answer immediately?`,type:"single",options:["Why a certain piece of code, machine, or software broke","How a compelling visual effect, movie scene, or design was produced","Why people behave or make decisions in specific predictable ways","What physical laws or natural phenomena explain an observed event","How a successful company grew and structured its revenue model"]},
   {format:c=>`Which types of tools or equipment do you most enjoy working with (${c.suffix})?`,type:"multi",options:["Code editors, terminal commands & developer IDEs","Design software (Figma, Photoshop, Blender, Illustrator)","Spreadsheets, data visualization & statistics packages","Video editing suites, audio DAWs & digital cameras","Laboratory gear, microscopes & field measurement tools","Whiteboards, planning boards & collaboration tools","Physical toolkits, breadboards & microcontrollers","Legal briefs, research journals & policy archives"]},
   {format:c=>`Rank these interest domains in order of personal appeal (${c.suffix}), from 1 (Most appealing) to 5 (Least):`,type:"rank",options:["Technology, Computing & Software Systems","Art, Design & Visual Storytelling","Natural Sciences, Medicine & Healthcare","Humanities, Psychology & Social Sciences","Business, Finance & Strategic Leadership"]},
   {format:c=>`${c.prefix} when an activity becomes difficult, what usually motivates you to push through?`,type:"single",options:["The satisfaction of troubleshooting until the logic finally clicks","The vision of a polished, beautiful end product I can be proud of","The desire to master an essential skill and gain deep understanding","Knowing that finishing this will directly assist or inspire others","The competitive excitement of overcoming a tough obstacle"]},
   {format:c=>`I enjoy testing theories by trying out real hands-on experiments (${c.suffix}).`,type:"scale"},
   {format:c=>`${c.prefix} what activity gives you the strongest feeling of genuine fulfillment rather than obligation?`,type:"scenario",options:["Developing a working solution that saves time or solves a problem","Bringing a novel creative idea to life in a visual or auditory format","Uncovering a clear explanation for a confusing topic through research","Connecting with someone one-on-one and making them feel supported","Pitching an idea and rallying others around a common mission"]},
   {format:c=>`${c.prefix} which field could you imagine immersing yourself in for years without getting bored?`,type:"single",options:["Software Engineering, Cyber Systems & Artificial Intelligence","Digital Design, Architecture & Creative Media","Healthcare, Neuroscience & Biomedical Sciences","Education, Counseling & Social Development","Economics, Venture Creation & International Trade"]},
   {format:c=>`I prefer working on open-ended creative concepts rather than following strict step-by-step guidelines (${c.suffix}).`,type:"scale"},
   {format:c=>`${c.prefix} describe in your own words one topic or activity you find endlessly fascinating and why:`,type:"open",placeholder:"Write about any field, project, or curiosity that captures your imagination..."},
   {format:c=>`${c.prefix} if you had to spend an entire month exploring one topic without grades or exams, what would it be?`,type:"scenario",options:["Designing and coding a custom web app or indie game","Creating a portfolio of digital illustrations or 3D animations","Analyzing real-world datasets to uncover social or economic trends","Volunteering at a clinic or community outreach organization","Building a physical electronic prototype or mechanical gadget"]}
  ],
  subjects:[
   {format:c=>`${c.prefix} which subject area feels most rewarding to you when you understand a tough concept?`,type:"single",options:["Computer Science, Programming, and Logic","Mathematics, Statistics, and Quantitative Reasoning","Physical and Biological Sciences (Physics, Chemistry, Biology)","Literature, Philosophy, and Creative Writing","Social Studies, History, and Human Geography"]},
   {format:c=>`I enjoy seeing how abstract formulas and theories connect to real-world applications (${c.suffix}).`,type:"scale"},
   {format:c=>`Which combination of disciplines would you be most excited to study together (${c.suffix})?`,type:"multi",options:["Computer Science + Mathematics","Design & Arts + Psychology","Biology + Data Science (Bioinformatics)","Economics + Political Science","Physics + Mechanical Engineering","Literature + Media Communications","Chemistry + Environmental Science","Business Administration + Technology"]},
   {format:c=>`${c.prefix} if you were designing your own custom elective course, what would be its core subject?`,type:"scenario",options:["Artificial Intelligence & Modern Web Development","Human-Centered Product & Interaction Design","Epidemiology & Global Healthcare Innovations","Behavioral Economics & Entrepreneurial Strategy","Ethics, Law & International Diplomacy"]},
   {format:c=>`Rank these academic activities based on your enjoyment (${c.suffix}), from 1 (Most enjoyable) to 5 (Least):`,type:"rank",options:["Solving complex math and algorithm problem sets","Writing an analytical essay comparing different viewpoints","Conducting hands-on science experiments in a laboratory","Creating multimedia presentations and visual infographics","Participating in classroom debates and mock trials"]},
   {format:c=>`I find quantitative subjects (like math and physics) more engaging than purely memorization-based classes (${c.suffix}).`,type:"scale"},
   {format:c=>`${c.prefix} when reading a textbook or article, what part catches your attention most?`,type:"single",options:["Diagrams explaining systems, circuit paths, or code workflows","Visual design, typography, and illustrative figures","Case studies detailing real people and historical events","Graphs, statistical charts, and empirical study results","Theoretical debates and ethical dilemmas"]},
   {format:c=>`${c.prefix} which subject do you find yourself researching questions about outside of school hours?`,type:"scenario",options:["Tech developments, gadgets, and software architecture","Artistic techniques, animation pipelines, or cinematography","Medical discoveries, mental health, or neuroscience","Economic trends, stock markets, and startup funding","Environmental conservation, climate science, and biodiversity"]},
   {format:c=>`I enjoy subjects where problems have clear, objective, verifiable answers over subjective interpretation (${c.suffix}).`,type:"scale"},
   {format:c=>`${c.prefix} which subject would you feel most confident teaching or explaining to a junior student?`,type:"single",options:["Mathematics, Algebra, or Logic","Science (Biology, Chemistry, or Physics)","Language, Literature, and Creative Expression","Information Technology and Computer Basics","History, Social Studies, and Civics"]},
   {format:c=>`Which topics from modern science and technology fascinate you most (${c.suffix})?`,type:"multi",options:["Machine learning models & neural networks","Space exploration & astrophysical phenomena","Genetic engineering & CRISPR biotechnology","Clean energy & sustainable infrastructure","Cybersecurity & ethical hacking","Human cognitive neuroscience","Robotic automation & autonomous vehicles","Quantum computing & theoretical physics"]},
   {format:c=>`Rank these study methods based on what works best for you (${c.suffix}), from 1 (Most effective) to 5 (Least):`,type:"rank",options:["Building practical mini-projects to apply the concepts","Breaking theories down into concise summary notes and diagrams","Discussing and debating questions in study groups","Practicing through challenging problem sets and drills","Watching in-depth video lectures and case studies"]},
   {format:c=>`I am willing to struggle through difficult subject matter if the underlying topic is genuinely exciting (${c.suffix}).`,type:"scale"},
   {format:c=>`${c.prefix} which type of assignment do you consistently put extra effort into beyond the basic requirements?`,type:"scenario",options:["Writing and optimizing clean code or building an interactive demo","Polishing visual designs, slides, or creative layouts","Conducting exhaustive research and finding obscure primary sources","Organizing team contributions and preparing an engaging presentation","Modeling and calculating precise mathematical solutions"]},
   {format:c=>`${c.prefix} if grades were removed completely, which subject would you still eagerly study?`,type:"single",options:["Computer Science and Programming","Creative Arts, Design, and Media","Psychology, Sociology, and Philosophy","Natural Sciences and Medical Research","Business, Finance, and Economics"]},
   {format:c=>`I find human behavior, culture, and communication more interesting than mechanical or computational systems (${c.suffix}).`,type:"scale"},
   {format:c=>`${c.prefix} which field of applied research would you want to contribute to?`,type:"scenario",options:["Developing accessible healthcare technologies and medical diagnostics","Engineering scalable software tools and secure digital networks","Designing sustainable cities, green energy, and environmental protections","Creating educational media and creative tools for students","Formulating public economic policies to reduce community disparities"]},
   {format:c=>`I prefer deep focus on one specialized academic topic rather than spreading my attention across diverse fields (${c.suffix}).`,type:"scale"},
   {format:c=>`${c.prefix} tell us about a school subject or topic you initially found confusing but grew to love once it clicked:`,type:"open",placeholder:"Share your journey with a subject that became rewarding over time..."},
   {format:c=>`${c.prefix} when choosing your high school or college electives, what is your primary decision criteria?`,type:"single",options:["Direct practical skills that prepare me for high-demand tech roles","Creative freedom to build an artistic or design portfolio","A rigorous scientific foundation for healthcare or research paths","Leadership and communication skills for business and management","Deep exploration of history, law, and human society"]}
  ],
  problem:[
   {format:c=>`${c.prefix} when an unexpected bug or error breaks your work, what is your immediate reaction?`,type:"scenario",options:["Isolate the problem systematically and test potential fixes one by one","Search online documentation and forums for how others solved it","Brainstorm alternative creative workarounds to bypass the roadblock","Consult a peer or mentor to get a fresh perspective on the issue","Step back, review the overarching architecture, and rebuild if needed"]},
   {format:c=>`I enjoy unraveling complicated logic puzzles and finding the most efficient solution (${c.suffix}).`,type:"scale"},
   {format:c=>`Which types of problems do you feel most natural solving (${c.suffix})?`,type:"multi",options:["Technical bugs in software code or scripts","Aesthetic/visual imbalances in a design layout","Interpersonal conflicts and team miscommunications","Mathematical and statistical data discrepancies","Logistical bottlenecks and scheduling inefficiencies","Mechanical or hardware malfunctions in physical devices","Ambiguous strategic decisions with incomplete information","Complex research questions with conflicting source claims"]},
   {format:c=>`${c.prefix} how do you handle a problem where the instructions are vague or incomplete?`,type:"single",options:["Treat the ambiguity as an opportunity to define my own creative approach","Break the problem into testable assumptions and experiment with mini-prototypes","Ask clarifying questions to identify the core constraints and objectives","Research analogous examples to see standard best practices","Build a simple baseline first and iterate based on feedback"]},
   {format:c=>`Rank these problem-solving stages based on which feels most satisfying (${c.suffix}), from 1 (Most) to 5 (Least):`,type:"rank",options:["Diagnosing the root cause beneath the visible symptoms","Brainstorming unconventional, out-of-the-box solution ideas","Building and testing the working implementation","Optimizing the solution for speed, elegance, and reliability","Explaining the solution clearly so others can reproduce it"]},
   {format:c=>`I prefer relying on verified empirical evidence and data over intuition when making tough decisions (${c.suffix}).`,type:"scale"},
   {format:c=>`${c.prefix} when two promising solutions exist for the same challenge, how do you decide between them?`,type:"scenario",options:["Evaluate measurable metrics like efficiency, accuracy, and scalability","Choose the one that provides the best user experience and aesthetic elegance","Pick the solution that is simplest to implement and maintain over time","Consult with stakeholders to see which aligns best with team priorities","Build a quick A/B test to let real-world performance decide"]},
   {format:c=>`${c.prefix} what makes you feel confident that a solution you built is truly finished?`,type:"single",options:["It passed all rigorous edge cases and stress tests without failing","It looks clean, intuitive, and enjoyable for people to interact with","The underlying codebase/logic is well-documented and clean","The team or client tested it and confirmed it solves their core need","It outperforms previous benchmarks by a significant margin"]},
   {format:c=>`I am comfortable making progress on a problem even when there is no single 'correct' answer (${c.suffix}).`,type:"scale"},
   {format:c=>`${c.prefix} if a system you built works but you do not know why, what do you do?`,type:"single",options:["Investigate until I fully understand the exact mechanism that made it work","Document the successful configuration and move on to next deliverables","Refactor the components until the logic is completely transparent","Test edge cases to verify it won't unexpectedly fail later","Discuss it with a colleague to get their take on the unexpected outcome"]},
   {format:c=>`Which problem-solving methodologies do you naturally gravitate toward (${c.suffix})?`,type:"multi",options:["Root cause analysis & first-principles thinking","Rapid prototyping & design-thinking iterations","Statistical regression & quantitative modeling","Empathy mapping & user journey analysis","Flowcharting systems & dependency mapping","Collaborative brainstorming & agile sprints","Risk assessment & worst-case scenario planning","Algorithmic optimization & computational complexity"]},
   {format:c=>`Rank these types of challenges in order of which you'd tackle with the most enthusiasm (${c.suffix}), from 1 to 5:`,type:"rank",options:["Fixing a high-stakes technical outage or complex system bug","Redesigning an unintuitive product into a seamless experience","Analyzing messy, unorganized data to uncover actionable trends","Mediating a team disagreement to achieve consensus and momentum","Developing a go-to-market strategy for an unproven new concept"]},
   {format:c=>`I enjoy troubleshooting mechanical or digital gadgets when they stop working properly (${c.suffix}).`,type:"scale"},
   {format:c=>`${c.prefix} when a project plan completely falls apart, what is your approach?`,type:"scenario",options:["Quickly re-prioritize essential requirements and chart a realistic recovery path","Gather the group to boost morale and distribute adjusted responsibilities","Identify what assumption failed and adapt the strategy accordingly","Look for creative shortcuts that deliver the core value with less effort","Work through the night to build a functional prototype that recovers ground"]},
   {format:c=>`${c.prefix} which problem scale excites you most?`,type:"single",options:["Micro-level optimization: making individual lines of code or components blazingly fast","Product-level architecture: designing how multiple features interact smoothly","Human-level dynamics: improving how individuals and teams communicate","Ecosystem-level impact: addressing global challenges like health, climate, or education","Market-level dynamics: building businesses that outmaneuver industry competitors"]},
   {format:c=>`I find satisfaction in automating manual, repetitive tasks through scripts or tools (${c.suffix}).`,type:"scale"},
   {format:c=>`${c.prefix} what is your favorite part of solving a complicated mystery or puzzle?`,type:"single",options:["The moment of insight when separate clues connect into a clear pattern","The methodical process of eliminating impossible hypotheses","Sharing the final explanation with others who were confused","Applying the discovery to build something tangible","Knowing that I persevered through initial confusion"]},
   {format:c=>`I tend to question established rules and ask 'why does it have to be done this way?' (${c.suffix}).`,type:"scale"},
   {format:c=>`${c.prefix} describe a tough problem you enjoyed solving recently and how you approached it:`,type:"open",placeholder:"Describe the challenge, your thought process, and what you learned..."},
   {format:c=>`${c.prefix} when presented with a massive dataset, what is your first instinct?`,type:"scenario",options:["Write queries or code to clean the data and compute summary metrics","Plot visual charts to spot outliers, correlations, and visual clusters","Formulate specific testable hypotheses before diving in","Search for human stories and meaningful real-world context behind the numbers","Synthesize the key takeaways into an executive slide deck"]}
  ],
  creativity:[
   {format:c=>`${c.prefix} when starting a creative project, where do your ideas usually originate?`,type:"single",options:["Analyzing existing products and remixing their best functional features","Drawing inspiration from visual arts, nature, architecture, and cinematography","Brainstorming solutions to real daily frustrations that people experience","Doodling, free-writing, and letting spontaneous imagination take over","Studying historical precedents and philosophical themes"]},
   {format:c=>`I find creative constraints (like limited budgets or strict rules) make projects more exciting (${c.suffix}).`,type:"scale"},
   {format:c=>`Which creative mediums feel most natural for you to express yourself (${c.suffix})?`,type:"multi",options:["User interface design, Figma wireframes & website aesthetics","Digital illustration, 2D/3D concept art & graphic design","Interactive programming, game mechanics & procedural logic","Creative writing, scriptwriting & worldbuilding","Video editing, motion graphics & cinematography","Music production, sound design & podcast audio","Interior decorating, spatial design & physical architecture","Branding, marketing slogans & visual identities"]},
   {format:c=>`${c.prefix} when you notice a product or app with poor visual design, how do you react?`,type:"scenario",options:["I mentally redesign the layout, colors, and typography to make it cleaner","I focus on fixing the confusing user flow and broken interaction steps","I wonder how it passed user testing and how the team prioritized it","I inspect the underlying code to see what technical compromises occurred","I ignore the visuals as long as the core functionality gets the job done"]},
   {format:c=>`Rank what makes a creative design truly great (${c.suffix}), from 1 (Most important) to 5 (Least):`,type:"rank",options:["Flawless usability that makes complex tasks feel effortless","Breathtaking visual beauty and distinct emotional atmosphere","Unprecedented originality and boundary-pushing innovation","Clarity in communicating its core message without confusion","Technical elegance and lightweight performance"]},
   {format:c=>`I enjoy spending time polishing visual details like spacing, fonts, and color palettes (${c.suffix}).`,type:"scale"},
   {format:c=>`${c.prefix} when someone gives constructive critique on your creative work, what is your approach?`,type:"single",options:["Separate my ego from the work, analyze the feedback, and iterate rapidly","Ask clarifying questions to understand what emotions or confusion they felt","Compare their feedback against my original creative vision before deciding","Look for creative compromises that satisfy the feedback while keeping novelty","Test the revised design against multiple other users to see if feedback holds"]},
   {format:c=>`${c.prefix} what part of the creative production process brings you the greatest joy?`,type:"scenario",options:["The initial blue-sky brainstorming phase where anything is possible","The hands-on craft of building, styling, and watching it take shape","The final polish phase where fine details elevate it to professional quality","The release moment when audience members react and interact with it","The retrospective review discovering how much skill I gained along the way"]},
   {format:c=>`I believe every technical product should have world-class aesthetic design (${c.suffix}).`,type:"scale"},
   {format:c=>`${c.prefix} if you were tasked with explaining a complex concept without a lecture, what would you create?`,type:"single",options:["An interactive web simulation or playable mini-game","An animated visual infographic or comic strip","A compelling video essay with dynamic editing and clear narration","A hands-on physical model or workshop activity","A structured case-study booklet with real-world examples"]},
   {format:c=>`Which types of creative projects would you proudly display in your personal portfolio (${c.suffix})?`,type:"multi",options:["A fully responsive mobile application or web portfolio","A brand identity package with custom logos and visual guidelines","A playable 2D/3D video game level or interactive experience","A published research essay or investigative journalism article","A short film, documentary, or motion graphics reel","An architectural blueprint or interior redesign concept","A hardware prototype or automated mechanical device","A series of high-impact advertising or social media campaigns"]},
   {format:c=>`Rank these creative roles based on which suits your strengths best (${c.suffix}), from 1 to 5:`,type:"rank",options:["UI/UX Designer — designing intuitive digital experiences","Art Director — establishing the visual tone and stylistic vision","Creative Technologist — bridging custom code with interactive art","Content Strategist — crafting compelling stories and brand narratives","Product Architect — balancing technical feasibility with aesthetic elegance"]},
   {format:c=>`I often come up with unconventional ideas that combine two completely unrelated fields (${c.suffix}).`,type:"scale"},
   {format:c=>`${c.prefix} when facing a blank canvas or empty document, what helps you get started?`,type:"scenario",options:["Creating moodboards and gathering visual inspiration from top creators","Outlining the functional requirements and structure first","Diving straight into rough sketching without judging early attempts","Discussing ideas aloud with a friend to clarify concepts","Conducting research into target audience preferences"]},
   {format:c=>`${c.prefix} which aesthetic style resonates most with you?`,type:"single",options:["Sleek minimalism, dark mode glassmorphism, and clean modern typography","Vibrant, expressive, high-energy palettes with dynamic motion","Warm, organic, earthy textures with human-crafted touches","Futuristic cyberpunk, retro-neon, and high-tech interfaces","Classic, structured, editorial layouts with timeless elegance"]},
   {format:c=>`I would rather create an original work from scratch than iterate on someone else's template (${c.suffix}).`,type:"scale"},
   {format:c=>`${c.prefix} how important is expressing your personal identity in your work?`,type:"single",options:["Essential — my work must reflect my unique artistic voice and vision","Very important — but always balanced with user utility and client goals","Moderate — I focus more on solving the user's problem than personal expression","Secondary — I prioritize technical excellence and objective performance","Situational — it depends entirely on whether the project is art or a utility"]},
   {format:c=>`I find designing interfaces and interactive experiences more exciting than pure graphic illustration (${c.suffix}).`,type:"scale"},
   {format:c=>`${c.prefix} describe a creative piece, product, or design that inspired you recently and why:`,type:"open",placeholder:"Write about what made the piece special, its craft, and emotional impact..."},
   {format:c=>`${c.prefix} if you had unlimited creative budget and a team of 5, what would you direct them to build?`,type:"scenario",options:["An innovative educational app that makes learning feel like an adventure game","An animated short film with groundbreaking visual style and soundtrack","A community platform connecting students with real-world mentors","An interactive physical installation blending projection mapping and sound","A breakthrough consumer product that redefines an everyday habit"]}
  ],
  communication:[
   {format:c=>`${c.prefix} when working in a group, which role do you naturally step into?`,type:"scenario",options:["The Architect/Builder: focusing on technical execution and building deliverables","The Visionary/Designer: shaping the aesthetic presentation and creative concept","The Organizer/Leader: structuring timelines, roles, and keeping everyone aligned","The Researcher/Analyst: gathering facts, verifying data, and quality-checking arguments","The Mediator/Communicator: ensuring everyone's voice is heard and resolving friction"]},
   {format:c=>`I feel energized when explaining complex concepts in simple, intuitive terms (${c.suffix}).`,type:"scale"},
   {format:c=>`Which communication settings make you feel most effective (${c.suffix})?`,type:"multi",options:["One-on-one deep conversations & mentoring","Presenting on stage to large audiences","Written documentation, tutorials & articles","Collaborative brainstorms in small agile teams","Live debates, negotiations & courtroom mock trials","Podcasts, live streams & video storytelling","Visual communication through charts & diagrams","Community moderation & active forum discussions"]},
   {format:c=>`${c.prefix} how do you react when two team members have a fierce disagreement?`,type:"scenario",options:["Listen to both sides neutrally, identify common ground, and help negotiate a compromise","Look at the objective facts and data to determine which approach has higher merit","Propose building small tests for both ideas to see which performs better","Remind everyone of the overarching goal and time constraints to keep momentum","Focus on my assigned tasks and let the team leads resolve the dispute"]},
   {format:c=>`Rank what matters most when delivering an important presentation (${c.suffix}), from 1 to 5:`,type:"rank",options:["Captivating the audience with compelling storytelling and charisma","Presenting rock-solid evidence, methodology, and verifiable data","Designing beautiful, clean slides that simplify complicated diagrams","Providing clear, actionable next steps for the audience to execute","Engaging the room through interactive Q&A and dialogue"]},
   {format:c=>`I am comfortable taking the lead when a project lacks direction (${c.suffix}).`,type:"scale"},
   {format:c=>`${c.prefix} when someone on your team is falling behind on their tasks, what do you do?`,type:"single",options:["Reach out privately with empathy to ask what is blocking them and offer help","Help break their task into smaller, manageable sub-steps they can complete easily","Re-allocate non-critical parts of their workload to keep the team on schedule","Pair up with them for a focused working session to tackle it together","Discuss the bottleneck transparently during the next team sync"]},
   {format:c=>`${c.prefix} what gives you the strongest feeling of satisfaction in collaborative work?`,type:"scenario",options:["Watching a diverse group of people unite their strengths to ship something remarkable","Knowing that my technical or creative contribution was vital to our success","Mentoring a teammate and watching them grow in confidence and skill","Receiving public recognition and praise for the team's achievement","Creating a supportive, fun team environment where everyone enjoyed the process"]},
   {format:c=>`I prefer communicating important updates through clear written messages over unexpected phone calls (${c.suffix}).`,type:"scale"},
   {format:c=>`${c.prefix} how do you prepare for presenting a project to an audience of non-experts?`,type:"single",options:["Replace jargon with everyday analogies and visual diagrams","Focus entirely on the real-world benefits and 'why it matters' to them","Rehearse my pacing, tone of voice, and body language multiple times","Prepare engaging interactive demos so they can experience the concept live","Anticipate common questions and prepare clear slide appendices"]},
   {format:c=>`Which interpersonal skills are you most interested in mastering (${c.suffix})?`,type:"multi",options:["Persuasive public speaking & pitch storytelling","Empathetic active listening & psychological counseling","Strategic negotiation & consensus building","Team leadership & inspirational delegation","Technical writing & API documentation","Cross-cultural communication & diplomatic protocol","Crisis communication & public relations","User interviewing & qualitative research"]},
   {format:c=>`Rank these audience types in order of where you'd feel most confident speaking (${c.suffix}), from 1 to 5:`,type:"rank",options:["A room of fellow technical peers and engineers","A group of creative artists, designers, and storytellers","A panel of potential investors and business judges","A classroom of younger students eager to learn","A diverse public community gathering"]},
   {format:c=>`I enjoy networking and connecting with people from different fields and backgrounds (${c.suffix}).`,type:"scale"},
   {format:c=>`${c.prefix} when receiving feedback from users or customers, what is your primary focus?`,type:"scenario",options:["Look beyond what they say to understand their underlying emotional needs and struggles","Categorize the feedback into clear bug reports, feature requests, and usability fixes","Measure the statistical frequency of each complaint to prioritize the roadmap","Brainstorm creative solutions that exceed what the users originally requested","Reply personally to make them feel heard and appreciated"]},
   {format:c=>`${c.prefix} which communication style best matches your natural personality?`,type:"single",options:["Thoughtful, analytical, and structured with precise details","Warm, empathetic, encouraging, and people-centered","Direct, decisive, energetic, and action-oriented","Creative, witty, expressive, and story-driven","Calm, observant, diplomatic, and focused on listening"]},
   {format:c=>`I find one-on-one deep conversations more rewarding than large networking events (${c.suffix}).`,type:"scale"},
   {format:c=>`${c.prefix} how do you handle explaining a concept when the other person looks completely confused?`,type:"single",options:["Pause immediately, ask where I lost them, and try a completely different analogy","Draw a quick diagram or flowchart on paper or a whiteboard","Break it down to the simplest first-principles example possible","Ask them to explain their current understanding so I can spot the gap","Show a live demonstration rather than continuing verbal explanation"]},
   {format:c=>`I am comfortable advocating for minority viewpoints when a group is rushing into consensus (${c.suffix}).`,type:"scale"},
   {format:c=>`${c.prefix} share an experience where good communication made a huge difference in a project:`,type:"open",placeholder:"Describe what happened, how you communicated, and the outcome..."},
   {format:c=>`${c.prefix} if you were assigned to lead a team of 4 peers for a semester project, what is step one?`,type:"scenario",options:["Hold an informal kickoff meeting to understand each member's individual passions and goals","Set up clear project tools (Kanban board, shared repo/docs, group chat)","Define the project milestones, success criteria, and hard deadlines","Facilitate a fun brainstorming session to align on the creative concept","Assign initial research tasks based on each person's core strengths"]}
  ],
  workstyle:[
   {format:c=>`${c.prefix} which daily working schedule would let you do your absolute best work?`,type:"single",options:["Long blocks of uninterrupted deep focus with minimal meetings","A dynamic blend of independent sprints and lively team collaboration sessions","A structured 9-to-5 routine with predictable tasks and clear deadlines","Flexible, autonomous hours where I control when and where I produce deliverables","Fast-paced, high-intensity project rotations with frequent new challenges"]},
   {format:c=>`I thrive in quiet, solitary environments where I can concentrate without distraction (${c.suffix}).`,type:"scale"},
   {format:c=>`Which environment characteristics are most critical for your productivity (${c.suffix})?`,type:"multi",options:["Dual-monitor desk setup with fast internet and high-spec hardware","Quiet library or private office with zero auditory interruptions","Vibrant creative studio with whiteboards, art supplies & music","Collaborative co-working space with energetic teammates nearby","Outdoor/field environment with physical mobility and fresh air","Clear task management boards (Trello, Notion, Jira) with checkable goals","Total autonomy to decide methods and technical tools","Access to direct mentorship and instant feedback loops"]},
   {format:c=>`${c.prefix} when juggling multiple competing assignments, how do you manage your time?`,type:"scenario",options:["Prioritize by urgency and impact using a structured matrix or task list","Tackle the hardest, most complex problem first while my energy is highest","Knock out quick, easy tasks first to build momentum and clear mental space","Dedicate full themed days to specific subjects to minimize context switching","Work dynamically based on which project sparks my immediate inspiration"]},
   {format:c=>`Rank these workplace cultures based on where you'd feel most motivated (${c.suffix}), from 1 to 5:`,type:"rank",options:["A high-growth tech startup moving blazingly fast with high autonomy","A prestigious research institution dedicated to scientific rigor and discovery","A close-knit creative agency crafting high-profile visual campaigns","A purpose-driven non-profit or hospital prioritizing human care and social good","An established global enterprise offering stability, structure, and clear career ladders"]},
   {format:c=>`I prefer working on one project at a time until it is complete over multitasking across three (${c.suffix}).`,type:"scale"},
   {format:c=>`${c.prefix} how do you feel when project requirements change suddenly in the middle of development?`,type:"single",options:["Excited — pivots often lead to much better ideas and innovative solutions","Adaptable — I quickly evaluate what work can be preserved and refactor the rest","Calm — as long as deadlines and expectations are adjusted accordingly","Frustrated at first, but I systematically reorganize the tasks and move forward","Cautious — I want to understand why the shift occurred before changing course"]},
   {format:c=>`${c.prefix} what degree of guidance from managers or teachers do you prefer?`,type:"scenario",options:["High autonomy: give me the end goal and constraints, and let me figure out how to achieve it","Collaborative check-ins: regular milestone reviews and brainstorming feedback","Clear structure: detailed guidelines, examples, and step-by-step rubrics","Mentorship-focused: hands-on coaching where I learn by observing experienced leaders","Objective metrics: judge me purely on the final results and deliverables"]},
   {format:c=>`I enjoy working under tight deadlines with high adrenaline (${c.suffix}).`,type:"scale"},
   {format:c=>`${c.prefix} when you hit a mental block while working, what is your go-to reset strategy?`,type:"single",options:["Take a walk, exercise, or step away from screens completely","Switch to an easier sub-task or reorganize my notes and workspace","Talk through the problem out loud with a friend or rubber duck","Browse inspirational work or documentation to see fresh perspectives","Power through by trying different experimental approaches until one works"]},
   {format:c=>`Which work habits describe you best (${c.suffix})?`,type:"multi",options:["Early planner: completing work days before the deadline","Night owl: doing peak creative/coding work late in the evening","Deep focuser: easily spending 4+ hours absorbed in single tasks","Iterative builder: shipping quick drafts and refining repeatedly","Perfectionist: refining every micro-detail before showing anyone","Team synchronizer: keeping communications and notes crystal clear","Experimental explorer: trying 5 different tools before settling on one","Pragmatic finisher: prioritizing efficiency and essential requirements"]},
   {format:c=>`Rank these daily tasks in order of which you'd find most enjoyable (${c.suffix}), from 1 to 5:`,type:"rank",options:["Writing code, configuring tools, and debugging technical workflows","Designing visual interfaces, graphics, and presentation decks","Analyzing data sheets, statistics, and writing research reports","Brainstorming product strategy and collaborating in live workshops","Conducting user interviews and testing prototypes with real people"]},
   {format:c=>`I prefer remote/digital flexibility over having to work in a physical office every single day (${c.suffix}).`,type:"scale"},
   {format:c=>`${c.prefix} how do you maintain motivation when a project includes repetitive, tedious tasks?`,type:"scenario",options:["Write a script, macro, or shortcut to automate the repetition","Put on focus music or podcasts and power through in timed Pomodoro sprints","Gamify the task by tracking my speed and accuracy metrics","Remind myself of the larger purpose and importance of the final outcome","Break the monotony by alternating between tedious tasks and creative work"]},
   {format:c=>`${c.prefix} what balance between routine stability and unpredictable variety suits you best?`,type:"single",options:["80% variety / 20% routine: constant new problems, new technologies, and shifting projects","50% variety / 50% routine: a steady operational core with exciting creative challenges","80% routine / 20% variety: predictable expectations and mastered workflows with occasional updates","Project-dependent: periods of intense chaotic exploration followed by structured execution","100% autonomous: let me determine the balance depending on what I am building"]},
   {format:c=>`I find satisfaction in keeping my digital workspace, files, and notes meticulously organized (${c.suffix}).`,type:"scale"},
   {format:c=>`${c.prefix} when starting a brand new project, what is your natural starting step?`,type:"single",options:["Build a minimal working prototype as fast as possible to test feasibility","Create a comprehensive plan, timeline, and specification document","Gather references, moodboards, and analyze existing competitors","Assemble the team and align on roles, responsibilities, and communication tools","Formulate core questions and conduct research into user needs"]},
   {format:c=>`I am comfortable taking calculated risks when exploring unconventional solutions (${c.suffix}).`,type:"scale"},
   {format:c=>`${c.prefix} describe your ideal dream workspace setup and daily rhythm:`,type:"open",placeholder:"Describe your ideal desk, tools, schedule, and environment..."},
   {format:c=>`${c.prefix} which work output would make you feel most proud at the end of a sprint?`,type:"scenario",options:["A live, deployed software application that users can click and test","A comprehensive visual brand identity and design system","A published research paper with clean methodology and data charts","A thriving community event or workshop with energized participants","A validated business model with paying customers and positive unit economics"]}
  ],
  motivation:[
   {format:c=>`${c.prefix} what drives your desire to excel in your studies and projects?`,type:"single",options:["The inner satisfaction of mastering challenging, complex skills","The excitement of bringing original, creative ideas into the world","The desire to build practical tools that solve real societal problems","Achieving financial independence and building a secure, comfortable life","Earning recognition and becoming a respected leader in my field"]},
   {format:c=>`I am motivated more by internal curiosity than by grades, praise, or trophies (${c.suffix}).`,type:"scale"},
   {format:c=>`Which outcomes would give you the deepest sense of lasting purpose (${c.suffix})?`,type:"multi",options:["Building software or technology used by millions daily","Creating timeless art, literature, music, or films that inspire generations","Discovering new scientific insights that advance human medicine or physics","Mentoring and empowering disadvantaged students to achieve their dreams","Founding an ethical, sustainable business that creates rewarding jobs","Protecting endangered ecosystems and combating climate change","Reforming public policy and defending civil rights through law","Designing safe, beautiful, accessible infrastructure and cities"]},
   {format:c=>`${c.prefix} if salary and social prestige were 100% equal across all careers, what would you choose?`,type:"scenario",options:["Software Architect / AI Systems Developer","UX/Product Designer / Digital Artist","Medical Doctor / Biomedical Researcher","University Professor / High School Educator","Social Entrepreneur / Community Organizer"]},
   {format:c=>`Rank these career rewards based on what matters most to you (${c.suffix}), from 1 (Top priority) to 5:`,type:"rank",options:["High intellectual stimulation and continuous learning","Creative autonomy and freedom over my work","Direct positive impact on human lives and communities","High financial compensation and wealth building","Prestige, influence, and industry leadership"]},
   {format:c=>`I would rather work on a difficult, meaningful project than an easy job that pays well (${c.suffix}).`,type:"scale"},
   {format:c=>`${c.prefix} what makes you lose motivation most rapidly on a project?`,type:"single",options:["Excessive bureaucracy, micromanagement, and lack of creative freedom","Repetitive, brainless work that does not teach me anything new","Toxic team culture, lack of appreciation, and unfair credit distribution","Unclear goals where nobody knows what success looks like","Working on something that feels meaningless or harmful to society"]},
   {format:c=>`${c.prefix} when you hit a major failure or rejection, what keeps you going?`,type:"scenario",options:["Analyzing what went wrong objectively and treating it as valuable data for the next attempt","My stubborn belief in the long-term vision and my ability to improve","Support and encouragement from trusted mentors, family, or friends","The realization that all great builders and creators failed repeatedly before succeeding","Taking a short break to reset my mind, then attacking the problem from a fresh angle"]},
   {format:c=>`I find healthy competition with talented peers pushes me to reach higher potential (${c.suffix}).`,type:"scale"},
   {format:c=>`${c.prefix} which type of praise feels most genuinely validating to you?`,type:"single",options:["Praise for the technical elegance, ingenuity, or efficiency of my solution","Praise for the originality, beauty, and emotional impact of my creative design","Gratitude from someone whose life was genuinely made easier by what I built","Commendation for my work ethic, reliability, and leadership under pressure","Measurable metrics showing high performance and real-world adoption"]},
   {format:c=>`Which legacy would you feel most proud to leave behind in your future career (${c.suffix})?`,type:"multi",options:["A groundbreaking open-source software library or technological innovation","A portfolio of iconic creative works, designs, or stories","A legacy of patients, students, or mentees whose lives I transformed","A thriving enterprise or foundation built on ethical principles","A scientific discovery or patent that expanded human knowledge","A safer, more equitable community with stronger social protections","A published body of intellectual books, research, or philosophies","A successful family and a balanced life rich in personal relationships"]},
   {format:c=>`Rank these daily motivations in order of which fuels you most (${c.suffix}), from 1 to 5:`,type:"rank",options:["Curiosity to learn how something works and build mastery","Passion to express creativity and bring new ideas to life","Desire to help people and make a positive social contribution","Ambition to achieve independence, security, and success","Excitement of collaborating with brilliant teammates"]},
   {format:c=>`I feel deeply fulfilled when I can see the direct results of my effort in the real world (${c.suffix}).`,type:"scale"},
   {format:c=>`${c.prefix} what gives you confidence when embarking on an ambitious multi-month project?`,type:"scenario",options:["Having a clear roadmap broken down into manageable weekly milestones","Knowing I have the grit to research and self-teach whatever skills are needed","Having an enthusiastic team or mentor who believes in the vision","Testing small proof-of-concepts early to validate core assumptions","Focusing on the transformative impact the finished project will have"]},
   {format:c=>`${c.prefix} what does 'success' mean to you at age 30?`,type:"single",options:["Doing stimulating work I love with high autonomy, flexibility, and continuous learning","Being recognized as an exceptional creative or technical leader in my industry","Financial freedom, home ownership, and providing generously for my loved ones","Making measurable contributions to healthcare, education, or social equality","A balanced, fulfilling life with exciting adventures, great health, and close friends"]},
   {format:c=>`I am energized by having full ownership and accountability over my deliverables (${c.suffix}).`,type:"scale"},
   {format:c=>`${c.prefix} what kind of reward motivates you most to finish an arduous task?`,type:"single",options:["The joy of finally seeing the completed project working flawlessly","Taking time off to relax, celebrate, and explore new personal hobbies","Receiving positive feedback and appreciation from users and colleagues","A financial bonus, grade improvement, or tangible career advancement","Immediately moving on to the next exciting, bigger challenge"]},
   {format:c=>`I am willing to invest years of disciplined practice to become truly world-class at a craft (${c.suffix}).`,type:"scale"},
   {format:c=>`${c.prefix} what is your biggest personal 'why' that drives your ambitions?`,type:"open",placeholder:"Write about what drives you to succeed and what keeps you focused..."},
   {format:c=>`${c.prefix} if you had one year to work on any project with all living expenses covered, what would it be?`,type:"scenario",options:["Build and launch a venture-backed tech product or AI application","Write and produce a full-length graphic novel, indie game, or film","Conduct independent scientific research and publish findings","Establish a non-profit organization offering community educational services","Travel the world researching comparative cultures and writing a documentary"]}
  ],
  learning:[
   {format:c=>`${c.prefix} when learning a brand new software tool or programming language, what is your first step?`,type:"single",options:["Jump straight into building a mini-project and learn by breaking things","Follow a structured video course or step-by-step tutorial series","Read the official documentation, syntax reference, and architectural overview","Dissect open-source code examples and see how experienced builders wrote it","Ask a friend or mentor to give me a 15-minute high-level walkthrough"]},
   {format:c=>`I learn far better through hands-on practice than by listening to long theoretical lectures (${c.suffix}).`,type:"scale"},
   {format:c=>`Which learning resources do you find most engaging and effective (${c.suffix})?`,type:"multi",options:["Interactive coding playgrounds & sandbox environments","Comprehensive technical documentation & API guides","In-depth video tutorials & animated visual explainers","Structured textbooks with problem sets and solution manuals","Project-based hackathons & design challenges","One-on-one mentorship & code reviews with experts","Audio podcasts & interviews with industry pioneers","Study groups with collaborative problem-solving"]},
   {format:c=>`${c.prefix} how do you know when you have truly mastered a difficult concept?`,type:"scenario",options:["When I can explain it simply to someone with zero background and they understand it","When I can build a complex project from scratch without looking at tutorials","When I can debug and fix unexpected errors related to the concept effortlessly","When I can score top marks on a challenging, unannounced assessment","When I can critique different approaches and articulate subtle trade-offs"]},
   {format:c=>`Rank these learning environments based on where you thrive most (${c.suffix}), from 1 to 5:`,type:"rank",options:["Self-paced online exploration with full freedom to experiment","A collaborative studio or lab working alongside passionate peers","A rigorous academic classroom with an inspiring professor","An internship or apprenticeship working on real production deliverables","A fast-paced competition, hackathon, or intensive bootcamp"]},
   {format:c=>`I actively seek out critical feedback on my work because it accelerates my improvement (${c.suffix}).`,type:"scale"},
   {format:c=>`${c.prefix} what do you do when a textbook explanation or lecture makes zero sense?`,type:"single",options:["Search for 3 different video creators explaining the exact same topic from different angles","Ask AI or a mentor to break down the confusing sentence using simple real-world metaphors","Build a minimal practical test to see what the concept actually does in action","Re-read the foundational prerequisites to find what prior knowledge I am missing","Discuss it with classmates to see if they understand it and compare notes"]},
   {format:c=>`${c.prefix} how comfortable are you learning a completely unfamiliar topic without formal teacher guidance?`,type:"scenario",options:["Very comfortable — I love the independence of curating my own learning curriculum","Comfortable — as long as high-quality documentation, roadmaps, and community forums exist","Moderate — I can self-learn basics, but I value mentor check-ins for advanced topics","Cautious — I prefer having a structured syllabus to make sure I don't develop blind spots","Structured — I learn best when an expert guides the progression step by step"]},
   {format:c=>`I enjoy learning the deep historical and mathematical foundations behind modern tools (${c.suffix}).`,type:"scale"},
   {format:c=>`${c.prefix} what is your strategy when preparing for a high-stakes exam or presentation?`,type:"single",options:["Active recall and practice testing under simulated exam conditions","Creating concise visual cheat sheets, flowcharts, and concept maps","Teaching the curriculum to a classmate or study partner","Reviewing past exam papers and analyzing common question patterns","Re-writing summary notes and memorizing core definitions"]},
   {format:c=>`Which skill acquisition goals excite you most for the next two years (${c.suffix})?`,type:"multi",options:["Mastering full-stack web and mobile application engineering","Learning machine learning algorithms and data engineering","Developing professional UI/UX design and 3D modeling skills","Mastering financial modeling, accounting, and business strategy","Gaining clinical laboratory and biomedical research techniques","Sharpening public speaking, debate, and persuasive writing","Learning electronic circuits, microcontrollers, and robotics","Fluency in a foreign language and international diplomacy"]},
   {format:c=>`Rank these intellectual traits in order of which you value most in yourself (${c.suffix}), from 1 to 5:`,type:"rank",options:["Relentless curiosity and passion for lifelong self-learning","Logical rigor, analytical precision, and attention to detail","Creative lateral thinking and boundless imagination","Emotional intelligence, empathy, and social perception","Grit, resilience, and discipline through difficult challenges"]},
   {format:c=>`I find trial-and-error debugging teaches me more than reading about the correct solution beforehand (${c.suffix}).`,type:"scale"},
   {format:c=>`${c.prefix} what kind of teacher or mentor has had the greatest positive impact on you?`,type:"scenario",options:["The passionate visionary who made the subject come alive with contagious enthusiasm","The rigorous practitioner who held me to high standards and gave detailed feedback","The patient mentor who listened without judgment and nurtured my self-confidence","The pragmatic coach who focused on real-world practical skills and portfolio building","The intellectual philosopher who challenged my assumptions and taught me how to think"]},
   {format:c=>`${c.prefix} how do you stay updated on rapid advancements in technology and science?`,type:"single",options:["Reading curated newsletters, tech blogs, and research preprints","Following top engineers, designers, and researchers on social media and Discord","Listening to tech podcasts and attending virtual webinars and conferences","Experimenting with newly released developer tools, APIs, and libraries","Relying on university courses and formal academic literature"]},
   {format:c=>`I prefer broad generalist knowledge across many fields over narrow specialist expertise in one (${c.suffix}).`,type:"scale"},
   {format:c=>`${c.prefix} when you make a major mistake on a project, how do you handle it?`,type:"single",options:["Document the failure as a post-mortem to ensure I never repeat that specific error","Fix it immediately, apologize transparently to any affected teammates, and move on","Analyze whether our processes or architecture made the mistake easy to occur","Take it as a humbling reminder to double-check edge cases in the future","Turn the mistake into a funny learning story to share with peers"]},
   {format:c=>`I would love to participate in research that pushes the boundaries of current human knowledge (${c.suffix}).`,type:"scale"},
   {format:c=>`${c.prefix} describe a skill you taught yourself completely from scratch and how you did it:`,type:"open",placeholder:"Describe the skill, the tools you used, and what hurdles you overcame..."},
   {format:c=>`${c.prefix} if you could download instant fluency in any single capability, what would you choose?`,type:"scenario",options:["Advanced computational engineering and system architecture","Visual design, typography, and interactive animation mastery","Mathematical modeling, statistical inference, and algorithmic theory","Effortless persuasion, negotiation, and charismatic leadership","Biomedical clinical diagnosis and surgical precision"]}
  ],
  pressure:[
   {format:c=>`${c.prefix} when family members strongly urge you to pursue a specific high-status career, how do you feel?`,type:"scenario",options:["I appreciate their good intentions, but I am determined to follow my authentic interests","I research the career thoroughly to see if its daily reality matches my strengths","I feel anxious and pressured, but I am looking for respectful ways to communicate my true passions","I look for hybrid careers that satisfy their practical concerns while honoring my creativity","I prioritize their guidance because family security and expectations matter deeply to me"]},
   {format:c=>`I feel confident that my current career interests come from my genuine curiosity rather than peer pressure (${c.suffix}).`,type:"scale"},
   {format:c=>`Which external pressures do you find most challenging when thinking about your future (${c.suffix})?`,type:"multi",options:["Family expectations to enter traditional fields (medicine, law, engineering, accounting)","Social media trends glorifying overnight wealth and startup founders","Peer competition and fear of falling behind classmates' career milestones","High tuition costs and fear of graduating with heavy student debt","Societal pressure to pick a 'prestigious' job title that sounds impressive at dinner parties","Fear of choosing the 'wrong' field and wasting years on a degree I regret","Rapid AI advancements creating anxiety about which jobs will remain safe","Lack of clear, unbiased information on what daily work actually looks like"]},
   {format:c=>`${c.prefix} if a prestigious career paid well but its daily tasks bored you, what would you do?`,type:"single",options:["I would not choose it — spending 40+ hours weekly on unfulfilling work is not worth any status","I would test it through an internship to see if the reality is better than I expected","I might do it for a few years to build financial stability before pivoting to my true passion","I would look for adjacent roles within that industry that involve more creative or technical problem solving","I would choose it if it provided the financial freedom to pursue hobbies on the weekend"]},
   {format:c=>`Rank these factors based on how much they influence your career thinking (${c.suffix}), from 1 (Most) to 5:`,type:"rank",options:["Personal curiosity and intrinsic enjoyment of the daily work","Financial stability, salary potential, and job market demand","Family advice, expectations, and cultural values","Peer comparisons, social prestige, and respect from colleagues","Desire to make a meaningful positive impact on the world"]},
   {format:c=>`I am comfortable telling people 'I don't know my exact career title yet — I am exploring pathways' (${c.suffix}).`,type:"scale"},
   {format:c=>`${c.prefix} when friends flock toward a trendy new career path, how does that affect your thinking?`,type:"single",options:["I evaluate it objectively on its own merits, independent of whether it is popular or not","It makes me curious to research why it is popular and what skills it actually requires","It creates mild FOMO (fear of missing out), but I remind myself of my unique strengths","I naturally tend to look in the opposite direction for uncrowded, underrated niches","I enjoy exploring it alongside my friends as a shared group experience"]},
   {format:c=>`${c.prefix} how do you separate other people's expectations from what you truly want?`,type:"scenario",options:["By running real-world experiments (projects, internships) to test how I actually feel doing the work","By journaling and reflecting on what activities I do when no one is watching or grading me","By talking to working professionals about the unvarnished realities of their careers","By discussing my thoughts with an impartial counselor or mentor","By building a clear decision matrix comparing pros, cons, and alignment with my values"]},
   {format:c=>`I worry that choosing a creative or unconventional path might be financially risky (${c.suffix}).`,type:"scale"},
   {format:c=>`${c.prefix} when adults give you career advice, what evidence do you look for before trusting it?`,type:"single",options:["Whether their advice is based on modern industry realities or outdated 20-year-old assumptions","Whether they ask about my individual strengths or just preach what worked for them","Whether their own daily life reflects the balance and fulfillment I desire","Whether their recommendations are backed by reputable employment and economic data","I value their wisdom as one helpful perspective among many data points"]},
   {format:c=>`Which strategies help you manage future career anxiety (${c.suffix})?`,type:"multi",options:["Focusing on building versatile, high-leverage skills (coding, writing, math, design)","Running small 30-day projects to test career hypotheses with zero risk","Remembering that most people change career directions multiple times successfully","Building a supportive network of peers exploring alongside me","Limiting consumption of toxic social media hustle culture","Developing financial literacy and understanding realistic living costs","Focusing on the immediate next educational step rather than the next 40 years","Seeking guidance from teachers and career mentors"]},
   {format:c=>`Rank these potential worries about the future from 1 (Biggest concern) to 5 (Least):`,type:"rank",options:["Ending up in a monotonous job that drains my passion and energy","Not earning enough income to live comfortably and support my family","Disappointing my parents or mentors who invested in my education","Failing to make a meaningful difference in the world","Becoming obsolete due to rapid technological and AI changes"]},
   {format:c=>`I believe it is better to test multiple career hypotheses through mini-projects before committing (${c.suffix}).`,type:"scale"},
   {format:c=>`${c.prefix} if you were offered an impressive-sounding job that conflicted with your core ethics, what would you do?`,type:"scenario",options:["Decline it without hesitation — ethical integrity comes before any salary or prestige","Ask critical questions during interviews to see if I could advocate for reform from within","Weigh the trade-offs carefully, but lean toward finding an alternative ethical company","Consult trusted mentors to get their perspective on the ethical nuance","Look for other opportunities that align both with my financial goals and moral principles"]},
   {format:c=>`${c.prefix} how do you feel when classmates boast about internships or test scores?`,type:"single",options:["Happy for their success while staying focused on running my own personal marathon","Motivated to work harder, but on my own terms and chosen direction","A brief sting of comparison, which I quickly reframe by focusing on my unique journey","Curious about what they learned and what application strategies worked for them","Unbothered — academic metrics are only one small predictor of lifelong fulfillment"]},
   {format:c=>`I sometimes hesitate to share my true dream career because I fear judgment from others (${c.suffix}).`,type:"scale"},
   {format:c=>`${c.prefix} what information is most missing from typical high school career guidance?`,type:"single",options:["Realistic day-in-the-life walkthroughs of modern tech, design, and science roles","Honest discussions about salary trade-offs, work-life balance, and stress levels","Practical guidance on building portfolios and projects instead of just taking tests","Exploration of modern emerging careers created by AI, climate tech, and digital media","Tools to discover our genuine intrinsic motivations rather than rigid aptitude scores"]},
   {format:c=>`I believe having adaptable problem-solving skills is more valuable than mastering one narrow job title (${c.suffix}).`,type:"scale"},
   {format:c=>`${c.prefix} write candidly about any pressure or expectation you feel regarding your future career:`,type:"open",placeholder:"Write about family expectations, peer comparisons, or personal concerns..."},
   {format:c=>`${c.prefix} what gives you the greatest peace of mind when thinking about the future?`,type:"scenario",options:["Knowing that strong foundational skills in math, code, communication, and design never go out of style","Having a supportive family and community that loves me for who I am, not my job title","Trusting my own adaptability and resilience to learn whatever the future demands","Taking proactive, small daily steps on projects rather than worrying about decades ahead","Realizing that life is an ongoing journey of discovery with multiple exciting chapters"]}
  ],
  values:[
   {format:c=>`${c.prefix} when imagining your ideal adult life, what matters most beyond your job title?`,type:"single",options:["Ample time for family, friends, hobbies, and personal creative passions","Continuous intellectual growth, travel, and experiencing new cultures","Financial security and freedom from debt and economic stress","Active involvement in community development, mentoring, and social advocacy","Physical health, fitness, and living in a beautiful, inspiring environment"]},
   {format:c=>`I believe work should be a source of personal meaning, not just a paycheck (${c.suffix}).`,type:"scale"},
   {format:c=>`Which core ethical values guide your decisions most strongly (${c.suffix})?`,type:"multi",options:["Truth, scientific integrity & objective evidence","Empathy, kindness & active compassion for others","Fairness, social justice & systemic equality","Creativity, originality & self-expression","Discipline, excellence & relentless craftsmanship","Environmental sustainability & ecological stewardship","Loyalty, community solidarity & family devotion","Freedom, personal autonomy & independent thought"]},
   {format:c=>`${c.prefix} what kind of societal challenge would you most want your career work to address?`,type:"scenario",options:["Building intelligent, accessible technology that elevates human potential","Combating climate change and engineering sustainable clean energy systems","Eradicating diseases and expanding mental healthcare access worldwide","Reforming education to empower students of all backgrounds to thrive","Reducing economic poverty through ethical business and sustainable jobs"]},
   {format:c=>`Rank these non-monetary career benefits based on your preference (${c.suffix}), from 1 to 5:`,type:"rank",options:["Flexible working hours and remote work freedom","Generous paid leave and strong work-life balance policies","High budget for continuous learning, courses, and conferences","Brilliant, kind, and inspiring colleagues to collaborate with daily","Clear opportunities for rapid promotion and increased responsibility"]},
   {format:c=>`I would gladly choose a path with slightly lower income if it offered much higher day-to-day happiness (${c.suffix}).`,type:"scale"},
   {format:c=>`${c.prefix} how important is geographic flexibility (ability to travel or live anywhere) to you?`,type:"single",options:["Essential — I want a global career that allows me to work remotely from anywhere in the world","Very important — I want opportunities to relocate to major global innovation hubs","Moderate — I value travel, but I want a steady, rooted home base with my community","Secondary — I am happy living anywhere as long as the work and team are exceptional","Local focus — I want to stay close to my hometown and invest in my local community"]},
   {format:c=>`${c.prefix} when making tough trade-offs between two opportunities, what is your anchor principle?`,type:"scenario",options:["Which opportunity offers the steep learning curve and fastest skill growth","Which opportunity aligns most genuinely with my ethical convictions and purpose","Which opportunity provides the strongest foundation of financial stability and security","Which opportunity gives me the creative freedom to express my authentic ideas","Which opportunity allows me to build the most meaningful relationships"]},
   {format:c=>`I believe building strong human relationships is more important than achieving corporate titles (${c.suffix}).`,type:"scale"},
   {format:c=>`${c.prefix} which type of organization would you feel most proud to work for?`,type:"single",options:["An innovative technology lab pioneering breakthroughs for human benefit","A design studio or media house renowned for breathtaking artistic storytelling","A healthcare network or research hospital dedicated to healing and saving lives","A non-profit foundation or policy institute defending civil rights and the planet","An employee-owned, socially responsible business with transparent governance"]},
   {format:c=>`Which environmental and social practices do you expect from your future employer (${c.suffix})?`,type:"multi",options:["Zero carbon footprint & active climate sustainability initiatives","Transparent pay equity and fair employee compensation","Strong mental health support, counseling, and wellness benefits","Dedication to diversity, equity, and inclusive leadership","Ethical use of AI and respect for user data privacy","Open-source contributions and knowledge sharing with the public","Community volunteering days and charitable donation matching","Honest marketing without deceptive patterns or manipulative algorithms"]},
   {format:c=>`Rank these long-term aspirations in order of personal importance (${c.suffix}), from 1 to 5:`,type:"rank",options:["Achieving mastery in a specialized craft and being known for excellence","Building lifelong financial freedom and security for my loved ones","Making a measurable positive impact on society or the environment","Living an adventurous, creative life rich in art, travel, and stories","Cultivating deep, loving relationships with family, friends, and community"]},
   {format:c=>`I am committed to lifelong learning regardless of how far I advance in my career (${c.suffix}).`,type:"scale"},
   {format:c=>`${c.prefix} what kind of balance between risk and stability feels right to you?`,type:"scenario",options:["High risk / High reward: happy to join early startups or launch ventures with uncertainty","Balanced approach: building a stable core career while pursuing bold creative side projects","Calculated risk: taking bold steps only after thorough research and validation","Stability-first: prioritizing steady, resilient industries that withstand economic downturns","Dynamic: taking big risks in my 20s and transitioning toward stability later in life"]},
   {format:c=>`${c.prefix} what do you want your future career to always leave room for?`,type:"single",options:["Personal creative side projects, hobbies, and spontaneous exploration","Deep quality time with family, children, and lifelong friendships","Health, athletics, outdoor adventures, and mental wellness","Community volunteering, political advocacy, and civic participation","Unstructured downtime, reading, reflection, and continuous self-discovery"]},
   {format:c=>`I believe transparency and honesty should never be compromised for short-term profit (${c.suffix}).`,type:"scale"},
   {format:c=>`${c.prefix} when looking back on your life at age 80, what will matter most?`,type:"single",options:["That I lived authentically, pursued my genuine curiosities, and never sold out my passions","That I loved deeply, was a loyal friend and family member, and brought joy to others","That I created lasting works of beauty, technology, or knowledge that outlived me","That I fought bravely to leave the world cleaner, fairer, and kinder than I found it","That I persevered through adversity, grew in wisdom, and lived with integrity"]},
   {format:c=>`I am excited by the opportunity to mentor the next generation of students when I become experienced (${c.suffix}).`,type:"scale"},
   {format:c=>`${c.prefix} what is one core principle or value you refuse to compromise on in your career?`,type:"open",placeholder:"Write about the non-negotiable standard you hold for your work..."},
   {format:c=>`${c.prefix} if you could deliver one piece of advice to your future self 10 years from now, what would it be?`,type:"scenario",options:["Stay curious, keep learning, and never let routine extinguish your creative spark","Remember that people and relationships matter far more than corporate achievements","Take bold risks on ideas you believe in — failure is just data on the path to greatness","Protect your health and peace of mind; no job is worth burnout and chronic stress","Stay humble, listen generously, and use your success to lift others up"]}
  ]
 };
}

function makeQuestionBank(){
 const bank=[];let id=1;const stems=getCategoryStems();
 for(const cfg of categoryConfig){
  const categoryStems=stems[cfg.id]||[];
  categoryStems.forEach((stem,si)=>{
   contexts.forEach((ctx,ci)=>{
    const prompt=stem.format(ctx);
    let q={id:`Q${String(id).padStart(4,"0")}`,category:cfg.id,categoryLabel:cfg.label,weight:cfg.weight,type:stem.type,prompt:prompt,sourceWeight:cfg.weight};
    if(stem.type==="scale") q.scaleLabels=["Strongly disagree","Disagree","Neutral","Agree","Strongly agree"];
    else if(stem.type==="open") q.placeholder=stem.placeholder||"Write honestly. A few sentences are enough.";
    else if(stem.options) q.options=stem.options;
    bank.push(q);id++;
   });
  });
 }
 return bank;
}
const QUESTION_BANK=makeQuestionBank(); // exactly 1,000 carefully curated deep prompts
const TOTAL_BANK=QUESTION_BANK.length;

function weightedSession(){
 const candidates=QUESTION_BANK.map(q=>({q,key:-Math.log(Math.max(Math.random(),1e-12))/q.weight}));
 candidates.sort((a,b)=>a.key-b.key);
 let selected=candidates.slice(0,20).map(x=>x.q);
 const present=new Set(selected.map(q=>q.category));
 for(const cfg of categoryConfig){
   if(present.has(cfg.id)) continue;
   const replacement=QUESTION_BANK.filter(q=>q.category===cfg.id&&!selected.some(s=>s.id===q.id))[Math.floor(Math.random()*100)];
   const counts={};selected.forEach(q=>counts[q.category]=(counts[q.category]||0)+1);
   let idx=selected.length-1;let weakest=Infinity;
   for(let i=0;i<selected.length;i++){if(counts[selected[i].category]>1 && candidates.find(x=>x.q.id===selected[i].id)?.key<weakest){weakest=candidates.find(x=>x.q.id===selected[i].id)?.key;idx=i}}
   selected[idx]=replacement;present.add(cfg.id);
 }
 return shuffle(selected);
}
function shuffle(a){return a.map(v=>[Math.random(),v]).sort((x,y)=>x[0]-y[0]).map(x=>x[1])}
function newSession(){
 state.session={ids:weightedSession().map(q=>q.id),started:Date.now()};
 state.answers={};state.qIndex=0;saveState();
 try{trackSessionStarted()}catch(e){}
}
let _dbSyncTimeout = null;
function syncProgressToDatabase(){
  if(!state.user || (!state.user.id && !state.user.email)) return;
  clearTimeout(_dbSyncTimeout);
  _dbSyncTimeout = setTimeout(async ()=>{
    try {
      await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: state.user.id,
          email: state.user.email,
          answers: state.answers,
          saved: state.saved,
          savedNotes: state.savedNotes,
          experiments: state.experiments,
          session: state.session,
          qIndex: state.qIndex
        })
      });
    } catch(err) {
      /* Graceful offline fallback */
    }
  }, 400);
}
function saveState(){
 localStorage.setItem(STORE.user,JSON.stringify(state.user));
 localStorage.setItem(STORE.answers,JSON.stringify(state.answers));
 localStorage.setItem(STORE.saved,JSON.stringify(state.saved));
 localStorage.setItem(STORE.session,JSON.stringify(state.session));
 localStorage.setItem(STORE.accounts,JSON.stringify(state.accounts));
 localStorage.setItem(STORE.history,JSON.stringify(state.history));
 localStorage.setItem(STORE.savedNotes,JSON.stringify(state.savedNotes));
 localStorage.setItem(STORE.experiments,JSON.stringify(state.experiments));
 syncProgressToDatabase();
}
function sessionQuestions(){return state.session?.ids?.map(id=>QUESTION_BANK.find(q=>q.id===id)).filter(Boolean)||[]}
function ensureSession(){if(!state.session||state.session.ids?.length!==20)newSession()}

function toast(msg){const t=$("#toast");t.textContent=msg;t.classList.add("show");clearTimeout(window.__toast);window.__toast=setTimeout(()=>t.classList.remove("show"),2600)}
function escapeHtml(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}

/* ================================================================
   CAREER EXPERIMENTS
   A pathway is something you TEST, not something you "might like".
   Each experiment is a 7-day exploration ending with the only
   question that matters: did you enjoy the actual work?
   ================================================================ */

/* The 10 experiment families live in site-data.js. If that file is
   missing the tab still renders and explains the concept instead of
   throwing, so one absent file never breaks the whole dashboard. */
function experimentData(){
 return (typeof window!=="undefined" && window.YourPathData && window.YourPathData.experiments) || null;
}
function roadmapChainData(){
 return (typeof window!=="undefined" && window.YourPathData && window.YourPathData.roadmapChain) || ["Career","Skills","Subjects","Degree options","Universities","Exams","Projects","Experiments","Next steps"];
}

/* Map a pathway name to one of the 10 experiment families.
   Explicit keywords first (most specific), then fall back to the
   earliest keyword position in the pathway name. */
const EXPERIMENT_KEYWORDS={
 business:["law","legal","criminolog","business","account","financ","econom","market","entrepreneur","human resources","commerce","supply chain","logistics","public relations","journalism","communication"],
 health:["medicine","nurs","pharmac","medical","dentist","therapy","nutrition","veterinar","health","anatomy","doctor"],
 tech:["computer","software","cyber","data","information technology","information system","ict","programming","network"],
 arts:["design","graphic","animation","film","broadcast","music","performing","interior","fashion","fine arts","art","illustrat"],
 earth:["environ","agricultur","forestry","natural resource","geolog","earth science","food science","sustainab","agribusiness","ecolog"],
 service:["hospitality","tourism","culinary","maritime","marine engineering","hotel","travel","restaurant"],
 public:["public administration","public policy","emergency","disaster","aviation","forensic","library"],
 society:["psycholog","educat","teaching","social work","sociolog","political","international relations","anthropolog","histor","counsel"],
 science:["math","statistic","physic","chemistr","biolog","astronom","science","research"],
 engineering:["engineering","mechanic","electric","electronic","civil","chemical","industrial","mechatronic","robotic","architect","urban","regional planning"]
};
function clusterForPathway(name){
 const n=String(name||"").toLowerCase();
 if(!n) return null;
 let best=null,bestPos=Infinity;
 for(const [cluster,words] of Object.entries(EXPERIMENT_KEYWORDS)){
  for(const w of words){
   const pos=n.indexOf(w);
   if(pos!==-1 && pos<bestPos){best=cluster;bestPos=pos;}
  }
 }
 return best;
}
function experimentForPathway(name){
 const data=experimentData(); if(!data) return null;
 const key=clusterForPathway(name); if(!key) return null;
 return data[key]?{key,...data[key]}:null;
}
function expState(key){
 state.experiments=state.experiments||{};
 return state.experiments[key]||{done:[],reflection:"",enjoyment:null,started:Date.now()};
}
function saveExp(){saveState();updateUI();}
function toggleExpDay(key,day){
 state.experiments=state.experiments||{};
 const s=expState(key);
 const wasDone=(s.done||[]).includes(day);
 s.done=wasDone?s.done.filter(d=>d!==day):[...(s.done||[]),day].sort((a,b)=>a-b);
 state.experiments[key]=s;
 try{if(!wasDone)trackExperimentDay(key,day)}catch(e){}
 saveExp(); renderExperiments();
}
function setExpEnjoyment(key,val){
 state.experiments=state.experiments||{};
 const s=expState(key); s.enjoyment=val; s.answeredAt=val===null?null:Date.now();
 state.experiments[key]=s;
 try{if(val===null)trackReflection(key,null);else trackReflection(key,val)}catch(e){}
 saveExp(); renderExperiments();
}
function startExperimentFromPathway(name){
 const exp=experimentForPathway(name);
 if(!exp){toast("No experiment is mapped to this pathway yet.");return;}
 state.experiments=state.experiments||{};
 const s=expState(exp.key); if(!s.started||!(s.done||[]).length) s.started=Date.now();
 state.experiments[exp.key]=s;
 state.expFocus=exp.key;
 /* Remember the exact pathway name that opened this experiment. Without it the
    roadmap can only resolve a pathway from `saved` or the AI result, so a
    student who never saved the pathway would finish an experiment and find
    their verdict missing from the roadmap. */
 state.expPathway=state.expPathway||{};
 state.expPathway[exp.key]=name;
 try{trackExperimentOpened(exp.key);trackCareersExplored(name)}catch(e){}
 saveExp(); goTab("experiments");
 toast(`${exp.title} opened. One day at a time.`);
}
function completedExperiments(){return Object.values(state.experiments||{}).filter(s=>s&&s.enjoyment!==null&&s.enjoyment!==undefined).length}

function renderExperiments(){
 const grid=$("#expGrid"); if(!grid) return;
 const data=experimentData();
 const badge=$("#expBadgeLine");
 const doneCount=completedExperiments();
 if(badge) badge.innerHTML=`<span class="exp-stat"><b>${doneCount}</b> reflection${doneCount===1?"":"s"} recorded</span><span class="exp-stat"><b>${Object.keys(data||{}).length}</b> experiment families available</span><span class="exp-stat">Free tools only · do the work, then judge it honestly</span>`;
 if(!data){
  grid.innerHTML=`<div class="card"><h3>Experiments could not load</h3><p class="muted">The experiment library lives in <b>site-data.js</b>, which did not load. Add it as a script tag before app_scratch.js and reload.</p></div>`;
  return;
 }
 /* Pathways the student saved or was shown come first, so the
    experiments they actually care about are not buried. */
 const allKeys=Object.keys(data);
 const relevant=[];
 (state.saved||[]).forEach(n=>{const k=clusterForPathway(n);if(k&&!relevant.includes(k))relevant.push(k);});
 (state.aiResult?.pathways||[]).forEach(p=>{const k=clusterForPathway(p.name);if(k&&!relevant.includes(k))relevant.push(k);});
 const order=[...relevant,...allKeys.filter(k=>!relevant.includes(k))];
 if(state.expFocus&&order.includes(state.expFocus)) order.unshift(state.expFocus);

 grid.innerHTML=order.map(key=>{
  const e=data[key]; if(!e) return "";
  const s=expState(key);
  const done=s.done||[];
  const pct=Math.round(done.length/7*100);
  const isFocus=state.expFocus===key;
  const source=(state.saved||[]).find(n=>clusterForPathway(n)===key)||(state.aiResult?.pathways||[]).map(p=>p.name).find(n=>clusterForPathway(n)===key);
  const verdictText={yes:"I enjoyed the actual work",mixed:"I enjoyed some of it, not all",no:"I did not enjoy the actual work"};
  const verdictNext={yes:"Go deeper on this pathway — build a bigger project in the same direction.",mixed:"Useful information. A mixed result means explore a neighbouring pathway before committing.",no:"Genuinely valuable result. Ruling a direction out early is progress."};
  const answered=s.enjoyment!==null&&s.enjoyment!==undefined;
  /* Closing the loop: the verdict becomes a roadmap next step, not a dead end.
     Built with experimentChainLine/nextStepForExperiment so the plain-language
     verdict is identical here and in the roadmap. */
  const reflectAnswer=!answered
    ? `<p class="exp-ask">Did you enjoy the actual work?</p><div class="exp-enjoy"><button class="small-btn" onclick="setExpEnjoyment('${key}','yes')">Yes — I want more of this</button><button class="small-btn" onclick="setExpEnjoyment('${key}','mixed')">Some of it, not all</button><button class="small-btn" onclick="setExpEnjoyment('${key}','no')">No — I did not enjoy it</button></div>`
    : `<div class="exp-verdict ${escapeHtml(s.enjoyment)}"><b>Your answer:</b> ${escapeHtml(verdictText[s.enjoyment]||s.enjoyment)}<br><small class="muted">${escapeHtml(verdictNext[s.enjoyment]||"")}</small></div><p class="exp-chain-next">${escapeHtml(nextStepForExperiment({key,title:e.title}))}</p><div class="exp-enjoy"><button class="small-btn" onclick="setExpEnjoyment('${key}',null)">Change answer</button>${source?`<button class="small-btn" onclick="goTab('roadmaps')">↻ Update my roadmap</button>`:""}</div>`;
  return `<article class="exp-card${isFocus?" exp-focus":""}" id="exp-${key}">
   <header class="exp-head"><div><span class="tag">7-DAY EXPLORATION</span><h3>${escapeHtml(e.title)}</h3>${source?`<p class="muted exp-source">Suggested for your saved pathway: <b>${escapeHtml(source)}</b></p>`:""}</div><div class="exp-ring"><b>${done.length}/7</b><small>days</small></div></header>
   <div class="exp-progress"><i style="width:${pct}%"></i></div>
   <ol class="exp-days">${e.days.map(d=>`<li class="${done.includes(d.day)?"is-done":""}"><label><input type="checkbox" ${done.includes(d.day)?"checked":""} onchange="toggleExpDay('${key}',${d.day})"><span class="exp-day-num">Day ${d.day}</span><span class="exp-day-body"><b>${escapeHtml(d.focus)}</b>${escapeHtml(d.text)}</span></label></li>`).join("")}</ol>
   <p class="exp-tools"><b>You need:</b> ${e.tools.map(escapeHtml).join(" · ")}</p>
   <div class="exp-reflect"><b>The honest question</b><p>${escapeHtml(e.reflect)}</p>${reflectAnswer}</div>
   <div class="exp-notes"><label>What I actually learned<textarea class="open" placeholder="Write what you did, what surprised you, and what you would do differently..." oninput="saveExpNote('${key}',this.value)">${escapeHtml((state.expNotes&&state.expNotes[key])||"")}</textarea></label></div>
  </article>`;
 }).join("");
}
function saveExpNote(key,val){
 state.expNotes=state.expNotes||{}; state.expNotes[key]=val; saveState();
}

function showPage(id){$$(".page").forEach(x=>x.classList.remove("active"));$("#"+id)?.classList.add("active");window.scrollTo({top:0,behavior:"smooth"});$("#mobileNav").classList.remove("open")}
function openModal(id){
  if(id==="authModal"){openLogin();return;}
  $("#"+id)?.classList.remove("hidden");
}
function closeModal(id){
  if(id==="authModal"){
    $("#loginModal")?.classList.add("hidden");
    $("#signupModal")?.classList.add("hidden");
  }
  $("#"+id)?.classList.add("hidden");
}
function openLogin(){
  closeModal("signupModal");
  closeModal("authModal");
  openModal("loginModal");
  const emailInput=$("#loginForm input[name='email']");
  if(emailInput) setTimeout(()=>emailInput.focus(), 50);
}
function openSignup(){
  closeModal("loginModal");
  closeModal("authModal");
  if(typeof window.resetConsentGate==="function"){
    window.resetConsentGate();
  }
  openModal("signupModal");
  prefillSignupForm();
}
window.openLogin=openLogin;
window.openSignup=openSignup;

/* Remember who last used this browser to create an account.
   The name/email/phone/country/grade/age/school that were submitted are kept
   so that openSignup() can prefill the form on the next visit — making a
   second account on the same email a couple of clicks instead of retyping
   everything. The password is deliberately never stored. */
function lastSignupDetails(){
  try{return JSON.parse(localStorage.getItem("yp_last_signup_v3")||"null")}catch(e){return null}
}
function prefillSignupForm(){
  const form=document.getElementById("signupForm");
  if(!form)return;
  const remembered=lastSignupDetails();
  if(!remembered)return;
  Object.keys(remembered).forEach(key=>{
    const field=form.elements[key];
    if(field&&!field.value) field.value=remembered[key];
  });
  const emailField=form.elements.email;
  if(emailField&&emailField.value){
    emailField.setAttribute("data-remembered-email","1");
  }
}

function switchAuth(type){
  if(type==="signup") openSignup();
  else openLogin();
}
window.switchAuth=switchAuth;

// [data-page] is handled by the delegated listener below, so it covers
// elements rendered after load as well.
$("#hamb").onclick=()=>$("#mobileNav").classList.toggle("open");
$("#heroStart").onclick=()=>{if(requireLogin()){goTab("questionnaire")}};
$("#roadmapStart").onclick=()=>{if(requireLogin()){showPage("dashboard");goTab("roadmaps")}};
$$("[data-scroll]").forEach(b=>b.onclick=()=>document.querySelector(b.dataset.scroll)?.scrollIntoView({behavior:"smooth"}));
$("#loginBtn").onclick=()=>openLogin();
$("#signupBtn").onclick=()=>openSignup();
$$("[data-close]").forEach(b=>b.onclick=()=>closeModal(b.dataset.close));
$("#privacyBtn").onclick=$("#privacyFoot").onclick=()=>openModal("privacyModal");
// [data-scroll] targets are static in the markup, but delegate anyway so
// re-rendered sections keep working.
document.addEventListener('click',e=>{
 const s=e.target.closest('[data-scroll]');
 if(s){const t=document.querySelector(s.dataset.scroll);if(t)t.scrollIntoView({behavior:"smooth"})}
});

$$(".auth-tabs button, [data-auth]").forEach(btn=>{
  btn.onclick=(e)=>{
    e.preventDefault();
    const type=btn.dataset.auth || (btn.textContent.toLowerCase().includes("sign") ? "signup" : "login");
    switchAuth(type);
  };
});

function requireLogin(){if(!state.user){openLogin();toast("Log in or create an account to continue.");return false}showPage("dashboard");return true}
function goTab(name){
 if(!state.user)return;
 $$(".side").forEach(x=>x.classList.toggle("active",x.dataset.tab===name));
 $$(".tab").forEach(x=>x.classList.toggle("active",x.id==="tab-"+name));
 if(name==="questionnaire")renderQuestion();
 if(name==="analysis")renderAnalysis();
 if(name==="pathways")renderPathways();
 if(name==="compare")renderCompare();
 if(name==="education")renderEducation();
 if(name==="roadmaps")renderRoadmap();
 if(name==="experiments")renderExperiments();
 if(name==="feedback")renderEvidenceReadout();
 if(name==="saved")renderSaved();
 if(name==="history")renderHistory();
 if(name==="profile")loadProfile();
 if(name==="overview")renderOverview();
}
/* Delegated so buttons added later (e.g. the roadmap's "Explore pathways"
   CTA, or anything re-rendered) are wired too. Binding once at load missed
   every dynamically inserted control. */
document.addEventListener('click',e=>{
 const tabBtn=e.target.closest('[data-tab]');
 if(tabBtn){e.preventDefault();if(requireLogin())goTab(tabBtn.dataset.tab);return}
 const pageBtn=e.target.closest('[data-page]');
 if(pageBtn){e.preventDefault();showPage(pageBtn.dataset.page)}
});

function showAuthLoader(configOrTitle, subtitle, onComplete){
 const loader=$("#authLoader");
 const titleEl=$("#loaderTitle");
 const subEl=$("#loaderSub");
 const badgeEl=$("#loaderBadge");
 const stepsEl=$("#loaderSteps");
 const stepTextEl=$("#loaderStepText");
 const percentEl=$("#loaderPercent");
 const bar=$("#loaderBar");

 let options={};
 if(typeof configOrTitle==="object"&&configOrTitle!==null){
   options=configOrTitle;
 } else {
   options={
     title:configOrTitle,
     subtitle:subtitle,
     onComplete:onComplete,
     badge:"AUTHENTICATING",
     mode:"login"
   };
 }

 const mode=options.mode||"login";
 const title=options.title||(mode==="signup"?"Creating Your Account...":"Welcome Back!");
 const sub=options.subtitle||(mode==="signup"?"Configuring your exploration workspace...":"Restoring your student workspace & saved pathways...");
 const badge=options.badge||(mode==="signup"?"STUDENT REGISTRATION":"AUTHENTICATING SESSION");
 const cb=options.onComplete||(typeof subtitle==="function"?subtitle:onComplete);

 if(!loader){
   if(typeof cb==="function") cb();
   return;
 }

 if(titleEl) titleEl.textContent=title;
 if(subEl) subEl.textContent=sub;
 if(badgeEl){
   badgeEl.textContent=badge;
   badgeEl.style.background="";
   badgeEl.style.color="";
   badgeEl.style.borderColor="";
 }

 const stepsList=mode==="signup"?[
   {icon:"👤",title:"Creating student profile & credentials",note:"Configuring student workspace..."},
   {icon:"🧠",title:"Preparing your 20 questions",note:"Covering ten dimensions of interest..."},
   {icon:"🧭",title:"Calibrating your career pathways & roadmaps",note:"Preparing contextual education guides..."},
   {icon:"🚀",title:"Launching personalized student dashboard",note:"Personalized environment ready!"}
 ]:[
   {icon:"🔐",title:"Verifying student credentials & session",note:"Authenticating student credentials..."},
   {icon:"📝",title:"Loading questionnaire progress & AI signals",note:"Restoring pattern analysis engine..."},
   {icon:"❤️",title:"Syncing your pathways & saved notes",note:"Retrieving pathway notes & roadmaps..."},
   {icon:"📊",title:"Preparing student dashboard & radar map",note:"All systems synchronized!"}
 ];

 if(stepsEl){
   stepsEl.innerHTML=stepsList.map((st,idx)=>`
     <div class="loader-step-item pending" id="loaderStepItem${idx}">
       <div class="loader-step-left">
         <span class="loader-step-icon">${st.icon}</span>
         <span class="loader-step-title">${st.title}</span>
       </div>
       <span class="loader-step-state">○</span>
     </div>
   `).join("");
 }

 if(bar){
   bar.style.transition="none";
   bar.style.width="0%";
 }
 if(percentEl) percentEl.textContent="0%";
 if(stepTextEl) stepTextEl.textContent=stepsList[0].note;

 loader.classList.remove("hidden");

 const setStepState=(stepIdx,stateName,percent,note)=>{
   const item=document.getElementById(`loaderStepItem${stepIdx}`);
   if(item){
     item.className=`loader-step-item ${stateName}`;
     const stateIcon=item.querySelector(".loader-step-state");
     if(stateIcon){
       if(stateName==="pending") stateIcon.textContent="○";
       else if(stateName==="active") stateIcon.textContent="✦";
       else if(stateName==="done") stateIcon.textContent="✓";
     }
   }
   if(percentEl) percentEl.textContent=`${percent}%`;
   if(stepTextEl) stepTextEl.textContent=note;
   if(bar){
     bar.style.transition="width 0.38s cubic-bezier(0.2, 0.8, 0.2, 1)";
     bar.style.width=`${percent}%`;
   }
 };

 // Progress sequence
 setStepState(0,"active",18,stepsList[0].note);

 setTimeout(()=>{
   setStepState(0,"done",32,"Credentials verified ✓");
   setStepState(1,"active",48,stepsList[1].note);
 }, 420);

 setTimeout(()=>{
   setStepState(1,"done",68,"Questionnaire engine loaded ✓");
   setStepState(2,"active",80,stepsList[2].note);
 }, 880);

 setTimeout(()=>{
   setStepState(2,"done",92,"Pathways & roadmaps synced ✓");
   setStepState(3,"active",98,stepsList[3].note);
 }, 1320);

 setTimeout(()=>{
   setStepState(3,"done",100,"All systems ready! Launching...");
   if(badgeEl){
     badgeEl.textContent="READY ✦";
     badgeEl.style.background="#dcfce7";
     badgeEl.style.color="#15803d";
     badgeEl.style.borderColor="#bbf7d0";
   }
 }, 1700);

 setTimeout(()=>{
   loader.classList.add("hidden");
   if(badgeEl){
     badgeEl.style.background="";
     badgeEl.style.color="";
     badgeEl.style.borderColor="";
   }
   if(typeof cb==="function") cb();
 }, 2000);
}

$("#signupForm").onsubmit=async e=>{
 e.preventDefault();
 const d=Object.fromEntries(new FormData(e.target).entries());
 if(!d.password || d.password.length < 6){
   toast("Please choose a password with at least 6 characters.");
   return;
 }

 const payload = {
   name: d.name,
   email: d.email,
   password: d.password,
   phone: d.phone||"",
   country: d.country||"Philippines (+63)",
   grade: d.grade||"Grade 10",
   age: d.age||"",
   school: d.school||"",
   targetCountry: d.targetCountry||"Domestic / Home Country",
   budget: d.budget||"Full scholarship needed",
   goals: d.goals||"",
   role: "student"
 };

 let registeredUser = null;
 try {
   const res = await fetch('/api/auth/signup', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify(payload)
   });
   const resData = await res.json();
   if (!res.ok) {
     toast(resData.error || "Failed to create account.");
     if (res.status === 409) openLogin();
     return;
   }
   registeredUser = resData.user;
 } catch(err) {
   if(state.accounts && state.accounts[d.email]){
     toast("An account with this email already exists. Please log in.");
     openLogin();
     return;
   }
   registeredUser = { ...payload, createdAt: Date.now() };
 }

 state.accounts = state.accounts || {};
 state.accounts[registeredUser.email] = registeredUser;
 state.user = registeredUser;
 state.answers = {};
 newSession();
 saveState();
 closeModal("signupModal");
 closeModal("authModal");

 const firstName = registeredUser.name ? registeredUser.name.trim().split(" ")[0] : "Student";
 showAuthLoader({
   mode:"signup",
   badge:"ACCOUNT REGISTRATION",
   title:`Welcome to Your Path, ${firstName}! 🚀`,
   subtitle:"Preparing your 20 personalised questions and your workspace...",
   onComplete:()=>{
     updateUI();
     showPage("dashboard");
     goTab("overview");
     requestAnimationFrame(()=>{
       document.getElementById("journeyBoard")?.scrollIntoView({behavior:"smooth",block:"start"});
       document.getElementById("journeyQuestionnaire")?.classList.add("current");
     });
     toast(`Account created for ${registeredUser.name}! Welcome to Your Path.`);
   }
 });
};

$("#loginForm").onsubmit=async e=>{
 e.preventDefault();
 const d=Object.fromEntries(new FormData(e.target).entries());
 
 let loggedInUser = null;
 let fetchedProgress = null;

 try {
   const res = await fetch('/api/auth/login', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ email: d.email, password: d.password })
   });
   const resData = await res.json();
   if (!res.ok) {
     toast(resData.error || "Login failed.");
     return;
   }
   loggedInUser = resData.user;
   fetchedProgress = resData.progress;
 } catch(err) {
   if(state.accounts && state.accounts[d.email]){
     if(state.accounts[d.email].password===d.password){
       loggedInUser = state.accounts[d.email];
     } else {
       toast("Incorrect password for this account. Please try again.");
       return;
     }
   } else {
     const sessionUser=state.user;
     const sameUnregistered=sessionUser&&sessionUser.email===d.email&&sessionUser.password&&sessionUser.password===d.password;
     if(sameUnregistered){
       state.accounts=state.accounts||{};
       state.accounts[d.email]=sessionUser;
       loggedInUser = sessionUser;
     } else {
       toast("No account found for that email. Please sign up first.");
       openSignup();
       return;
     }
   }
 }

 state.user = loggedInUser;
 state.accounts = state.accounts || {};
 state.accounts[loggedInUser.email] = loggedInUser;

 if (fetchedProgress) {
   if (fetchedProgress.answers && Object.keys(fetchedProgress.answers).length > 0) {
     state.answers = fetchedProgress.answers;
   }
   if (fetchedProgress.saved && Array.isArray(fetchedProgress.saved)) {
     state.saved = fetchedProgress.saved;
   }
   if (fetchedProgress.savedNotes && typeof fetchedProgress.savedNotes === 'object') {
     state.savedNotes = fetchedProgress.savedNotes;
   }
   if (fetchedProgress.experiments && typeof fetchedProgress.experiments === 'object') {
     state.experiments = fetchedProgress.experiments;
   }
   if (fetchedProgress.session && fetchedProgress.session.ids) {
     state.session = fetchedProgress.session;
   }
   if (typeof fetchedProgress.qIndex === 'number') {
     state.qIndex = fetchedProgress.qIndex;
   }
 }

 ensureSession();
 saveState();
 closeModal("loginModal");
 closeModal("authModal");

 const firstName=state.user && state.user.name ? state.user.name.trim().split(" ")[0] : "there";
 showAuthLoader({
   mode:"login",
   badge:"SESSION AUTHENTICATED",
   title:`Welcome back, ${firstName}! 👋`,
   subtitle:"Loading your student profile, questionnaire answers & saved pathways...",
   onComplete:()=>{
     updateUI();
     showPage("dashboard");
     goTab("overview");
     toast(`Welcome back, ${state.user.name||"there"}!`);
   }
 });
};

const handleLogout=()=>{state.user=null;saveState();updateUI();showPage("home");toast("Logged out.")};
$("#logout").onclick=handleLogout;
const topLogout=$("#topLogout");
if(topLogout) topLogout.onclick=handleLogout;

const MOTIVATION_QUOTES = [
  {
    author: "Albert Einstein",
    role: "Theoretical Physicist · Nobel Laureate in Physics",
    avatar: "⚛️",
    field: "CURIOSITY & DISCOVERY",
    quote: "Imagination is more important than knowledge. For knowledge is limited, whereas imagination embraces the entire world, stimulating progress, giving birth to evolution.",
    takeaway: "Never be afraid to ask unorthodox questions. The greatest breakthroughs in science and career begin with playful curiosity rather than rote memorization."
  },
  {
    author: "Marie Curie",
    role: "Physicist & Chemist · 2x Nobel Prize Winner",
    avatar: "🔬",
    field: "PERSEVERANCE & SCIENCE",
    quote: "Nothing in life is to be feared, it is only to be understood. Now is the time to understand more, so that we may fear less.",
    takeaway: "Career uncertainty and tough exams can feel intimidating, but breaking them down into small, understandable experiments turns fear into confidence."
  },
  {
    author: "Steve Jobs",
    role: "Co-founder of Apple · Pioneer of Personal Computing",
    avatar: "💻",
    field: "PASSION & INNOVATION",
    quote: "The only way to do great work is to love what you do. If you haven't found it yet, keep looking. Don't settle.",
    takeaway: "Your Path is designed to help you explore multiple possibilities without forcing an early compromise. Keep testing until you find what genuinely fits you."
  },
  {
    author: "Maya Angelou",
    role: "Poet, Author & Civil Rights Champion",
    avatar: "✍️",
    field: "CREATIVITY & RESILIENCE",
    quote: "You can't use up creativity. The more you use, the more you have.",
    takeaway: "Creativity isn't a finite resource. Whether you write code, design experiences, or build communities, daily practice makes your creative instincts sharper."
  },
  {
    author: "Carl Sagan",
    role: "Astronomer, Planetary Scientist & Author",
    avatar: "🌌",
    field: "ASTRONOMY & WONDER",
    quote: "Somewhere, something incredible is waiting to be known.",
    takeaway: "The world has thousands of emerging disciplines that didn't exist 10 years ago. Stay curious and build real skills that open doors to the unknown."
  },
  {
    author: "Nelson Mandela",
    role: "Former President of South Africa & Nobel Peace Laureate",
    avatar: "🌍",
    field: "LEADERSHIP & EDUCATION",
    quote: "Education is the most powerful weapon which you can use to change the world.",
    takeaway: "Every subject you learn, every project you build, and every skill you practice gives you greater leverage to help your family and community."
  },
  {
    author: "Leonardo da Vinci",
    role: "Polymath, Artist, Engineer & Inventor",
    avatar: "🎨",
    field: "INTERDISCIPLINARY MASTERY",
    quote: "Learning never exhausts the mind.",
    takeaway: "You don't have to choose between art and science. The most innovative creators bridge design, technology, and human empathy together."
  },
  {
    author: "Richard Feynman",
    role: "Theoretical Physicist · Nobel Laureate & Educator",
    avatar: "⚡",
    field: "FIRST-PRINCIPLES THINKING",
    quote: "Study hard what interests you the most in the most undisciplined, irreverent and original manner possible.",
    takeaway: "True mastery comes from building things with your own hands and understanding why they work, not just memorizing answers for tests."
  },
  {
    author: "Malala Yousafzai",
    role: "Education Activist & Nobel Peace Prize Laureate",
    avatar: "📚",
    field: "PURPOSE & ADVOCACY",
    quote: "One child, one teacher, one book, one pen can change the world.",
    takeaway: "Your voice and dedication matter regardless of your starting grade or background. Take pride in your educational journey."
  },
  {
    author: "Katherine Johnson",
    role: "NASA Mathematician & Space Exploration Pioneer",
    avatar: "🚀",
    field: "MATHEMATICS & EXCELLENCE",
    quote: "Like what you do, and then you will do your best.",
    takeaway: "Focus on finding the joy in problem solving. When you enjoy the process of learning, high performance follows naturally."
  },
  {
    author: "Alan Turing",
    role: "Father of Modern Computing & Artificial Intelligence",
    avatar: "🤖",
    field: "COMPUTING & LOGIC",
    quote: "Sometimes it is the people no one can imagine anything of who do the things no one can imagine.",
    takeaway: "Don't let anyone pigeonhole your potential based on traditional molds. Unconventional thinkers often build the future."
  },
  {
    author: "Jane Goodall",
    role: "Primatologist, Anthropologist & Conservationist",
    avatar: "🌿",
    field: "ENVIRONMENT & IMPACT",
    quote: "What you do makes a difference, and you have to decide what kind of difference you want to make.",
    takeaway: "Every career choice carries real impact on people, animals, and the planet. Choose pathways that align with your deepest values."
  }
];

let currentQuoteIndex = 0;

function openMotivationModal(idx){
  if(typeof idx === "number"){
    currentQuoteIndex = idx % MOTIVATION_QUOTES.length;
  }
  renderMotivationModal();
  openModal("motivationModal");
}
window.openMotivationModal = openMotivationModal;

function renderMotivationModal(){
  const item = MOTIVATION_QUOTES[currentQuoteIndex];
  if(!item) return;
  const quoteEl = $("#motQuote");
  const authorEl = $("#motAuthor");
  const roleEl = $("#motRole");
  const avatarEl = $("#motAvatar");
  const fieldEl = $("#motField");
  const takeawayEl = $("#motTakeawayText");

  if(quoteEl) quoteEl.textContent = `“${item.quote}”`;
  if(authorEl) authorEl.textContent = item.author;
  if(roleEl) roleEl.textContent = item.role;
  if(avatarEl) avatarEl.textContent = item.avatar;
  if(fieldEl) fieldEl.textContent = item.field;
  if(takeawayEl) takeawayEl.textContent = item.takeaway;
}

function nextMotivationQuote(){
  currentQuoteIndex = (currentQuoteIndex + 1) % MOTIVATION_QUOTES.length;
  const quoteEl = $("#motQuote");
  if(quoteEl){
    quoteEl.style.opacity = "0";
    quoteEl.style.transform = "translateY(8px)";
    setTimeout(()=>{
      renderMotivationModal();
      quoteEl.style.opacity = "1";
      quoteEl.style.transform = "none";
    }, 150);
  } else {
    renderMotivationModal();
  }
  renderHeaderQuote();
}
window.nextMotivationQuote = nextMotivationQuote;

function copyMotivationQuote(){
  const item = MOTIVATION_QUOTES[currentQuoteIndex];
  if(!item) return;
  const text = `“${item.quote}” — ${item.author} (${item.role})`;
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).then(()=>{
      toast("Quote copied to clipboard! 📋");
    }).catch(()=>{
      toast(`Copied quote from ${item.author}`);
    });
  } else {
    toast(`“${item.quote}” — ${item.author}`);
  }
}
window.copyMotivationQuote = copyMotivationQuote;

function renderHeaderQuote(){
  const item = MOTIVATION_QUOTES[currentQuoteIndex];
  const qText = $("#headerQuoteText");
  const qAuth = $("#headerQuoteAuthor");
  if(qText && item) qText.textContent = `“${item.quote}”`;
  if(qAuth && item) qAuth.textContent = `${item.author} · ${item.role.split("·")[0].trim()} ✦`;
}

function updateUI(){
 const loggedIn=Boolean(state.user);
 const loginBtn=$("#loginBtn");
 const signupBtn=$("#signupBtn");
 const userMenu=$("#userMenu");
 const userGreeting=$("#userGreeting");
 if(loginBtn) loginBtn.style.display=loggedIn?"none":"";
 if(signupBtn) signupBtn.style.display=loggedIn?"none":"";
 if(userMenu) userMenu.style.display=loggedIn?"flex":"none";
 if(userGreeting) userGreeting.textContent=loggedIn?`Hi, ${state.user?.name||"Student"}`:"";

 const startingMenu=$("#startingMenu");
 const activeBanner=$("#activeSessionBanner");
 const activeGreeting=$("#activeSessionGreeting");
 if(startingMenu) startingMenu.classList.toggle("hidden", loggedIn);
 if(activeBanner) activeBanner.classList.toggle("hidden", !loggedIn);
 if(activeGreeting) activeGreeting.textContent=`Welcome back, ${state.user?.name||"Student"}! ✦`;

 $("#welcome").textContent=`Welcome back, ${state.user?.name||"there"}!`;
 $("#savedCount").textContent=state.saved.length;
 const sideSaved=document.getElementById("sideSavedBadge");
 if(sideSaved) sideSaved.textContent=state.saved.length;
 const historyCount=$("#historyCount");
 if(historyCount) historyCount.textContent=(state.history||[]).length;
 const sideHistory=document.getElementById("sideHistoryBadge");
 if(sideHistory) sideHistory.textContent=(state.history||[]).length;
 const sideExp=document.getElementById("sideExpBadge");
 if(sideExp) sideExp.textContent=completedExperiments();
 const answered=Object.keys(state.answers).length;
 $("#completion").textContent=`${Math.round(answered/20*100)}%`;
 renderOverview();renderPublic();
 renderInterestMap();
 renderJourney();
 renderHeaderQuote();
}

/* Hoisted function declarations.
   TDZ guard: these are defined as `function` declarations AFTER this point in the
   file but BEFORE the final init call, so hoisting makes them available here.
   Assigning bare `renderRoadmap = ...` (without const/let) keeps them as
   properties of globalThis, which is what the inline onclick handlers rely on. */
function renderRoadmap(){return renderRoadmapImpl()}

function renderJourney(){
 const user=state.user||{};
 const qs=sessionQuestions();
 const answered=qs.filter(q=>state.answers[q.id]!=null&&state.answers[q.id]!==""&&!(Array.isArray(state.answers[q.id])&&state.answers[q.id].length===0)).length;
 const complete=answered===20;
 const profile=document.getElementById("journeyProfileText");
 const qTitle=document.getElementById("journeyQTitle");
 const qText=document.getElementById("journeyQText");
 const aTitle=document.getElementById("journeyATitle");
 const aText=document.getElementById("journeyAText");
 const action=document.getElementById("journeyActionText");
 if(profile) profile.textContent=`${user.name||"Student"} • ${user.grade||"Grade not set"} • Account created`;
 if(qTitle) qTitle.textContent=complete?"20 / 20 completed":`${answered} / 20 answered`;
 if(qText) qText.textContent=complete?"Questionnaire complete. Your interest map and analysis are ready.":"Explore your genuine interests, preferences and motivations.";
 if(aTitle) aTitle.textContent=complete?"Analysis ready":"Waiting for answers";
 if(aText) aText.textContent=complete?"Your responses can now be reviewed for patterns, contradictions and uncertainty.":"Complete the questionnaire before interpreting your responses.";
 if(action) action.textContent=complete?"Choose one small experiment from your roadmap and track what you learn.":"Start by answering the questionnaire, then choose an action based on what you discover.";
 const ids=["journeyQuestionnaire","journeyAnalysis","journeyPathways","journeyRoadmap","journeyAction"];
 ids.forEach(id=>document.getElementById(id)?.classList.remove("current","done"));
 const jq=document.getElementById("journeyQuestionnaire");
 if(complete) jq?.classList.add("done"); else jq?.classList.add("current");
 if(complete){["journeyAnalysis","journeyPathways"].forEach(id=>document.getElementById(id)?.classList.add("current"));}
}

function renderOverview(){
 const p=pathways.slice(0,4);
 $("#topPaths").innerHTML=p.map(x=>`<div class="path-mini"><span class="path-icon">${x.icon}</span><span><b>${x.name}</b><small>${x.tag}</small></span><button class="link-inline" style="font-size:11px" onclick="viewPathwayEd('${escapeHtml(x.name)}')">Ed Guide →</button></div>`).join("");
}

function renderInterestMap(){
 const fill=$("#radarFill"), status=$("#interestStatus"), bars=$("#interestBars");
 if(!fill||!status||!bars)return;
 const qs=sessionQuestions();
 const answeredQs=qs.filter(q=>state.answers[q.id]!=null&&state.answers[q.id]!==""&&!(Array.isArray(state.answers[q.id])&&state.answers[q.id].every(v=>v==="")));
 const complete=answeredQs.length===20;
 if(!complete){
   fill.classList.remove("ready");
   status.textContent=`${answeredQs.length}/20 answered`;
   bars.innerHTML="<div class=\"muted\">Finish all 20 questions to reveal your interest profile.</div>";
   return;
 }
 const axes=["Analytical","Creative","People","Learning","Curiosity"];
 const scores=Object.fromEntries(axes.map(a=>[a,1]));
 const axisByCategory={
   interests:{Curiosity:3,Creative:1}, subjects:{Learning:2,Analytical:1}, problem:{Analytical:4,Curiosity:1},
   creativity:{Creative:5}, communication:{People:4,Creative:1}, leadership:{People:5}, motivation:{Learning:2,People:1},
   workstyle:{Analytical:2,Learning:2}, learning:{Learning:5,Curiosity:2}, pressure:{People:1,Curiosity:1}, values:{Curiosity:2,Learning:1}
 };
 const addText=(text)=>{
   const t=String(text||"").toLowerCase();
   const hits={
     analytical:["math","data","logic","solve","analysis","code","program","system","evidence","research","pattern","debug","science","finance","statistics"],
     creative:["design","create","art","music","story","write","video","build","invent","creative","visual","animation","game"],
     people:["people","help","teach","team","lead","communicate","community","listen","friend","customer","counsel","psychology","social"],
     learning:["learn","study","understand","read","course","practice","skill","knowledge","curious","explore","reading","theory"],
     curiosity:["why","how","discover","investigate","experiment","question","research","explore","new","curious","nature","future"]
   };
   for(const [axis,words] of Object.entries(hits)){
     const n=words.reduce((a,w)=>a+(t.includes(w)?1:0),0);
     scores[axis]+=Math.min(n,3);
   }
 };
 answeredQs.forEach(q=>{
   const base=axisByCategory[q.category]||{};
   Object.entries(base).forEach(([axis,val])=>scores[axis]+=val);
   const val=state.answers[q.id];
   addText(Array.isArray(val)?val.join(" "):val);
   if(q.type==="scale" && Number(val)){
     const n=Number(val);
     scores.Learning+=n*.25;scores.Curiosity+=n*.25;
   }
 });
 const max=Math.max(...Object.values(scores));
 const normalized=Object.fromEntries(axes.map(a=>[a,Math.max(28,Math.round(scores[a]/max*100))]));
 const points=[normalized.Analytical,normalized.Creative,normalized.People,normalized.Learning,normalized.Curiosity];
 const cx=50,cy=50,r=45;
 const coords=points.map((v,i)=>{const angle=(-90+i*72)*Math.PI/180;const rr=r*(v/100);return `${(cx+Math.cos(angle)*rr).toFixed(1)}% ${(cy+Math.sin(angle)*rr).toFixed(1)}%`;});
 fill.style.clipPath=`polygon(${coords.join(",")})`;
 fill.classList.remove("ready");requestAnimationFrame(()=>fill.classList.add("ready"));
 status.textContent="Updated from your 20 answers";
 bars.innerHTML=axes.map((a,i)=>`<div class="interest-bar"><span>${a}</span><div class="interest-track"><i style="width:${normalized[a]}%"></i></div><b>${normalized[a]}</b></div>`).join("");
}

const pathways=[
{
 name:"Data Science & Analytics",
 icon:"📊",
 tag:"Analytical + curious",
 img:"https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80",
 reason:"Strong alignment if you enjoy uncovering patterns in messy data, quantitative reasoning, and turning questions into structured analysis.",
 skills:"Statistics, Python/R, SQL, Data Visualization, Problem Solving",
 edu:"BS Computer Science, BS Data Science, BS Statistics, BS Applied Math",
 work:"Focused analytical problem solving + stakeholder collaboration",
 challenge:"Handling noisy real-world data, abstract math, and prolonged debugging cycles",
 alt:"Quantitative Economics, Business Intelligence, Machine Learning",
 experiment:"Download a free dataset on Kaggle (e.g. World Happiness or sports stats) and summarize 3 key insights in Google Sheets or Python.",
 educationGuide:{
   degrees:"BS Computer Science, BS Data Science, BS Statistics, BS Applied Mathematics",
   universities:{
     ph:"University of the Philippines Diliman (BS Stat / CS), De La Salle University (BS Data Science), Ateneo de Manila (BS MIS / CS), UST",
     us:"UC Berkeley, MIT, Carnegie Mellon University, Stanford, University of Washington",
     uk:"University College London (UCL), University of Edinburgh, Imperial College London, Warwick",
     global:"National University of Singapore (NUS), University of Toronto (Canada), IIT Bombay (India), ETH Zurich",
     india:"Indian Statistical Institute (Kolkata / Bengaluru / Chennai), IIT Bombay / Delhi / Madras (Minor in Data Science), Chennai Mathematical Institute, University of Delhi (Statistics)"
   },
   admission:"Strong STEM background (Calculus, Probability, Algebra), solid GPA (85%+ / 3.2+), logical problem-solving aptitude.",
   tests:"Philippines: UPCAT, DCAT, ACET, USTET; India: JEE Main (for B.Tech Data Science / AI at IIITs and NITs), ISI Admission Test (B.Stat / B.Math), CUET-UG (for BSc Statistics at central universities); International: SAT/ACT (Math 700+), IELTS (6.5+) / TOEFL (90+).",
   scholarships:"Philippines: DOST-SEI Merit & RA 7687 Priority STEM, CHED CoE Grants, University Academic Excellence Scholarships. India: INSPIRE-SHE (₹80,000/yr, DST), National Scholarship Portal (NSP) merit schemes, IIT / NIT institute merit-cum-means aid, Reliance Foundation UG Scholarships.",
   indiaRoutes:[
     {title:"B.Tech / BS Data Science or Statistics via JEE Main",desc:"Four-year technical degree at an IIIT, NIT or state university. JEE Main is the standard entry gate; a strong Class 12 board score can also qualify you for some state counselling rounds."},
     {title:"B.Stat / B.Math at the Indian Statistical Institute",desc:"India's most research-oriented statistics and mathematics route, entered through the ISI Admission Test rather than JEE. Small cohort, very strong theoretical grounding."},
     {title:"BSc Statistics / Mathematics via CUET-UG",desc:"Three-year degree at a central or state university. Lower entry barrier than IIT/ISI, and a common springboard to an MSc or an analytics job."},
     {title:"IIIT / NSDC Data Analyst Certification",desc:"Vocational and short-course route (NSDC / NIELIT certified) in SQL, Python and dashboarding, aimed at junior analyst roles without a full degree."}
   ],
   timeline:"Grade 11: Master math fundamentals & basic Python; Grade 12 (Aug–Dec): University entrance tests; (Jan–Mar): Scholarship filings; (Apr–Jun): Enrollment decisions.",
   routes:[
     {title:"4-Year University Degree",desc:"Rigorous foundation in mathematics, algorithm design, statistics, and campus recruitment pipelines."},
     {title:"Polytechnic / Associate Diploma",desc:"Applied 2-year diploma in Database Management or Information Systems with lower tuition costs."},
     {title:"Intensive Data Bootcamps",desc:"12-24 week career transition bootcamps focused on SQL, Tableau, and Python project portfolios."},
     {title:"Self-Taught & Kaggle Portfolio",desc:"Free open resources (CS50, Kaggle micro-courses), published GitHub analysis repositories, and community competitions."}
   ]
 }
},
{
 name:"Psychology & Behaviour",
 icon:"🧠",
 tag:"People + research",
 img:"https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80",
 reason:"Fits students drawn to understanding human motivations, empathy-driven problem solving, and evidence-based behavioral research.",
 skills:"Research Methods, Data Analysis, Empathy, Active Listening, Scientific Writing",
 edu:"BS/BA Psychology, BS Behavioral Science, BS Cognitive Science",
 work:"People-facing consultation + structured research and case analysis",
 challenge:"Specialist clinical and consulting roles require graduate degrees or board licensing",
 alt:"UX Research, Human Resources, Education, Behavioral Economics",
 experiment:"Keep an observational study log for 5 days tracking how physical lighting and study music affect your focus level.",
 educationGuide:{
   degrees:"BS Psychology, BA Psychology, BS Behavioral Sciences, BS Cognitive Science",
   universities:{
     ph:"UP Diliman, University of Santo Tomas (Center of Excellence), DLSU Manila, Ateneo de Manila",
     us:"Stanford, Harvard, UCLA, Yale, University of Michigan Ann Arbor",
     uk:"Oxford, Cambridge, UCL, King's College London, Edinburgh",
     global:"University of Melbourne (Australia), McGill University (Canada), NUS (Singapore)",
     india:"University of Delhi (Psychology), TISS Mumbai / Delhi, Christ University Bengaluru, Ashoka University (Psychology), Fergusson College Pune"
   },
   admission:"HUMSS, STEM, or General Academic Strand; reading comprehension, statistics foundation, strong interpersonal interest.",
   tests:"Philippines: UPCAT, ACET, DCAT, USTET; India: CUET-UG (BSc / BA Psychology at Delhi University and most central universities), TISS-BAT (TISS BA Social Sciences), Christ University Entrance Test, Ashoka Aptitude Assessment; International: SAT/ACT, AP Psychology, IELTS/TOEFL.",
   scholarships:"Philippines: CHED Priority Programs, DOST-SEI (for BS Psych STEM tracks), University Institutional Aid. India: INSPIRE-SHE (science streams), NSP Post-Matric Scholarships, TISS Financial Aid, university merit waivers and state e-district schemes.",
   indiaRoutes:[
     {title:"BA / BSc Psychology via CUET-UG",desc:"The standard three-year route at a central or state university. Check whether the course is a BA or BSc — the BSc version is more statistics-heavy and better for research roles."},
     {title:"TISS BA Social Sciences (5-year integrated)",desc:"Entered through TISS-BAT. A strong social-science foundation designed for research and policy work rather than clinical practice."},
     {title:"BA Psychology + MA Clinical Psychology (RCI-recognised)",desc:"Clinical practice in India requires a postgraduate degree from an RCI-recognised programme. Plan the full route early — the bachelor's alone does not license you."},
     {title:"Certificate / Diploma in Counselling Skills",desc:"Short vocational route for community support and helpline work. Useful experience, but not a licence to practise as a psychologist."}
   ],
   timeline:"Grade 11: Volunteer in peer counseling or community projects; Grade 12 Fall: University admissions; Spring: Scholarship evaluations.",
   routes:[
     {title:"4-Year University Degree",desc:"Comprehensive training in experimental psychology, abnormal psychology, and psychometrics."},
     {title:"Applied Social Services Diploma",desc:"Practical 2-year community guidance and counseling support diplomas."},
     {title:"UX Research Specialization",desc:"Transition into digital product research by applying psychological testing methods to software interfaces."},
     {title:"Peer Support & Community Track",desc:"Hands-on NGO advocacy, mental wellness coaching, and community organizing apprenticeships."}
   ]
 }
},
{
 name:"UX / Product Design",
 icon:"🎨",
 tag:"Creative + problem solving",
 img:"https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=600&q=80",
 reason:"Ideal if you enjoy understanding user frustrations, sketching solutions, and designing intuitive digital and physical experiences.",
 skills:"Figma, User Research, Wireframing, Interaction Design, Visual Hierarchy",
 edu:"BS Human-Computer Interaction, BS Information Design, BFA Digital Media, BS CS",
 work:"Highly collaborative design critiques + iterative prototyping with engineering teams",
 challenge:"Handling continuous feedback, subjective aesthetic debates, and rapid design changes",
 alt:"Product Management, UX Research, Brand Strategy, Industrial Design",
 experiment:"Choose an app you use daily. Redesign 2 screens in Figma or pencil sketch to make its most confusing feature simpler.",
 educationGuide:{
   degrees:"BS Human-Computer Interaction (HCI), BS Information Design, BFA Multimedia Arts",
   universities:{
     ph:"Ateneo de Manila (BS Information Design), De La Salle-CSB (Multimedia Arts / Interaction), UP Diliman (Fine Arts / CS)",
     us:"Carnegie Mellon (HCI), University of Washington (HCDE), Stanford d.school, Georgia Tech",
     uk:"Royal College of Art, Loughborough University, Brunel University, UCL",
     global:"TU Delft (Netherlands), Aalto University (Finland), NTU (Singapore)",
     india:"National Institute of Design (NID) Ahmedabad / Bengaluru / Gandhinagar, IIT Bombay (IDC School of Design), Srishti Manipal Bengaluru, MIT Institute of Design Pune, Pearl Academy"
   },
   admission:"Creative portfolio, digital literacy, demonstrated empathy for user problems, design aptitude.",
   tests:"Philippines: University creative aptitude exam & portfolio evaluation; general college entrance exams. India: UCEED (for IIT and IIIT design programmes), NID DAT (National Institute of Design), NIFT Entrance Exam (for design-adjacent programmes), UID / MITID studio tests; portfolio review at every stage.",
   scholarships:"Philippines: Design Talent Scholarships, Adobe Creative Grants, University Creative Merit Awards. India: NSP Post-Matric Scholarships, NID / NIFT institute fee waivers, Aditya Birla and Sitaram Jindal Foundation scholarships, state e-district schemes.",
   indiaRoutes:[
     {title:"B.Des via UCEED (IIT / IIIT)",desc:"Four-year Bachelor of Design at an IIT or IIIT through the UCEED exam. Strongest technical-design crossover if you also like building."},
     {title:"B.Des via NID DAT",desc:"India's flagship design institute route, entered through the Design Aptitude Test plus a studio and portfolio round at the National Institute of Design."},
     {title:"B.Des / BA Design at a private design school",desc:"Srishti, MITID, Pearl and similar institutes run their own portfolio-based admissions. More expensive, and programme quality varies — check studio facilities and faculty first."},
     {title:"Self-taught UX portfolio + certification",desc:"Short courses (Google UX via Coursera, local bootcamps) plus a public portfolio. India's product companies do interview on portfolio work, not degree name."}
   ],
   timeline:"Grade 11: Build 2-3 case studies in Figma; Grade 12 (Fall): Submit portfolio & university applications; (Spring): Studio interviews.",
   routes:[
     {title:"4-Year Design / HCI Degree",desc:"In-depth grounding in design theory, ergonomics, cognitive ergonomics, and design systems."},
     {title:"Digital Media Vocational Diploma",desc:"2-year intensive technical training in UI assets, motion graphics, and front-end layout."},
     {title:"UX Career Bootcamp",desc:"12-16 week portfolio-focused program building live client case studies."},
     {title:"Self-Taught Portfolio Track",desc:"Free Figma tutorials, daily UI challenges, open-source redesigns, and junior freelance gigs."}
   ]
 }
},
{
 name:"Environmental Science",
 icon:"🌿",
 tag:"Science + impact",
 img:"https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=600&q=80",
 reason:"Natural fit if you are passionate about ecological systems, climate resilience, biodiversity, and outdoor/laboratory investigations.",
 skills:"Geospatial Mapping (GIS), Field Sampling, Environmental Chemistry, Policy Analysis",
 edu:"BS Environmental Science, BS Marine Biology, BS Forestry, BS Geoscience",
 work:"Fieldwork + laboratory data analysis + policy advocacy",
 challenge:"Balancing field research constraints with funding, weather conditions, and policy inertia",
 alt:"Conservation Biology, Renewable Energy, Agricultural Science, Sustainability Consulting",
 experiment:"Conduct a 7-day audit of household waste and draft an actionable reduction plan with estimated kilogram metrics.",
 educationGuide:{
   degrees:"BS Environmental Science, BS Marine Biology, BS Forestry, BS Geoscience",
   universities:{
     ph:"UP Los Baños (Top Forestry & Environmental Science), UP Diliman, Ateneo (BS ES), Silliman University",
     us:"UC Berkeley, Stanford (Doerr School), UC Davis, University of Colorado Boulder",
     uk:"Imperial College London, Oxford, University of Edinburgh, East Anglia",
     global:"Wageningen University (Netherlands), UBC (Canada), Australian National University",
     india:"Indian Institute of Science Education and Research (IISER) Pune / Mohali, TERI School of Advanced Studies New Delhi, Fergusson College Pune, University of Delhi (Environmental Science), IIT Kanpur (Earth Sciences)"
   },
   admission:"STEM Strand; strong high school Biology, Chemistry, and Earth Science foundation.",
   tests:"Philippines: UPCAT, DOST-SEI Examination, SAT Subject Tests / AP Environmental Science. India: CUET-UG (BSc Environmental Science), IISER Aptitude Test (IAT), JEE Main / Advanced for B.Tech Environmental Engineering, ICAR AIEEA for agriculture-linked programmes.",
   scholarships:"Philippines: DOST-SEI Priority STEM (RA 7687), Global Environment Facility Grants, WWF Youth Fellowships. India: INSPIRE-SHE (DST), NSP Post-Matric Scholarships, IISER merit scholarships, TERI SAS aid, state e-district schemes.",
   indiaRoutes:[
     {title:"BS-MS dual degree at an IISER via IAT",desc:"Five-year science research programme combining a bachelor's and master's, with a strong research thesis. India's most research-oriented science route outside engineering."},
     {title:"BSc Environmental Science via CUET-UG",desc:"Three-year degree at a central or state university, then an MSc in Environmental Science, Ecology or Climate Studies."},
     {title:"B.Tech Environmental / Civil Engineering via JEE",desc:"Engineering route into water, sanitation, pollution control and environmental impact assessment work."},
     {title:"Forest Ranger / IFS via state and UPSC exams",desc:"Government route into field conservation and forest management. Competitive and exam-driven, but a direct path to fieldwork responsibility."}
   ],
   timeline:"Grade 11: Science fair investigation projects; Grade 12 (Fall): DOST exam & college admissions; (Spring): Scholarship confirmations.",
   routes:[
     {title:"4-Year Science Degree",desc:"Deep scientific preparation for environmental impact assessments, research labs, and policy careers."},
     {title:"Environmental Tech Diploma",desc:"Vocational certification in water quality testing, forest monitoring, and GIS technician work."},
     {title:"Field Conservation Track",desc:"Apprenticeships and direct field station experience with marine protected areas and wildlife reserves."},
     {title:"Sustainability Auditing Track",desc:"Corporate ESG and sustainability reporting certifications (GRI / Carbon Accounting)."}
   ]
 }
},
{
 name:"Software Engineering",
 icon:"💻",
 tag:"Logical + builder",
 img:"https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=600&q=80",
 reason:"A high-impact direction if you enjoy constructing software systems, technical problem solving, debugging, and continuous learning.",
 skills:"Programming (JS/Python/Java), Data Structures, Git, API Design, System Architecture",
 edu:"BS Computer Science, BS Software Engineering, BS Computer Engineering",
 work:"Focused coding sessions + agile team sprints and architecture discussions",
 challenge:"Rapid technological shifts, intricate debugging sessions, and high cognitive load",
 alt:"Cybersecurity, Cloud Architecture, DevOps, Game Development",
 experiment:"Build and publish a personal portfolio website or interactive calculator using HTML/CSS/JS on GitHub Pages.",
 educationGuide:{
   degrees:"BS Computer Science, BS Software Engineering, BS Computer Engineering, BS IT",
   universities:{
     ph:"UP Diliman, De La Salle University, Mapúa University, Ateneo de Manila, UST",
     us:"MIT, Stanford, Carnegie Mellon University, UC Berkeley, UIUC",
     uk:"Cambridge, Oxford, Imperial College London, University of Manchester",
     global:"NUS (Singapore), University of Waterloo (Canada), ETH Zurich, Tsinghua",
     india:"IIT Bombay / Delhi / Madras (Computer Science), IIIT Hyderabad, BITS Pilani, NIT Trichy, VIT Vellore"
   },
   admission:"STEM track; high grade in Mathematics, logical reasoning, and algorithmic enthusiasm.",
   tests:"Philippines: UPCAT, DCAT, ACET; International: SAT (Math 750+), AP Computer Science A, IELTS/TOEFL. India: JEE Main (screening) then JEE Advanced (for the IITs), BITSAT (BITS Pilani), VITEEE, IIIT Hyderabad UGEE for the dual-degree research programme.",
   scholarships:"Philippines: DOST-SEI Merit Scholarship, Google Student Fellowships, Mapúa Tech Excellence Grants. India: INSPIRE-SHE (DST), NSP Post-Matric Scholarships, IIT / NIT merit-cum-means aid, BITS merit scholarships, Reliance Foundation UG Scholarships.",
   indiaRoutes:[
     {title:"B.Tech Computer Science via JEE Advanced",desc:"The IIT route. Highly competitive and effectively a two-year exam-preparation commitment — plan for it deliberately rather than as a fallback."},
     {title:"B.Tech at an NIT / IIIT / BITS via JEE Main or BITSAT",desc:"Strong technical degrees with meaningfully lower entry cut-offs than the top IITs, and solid placement outcomes."},
     {title:"BCA then MCA",desc:"Three-year Bachelor of Computer Applications followed by a master's. A common and legitimate route when the engineering entrance exams do not work out."},
     {title:"Self-taught development + open-source portfolio",desc:"Free curricula (NPTEL, freeCodeCamp, CS50) plus public GitHub work. Indian product companies do hire on demonstrated skill, though some large employers still screen on degree."}
   ],
   timeline:"Grade 11: Build personal GitHub repositories; Grade 12 (Fall): University entrance tests & DOST filing; (Spring): Tech scholarships.",
   routes:[
     {title:"4-Year BS Computer Science",desc:"Complete algorithmic foundations, operating systems, compiler theory, and on-campus career fairs."},
     {title:"2-Year Associate / TESDA NC III",desc:"Technical programming and database maintenance certificate with fast workforce readiness."},
     {title:"Full-Stack Web Bootcamp",desc:"16-week intensive software development bootcamp focusing on modern React/Node stacks."},
     {title:"Open-Source & Apprenticeship",desc:"Direct contributions to open-source software, freeCodeCamp, and junior developer apprenticeships."}
   ]
 }
},
{
 name:"Cybersecurity",
 icon:"🛡️",
 tag:"Systems + investigation",
 img:"https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=600&q=80",
 reason:"Explore this if you are energized by protecting digital assets, investigating attack vectors, networks, and puzzle-like vulnerabilities.",
 skills:"Network Protocols, Linux, Penetration Testing, Threat Intelligence, Cryptography",
 edu:"BS Cybersecurity, BS Information Security, BS Computer Science (Security)",
 work:"Independent vulnerability analysis + high-stakes incident response",
 challenge:"Adversaries constantly adapt; requires meticulous documentation and high stress tolerance",
 alt:"Cloud Security, Network Administration, Digital Forensics, Systems Engineering",
 experiment:"Complete the first 3 challenge levels of the Bandit Linux security wargame on OverTheWire.org.",
 educationGuide:{
   degrees:"BS Cybersecurity, BS Information Security, BS Computer Science",
   universities:{
     ph:"Mapúa University, FEU Tech, DLSU Manila, CIIT College of Arts and Technology",
     us:"Purdue University, Carnegie Mellon, Georgia Tech, University of Maryland",
     uk:"Royal Holloway University of London, Warwick, King's College London",
     global:"Edith Cowan (Australia), University of Toronto, SUTD (Singapore)",
     india:"IIT Kanpur / Madras (Cybersecurity track), IIIT Delhi (Computer Science and Engineering with security focus), Amrita Vishwa Vidyapeetham, VIT Vellore, SRM Institute"
   },
   admission:"STEM/ICT background, basic networking familiarity, high ethical standard, computer literacy.",
   tests:"Philippines: College admissions exams; preparatory knowledge for CompTIA Security+. India: JEE Main / Advanced (for IIT and NIT computer engineering security tracks), VITEEE, SRMJEEE; industry certifications (CompTIA Security+, CEH) matter more than the exam once you are in.",
   scholarships:"Philippines: DOST Priority Tech Grants, (ISC)² Cybersecurity Undergraduate Aid, SANS CyberTalent. India: INSPIRE-SHE (DST), NSP Post-Matric Scholarships, IIT / NIT merit-cum-means aid, (ISC)² and SANS diversity scholarship schemes.",
   indiaRoutes:[
     {title:"B.Tech Computer Science / CSE (Security) via JEE",desc:"Technical degree at an IIT, NIT, IIIT or private university with an information-security specialisation."},
     {title:"BCA / BSc Computer Science + certifications",desc:"A general computing degree supplemented with CompTIA Security+, CEH or OSCP. Indian employers in this field lean heavily on certifications."},
     {title:"NIELIT / NSDC Cyber Security certification",desc:"Government-recognised vocational certification (NIELIT CHM-O, Certified Cyber Security courses) aimed at technician and SOC analyst roles."},
     {title:"CTF and bug-bounty track",desc:"Self-directed competitive practice through Indian CTF teams and bug-bounty programmes. Public, provable skill that some employers accept in place of a specialist degree."}
   ],
   timeline:"Grade 11: Complete introductory TryHackMe rooms; Grade 12 (Fall): University exams; (Spring): Lab scholarships.",
   routes:[
     {title:"4-Year Degree in Cybersecurity",desc:"Theoretical and practical defense, digital forensics, security governance, and cryptography."},
     {title:"Cisco / CompTIA Certifications",desc:"Vendor certifications (Security+, CCNA, CEH) combined with practical lab demonstrations."},
     {title:"Cyber Defense Academy",desc:"6-month hands-on red team / blue team cyber warfare training ranges."},
     {title:"CTF & Bug Bounty Mastery",desc:"Self-directed participation in Capture-The-Flag contests and responsible bug bounty submissions."}
   ]
 }
},
{
 name:"Engineering & Computational Science",
 icon:"⚙️",
 tag:"Math + making",
 img:"https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80",
 reason:"Geared for students drawn to physics, mathematical modeling, simulation, and creating real-world physical or computational systems.",
 skills:"Calculus, Physics Modeling, CAD/Simulation, MATLAB/Python, Technical Design",
 edu:"BS Mechanical / Electrical / Civil Engineering, BS Computational Physics",
 work:"Technical multidisciplinary teams + laboratory prototyping + project execution",
 challenge:"Mathematically demanding coursework and strict regulatory safety standards",
 alt:"Robotics Engineering, Aerospace Science, Materials Engineering",
 experiment:"Model a 3D structural truss or bridge in free Tinkercad and calculate its theoretical weight capacity.",
 educationGuide:{
   degrees:"BS Mechanical Engineering, BS Electrical Engineering, BS Computational Science",
   universities:{
     ph:"UP Diliman (College of Engineering), Mapúa University, DLSU Manila, UST, Batangas State University",
     us:"MIT, Stanford, Caltech, Georgia Tech, University of Michigan",
     uk:"Imperial College London, Cambridge, Bristol, Manchester",
     global:"TU Munich (Germany), KAIST (South Korea), NTU (Singapore), University of Tokyo",
     india:"IIT Bombay / Delhi / Kanpur / Madras (Engineering), BITS Pilani, NIT Trichy / Surathkal, Jadavpur University"
   },
   admission:"STEM Strand (Physics, Pre-Calculus, Calculus, Chemistry), high academic standing.",
   tests:"Philippines: UPCAT, Mapúa MPASS, DOST-SEI Examination; International: SAT Math, AP Physics. India: JEE Main (screening) then JEE Advanced for the IITs, BITSAT, state CETs (MHT-CET, COMEDK, WBJEE) for state engineering colleges.",
   scholarships:"Philippines: DOST-SEI Engineering Scholarship, Megaworld Foundation Grants, Aboitiz Future Leaders. India: INSPIRE-SHE (DST), NSP Post-Matric Scholarships, IIT / NIT merit-cum-means aid, AICTE Pragati and Saksham scholarships, state fee-waiver schemes.",
   indiaRoutes:[
     {title:"B.Tech via JEE Advanced (IIT)",desc:"India's most competitive engineering entry. Two years of dedicated preparation is the realistic norm, not an optional extra."},
     {title:"B.Tech at an NIT / IIIT / state college via JEE Main or state CET",desc:"The mainstream engineering route. Lower cut-offs than the IITs, and admission through state counselling (JoSAA / CSAB or the state authority)."},
     {title:"Diploma in Engineering then lateral-entry B.Tech",desc:"A three-year polytechnic diploma, then a lateral entry into the second year of a B.Tech. Practical, cheaper, and accessible without the IIT entrance pressure."},
     {title:"SSC / RRB Junior Engineer government route",desc:"Public-sector technical roles recruited through staff-selection commission examinations. Exam-driven, stable, and respected in India."}
   ],
   timeline:"Grade 11: Join math/physics competitions; Grade 12 (Fall): DOST & college applications; (Spring): Engineering lab confirmations.",
   routes:[
     {title:"4-5 Year Licensed Engineering Degree",desc:"Accredited curriculum leading to professional board licensure and high-level structural design."},
     {title:"Polytechnic Engineering Tech Diploma",desc:"Hands-on electro-mechanical fabrication and industrial plant maintenance."},
     {title:"CAD & Simulation Micro-Credentials",desc:"Specialized SolidWorks, AutoCAD, and FEA simulation certifications."},
     {title:"Makerspace Hardware Apprenticeship",desc:"Direct hands-on machining, CNC milling, and rapid hardware prototype development."}
   ]
 }
},
{
 name:"Business & Entrepreneurship",
 icon:"🚀",
 tag:"Initiative + people",
 img:"https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=600&q=80",
 reason:"Ideal if you enjoy launching ideas, commercial strategy, leading initiatives, negotiations, and measurable business outcomes.",
 skills:"Leadership, Financial Modeling, Market Research, Communication, Strategic Planning",
 edu:"BS Business Administration, BS Entrepreneurship, BS Management Engineering",
 work:"Fast-paced stakeholder collaboration + risk management under uncertainty",
 challenge:"Navigating commercial uncertainty, market competition, and operational risks",
 alt:"Management Consulting, Product Strategy, Venture Capital, Corporate Finance",
 experiment:"Draft a 1-page Lean Business Canvas for a business that solves a real daily hassle for students in your area.",
 educationGuide:{
   degrees:"BS Business Administration, BS Entrepreneurship, BS Management Engineering, BS Finance",
   universities:{
     ph:"Ateneo de Manila (BS ME / MGT), UP Diliman (BS BAA), DLSU (RVR College of Business), AIM",
     us:"Wharton (University of Pennsylvania), Stanford GSB, Harvard, NYU Stern, UC Berkeley Haas",
     uk:"London School of Economics (LSE), Oxford Said, London Business School, Warwick",
     global:"INSEAD, NUS Business School, Rotman (Toronto), Bocconi (Italy)",
     india:"IIM Indore / Rohtak / Ranchi (5-year IPM), Shaheed Sukhdev College of Business Studies (Delhi University), NMIMS Mumbai, Christ University Bengaluru, Symbiosis Pune"
   },
   admission:"ABM or STEM strand; leadership track record, strong verbal and quantitative reasoning.",
   tests:"Philippines: UPCAT, ACET, DCAT; International: SAT/ACT, GMAT/GRE (postgraduate). India: IPMAT (for the IIM five-year integrated management programme), CUET-UG (BMS / B.Com at Delhi University), NPAT (NMIMS), SET (Symbiosis), Christ University Entrance Test.",
   scholarships:"Philippines: Ayala Young Leaders Program, Gokongwei Brothers Foundation, University Leadership Grants. India: NSP Central Sector Scheme, IIM need-based financial aid, Aditya Birla and Sitaram Jindal Foundation scholarships, state e-district schemes.",
   timeline:"Grade 11: Launch a student enterprise or club; Grade 12 (Fall): Business school applications; (Spring): Scholarship interviews.",
   indiaRoutes:[
     {title:"5-year Integrated Programme in Management at an IIM",desc:"Entered straight after Class 12 through the IPMAT exam. A bachelor's plus MBA equivalent at an Indian Institute of Management without needing a separate CAT later."},
     {title:"BMS / BBA via CUET-UG",desc:"Three-year management degree at Delhi University or another central university. Strong value for cost, and the standard route for most students."},
     {title:"B.Com + CA / CS professional qualification",desc:"Commerce degree studied alongside the Chartered Accountancy or Company Secretary exams. Exam-heavy, but directly recognised by Indian employers."},
     {title:"Family business or self-started venture",desc:"India has a large small-business sector where running something real teaches more than a classroom. Combine with a part-time BBA if you want the credential."}
   ],
   routes:[
     {title:"4-Year Business Degree",desc:"Broad foundation in corporate finance, marketing management, operations, and organizational leadership."},
     {title:"Entrepreneurial Accelerator Track",desc:"Direct enrollment in venture creation incubators with seed funding and mentorship."},
     {title:"Applied Business Administration Diploma",desc:"2-year vocational diploma in retail operations, trade finance, and accounting support."},
     {title:"Direct Commerce Apprenticeship",desc:"Hands-on sales, digital store management, and real-world commercial trading experience."}
   ]
 }
},
{
 name:"Architecture & Spatial Design",
 icon:"🏛️",
 tag:"Creative + technical",
 img:"https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=600&q=80",
 reason:"Designed for minds that love spatial thinking, physical environments, structural aesthetics, and blending art with engineering logic.",
 skills:"Architectural Drafting, CAD/BIM (Revit), Spatial Logic, 3D Visualization, Model Making",
 edu:"Bachelor of Architecture (BArch - 5 yrs), BS Interior Design, BS Urban Planning",
 work:"Collaborative design studio + client presentations + construction site visits",
 challenge:"Demanding studio hours, long project cycles, and stringent safety building codes",
 alt:"Urban Planning, Interior Architecture, Landscape Architecture, Environmental Design",
 experiment:"Sketch an isometric floor plan of a 20-sqm eco-friendly study space incorporating natural sunlight and cross-ventilation.",
 educationGuide:{
   degrees:"Bachelor of Architecture (BArch), BS Interior Architecture, BS Urban & Regional Planning",
   universities:{
     ph:"UST (College of Architecture), UP Diliman, DLSU-CSB, Mapúa University, Far Eastern University",
     us:"Cornell University, Harvard GSD, MIT, Cooper Union, SCI-Arc",
     uk:"The Bartlett (UCL), Architectural Association (AA), Cambridge, Sheffield",
     global:"Politecnico di Milano (Italy), NUS (Singapore), TU Delft, University of Sydney",
     india:"School of Planning and Architecture (SPA) Delhi / Bhopal / Vijayawada, IIT Roorkee / Kharagpur, CEPT University Ahmedabad, Sir J.J. College of Architecture Mumbai, NIT Hamirpur"
   },
   admission:"Spatial aptitude, drawing ability, STEM or HUMSS background, creative portfolio.",
   tests:"Philippines: University entrance exam plus a drawing or design aptitude test. India: NATA (National Aptitude Test in Architecture, mandatory for B.Arch), JEE Main Paper 2 (for IIT / NIT and SPA architecture seats), plus the CEPT and Sir J.J. institute aptitude tests.",
   scholarships:"Philippines: University architecture merit grants, institutional design scholarships. India: NSP Central Sector Scheme, AICTE Pragati scholarships, SPA / IIT institute merit aid, state fee-waiver schemes.",
   timeline:"Grade 11: Build architectural sketchbook; Grade 12 (Fall): Drawing aptitude tests; (Spring): Studio reviews.",
   indiaRoutes:[
     {title:"B.Arch via NATA or JEE Main Paper 2",desc:"Five-year professional architecture degree. NATA is the standard gate; JEE Main Paper 2 covers the IIT, NIT and SPA seats. Both require a qualifying Class 12 with Mathematics."},
     {title:"B.Planning / B.Des at an SPA or IIT",desc:"Alternative built-environment degree focused on urban planning rather than building design, entered through the same aptitude tests."},
     {title:"Diploma in Architecture then lateral entry",desc:"Three-year polytechnic architecture assistantship diploma, then lateral entry into a B.Arch. Practical and less exam-dependent."},
     {title:"Interior design or construction supervision certification",desc:"Shorter vocational route into site supervision, drafting or interiors work without the full five-year degree or licence."}
   ],
   routes:[
     {title:"5-Year Professional B.Arch (Licensure)",desc:"Required degree pathway for professional board licensure and registered architect practice."},
     {title:"Drafting & BIM Technical Diploma (TESDA)",desc:"2-year certification in Revit, AutoCAD drafting, and construction documentation."},
     {title:"Architectural Visualization Studio Track",desc:"Focused training in 3D photorealistic rendering (3ds Max, Blender, Unreal Engine)."},
     {title:"Urban Planning & Design Track",desc:"Specialization in master planning, transport systems, and municipal spatial policy."}
   ]
 }
},
{
 name:"Biotechnology & Life Sciences",
 icon:"🧬",
 tag:"Science + discovery",
 img:"https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=600&q=80",
 reason:"Explore this if you are fascinated by genetics, laboratory discovery, biomedical innovation, and solving global health or agricultural challenges.",
 skills:"Molecular Biology, Lab Rigor, Biochemistry, Data Analysis, Scientific Protocol",
 edu:"BS Molecular Biology & Biotechnology (MBB), BS Biology, BS Biochemistry",
 work:"Precision laboratory research + collaborative multidisciplinary science teams",
 challenge:"High experimental precision required; research discoveries have long validation cycles",
 alt:"Pharmacology, Biomedical Engineering, Genetics, Healthcare Research",
 experiment:"Extract visible strands of DNA from a strawberry using water, household dish soap, salt, and rubbing alcohol.",
 educationGuide:{
   degrees:"BS Molecular Biology & Biotechnology (MBB), BS Biology, BS Biochemistry",
   universities:{
     ph:"UP Diliman (NIMBB), UP Los Baños, UST, Ateneo de Manila (BS Health Sciences / Bio)",
     us:"Johns Hopkins University, Harvard, UC San Diego, MIT, UC Berkeley",
     uk:"Oxford, Cambridge, Imperial College London, King's College London",
     global:"Karolinska Institute (Sweden), NUS, University of Melbourne, McGill University",
     india:"Indian Institute of Science Education and Research (IISER) Pune / Mohali / Thiruvananthapuram, IIT Madras / Delhi (Biotechnology), Jawaharlal Nehru University New Delhi, University of Hyderabad, Vellore Institute of Technology"
   },
   admission:"STEM Strand; high mastery in Biology, Organic Chemistry, and laboratory safety.",
   tests:"Philippines: UPCAT, DOST-SEI Examination, SAT Subject Tests / AP Biology. India: CUET-UG (BSc Biotechnology / Life Sciences), IISER Aptitude Test (IAT) for the BS-MS research programme, JEE Main / Advanced for B.Tech Biotechnology, NEET-UG if the goal is medicine, ICAR AIEEA for agricultural biotechnology.",
   scholarships:"Philippines: DOST-SEI MBB Priority Grants, PCHRD Health Research Awards, International Science Grants. India: INSPIRE-SHE (DST, ₹80,000/yr), NSP Post-Matric Scholarships, DBT Junior Research Fellowships, IISER merit aid.",
   timeline:"Grade 11: Conduct Science Investigative Project (SIP); Grade 12 (Fall): DOST exam; (Spring): Lab interviews.",
   indiaRoutes:[
     {title:"BS-MS dual degree at an IISER via IAT",desc:"Five-year research degree with a thesis. India's strongest route if the goal is a research career rather than a lab technician role."},
     {title:"BSc Biotechnology / Life Sciences via CUET-UG",desc:"Three-year degree at a central or state university, usually followed by an MSc. The most common entry point."},
     {title:"B.Tech Biotechnology via JEE",desc:"Engineering-oriented biotechnology degree covering bioprocess and downstream engineering, with better placement into industry than a plain BSc."},
     {title:"BSc + DBT / CSIR research fellowship route",desc:"Bachelor's degree then a competitive junior research fellowship. Funded research training, and the usual path into a PhD."}
   ],
   routes:[
     {title:"4-Year BS MBB / Biology Degree",desc:"Rigorous laboratory research preparation for biotech careers, pharmaceuticals, or medical school."},
     {title:"Medical Laboratory Technician Diploma",desc:"Vocational licensure track for hospital diagnostics and clinical sample testing."},
     {title:"Bio-informatics Data Specialization",desc:"Combines biological dataset analysis with Python and computational genomics."},
     {title:"Clinical Trial Coordinator Track",desc:"Apprenticeship in pharmaceutical trial management and bioethics compliance."}
   ]
 }
},
{
 name:"Digital Marketing & Strategy",
 icon:"📈",
 tag:"Creative + analytical",
 img:"https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80",
 reason:"A high-energy direction if you love analyzing audience behavior, content storytelling, growth marketing, and digital campaigns.",
 skills:"Content Strategy, Google Analytics, Social Media Architecture, Copywriting, SEO",
 edu:"BS Marketing Management, BS Communications, BS Advertising Management",
 work:"Fast-paced creative brainstorming + performance data analysis",
 challenge:"Fast-changing platform algorithms, tight deadlines, and constant campaign iteration",
 alt:"Public Relations, Brand Consulting, Digital Media Production, Growth Operations",
 experiment:"Create a 3-part social media content strategy for an imaginary local artisan brand with audience personas and engagement metrics.",
 educationGuide:{
   degrees:"BS Marketing Management, BS Advertising, BA Communication, BS Digital Media",
   universities:{
     ph:"DLSU Manila, Ateneo de Manila, UST, De La Salle-CSB, San Beda University",
     us:"Northwestern (Medill), NYU Stern, USC Annenberg, UT Austin",
     uk:"London School of Economics, King's College London, Leeds, Manchester",
     global:"University of Melbourne, Erasmus University Rotterdam, SMU (Singapore)",
     india:"IIM Indore / Rohtak / Ranchi (IPM), Shaheed Sukhdev College of Business Studies (Delhi University), MICA Ahmedabad, Symbiosis Institute of Media and Communication Pune, Xavier Institute of Communications Mumbai"
   },
   admission:"ABM or HUMSS strand; strong written English, psychological curiosity, analytical mindset.",
   tests:"Philippines: College entrance exams; Google Analytics / HubSpot certification readiness. India: IPMAT (IIM integrated management), CUET-UG (BMS / BA Journalism at Delhi University), MICAT (MICA), SET (Symbiosis), Xavier's entrance tests.",
   scholarships:"Philippines: Marketing Association of the Philippines Grants, Advertising Foundation Awards. India: NSP Central Sector Scheme, MICA and Symbiosis merit aid, Aditya Birla and Sitaram Jindal Foundation scholarships.",
   timeline:"Grade 11: Manage social media for a student organization; Grade 12 (Fall): Admissions; (Spring): Portfolio submissions.",
   indiaRoutes:[
     {title:"BMS / BBA via CUET-UG",desc:"Three-year management degree at Delhi University or another central university, then specialise in digital marketing through internships and certifications."},
     {title:"BA Journalism and Mass Communication via CUET-UG",desc:"Media-focused degree covering content, audience and campaign work. Closer to the creative side of marketing."},
     {title:"MICA / Symbiosis communications programmes",desc:"India's more specialised media and communications institutes, with their own entrance tests (MICAT, SET). Portfolio and writing samples matter."},
     {title:"Certifications + freelance campaign portfolio",desc:"Google, Meta and HubSpot certifications combined with real client work. Indian agencies hire on demonstrable campaign results."}
   ],
   routes:[
     {title:"4-Year Marketing Degree",desc:"Comprehensive study of consumer behavior, global marketing, branding, and corporate communications."},
     {title:"Digital Marketing Institute (DMI) Diploma",desc:"Industry-certified credential in paid search, conversion rate optimization, and CRM."},
     {title:"HubSpot & Google Certified Track",desc:"Micro-credentials combined with real campaign budget management."},
     {title:"Freelance Agency Apprenticeship",desc:"Direct client work in copy, media buying, and social growth marketing."}
   ]
 }
},
{
 name:"Artificial Intelligence & ML",
 icon:"🤖",
 tag:"Math + innovation",
 img:"https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=600&q=80",
 reason:"A cutting-edge path for those drawn to machine learning, neural networks, advanced mathematical logic, and automated intelligence.",
 skills:"Python, Linear Algebra, PyTorch/TensorFlow, Probability, Machine Learning Algorithms",
 edu:"BS Computer Science (AI Track), BS Data Engineering, BS Mathematics",
 work:"Deep research focus + technical engineering collaboration",
 challenge:"Heavy theoretical mathematics and rapidly shifting state-of-the-art architectures",
 alt:"Robotics Engineering, Computational Linguistics, Data Science, Software Engineering",
 experiment:"Train a custom image classifier using Google Teachable Machine and evaluate its accuracy across 10 novel test images.",
 educationGuide:{
   degrees:"BS Computer Science (AI Track), BS Data Engineering, BS Mathematics & Computing",
   universities:{
     ph:"UP Diliman, DLSU Manila, Ateneo de Manila",
     us:"Carnegie Mellon (BS in AI), Stanford, MIT, UC Berkeley, University of Washington",
     uk:"Oxford, Cambridge, UCL, Imperial College London",
     global:"University of Toronto (Vector Institute), ETH Zurich, NTU, KAIST",
     india:"IIT Bombay / Delhi / Madras / Kanpur (Computer Science and AI), IISc Bengaluru (BS Research), IIIT Hyderabad (Computer Science and AI), BITS Pilani"
   },
   admission:"STEM Strand (Calculus, Linear Algebra, Python, Statistics), high analytical aptitude.",
   tests:"Philippines: UPCAT, DOST Merit Exam, SAT (Math 780+), AP Calculus BC. India: JEE Main then JEE Advanced (the IIT computer-science route), IIIT Hyderabad UGEE or its own entrance test, IISc Bachelor of Science Research admission test, BITSAT.",
   scholarships:"Philippines: DOST AI Priority Grants, DeepMind AI Scholarships, Google Research Fellowships. India: INSPIRE-SHE (DST), NSP Post-Matric Scholarships, IIT / IISc merit-cum-means aid, Prime Minister's Research Fellowship for later stages.",
   timeline:"Grade 11: Study Python & Linear Algebra; Grade 12 (Fall): University AI programs; (Spring): Research lab interviews.",
   indiaRoutes:[
     {title:"B.Tech Computer Science with an AI / ML specialisation via JEE",desc:"The mainstream IIT, NIT and IIIT route. Choose institutions with actual machine-learning faculty and lab access, not just an AI-branded programme title."},
     {title:"BS Research at IISc Bengaluru",desc:"A four-year research-focused undergraduate degree at India's leading science institute, entered through its own admission test plus a strong Class 12 record."},
     {title:"BSc Computer Science / Mathematics then MSc AI",desc:"A three-year base degree, then a specialised master's. Slower, but cheaper and often more flexible if the JEE result is not what you hoped for."},
     {title:"NPTEL / IIT online certifications plus projects",desc:"Indian Institutes of Technology publish free certified courses in machine learning and deep learning. Combine them with published projects to build evidence of skill."}
   ],
   routes:[
     {title:"4-Year BS in AI / Computer Science",desc:"Advanced neural architectures, reinforcement learning, computer vision, and academic research."},
     {title:"Deep Learning Specialization Track",desc:"Industry certifications (DeepLearning.AI, Fast.ai) with open-source HuggingFace models."},
     {title:"AI Data Operations Diploma",desc:"2-year certification in model evaluation, data labeling pipelines, and ML engineering ops."},
     {title:"Open-Source AI Model Contributor",desc:"Fine-tuning open weights, creating dataset benchmarks, and writing technical AI papers."}
   ]
 }
},
{
 name:"International Relations & Global Policy",
 icon:"🌐",
 tag:"People + values",
 img:"https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=600&q=80",
 reason:"Explore this if you care about diplomacy, geopolitical policy, global trade, social advocacy, and cross-cultural communication.",
 skills:"Policy Analysis, Cross-Cultural Negotiation, Persuasive Writing, Research, Languages",
 edu:"BA International Studies, BA Political Science, BA Diplomacy & Foreign Affairs",
 work:"Policy drafting + diplomatic debate + international stakeholder coordination",
 challenge:"Nuanced diplomatic conflicts with slow institutional timelines and high ambiguity",
 alt:"International Law, Human Rights Advocacy, Foreign Service, NGO Leadership",
 experiment:"Draft a 1-page policy brief outlining the trade-offs of a global renewable energy treaty for emerging economies.",
 educationGuide:{
   degrees:"BA International Studies, BA Political Science, BA Diplomacy & Foreign Affairs",
   universities:{
     ph:"UP Diliman (Political Science), Ateneo de Manila (POS), DLSU Manila (International Studies), Miriam College",
     us:"Georgetown University (Walsh SFS), Harvard (Kennedy School), Columbia (SIPA), Princeton",
     uk:"London School of Economics (LSE), Oxford (PPE), King's College London, Cambridge",
     global:"Sciences Po (France), Geneva Graduate Institute (Switzerland), NUS LKYSPP",
     india:"Jawaharlal Nehru University New Delhi (International Studies), University of Delhi (Political Science), Ashoka University (Politics and International Relations), Symbiosis Pune (International Studies), Christ University Bengaluru"
   },
   admission:"HUMSS strand; outstanding writing, historical awareness, debate or MUN experience.",
   tests:"Philippines: College entrance exams; essay-writing and verbal aptitude evaluations. India: CUET-UG (BA Political Science / International Relations at Delhi University and most central universities), JNU Entrance Exam (JNUEE), Ashoka Aptitude Assessment, Symbiosis SET.",
   scholarships:"Philippines: Foreign Service Institute Awards, Chevening Scholarships, Erasmus Mundus, Rotary Peace Fellowships. India: NSP Central Sector Scheme, JNU and Delhi University merit aid, Inlaks and J.N. Tata Endowment scholarships for later overseas study.",
   timeline:"Grade 11: Compete in Model UN (MUN) conferences; Grade 12 (Fall): Essay-intensive college apps; (Spring): Policy interviews.",
   indiaRoutes:[
     {title:"BA Political Science / International Studies via CUET-UG",desc:"Three-year degree at Delhi University or another central university. The standard and most cost-effective entry into the field."},
     {title:"JNU School of International Studies",desc:"India's most established centre for international studies, entered through the JNU entrance exam. Strong research and policy orientation."},
     {title:"Indian Foreign Service via the UPSC Civil Services Examination",desc:"The government diplomatic route. A degree alone is not enough — plan for the UPSC exam as a separate, demanding goal."},
     {title:"Policy think tank or NGO internship track",desc:"Research assistantships at organisations such as ORF or CPR, plus a bachelor's degree. Builds a policy portfolio without an exam-driven route."}
   ],
   routes:[
     {title:"4-Year University Degree in IR / PolSci",desc:"Comprehensive geopolitical history, international law, treaty analysis, and foreign diplomacy."},
     {title:"Foreign Service Exam Track",desc:"Specialized diplomatic preparation for civil service and embassy career appointments."},
     {title:"Global NGO Fieldwork Route",desc:"Grassroots advocacy and field operations in international development agencies."},
     {title:"Policy Think Tank Junior Analyst",desc:"Apprenticeships analyzing trade flows, defense policy, and legislative proposals."}
   ]
 }
},
{
 name:"Robotics & Mechatronics",
 icon:"🦾",
 tag:"Technical + builder",
 img:"https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=600&q=80",
 reason:"Perfect for students who love merging mechanical hardware, electronic circuitry, sensors, and embedded software into moving machines.",
 skills:"Circuit Design, Arduino/C++, SolidWorks, Kinematics, Motor Control",
 edu:"BS Mechatronics Engineering, BS Robotics Engineering, BS Electronics Engineering",
 work:"Hands-on laboratory testing + hardware soldering + firmware programming",
 challenge:"Debugging both physical hardware faults and embedded code simultaneously",
 alt:"Automotive Engineering, Aerospace Systems, Biomedical Robotics, Industrial Automation",
 experiment:"Simulate an Arduino microcontroller with an ultrasonic sensor and LED indicator in free Tinkercad Circuits.",
 educationGuide:{
   degrees:"BS Mechatronics Engineering, BS Robotics Engineering, BS Electronics Engineering (ECE)",
   universities:{
     ph:"DLSU Manila (Mechatronics Engineering), Mapúa University, Batangas State University, UP Diliman",
     us:"Carnegie Mellon, MIT, Georgia Tech, Worcester Polytechnic Institute (WPI)",
     uk:"Imperial College London, University of Bristol, Sheffield, Southampton",
     global:"TU Munich, ETH Zurich, Tokyo Institute of Technology, SUTD",
     india:"IIT Bombay / Delhi / Kharagpur (Mechanical and Electrical with robotics focus), IISc Bengaluru (Robert Bosch Centre for Cyber-Physical Systems), NIT Trichy / Surathkal, VIT Vellore, Amrita Vishwa Vidyapeetham"
   },
   admission:"STEM Strand (Physics, Calculus, Electronics curiosity), hands-on technical dexterity.",
   tests:"Philippines: UPCAT, DOST-SEI Examination, SAT Math, Physics Olympiad. India: JEE Main then JEE Advanced for the IIT and NIT mechatronics and electrical routes, BITSAT, VITEEE, state CETs.",
   scholarships:"Philippines: DOST Mechatronics Priority Scholarship, First Philippine Holdings Science Grants. India: INSPIRE-SHE (DST), NSP Post-Matric Scholarships, AICTE Pragati and Saksham scholarships, IIT / NIT merit-cum-means aid.",
   timeline:"Grade 11: Build hardware robotics projects; Grade 12 (Fall): Engineering applications; (Spring): Hardware project demos.",
   indiaRoutes:[
     {title:"B.Tech Mechatronics / Robotics via JEE",desc:"The standard engineering route at an IIT, NIT or private university. Check that the programme has a real robotics lab rather than only the title."},
     {title:"B.Tech Electrical or Mechanical, then specialise",desc:"A broader engineering degree followed by robotics coursework or a master's. Keeps more doors open than a narrow undergraduate specialisation."},
     {title:"Diploma in Electronics or Instrumentation then lateral entry",desc:"Three-year polytechnic route into industrial automation and maintenance work, with lateral entry into a B.Tech available later."},
     {title:"Robotics competition track (e-Yantra, WRO, ABU ROBOCON)",desc:"India runs strong national robotics competitions. Visible hardware projects are what hiring managers and admission panels actually examine."}
   ],
   routes:[
     {title:"4-5 Year Licensed Mechatronics Degree",desc:"Complete hardware-software integration leading to professional engineering licensure."},
     {title:"Industrial Automation TESDA NC II/III",desc:"Technical vocational certification in PLC programming and industrial robotic arms."},
     {title:"Robotics Competition Track (VEX / FIRST)",desc:"Hands-on high-level competitive robotics design and embedded firmware development."},
     {title:"Makerspace Hardware Apprenticeship",desc:"Direct prototyping of custom PCB electronics and ROS-powered autonomous mobile robots."}
   ]
 }
},
{
 name:"Game Design & Development",
 icon:"🎮",
 tag:"Creative + logical",
 img:"https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80",
 reason:"A thrilling intersection of interactive storytelling, gameplay mechanics, visual art, player psychology, and creative programming.",
 skills:"Game Engines (Unity/Unreal/Godot), C#/C++, Level Design, Game Mechanics, 3D Art",
 edu:"BS Game Development, BS Interactive Entertainment, BFA Game Design",
 work:"Iterative playtesting + cross-functional studio sprints with artists and coders",
 challenge:"Intense production debugging, balancing gameplay mechanics, and creative constraints",
 alt:"Virtual Reality Development, Interactive Animation, UX Design, Creative Coding",
 experiment:"Design a 1-page rulebook for a playable tabletop card game or build a 1-level 2D platformer in Godot Engine or Scratch.",
 educationGuide:{
   degrees:"BS Game Development, BS Interactive Entertainment, BFA Game Design, BS CS",
   universities:{
     ph:"De La Salle-CSB (BS-ISGD), CIIT College of Arts and Technology, FEU Tech, iACADEMY",
     us:"USC (Games), NYU Game Center, DigiPen Institute of Technology, University of Utah",
     uk:"Abertay University, Teesside University, Brunel University, Staffordshire",
     global:"Vancouver Film School (Canada), Supinfogame (France), Tokyo Polytechnic",
     india:"IIT Bombay (IDC School of Design), National Institute of Design (NID), Whistling Woods International Mumbai, L.V. Prasad Film and TV Academy Chennai, ICAT Design and Media College"
   },
   admission:"Creative portfolio, gaming aptitude, programming interest, narrative storytelling.",
   tests:"Philippines: Game pitch & portfolio review; university logical aptitude evaluations. India: UCEED (IIT design programmes), NID DAT, institute portfolio rounds at Whistling Woods and ICAT, plus general university entrance tests.",
   scholarships:"Philippines: Game Developers Association of the Philippines (GDAP) Grants, Epic Games MegaGrants. India: NSP Post-Matric Scholarships, NID and IIT institute fee waivers, Aditya Birla and Sitaram Jindal Foundation scholarships.",
   timeline:"Grade 11: Join 48-hour Game Jams (itch.io); Grade 12 (Fall): Portfolio submissions; (Spring): Studio reviews.",
   indiaRoutes:[
     {title:"B.Des in Game Design via UCEED or NID DAT",desc:"IIT and NID design programmes now cover interaction and game design. Portfolio and design-aptitude scores decide admission."},
     {title:"B.Tech / BSc Computer Science with a game development specialisation",desc:"Programming-first route into engine and gameplay code. Stronger for technical roles than an art-led degree."},
     {title:"BFA Animation and Game Art",desc:"Art-side route covering 3D modelling, rigging and game-ready asset production at a film or design institute."},
     {title:"Game jam and indie studio portfolio",desc:"India has an active indie scene and regular global game jams (GMTK, Ludum Dare). Shipped, playable games matter more than credentials in this field."}
   ],
   routes:[
     {title:"4-Year Degree in Game Development",desc:"Deep training in physics engines, multiplayer networking, 3D shaders, and studio pipeline."},
     {title:"3D Asset & Animation Vocational Diploma",desc:"2-year intensive technical modeling, rigging, and character animation certificate."},
     {title:"Indie Game Release & Game Jam Track",desc:"Publishing playable game prototypes on itch.io and Steam to build a demonstrated track record."},
     {title:"Unity / Unreal Certified Developer Track",desc:"Official engine certifications combined with gameplay programming portfolios."}
   ]
 }
},
{
 name:"Finance & Quantitative Economics",
 icon:"💰",
 tag:"Analytical + strategic",
 img:"https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=600&q=80",
 reason:"For students fascinated by financial markets, economic modeling, risk management, and mathematical decisions under uncertainty.",
 skills:"Financial Modeling, Statistical Analysis, Econometrics, Excel/Python, Risk Assessment",
 edu:"BS Economics, BS Finance, BS Management of Financial Institutions, BS Actuarial Science",
 work:"Data-driven market analysis + investment presentations + strategic risk modeling",
 challenge:"High responsibility, market volatility, and demanding financial cycles",
 alt:"Actuarial Science, Corporate Banking, FinTech Data Analysis, Economic Consulting",
 experiment:"Set up a Google Sheet tracking 5 company stocks for two weeks and calculate their percentage return and price variance.",
 educationGuide:{
   degrees:"BS Management of Financial Institutions, BS Economics, BS Applied Economics, BS Actuarial Science",
   universities:{
     ph:"UP Diliman (School of Economics), De La Salle University, Ateneo de Manila, UST",
     us:"Wharton (Penn), University of Chicago, NYU Stern, Harvard, Columbia",
     uk:"London School of Economics (LSE), Cambridge, Oxford, Warwick, UCL",
     global:"Bocconi University (Italy), University of St. Gallen (Switzerland), NUS, Melbourne",
     india:"Indian Statistical Institute (Kolkata / Bengaluru), Delhi University (B.Com / Economics), St. Xavier's College Mumbai, Shri Ram College of Commerce Delhi, IIM Indore / Rohtak (IPM)"
   },
   admission:"ABM or STEM strand; advanced mathematical probability, economic curiosity, analytical rigor.",
   tests:"Philippines: UPCAT, DCAT, ACET; SAT Math, AP Micro/Macroeconomics. India: CUET-UG (B.Com / BA Economics at Delhi University and central universities), IPMAT (IIM integrated management), CA Foundation, ISI Admission Test for statistics-linked programmes, plus the Actuarial Common Entrance Test (ACET) if you choose actuarial science.",
   scholarships:"Philippines: Bangko Sentral ng Pilipinas (BSP) Scholarships, CFA Institute Scholarships, Metrobank Foundation Aid. India: NSP Central Sector Scheme, IIM and Delhi University merit aid, Aditya Birla and Sitaram Jindal Foundation scholarships, Institute of Actuaries of India student concessions.",
   timeline:"Grade 11: Study financial news and Excel modeling; Grade 12 (Fall): University applications; (Spring): Finance scholarship filings.",
   indiaRoutes:[
     {title:"B.Com (Honours) via CUET-UG",desc:"Three-year commerce degree at Delhi University or another central university. The standard Indian route, and the base for most finance careers."},
     {title:"BA Economics (Honours) via CUET-UG",desc:"More theory and mathematics than B.Com. Better preparation for a master's in economics or for quantitative analyst roles."},
     {title:"CA / CFA professional qualification",desc:"Chartered Accountancy through the ICAI exam sequence, or the CFA charter, studied alongside or after a degree. Indian finance employers weight these heavily."},
     {title:"Actuarial science via the ACET",desc:"Entrance to the Institute of Actuaries of India qualification. Extremely quantitative and exam-driven, with a small number of qualifiers each year."}
   ],
   routes:[
     {title:"4-Year Economics / Finance Degree",desc:"Macro/microeconomics theory, quantitative econometrics, corporate valuation, and investment banking."},
     {title:"Actuarial Science Professional Track",desc:"Specialized mathematics degree preparing for international actuarial board examinations."},
     {title:"CFA & Financial Modeling Track",desc:"Chartered Financial Analyst foundation modules combined with practical equity research."},
     {title:"FinTech & Quantitative Data Track",desc:"Combines algorithmic trading mechanics, Python data pipelines, and decentralized finance."}
   ]
 }
}
];

function renderPublic(){
 $("#publicPaths").innerHTML=pathways.map(p=>`<article class="path-card">
   <div class="path-card-media">
     <img src="${p.img}" alt="${escapeHtml(p.name)}" loading="lazy" decoding="async" class="path-img" onerror="this.style.display='none'">
     <span class="tag path-tag-overlay">${p.tag}</span>
   </div>
   <div class="path-card-body">
     <h3>${p.icon} ${p.name}</h3>
     <p class="reason">${p.reason}</p>
     <p><b>Skills:</b> ${p.skills}</p>
     <p><b>Related:</b> ${p.alt}</p>
   </div>
   <div class="path-actions">
     <button class="small-btn primary" onclick="requireLogin()">Explore details →</button>
   </div>
 </article>`).join("");
}

function capture(){
 const q=sessionQuestions()[state.qIndex];if(!q)return;
 if(q.type==="open")state.answers[q.id]=$("#answerOpen")?.value||"";
 else if(q.type==="rank")state.answers[q.id]=$$("#answerRank select").map(x=>x.value);
 else if(q.type==="multi")state.answers[q.id]=$$("#question input[type=checkbox]:checked").map(x=>x.value);
 else state.answers[q.id]=$$("#question input[name=answer]:checked")[0]?.value||"";
 saveState();updateUI();
}

function renderQuestion(){
 ensureSession();const qs=sessionQuestions(),q=qs[state.qIndex];if(!q)return;
 $("#qCount").textContent=`Question ${state.qIndex+1} of 20`;
 const pct=Math.round(((state.qIndex+1)/20)*100);
 const bar=$("#qProgressBar");if(bar) bar.style.width=`${pct}%`;
 const firstDraw=(q.weight/100).toFixed(2);
 $("#selectionInfo").innerHTML=`<b>${escapeHtml(q.categoryLabel)}</b><br><br>This question has a configured <strong>${firstDraw}% first-draw chance</strong> because its category weight is ${q.weight}/100 and there are 100 questions in each category.<br><br>The exact chance of appearing in the full 20-question session changes as questions are selected. This is an explainable selection mechanic, not a personality score.`;
 let body="";
 const val=state.answers[q.id];
 if(q.type==="scale"){
  const labels=q.scaleLabels||["Strongly disagree","Disagree","Neutral","Agree","Strongly agree"];
  body=`<div class="scale">${labels.map((x,i)=>`<label class="${String(val)===String(i+1)?"selected":""}"><input type="radio" name="answer" value="${i+1}" ${String(val)===String(i+1)?"checked":""}><span>${i+1}</span><small>${escapeHtml(x)}</small></label>`).join("")}</div>`;
 }
 else if(q.type==="open"){
  body=`<textarea class="open" id="answerOpen" placeholder="${escapeHtml(q.placeholder||'Write honestly. A few sentences are enough.')}">${escapeHtml(val||"")}</textarea>`;
 }
 else if(q.type==="rank"){
  body=`<div class="rank" id="answerRank">${(q.options||[]).map((o,i)=>`<div><span>${escapeHtml(o)}</span><select><option value="">Rank</option>${[1,2,3,4,5].map(n=>`<option ${String(val?.[i])===String(n)?"selected":""}>${n}</option>`).join("")}</select></div>`).join("")}</div>`;
 }
 else{
  const isMulti=q.type==="multi";
  body=`<div class="options">${(q.options||[]).map(o=>`<label class="option ${Array.isArray(val)?val.includes(o):val===o?"selected":""}"><input type="${isMulti?"checkbox":"radio"}" name="answer" value="${escapeHtml(o)}" ${Array.isArray(val)?val.includes(o)?"checked":"":val===o?"checked":""}><span>${escapeHtml(o)}</span></label>`).join("")}</div>`;
 }
 const badgeType=q.type==="scale"?"RATING SCALE":q.type==="multi"?"MULTI-SELECT":q.type==="rank"?"PRIORITY RANKING":q.type==="open"?"REFLECTION PROMPT":"SCENARIO CHOICE";
 $("#question").innerHTML=`<div class="question-card"><div class="question-type-badge"><span class="q-dim-pill">✦ ${escapeHtml(q.categoryLabel)}</span><span class="q-type-pill">${badgeType}</span></div><h3>${escapeHtml(q.prompt)}</h3>${body}<p class="muted hint-note">✦ There is no socially correct answer. Choose what authentically describes you.</p><div class="question-nav"><button class="btn soft" id="back" ${state.qIndex===0?"disabled":""}>← Previous</button><button class="btn primary" id="next">${state.qIndex===19?"Finish & analyze pathways ✦":"Next question →"}</button></div></div>`;
 $$("#question input").forEach(x=>x.addEventListener("change",()=>{
  $$(".option").forEach(o=>{const inp=o.querySelector("input");if(inp)o.classList.toggle("selected",inp.checked)});
  $$(".scale label").forEach(l=>{const inp=l.querySelector("input");if(inp)l.classList.toggle("selected",inp.checked)});
  capture();
 }));
 $("#answerOpen")?.addEventListener("input",capture);$$("#answerRank select").forEach(x=>x.addEventListener("change",capture));
 $("#back").onclick=()=>{capture();state.qIndex=Math.max(0,state.qIndex-1);renderQuestion();$("#question")?.scrollIntoView({behavior:"smooth",block:"nearest"});};
 $("#next").onclick=()=>{
   capture();
   if(state.qIndex<19){
     state.qIndex++;renderQuestion();$("#question")?.scrollIntoView({behavior:"smooth",block:"nearest"});
   } else {
     capture();renderInterestMap();
     archiveCurrentSession();
     try{trackSessionCompleted();trackCareersExplored(pathways.slice(0,3).map(p=>p.name))}catch(e){}
     goTab("analysis");
     toast("20 responses analyzed! Patterns and uncertainty checks are ready.");
   }
 };
}

function archiveCurrentSession(){
 const qs=sessionQuestions();
 const answeredCount=qs.filter(q=>state.answers[q.id]!=null&&state.answers[q.id]!=="").length;
 if(answeredCount===0)return;
 state.history=state.history||[];
 const existingIdx=state.history.findIndex(h=>h.started===state.session?.started);
 const snapshot={
   id:Date.now(),
   started:state.session?.started||Date.now(),
   date:new Date().toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric",hour:"2-digit",minute:"2-digit"}),
   answered:answeredCount,
   topPathways:pathways.slice(0,3).map(p=>p.name)
 };
 if(existingIdx>=0) state.history[existingIdx]=snapshot;
 else state.history.unshift(snapshot);
 saveState();updateUI();
}

function retakeQuestionnaire(){
 archiveCurrentSession();
 newSession();
 renderQuestion();
 updateUI();
 goTab("questionnaire");
 toast("A fresh 20-question session is ready.");
}

function renderAnalysis(){
 const qs=sessionQuestions(),answered=qs.filter(q=>state.answers[q.id]!=null&&state.answers[q.id]!=="").length;
 const categoryCounts={};qs.forEach(q=>{if(state.answers[q.id]!=null)categoryCounts[q.categoryLabel]=(categoryCounts[q.categoryLabel]||0)+1});
 const chips=Object.keys(categoryCounts).map(x=>`<span class="chip">${x}</span>`).join("");
 $("#analysisIntro").textContent=answered<20?`You have answered ${answered} of 20 selected questions. Complete the session for a fuller analysis.`:"Your responses are evaluated as qualitative signals. The analysis below presents hypotheses to test in the real world — never a rigid verdict.";

 // Contradictions & Open Uncertainty Detection
 const scaleAnswers=qs.filter(q=>q.type==="scale").map(q=>Number(state.answers[q.id])||0).filter(Boolean);
 const neutralCount=scaleAnswers.filter(v=>v===3).length;
 const isHighlyNeutral=scaleAnswers.length>0 && (neutralCount/scaleAnswers.length >= 0.45);

 let uncertaintyHtml="";
 if(answered<20){
   uncertaintyHtml=`<div class="notice"><b>✦ Incomplete Data Signal:</b> You have answered ${answered} of 20 questions. The AI treats incomplete sessions with high uncertainty. Answer all 20 questions to unlock clear dimensional hypotheses.</div>`;
 } else if(isHighlyNeutral){
   uncertaintyHtml=`<div class="notice"><b>✦ Open Uncertainty Notice:</b> A noticeable portion of your scale responses were marked 'Neutral'. This frequently occurs when exploring unfamiliar fields or when your interests are equally balanced across multiple domains. Rather than forcing a single narrow career prediction, we recommend testing 2–3 contrasting pathways in short real-world projects.</div>`;
 } else {
   uncertaintyHtml=`<div class="notice"><b>✦ Open Uncertainty & Contradiction Check:</b> No severe conflicting contradictions were detected in your 20 answers. Your responses reflect consistent interest signals. However, remember that career satisfaction depends on day-to-day work environment, team culture, and continuous experimentation.</div>`;
 }

 $("#analysis").innerHTML=`<div class="analysis-grid">
   <div class="analysis-box"><h3>Dimensions explored</h3><div class="chips2">${chips||"<span class=chip>Not enough data yet</span>"}</div><p class="muted" style="margin-top:10px">Your session sampled ten dimensions of interest. Twenty questions is a balanced sample, not a measurement — retaking it later adds genuinely new context.</p></div>
   <div class="analysis-box"><h3>Possible working style hypothesis</h3><p><b>Working Style:</b> Focused problem investigation with purposeful collaboration. You appear to appreciate clear logic and tangible outputs.</p><p class="muted">Treat this as a working hypothesis to validate through actual projects, not a fixed personality label.</p></div>
   <div class="analysis-box full"><h3>AI Uncertainty & Contradictions Check</h3>${uncertaintyHtml}</div>
   <div class="analysis-box"><h3>External-pressure reflection</h3><p class="muted">If answers regarding parent expectations, salary prestige, or peer trends pulled strongly against your personal hobbies, that tension is highlighted for your own reflection rather than scored as a mismatch.</p></div>
   <div class="analysis-box"><h3>Zero Fake Percentages</h3><p>Your Path does not use misleading pseudo-scientific percentages like '97% career match'. Human curiosity is dynamic. We explain the explicit reasoning for each pathway so you can decide what makes sense.</p></div>
   <div class="analysis-box full"><h3>Next recommended steps</h3><p>Review the recommended pathways below, compare 2–4 side-by-side in the Compare tab, and check the Education & Universities guide for relevant programs.</p><div style="display:flex;gap:10px;margin-top:14px"><button class="btn primary" onclick="goTab('pathways')">Explore pathways →</button><button class="btn soft" onclick="goTab('compare')">Compare side-by-side →</button><button class="btn soft" onclick="goTab('education')">Universities & Education →</button></div></div>
 </div>`;
}

/* ================================================================
   WHY THIS APPEARED

   The most important thing on a pathway card is not the description — it is
   the reason it was put in front of the student. A generic blurb ("strong
   alignment if you enjoy data") is shown to everyone and explains nothing.

   So instead we compare the student's own accumulated signals against the
   pathway's dimension profile and report which dimensions actually matched.
   Both sides are real data: signals come from the questionnaire, dims come
   from the pathway profile. Nothing here is invented for the copy.

   Every dimension starts at a 1.0 baseline (see localAIState), so a signal
   meaningfully above 1.0 is evidence, not noise. With no questionnaire
   answered yet we say so plainly rather than fabricating a reason.
   ================================================================ */
const DIM_LABELS={
  Analytical:"analysing information and solving quantitative problems",
  Creative:"creating, designing and making original things",
  People:"working with, explaining to and helping people",
  Learning:"studying a subject deeply and building skill over time",
  Curiosity:"investigating how things work and asking why"
};
const CAT_LABELS={
  interests:"your interests", subjects:"your subject preferences",
  problem:"your problem-solving answers", creativity:"your creative answers",
  communication:"your communication answers", workstyle:"your working-style answers",
  motivation:"your motivation answers", learning:"your learning answers",
  pressure:"your answers about outside pressure", values:"your values answers"
};

function studentSignals(){
  return (state.localAI&&state.localAI.signals)||null;
}

/* Is there enough evidence to reason from at all?

   The signals ARE the evidence — every dimension starts at a 1.0 baseline and
   only rises because the student answered something (see localSignalFromAnswer).
   So if any dimension is meaningfully above baseline, there is real evidence to
   explain from, regardless of how the answer log or answers object happen to be
   populated (they can legitimately disagree after a restored session).

   `hasAnsweredSome` exists only to distinguish "no data yet" from "data that
   happens to sit at baseline", which must still read as not-enough-evidence. */
function hasEvidence(){
  const sig=studentSignals();
  if(!sig) return false;
  const a=state.localAI||{};
  const answered=(a.history||[]).length + Object.keys(state.answers||{}).length;
  if(!answered) return false;
  return LOCAL_AI.dimensions.some(d=>Number(sig[d])>1.15);
}

/* Match a pathway's profile against the student's signals, best match first. */
function pathwayEvidence(name){
  const sig=studentSignals();
  if(!sig) return null;
  const profile=(LOCAL_AI.pathwayProfiles||[]).find(p=>p.name===name);
  if(!profile||!profile.dims) return null;
  const matched=Object.entries(profile.dims)
    .map(([dim,weight])=>({dim,weight,value:Number(sig[dim])||1}))
    .filter(x=>x.value>1.15)
    .sort((a,b)=>(b.weight*b.value)-(a.weight*a.value))
    .slice(0,3);
  return {profile,matched};
}

/* The transparent "why this appeared" sentence. */
function whyThisAppeared(name){
  if(!hasEvidence()){
    return {text:`No explanation yet — this list is in a default order. Answer the questionnaire and every pathway here will explain why it appeared, using your own answers.`,live:false};
  }
  const ev=pathwayEvidence(name);
  if(!ev||!ev.matched.length){
    return {text:`Listed for breadth rather than because your answers pointed at it. Your answers so far did not strongly match ${name}'s core work, so treat this as something to test rather than something recommended.`,live:true,weak:true};
  }
  const strongest=ev.matched[0];
  const named=ev.matched.slice(0,2).map(m=>DIM_LABELS[m.dim]).filter(Boolean);
  const cats=(ev.profile.cats||[]).map(c=>CAT_LABELS[c]).filter(Boolean);
  const catText=cats.length?` This came mainly from ${cats.slice(0,2).join(" and ")}.`:"";
  const list=named.length===2?`${named[0]} and ${named[1]}`:(named[0]||"the answers you gave");
  return {
    text:`You repeatedly showed ${list}.${catText} That pattern in your own answers is why this appeared — a reason to test the work, not a prediction that it will fit.`,
    live:true, strongest:strongest.dim
  };
}

/* The conditional alternative Part 4 asks for: "if you like X but dislike Y".
   Built from the tradeoffs the profile already declares, so the caveat is
   about the field rather than a guess about the student. */
function alternativeIfLine(name){
  const ev=pathwayEvidence(name);
  if(!ev) return "";
  const alts=(ev.profile.alt||[]).slice(0,3);
  if(!alts.length) return "";
  const friction=(ev.profile.tradeoffs||[])[0];
  return friction
    ? `If you like ${name} but dislike ${friction.toLowerCase()}, consider ${alts.join(", ")} instead.`
    : `Related directions that share the same core work: ${alts.join(", ")}.`;
}

/* Order by evidence match, best-supported first. */
function pathwaysByEvidence(){
  if(!hasEvidence()) return pathways.slice();
  return pathways.slice().sort((a,b)=>{
    const ea=pathwayEvidence(a.name), eb=pathwayEvidence(b.name);
    if(!ea&&!eb) return 0;
    if(!ea) return 1;
    if(!eb) return -1;
    const sum=x=>x.matched.reduce((n,m)=>n+(m.weight*m.value),0);
    return sum(eb)-sum(ea);
  });
}

function renderPathways(){
  const ordered=pathwaysByEvidence();
  const evidence=hasEvidence();
  const note=document.getElementById("pathwaysOrderNote");
  if(note) note.innerHTML=evidence
    ? "Ordered by how well your own answers matched each direction — <b>not</b> a ranking of which career is best. Every one of these is worth exploring; the order is evidence, not a verdict."
    : "Currently in a default order — you have not answered the questionnaire yet, so nothing here is personalised. Once you answer, every card will explain why it appeared.";
  const grid=$("#pathGrid");
  if(grid) grid.innerHTML=ordered.map(p=>pathCardHtml(p,evidence)).join("");
}

function pathCardHtml(p,evidence){
  const why=whyThisAppeared(p.name);
  const altIf=evidence?alternativeIfLine(p.name):"";
  const weakClass=why.weak?" why-weak":"";
    return `<article class="path-card${weakClass}">
     <div class="path-card-media">
       <img src="${p.img}" alt="${escapeHtml(p.name)}" loading="lazy" decoding="async" class="path-img" onerror="this.style.display='none'">
       <span class="tag path-tag-overlay">${p.tag}</span>
     </div>
     <div class="path-card-body">
       <h3>${p.icon} ${p.name}</h3>
       <div class="why-box">
         <b class="why-label">Why this appeared</b>
         <p>${escapeHtml(why.text)}</p>
       </div>
       <p class="reason muted">${escapeHtml(p.reason)}</p>
       <div class="path-meta-rows">
         <p><b>Core Skills:</b> ${p.skills}</p>
         <p><b>Education:</b> ${p.edu}</p>
         <p><b>Work Style:</b> ${p.work}</p>
         <p><b style="color:#ba3b20">Challenges:</b> ${p.challenge}</p>
         <p><b style="color:#22865c">30-Day Test:</b> ${p.experiment}</p>
       </div>
       ${altIf?`<div class="alt-if"><b>Consider instead</b><p>${escapeHtml(altIf)}</p></div>`:""}
     </div>
     <div class="path-actions">
       <button class="small-btn save" onclick="toggleSave('${escapeHtml(p.name)}')">${state.saved.includes(p.name)?"✓ Saved":"♡ Save"}</button>
       <button class="small-btn primary-btn" onclick="startExperimentFromPathway('${escapeHtml(p.name)}')">▶ Try this pathway</button>
       <button class="small-btn" onclick="viewPathwayEd('${escapeHtml(p.name)}')">🎓 Unis</button>
       <button class="small-btn" onclick="quickCompare('${escapeHtml(p.name)}')">⇄ Compare</button>
     </div>
    </article>`;
  }

function toggleSave(name){
 state.saved=state.saved.includes(name)?state.saved.filter(x=>x!==name):[...state.saved,name];
 try{trackCareersExplored(name)}catch(e){}
 saveState();renderPathways();renderSaved();updateUI();
 toast(state.saved.includes(name)?"Pathway saved to your dashboard!":"Pathway removed from saved.");
}

function viewPathwayEd(name){
 state.eduPathway=name;
 goTab("education");
 renderEducation(name);
}

function quickCompare(name){
 if(!state.compareSelected.includes(name)){
   if(state.compareSelected.length>=4) state.compareSelected.shift();
   state.compareSelected.push(name);
 }
 goTab("compare");
}

function renderSaved(){
 if(!state.saved.length){
   $("#saved").innerHTML='<div class="card"><p class="muted">No pathways saved yet. Explore the recommended pathways and click "♡ Save" to curate the careers you want to investigate.</p><button class="btn primary" style="margin-top:12px" onclick="goTab(\'pathways\')">Explore pathways →</button></div>';
   return;
 }
 $("#saved").innerHTML=`<div class="saved-list">${state.saved.map(n=>{
   const p=pathways.find(x=>x.name===n)||{name:n,reason:"Custom saved direction",skills:"Research & development",experiment:"Run a small 30-day experiment."};
   const note=(state.savedNotes&&state.savedNotes[n])||"";
   return `<div class="card" style="margin-bottom:14px">
     <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
       <h3 style="margin:0">${p.icon||"✦"} ${p.name}</h3>
       <div style="display:flex;gap:6px">
         <button class="small-btn" onclick="viewPathwayEd('${escapeHtml(p.name)}')">🎓 Universities</button>
         <button class="small-btn" onclick="quickCompare('${escapeHtml(p.name)}')">⇄ Compare</button>
         <button class="small-btn" onclick="toggleSave('${escapeHtml(p.name)}')">Remove</button>
       </div>
     </div>
     <p class="muted" style="margin:8px 0">${p.reason}</p>
     <div style="margin-top:10px">
       <label style="font-size:11.5px;font-weight:700;color:#5e50d9;display:block;margin-bottom:4px">Your Research & Experiment Notes:</label>
       <textarea class="open" style="min-height:65px;font-size:12.5px" placeholder="Jot down people you talked to, questions you have, or experiment notes..." oninput="saveSavedNote('${escapeHtml(p.name)}', this.value)">${escapeHtml(note)}</textarea>
     </div>
   </div>`;
 }).join("")}</div>`;
}

function saveSavedNote(name, note){
 state.savedNotes=state.savedNotes||{};
 state.savedNotes[name]=note;
 try{trackCareersExplored(name)}catch(e){}
 saveState();
}

function toggleComparePathway(name){
 if(state.compareSelected.includes(name)){
   state.compareSelected=state.compareSelected.filter(x=>x!==name);
 } else {
   if(state.compareSelected.length>=4){
     toast("You can compare up to 4 pathways at a time.");
     return;
   }
   state.compareSelected.push(name);
 }
 renderCompare();
}

function renderCompare(){
 if(!state.compareSelected||state.compareSelected.length===0){
   state.compareSelected=pathways.slice(0,3).map(p=>p.name);
 }
 const selectedPaths=pathways.filter(p=>state.compareSelected.includes(p.name));

 const selectorHtml=`<div class="card" style="margin-bottom:18px">
   <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;flex-wrap:wrap;gap:8px">
     <b>Select 2 to 4 pathways to compare:</b>
     <small class="muted">${selectedPaths.length} / 4 selected</small>
   </div>
   <div class="chips2">${pathways.map(p=>{
     const sel=state.compareSelected.includes(p.name);
     return `<button type="button" class="chip ${sel?'active':''}" style="cursor:pointer;border:${sel?'1.5px solid #6c5ce7':'1px solid #e3e1ed'};background:${sel?'#efedff':'#fff'};color:${sel?'#5d50d5':'#4d4e63'}" onclick="toggleComparePathway('${escapeHtml(p.name)}')">${sel?'✓ ':''}${p.name}</button>`;
   }).join("")}</div>
 </div>`;

 const tableHtml=`<div class="table-wrap">
   <table class="compare">
     <thead>
       <tr>
         <th style="min-width:140px">Dimension</th>
         ${selectedPaths.map(p=>`<th style="min-width:210px"><div style="font-size:16px;margin-bottom:4px">${p.icon} ${p.name}</div><span class="tag">${p.tag}</span></th>`).join("")}
       </tr>
     </thead>
     <tbody>
       <tr>
         <th>Why it matches</th>
         ${selectedPaths.map(p=>`<td>${p.reason}</td>`).join("")}
       </tr>
       <tr>
         <th>Core Skills</th>
         ${selectedPaths.map(p=>`<td><b>${p.skills}</b></td>`).join("")}
       </tr>
       <tr>
         <th>Education & Degrees</th>
         ${selectedPaths.map(p=>`<td>${p.edu}</td>`).join("")}
       </tr>
       <tr>
         <th>Work Style</th>
         ${selectedPaths.map(p=>`<td>${p.work}</td>`).join("")}
       </tr>
       <tr>
         <th>Challenges & Trade-offs</th>
         ${selectedPaths.map(p=>`<td><span style="color:#a04020">${p.challenge}</span></td>`).join("")}
       </tr>
       <tr>
         <th>30-Day Experiment</th>
         ${selectedPaths.map(p=>`<td><span style="color:#207050">${p.experiment}</span></td>`).join("")}
       </tr>
       <tr>
         <th>Actions</th>
         ${selectedPaths.map(p=>`<td><button class="small-btn save" onclick="toggleSave('${escapeHtml(p.name)}')">${state.saved.includes(p.name)?"✓ Saved":"♡ Save"}</button> <button class="small-btn" onclick="viewPathwayEd('${escapeHtml(p.name)}')">Universities →</button></td>`).join("")}
       </tr>
     </tbody>
   </table>
 </div>
 <div class="notice" style="margin-top:14px"><b>✦ Plain-Language Comparison:</b> We never generate fake scientific match percentages (like '97% match'). Comparison is meant to clarify trade-offs, required skills, and real-world experiments so you can make deliberate choices.</div>`;

 $("#compare").innerHTML=selectorHtml+tableHtml;
}

/* One card in "Target Universities & Programs".
   The flag is an SVG sprite from lipis/flag-icons — an empty <span> whose
   class carries the ISO 3166-1 alpha-2 code (Wikipedia keeps the canonical
   list). No emoji flags, so the rendering is identical on every OS. */
function countryFlag(code){
  return `<span class="fi fis fi-${escapeHtml(String(code||'').toLowerCase())} country-flag" aria-hidden="true"></span>`;
}
function countryProgramCard({code,name,universities,exams}){
  const uni=universities||"Not yet documented for this pathway. Verify against official sources before relying on it.";
  const test=exams||"University-specific entrance examinations.";
  return `<div class="country-card">
    <div class="country-card-head">${countryFlag(code)}<b>${escapeHtml(name)}</b></div>
    <p class="country-card-label">Universities & Programs</p>
    <p class="country-card-text">${escapeHtml(uni)}</p>
    <p class="country-card-label">Entrance Tests</p>
    <p class="country-card-text">${escapeHtml(test)}</p>
  </div>`;
}

function renderEducation(targetName){
 const pName=targetName||state.eduPathway||pathways[0].name;
 state.eduPathway=pName;
 const p=pathways.find(x=>x.name===pName)||pathways[0];
 const guide=p.educationGuide||{
   degrees:p.edu,
   universities:{ph:"UP, DLSU, Ateneo, UST",us:"MIT, Stanford, Berkeley",uk:"Oxford, Cambridge, UCL",global:"NUS, Toronto, Melbourne"},
   admission:"Solid secondary school foundation in relevant subjects.",
   tests:"University-specific entrance examinations.",
   scholarships:"National government and university merit grants.",
   timeline:"Grade 11: Foundation & exploration; Grade 12: Applications & testing.",
   routes:[{title:"University Degree",desc:"Standard Bachelor's program."}]
 };

 $("#educationContainer").innerHTML=`
   <div class="card" style="margin-bottom:18px">
     <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:14px">
       <div><span class="eyebrow">SELECT PATHWAY</span><h2 style="margin:4px 0 0;font-size:22px">${p.icon} ${p.name}</h2></div>
       <select style="padding:10px 14px;border-radius:10px;border:1.5px solid #d9d5eb;font-weight:700;color:#5d50d5;background:#f8f7fe;cursor:pointer" onchange="renderEducation(this.value)">
         ${pathways.map(item=>`<option value="${escapeHtml(item.name)}" ${item.name===p.name?"selected":""}>${item.icon} ${item.name}</option>`).join("")}
       </select>
     </div>
     <div class="notice" style="background:#f4f7fe;border-color:#d0ddf9;color:#24447a">
       <b>✦ Context Principle:</b> No single university is universally 'best'. The optimal choice depends directly on your <b>personal goals, target country, family budget, and academic profile</b>.
     </div>
   </div>

   <div class="analysis-grid">
     <div class="analysis-box">
       <span class="tag">DEGREES & MAJORS</span>
       <h3 style="margin-top:10px">Relevant Degrees</h3>
       <p><b>${guide.degrees}</b></p>
       <p class="muted">Check specific department specializations and curriculum accreditation before applying.</p>
     </div>

     <div class="analysis-box">
       <span class="tag">ADMISSION & STRANDS</span>
       <h3 style="margin-top:10px">Admission Requirements</h3>
       <p>${guide.admission}</p>
     </div>

     <div class="analysis-box full">
       <span class="tag">GLOBAL & LOCAL PROGRAMS</span>
       <h3 style="margin-top:10px">Target Universities & Programs</h3>
       <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px;margin-top:10px">
         ${countryProgramCard({
           code:"ph", name:"Philippines",
           universities:guide.universities.ph,
           exams:guide.testsPhilippines||guide.tests
         })}
         ${countryProgramCard({
           code:"us", name:"United States",
           universities:guide.universities.us,
           exams:guide.testsUnitedStates||guide.tests
         })}
         ${countryProgramCard({
           code:"gb", name:"United Kingdom",
           universities:guide.universities.uk,
           exams:guide.testsUnitedKingdom||guide.tests
         })}
         ${countryProgramCard({
           code:"in", name:"India",
           universities:guide.universities.india||"Not yet documented for this pathway. Use the general India guidance below and verify against official sources.",
           exams:guide.testsIndia||guide.tests
         })}
         ${countryProgramCard({
           code:"ca", name:"Canada",
           universities:guide.universities.canada||guide.universities.global,
           exams:guide.testsInternational||guide.tests
         })}
         ${countryProgramCard({
           code:"sg", name:"Singapore",
           universities:guide.universities.singapore||guide.universities.global,
           exams:guide.testsInternational||guide.tests
         })}
         ${countryProgramCard({
           code:"au", name:"Australia",
           universities:guide.universities.australia||guide.universities.global,
           exams:guide.testsInternational||guide.tests
         })}
         ${countryProgramCard({
           code:"eu", name:"Europe (EU)",
           universities:guide.universities.europe||guide.universities.global,
           exams:guide.testsInternational||guide.tests
         })}
       </div>
     </div>

     <div class="analysis-box">
       <span class="tag">ENTRANCE EXAMS</span>
       <h3 style="margin-top:10px">Entrance Tests & Aptitude</h3>
       <p>${guide.tests}</p>
     </div>

     <div class="analysis-box">
       <span class="tag">FINANCIAL AID & GRANTS</span>
       <h3 style="margin-top:10px">Scholarships & Aid</h3>
       <p>${guide.scholarships}</p>
     </div>

     <div class="analysis-box full">
       <span class="tag">APPLICATION SCHEDULE</span>
       <h3 style="margin-top:10px">Application Timeline & Milestones</h3>
       <p>${guide.timeline}</p>
     </div>

     <div class="analysis-box full">
       <span class="tag">ALTERNATIVE PATHWAYS</span>
       <h3 style="margin-top:10px">4 Different Education Routes to Test</h3>
       <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin-top:10px">
         ${(guide.routes||[]).map(r=>`
           <div style="background:#fff;border:1.5px solid #e8e6f3;border-radius:14px;padding:14px">
             <b style="color:#5e50d9;font-size:13.5px;display:block;margin-bottom:4px">◈ ${r.title}</b>
             <p style="font-size:12px;color:#6b6d82;margin:0;line-height:1.45">${r.desc}</p>
           </div>
         `).join("")}
       </div>
     </div>

     ${(guide.indiaRoutes||[]).length?`<div class="analysis-box full">
       <span class="tag">INDIA ROUTES</span>
       <h3 style="margin-top:10px;display:flex;align-items:center;gap:9px">${countryFlag("in")} Education Routes in India</h3>
       <p class="muted" style="margin-top:6px">India runs on entrance examinations, and each of these is a genuinely different route into the same work — not a lesser version of the degree above. Entry cut-offs and exam patterns change every year, so verify against the current official brochure.</p>
       <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin-top:10px">
         ${guide.indiaRoutes.map(r=>`
           <div style="background:#fff;border:1.5px solid #e8e6f3;border-radius:14px;padding:14px">
             <b style="color:#5e50d9;font-size:13.5px;display:block;margin-bottom:4px">◈ ${r.title}</b>
             <p style="font-size:12px;color:#6b6d82;margin:0;line-height:1.45">${r.desc}</p>
           </div>
         `).join("")}
       </div>
     </div>`:""}
   </div>
 `;
}

function renderHistory(){
 const list=state.history||[];
 if(!list.length){
   $("#historyContainer").innerHTML=`<div class="card"><p class="muted">No previous sessions archived yet. As you retake the questionnaire over time, your completed analyses and interest snapshots will be recorded here so you can revisit how your goals and curiosities evolve.</p><button class="btn primary" style="margin-top:12px" onclick="retakeQuestionnaire()">Start Questionnaire Session →</button></div>`;
   return;
 }
 $("#historyContainer").innerHTML=`
   <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
     <b>${list.length} Archived Questionnaire Session${list.length>1?'s':''}</b>
     <button class="btn soft" onclick="retakeQuestionnaire()">+ Take new session</button>
   </div>
   <div style="display:grid;gap:14px">
     ${list.map((h,idx)=>`
       <div class="card">
         <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px">
           <div>
             <span class="tag">SESSION #${list.length - idx}</span>
             <h3 style="margin:6px 0 2px">${h.date}</h3>
             <small class="muted">${h.answered} / 20 questions completed</small>
           </div>
           <div class="chips2">
             ${(h.topPathways||[]).map(p=>`<span class="chip" style="font-size:11px">★ ${p}</span>`).join("")}
           </div>
         </div>
       </div>
     `).join("")}
   </div>
 `;
}

/* Pick the pathway the roadmap should be built around: the pathway that opened
   the focused experiment, else the first saved pathway, else the first shown. */
function activeRoadmapPathway(){
 const expKey=state.expFocus;
 if(expKey){
  /* The pathway that actually opened this experiment wins, so a verdict the
     student just recorded is never orphaned. */
  const opened=(state.expPathway||{})[expKey];
  if(opened) return opened;
  const savedHit=(state.saved||[]).find(n=>clusterForPathway(n)===expKey);
  if(savedHit) return savedHit;
  const aiHit=(state.aiResult?.pathways||[]).map(p=>p.name).find(n=>clusterForPathway(n)===expKey);
  if(aiHit) return aiHit;
 }
 if((state.saved||[]).length) return state.saved[0];
 if((state.aiResult?.pathways||[]).length) return state.aiResult.pathways[0].name;
 return null;
}
function pathwayRecord(name){
 if(!name) return null;
 return pathways.find(p=>p.name===name)||null;
}

/* The chain: Career -> Skills -> Subjects -> Degree options -> Universities
   -> Exams -> Projects -> Experiments -> Next steps. Each link is filled from
   real pathway/education data where we have it, and says plainly when the
   school must supply the specific detail. */

/* What the experiment link says once the student has actually run it. The
   roadmap is supposed to consume the exploration result rather than repeat the
   invitation, so a recorded verdict changes both the Experiments and the Next
   steps lines. An unfinished experiment keeps the original prompt. */
function experimentChainLine(exp){
 const s=(state.experiments||{})[exp.key]||{};
 const days=(s.done||[]).length;
 const answered=s.enjoyment!==null&&s.enjoyment!==undefined;
 if(answered){
  const verdict={yes:"you enjoyed the actual work",mixed:"you enjoyed only part of it",no:"you did not enjoy the actual work"}[s.enjoyment]||s.enjoyment;
  return `Done — after ${days}/7 days you reported that ${verdict}. That result, not the experiment, is what the rest of this roadmap should be built on.`;
 }
 if(days){
  return `${exp.title} — day ${days} of 7 recorded. Finish the week, then answer honestly whether you enjoyed the work.`;
 }
 return `${exp.title} — the 7-day exploration in the Experiments tab. Finish it, then answer honestly whether you enjoyed the work.`;
}

function nextStepForExperiment(exp){
 const s=(state.experiments||{})[exp.key]||{};
 const answered=s.enjoyment!==null&&s.enjoyment!==undefined;
 if(answered){
  if(s.enjoyment==="yes") return "You confirmed you want more of this work. Build a larger project in the same direction and check this pathway's prerequisite subjects before committing to a degree.";
  if(s.enjoyment==="mixed") return "A mixed result is real information. Run the experiment for a neighbouring family before you commit, and compare the two verdicts.";
  return "Ruling a direction out this early is progress, not failure. Pick a different pathway and start its day 1 — the second experiment tells you more than the first.";
 }
 return `Start day 1 of ${exp.title}, then update this roadmap with what you learned.`;
}
function roadmapChainRows(name){
 const p=pathwayRecord(name);
 const eg=p&&p.educationGuide?p.educationGuide:null;
 const exp=experimentForPathway(name);
 const chain=roadmapChainData();
 const grade=state.user?.grade||"your current grade";
 const val={
  "Career": p?`${p.icon||"✦"} ${p.name}`:`${name||"Not chosen yet"}`,
  "Skills": p?p.skills:"Choose a pathway and its core skills appear here.",
  "Subjects": eg?eg.admission:`Focus on the school subjects that overlap with ${name||"your chosen direction"}.`,
  "Degree options": eg?eg.degrees:(p?p.edu:"Degree options appear once a pathway is chosen."),
  "Universities": eg?`PH: ${eg.universities.ph}. US: ${eg.universities.us}. UK: ${eg.universities.uk}. Global: ${eg.universities.global}`:"University lists appear with the pathway's education guide. Verify every program against the current official prospectus.",
  "Exams": eg?eg.tests:`Entrance exams depend on your target country and pathway. Check official admissions pages for ${grade}.`,
  "Projects": `Build one portfolio piece that proves you can do this work — specific, finished, and showable to a stranger.`,
  "Experiments": exp?experimentChainLine(exp):"Run a 7-day exploration from the Experiments tab before committing to a degree.",
  "Next steps": exp?nextStepForExperiment(exp):`Pick a pathway, open its experiment, and begin day 1.`
 };
 return chain.map((k,i)=>`<li class="chain-row"><span class="chain-num">${i+1}</span><div><b>${k}</b><p>${escapeHtml(String(val[k]||""))}</p></div></li>`).join("");
}

/* Alternative routes — the roadmap must not assume a traditional degree. */
function alternativeRoutesHtml(name){
 const p=pathwayRecord(name);
 const eg=p&&p.educationGuide?p.educationGuide:null;
 const routes=eg&&eg.routes&&eg.routes.length?eg.routes:[
  {title:"4-Year University Degree",desc:"The traditional route. Strongest if your target profession requires a licence or a graduate degree."},
  {title:"Polytechnic / Associate Diploma",desc:"A 2-3 year applied diploma. Faster entry to paid work, lower cost, and you can upgrade to a degree later."},
  {title:"Apprenticeship / On-the-job training",desc:"Earn while you learn under supervision. Strongest in technical, trade and service fields."},
  {title:"Self-taught + portfolio",desc:"Free open resources plus a public body of finished work. Strongest where employers check what you built."}
 ];
 return routes.map(r=>`<div class="route-card"><b>◈ ${escapeHtml(r.title)}</b><p>${escapeHtml(r.desc)}</p></div>`).join("");
}

function renderRoadmapImpl(){
 const g=state.user?.grade||"Grade 10";
 const c=state.user?.country||"Philippines";
 const target=state.user?.targetCountry||"Domestic / Home Country";
 $("#roadmapGrade").textContent=`Personalized action roadmap for ${state.user?.name||"Student"} (${g}, ${c} → Target: ${target}). Adapt this roadmap to your family budget, target deadlines, and experimental learnings.`;
 const name=activeRoadmapPathway();
 $("#roadmap").innerHTML=`
   <div class="roadmap-card">
     <div style="display:flex;justify-content:space-between;align-items:center"><h3>The full chain</h3><span class="tag">PATHWAY PLAN</span></div>
     <p class="muted">${name?`Built around <b>${escapeHtml(name)}</b>. Every link is filled from your pathway and education data — and says so plainly when your school must confirm the specific detail.`:"Choose a pathway first and this chain fills itself in from your own answers, not from a template."}</p>
     <ol class="chain">${roadmapChainRows(name)}</ol>
     ${name?`<button class="btn primary" onclick="startExperimentFromPathway('${escapeHtml(name)}')">▶ Run the 7-day experiment</button>`:`<button class="btn primary" data-tab="pathways">Explore pathways →</button>`}
   </div>
   <div class="roadmap-card">
     <div style="display:flex;justify-content:space-between;align-items:center"><h3>Alternative routes</h3><span class="tag">NOT ONLY A DEGREE</span></div>
     <p class="muted">A university degree is one route, not the route. These alternatives can reach the same work, often faster and cheaper — and none of them is a lesser version.</p>
     <div class="route-grid">${alternativeRoutesHtml(name)}</div>
   </div>
   <div class="roadmap-card">
     <div style="display:flex;justify-content:space-between;align-items:center"><h3>Phase 1 · Next 30 Days</h3><span class="tag">EXPLORE</span></div>
     <p class="muted">Run one 7-day experiment from the Experiments tab. Talk to one person already doing this work. Record what you enjoyed and what you disliked — not how well you performed.</p>
   </div>
   <div class="roadmap-card">
     <div style="display:flex;justify-content:space-between;align-items:center"><h3>Phase 2 · Next 6 Months</h3><span class="tag">BUILD</span></div>
     <p class="muted">Deepen the prerequisite subjects for this pathway, join a relevant club or competition, and finish one substantial project you can show someone.</p>
   </div>
   <div class="roadmap-card">
     <div style="display:flex;justify-content:space-between;align-items:center"><h3>Phase 3 · Next 1–2 Years</h3><span class="tag">APPLY</span></div>
     <p class="muted">Prepare the entrance exams listed in the chain, apply for the scholarships you qualify for, compare admission and financial-aid offers, and confirm your chosen route against current official sources.</p>
   </div>
 `;
}

function loadProfile(){
 const f=$("#profile");if(!state.user)return;
 for(const el of f.elements){
   if(el.name&&state.user[el.name]!=null)el.value=state.user[el.name];
 }
}

$("#profile").onsubmit=e=>{
 e.preventDefault();
 const updatedData = Object.fromEntries(new FormData(e.target).entries());
 state.user={...state.user,...updatedData};
 if(state.accounts && state.user.email){
   state.accounts[state.user.email]={...state.accounts[state.user.email],...state.user};
 }
 saveState();
 updateUI();
 toast("Student profile & preferences updated.");
 if(state.user){
   fetch('/api/user/profile', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ userId: state.user.id, email: state.user.email, ...updatedData })
   }).catch(()=>{});
 }
};

$("#feedback").onsubmit=e=>{
 e.preventDefault();
 const payload=Object.fromEntries(new FormData(e.target).entries());
 localStorage.setItem("yp_feedback_v3",JSON.stringify(payload));
 try{trackFeedback(payload);renderEvidenceReadout()}catch(err){}
 e.target.reset();toast("Feedback submitted. Thank you for helping improve Your Path!");
};

$("#accept").onclick=()=>{localStorage.setItem(STORE.cookie,"accepted");$("#cookie").style.display="none";toast("Cookie preference saved.")};
$("#essential").onclick=()=>{localStorage.setItem(STORE.cookie,"essential");$("#cookie").style.display="none";toast("Essential-only preference saved.")};
$("#cookieSettings").onclick=()=>$("#cookie").style.display="flex";
if(localStorage.getItem(STORE.cookie))$("#cookie").style.display="none";

ensureSession();updateUI();renderQuestion();

async function refreshCloudProgress(){
  if(!state.user || (!state.user.id && !state.user.email)) return;
  try {
    const userId = state.user.id || state.user.email;
    const res = await fetch(`/api/progress/${encodeURIComponent(userId)}`);
    if(res.ok) {
      const fetched = await res.json();
      if(fetched && (fetched.answers || fetched.saved)) {
        if(fetched.answers && Object.keys(fetched.answers).length > 0) state.answers = fetched.answers;
        if(fetched.saved && Array.isArray(fetched.saved)) state.saved = fetched.saved;
        if(fetched.savedNotes && typeof fetched.savedNotes === 'object') state.savedNotes = fetched.savedNotes;
        if(fetched.experiments && typeof fetched.experiments === 'object') state.experiments = fetched.experiments;
        if(fetched.session && fetched.session.ids) state.session = fetched.session;
        if(typeof fetched.qIndex === 'number') state.qIndex = fetched.qIndex;
        updateUI();
      }
    }
  } catch(e){}
}
refreshCloudProgress();

window.newQuestionSession=()=>{newSession();renderQuestion();toast("New 20-question session generated.")};
window.retakeQuestionnaire=retakeQuestionnaire;
window.renderEducation=renderEducation;
window.viewPathwayEd=viewPathwayEd;
window.toggleComparePathway=toggleComparePathway;
window.quickCompare=quickCompare;
window.saveSavedNote=saveSavedNote;
window.goTab=goTab;window.requireLogin=requireLogin;window.toggleSave=toggleSave;
window.startExperimentFromPathway=startExperimentFromPathway;
window.toggleExpDay=toggleExpDay;window.setExpEnjoyment=setExpEnjoyment;window.saveExpNote=saveExpNote;
window.renderExperiments=renderExperiments;
window.resetEvidence=resetEvidence;window.renderEvidenceReadout=renderEvidenceReadout;

document.addEventListener("keydown",e=>{if(e.key==="Escape"){$$(".modal-backdrop").forEach(m=>m.classList.add("hidden"))}});

/* ================= AI ORCHESTRATOR v5 ================= */
const AI_STORE={session:'yp_ai_session_v5',result:'yp_ai_result_v5'};
state.aiSession=localStorage.getItem(AI_STORE.session)||null;
state.aiResult=JSON.parse(localStorage.getItem(AI_STORE.result)||'null');
state.aiQuestion=null;

function aiApi(path, body){
  return fetch(path,{method:'POST',headers:{'Content-Type':'application/json','X-Session-Id':state.aiSession||''},body:JSON.stringify(body||{})}).then(async r=>{const d=await r.json().catch(()=>({error:'Invalid server response'}));if(!r.ok)throw new Error(d.error||`AI request failed (${r.status})`);return d});
}
function setAIStatus(text,kind='idle'){
  let el=$('#aiStatus');
  if(!el){const head=document.querySelector('.dash-head');if(!head)return;el=document.createElement('div');el.id='aiStatus';el.className='ai-status';head.appendChild(el)}
  el.className=`ai-status ${kind}`;el.innerHTML=`<span class="ai-dot"></span><span>${escapeHtml(text)}</span>`;
}
function saveAI(){if(state.aiSession)localStorage.setItem(AI_STORE.session,state.aiSession);if(state.aiResult)localStorage.setItem(AI_STORE.result,JSON.stringify(state.aiResult));}
async function startAISession(){
  if(!state.user)return;
  setAIStatus('AI is preparing your adaptive questionnaire…','loading');
  try{
    const d=await aiApi('/api/ai/start',{profile:state.user});
    state.aiSession=d.sessionId;state.aiQuestion=d.question;state.qIndex=0;state.answers={};state.aiResult=null;saveAI();saveState();
    renderAIQuestion();updateAIJourney();setAIStatus('AI interviewer is active','ready');
  }catch(e){setAIStatus('AI server not connected — demo questionnaire available','warning');toast(e.message);ensureSession();renderQuestion();}
}
function aiAnswerValue(q){
  if(q.type==='open')return $('#aiOpen')?.value||'';
  if(q.type==='rank')return $$('#aiQuestionCard select').map(x=>x.value);
  if(q.type==='multi')return $$('#aiQuestionCard input[type=checkbox]:checked').map(x=>x.value);
  return $$('#aiQuestionCard input[name=aiAnswer]:checked')[0]?.value||'';
}
function renderAIQuestion(){
  const q=state.aiQuestion;if(!q)return;
  const n=(state.qIndex||0)+1;$('#qCount').textContent=`${n} / 20`;
  $('#selectionInfo').innerHTML=`<b>AI adaptive selection</b><br><br>The AI chose this question from your previous responses and the information it still needs. It may change the next question when your answers reveal a new direction.<br><br><span class="muted">This is not a psychological score.</span>`;
  let body='';
  if(q.type==='open') body=`<textarea class="open" id="aiOpen" placeholder="Answer honestly. A few sentences are enough."></textarea>`;
  else if(q.type==='scale') body=`<div class="scale">${(q.scaleLabels||['Strongly disagree','Disagree','Neutral','Agree','Strongly agree']).map((x,i)=>`<label><input type="radio" name="aiAnswer" value="${i+1}">${i+1}<small>${escapeHtml(x)}</small></label>`).join('')}</div>`;
  else if(q.type==='rank') body=`<div class="rank" id="aiQuestionCard">${(q.options||[]).map(o=>`<div><span>${escapeHtml(o)}</span><select><option value="">Rank</option>${[1,2,3,4,5].map(n=>`<option>${n}</option>`).join('')}</select></div>`).join('')}</div>`;
  else body=`<div class="options">${(q.options||[]).map(o=>`<label class="option"><input type="${q.type==='multi'?'checkbox':'radio'}" name="aiAnswer" value="${escapeHtml(o)}"><span>${escapeHtml(o)}</span></label>`).join('')}</div>`;
  $('#question').innerHTML=`<div class="question-card ai-question-card" id="aiQuestionCard"><div class="question-type">AI ADAPTIVE · ${escapeHtml(q.dimension||'Your Path')}</div><h3>${escapeHtml(q.question)}</h3>${body}<p class="muted">There is no socially correct answer. The AI will use your answer to decide what to explore next.</p><div class="ai-why">✦ ${escapeHtml(q.why||'This question helps the AI understand a part of your preferences.')}</div><div class="question-nav"><button class="btn soft" id="aiBack" ${n===1?'disabled':''}>← Back</button><button class="btn primary" id="aiNext">${n===20?'Finish & analyze':'Next →'}</button></div></div>`;
  $$('#question input').forEach(x=>x.addEventListener('change',()=>{$$('.option').forEach(o=>{const inp=o.querySelector('input');if(inp)o.classList.toggle('selected',inp.checked)})}));
  $('#aiBack').onclick=()=>{toast('Adaptive back-navigation is intentionally limited so the AI can keep the interview sequence coherent.');};
  $('#aiNext').onclick=submitAIAnswer;
}
async function submitAIAnswer(){
  const q=state.aiQuestion;const answer=aiAnswerValue(q);
  if(answer===''||(Array.isArray(answer)&&answer.every(x=>!x))){toast('Choose or write an answer before continuing.');return;}
  const btn=$('#aiNext');btn.disabled=true;btn.textContent='AI thinking…';setAIStatus(`AI is reviewing answer ${state.qIndex+1}…`,'loading');
  try{
    const d=await aiApi('/api/ai/answer',{question:q.question,answer});
    state.answers[`AI_${state.qIndex+1}`]=answer;saveState();
    if(d.complete){state.aiResult=d.analysis;state.qIndex=20;saveAI();renderAIResult();renderInterestMapFromAI();updateAIJourney();goTab('analysis');setAIStatus('AI analysis complete','ready');toast('Your adaptive interview is complete.');}
    else{state.qIndex=d.number-1;state.aiQuestion=d.question;saveAI();renderAIQuestion();setAIStatus(`AI interviewer — question ${d.number} of 20`,'ready');}
  }catch(e){btn.disabled=false;btn.textContent=(state.qIndex===19?'Finish & analyze':'Next →');setAIStatus('AI request failed','warning');toast(e.message);}
}
function renderAIResult(){
  if(!state.aiResult)return;
  const a=state.aiResult;
  $('#analysisIntro').textContent='The AI has synthesized your answers into hypotheses, evidence, uncertainty and pathways. These are exploration aids—not a verdict about your future.';
  const list=(x)=>Array.isArray(x)?x.map(v=>`<li>${escapeHtml(v)}</li>`).join(''):'';
  const pressure=(a.pressureSignals||[]).map(x=>`<div class="signal"><b>${escapeHtml(x.area)}</b><span>${escapeHtml(x.level)}</span><p>${escapeHtml(x.evidence)}</p></div>`).join('')||'<p class="muted">No strong signal identified from this short interview.</p>';
  const contradictions=(a.contradictions||[]).map(x=>`<div class="signal"><b>${escapeHtml(x.signal)}</b><p>${escapeHtml(x.evidence)}</p><small>Follow-up: ${escapeHtml(x.followUp)}</small></div>`).join('')||'<p class="muted">No major contradiction was identified in this session.</p>';
  $('#analysis').innerHTML=`<div class="ai-banner"><span class="ai-orb">✦</span><div><b>AI-guided analysis</b><p>${escapeHtml(a.summary||'Analysis generated from your adaptive interview.')}</p></div></div><div class="analysis-grid"><div class="analysis-box"><h3>Interest signals</h3><div class="interest-ai-bars">${Object.entries(a.interestMap||{}).map(([k,v])=>`<div><span>${escapeHtml(k)}</span><i><em style="width:${Math.max(0,Math.min(100,Number(v)||0))}%"></em></i><b>${Math.round(Number(v)||0)}</b></div>`).join('')}</div></div><div class="analysis-box"><h3>Strength signals</h3><ul>${list(a.strengthSignals)||'<li>More evidence is needed.</li>'}</ul><h3>Areas to develop</h3><ul>${list(a.developmentAreas)||'<li>More evidence is needed.</li>'}</ul></div><div class="analysis-box"><h3>Working style hypothesis</h3><p>${escapeHtml(a.workingStyleHypothesis||'Not enough evidence yet.')}</p></div><div class="analysis-box"><h3>External-pressure reflection</h3>${pressure}<p class="muted">These are response-pattern indicators, not claims about what you think.</p></div><div class="analysis-box full"><h3>Contradictions worth exploring</h3>${contradictions}</div><div class="analysis-box full"><h3>Uncertainty</h3><ul>${list(a.uncertainty)||'<li>This is only one 20-question session.</li>'}</ul></div><div class="analysis-box full"><h3>AI next step</h3><p>Explore the pathways, choose a few experiments, then return later with new evidence. Your answers can change over time.</p><button class="btn primary" onclick="goTab('pathways')">Explore AI pathways →</button></div></div>`;
}
function renderAIPatways(){
  const ps=state.aiResult?.pathways||[];if(!ps.length){renderPathways();return;}
  $('#pathGrid').innerHTML=ps.map((p,i)=>`<article class="path-card ai-path"><span class="tag">AI pathway ${i+1}</span><h3>✦ ${escapeHtml(p.name)}</h3><p class="reason">${escapeHtml(p.why)}</p><p><b>Interests:</b> ${escapeHtml((p.interests||[]).join(', '))}</p><p><b>Skills:</b> ${escapeHtml((p.skills||[]).join(', '))}</p><p><b>Useful subjects:</b> ${escapeHtml((p.subjects||[]).join(', '))}</p><p><b>Education:</b> ${escapeHtml((p.education||[]).join(' · '))}</p><p><b>Work style:</b> ${escapeHtml(p.workStyle||'')}</p><p><b>Trade-offs:</b> ${escapeHtml((p.tradeoffs||[]).join(' · '))}</p><p><b>Related alternatives:</b> ${escapeHtml((p.alternatives||[]).join(', '))}</p><div class="path-actions"><button class="small-btn save" onclick="toggleAISave('${escapeHtml(p.name).replace(/'/g,"\\'")}')">♡ ${state.saved.includes(p.name)?'Saved':'Save'}</button><button class="small-btn" onclick="toast('AI says: ${escapeHtml(p.nextTest||'Test this pathway with a small project.').replace(/'/g,"\\'")}')">Test this path</button></div></article>`).join('');
}
function toggleAISave(name){state.saved=state.saved.includes(name)?state.saved.filter(x=>x!==name):[...state.saved,name];saveState();renderAIPatways();renderSaved();updateUI();toast(state.saved.includes(name)?'AI pathway saved.':'AI pathway removed.');}
function renderAIRoadmap(){
  const r=state.aiResult?.roadmap;if(!r){renderRoadmap();return;}
  const box=(title,arr)=>`<div class="roadmap-card ai-roadmap"><span class="eyebrow">AI-GUIDED</span><h3>${title}</h3><ul>${(arr||[]).map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ul></div>`;
  $('#roadmapGrade').textContent=`AI-generated action plan adapted to ${state.user?.grade||'your current stage'}. Verify education and admissions details against current official sources.`;
  $('#roadmap').innerHTML=box('Next 30 days',r.next30Days)+box('Next 6 months',r.next6Months)+box('Next 1–2 years',r.next1to2Years)+`<div class="ai-disclaimer">✦ The roadmap is a planning hypothesis. It should be updated as you gain real experience, grades, project evidence and current education information.</div>`;
}
function renderInterestMapFromAI(){
 const m=state.aiResult?.interestMap;if(!m)return;
 const vals={Analytical:Number(m.analytical)||0,Creative:Number(m.creative)||0,People:Number(m.people)||0,Learning:Number(m.learning)||0,Curiosity:Number(m.curiosity)||0};
 $('#interestStatus').textContent='AI-filled from your 20 answers';
 const order=['Analytical','Creative','People','Learning','Curiosity'];const points=order.map(k=>Math.max(8,Math.min(100,vals[k])));
 const cx=120,cy=120,r=82;const coords=points.map((v,i)=>{const a=(-Math.PI/2)+(i*2*Math.PI/5);return [cx+Math.cos(a)*r*(v/100),cy+Math.sin(a)*r*(v/100)]});
 $('#radarFill').style.clipPath=`polygon(${coords.map(([x,y])=>`${(x/240)*100}% ${(y/240)*100}%`).join(',')})`;
 $('#interestBars').innerHTML=order.map(k=>`<div><span>${k}</span><i><em style="width:${vals[k]}%"></em></i><b>${Math.round(vals[k])}</b></div>`).join('');
}
function updateAIJourney(){
 const complete=Boolean(state.aiResult);const n=state.qIndex||0;
 $('#journeyQTitle').textContent=complete?'20 questions complete':`Question ${Math.min(n+1,20)} of 20`;
 $('#journeyQText').textContent=complete?'Your adaptive interview is complete.':'The AI is choosing each question from what it still needs to learn about you.';
 $('#journeyATitle').textContent=complete?'AI analysis ready':'AI is listening';
 $('#journeyAText').textContent=complete?'Interest signals, contradictions, uncertainty and pathways have been generated.':'Answers will guide the next question and later analysis.';
 ['journeyQuestionnaire','journeyAnalysis','journeyPathways','journeyRoadmap','journeyAction'].forEach(id=>document.getElementById(id)?.classList.remove('current','complete'));
 if(n>0)$('#journeyQuestionnaire')?.classList.add('complete');
 if(complete){['journeyAnalysis','journeyPathways','journeyRoadmap'].forEach(id=>document.getElementById(id)?.classList.add('complete'));$('#journeyAction')?.classList.add('current');}
 else $('#journeyQuestionnaire')?.classList.add('current');
}

// AI-aware dashboard hooks
const originalGoTab=goTab;
goTab=function(name){originalGoTab(name);if(name==='questionnaire'){if(state.aiQuestion)renderAIQuestion();else if(state.aiSession&&!state.aiResult)startAISession();}if(name==='analysis'&&state.aiResult)renderAIResult();if(name==='pathways'&&state.aiResult)renderAIPatways();if(name==='roadmaps'&&state.aiResult)renderAIRoadmap();updateAIJourney();};

// Replace questionnaire start/finish behavior with AI interview when possible.
const oldQuestionStart=window.newQuestionSession;
window.newQuestionSession=()=>{state.aiSession=null;state.aiResult=null;state.aiQuestion=null;state.qIndex=0;localStorage.removeItem(AI_STORE.session);localStorage.removeItem(AI_STORE.result);startAISession();};

// Update signup/login to start an AI-controlled journey.
// Signup is the ONLY place an account is created, so it keeps the duplicate
// check and the minimum password length. An email already in use goes to the
// login form instead of silently overwriting the existing account.
const oldSignup= $('#signupForm').onsubmit;
$('#signupForm').onsubmit=async e=>{
 e.preventDefault();
 const d=Object.fromEntries(new FormData(e.target).entries());
 const email=String(d.email||'').trim().toLowerCase();
 if(!email){toast('Please enter your email address.');return;}
 if(!d.password||d.password.length<6){toast('Please choose a password with at least 6 characters.');return;}
 state.accounts=state.accounts||{};
 if(state.accounts[email]){
  /* This email is already registered. Don't drop the student back on an empty
    form — take them to login with the email already filled in, and tell them
    which account (and who created it) they are signing back into. */
  const known=state.accounts[email];
  const createdBy=known.creatorEmail||known.email||email;
  state.user={...known,creatorEmail:createdBy};
  if(!state.user.role)state.user.role='student';
  saveState();
  updateUI();
  toast('An account with this email already exists — logging you in.');
  openLogin();
  const loginEmail=document.querySelector("#loginForm input[name='email']");
  if(loginEmail) loginEmail.value=email;
  return;
 }
 state.user={...d,email,role:'student',createdAt:Date.now(),creatorEmail:email};
 state.accounts[email]=state.user;
 state.answers={};
 state.saved=[];
 /* Remember who created this account so returning here to make another one
   is not a hassle: the signup form is prefilled with these details. */
 try{localStorage.setItem('yp_last_signup_v3',JSON.stringify({name:d.name||'',email,phone:d.phone||'',country:d.country||'',grade:d.grade||'',age:d.age||'',school:d.school||''}));}catch(err){}
 saveState();
 closeModal('signupModal');
 closeModal('authModal');
 updateUI();
 showPage('dashboard');
 goTab('overview');
 updateAIJourney();
 await startAISession();
 toast('Account created — your AI guide is ready.');
};
// Login authenticates an EXISTING account only. It must never create one:
// an unknown email is rejected rather than silently turned into a new user,
// which would let anyone in by typing an address. The signup flow is the only
// path that creates accounts.
const oldLogin=$('#loginForm').onsubmit;
$('#loginForm').onsubmit=async e=>{
 e.preventDefault();
 const d=Object.fromEntries(new FormData(e.target).entries());
 const email=String(d.email||'').trim().toLowerCase();
 const password=String(d.password||'');
 const accounts=state.accounts||{};
 const existing=accounts[email]||null;
 if(!existing){
  toast('No account found for that email. Please sign up first.');
  return;
 }
 if(existing.password&&existing.password!==password){
  toast('Incorrect password for this account. Please try again.');
  return;
 }
 state.user={...existing};
 if(!state.user.role)state.user.role='student';
 saveState();
 closeModal('loginModal');
 closeModal('authModal');
 updateUI();
 showPage('dashboard');
 goTab('overview');
 if(!state.aiSession||!state.aiResult)await startAISession();
 toast('Logged in — your AI guide is ready.');
};

// Initial AI-aware rendering.
if(state.aiResult){renderAIResult();renderAIPatways();renderAIRoadmap();renderInterestMapFromAI();setAIStatus('AI analysis loaded','ready');}
else if(state.aiQuestion){renderAIQuestion();setAIStatus('AI interviewer is active','ready');}

// Make the overview itself AI-driven instead of showing static demo pathways.
const staticRenderOverview=renderOverview;
renderOverview=function(){
  const ps=state.aiResult?.pathways||[];
  if(ps.length){
    $('#topPaths').innerHTML=ps.slice(0,4).map((p,i)=>`<div class="path-mini"><span class="path-icon">✦</span><span><b>${escapeHtml(p.name)}</b><small>AI pathway ${i+1} · ${escapeHtml(p.why||'Explore this direction')}</small></span></div>`).join('');
  } else staticRenderOverview();
  if(state.aiResult?.pressureSignals){
    const levels=state.aiResult.pressureSignals;
    const box=$('.pressure');
    if(box)box.innerHTML=levels.slice(0,3).map(x=>`<p><span>${escapeHtml(x.area)}</span><b>${escapeHtml(x.level)}</b></p>`).join('');
  }
};
const staticRenderInterestMap=renderInterestMap;
renderInterestMap=function(){if(state.aiResult)renderInterestMapFromAI();else staticRenderInterestMap();};
const staticRenderJourney=renderJourney;
renderJourney=function(){staticRenderJourney();updateAIJourney();};

// Keep dashboard counters and AI content live after every answer.
const oldSubmitAIAnswer=submitAIAnswer;
submitAIAnswer=async function(){await oldSubmitAIAnswer();updateUI();if(state.aiResult){renderAIResult();renderAIPatways();renderAIRoadmap();renderInterestMapFromAI();}updateAIJourney();};

/* ================================================================
   YOUR PATH — LOCAL AI FROM SCRATCH
   No external AI/API. Explainable adaptive expert system.
   ================================================================ */
const LOCAL_AI_STORE={session:'yp_local_ai_session_v1',result:'yp_local_ai_result_v1'};
const LOCAL_AI={
  version:'1.0', maxQuestions:20,
  dimensions:['Analytical','Creative','People','Learning','Curiosity'],
  weights:{
    interests:{Curiosity:4,Creative:1}, subjects:{Learning:3,Analytical:2,Curiosity:1},
    problem:{Analytical:5,Curiosity:2}, creativity:{Creative:5},
    communication:{People:5,Creative:1}, workstyle:{People:2,Analytical:2},
    motivation:{Learning:2,People:1}, learning:{Learning:5,Curiosity:2},
    pressure:{People:1,Curiosity:1}, values:{Curiosity:2,Learning:2}
  },
  keywords:{
    Analytical:['math','data','logic','solve','analysis','code','program','system','evidence','research','pattern','debug','science','statistics','numbers','technical'],
    Creative:['design','create','art','music','story','write','video','build','invent','creative','visual','draw','imagine','original','make'],
    People:['people','help','teach','team','lead','communicate','community','listen','friend','customer','organize','explain','collaborate','group'],
    Learning:['learn','study','understand','read','course','practice','skill','knowledge','curious','explore','improve','master'],
    Curiosity:['why','how','discover','investigate','experiment','question','research','explore','new','curious','evidence','unknown']
  },
  pressureWords:['parents','parent','family','friends','peer','salary','money','status','prestige','respect','pressure','expected','expectation','popular','secure'],
  pathwayProfiles:[
    // Technology & computing
    {name:'Computer Science',icon:'⌘',dims:{Analytical:1,Curiosity:.8,Learning:.8,Creative:.35},cats:['problem','subjects','learning'],skills:['Programming','algorithms','systems thinking'],subjects:['Mathematics','Computer Science','Science'],tradeoffs:['Continuous learning','Technical problem solving'],alt:['Software Engineering','Data Science','Cybersecurity'],test:'Build a small program or solve a coding problem and notice whether you enjoy the process.'},
    {name:'Information Technology',icon:'▣',dims:{Analytical:.8,Learning:.8,People:.45,Curiosity:.65},cats:['problem','learning','workstyle'],skills:['IT support','networks','systems','troubleshooting'],subjects:['ICT','Mathematics','Computer Science'],tradeoffs:['Frequent troubleshooting','Technology changes quickly'],alt:['Network Engineering','Systems Administration','Cybersecurity'],test:'Set up a small home lab and document how devices, users and services connect.'},
    {name:'Information Systems',icon:'◫',dims:{Analytical:.8,People:.65,Learning:.7,Creative:.35},cats:['problem','communication','workstyle'],skills:['Business analysis','databases','systems thinking','communication'],subjects:['ICT','Business','Mathematics'],tradeoffs:['Bridging technical and business needs','Project deadlines'],alt:['Business Analytics','IT Management','Software Development'],test:'Map how a real school or small-business process works and design a better information flow.'},
    {name:'Software Engineering',icon:'</>',dims:{Analytical:1,Curiosity:.65,Learning:.7,Creative:.25},cats:['problem','subjects','learning'],skills:['Programming','algorithms','debugging','teamwork'],subjects:['Mathematics','Computer Science','Science'],tradeoffs:['Long focused sessions','Continuous learning'],alt:['Computer Science','QA','Cloud Engineering'],test:'Build a small app or automate a repetitive task and see whether the process itself is enjoyable.'},
    {name:'Data Science & Analytics',icon:'◈',dims:{Analytical:1,Curiosity:.85,Learning:.7,Creative:.2},cats:['problem','subjects','interests'],skills:['Statistics','data analysis','Python/SQL','communication'],subjects:['Mathematics','Statistics','Computer Science'],tradeoffs:['Messy data','Evidence-based work'],alt:['Economics','Business Analytics','Research'],test:'Use a small public dataset, ask one question, and make a simple chart.'},
    {name:'Cybersecurity',icon:'⌁',dims:{Analytical:.9,Curiosity:.95,Learning:.8,Creative:.25},cats:['problem','interests','subjects'],skills:['Networking','Linux','security concepts','scripting'],subjects:['ICT','Computer Science','Mathematics'],tradeoffs:['Constantly changing threats','Careful troubleshooting'],alt:['Digital Forensics','Network Engineering','Cloud Security'],test:'Use a legal local practice lab to learn how a basic service works and how it can be secured.'},

    // Engineering & built environment
    {name:'Civil Engineering',icon:'▰',dims:{Analytical:.9,Learning:.75,Creative:.55,People:.35},cats:['problem','subjects','values'],skills:['Mathematics','structures','design','project planning'],subjects:['Mathematics','Physics','Engineering'],tradeoffs:['Technical responsibility','Field and office work'],alt:['Construction Management','Structural Engineering','Environmental Engineering'],test:'Study a local structure and sketch how its loads, materials and constraints could be considered.'},
    {name:'Mechanical Engineering',icon:'⚙',dims:{Analytical:1,Creative:.55,Learning:.8,Curiosity:.75},cats:['problem','subjects','interests'],skills:['Mechanics','CAD','design','mathematics'],subjects:['Mathematics','Physics','Engineering'],tradeoffs:['Math-heavy study','Iterative testing'],alt:['Mechatronics','Automotive Engineering','Manufacturing'],test:'Design or model a simple mechanism and test how changing one variable affects it.'},
    {name:'Electrical Engineering',icon:'⌁',dims:{Analytical:.95,Learning:.85,Curiosity:.8,Creative:.4},cats:['problem','subjects','learning'],skills:['Circuits','electronics','mathematics','systems'],subjects:['Mathematics','Physics','Electronics'],tradeoffs:['Technical theory','Careful testing'],alt:['Electronics Engineering','Power Engineering','Embedded Systems'],test:'Build a safe low-voltage circuit or simulation and document what each component does.'},
    {name:'Electronics Engineering',icon:'◌',dims:{Analytical:.95,Creative:.55,Curiosity:.85,Learning:.85},cats:['problem','interests','subjects'],skills:['Electronics','embedded systems','circuits','programming'],subjects:['Mathematics','Physics','ICT'],tradeoffs:['Detailed debugging','Rapid hardware changes'],alt:['Electrical Engineering','Robotics','Embedded Systems'],test:'Experiment with a beginner microcontroller project and keep a troubleshooting log.'},
    {name:'Chemical Engineering',icon:'⚗',dims:{Analytical:.95,Learning:.9,Curiosity:.8,Creative:.3},cats:['problem','subjects','learning'],skills:['Chemistry','process design','mathematics','safety'],subjects:['Chemistry','Mathematics','Physics'],tradeoffs:['Demanding quantitative study','Process and safety constraints'],alt:['Chemistry','Materials Science','Environmental Engineering'],test:'Explore how an everyday product is manufactured and map its inputs, processes and outputs.'},
    {name:'Industrial Engineering',icon:'⇄',dims:{Analytical:.9,People:.55,Learning:.7,Creative:.45},cats:['problem','workstyle','communication'],skills:['Optimization','statistics','process improvement','operations'],subjects:['Mathematics','Statistics','Business'],tradeoffs:['Process-focused work','Balancing people and efficiency'],alt:['Operations Management','Supply Chain','Business Analytics'],test:'Choose a repeated school process and measure where time or effort is being lost.'},
    {name:'Mechatronics / Robotics',icon:'🤖',dims:{Analytical:.95,Creative:.6,Curiosity:.9,Learning:.85},cats:['problem','interests','creativity'],skills:['Mechanics','electronics','programming','control systems'],subjects:['Mathematics','Physics','ICT'],tradeoffs:['Cross-disciplinary learning','Hands-on troubleshooting'],alt:['Mechanical Engineering','Electronics Engineering','Automation'],test:'Build or simulate a small automated mechanism.'},
    {name:'Architecture',icon:'⌂',dims:{Creative:.9,Analytical:.65,People:.4,Learning:.7},cats:['creativity','problem','values'],skills:['Design','spatial thinking','drawing','technical communication'],subjects:['Mathematics','Art','Physics'],tradeoffs:['Long design projects','Balancing creativity and regulations'],alt:['Interior Design','Urban Planning','Landscape Architecture'],test:'Redesign a small room or public space for a specific user and explain the constraints.'},
    {name:'Urban & Regional Planning',icon:'⌖',dims:{Analytical:.7,People:.65,Curiosity:.8,Creative:.55},cats:['values','problem','communication'],skills:['Planning','GIS','research','community engagement'],subjects:['Geography','Social Studies','Mathematics'],tradeoffs:['Many stakeholders','Long-term projects'],alt:['Architecture','Geography','Public Administration'],test:'Map one local issue such as traffic, walkability or public space and propose alternatives.'},

    // Natural sciences & mathematics
    {name:'Mathematics',icon:'∑',dims:{Analytical:1,Learning:.9,Curiosity:.85,Creative:.3},cats:['subjects','problem','learning'],skills:['Proof','logic','modelling','quantitative reasoning'],subjects:['Mathematics','Statistics','Computer Science'],tradeoffs:['Abstract reasoning','Requires sustained practice'],alt:['Statistics','Actuarial Science','Economics'],test:'Choose a mathematical idea and explain it with your own example.'},
    {name:'Statistics',icon:'▥',dims:{Analytical:1,Curiosity:.85,Learning:.85,People:.3},cats:['problem','subjects','interests'],skills:['Probability','data analysis','inference','communication'],subjects:['Mathematics','Statistics','Computer Science'],tradeoffs:['Careful interpretation','Uncertainty is unavoidable'],alt:['Data Science','Economics','Biostatistics'],test:'Compare two datasets and write what the data can and cannot support.'},
    {name:'Physics',icon:'◉',dims:{Analytical:1,Curiosity:.95,Learning:.9,Creative:.35},cats:['problem','subjects','interests'],skills:['Modelling','experimentation','mathematics','reasoning'],subjects:['Physics','Mathematics','Science'],tradeoffs:['Strong mathematical component','Experimentation can be slow'],alt:['Engineering','Astronomy','Materials Science'],test:'Measure a simple physical phenomenon and create a model that explains the observations.'},
    {name:'Chemistry',icon:'⚗',dims:{Analytical:.9,Curiosity:.9,Learning:.9,Creative:.35},cats:['subjects','interests','learning'],skills:['Laboratory methods','chemistry','data interpretation'],subjects:['Chemistry','Biology','Mathematics'],tradeoffs:['Lab safety','Detailed concepts and procedures'],alt:['Pharmacy','Chemical Engineering','Environmental Science'],test:'Investigate a safe household chemistry question using reliable sources and observations.'},
    {name:'Biology',icon:'♧',dims:{Curiosity:.95,Learning:.9,Analytical:.65,People:.3},cats:['subjects','interests','learning'],skills:['Observation','research','lab methods','scientific writing'],subjects:['Biology','Chemistry','Science'],tradeoffs:['Large amount of content','Research can be repetitive'],alt:['Biotechnology','Medicine','Environmental Science'],test:'Choose a biological question and compare evidence from several credible sources.'},
    {name:'Environmental Science',icon:'♧',dims:{Curiosity:.9,Learning:.8,Analytical:.65,People:.35},cats:['subjects','values','interests'],skills:['Research','data','field methods','communication'],subjects:['Biology','Chemistry','Earth Science'],tradeoffs:['Field conditions','Complex systems'],alt:['Geoscience','Conservation','Sustainability'],test:'Choose a local environmental question and collect observations for a week.'},
    {name:'Geology / Earth Science',icon:'◇',dims:{Curiosity:.9,Learning:.8,Analytical:.7,People:.25},cats:['subjects','interests','problem'],skills:['Field observation','earth systems','mapping','analysis'],subjects:['Earth Science','Geography','Physics'],tradeoffs:['Fieldwork','Specialized locations may matter'],alt:['Environmental Science','Geography','Mining Engineering'],test:'Study the geology or landforms around your area using maps and credible references.'},
    {name:'Astronomy / Astrophysics',icon:'✦',dims:{Curiosity:1,Analytical:.95,Learning:.95,Creative:.3},cats:['interests','subjects','learning'],skills:['Physics','mathematics','data analysis','research'],subjects:['Physics','Mathematics','Science'],tradeoffs:['Highly quantitative','Specialist careers often require advanced study'],alt:['Physics','Data Science','Space Science'],test:'Track an observable sky object or analyze public astronomy data.'},

    // Health & life sciences
    {name:'Medicine',icon:'✚',dims:{People:.75,Learning:1,Curiosity:.8,Analytical:.7},cats:['subjects','communication','values'],skills:['Clinical reasoning','biology','communication','decision-making'],subjects:['Biology','Chemistry','Physics'],tradeoffs:['Long training','High responsibility and demanding schedules'],alt:['Nursing','Medical Technology','Public Health'],test:'Learn what a typical day looks like for several medical specialties and compare the actual tasks.'},
    {name:'Nursing',icon:'✚',dims:{People:1,Learning:.8,Curiosity:.65,Analytical:.55},cats:['communication','values','learning'],skills:['Patient care','communication','clinical skills','teamwork'],subjects:['Biology','Health','Chemistry'],tradeoffs:['Emotionally and physically demanding','Shift work can occur'],alt:['Medicine','Midwifery','Public Health'],test:'Interview a nurse or watch an official career overview and list the daily responsibilities.'},
    {name:'Pharmacy',icon:'⚕',dims:{Learning:.9,Analytical:.8,People:.65,Curiosity:.75},cats:['subjects','communication','learning'],skills:['Pharmacology','chemistry','patient communication','accuracy'],subjects:['Chemistry','Biology','Mathematics'],tradeoffs:['High accuracy requirements','Patient-facing or regulated work'],alt:['Medicine','Medical Technology','Chemistry'],test:'Research how pharmacists contribute beyond dispensing and summarize the roles you find.'},
    {name:'Medical Technology / Medical Laboratory Science',icon:'⌬',dims:{Analytical:.85,Learning:.9,Curiosity:.85,People:.35},cats:['subjects','problem','learning'],skills:['Laboratory science','biology','chemistry','accuracy'],subjects:['Biology','Chemistry','Science'],tradeoffs:['Detailed laboratory procedures','Accuracy is critical'],alt:['Biology','Pharmacy','Public Health'],test:'Explore how a diagnostic laboratory turns a specimen into useful clinical information.'},
    {name:'Dentistry',icon:'◉',dims:{People:.75,Analytical:.7,Learning:.85,Creative:.45},cats:['communication','subjects','workstyle'],skills:['Clinical skills','biology','fine motor skills','patient communication'],subjects:['Biology','Chemistry','Health'],tradeoffs:['Long training','Precision and patient responsibility'],alt:['Medicine','Dental Technology','Public Health'],test:'Compare preventive, restorative and community dentistry to see which daily tasks interest you.'},
    {name:'Physical Therapy',icon:'↻',dims:{People:.9,Learning:.75,Analytical:.6,Creative:.4},cats:['communication','values','learning'],skills:['Movement science','assessment','coaching','patient care'],subjects:['Biology','Health','Physics'],tradeoffs:['Hands-on patient work','Progress can be gradual'],alt:['Occupational Therapy','Sports Science','Nursing'],test:'Learn how a therapist assesses movement and design a safe educational exercise plan without presenting it as medical advice.'},
    {name:'Occupational Therapy',icon:'◎',dims:{People:.9,Creative:.55,Learning:.75,Curiosity:.65},cats:['communication','values','creativity'],skills:['Rehabilitation','problem solving','communication','adaptation'],subjects:['Biology','Health','Psychology'],tradeoffs:['Patient-centered work','Requires patience and adaptation'],alt:['Physical Therapy','Psychology','Special Education'],test:'Explore how occupational therapists adapt activities to help people participate in daily life.'},
    {name:'Public Health',icon:'⊕',dims:{People:.8,Analytical:.65,Curiosity:.8,Learning:.8},cats:['values','communication','subjects'],skills:['Epidemiology','health education','data','community work'],subjects:['Biology','Statistics','Social Science'],tradeoffs:['Community-level rather than one-to-one impact','Complex public systems'],alt:['Medicine','Nursing','Health Administration'],test:'Investigate one local public-health issue using official statistics and propose a non-medical educational intervention.'},
    {name:'Nutrition & Dietetics',icon:'⌁',dims:{People:.75,Learning:.8,Analytical:.6,Curiosity:.7},cats:['subjects','communication','values'],skills:['Nutrition science','assessment','communication','research'],subjects:['Biology','Chemistry','Health'],tradeoffs:['Evidence changes with research','Client behavior can be complex'],alt:['Food Science','Public Health','Sports Science'],test:'Compare nutrition claims online with guidance from reputable health authorities.'},
    {name:'Veterinary Medicine / Animal Science',icon:'🐾',dims:{People:.6,Curiosity:.9,Learning:.85,Analytical:.65},cats:['interests','subjects','values'],skills:['Animal biology','clinical reasoning','observation','communication'],subjects:['Biology','Chemistry','Animal Science'],tradeoffs:['Emotional cases','Practical and clinical work'],alt:['Animal Science','Biology','Agriculture'],test:'Compare veterinary clinical work with animal science, conservation and livestock-related careers.'},

    // Psychology, education & social sciences
    {name:'Psychology',icon:'◉',dims:{People:1,Curiosity:.8,Learning:.75,Analytical:.35},cats:['communication','interests','learning'],skills:['Listening','research methods','writing','statistics'],subjects:['Psychology','Biology','Statistics'],tradeoffs:['People-focused work','Some specialist roles require further study'],alt:['Counseling','Human Resources','UX Research'],test:'Read one behavioral study and identify its question, method, evidence and limits.'},
    {name:'Education / Teaching',icon:'▤',dims:{People:1,Creative:.55,Learning:.8,Curiosity:.65},cats:['communication','values','learning'],skills:['Teaching','lesson design','communication','assessment'],subjects:['Education','English','Mathematics or specialization'],tradeoffs:['High people interaction','Planning and classroom responsibility'],alt:['Training & Development','Educational Technology','Counseling'],test:'Teach a short concept to someone and revise your explanation based on what confused them.'},
    {name:'Early Childhood Education',icon:'☀',dims:{People:1,Creative:.65,Learning:.7,Curiosity:.65},cats:['communication','values','creativity'],skills:['Child development','activity design','communication','patience'],subjects:['Education','Psychology','Language'],tradeoffs:['High responsibility','Energetic people-focused work'],alt:['Elementary Education','Special Education','Child Development'],test:'Research age-appropriate learning activities and explain why each supports development.'},
    {name:'Special Education',icon:'◎',dims:{People:1,Creative:.55,Learning:.85,Curiosity:.7},cats:['communication','values','learning'],skills:['Inclusive teaching','adaptation','communication','observation'],subjects:['Education','Psychology','Health'],tradeoffs:['Highly individualized work','Requires patience and flexibility'],alt:['Education','Occupational Therapy','Psychology'],test:'Explore how learning materials can be adapted for different needs.'},
    {name:'Social Work',icon:'♡',dims:{People:1,Values:1,Learning:.65,Curiosity:.7},cats:['communication','values','pressure'],skills:['Case support','advocacy','communication','community work'],subjects:['Social Studies','Psychology','Communication'],tradeoffs:['Emotionally demanding situations','Strong community focus'],alt:['Counseling','Public Administration','Community Development'],test:'Learn about different social-work settings and compare their daily responsibilities.'},
    {name:'Sociology',icon:'◎',dims:{Curiosity:.9,People:.85,Learning:.8,Analytical:.45},cats:['values','interests','communication'],skills:['Social research','writing','data interpretation','observation'],subjects:['Social Studies','Statistics','History'],tradeoffs:['Research may be abstract','Career paths can span many sectors'],alt:['Anthropology','Public Policy','Human Resources'],test:'Investigate one social pattern using both qualitative and quantitative evidence.'},
    {name:'Political Science / Public Policy',icon:'§',dims:{People:.7,Curiosity:.9,Analytical:.65,Learning:.8},cats:['values','communication','interests'],skills:['Research','writing','policy analysis','argument evaluation'],subjects:['Social Studies','History','English'],tradeoffs:['Complex competing interests','Requires careful evidence evaluation'],alt:['Law','Public Administration','International Relations'],test:'Compare two documented policy approaches to one issue and separate facts from opinions.'},
    {name:'International Relations',icon:'◎',dims:{People:.75,Curiosity:.95,Learning:.85,Analytical:.55},cats:['values','communication','interests'],skills:['Research','languages','writing','cross-cultural communication'],subjects:['History','Social Studies','Languages'],tradeoffs:['Competitive fields','Global issues are complex and uncertain'],alt:['Political Science','Diplomacy','International Business'],test:'Choose an international issue and compare how several countries officially describe it.'},
    {name:'Anthropology',icon:'⌁',dims:{Curiosity:1,People:.8,Learning:.85,Analytical:.45},cats:['interests','communication','values'],skills:['Field research','observation','writing','cultural analysis'],subjects:['Social Studies','History','Languages'],tradeoffs:['Fieldwork can be demanding','Research-oriented career paths'],alt:['Sociology','Archaeology','Cultural Studies'],test:'Observe an everyday social practice and write questions about why it exists without assuming an answer.'},
    {name:'History',icon:'⌛',dims:{Curiosity:.9,Learning:.95,People:.55,Analytical:.55},cats:['subjects','interests','learning'],skills:['Research','source evaluation','writing','contextual reasoning'],subjects:['History','English','Social Studies'],tradeoffs:['Extensive reading','Interpretation requires source criticism'],alt:['Law','Education','Archives'],test:'Take a historical claim and compare several primary and secondary sources.'},

    // Business, finance, law & communication
    {name:'Business Administration',icon:'↗',dims:{People:.75,Analytical:.55,Creative:.55,Learning:.7},cats:['motivation','communication','values'],skills:['Management','finance basics','communication','operations'],subjects:['Business','Economics','Mathematics'],tradeoffs:['Broad rather than specialized','Team and deadline driven'],alt:['Marketing','Management','Entrepreneurship'],test:'Analyze how a small business earns, spends and creates value.'},
    {name:'Accounting',icon:'▤',dims:{Analytical:.9,Learning:.8,People:.45,Curiosity:.55},cats:['subjects','workstyle','problem'],skills:['Accounting','financial reporting','accuracy','analysis'],subjects:['Mathematics','Business','Economics'],tradeoffs:['Detail-heavy','Accuracy and deadlines matter'],alt:['Finance','Auditing','Management Accounting'],test:'Create a simple budget and reconcile the numbers carefully.'},
    {name:'Finance',icon:'₱',dims:{Analytical:.85,Learning:.75,People:.45,Curiosity:.65},cats:['subjects','problem','motivation'],skills:['Financial analysis','economics','risk','quantitative reasoning'],subjects:['Mathematics','Economics','Business'],tradeoffs:['High attention to uncertainty','Numbers and decisions are central'],alt:['Accounting','Economics','Actuarial Science'],test:'Learn how compound growth, inflation and risk affect a hypothetical long-term plan.'},
    {name:'Economics',icon:'∿',dims:{Analytical:.85,Curiosity:.85,Learning:.8,People:.5},cats:['problem','subjects','values'],skills:['Economic reasoning','statistics','research','writing'],subjects:['Mathematics','Economics','Social Studies'],tradeoffs:['Models simplify reality','Requires quantitative and conceptual thinking'],alt:['Finance','Public Policy','Business Analytics'],test:'Use a simple supply-and-demand example to explain a real-world price change.'},
    {name:'Marketing',icon:'✦',dims:{Creative:.8,People:.8,Analytical:.5,Curiosity:.65},cats:['creativity','communication','motivation'],skills:['Research','branding','communication','analytics'],subjects:['Business','English','Art/Design'],tradeoffs:['Fast-changing trends','Results can be uncertain'],alt:['Advertising','Public Relations','Sales'],test:'Compare how two brands communicate to different audiences and identify the evidence.'},
    {name:'Entrepreneurship',icon:'↗',dims:{People:.8,Creative:.75,Curiosity:.65,Analytical:.55},cats:['motivation','communication','values'],skills:['Problem discovery','market research','finance','leadership'],subjects:['Business','Economics','Mathematics'],tradeoffs:['Uncertainty','Requires experimentation and resilience'],alt:['Business Administration','Marketing','Innovation Management'],test:'Interview three people about a real problem before proposing a solution.'},
    {name:'Human Resources',icon:'♧',dims:{People:1,Analytical:.45,Learning:.7,Creative:.4},cats:['communication','values','workstyle'],skills:['Recruitment','communication','organizational behavior','policy'],subjects:['Business','Psychology','Communication'],tradeoffs:['People conflicts can be difficult','Requires confidentiality and fairness'],alt:['Psychology','Management','Labor Relations'],test:'Study how organizations recruit, onboard and develop people.'},
    {name:'Law / Legal Studies',icon:'§',dims:{Analytical:.75,People:.7,Learning:.9,Curiosity:.8},cats:['communication','problem','subjects'],skills:['Reading','argument analysis','research','writing'],subjects:['English','History','Social Studies'],tradeoffs:['Heavy reading','Precision and competing arguments'],alt:['Political Science','Criminology','Compliance'],test:'Read a simple public legal case summary and identify the facts, issue, arguments and decision.'},
    {name:'Criminology',icon:'⌁',dims:{Curiosity:.85,People:.65,Analytical:.65,Learning:.8},cats:['interests','problem','values'],skills:['Research','crime analysis','social science','writing'],subjects:['Social Studies','Psychology','Statistics'],tradeoffs:['Sensitive subject matter','Evidence must be handled carefully'],alt:['Law','Forensics','Public Safety'],test:'Study evidence-based explanations of crime and compare them without assuming one cause.'},
    {name:'Communication / Media Studies',icon:'◌',dims:{People:.8,Creative:.8,Learning:.65,Curiosity:.6},cats:['communication','creativity','interests'],skills:['Writing','speaking','media production','research'],subjects:['English','Communication','Media Arts'],tradeoffs:['Fast-changing media','Public-facing work can be demanding'],alt:['Journalism','Public Relations','Advertising'],test:'Create a short explanation of a complex topic for two different audiences.'},
    {name:'Journalism',icon:'▤',dims:{Curiosity:.9,People:.75,Creative:.7,Analytical:.55},cats:['communication','interests','values'],skills:['Interviewing','research','writing','source verification'],subjects:['English','Social Studies','Media'],tradeoffs:['Deadlines','Source verification and public scrutiny'],alt:['Communication','Broadcasting','Public Relations'],test:'Report a local topic using multiple sources and clearly separate verified facts from claims.'},
    {name:'Public Relations',icon:'◉',dims:{People:.9,Creative:.75,Curiosity:.55,Analytical:.4},cats:['communication','creativity','motivation'],skills:['Writing','media relations','campaign planning','communication'],subjects:['Communication','English','Business'],tradeoffs:['Reputation-sensitive work','Fast deadlines'],alt:['Marketing','Journalism','Advertising'],test:'Draft a factual communication plan for a hypothetical school event and consider different audiences.'},

    // Arts, design & creative fields
    {name:'Fine Arts',icon:'✦',dims:{Creative:1,Curiosity:.7,People:.35,Learning:.65},cats:['creativity','interests','values'],skills:['Visual practice','concept development','critique','portfolio building'],subjects:['Art','History','Design'],tradeoffs:['Portfolio development takes time','Income paths can vary'],alt:['Graphic Design','Illustration','Art Education'],test:'Make a small body of work around one theme and document how your idea changed.'},
    {name:'Graphic Design',icon:'◇',dims:{Creative:1,People:.55,Analytical:.4,Learning:.65},cats:['creativity','communication','interests'],skills:['Typography','layout','visual communication','design software'],subjects:['Art','Design','ICT'],tradeoffs:['Frequent critique','Client constraints'],alt:['UI Design','Illustration','Advertising'],test:'Redesign a poster for a specific audience and explain your design choices.'},
    {name:'Animation / 3D / Visual Effects',icon:'✦',dims:{Creative:1,Analytical:.45,Learning:.75,Curiosity:.7},cats:['creativity','interests','learning'],skills:['Storyboarding','3D tools','animation','visual storytelling'],subjects:['Art','ICT','Media'],tradeoffs:['Long production cycles','Technical creative tools'],alt:['Film','Game Art','Graphic Design'],test:'Create a short storyboard or simple animation sequence with a clear visual idea.'},
    {name:'Film / Broadcasting',icon:'▶',dims:{Creative:.9,People:.75,Curiosity:.65,Learning:.55},cats:['creativity','communication','interests'],skills:['Storytelling','camera/audio','editing','production'],subjects:['Media','English','Art'],tradeoffs:['Team-based production','Irregular project schedules'],alt:['Journalism','Communication','Digital Media'],test:'Produce a short factual video with a script, shots and source notes.'},
    {name:'Music / Performing Arts',icon:'♫',dims:{Creative:1,People:.7,Learning:.7,Curiosity:.65},cats:['creativity','communication','interests'],skills:['Performance','practice','composition','collaboration'],subjects:['Music','Arts','Languages'],tradeoffs:['High practice demands','Performance pressure can occur'],alt:['Music Education','Production','Arts Management'],test:'Learn or create a short piece and record what practice methods helped most.'},
    {name:'Interior Design',icon:'⌂',dims:{Creative:.95,People:.55,Analytical:.45,Learning:.65},cats:['creativity','values','workstyle'],skills:['Spatial design','materials','visualization','client communication'],subjects:['Art','Design','Mathematics'],tradeoffs:['Client constraints','Detailed revisions'],alt:['Architecture','Furniture Design','Visual Merchandising'],test:'Redesign a small room for a specific user, budget and functional need.'},
    {name:'Fashion Design / Apparel',icon:'◇',dims:{Creative:1,People:.5,Learning:.65,Curiosity:.65},cats:['creativity','interests','values'],skills:['Design','materials','pattern making','visual communication'],subjects:['Art','Design','Home Economics'],tradeoffs:['Trend-sensitive','Production constraints'],alt:['Textile Design','Merchandising','Costume Design'],test:'Design a small capsule collection around a practical user need.'},

    // Agriculture, food, environment & natural resources
    {name:'Agriculture / Agribusiness',icon:'♧',dims:{Curiosity:.8,People:.55,Analytical:.6,Learning:.75},cats:['values','subjects','interests'],skills:['Crop systems','business','field observation','resource management'],subjects:['Biology','Chemistry','Business'],tradeoffs:['Field conditions','Seasonal and market uncertainty'],alt:['Agricultural Engineering','Food Science','Environmental Science'],test:'Investigate one crop or farm system and map its biological and business constraints.'},
    {name:'Agricultural Engineering',icon:'⚙',dims:{Analytical:.9,Curiosity:.8,Learning:.8,Creative:.55},cats:['problem','subjects','values'],skills:['Engineering','irrigation','machinery','resource systems'],subjects:['Mathematics','Physics','Agriculture'],tradeoffs:['Technical and field work','Real-world environmental constraints'],alt:['Mechanical Engineering','Agriculture','Environmental Engineering'],test:'Design a simple water-use or farm-efficiency improvement and estimate its trade-offs.'},
    {name:'Food Science & Technology',icon:'◇',dims:{Analytical:.75,Curiosity:.85,Learning:.85,Creative:.45},cats:['subjects','interests','problem'],skills:['Food chemistry','quality control','processing','research'],subjects:['Chemistry','Biology','Mathematics'],tradeoffs:['Quality and safety requirements','Laboratory or production environments'],alt:['Nutrition','Chemistry','Agribusiness'],test:'Investigate how one packaged food is processed, preserved and quality-tested.'},
    {name:'Forestry / Natural Resources',icon:'♧',dims:{Curiosity:.9,Learning:.8,People:.4,Analytical:.55},cats:['values','interests','subjects'],skills:['Ecology','field methods','resource management','mapping'],subjects:['Biology','Earth Science','Geography'],tradeoffs:['Outdoor work','Long-term environmental systems'],alt:['Environmental Science','Agriculture','Conservation'],test:'Study a local ecosystem and identify pressures, stakeholders and possible conservation actions.'},

    // Hospitality, tourism, maritime & services
    {name:'Hospitality Management',icon:'✦',dims:{People:.95,Creative:.55,Learning:.6,Analytical:.35},cats:['communication','workstyle','motivation'],skills:['Guest service','operations','teamwork','event planning'],subjects:['Business','Communication','Home Economics'],tradeoffs:['Customer-facing work','Variable schedules'],alt:['Tourism','Restaurant Management','Events'],test:'Analyze the guest journey of a hotel or restaurant and identify points where service matters.'},
    {name:'Tourism Management',icon:'⌖',dims:{People:.85,Curiosity:.8,Creative:.6,Learning:.6},cats:['communication','interests','values'],skills:['Tour planning','communication','destination research','marketing'],subjects:['Geography','Business','Communication'],tradeoffs:['Seasonal demand','Customer-facing schedules'],alt:['Hospitality','Travel Management','Events'],test:'Design a responsible local tourism itinerary with audience, budget and sustainability considerations.'},
    {name:'Culinary Arts / Culinary Management',icon:'♨',dims:{Creative:.8,People:.75,Learning:.65,Curiosity:.6},cats:['creativity','workstyle','interests'],skills:['Cooking','food safety','menu planning','operations'],subjects:['Home Economics','Science','Business'],tradeoffs:['Fast-paced work','Long or irregular hours can occur'],alt:['Food Science','Hospitality','Entrepreneurship'],test:'Plan and execute a simple meal while tracking preparation time, cost and quality.'},
    {name:'Maritime Studies / Marine Transportation',icon:'⚓',dims:{Analytical:.65,Learning:.8,Curiosity:.8,People:.55},cats:['values','subjects','workstyle'],skills:['Navigation','safety','operations','discipline'],subjects:['Physics','Mathematics','Geography'],tradeoffs:['Extended periods away from home may occur','Strict safety procedures'],alt:['Marine Engineering','Logistics','Port Management'],test:'Research the training, certification and actual onboard duties for maritime roles.'},
    {name:'Marine Engineering',icon:'⚓',dims:{Analytical:.9,Learning:.85,Curiosity:.8,Creative:.35},cats:['problem','subjects','workstyle'],skills:['Mechanical systems','engines','maintenance','safety'],subjects:['Mathematics','Physics','Engineering'],tradeoffs:['Technical responsibility','Potential extended time at sea'],alt:['Mechanical Engineering','Maritime Studies','Marine Technology'],test:'Learn how a ship propulsion system works and identify its major engineering subsystems.'},
    {name:'Logistics & Supply Chain Management',icon:'⇄',dims:{Analytical:.75,People:.6,Learning:.7,Curiosity:.6},cats:['problem','workstyle','communication'],skills:['Planning','inventory','operations','data'],subjects:['Business','Mathematics','Economics'],tradeoffs:['Time-sensitive decisions','Coordination across many people'],alt:['Industrial Engineering','Business Administration','Operations'],test:'Map how an everyday product moves from supplier to customer and find possible bottlenecks.'},

    // Public service, safety & specialized fields
    {name:'Public Administration',icon:'▤',dims:{People:.75,Analytical:.6,Learning:.8,Curiosity:.7},cats:['values','communication','workstyle'],skills:['Policy implementation','administration','public service','research'],subjects:['Social Studies','Business','English'],tradeoffs:['Complex procedures','Many stakeholders'],alt:['Political Science','Public Policy','Community Development'],test:'Study how a local public service is delivered and identify the roles involved.'},
    {name:'Library & Information Science',icon:'▤',dims:{Learning:.9,People:.65,Curiosity:.8,Analytical:.55},cats:['learning','communication','interests'],skills:['Information organization','research','digital literacy','service'],subjects:['English','ICT','Research'],tradeoffs:['Detail-oriented work','Service responsibilities'],alt:['Archives','Records Management','Education'],test:'Organize a small collection of information using a clear classification system.'},
    {name:'Emergency Management / Disaster Risk Reduction',icon:'△',dims:{People:.75,Analytical:.7,Curiosity:.8,Learning:.8},cats:['values','problem','communication'],skills:['Risk assessment','planning','coordination','communication'],subjects:['Science','Geography','Social Studies'],tradeoffs:['High-stakes situations','Preparedness work can be repetitive'],alt:['Public Administration','Environmental Science','Safety Management'],test:'Create a basic community hazard map using publicly available information.'},
    {name:'Aviation / Aeronautics',icon:'✈',dims:{Analytical:.8,Learning:.85,Curiosity:.85,People:.45},cats:['subjects','workstyle','interests'],skills:['Safety','systems','navigation','technical communication'],subjects:['Physics','Mathematics','Geography'],tradeoffs:['Strict regulations','Safety-critical procedures'],alt:['Aerospace Engineering','Air Traffic Services','Aircraft Maintenance'],test:'Explore the different careers around aviation rather than focusing only on pilots.'},
    {name:'Forensic Science',icon:'⌬',dims:{Analytical:.9,Curiosity:.9,Learning:.85,People:.3},cats:['problem','interests','subjects'],skills:['Laboratory methods','evidence handling','chemistry','documentation'],subjects:['Chemistry','Biology','Physics'],tradeoffs:['Strict evidence procedures','Sensitive subject matter'],alt:['Chemistry','Criminology','Medical Laboratory Science'],test:'Learn how evidence is documented and why scientific conclusions must distinguish observation from inference.'},
    {name:'Sports Science / Exercise Science',icon:'↻',dims:{People:.7,Learning:.75,Curiosity:.75,Analytical:.55},cats:['interests','subjects','communication'],skills:['Exercise science','measurement','coaching','anatomy'],subjects:['Biology','Health','Physics'],tradeoffs:['Hands-on work','Evidence and safety matter'],alt:['Physical Therapy','Coaching','Nutrition'],test:'Compare how exercise science, physical therapy and coaching differ in goals and daily work.'}
  ]
};

function localAIState(){
  if(!state.localAI) state.localAI={asked:[],history:[],signals:Object.fromEntries(LOCAL_AI.dimensions.map(x=>[x,1])),catEvidence:{},pressure:{},contradictions:[],started:Date.now(),complete:false};
  return state.localAI;
}
function saveLocalAI(){localStorage.setItem(LOCAL_AI_STORE.session,JSON.stringify(state.localAI||null));localStorage.setItem(LOCAL_AI_STORE.result,JSON.stringify(state.localAIResult||null));saveState();}
function loadLocalAI(){
  try{state.localAI=JSON.parse(localStorage.getItem(LOCAL_AI_STORE.session)||'null');state.localAIResult=JSON.parse(localStorage.getItem(LOCAL_AI_STORE.result)||'null')}catch(e){}
}
loadLocalAI();

function localAnswerText(q,val){return String(Array.isArray(val)?val.join(' | '):val||'').toLowerCase()}
function localValidAnswer(v){return v!==undefined&&v!==null&&v!==''&&(!Array.isArray(v)||v.some(x=>x!==''));}
function localSignalFromAnswer(q,val){
  const a=localAIState(), text=localAnswerText(q,val); a.history.push({id:q.id,category:q.category,text}); a.catEvidence[q.category]=(a.catEvidence[q.category]||0)+1;
  for(const [dim,words] of Object.entries(LOCAL_AI.keywords)){
    const hits=words.reduce((n,w)=>n+(text.includes(w)?1:0),0);
    if(hits)a.signals[dim]+=Math.min(hits,3)*.65;
  }
  for(const [dim,w] of Object.entries(LOCAL_AI.weights[q.category]||{})) a.signals[dim]+=w;
  if(q.type==='scale'&&Number(val)){a.signals.Learning+=Number(val)*.25;a.signals.Curiosity+=Number(val)*.25}
  const pressureHits=LOCAL_AI.pressureWords.filter(w=>text.includes(w));
  if(pressureHits.length){a.pressure[q.category]=(a.pressure[q.category]||0)+pressureHits.length}
  // --- Contradiction detection -------------------------------------------
  // (a) Two strong directions in the same session.
  if(a.history.length>=5){
    const recent=a.history.slice(-5); const analytical=recent.filter(x=>['problem','subjects'].includes(x.category)).length;
    const creative=recent.filter(x=>x.category==='creativity').length;
    if(analytical>=2&&creative>=2&&a.signals.Analytical>1.6&&a.signals.Creative>1.6) localAddContradiction(a,{signal:'Multiple strong directions',evidence:'Recent answers show both technical/problem-solving and creative signals.',followUp:'Test both through small projects rather than forcing an early choice.'});
  }
  localCheckStatedVsEvidence(a);
}

/* (b) Stated preference vs accumulated evidence.
   A pathway the student SAVED or was shown has a `dims` profile. If the
   student's strongest signals point somewhere else, that tension is worth
   naming — the disagreement is between what they chose and what they said,
   and only a real experiment can settle it. This never lowers a pathway's
   standing; it only adds a reflection prompt. */
function localAddContradiction(a,item){
  if(!a.contradictions) a.contradictions=[];
  if(a.contradictions.some(c=>c.signal===item.signal)) return; // no duplicates per session
  a.contradictions.push(item);
}
function localCheckStatedVsEvidence(a){
  if(!a.history || a.history.length<8) return;
  const profiles=(typeof LOCAL_AI!=='undefined' && LOCAL_AI.pathwayProfiles)||[];
  if(!profiles.length) return;
  const stated=(state.saved||[]);
  if(!stated.length) return;
  // Student's strongest signals, normalised for the ~1.0 baseline each accumulates.
  const ranked=LOCAL_AI.dimensions
    .map(d=>({d,score:Number(a.signals[d])||0}))
    .sort((x,y)=>y.score-x.score);
  if(ranked.length<2) return;
  const top=ranked[0], second=ranked[1];
  for(const name of stated){
    const profile=profiles.find(p=>p.name===name);
    if(!profile || !profile.dims) continue;
    // The student's own words support this pathway's two key dimensions?
    const keyDims=Object.entries(profile.dims).sort((x,y)=>y[1]-x[1]).slice(0,2).map(([d])=>d);
    const supported=keyDims.filter(d=>d===top.d||d===second.d);
    if(supported.length) continue; // stated choice is consistent with evidence
    localAddContradiction(a,{
      signal:`"${name}" vs your strongest signals`,
      evidence:`You saved ${name}, but your answers pointed most strongly to ${top.d}${second?` and ${second.d}`:""} rather than ${keyDims.join(" / ")}.`,
      followUp:`Both can be true — a field can need one style of thinking while you bring another. Run the 7-day experiment for ${name} and let the work decide, rather than the wording of this analysis.`
    });
    break; // one such prompt per session is enough
  }
}
/* ================================================================
   EVIDENCE TRACKING (local, aggregate, no personal data)

   The metrics the project needs to decide whether the core loop
   actually works: sessions started/finished, careers explored,
   experiments completed, feedback, and whether students return.

   Design rules, deliberately: counts only, never identities. No
   answers, no free text, no emails, and no network calls. Everything
   stays in this browser, exactly like the rest of the prototype. A
   real deployment must move this server-side (see README) — but it
   MUST NOT add identifiers while doing so.
   ================================================================ */
const EVIDENCE_STORE='yp_evidence_v1';

function evidenceToday(){return new Date().toISOString().slice(0,10)}
function evidenceLoad(){
 try{return JSON.parse(localStorage.getItem(EVIDENCE_STORE)||'null')||evidenceBlank()}catch(e){return evidenceBlank()}
}
function evidenceBlank(){
 return {
  firstSeen:null,
  // funnel
  sessionsStarted:0, sessionsCompleted:0,
  // engagement
  careersExplored:[],           // unique pathway names, deduped
  experimentsOpened:[],         // unique experiment families
  experimentDaysDone:[],        // [family, day] pairs completed
  reflections:[],               // {family, enjoyment} — the key signal
  // retention
  activeDays:[],                // unique YYYY-MM-DD the student used the app
  sessionsByDay:{},             // date -> count
  // feedback
  feedback:null,
  changeLog:[]                  // {date, from, to} — what feedback changed
 };
}
function evidenceSave(e){try{localStorage.setItem(EVIDENCE_STORE,JSON.stringify(e))}catch(err){}}
function evidenceTrack(fn){
 const e=evidenceLoad();
 const today=evidenceToday();
 if(!e.firstSeen) e.firstSeen=Date.now();
 if(!(e.activeDays||[]).includes(today)) (e.activeDays=[]).push(today);
 e.sessionsByDay=e.sessionsByDay||{};
 e.sessionsByDay[today]=(e.sessionsByDay[today]||0)+1;
 fn(e,today);
 evidenceSave(e);
}
function evidenceUnique(list,val){const l=list||[];return l.includes(val)?l:[...l,val]}

/* Record the events that matter. Each is called from the real flow, so the
   numbers cannot drift from what a student actually did. */
function trackSessionStarted(){evidenceTrack(e=>{e.sessionsStarted=(e.sessionsStarted||0)+1})}
function trackSessionCompleted(){evidenceTrack(e=>{e.sessionsCompleted=(e.sessionsCompleted||0)+1})}
function trackCareersExplored(names){
 const list=[].concat(names||[]).filter(Boolean);
 if(!list.length) return;
 evidenceTrack(e=>{list.forEach(n=>{e.careersExplored=evidenceUnique(e.careersExplored,n)})});
}
function trackExperimentOpened(family){evidenceTrack(e=>{e.experimentsOpened=evidenceUnique(e.experimentsOpened,family)})}
function trackExperimentDay(family,day){evidenceTrack(e=>{e.experimentDaysDone=[...(e.experimentDaysDone||[]).filter(x=>!(x[0]===family&&x[1]===day)),[family,day]]})}
function trackReflection(family,enjoyment){evidenceTrack(e=>{e.reflections=[...(e.reflections||[]).filter(r=>r.family!==family),{family,enjoyment,at:Date.now()}]})}
function trackFeedback(payload){evidenceTrack(e=>{e.feedback={...payload,at:Date.now()}})}
/* A change log with no entries is itself a finding (docs/METHODOLOGY.md §6). */
function trackChange(from,to){evidenceTrack(e=>{e.changeLog=[...(e.changeLog||[]),{date:evidenceToday(),from,to}]})}
function resetEvidence(){try{localStorage.removeItem(EVIDENCE_STORE)}catch(e){}toast('Local usage evidence cleared.');try{renderEvidenceReadout()}catch(err){}}

/* Rendered inside the Feedback tab: the numbers the project needs in order to
   judge whether the core loop works, for THIS device only. Deliberately shown
   to the student rather than hidden — they can clear it. */
function renderEvidenceReadout(){
 const box=document.getElementById('evidenceReadout');
 if(!box) return;
 let s; try{s=evidenceSummary()}catch(e){return}
 const row=(label,value,note)=>`<div><b>${value}</b><small>${label}</small>${note?`<p class="muted" style="margin:4px 0 0;font-size:11px">${note}</p>`:""}</div>`;
 const noAnswerNote=s.reflections===0
  ? 'No reflections yet. If nobody ever answers "I did not enjoy it", the question is being read as a test — see docs/METHODOLOGY.md §6.'
  : (s.ruledOut===0
     ? 'Nobody has ruled anything out yet. Watch this: a "No" is the most useful result the tool can produce.'
     : `Including ${s.ruledOut} honest "No" result${s.ruledOut===1?"":"s"} — directions sensibly ruled out early.`);
 box.innerHTML=`
  <div class="admin-stats" style="margin-bottom:14px">
   ${row('Sessions started',s.sessionsStarted)}
   ${row('Sessions completed',s.sessionsCompleted,`Completion rate ${s.completionRate}%`)}
   ${row('Careers explored',s.careersExplored,'Unique pathways opened, saved or analysed')}
   ${row('Experiments opened',s.experimentsOpened,`${s.experimentDaysPerOpened} days completed per experiment`)}
   ${row('Reflections recorded',s.reflections,noAnswerNote)}
   ${row('Active days',s.activeDays,s.returned?'Returned on more than one day':'Has not returned yet — retention is the only real proof the loop is useful')}
  </div>
  ${s.feedback?`<p class="muted" style="font-size:12px;margin:0 0 10px"><b>Your feedback:</b> ${escapeHtml(String(s.feedback.feedback||s.feedback.useful||""))||"(recorded)"}</p>`:""}
  <p class="muted" style="font-size:11.5px;margin:0 0 10px">Counts only, stored in this browser. No answers, no free text, no identity, and nothing is uploaded. Changes made because of feedback: <b>${s.changeLog}</b>.</p>
  <button class="small-btn" onclick="resetEvidence()">Clear local evidence</button>`;
}

/* Derived readout for the Feedback tab. */
function evidenceSummary(){
 const e=evidenceLoad();
 const started=e.sessionsStarted||0, done=e.sessionsCompleted||0;
 const days=(e.experimentDaysDone||[]).length;
 const reflections=(e.reflections||[]).length;
 const enjoyed=(e.reflections||[]).filter(r=>r.enjoyment==='yes').length;
 const mixed=(e.reflections||[]).filter(r=>r.enjoyment==='mixed').length;
 const disliked=(e.reflections||[]).filter(r=>r.enjoyment==='no').length;
 const activeDays=(e.activeDays||[]).length;
 const returned=activeDays>1;
 return {
  sessionsStarted:started,
  sessionsCompleted:done,
  completionRate:started?Math.round(done/started*100):0,
  careersExplored:(e.careersExplored||[]).length,
  experimentsOpened:(e.experimentsOpened||[]).length,
  experimentDaysDone:days,
  experimentDaysPerOpened:(e.experimentsOpened||[]).length?Math.round(days/(e.experimentsOpened||[]).length*10)/10:0,
  reflections,
  enjoyed,mixed,disliked,
  ruledOut:disliked,
  activeDays,returned,
  feedback:e.feedback||null,
  changeLog:(e.changeLog||[]).length
 };
}

/* ================================================================
   AUTH CONSENT GATE
   A student must read and accept the Privacy Policy and the
   Terms & Conditions before the profile form is reachable.
   ================================================================ */
(function initConsentGate(){
  const consentPolicies=document.getElementById('consentPolicies');
  const consentAge=document.getElementById('consentAge');
  const consentAccept=document.getElementById('consentAccept');
  const consentCancel=document.getElementById('consentCancel');
  const consentStep=document.getElementById('consentStep');
  const signupStep=document.getElementById('signupStep');
  const signupForm=document.getElementById('signupForm');
  const authDialog=document.querySelector('#signupModal .modal') || document.querySelector('#authModal .modal');
  if(!consentPolicies||!consentAccept||!signupForm)return;

  function syncConsentButton(){
    const agreed=Boolean(consentPolicies.checked&&consentAge&&consentAge.checked);
    consentAccept.disabled=!agreed;
    consentAccept.setAttribute('aria-disabled',String(!agreed));
  }

  function resetConsentGate(){
    consentPolicies.checked=false;
    if(consentAge)consentAge.checked=false;
    syncConsentButton();
    consentStep&&consentStep.classList.remove('hidden');
    signupStep&&signupStep.classList.add('hidden');
  }

  consentPolicies.addEventListener('change',syncConsentButton);
  consentAge&&consentAge.addEventListener('change',syncConsentButton);

  consentAccept.addEventListener('click',()=>{
    if(consentAccept.disabled)return;
    consentStep&&consentStep.classList.add('hidden');
    signupStep&&signupStep.classList.remove('hidden');
    authDialog&&authDialog.scrollTo({top:0,behavior:'smooth'});
    const firstField=signupForm.querySelector('input[name="name"]');
    firstField&&firstField.focus();
  });

  consentCancel&&consentCancel.addEventListener('click',()=>closeModal('signupModal'));

  window.resetConsentGate=resetConsentGate;

  // Account creation is impossible without the consent step being completed.
  const originalSubmit=signupForm.onsubmit;
  signupForm.onsubmit=function(event){
    if(!(consentPolicies.checked&&(!consentAge||consentAge.checked))){
      event.preventDefault();
      window.openSignup();
      toast('Please read and accept the Privacy Policy and Terms & Conditions first.');
      return false;
    }
    if(typeof originalSubmit==='function')return originalSubmit.call(this,event);
    return false;
  };

  syncConsentButton();
})();


(function initLegalLinks(){
  const termsFoot=document.getElementById('termsFoot');
  termsFoot&&(termsFoot.onclick=()=>openModal('termsModal'));
})();


(function initScrollReveal(){
  const targets=document.querySelectorAll('.reveal');
  if(!targets.length)return;
  if(!('IntersectionObserver' in window)){
    targets.forEach(el=>el.classList.add('in-view'));
    return;
  }
  const observer=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  },{rootMargin:'0px 0px -6% 0px',threshold:0.06});
  targets.forEach(el=>observer.observe(el));

  
  requestAnimationFrame(()=>{
    targets.forEach(el=>{
      const box=el.getBoundingClientRect();
      if(box.top<window.innerHeight*0.94&&box.bottom>0)el.classList.add('in-view');
    });
  });
})();


document.querySelectorAll('.modal-backdrop').forEach(backdrop=>{
  backdrop.addEventListener('click',event=>{
    if(event.target===backdrop)backdrop.classList.add('hidden');
  });
});


(function revealAfterTabChange(){
  const originalGoTab=window.goTab;
  if(typeof originalGoTab!=='function')return;
  window.goTab=function(name){
    originalGoTab(name);
    requestAnimationFrame(()=>{
      document.querySelectorAll('.reveal:not(.in-view)').forEach(el=>{
        const box=el.getBoundingClientRect();
        if(box.top<window.innerHeight*0.94&&box.bottom>0)el.classList.add('in-view');
      });
    });
  };
})();
