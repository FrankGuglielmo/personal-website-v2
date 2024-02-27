// components/HeroSection.js
import React from 'react';
import BackgroundImage from '../images/heroBackground.png';
import HeaderGradient from '../images/headerGradient.crop.png';
import ProfilePicture from '../images/profilePicture.png';

export default function HeroSection() {
  return (
    <section className="relative max-h-screen"> {/* Adjust height as necessary */}
  <div className="relative h-full">
    {/* Background image */}
    <img src={BackgroundImage} alt="Background" className="absolute inset-0 w-full h-4/5 object-cover z-10" /> {/* Adjust height as needed */}

    {/* Header gradient image */}
    <img src={HeaderGradient} alt="Foreground" className="absolute bottom-0 w-full h-1/5 object-cover z-0" /> {/* Adjust height as needed */}

    {/* Content */}
    <div className="relative z-20 pt-16 pb-16"> {/* Add padding to ensure content does not touch the edges */}
      <div className="container mx-auto flex flex-col lg:flex-row items-center justify-between">
        {/* Text content */}
        <div className="lg:w-1/2">
          <h1 className="text-7xl text-white font-bold">Hi, I'm Frank.</h1>
          <p className="mt-6 text-white text-xl">
            I'm a Computer Science Student at the University of San Francisco. Welcome to my site! Here you can find some of the projects I've worked on, my work experience, as well as the technologies I'm most familiar with.
          </p>
          <div className="mt-8 flex justify-center items-center">
            <button className="inline-block bg-yellow-400 text-purple-700 font-semibold px-8 py-3 rounded-lg mr-4 hover:bg-yellow-300 transition duration-300">
              Email Me
            </button>
            <button className="inline-block bg-transparent border-2 border-white text-white font-semibold px-8 py-3 rounded-lg hover:bg-white hover:text-purple-700 transition duration-300">
              Resume
            </button>
          </div>
        </div>
        {/* Social media icons */}
          

        {/* Profile picture */}
        <div className="lg:w-1/2 flex justify-end pr-16"> {/* Add padding-right to prevent the image from touching the edge */}
          <img src={ProfilePicture} alt="Frank" style={{width: '70%'}} /> {/* Adjust width as necessary */}
        </div>
      </div>
    </div>
  </div>
</section>
  );
};


