//Export ProjectData as an array of preoject objects
export const ProjectData = [
   {
      id: 1,
      imageSrc: require("../images/projects/spot.png"),
      title: "Spot",
      cardDescription: "An iOS app that helps you find the perfect study spot based on your location. It uses a gRPC server to communicate with a Python backend that sends location data to the user. \"Spot\" won 1st place at the USF Comp Sigh club hackathon in 2023.",
      projectDescription: "An iOS app to help connect users to nearby remote work spaces.",
      blurb: "The app's client-side operates with a backend built in Swift and a frontend designed with SwiftUI. It communicates with a Python-based gRPC server to gather location data, aligning this data with the user's specific location. ",
      technologies: ["Swift", "SwiftUI", "Python", "gRPC"],
      company: require("../images/usflogo.png"),
      awards: require("../images/1stplacehackathon.png"),
      link: "spot"
   },
   {
      id: 2,
      imageSrc: require("../images/projects/Raum.png"),
      title: "MacOS Daemon: \"Raum\"",
      cardDescription: "A MacOS Daemon that polls for state changes within your Mac device and reports specific state changes to Roku's IoT cloud infrastructure. It enables users to control their other Roku smart devices within their home using their Mac.",
      projectDescription: "A MacOS Daemon that allows you to initiate IoT commands for your Roku devices from your Mac. For Example: When you open Netflix, change your lights to TV mode.",
      blurb: "The daemon is built in Swift and utilizes SwiftUI for the user interface. It communicates with a Go-based backend that sends messages to a Kafka cluster, which then sends the messages to Roku's IoT cloud infrastructure.",
      technologies: ["Swift", "SwiftUI", "Go", "Kafka"],
      company: require("../images/rokulogo.png"),
      awards: "",
      link: "raum"
   },
   // {
   //    id: 3,
   //    imageSrc: require("../images/Duets_ai_logo.png"),
   //    title: "Duets.ai Transcription Service",
   //    cardDescription: "A service that modifies OpenAi's Whisper, a speech-to-text AI model, to transcribe bilingual audio and generate customized feedback for language learners during their tutoring sessions.",
   //    projectDescription: "A Zoom plugin tool that generates bilingual transciptions for one-on-one language tutoring sessions.",
   //    blurb: "After a Duets.ai user finishes a session with a Duets.ai instructor, Zoom processes and creates the audio files, which are then transmitted to the transcription service through a webhook. Subsequently, a Django server situated on Azure handles these audio files, utilizing utilities like FFmpeg and an adapted version of the OpenAI Whisper Model. The resulting transcriptions are stored in a Supabase database. An Analysis Service then evaluates these transcriptions, generating customized feedback that is delivered to the user via email.",
   //    technologies: ["Python", "Django", "Azure", "OpenAI Whisper", "Docker", "Supabase", "Zoom Webhooks", "SMTP", "FFmpeg"],
   //    company: require("../images/duetslogo.png"),
   //    awards: "",
   //    link: "duets"
   // },
   {
      id: 3,
      imageSrc: require("../images/projects/librario.png"),
      title: "Librario",
      cardDescription: "A grid-based word puzzle game for iOS featuring dynamic tile interactions, real-time leaderboards, and custom letter generation algorithms.",
      projectDescription: "An iOS word puzzle game leveraging Swift & SwiftUI for an engaging, responsive user experience and integrating GameKit for real-time leaderboards.",
      blurb: "Programmed a grid-based word puzzle with a custom letter generation algorithm that adapts to the current game board. Designed and implemented stat-tracking features for player metrics, integrating GameKit to foster competition through real-time leaderboards. Successfully launched on the Apple App Store, demonstrating proficiency in the app publishing process.",
      technologies: ["Swift", "SwiftUI", "GameKit"],
      company: "",
      awards: require("../images/download_app_store.png"),
      link: "librario"
   },
   {
      id: 4,
      imageSrc: require("../images/projects/SpotifyWebsite.png"),
      title: "Spotify Song Analysis",
      cardDescription: "A website that utilizes the D3 javascript library to visualize Spotify song data, allowing users to explore trends in popular songs. It is currently hosted on Github Pages and is styled using Bootstrap5.",
      projectDescription: "A D3.js website that visualizes popular Spotify song data.",
      blurb: "This project was created to help visualize song data using D3.js. The website is hosted on Github Pages and is styled using Bootstrap5. The data was acquired from a Kaggle dataset and cleaned to accurately represent the data. The website allows users to explore trends in popular songs and analyze the data in a visual format.",
      technologies: ["HTML", "CSS", "D3.js", "Github Pages", "Bootstrap"],
      company: require("../images/usflogo.png"),
      awards: "",
      link: "spotify",
      url: "https://frankieg14.github.io/"
   },
   {
      id: 5,
      imageSrc: require("../images/projects/GoogsWebsite.png"),
      title: "Search Engine: \"Googs\"",
      cardDescription: "A full-stack web-application that takes in a seed URL and crawls the web, building a custom in-memory inverted index containing the infromation from each site. Users can search for websites based on a set of keywords.",
      projectDescription: "A custom search engine with a web interface for finding information.",
      blurb: "The website is built using Java and Jetty Servlets. It allows users to input a seed URL and crawl the web, building a custom in-memory inverted index containing the information from each site. Users can then search for websites based on a set of keywords.",
      technologies: ["Java", "Jetty Servlets", "HTML", "CSS"],
      company: require("../images/usflogo.png"),
      awards: "",
      link: "googs"
   }, 
   {
      id: 6,
      imageSrc: require("../images/projects/clixz_logo_white.png"),
      title: "Clixz",
      cardDescription: "A website where users can post photos from recent events they went to and discover new activities in their area. \"Clixz\" won 1st place at the USF DonsHack hackathon in 2024.",
      projectDescription: "A full-stack web application that allows user to discover and share photos from public events in their area.",
      blurb: "Hosted using Vercel at Clixz.org, the frontend of this application was built using React.js. It communicates with a dockerized Django server that leverages an AWS S3 bucket for media storage. Users can make requests to the server by uploading photos or creating events via the various pages on the site. One interesting feature is that Clixz leverages Auth0 for LogIn and SignUp, ensuring user data is secure.",
      technologies: ["React.js", "Django", "AWS S3", "Clouflare", "Docker", "HTML", "CSS", "Vercel", "Auth0"],
      company: require("../images/usflogo.png"),
      awards: require("../images/1stplacehackathon.png"),
      link : "clixz",
      url: "https://clixz.org"
   }
];
