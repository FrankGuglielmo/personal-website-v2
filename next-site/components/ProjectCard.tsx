import Image from "next/image";
import Link from "next/link";
import Card from "@/components/Card";
import type { Project } from "@/data/projects";

type Props = {
  project: Project;
  className?: string;
  onSelect?: (project: Project) => void;
};

export default function ProjectCard({ project, className = "", onSelect }: Props) {
  const href = project.url ?? (project.link ? `#${project.link}` : "#");
  return (
    <Card variant="glass" density="compact" className={`glass-flat min-w-[300px] sm:min-w-[420px] ${className}`}>
      <Link
        href={href}
        onClick={(e)=>{
          // Clicks originate on the inner content which has pointer-events:none.
          // We rely on bubbling to this link; if carousel marked the gesture as a drag,
          // it will have already suppressed the click at the container level.
          if (onSelect) { e.preventDefault(); onSelect(project); }
        }}
        className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--color-accent))] rounded-2xl select-none"
      >
        <div className="flex items-center gap-3 pointer-events-none">
          <div className="relative h-24 w-32 sm:h-28 sm:w-40 rounded-xl overflow-hidden flex-shrink-0">
            <Image
              src={project.imageSrc}
              alt={project.title}
              fill
              sizes="(min-width: 1024px) 10rem, (min-width: 640px) 8rem, 8rem"
              className="object-cover"
            />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-base sm:text-lg line-clamp-1">{project.title}</h3>
            <p className="text-muted text-sm line-clamp-2">{project.cardDescription}</p>
          </div>
        </div>
      </Link>
    </Card>
  );
}


