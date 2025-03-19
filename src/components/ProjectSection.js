import React from 'react';
import ProjectCard from './ProjectCard';
import { ProjectData } from '../data/projectsData';

export default function ProjectSection() {
  return (
    <section id="projects" className="bg-white py-8">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
          Featured Projects
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {ProjectData.map((project) => (
            <div className="flex justify-center" key={project.id}>
              <ProjectCard 
                id={project.id}
                key={project.id}
                imageSrc={project.imageSrc}
                title={project.title}
                description={project.cardDescription}
                technologies={project.technologies}
                company={project.company}
                awards={project.awards}
                link={project.link}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
