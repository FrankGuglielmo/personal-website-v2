export type WorkRole = {
  title: string;
  startDate: string;
  endDate: string;
  type: string;
  description: string[];
};

export type WorkItem = {
  id: number;
  company: string;
  imageSrc: string;
  roles: WorkRole[];
  overallDuration?: string;
};

export const workItems: WorkItem[] = [
  {
    id: 1,
    company: "Handshake",
    imageSrc: "/images/handshake-logo.jpg",
    overallDuration: "May 2025 - Present",
    roles: [
      {
        title: "Forward Deployed Engineer",
        startDate: "Aug 2025",
        endDate: "Present",
        type: "Full-time",
        description: [
          "Owned a scaling lane across task architecture, environment QA, work decomposition, and team allocation for a 3,000+ task program tied to approximately $9M in revenue.",
          "Led an end-to-end, multi-domain delivery from asset conversion and validation through API upload, directly enabling at least $1.38M in billable scope and generalizing the tooling for reuse.",
          "Created reusable packaging, QA, registry, and delivery workflows for reinforcement-learning environments, reducing a recurring customer-documentation task from about a day to roughly an hour.",
          "Designed a shared AI gateway that migrated all production LLM traffic off a legacy path in under two weeks, added team-level cost attribution, and turned field insight into product improvements and durable operating playbooks."
        ]
      },
      {
        title: "Software Engineer Intern, iOS",
        startDate: "May 2025",
        endDate: "Aug 2025",
        type: "Internship",
        description: [
          "Built product experiences with Handshake's iOS engineering team in support of connecting students with early-career opportunities."
        ]
      }
    ]
  },
  {
    id: 2,
    company: "Stealth Startup",
    imageSrc: "/images/jobs/stealth_startup.png",
    roles: [
      {
        title: "Software Engineer Intern",
        startDate: "October 2024",
        endDate: "Present",
        type: "Internship",
        description: [
          "Developed a modular \"Cluster Manager\" to orchestrate multi-modal app actions (audio playback, animations, camera moves) in parallel with complex start/end conditions",
          "Emphasized thread-safety & concurrency control to ensure smooth updates under frequent user/server events",
          "Implemented a system for creating new users & conversations via an admin portal for regression testing & feature development"
        ]
      }
    ]
  },
  {
    id: 3,
    company: "Roku Inc.",
    imageSrc: "/images/jobs/RokuLogo.png",
    roles: [
      {
        title: "Software Engineer Intern, Cloud",
        startDate: "May 2023",
        endDate: "Aug 2023",
        type: "Internship",
        description: [
          "Architected & developed a MacOS Daemon in Swift to analyze & report Mac state changes",
          "Implemented a REST API in Go to allow third party devices to transmit state events to Roku's IoT cloud infrastructure",
          "Utilized Apache Kafka in the event processing pipeline to guarantee at-least-once delivery of state change events"
        ]
      }
    ]
  },
  {
    id: 4,
    company: "University of San Francisco",
    imageSrc: "/images/jobs/USFLogoJob.png",
    overallDuration: "Jan 2022 - May 2024",
    roles: [
      {
        title: "CS 272 Teaching Assistant",
        startDate: "Aug 2023",
        endDate: "May 2024",
        type: "Part-time",
        description: [
          "Mentored students in using data structures & algorithms to build a full stack, web-based search engine in Java.",
          "Advised the development of clean, production level code by reviewing & asking students questions during office hours."
        ]
      },
      {
        title: "Computer Science Tutor",
        startDate: "Feb 2022",
        endDate: "May 2024",
        type: "Part-time",
        description: [
          "Offered specialized tutoring for both undergraduate & graduate computer science students, covering diverse coursework, assignments, & project inquiries."
        ]
      },
      {
        title: "ENGR 102 Teaching Assistant",
        startDate: "Jan 2022",
        endDate: "May 2023",
        type: "Part-time",
        description: [
          "Guided first-time programming students through debugging & coding Python programs."
        ]
      }
    ]
  },
  {
    id: 5,
    company: "Kodely",
    imageSrc: "/images/jobs/KodelyLogo.png",
    roles: [
      {
        title: "Kodely Leader",
        startDate: "Aug 2022 ",
        endDate: "Dec 2022",
        type: "Part-time",
        description: [
          "Taught after-school classes to young children, focusing on hands-on learning & practical application of building & prototyping real-world projects.",
          "Fostered a positive & inclusive learning environment, guiding children through the process of conceptualizing, designing, & constructing their own projects, while emphasizing teamwork & collaboration."
        ]
      }
    ]
  }
];

