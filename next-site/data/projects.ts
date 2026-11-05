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
    cardDescription: "Award-winning iOS app for finding nearby study spots.",
    technologies: ["Swift","SwiftUI","Python","gRPC"],
    link: "spot",
    projectDescription: "Finds study and remote work spaces near you. 1st place, USF Comp Sigh club hackathon 2023.",
    blurb: "Swift/SwiftUI client backed by a Python gRPC location server.",
    company: "/images/usflogo.png",
    awards: "/images/1stplacehackathon.png",
  },
  {
    id: 2,
    imageSrc: "/images/projects/Raum.png",
    title: "Raum",
    cardDescription: "macOS daemon for Roku IoT.",
    technologies: ["Swift","Go","Kafka"],
    link: "raum",
    projectDescription: "Built at Roku, Raum reports Mac state changes to Roku's IoT cloud. Open Netflix, and your lights switch to TV mode.",
    blurb: "Swift daemon and Go backend, with events delivered via Kafka.",
    company: "/images/rokulogo.png",
  },
  {
    id: 3,
    imageSrc: "/images/projects/librario.png",
    title: "Librario",
    cardDescription: "Grid-based word puzzle game for iOS.",
    technologies: ["Swift","SwiftUI","GameKit"],
    link: "librario",
    projectDescription: "Dynamic tile interactions, real-time leaderboards, and player stats. Published on the App Store.",
    blurb: "A custom letter generation algorithm adapts to the current board; GameKit powers the leaderboards.",
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
    projectDescription: "Explore trends in popular Spotify songs visually.",
    blurb: "Cleaned Kaggle data, D3.js, and Bootstrap 5; hosted on GitHub Pages.",
    company: "/images/usflogo.png",
  },
  {
    id: 5,
    imageSrc: "/images/projects/GoogsWebsite.png",
    title: "Search Engine: Googs",
    cardDescription: "Web crawler and keyword search engine in Java.",
    technologies: ["Java","Jetty Servlets","HTML","CSS"],
    link: "googs",
    projectDescription: "Crawls the web from a seed URL and builds an in-memory inverted index so users can search sites by keyword.",
    blurb: "Full-stack app built with Java and Jetty Servlets.",
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
    projectDescription: "Share and discover local event photos. 1st place, USF DonsHack 2024.",
    blurb: "React.js on Vercel, Dockerized Django with AWS S3 media, and Auth0 sign-in.",
    awards: "/images/1stplacehackathon.png",
  },
];


