export type Project = {
  id: number;
  imageSrc: string;
  title: string;
  cardDescription: string;
  technologies: string[];
  link?: string;
  url?: string;
  projectDescription?: string;
  blurb?: string;
  company?: string; // image src
  awards?: string;  // image src
};

export const projects: Project[] = [
  {
    id: 1,
    imageSrc: "/images/projects/spot.png",
    title: "Spot",
    cardDescription: "An iOS app to find study spots.",
    technologies: ["Swift","SwiftUI","Python","gRPC"],
    link: "spot",
    projectDescription: "An iOS app to help connect users to nearby remote work spaces.",
    blurb: "Client built with Swift/SwiftUI, communicating with a Python gRPC backend to match users with nearby study/work spots.",
    company: "/images/usflogo.png",
    awards: "/images/1stplacehackathon.png",
  },
  {
    id: 2,
    imageSrc: "/images/projects/Raum.png",
    title: "Raum",
    cardDescription: "macOS Daemon for Roku IoT.",
    technologies: ["Swift","Go","Kafka"],
    link: "raum",
    projectDescription: "A macOS daemon that relays Mac state changes to Roku's IoT cloud so users can control devices via their Mac.",
    blurb: "Swift daemon with a Go backend sending events via Kafka to Roku's IoT infrastructure.",
    company: "/images/rokulogo.png",
  },
  {
    id: 3,
    imageSrc: "/images/projects/librario.png",
    title: "Librario",
    cardDescription: "iOS word puzzle game.",
    technologies: ["Swift","SwiftUI","GameKit"],
    link: "librario",
    projectDescription: "A grid-based word puzzle with leaderboards and custom letter generation.",
    blurb: "Real-time leaderboards via GameKit and dynamic letter generation for engaging gameplay.",
    awards: "/images/download_app_store.png",
  },
  {
    id: 4,
    imageSrc: "/images/projects/SpotifyWebsite.png",
    title: "Spotify Song Analysis",
    cardDescription: "D3.js site visualizing Spotify data.",
    technologies: ["HTML","CSS","D3.js","Bootstrap"],
    link: "spotify",
    url: "https://frankieg14.github.io/",
    projectDescription: "A D3.js website that visualizes popular Spotify song data.",
    blurb: "Hosted on GitHub Pages; built with D3.js and Bootstrap to explore trends in popular songs.",
    company: "/images/usflogo.png",
  },
  {
    id: 5,
    imageSrc: "/images/projects/GoogsWebsite.png",
    title: "Search Engine: Googs",
    cardDescription: "Custom search engine with inverted index.",
    technologies: ["Java","Jetty Servlets","HTML","CSS"],
    link: "googs",
    projectDescription: "A full-stack app that crawls the web and builds an in-memory inverted index.",
    blurb: "Users can search for websites by keywords; backend powered by Java and Jetty Servlets.",
    company: "/images/usflogo.png",
  },
  {
    id: 6,
    imageSrc: "/images/projects/clixz_logo_white.png",
    title: "Clixz",
    cardDescription: "Photo sharing for local events.",
    technologies: ["React.js","Django","AWS S3","Docker"],
    link: "clixz",
    url: "https://clixz.org",
    projectDescription: "A full-stack app for discovering and sharing event photos.",
    blurb: "Frontend on Vercel, Django backend, media on AWS S3; Auth0 for authentication.",
    awards: "/images/1stplacehackathon.png",
  },
];


