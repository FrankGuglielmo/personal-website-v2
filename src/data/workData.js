export const workData = [
    {
      id: 1,
      company: "Stealth Startup",
      image: require("../images/jobs/stealth_startup.png"),
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
      id: 2,
      company: "Roku Inc.",
      image: require("../images/jobs/RokuLogo.png"), // Image is now at the top level
      roles: [
        {
          title: "Software Engineer Intern, Cloud",
          startDate: "May 2023",
          endDate: "Aug 2023",
          type: "Internship",
          description: ["Architected & developed a MacOS Daemon in Swift to analyze & report Mac state changes", "Implemented a REST API in Go to allow third party devices to transmit state events to Roku's IoT cloud infrastructure", "Utilized Apache Kafka in the event processing pipeline to guarantee at-least-once delivery of state change events"]
        }
      ],
    },
    {
        id: 3,
        company: "University of San Francisco",
        image: require("../images/jobs/USFLogoJob.png"),
        overallDuration: "Jan 2022 - May 2024",
        roles: [
            {
            title: "CS 272 Teaching Assistant",
            startDate: "Aug 2023",
            endDate: "May 2024",
            type: "Part-time",
            description: ["Mentored students in using data structures & algorithms to build a full stack, web-based search engine in Java.", "Advised the development of clean, production level code by reviewing & asking students questions during office hours."]
            },
            {
            title: "Computer Science Tutor",
            startDate: "Feb 2022",
            endDate: "May 2024",
            type: "Part-time",
            description: ["Offered specialized tutoring for both undergraduate & graduate computer science students, covering diverse coursework, assignments, & project inquiries."]
            },
            {
            title: "ENGR 102 Teaching Assistant",
            startDate: "Jan 2022",
            endDate: "May 2023",
            type: "Part-time",
            description: ["Guided first-time programming students through debugging & coding Python programs."]
            }
        ]
        },
    {
      id: 4,
      company: "Kodely",
      image: require("../images/jobs/KodelyLogo.png"), // Image is now at the top level
      roles: [
        {
          title: "Kodely Leader",
          startDate: "Aug 2022 ",
          endDate: "Dec 2022",
          type: "Part-time",
          description: ["Taught after-school classes to young children, focusing on hands-on learning & practical application of building & prototyping real-world projects.", "Fostered a positive & inclusive learning environment, guiding children through the process of conceptualizing, designing, & constructing their own projects, while emphasizing teamwork & collaboration."]
        },
      ],
    }
  ];