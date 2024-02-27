// components/HeroSection.js
import React from 'react';
import BackgroundImage from '../images/heroBackground.png';
import HeaderGradient from '../images/headerGradient.crop.png';
import ProfilePicture from '../images/profilePicture.png';
import USFLogo from '../images/usflogo.png';
import NavBar from './NavBar';

export default function HeroSection() {
  return (
    <section> {/* Adjust height as necessary */}
  <div className="relative min-h-screen">
    {/* Background image */}
    <img src={BackgroundImage} alt="Background" className="absolute inset-0 w-full h-4/5 object-cover z-0" /> {/* Adjust height as needed */}

    {/* Header gradient image */}
    <img src={HeaderGradient} alt="Foreground" className="absolute bottom-0 w-full h-1/5 object-cover z-0" /> {/* Adjust height as needed */}
    {/* Input the usflogo.png on top of the header gradient */}
    <div className="absolute left-40 bottom-5 z-20" style={{width: '30%', opacity:"50%"}}> {/* Adjust width and height as necessary */}
              <img src={USFLogo} alt="Frank" className="w-full h-full object-cover" />
      </div>


    <div className="absolute right-20 bottom-20 z-20" style={{width: '30%'}}> {/* Adjust width and height as necessary */}
        <img src={ProfilePicture} alt="Frank" className="w-full h-full object-cover" />
      </div>

    {/* Content */}
    <div className="relative z-20 pt-16 pb-16"> {/* Add padding to ensure content does not touch the edges */}
      <div className="container mx-auto flex flex-col lg:flex-row items-center justify-between">

        {/* Navigation */}
        <NavBar />
        {/* Text content */}
        <div className="lg:w-1/2 pt-20">
          <h1 className="text-7xl text-white font-bold mb-12">Hi, I'm Frank.</h1>
          <p className="mt-12 text-white text-xl mb-12">
            I'm a Software Engineer studying at the University of San Francisco. Welcome to my site! Here you can find some of the projects I've worked on, my work experience, as well as the technologies I'm most familiar with.
          </p>
          <div className="mt-8 flex justify-center items-center">
            <a href='/FrankGuglielmoResume.pdf' className="inline-block bg-yellow-400 text-purple-700 font-semibold px-8 py-3 rounded-lg mr-4 hover:bg-yellow-300 transition duration-300">
              Resume
            </a>
            <a href="/FrankGuglielmoResume.pdf" target="_blank" className="inline-block bg-transparent border-2 border-white text-white font-semibold px-8 py-3 rounded-lg hover:bg-white hover:text-purple-700 transition duration-300" rel="noreferrer">Email me</a>
          </div>
        </div>
        {/* Social media icons */}
      </div>
    </div>
  </div>
</section>
  );
};


