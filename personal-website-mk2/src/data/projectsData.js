//Export ProjectData as an array of preoject objects
export const ProjectData = [
   {
      id: 1,
      imageSrc: require("../images/spot.png"),
      title: "Spot",
      description: "Description 1",
      technologies: ["Swift", "SwiftUI", "Python", "gRPC"],
      link: "/spot"
   },
   {
      id: 2,
      imageSrc: require("../images/Raum.png"),
      title: "MacOS Daemon: \"Raum\"",
      description: "Description 5",
      technologies: ["Swift", "SwiftUI", "Go", "Kafka"],
      link: ""
   },
   {
      id: 3,
      imageSrc: require("../images/Duets_ai_logo.png"),
      title: "Duets.ai Transcription Service",
      description: "Description 4",
      technologies: ["Python", "Django", "Azure", "OpenAI Whisper", "Docker", "Supabase"],
      link: "/duets"
   },
   {
      id: 4,
      imageSrc: require("../images/SpotifyWebsite.png"),
      title: "Spotify Song Analysis",
      description: "Description 3",
      technologies: ["HTML", "CSS", "D3.js", "Github Pages"],
      link: "/spotify"
   },
   {
      id: 5,
      imageSrc: require("../images/GoogsWebsite.png"),
      title: "Search Engine: \"Googs\"",
      description: "Description 2",
      technologies: ["Java", "Jetty Servlets", "HTML", "CSS"],
      link: "/googs"
   } 
];
