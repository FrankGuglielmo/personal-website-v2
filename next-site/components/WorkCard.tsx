import Image from "next/image";
import Card from "@/components/Card";
import type { WorkItem } from "@/data/work";

type Props = {
  item: WorkItem;
  className?: string;
};

export default function WorkCard({ item, className = "" }: Props) {
  const singleRole = item.roles.length === 1 ? item.roles[0] : null;
  return (
    <Card variant="glass" density="comfortable" className={`glass-flat ${className}`}>
      {singleRole ? (
        <div className="md:grid md:grid-cols-[64px_1fr_auto] md:items-start md:gap-6">
          {/* Logo */}
          <div className="hidden md:block relative h-16 w-16 rounded-xl overflow-hidden">
            <Image src={item.imageSrc} alt={`${item.company} logo`} fill sizes="4rem" className="object-contain" />
          </div>

          {/* Title + bullets */}
          <div>
            <div className="flex items-center gap-3 md:hidden mb-2">
              <div className="relative h-12 w-12 rounded-xl overflow-hidden flex-shrink-0">
                <Image src={item.imageSrc} alt={`${item.company} logo`} fill sizes="3rem" className="object-contain" />
              </div>
              <div>
                <h3 className="text-xl md:text-2xl font-semibold">{singleRole.title}</h3>
                <p className="text-muted text-sm">{item.company} · {singleRole.type}</p>
              </div>
            </div>
            <div className="hidden md:block mb-1">
              <h3 className="text-xl md:text-2xl font-semibold">{singleRole.title}</h3>
              <p className="text-muted text-sm">{item.company} · {singleRole.type}</p>
            </div>
            <ul className="list-disc list-inside space-y-2 text-foreground/80">
              {singleRole.description.map((line, idx) => (
                <li key={`${item.id}-${idx}`}>{line}</li>
              ))}
            </ul>
          </div>

          {/* Dates */}
          <div className="mt-4 md:mt-0 md:text-right">
            <p className="text-muted italic whitespace-nowrap">{singleRole.startDate} - {singleRole.endDate}</p>
          </div>
        </div>
      ) : (
        <div className="md:grid md:grid-cols-[64px_1fr_auto] md:items-start md:gap-6">
          {/* Logo */}
          <div className="hidden md:block relative h-16 w-16 rounded-xl overflow-hidden">
            <Image src={item.imageSrc} alt={`${item.company} logo`} fill sizes="4rem" className="object-contain" />
          </div>

          {/* Company + roles */}
          <div>
            <div className="flex items-center gap-3 md:hidden mb-2">
              <div className="relative h-12 w-12 rounded-xl overflow-hidden flex-shrink-0">
                <Image src={item.imageSrc} alt={`${item.company} logo`} fill sizes="3rem" className="object-contain" />
              </div>
              <div>
                <h3 className="text-xl md:text-2xl font-semibold">{item.company}</h3>
                <p className="text-muted text-sm">{item.roles[0]?.type}</p>
              </div>
            </div>
            <div className="hidden md:block mb-1">
              <h3 className="text-xl md:text-2xl font-semibold">{item.company}</h3>
              <p className="text-muted text-sm">{item.roles[0]?.type}</p>
            </div>
            <div className="space-y-4">
              {item.roles.map((role, idx) => (
                <div key={idx}>
                  <h4 className="text-lg font-semibold">{role.title}</h4>
                  <p className="md:hidden text-muted text-sm">{role.startDate} - {role.endDate}</p>
                  <ul className="list-disc list-inside space-y-2 text-foreground/80 mt-2">
                    {role.description.map((line, j) => (
                      <li key={`${idx}-${j}`}>{line}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Overall date on desktop */}
          <div className="hidden md:block text-right">
            {item.overallDuration ? (
              <p className="text-muted italic whitespace-nowrap">{item.overallDuration}</p>
            ) : null}
          </div>
        </div>
      )}
    </Card>
  );
}


