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
          "Developed a modular \"Cluster Manager\" that orchestrates multi-modal app actions (audio playback, animations, camera moves) in parallel with complex start and end conditions.",
          "Emphasized thread safety and concurrency control to keep updates smooth under frequent user and server events.",
          "Implemented an admin-portal system for creating new users and conversations to support regression testing and feature development."
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
          "Architected and developed Raum, a macOS daemon in Swift that analyzes and reports Mac state changes.",
          "Implemented a REST API in Go that lets third-party devices send state events to Roku's IoT cloud infrastructure.",
          "Used Apache Kafka in the event-processing pipeline to guarantee at-least-once delivery of state change events."
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
          "Mentored students in applying data structures and algorithms to build a full-stack, web-based search engine in Java.",
          "Encouraged clean, production-level code by reviewing student work and asking guiding questions during office hours."
        ]
      },
      {
        title: "Computer Science Tutor",
        startDate: "Feb 2022",
        endDate: "May 2024",
        type: "Part-time",
        description: [
          "Tutored undergraduate and graduate computer science students across a wide range of coursework, assignments, and project questions."
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
        startDate: "Aug 2022",
        endDate: "Dec 2022",
        type: "Part-time",
        description: [
          "Taught after-school classes for young children, focused on hands-on learning by building and prototyping real-world projects.",
          "Fostered a positive, inclusive environment, guiding children as they conceptualized, designed, and built their own projects with an emphasis on teamwork and collaboration."
        ]
      }
    ]
  }
];

