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

                <div className="mt-6 hidden md:flex items-center gap-3">
                  <a href="https://github.com/FrankGuglielmo" target="_blank" rel="noreferrer" className="liquid-icon icon-github" aria-label="GitHub">
                    <IoLogoGithub />
                  </a>
                  <a href="https://app.joinhandshake.com/profiles/frank" target="_blank" rel="noreferrer" className="liquid-icon icon-handshake" aria-label="Handshake">
                    <SiHandshake />
                  </a>
                  <a href="https://www.linkedin.com/in/fdguglielmo/" target="_blank" rel="noreferrer" className="liquid-icon icon-linkedin" aria-label="LinkedIn">
                    <FaLinkedin />
                  </a>
                </div>

                <div className="mt-6 max-w-sm hidden md:block">
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
              {/* Mobile-only icon row + Resume button below the photo */}
              <div className="md:hidden mt-4 flex items-center justify-center gap-3">
                <a href="https://github.com/FrankGuglielmo" target="_blank" rel="noreferrer" className="liquid-icon icon-github" aria-label="GitHub">
                  <IoLogoGithub />
                </a>
                <a href="https://app.joinhandshake.com/profiles/frank" target="_blank" rel="noreferrer" className="liquid-icon icon-handshake" aria-label="Handshake">
                  <SiHandshake />
                </a>
                <a href="https://www.linkedin.com/in/fdguglielmo/" target="_blank" rel="noreferrer" className="liquid-icon icon-linkedin" aria-label="LinkedIn">
                  <FaLinkedin />
                </a>
                <a
                  href="/FrankGuglielmoResume-15.pdf"
                  target="_blank"
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-black/80 text-white border border-white/15 shadow-md shadow-black/30 backdrop-blur-sm hover:bg-black/70 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 transition-colors"
                  aria-label="Resume"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6zm1 7V4.5L19.5 10H15zM8 13h8v2H8v-2zm0 4h8v2H8v-2z"/>
                  </svg>
                  <span className="text-sm font-medium">Resume</span>
                </a>
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
