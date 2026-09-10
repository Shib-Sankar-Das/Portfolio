// ---------------------------------------------------------------------------
// Single source of truth for the whole portfolio.
//
// NOTE: certificates are NOT here — they live in SQLite (see lib/db.js) and are
// managed through the separate portfolio_admin app.
// To publish a new specialized domain route, add an entry to `domains` below —
// the /[domain] route, navbar links and home-page domain cards all read from it.
// ---------------------------------------------------------------------------

export const profile = {
  name: "Shib Sankar Das",
  initials: "SD",
  phone: "+91 8583068474",
  email: "shibsankardas721@gmail.com",
  location: "Kolkata, West Bengal, India",
  // TODO: replace with your real profile URLs
  links: {
    linkedin: "https://www.linkedin.com/",
    github: "https://github.com/",
  },
  roles: [
    "AI Engineer",
    "Data Scientist",
    "Robotics Engineer",
    "Embedded Systems Developer",
    "Software Developer",
    "Agentic AI Builder",
  ],
  summary:
    "Engineer working across the full intelligence stack — from ML/DL pipelines, LLMs and agentic AI architectures to ESP32 firmware, ROS2 robots and cyber-physical IoT ecosystems. I like owning systems end to end: data and models on one side, sensors and actuators on the other, and clean deployable software in between.",
};

/**
 * Work experience, shared by the timeline on every route and by the dedicated
 * /experience pages.
 *
 * `role`, `company`, `period` and `points` drive the timeline section exactly
 * as before. The rest is what the detail page at /experience/<slug> is built
 * from — all of it optional, so a role with only the basics still renders:
 *
 * | field        | shown as                                                    |
 * | ------------ | ----------------------------------------------------------- |
 * | slug         | the URL: /experience/<slug>                                 |
 * | start / end  | `YYYY-MM`; orders the list and computes the duration        |
 * | type         | Internship, Full-time, Contract…                            |
 * | location     | where it was — left blank here, fill it in if you want it   |
 * | accent       | the colour that tints this role's card and its detail hero  |
 * | summary      | the paragraph under the title                               |
 * | focus        | the chips under the summary — the areas the role covered    |
 * | work         | { title, detail } per thing actually built                  |
 * | achievements | outcomes worth calling out; the section hides when empty    |
 * | stack        | the tools used, listed in the sidebar                       |
 * | links        | { label, url } — anything public to show for the work       |
 */
export const experience = [
  {
    slug: "infosys-springboard",
    role: "AI Intern",
    company: "Infosys Springboard",
    period: "Aug 2025 – Oct 2025",
    start: "2025-08",
    end: "2025-10",
    type: "Internship",
    location: "",
    accent: "#0ea5e9",
    summary:
      "Built computer-vision and NLP components and brought them together into a single multi-modal pipeline, then helped take a recommender system from model to working application.",
    focus: ["Computer Vision", "Natural Language Processing", "Recommender Systems"],
    points: [
      "Developed a YOLO-based computer vision model for real-time emotion recognition.",
      "Integrated CV and NLP modules into a hybrid multi-modal mood analysis pipeline.",
      "Assisted in end-to-end development of a Streamlit-based recommender system.",
    ],
    work: [
      {
        title: "Real-time emotion recognition",
        detail:
          "Developed a YOLO-based computer vision model that reads emotion from a live video stream.",
      },
      {
        title: "Multi-modal mood analysis pipeline",
        detail:
          "Integrated the computer vision and NLP modules into one hybrid pipeline, so a mood reading draws on what is seen and what is said rather than on either alone.",
      },
      {
        title: "Streamlit recommender system",
        detail:
          "Assisted in the end-to-end development of a recommender system delivered as a Streamlit application — model, interface, and the wiring between them.",
      },
    ],
    achievements: [],
    stack: ["Python", "YOLO", "OpenCV", "NLP", "Streamlit"],
    links: [],
  },
  {
    slug: "prof-cess",
    role: "Data Science Intern",
    company: "Prof-Cess",
    period: "Jul 2025 – Sep 2025",
    start: "2025-07",
    end: "2025-09",
    type: "Internship",
    location: "",
    accent: "#8b5cf6",
    summary:
      "Worked on agentic AI: retrieval-augmented assistants that answer from a document set, and LangGraph workflows that turn a plain-English question into the SQL to answer it.",
    focus: ["Agentic AI", "LLMs", "Retrieval-Augmented Generation"],
    points: [
      "Developed agentic AI solutions focused on LLMs and Retrieval-Augmented Generation (RAG).",
      "Built a RAG-based document querying assistant using Google Gemini.",
      "Architected LangGraph-based NL-to-SQL agentic workflows.",
    ],
    work: [
      {
        title: "RAG document-querying assistant",
        detail:
          "Built an assistant on Google Gemini that answers questions against a document set, retrieving the passages it needs rather than relying on the model's own memory.",
      },
      {
        title: "NL-to-SQL agentic workflows",
        detail:
          "Architected LangGraph workflows that take a question in plain English and produce the SQL to answer it, as a graph of steps rather than a single prompt.",
      },
      {
        title: "Agentic AI solutions",
        detail:
          "Developed agentic solutions across the internship, centred on large language models and retrieval-augmented generation.",
      },
    ],
    achievements: [],
    stack: ["Python", "LangGraph", "LangChain", "Google Gemini", "RAG", "SQL"],
    links: [],
  },
  {
    slug: "iiest-shibpur",
    role: "Summer Research Intern",
    company: "IIEST, Shibpur",
    period: "May 2024 – Jul 2024",
    start: "2024-05",
    end: "2024-07",
    type: "Research internship",
    location: "",
    accent: "#f59e0b",
    summary:
      "A research internship that ended in a shipped Android application: a health tracker with a machine-learning model running inside it, built on analysis of a public diabetes dataset.",
    focus: ["Applied Machine Learning", "Android Development", "Research"],
    points: [
      "Developed the native Android application GlucoGuide with 15+ health tracking features.",
      "Integrated a Scikit-learn ML model into a Java-based Android application.",
      "Conducted data preprocessing and EDA on the Pima Indian Diabetes dataset.",
    ],
    work: [
      {
        title: "GlucoGuide — native Android application",
        detail:
          "Developed GlucoGuide, a native Android health tracker carrying more than fifteen tracking features.",
      },
      {
        title: "On-device machine learning",
        detail:
          "Integrated a Scikit-learn model into the Java Android application, so the prediction runs as part of the app rather than as a separate service.",
      },
      {
        title: "Dataset analysis",
        detail:
          "Carried out the data preprocessing and exploratory analysis on the Pima Indian Diabetes dataset that the model was built from.",
      },
    ],
    achievements: [],
    stack: ["Java", "Android Studio", "Python", "Scikit-learn", "Pandas"],
    links: [],
  },
];

/** Newest first, by start date. */
export function experienceByDate() {
  return [...experience].sort((a, b) => (b.start ?? "").localeCompare(a.start ?? ""));
}

export function getExperience(slug) {
  return experience.find((job) => job.slug === slug) ?? null;
}

/** Adjacent roles, for the prev/next links at the foot of a detail page. */
export function experienceNeighbours(slug) {
  const ordered = experienceByDate();
  const i = ordered.findIndex((job) => job.slug === slug);
  if (i === -1) return { newer: null, older: null };
  return {
    newer: i > 0 ? ordered[i - 1] : null,
    older: i < ordered.length - 1 ? ordered[i + 1] : null,
  };
}

/**
 * How long a role ran, in whole months, counting both end months. Returns null
 * when the dates are missing, so nothing is claimed that the data does not say.
 */
export function experienceMonths({ start, end } = {}) {
  if (!start) return null;
  const [sy, sm] = start.split("-").map(Number);
  const [ey, em] = (end || start).split("-").map(Number);
  if (!sy || !sm || !ey || !em) return null;
  return (ey - sy) * 12 + (em - sm) + 1;
}

/** "3 months", "1 year 2 months" — the duration as it should read on a label. */
export function experienceDuration(job) {
  const months = experienceMonths(job);
  if (!months || months < 1) return null;
  const years = Math.floor(months / 12);
  const rest = months % 12;
  const parts = [];
  if (years) parts.push(`${years} year${years === 1 ? "" : "s"}`);
  if (rest) parts.push(`${rest} month${rest === 1 ? "" : "s"}`);
  return parts.join(" ");
}

export const education = [
  {
    degree: "B.Tech in Computer Science & Engineering",
    school: "Bengal Institute of Technology (MAKAUT)",
    period: "Oct 2022 – Present",
    score: "CGPA: 7.77",
  },
  {
    degree: "Higher Secondary (Science)",
    school: "Narikeldanga High School (WBCHSE)",
    period: "Jun 2021 – Jun 2022",
    score: "Grade: 87.2%",
  },
  {
    degree: "Secondary",
    school: "Narikeldanga High School (WBBSE)",
    period: "Jan 2019 – Jun 2020",
    score: "Grade: 82.3%",
  },
];

export const domains = [
  {
    slug: "ai-data-science",
    themeClass: "theme-ai",
    icon: "brain",
    title: "AI Engineering & Data Science",
    shortTitle: "AI & Data Science",
    tagline: "ML/DL systems, LLMs, RAG and agentic AI architectures",
    heroColors: { primary: "#22d3ee", secondary: "#60a5fa" },
    summary:
      "AI Engineer and Data Science professional with hands-on experience in end-to-end ML/DL system design and deployment. Skilled in building scalable AI pipelines using Python, Scikit-learn, TensorFlow, YOLO, and the LangChain ecosystem (LangGraph). Experienced in CV, LLMs, RAG, and agentic AI architectures, with a strong foundation in DSA, data preprocessing, feature engineering, and performance evaluation.",
    highlights: ["Computer Vision", "LLMs & RAG", "Agentic AI", "MLOps & Deployment"],
    skills: [
      { group: "Languages", items: ["Python", "Java", "C", "JavaScript", "Dart"] },
      { group: "ML & DL", items: ["TensorFlow", "PyTorch", "Scikit-learn", "OpenCV", "YOLO"] },
      { group: "AI & Automation", items: ["n8n", "LangChain", "LangGraph", "RAG", "LoRA / QLoRA Fine-tuning"] },
      { group: "Data Engineering", items: ["Pandas", "NumPy", "SQL", "MongoDB", "Pinecone", "ChromaDB", "Power BI"] },
      { group: "Deployment", items: ["Streamlit", "FastAPI", "Flask", "REST APIs", "Docker", "AWS"] },
      { group: "Tools", items: ["Git", "GitHub", "Postman", "VS Code", "Android Studio"] },
    ],
    projects: [
      {
        name: "SQL Agent — AI-Powered Database Assistant",
        stack: ["LangGraph", "Google Gemini", "Streamlit", "SQL"],
        github: "https://github.com/",
        points: [
          "Architected a stateful, self-correcting agentic AI workflow using LangGraph.",
          "Implemented NL-to-SQL generation with automated error recovery using Google Gemini.",
          "Built a full-stack multi-page Streamlit application with CRUD database management.",
        ],
      },
      {
        name: "AI-MoodMate — Mood Detection to Music Recommendation",
        stack: ["YOLO", "NLP", "Streamlit", "Python"],
        github: "https://github.com/",
        points: [
          "Trained a YOLO model achieving 88.7% mAP@50 for multi-class emotion detection.",
          "Built a hybrid CV + NLP emotion pipeline with content-based music recommendation.",
          "Deployed the end-to-end system using Streamlit.",
        ],
      },
      {
        name: "GlucoGuide — AI Diabetes Prediction & Monitoring App",
        stack: ["Random Forest", "Android", "Scikit-learn", "Java"],
        points: [
          "Achieved 90.91% prediction accuracy using a Random Forest model.",
          "Developed a native Android app featuring real-time health analytics and visualization.",
          "Built an AI nutrition analyzer using image recognition and barcode scanning.",
        ],
      },
    ],
    certificateSlugs: [
      "oci-2025-data-science-professional",
      "oci-2025-ai-foundations-associate",
      "microsoft-fabric-data-engineer-associate",
    ],
  },
  {
    slug: "robotics-embedded",
    themeClass: "theme-robotics",
    icon: "cpu",
    title: "Robotics & Embedded Systems",
    shortTitle: "Robotics & Embedded",
    tagline: "ESP32 firmware, ROS2 robots and intelligent IoT ecosystems",
    heroColors: { primary: "#fbbf24", secondary: "#fb7185" },
    summary:
      "Robotics and Embedded Systems Engineer with hands-on experience in designing and deploying smart hardware and IoT solutions using ESP32, Arduino, sensors, and wireless communication modules. Skilled in embedded firmware development, real-time data acquisition, and system integration with AI-driven automation, ROS/Gazebo-based robotics workflows, web dashboards, and cloud services.",
    highlights: ["ROS2 & Nav2", "Embedded Firmware", "Wireless Telemetry", "Cyber-Physical Systems"],
    skills: [
      { group: "Languages", items: ["Python", "Java", "C", "Embedded C", "JavaScript", "Dart"] },
      { group: "Microcontrollers", items: ["ESP32 (C3/S3/CAM)", "ESP8266", "Arduino Uno/Nano", "Raspberry Pi 5 / Pico W"] },
      { group: "Communication", items: ["MQTT", "HTTP", "Wi-Fi", "Bluetooth", "LoRa (433MHz)", "nRF24L01 (2.4GHz)"] },
      { group: "Robotics", items: ["ROS2 Humble", "Gazebo", "Nav2", "CycloneDDS", "Lidar Fusion"] },
      { group: "AI & ML", items: ["TensorFlow", "Scikit-learn", "OpenCV", "YOLO v11", "LangChain", "LangGraph", "RAG", "n8n"] },
      { group: "Cloud & Deployment", items: ["Streamlit", "FastAPI", "Flask", "REST APIs", "Docker", "AWS", "Blynk IoT", "ThingSpeak"] },
      { group: "Databases", items: ["MySQL", "PostgreSQL", "Firebase", "MongoDB"] },
      { group: "Tools", items: ["Git", "GitHub", "Arduino IDE", "Thonny IDE", "VS Code", "Android Studio", "Postman"] },
    ],
    projects: [
      {
        name: "Autonomous Patrolling Robot (ROS2)",
        stack: ["ROS2 Humble", "Nav2", "Gazebo", "CycloneDDS"],
        github: "https://github.com/",
        points: [
          "Orchestrated ROS2 Humble navigation stack for 24-waypoint patrol using Nav2 behavior trees.",
          "Configured CycloneDDS with 1MB buffers to eliminate Lidar packet loss.",
          "Coded safety layer with 0.35m emergency stop thresholds using 2D Lidar data fusion.",
        ],
      },
      {
        name: "LoRa-Based Long Range GPS Tracker",
        stack: ["ESP32", "LoRa 433MHz", "SPI", "UART"],
        github: "https://github.com/",
        points: [
          "Engineered 433MHz LoRa telemetry architecture for off-grid asset tracking.",
          "Interfaced GPS (UART) and LoRa (SPI) modules, optimizing packet struct efficiency.",
          "Achieved reliable point-to-point Tx/Rx via ESP32 hardware logic integration.",
        ],
      },
      {
        name: "Wireless Dual-Joystick Control RC Car",
        stack: ["Arduino Nano", "nRF24L01", "L298N", "LM2596"],
        github: "https://github.com/",
        points: [
          "Designed a custom 2.4GHz transmitter-receiver pair using nRF24L01 modules with ACK payloads.",
          "Implemented differential steering algorithms to map dual analog joystick inputs to PWM motor signals.",
          "Optimized power distribution using LM2596 Buck Converters to isolate logic (5V) from motor loads (12V).",
        ],
      },
    ],
    certificateSlugs: [
      "robo-ai-kelvin-industrial-training",
      "embedded-systems-with-arduino",
      "oci-2025-data-science-professional",
    ],
  },
  {
    slug: "software-developer",
    themeClass: "theme-software",
    icon: "code",
    title: "Software Development",
    shortTitle: "Software Dev",
    tagline: "Full-stack web apps, native Android and clean, deployable APIs",
    heroColors: { primary: "#34d399", secondary: "#2dd4bf" },
    summary:
      "Software Developer with hands-on experience building full-stack web applications, native Android apps and REST APIs — and shipping them. Comfortable across the stack: modern JavaScript frontends, Python backends with FastAPI and Flask, Java-based Android development, and relational and NoSQL databases, all backed by a strong foundation in Data Structures and Algorithms, Git-based workflows and Docker/AWS deployment.",
    highlights: ["Full-Stack Web", "Android Development", "REST APIs", "DSA & Problem Solving"],
    skills: [
      { group: "Languages", items: ["Python", "Java", "C", "JavaScript", "Dart"] },
      { group: "Frontend", items: ["Next.js", "React", "Tailwind CSS", "Three.js", "Streamlit"] },
      { group: "Backend & APIs", items: ["FastAPI", "Flask", "REST APIs", "Postman"] },
      { group: "Mobile", items: ["Native Android (Java)", "Android Studio"] },
      { group: "Databases", items: ["SQL", "MySQL", "PostgreSQL", "MongoDB", "Firebase"] },
      { group: "DevOps & Cloud", items: ["Git", "GitHub", "Docker", "AWS"] },
      { group: "Foundations", items: ["Data Structures & Algorithms", "OOP", "Debugging & Testing"] },
      { group: "Tools", items: ["VS Code", "Android Studio", "Postman", "GitHub"] },
    ],
    projects: [
      {
        name: "SQL Agent — Full-Stack Database Assistant",
        stack: ["Streamlit", "Python", "SQL", "Google Gemini"],
        github: "https://github.com/",
        points: [
          "Built a full-stack multi-page Streamlit application with CRUD database management.",
          "Implemented NL-to-SQL generation with automated error recovery using Google Gemini.",
          "Architected a stateful, self-correcting workflow with clean separation between UI, agent logic and data layers.",
        ],
      },
      {
        name: "GlucoGuide — Native Android Health App",
        stack: ["Java", "Android", "Scikit-learn", "SQLite"],
        points: [
          "Developed a native Android app with 15+ health tracking features, real-time analytics and visualization.",
          "Integrated a Scikit-learn ML model into a Java-based Android application.",
          "Built an AI nutrition analyzer using image recognition and barcode scanning.",
        ],
      },
      {
        name: "Multi-Domain Portfolio Platform (this site)",
        stack: ["Next.js 16", "React 19", "Tailwind v4", "Three.js"],
        github: "https://github.com/",
        points: [
          "Designed a data-driven multi-route architecture where each specialization ships as its own statically generated page.",
          "Built an interactive Three.js hero with parallax scrolling, Web Worker particle generation and adaptive quality per device.",
          "Optimized delivery with code splitting, deferred 3D mounting, LazyMotion and content-visibility rendering.",
        ],
      },
    ],
    certificateSlugs: [
      "microsoft-fabric-data-engineer-associate",
      "oci-2025-data-science-professional",
    ],
  },
];

// Merged skill groups shown on the primary route (all profiles combined).
export const combinedSkills = [
  { group: "Languages", items: ["Python", "Java", "C", "Embedded C", "JavaScript", "Dart"] },
  { group: "AI & Machine Learning", items: ["TensorFlow", "PyTorch", "Scikit-learn", "OpenCV", "YOLO", "LangChain", "LangGraph", "RAG", "LoRA / QLoRA", "n8n"] },
  { group: "Robotics & Embedded", items: ["ESP32", "ESP8266", "Arduino", "Raspberry Pi", "ROS2", "Gazebo", "Nav2", "MQTT", "LoRa", "nRF24L01"] },
  { group: "Data & Databases", items: ["Pandas", "NumPy", "SQL", "MySQL", "PostgreSQL", "MongoDB", "Firebase", "Pinecone", "ChromaDB", "Power BI"] },
  { group: "Cloud & Deployment", items: ["Streamlit", "FastAPI", "Flask", "REST APIs", "Docker", "AWS", "Blynk IoT", "ThingSpeak"] },
  { group: "Tools", items: ["Git", "GitHub", "Postman", "VS Code", "Android Studio", "Arduino IDE", "Thonny IDE"] },
];

export function getDomain(slug) {
  return domains.find((d) => d.slug === slug);
}

