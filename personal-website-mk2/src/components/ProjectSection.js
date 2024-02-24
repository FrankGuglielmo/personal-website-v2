import React from 'react';
import ProjectCard from './ProjectCard';
import { ProjectData } from '../data/projectsData';

export default function ProjectSection(projects) {
  return (
    <section className="bg-white py-8">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
          Featured Projects
        </h2>
        <div className="flex flex-wrap justify-center items-center">
            {ProjectData.map((project) => (
                <ProjectCard
                key={project.id}
                imageSrc={project.imageSrc}
                title={project.title}
                description={project.description}
                technologies={project.technologies}
                />
            ))}
        </div>
      </div>
    </section>
  );
};