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

export const experience = [
  {
    role: "AI Intern",
    company: "Infosys Springboard",
    period: "Aug 2025 – Oct 2025",
    points: [
      "Developed a YOLO-based computer vision model for real-time emotion recognition.",
      "Integrated CV and NLP modules into a hybrid multi-modal mood analysis pipeline.",
      "Assisted in end-to-end development of a Streamlit-based recommender system.",
    ],
  },
  {
    role: "Data Science Intern",
    company: "Prof-Cess",
    period: "Jul 2025 – Sep 2025",
    points: [
      "Developed agentic AI solutions focused on LLMs and Retrieval-Augmented Generation (RAG).",
      "Built a RAG-based document querying assistant using Google Gemini.",
      "Architected LangGraph-based NL-to-SQL agentic workflows.",
    ],
  },
  {
    role: "Summer Research Intern",
    company: "IIEST, Shibpur",
    period: "May 2024 – Jul 2024",
    points: [
      "Developed the native Android application GlucoGuide with 15+ health tracking features.",
      "Integrated a Scikit-learn ML model into a Java-based Android application.",
      "Conducted data preprocessing and EDA on the Pima Indian Diabetes dataset.",
    ],
  },
];

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

