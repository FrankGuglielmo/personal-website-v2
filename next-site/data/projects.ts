export type Project = {
  id: number;
  imageSrc: string;
  title: string;
  cardDescription: string;
  technologies: string[];
  link?: string;
  url?: string;
};

export const projects: Project[] = [
  { id: 1, imageSrc: "/images/projects/spot.png", title: "Spot", cardDescription: "An iOS app to find study spots.", technologies: ["Swift","SwiftUI","Python"], link: "spot" },
  { id: 2, imageSrc: "/images/projects/Raum.png", title: "Raum", cardDescription: "macOS Daemon for Roku IoT.", technologies: ["Swift","Go","Kafka"], link: "raum" },
  { id: 3, imageSrc: "/images/projects/librario.png", title: "Librario", cardDescription: "iOS word puzzle game.", technologies: ["Swift","SwiftUI","GameKit"], link: "librario" },
];


