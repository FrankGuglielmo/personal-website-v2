//Export ProjectData as an array of preoject objects
export const ProjectData = [
   {
      id: 1,
      imageSrc: require("../images/spot.png"),
      title: "Spot",
      description: "An iOS app that helps you find the perfect study spot based on your location. It uses a gRPC server to communicate with a Python backend that sends location data to the user. \"Spot\" won 1st place at the USF Comp Sigh club hackathon in 2023.",
      technologies: ["Swift", "SwiftUI", "Python", "gRPC"],
      company: require("../images/usflogo.png"),
      awards: require("../images/1stplacehackathon.png"),
      link: "/spot"
   },
   {
      id: 2,
      imageSrc: require("../images/Raum.png"),
      title: "MacOS Daemon: \"Raum\"",
      description: "A MacOS Daemon that polls for state changes within your Mac device and reports specific state changes to Roku's IoT cloud infrastructure. It enables users to control their other Roku smart devices within their home using their Mac.",
      technologies: ["Swift", "SwiftUI", "Go", "Kafka"],
      company: require("../images/rokulogo.png"),
      awards: "",
      link: "/raum"
   },
   {
      id: 3,
      imageSrc: require("../images/Duets_ai_logo.png"),
      title: "Duets.ai Transcription Service",
      description: "A service that modifies OpenAi's Whisper, a speech-to-text AI model, to transcribe bilingual audio and generate customized feedback for language learners during their tutoring sessions.",
      technologies: ["Python", "Django", "Azure", "OpenAI Whisper", "Docker", "Supabase"],
      company: require("../images/duetslogo.png"),
      awards: "",
      link: "/duets"
   },
   {
      id: 4,
      imageSrc: require("../images/SpotifyWebsite.png"),
      title: "Spotify Song Analysis",
      description: "A website that utilizes the D3 javascript library to visualize Spotify song data, allowing users to explore trends in popular songs. It is currently hosted on Github Pages and is styled using Bootstrap5.",
      technologies: ["HTML", "CSS", "D3.js", "Github Pages", "Bootstrap"],
      company: require("../images/usflogo.png"),
      awards: "",
      link: "/spotify"
   },
   {
      id: 5,
      imageSrc: require("../images/GoogsWebsite.png"),
      title: "Search Engine: \"Googs\"",
      description: "A full-stack web-application that takes in a seed URL and crawls the web, building a custom in-memory inverted index containing the infromation from each site. Users can search for websites based on a set of keywords.",
      technologies: ["Java", "Jetty Servlets", "HTML", "CSS"],
      company: require("../images/usflogo.png"),
      awards: "",
      link: "/googs"
   } 
];
