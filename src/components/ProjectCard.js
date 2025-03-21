import React from 'react';
import "../styles/projectCard.css";
import { Link } from 'react-router-dom';

export default function ProjectCard({id, imageSrc, title, description, technologies, company, awards, link }) {
  return (
    //If there is a link that is not "null" then wrap the card in an anchor tag
    <Link to={`/projects/${link}`} className="no-underline text-black w-full sm:w-auto">
      <div className="w-full rounded overflow-hidden shadow-lg my-2 hover-effect optimized-mobile-2" id='project-card'>
        {/* Use a placeholder image if imageSrc is not provided or not found */}
        <img 
          className="w-full h-auto object-cover"
          style={{ maxHeight: '339px' }} 
          src={imageSrc} 
          alt={`Thumbnail of ${title}`} 
          onError={(e) => { e.target.onerror = null; e.target.src = "https://i.natgeofe.com/n/4f5aaece-3300-41a4-b2a8-ed2708a0a27c/domestic-dog_thumb_3x2.jpg"; }} 
        />
        <div className="px-6 py-4">
          <div className="font-bold text-xl mb-2">{title}</div>
          <p className="text-gray-700 text-base">
            {description}
          </p>
        </div>
        <div className="px-6 pt-4 pb-2 flex flex-wrap">
          {/* Check if technologies is an array before mapping */}
          {Array.isArray(technologies) && technologies.map((tech) => (
            <span key={tech} className="tech-item inline-block rounded px-3 py-1 text-sm font-semibold mr-2 mb-2">
              {tech}
            </span>
          ))}
        </div>  
        <div className="px-6 pt-2 pb-2 relative flex flex-row justify-between">
          {/* Render the company image only if `company` is truthy (not empty). */}
          {company && company !== "" && (
            awards === "" ? (
              <img
                src={company}
                alt="Company Logo"
                className="w-1/2 pb-2 pt-2"
              />
            ) : (
              <img
                src={company}
                alt="Company Logo"
                className="pt-2 pb-4"
                style={{ width: "46%", height: "46%" }}
              />
            )
          )}

          {/* Render the awards image only if `awards` is truthy (not empty). */}
          {awards && awards !== "" && (
            <img
              src={awards}
              alt="Awards"
              className="pb-4"
              style={{ width: "45%" }}
            />
          )}
        </div>
      </div>
    </Link>
  );
};
