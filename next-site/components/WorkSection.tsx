import Heading from "@/components/Heading";
import WorkCard from "@/components/WorkCard";
import { workItems } from "@/data/work";
import Reveal from "@/components/Reveal";

export default function WorkSection() {
  return (
    <>
      <Heading level={2} className="text-2xl md:text-3xl mb-4 font-semibold">Work Experience</Heading>
      <div className="flex flex-col gap-6 md:gap-8">
        {workItems.map((item, idx) => (
          <Reveal key={item.id} delayMs={idx * 60}>
            <WorkCard item={item} />
          </Reveal>
        ))}
      </div>
    </>
  );
}


