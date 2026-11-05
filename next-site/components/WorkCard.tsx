import Image from "next/image";
import Card from "@/components/Card";
import type { WorkItem, WorkRole } from "@/data/work";

type Props = {
  item: WorkItem;
  className?: string;
};

const logoSizes = "(min-width: 768px) 4rem, 3rem";

function Logo({ item, className }: { item: WorkItem; className: string }) {
  return (
    <div className={`relative rounded-xl overflow-hidden ${className}`}>
      <Image src={item.imageSrc} alt={`${item.company} logo`} fill sizes={logoSizes} className="object-contain" />
    </div>
  );
}

function SingleRole({ item, role }: { item: WorkItem; role: WorkRole }) {
  return (
    <div className="grid grid-cols-[auto_1fr] md:grid-cols-[64px_minmax(0,1fr)_auto] gap-x-3 md:gap-x-6">
      <Logo
        item={item}
        className="row-start-1 col-start-1 h-12 w-12 md:h-16 md:w-16 self-center md:self-start"
      />

      <div className="row-start-1 col-start-2 self-center md:self-start mb-2 md:mb-1">
        <h3 className="text-xl md:text-2xl font-semibold">{role.title}</h3>
        <p className="text-muted text-sm">{item.company} · {role.type}</p>
      </div>

      <ul className="col-start-1 col-span-2 row-start-2 list-disc list-inside space-y-2 text-foreground/80 md:col-start-2 md:col-span-1">
        {role.description.map((line, idx) => (
          <li key={`${item.id}-${idx}`}>{line}</li>
        ))}
      </ul>

      <p className="col-start-1 col-span-2 row-start-3 mt-4 text-muted italic whitespace-nowrap md:col-start-3 md:col-span-1 md:row-start-1 md:mt-0 md:self-start md:text-right">
        {role.startDate} - {role.endDate}
      </p>
    </div>
  );
}

function MultiRole({ item }: { item: WorkItem }) {
  return (
    <div className="grid grid-cols-[auto_1fr] md:grid-cols-[64px_minmax(0,1fr)_auto] gap-x-3 md:gap-x-6">
      <Logo
        item={item}
        className={`row-start-1 col-start-1 h-12 w-12 md:h-16 md:w-16 self-center md:self-start ${item.overallDuration ? "row-span-2 md:row-span-1" : ""}`}
      />

      <div className="row-start-1 col-start-2 self-start md:self-baseline">
        <h3 className="text-xl md:text-2xl font-semibold">{item.company}</h3>
      </div>

      {item.overallDuration ? (
        <p className="row-start-2 col-start-2 self-start text-muted text-sm md:row-start-1 md:col-start-3 md:self-baseline md:text-right md:text-base md:italic md:whitespace-nowrap">
          {item.overallDuration}
        </p>
      ) : null}

      <div
        className={`col-start-1 col-span-2 space-y-6 mt-2 md:col-start-2 md:col-span-2 md:mt-1 ${
          item.overallDuration ? "row-start-3 md:row-start-2" : "row-start-2"
        }`}
      >
        {item.roles.map((role, idx) => (
          <div key={idx}>
            <div className="md:flex md:items-baseline md:justify-between md:gap-4">
              <div>
                <h4 className="text-lg font-semibold">{role.title}</h4>
                <p className="text-muted text-sm">{role.type}</p>
              </div>
              <p className="text-muted text-sm md:italic md:whitespace-nowrap">{role.startDate} - {role.endDate}</p>
            </div>
            <ul className="list-disc list-inside space-y-2 text-foreground/80 mt-2">
              {role.description.map((line, j) => (
                <li key={`${idx}-${j}`}>{line}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function WorkCard({ item, className = "" }: Props) {
  const singleRole = item.roles.length === 1 ? item.roles[0] : null;
  return (
    <Card variant="glass" density="comfortable" className={`glass-flat ${className}`}>
      {singleRole ? <SingleRole item={item} role={singleRole} /> : <MultiRole item={item} />}
    </Card>
  );
}
