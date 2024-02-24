import React from 'react';

export default function ProjectCard({id, imageSrc, title, description, technologies }) {
    return (
      <div className="max-w-sm rounded overflow-hidden shadow-lg my-2">
        {/* Use a placeholder image if imageSrc is not provided or not found */}
        <img className="w-full" src={imageSrc} alt={`Thumbnail of ${title}`} onError={(e) => { e.target.onerror = null; e.target.src = "https://i.natgeofe.com/n/4f5aaece-3300-41a4-b2a8-ed2708a0a27c/domestic-dog_thumb_3x2.jpg"; }} />
        <div className="px-6 py-4">
          <div className="font-bold text-xl mb-2">{title}</div>
          <p className="text-gray-700 text-base">
            {description}
          </p>
        </div>
        <div className="px-6 pt-4 pb-2">
          {/* Check if technologies is an array before mapping */}
          {Array.isArray(technologies) && technologies.map((tech) => (
            <span key={tech} className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2">
              #{tech}
            </span>
          ))}
        </div>
      </div>
    );
  };
