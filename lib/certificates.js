// ---------------------------------------------------------------------------
// Single source of truth for every certification.
//
// Domain routes reference these by `slug` (see `certificateSlugs` in data.js),
// the /certificates wall renders all of them, and /certificates/[slug] renders
// one in detail. To add a certificate, append an entry here — the gallery, its
// filters, the detail page and the static routes all pick it up automatically.
//
// `issued` / `expires` are ISO dates used for sorting and expiry maths;
// `date` is the human label shown in compact lists.
// `image` is optional: drop a scan in public/images/certificates/ and set the
// path, otherwise a designed frame is composed from the metadata below.
// ---------------------------------------------------------------------------

export const certificates = [
  {
    slug: "microsoft-fabric-data-engineer-associate",
    name: "Microsoft Certified: Fabric Data Engineer Associate",
    shortName: "Fabric Data Engineer Associate",
    org: "Microsoft",
    orgUrl: "https://learn.microsoft.com/en-us/credentials/",
    orgColor: "#0078D4",
    kind: "Role-based Certification",
    credentialId: "",
    issued: "2026-02-01",
    date: "Feb 2026",
    expires: "2027-02-01",
    renewable: true,
    verifyUrl: "#",
    image: null,
    summary:
      "Validates the ability to design, build and operate analytics solutions on Microsoft Fabric — from ingestion pipelines through lakehouse modelling to production-grade data serving.",
    description:
      "Microsoft's Fabric Data Engineer Associate credential covers the end-to-end data engineering lifecycle inside Microsoft Fabric. It assesses practical skill in designing lakehouse and warehouse architectures, building batch and streaming ingestion pipelines, transforming data with Spark notebooks and dataflows, and operationalising the result with monitoring, security and performance tuning. Earning it required hands-on work with Fabric workspaces, Delta Lake tables, medallion architecture patterns, and the SQL and KQL query surfaces Fabric exposes.",
    skills: [
      "Data Engineering",
      "Microsoft Fabric",
      "Data Pipelines",
      "Lakehouse Architecture",
      "Apache Spark",
      "SQL",
      "Data Warehousing",
      "ETL / ELT",
    ],
    highlights: [
      "Designed lakehouse and medallion architectures on Delta Lake.",
      "Built batch and streaming ingestion pipelines with Fabric Data Factory.",
      "Operationalised workloads with monitoring, security and performance tuning.",
    ],
  },
  {
    slug: "robo-ai-kelvin-industrial-training",
    name: "ROBO AI || KELVIN : Industrial Training Program",
    shortName: "ROBO AI || KELVIN",
    org: "My Equation",
    orgUrl: "https://myequation.in/",
    orgColor: "#7C3AED",
    kind: "Industrial Training Program",
    credentialId: "",
    issued: "2026-01-01",
    date: "Jan 2026",
    expires: null,
    renewable: false,
    verifyUrl: "#",
    image: null,
    summary:
      "An industry training program pairing robotics fundamentals with applied AI — covering autonomous system design, sensor integration and deployment onto real hardware.",
    description:
      "The ROBO AI || KELVIN industrial training program focused on building intelligent robotic systems end to end. The curriculum moved from robotics fundamentals — kinematics, actuation and sensor fusion — into applied AI for perception and decision making, then into deploying those models onto physical hardware. Project work covered autonomous navigation behaviour, sensor-driven safety layers, and the integration glue between embedded controllers and higher-level AI planning.",
    skills: [
      "Robotics",
      "ROS2",
      "Embedded Systems",
      "Sensor Integration",
      "Autonomous Navigation",
      "Automation",
      "Computer Vision",
    ],
    highlights: [
      "Built autonomous robot behaviours from perception through to actuation.",
      "Integrated multi-sensor inputs into real-time control loops.",
      "Deployed AI models onto embedded robotic hardware.",
    ],
  },
  {
    slug: "embedded-systems-with-arduino",
    name: "Embedded Systems with Arduino",
    shortName: "Embedded Systems with Arduino",
    org: "GeeksforGeeks",
    orgUrl: "https://www.geeksforgeeks.org/",
    orgColor: "#2F8D46",
    kind: "Course Certificate",
    credentialId: "",
    issued: "2025-11-01",
    date: "Nov 2025",
    expires: null,
    renewable: false,
    verifyUrl: "#",
    image: null,
    summary:
      "Firmware-level embedded development on Arduino — microcontroller architecture, peripheral interfacing, and writing efficient Embedded C for constrained hardware.",
    description:
      "This course covered embedded systems development from the microcontroller up. It worked through Arduino architecture and the AVR peripherals beneath it, digital and analog I/O, timers and interrupts, PWM generation, and the serial protocols (UART, SPI, I2C) used to talk to sensors and modules. The emphasis throughout was on writing efficient Embedded C for memory- and power-constrained targets, and on debugging real circuits rather than simulations.",
    skills: [
      "Arduino",
      "Embedded C",
      "Microcontrollers",
      "Sensor Interfacing",
      "Circuit Design",
      "UART / SPI / I2C",
      "Interrupts & Timers",
    ],
    highlights: [
      "Programmed AVR-based microcontrollers in Embedded C.",
      "Interfaced sensors and modules over UART, SPI and I2C.",
      "Worked with interrupts, timers and PWM on constrained hardware.",
    ],
  },
  {
    slug: "oci-2025-data-science-professional",
    name: "Oracle Cloud Infrastructure 2025 Certified Data Science Professional",
    shortName: "OCI Data Science Professional",
    org: "Oracle",
    orgUrl: "https://education.oracle.com/",
    orgColor: "#C74634",
    kind: "Professional Certification",
    credentialId: "",
    issued: "2025-10-01",
    date: "Oct 2025",
    expires: "2027-10-01",
    renewable: true,
    verifyUrl: "#",
    image: null,
    summary:
      "Professional-level validation of the full machine learning lifecycle on Oracle Cloud Infrastructure — from data preparation through model training to production deployment and monitoring.",
    description:
      "The OCI Data Science Professional certification assesses the complete machine learning workflow on Oracle Cloud Infrastructure. It covers provisioning and working within the OCI Data Science service, preparing and engineering features from raw data, training and evaluating models including AutoML-assisted workflows, then packaging those models into the model catalog and deploying them as production endpoints. The MLOps half covers versioning, pipelines, monitoring deployed models for drift, and the security and networking configuration production data science workloads require.",
    skills: [
      "Machine Learning",
      "Data Science",
      "MLOps",
      "Model Deployment",
      "Feature Engineering",
      "Python",
      "AutoML",
      "Oracle Cloud Infrastructure",
    ],
    highlights: [
      "Built and evaluated ML models inside the OCI Data Science service.",
      "Deployed models as versioned, monitored production endpoints.",
      "Applied MLOps practice: pipelines, model catalog and drift monitoring.",
    ],
  },
  {
    slug: "oci-2025-ai-foundations-associate",
    name: "Oracle Cloud Infrastructure 2025 Certified AI Foundations Associate",
    shortName: "OCI AI Foundations Associate",
    org: "Oracle",
    orgUrl: "https://education.oracle.com/",
    orgColor: "#C74634",
    kind: "Associate Certification",
    credentialId: "",
    issued: "2025-10-01",
    date: "Oct 2025",
    expires: null,
    renewable: false,
    verifyUrl: "#",
    image: null,
    summary:
      "Foundational certification across AI, machine learning and deep learning concepts, plus the generative AI and LLM services offered on Oracle Cloud Infrastructure.",
    description:
      "The OCI AI Foundations Associate credential establishes the conceptual groundwork beneath applied AI work. It spans core machine learning paradigms (supervised, unsupervised and reinforcement learning), deep learning architectures including CNNs, RNNs and transformers, and the modern generative AI stack — large language models, prompt engineering, embeddings and vector search, and retrieval-augmented generation. The OCI half covers the managed AI services available on Oracle Cloud and when each is the right tool for a problem.",
    skills: [
      "AI Fundamentals",
      "Machine Learning",
      "Deep Learning",
      "Generative AI",
      "LLMs",
      "Prompt Engineering",
      "Oracle Cloud Infrastructure",
    ],
    highlights: [
      "Covered supervised, unsupervised and reinforcement learning paradigms.",
      "Worked through CNN, RNN and transformer architectures.",
      "Studied LLMs, embeddings and retrieval-augmented generation on OCI.",
    ],
  },
];

/** Newest first — the default order everywhere. */
export function certificatesByDate(list = certificates) {
  return [...list].sort((a, b) => b.issued.localeCompare(a.issued));
}

export function getCertificate(slug) {
  return certificates.find((c) => c.slug === slug);
}

export function certificatesForSlugs(slugs = []) {
  return slugs.map((s) => getCertificate(s)).filter(Boolean);
}

/** Unique issuing organisations, with how many certificates each issued. */
export function certificateOrgs() {
  const map = new Map();
  for (const c of certificates) map.set(c.org, (map.get(c.org) ?? 0) + 1);
  return [...map.entries()]
    .map(([org, count]) => ({ org, count }))
    .sort((a, b) => b.count - a.count || a.org.localeCompare(b.org));
}

/** Unique skills across all certificates, most-common first. */
export function certificateSkills() {
  const map = new Map();
  for (const c of certificates) {
    for (const s of c.skills) map.set(s, (map.get(s) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([skill, count]) => ({ skill, count }))
    .sort((a, b) => b.count - a.count || a.skill.localeCompare(b.skill));
}

/** "lifetime" | "active" | "expiring" | "expired" */
export function certificateStatus(cert, now = new Date()) {
  if (!cert.expires) return "lifetime";
  const expiry = new Date(cert.expires);
  if (expiry <= now) return "expired";
  const monthsLeft = (expiry - now) / (1000 * 60 * 60 * 24 * 30.44);
  return monthsLeft <= 3 ? "expiring" : "active";
}

export function formatMonthYear(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Adjacent certificates (by date) for prev/next navigation on detail pages. */
export function certificateNeighbours(slug) {
  const ordered = certificatesByDate();
  const i = ordered.findIndex((c) => c.slug === slug);
  if (i === -1) return { prev: null, next: null };
  return {
    prev: i > 0 ? ordered[i - 1] : null,
    next: i < ordered.length - 1 ? ordered[i + 1] : null,
  };
}
