import Image from "next/image";
import headshot from "@/app/images/headshot-no-bg.png";
import Card from "@/components/Card";
import ResumeWidget from "@/components/ResumeWidget";
import { IoLogoGithub } from "react-icons/io";
import { FaLinkedin } from "react-icons/fa";
import { SiHandshake } from "react-icons/si";
import { projects } from "@/data/projects";
import ProjectCarousel from "@/components/ProjectCarousel";
import WorkSection from "@/components/WorkSection";

export default function Home() {
  return (
    <main className="min-h-dvh py-10 site-content">
      <section className="container mx-auto px-4 md:px-8 lg:px-12 xl:px-20">
        {/* Hero */}
        <section id="home" className="mb-12">
          <Card variant="glass" density="comfortable" className="mb-10">
            <div className="grid grid-cols-1 md:grid-cols-[1.15fr_0.85fr] gap-6 items-center">
              <div>
                <h1 className="text-4xl md:text-6xl font-semibold mb-4">Hi, I&apos;m Frank.</h1>
                <p className="text-muted">I&apos;m a Software Engineer and App Developer. Here you can find projects I&apos;ve worked on, my work experience, and the technologies I&apos;m most familiar with.</p>

                <div className="mt-6 flex items-center gap-3">
                  <a href="https://github.com/FrankGuglielmo" target="_blank" rel="noreferrer" className="liquid-icon" aria-label="GitHub">
                    <IoLogoGithub />
                  </a>
                  <a href="https://www.linkedin.com/in/fdguglielmo/" target="_blank" rel="noreferrer" className="liquid-icon" aria-label="LinkedIn">
                    <FaLinkedin />
                  </a>
                  <a href="https://app.joinhandshake.com/profiles/frank" target="_blank" rel="noreferrer" className="liquid-icon" aria-label="Handshake">
                    <SiHandshake />
                  </a>
                </div>

                <div className="mt-6 max-w-sm">
                  <ResumeWidget />
                </div>
              </div>

              <div className="mx-auto portrait-halo rounded-[28px] overflow-hidden max-w-xs md:max-w-sm lg:max-w-md">
                <Image
                  src={headshot}
                  alt="Frank Guglielmo"
                  width={640}
                  height={800}
                  className="relative z-[1] w-full h-auto object-contain"
                  sizes="(min-width: 768px) 28rem, 16rem"
                  priority
                />
              </div>
            </div>
          </Card>
        </section>

        <section id="projects" className="mb-12">
          <h2 className="text-2xl md:text-3xl font-semibold mb-4">Projects</h2>
          <ProjectCarousel projects={projects} />
        </section>

        <section id="experience" className="mb-12">
          <WorkSection />
        </section>
      </section>
    </main>
  );
}
