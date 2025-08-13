import Image from "next/image";
import Card from "@/components/Card";
// import IconButton from "@/components/IconButton";
import Link from "next/link";
import { projects } from "@/data/projects";

export default function Home() {
  return (
    <main className="min-h-dvh py-10">
      <section className="container mx-auto px-4 md:px-8 lg:px-12 xl:px-20">
        {/* Hero */}
        <Card variant="glass" density="comfortable" className="mb-10">
          <div className="grid md:grid-cols-2 gap-6 items-center">
            <div>
              <h1 className="text-4xl md:text-6xl font-semibold mb-4">Hi, I&apos;m Frank.</h1>
              <p className="text-muted">I&apos;m a Software Engineer and App Developer. Here you can find projects I&apos;ve worked on, my work experience, and the technologies I&apos;m most familiar with.</p>
            </div>
            <div className="mx-auto rounded-[32px] overflow-hidden">
              <Image
                src="/images/hero/profilePicture.webp"
                alt="Frank Guglielmo"
                width={640}
                height={800}
                className="w-full h-auto object-contain"
                sizes="(min-width: 768px) 28rem, 16rem"
                priority
              />
            </div>
          </div>
        </Card>

        <section id="projects" className="mb-12">
          <h2 className="text-2xl md:text-3xl font-semibold mb-4">Featured Projects</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((p)=> (
              <Card key={p.id} variant="glass" density="compact" className="">
                <div className="rounded-2xl overflow-hidden mb-3">
                  <Image src={p.imageSrc} alt={p.title} width={800} height={500} className="w-full h-auto object-cover" />
                </div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-lg line-clamp-1">{p.title}</h3>
                  <div className="hidden sm:flex gap-2">
                    {p.technologies.slice(0,2).map((t)=> (
                      <span key={t} className="inline-flex items-center px-3 py-1 glass liquid-pill border border-border text-xs">{t}</span>
                    ))}
                  </div>
                </div>
                <p className="text-muted line-clamp-2 mb-2">{p.cardDescription}</p>
                <div className="mt-3 flex justify-end">
                  <Link href={p.url ?? `#${p.link ?? ''}`} className="inline-block px-3 py-1 rounded-xl border border-border">View</Link>
                </div>
              </Card>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
