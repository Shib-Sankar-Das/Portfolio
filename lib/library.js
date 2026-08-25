// ---------------------------------------------------------------------------
// The Library: shelves of books, plus stapled bundles of research papers.
//
// Each shelf is one section. Books open as a two-page spread; paper bundles
// open as a corner-stapled stack. To add something, append to the arrays below
// — the shelf, the reader and the page count all follow from the data.
//
// NOTE: the books and papers here are real and correctly attributed, but the
// short notes on each are drafts — rewrite them in your own words.
// ---------------------------------------------------------------------------

/** Page helper: a heading plus body paragraphs, and optionally a pull quote. */
const page = (heading, body, quote = null) => ({ heading, body, quote });

export const shelves = [
  {
    slug: "literature",
    title: "Literature",
    tagline: "Stories and ideas that sit outside the syllabus",
    accent: "#b45309",
    books: [
      {
        id: "wings-of-fire",
        title: "Wings of Fire",
        author: "A. P. J. Abdul Kalam",
        year: 1999,
        spine: "#c2410c",
        pages: [
          page(
            "An autobiography",
            [
              "Kalam's account of his journey from Rameswaram to India's space and missile programmes, written with Arun Tiwari.",
              "It is less a list of achievements than a record of how a scientific career is actually built: slowly, through failure, mentorship and stubborn curiosity.",
            ],
            "Dream is not that which you see while sleeping; it is something that does not let you sleep."
          ),
          page("Why engineers read it", [
            "The engineering chapters are unusually honest about setbacks — the SLV-3 failure is given as much space as the successes.",
            "It also captures how large technical teams are held together: by shared purpose more than by hierarchy.",
          ]),
          page("Takeaways", [
            "Ambition is sustained by preparation, not by inspiration.",
            "Failure analysis is a discipline, not an emotion.",
            "Mentors matter more than institutions early in a career.",
          ]),
        ],
      },
      {
        id: "the-alchemist",
        title: "The Alchemist",
        author: "Paulo Coelho",
        year: 1988,
        spine: "#a16207",
        pages: [
          page(
            "A fable about following a calling",
            [
              "Santiago, an Andalusian shepherd, travels toward a recurring dream of treasure at the Egyptian pyramids.",
              "The plot is simple on purpose; the book is really a sustained argument about paying attention to what you actually want.",
            ],
            "When you want something, all the universe conspires in helping you to achieve it."
          ),
          page("Takeaways", [
            "Direction beats speed — most wasted effort is well-executed work on the wrong thing.",
            "The obstacles on a chosen path are information, not verdicts.",
          ]),
        ],
      },
      {
        id: "sapiens",
        title: "Sapiens",
        author: "Yuval Noah Harari",
        year: 2011,
        spine: "#78350f",
        pages: [
          page("A brief history of humankind", [
            "Harari traces Homo sapiens from the Cognitive Revolution through the Agricultural and Scientific Revolutions.",
            "The central claim is that shared fictions — money, nations, corporations, laws — are what let large groups of strangers cooperate.",
          ]),
          page("Why it belongs on a technologist's shelf", [
            "It reframes technology as one more shared story with real consequences, which is a useful lens when building systems that mediate how people work.",
            "The closing chapters on the future of the species read very differently after working with machine learning.",
          ]),
        ],
      },
      {
        id: "meditations",
        title: "Meditations",
        author: "Marcus Aurelius",
        year: 180,
        spine: "#57534e",
        pages: [
          page(
            "Private notes of a Roman emperor",
            [
              "Written as a personal journal rather than for publication, which is exactly why it still reads directly.",
              "The recurring theme is the separation between what is within your control and what is not.",
            ],
            "You have power over your mind — not outside events. Realise this, and you will find strength."
          ),
          page("Takeaways", [
            "Judgement is a choice made after the event, not a property of the event.",
            "Work is worth doing for its own sake, independent of who notices.",
          ]),
        ],
      },
    ],
  },

  {
    slug: "computer-science",
    title: "Computer Science",
    tagline: "The fundamentals underneath everything else",
    accent: "#0369a1",
    books: [
      {
        id: "clrs",
        title: "Introduction to Algorithms",
        author: "Cormen, Leiserson, Rivest & Stein",
        year: 2009,
        spine: "#1e3a8a",
        thick: true,
        pages: [
          page("The reference text", [
            "Known universally as CLRS. It covers algorithm design and analysis from asymptotic notation through graph algorithms, dynamic programming, and NP-completeness.",
            "It is a reference more than a cover-to-cover read — most chapters stand alone.",
          ]),
          page("What it is good for", [
            "Correctness proofs alongside implementations, which is the part most tutorials skip.",
            "The dynamic programming and graph chapters are the ones that pay off repeatedly in interviews and in practice.",
          ]),
          page("Takeaways", [
            "Asymptotic analysis is a design tool, not a post-hoc justification.",
            "Most practical problems reduce to a graph, a sort, or a table you fill in once.",
          ]),
        ],
      },
      {
        id: "ddia",
        title: "Designing Data-Intensive Applications",
        author: "Martin Kleppmann",
        year: 2017,
        spine: "#0e7490",
        thick: true,
        pages: [
          page("How data systems actually behave", [
            "Covers storage engines, encoding, replication, partitioning, transactions, consistency and stream processing — with the trade-offs made explicit.",
            "It explains why distributed systems fail in the specific ways they do, rather than presenting a catalogue of tools.",
          ]),
          page("Why it matters for AI work", [
            "Models are a small part of a production system; the rest is ingestion, storage and delivery.",
            "The chapters on batch and stream processing map directly onto building training and inference pipelines.",
          ]),
          page("Takeaways", [
            "There is no consistency model that is free — you choose which failure you can live with.",
            "Schema evolution is a first-class design concern, not an afterthought.",
          ]),
        ],
      },
      {
        id: "clean-code",
        title: "Clean Code",
        author: "Robert C. Martin",
        year: 2008,
        spine: "#334155",
        pages: [
          page("A handbook of agile software craftsmanship", [
            "Argues that readability is the dominant cost in software, and gives concrete rules for naming, functions, error handling and tests.",
            "Worth reading critically — some prescriptions are stricter than most teams need — but the core argument holds.",
          ]),
          page("Takeaways", [
            "Code is read far more often than it is written.",
            "A function should do one thing at one level of abstraction.",
          ]),
        ],
      },
      {
        id: "pragmatic-programmer",
        title: "The Pragmatic Programmer",
        author: "Andrew Hunt & David Thomas",
        year: 1999,
        spine: "#475569",
        pages: [
          page("From journeyman to master", [
            "A collection of practical habits: DRY, orthogonality, tracer bullets, and treating your knowledge as an investment portfolio.",
            "Less about any one language and more about how to keep working effectively over a whole career.",
          ]),
          page("Takeaways", [
            "Automate anything you have done manually three times.",
            "Prototypes exist to be thrown away; tracer bullets exist to be kept.",
          ]),
        ],
      },
    ],
  },

  {
    slug: "robotics",
    title: "Robotics",
    tagline: "Making software move things in the real world",
    accent: "#b91c1c",
    books: [
      {
        id: "probabilistic-robotics",
        title: "Probabilistic Robotics",
        author: "Thrun, Burgard & Fox",
        year: 2005,
        spine: "#7f1d1d",
        thick: true,
        pages: [
          page("Robotics under uncertainty", [
            "Builds robotics on probability: Bayes filters, Kalman and particle filters, localisation, SLAM and probabilistic planning.",
            "The premise is that sensors and actuators are both noisy, so a robot should track a belief rather than a state.",
          ]),
          page("Where it shows up in practice", [
            "AMCL — the localisation used in ROS navigation stacks — is a direct implementation of the particle filter described here.",
            "It explains why a Lidar-driven safety layer needs a confidence threshold, not just a distance threshold.",
          ]),
          page("Takeaways", [
            "A robot never knows where it is; it knows a distribution over where it might be.",
            "Sensor fusion is Bayesian updating, not averaging.",
          ]),
        ],
      },
      {
        id: "modern-robotics",
        title: "Modern Robotics",
        author: "Kevin Lynch & Frank Park",
        year: 2017,
        spine: "#9a3412",
        pages: [
          page("Mechanics, planning and control", [
            "Uses screw theory and the product-of-exponentials formulation to give a unified treatment of kinematics and dynamics.",
            "Accompanied by an open course and code library, which makes the maths testable rather than abstract.",
          ]),
          page("Takeaways", [
            "Configuration space is the right place to think about motion planning.",
            "Forward kinematics is easy; inverse kinematics is where the engineering lives.",
          ]),
        ],
      },
      {
        id: "autonomous-mobile-robots",
        title: "Introduction to Autonomous Mobile Robots",
        author: "Siegwart, Nourbakhsh & Scaramuzza",
        year: 2011,
        spine: "#b45309",
        pages: [
          page("Locomotion to navigation", [
            "Covers wheeled locomotion and kinematics, sensors, perception, localisation and navigation architectures in one arc.",
            "A good bridge between the hardware and the planning stack.",
          ]),
          page("Takeaways", [
            "Differential drive kinematics constrain what any path planner can ask for.",
            "Sensor choice determines which localisation methods are even available to you.",
          ]),
        ],
      },
      {
        id: "programming-arduino",
        title: "Programming Arduino",
        author: "Simon Monk",
        year: 2016,
        spine: "#166534",
        pages: [
          page("Getting started with sketches", [
            "A short, practical introduction to the Arduino language, digital and analog I/O, interrupts and serial communication.",
            "Deliberately narrow — it gets you to working hardware quickly rather than covering AVR internals.",
          ]),
          page("Takeaways", [
            "Blocking delays are the first thing to remove from a real firmware loop.",
            "Interrupts are for events, not for work.",
          ]),
        ],
      },
    ],
    // Corner-stapled bundles rather than bound books.
    bundles: [
      {
        id: "perception-navigation",
        title: "Perception & Navigation",
        subtitle: "Papers behind the robot stack",
        accent: "#b91c1c",
        papers: [
          {
            title: "You Only Look Once: Unified, Real-Time Object Detection",
            authors: "Joseph Redmon, Santosh Divvala, Ross Girshick, Ali Farhadi",
            venue: "CVPR",
            year: 2016,
            link: "https://arxiv.org/abs/1506.02640",
            abstract:
              "Frames object detection as a single regression problem — straight from image pixels to bounding box coordinates and class probabilities — rather than a pipeline of region proposals and classifiers.",
            contributions: [
              "A single network evaluated once per image, making real-time detection practical.",
              "Global reasoning over the whole image, which reduces background false positives.",
              "A unified loss covering localisation and classification together.",
            ],
          },
          {
            title: "ROS: an open-source Robot Operating System",
            authors: "Morgan Quigley et al.",
            venue: "ICRA Workshop on Open Source Software",
            year: 2009,
            link: null,
            abstract:
              "Describes a peer-to-peer, tools-based, multi-lingual framework for robot software, built around nodes that communicate over named topics and services.",
            contributions: [
              "A message-passing architecture that decouples drivers, perception and planning.",
              "Reusable packages, which made robotics research reproducible across labs.",
              "The conceptual base that ROS 2 later rebuilt on DDS for real-time use.",
            ],
          },
          {
            title: "Rapidly-Exploring Random Trees: A New Tool for Path Planning",
            authors: "Steven M. LaValle",
            venue: "Technical Report, Iowa State University",
            year: 1998,
            link: null,
            abstract:
              "Introduces RRT, an incremental sampling algorithm that grows a tree biased toward unexplored regions of configuration space, handling high-dimensional and differentially constrained planning.",
            contributions: [
              "Sampling-based planning that scales where grid search does not.",
              "Probabilistic completeness without building an explicit obstacle map.",
              "The basis for RRT* and much of modern motion planning.",
            ],
          },
        ],
      },
    ],
  },

  {
    slug: "artificial-intelligence",
    title: "Artificial Intelligence",
    tagline: "From search and inference to transformers",
    accent: "#6d28d9",
    books: [
      {
        id: "aima",
        title: "Artificial Intelligence: A Modern Approach",
        author: "Stuart Russell & Peter Norvig",
        year: 2020,
        spine: "#4c1d95",
        thick: true,
        pages: [
          page("The standard survey", [
            "Organises AI around the idea of rational agents, covering search, logic, probabilistic reasoning, learning, perception and ethics.",
            "The fourth edition substantially expands the treatment of deep learning and of safety.",
          ]),
          page("Why start here", [
            "It gives a map of the field, which makes it obvious where any one technique — RAG, planning, reinforcement learning — actually sits.",
            "The search and constraint-satisfaction chapters remain the clearest explanation of what an 'agent' is doing.",
          ]),
          page("Takeaways", [
            "Most agent behaviour is search under a well-chosen representation.",
            "Rationality is defined relative to a performance measure you have to choose deliberately.",
          ]),
        ],
      },
      {
        id: "deep-learning",
        title: "Deep Learning",
        author: "Goodfellow, Bengio & Courville",
        year: 2016,
        spine: "#312e81",
        thick: true,
        pages: [
          page("The theory volume", [
            "Three parts: the applied mathematics needed, modern deep networks, and research directions such as representation learning and generative models.",
            "Heavier on justification than on code, which is exactly what it is for.",
          ]),
          page("Takeaways", [
            "Regularisation is any modification intended to reduce generalisation error, not just a penalty term.",
            "Optimisation difficulty, not model capacity, is often the real bottleneck.",
          ]),
        ],
      },
      {
        id: "hands-on-ml",
        title: "Hands-On Machine Learning",
        author: "Aurélien Géron",
        year: 2022,
        spine: "#0f766e",
        pages: [
          page("Scikit-Learn, Keras and TensorFlow", [
            "Works through the full applied workflow: framing a problem, preparing data, selecting and tuning models, then deploying them.",
            "The second half moves into neural networks, CNNs, RNNs and transformers with runnable notebooks throughout.",
          ]),
          page("Takeaways", [
            "Data preparation decides more outcomes than model choice.",
            "A cross-validated baseline is worth more than an untested sophisticated model.",
          ]),
        ],
      },
      {
        id: "hundred-page-ml",
        title: "The Hundred-Page Machine Learning Book",
        author: "Andriy Burkov",
        year: 2019,
        spine: "#7c3aed",
        pages: [
          page("A compressed overview", [
            "Covers supervised and unsupervised learning, model evaluation and practical pitfalls in roughly a hundred pages.",
            "Best used as a refresher or a map, not a first introduction.",
          ]),
          page("Takeaways", [
            "Feature engineering and evaluation metrics carry most of the practical weight.",
            "Knowing what a method assumes matters more than knowing its update rule.",
          ]),
        ],
      },
    ],
    bundles: [
      {
        id: "foundations-of-modern-ai",
        title: "Foundations of Modern AI",
        subtitle: "The papers the current stack rests on",
        accent: "#6d28d9",
        papers: [
          {
            title: "Attention Is All You Need",
            authors: "Ashish Vaswani, Noam Shazeer, Niki Parmar, Jakob Uszkoreit, Llion Jones, Aidan N. Gomez, Łukasz Kaiser, Illia Polosukhin",
            venue: "NeurIPS",
            year: 2017,
            link: "https://arxiv.org/abs/1706.03762",
            abstract:
              "Proposes the Transformer, an architecture based entirely on attention mechanisms, dispensing with recurrence and convolution and allowing substantially more parallel training.",
            contributions: [
              "Scaled dot-product and multi-head self-attention.",
              "Positional encodings to inject order without recurrence.",
              "An encoder-decoder design that became the base of nearly every modern LLM.",
            ],
          },
          {
            title: "Deep Residual Learning for Image Recognition",
            authors: "Kaiming He, Xiangyu Zhang, Shaoqing Ren, Jian Sun",
            venue: "CVPR",
            year: 2016,
            link: "https://arxiv.org/abs/1512.03385",
            abstract:
              "Introduces residual connections that let a layer learn a residual function relative to its input, making networks of over a hundred layers trainable.",
            contributions: [
              "Identity shortcut connections that ease gradient flow.",
              "Evidence that depth helps once optimisation is made tractable.",
              "ResNet backbones still used across detection and segmentation.",
            ],
          },
          {
            title: "BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding",
            authors: "Jacob Devlin, Ming-Wei Chang, Kenton Lee, Kristina Toutanova",
            venue: "NAACL",
            year: 2019,
            link: "https://arxiv.org/abs/1810.04805",
            abstract:
              "Pre-trains deep bidirectional representations by jointly conditioning on both left and right context, then fine-tunes with one additional output layer for each task.",
            contributions: [
              "Masked language modelling as a pre-training objective.",
              "The pre-train then fine-tune pattern that dominated NLP.",
              "Strong transfer across many tasks from a single checkpoint.",
            ],
          },
          {
            title: "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks",
            authors: "Patrick Lewis et al.",
            venue: "NeurIPS",
            year: 2020,
            link: "https://arxiv.org/abs/2005.11401",
            abstract:
              "Combines a parametric generator with a non-parametric retriever over a dense vector index, letting a model ground its output in retrieved documents.",
            contributions: [
              "A general recipe for grounding generation in an external corpus.",
              "Reduced hallucination on knowledge-intensive tasks.",
              "The architecture behind most document-question-answering systems today.",
            ],
          },
          {
            title: "LoRA: Low-Rank Adaptation of Large Language Models",
            authors: "Edward J. Hu et al.",
            venue: "ICLR",
            year: 2022,
            link: "https://arxiv.org/abs/2106.09685",
            abstract:
              "Freezes the pre-trained weights and injects trainable low-rank decomposition matrices into each layer, cutting the number of trainable parameters by orders of magnitude.",
            contributions: [
              "Fine-tuning large models on modest hardware.",
              "No additional inference latency once merged.",
              "Swappable task-specific adapters over one base model.",
            ],
          },
          {
            title: "Adam: A Method for Stochastic Optimization",
            authors: "Diederik P. Kingma, Jimmy Ba",
            venue: "ICLR",
            year: 2015,
            link: "https://arxiv.org/abs/1412.6980",
            abstract:
              "An optimiser computing adaptive learning rates for each parameter from estimates of first and second moments of the gradients.",
            contributions: [
              "Per-parameter adaptive step sizes with bias correction.",
              "Robust default hyperparameters across many problems.",
              "Still the default optimiser for most deep learning work.",
            ],
          },
        ],
      },
    ],
  },
];

export function findShelf(slug) {
  return shelves.find((s) => s.slug === slug);
}

export const libraryStats = {
  books: shelves.reduce((n, s) => n + s.books.length, 0),
  bundles: shelves.reduce((n, s) => n + (s.bundles?.length ?? 0), 0),
  papers: shelves.reduce(
    (n, s) => n + (s.bundles ?? []).reduce((m, b) => m + b.papers.length, 0),
    0
  ),
  sections: shelves.length,
};
