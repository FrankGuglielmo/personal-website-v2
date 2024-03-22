import React from 'react';
import { useParams } from 'react-router-dom';
import { ProjectData } from '../data/projectsData.js';
import { Link } from 'react-router-dom';

const DetailedProject = () => {
    const { projectName } = useParams();
    console.log(projectName);
    const project = ProjectData.find((p) => p.link.toString() === projectName);
    console.log(projectName);
    //If project is not found, return to home page
    if (!project) {
        return <Link to="/" />;
    }
    // Render your detailed project using the found project ProjectData
    return (
        <div className="container mx-auto my-10 p-5">
            <div className="flex flex-wrap">
                <div className="w-full sm:w-1/3 p-2">
                <img src={project.imageSrc}  style= {{ width: '333px', height: '333px', objectFit: 'cover' }} alt={`${project.title} Thumbnail`} className="rounded-lg" />
                </div>
                <div className="w-full sm:w-2/3 p-2 flex flex-col justify-center">
                <h1 className="text-3xl font-bold">{project.title}</h1>
                <p className="text-gray-700 text-lg">{project.cardDescription}</p>
                </div>
            </div>
            <hr className="my-4" />
            <div className="text-gray-700 text-lg">
                <p>{project.blurb}</p>
            </div>
            <div className="mt-4">
                <h2 className="text-2xl font-bold py-3">Featured:</h2>
                <div className="flex flex-wrap">
                {project.technologies.map((tech, index) => (
                    <span key={index} className="m-1 px-3 py-1 border rounded text-sm font-semibold text-gray-700 bg-gray-100">{tech}</span>
                ))}
                </div>
            </div>
    </div>
    );
};

export default DetailedProject;