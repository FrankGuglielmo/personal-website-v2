// components/HeroSection.js
import React, { useState, useEffect } from 'react';
import BackgroundImage from '../images/hero/heroBackground.webp';
import HeaderGradient from '../images/hero/headerGradient.crop.webp';
import ProfilePicture from '../images/hero/profilePicture.webp';
import NavBar from './NavBar';

export default function HeroSection() {

  const [typedText, setTypedText] = useState('');
  const fullText = "Hi, I'm Frank.";

  useEffect(() => {
    let index = 0;
    const timer = setInterval(() => {
      setTypedText((prev) => prev  + fullText.charAt(index));
      index++;
      if (index === fullText.length) clearInterval(timer);
    }, 100); // Adjust speed here

    return () => clearInterval(timer);
  }, []);


  return (
  <section id='Hero'> {/* Adjust height as necessary */}
    <div className="relative min-h-screen">
      {/* Background image */}
      <img src={BackgroundImage} alt="Background Gradient" className="absolute inset-0 w-full h-4/5 object-cover z-0" /> {/* Adjust height as needed */}

      {/* Header gradient image */}
      <img src={HeaderGradient} alt="header Gradient" className="absolute bottom-0 w-full h-1/5 object-cover z-0" /> {/* Adjust height as needed */}
      <div className="absolute right-20 bottom-20 z-20 mobile-hidden" style={{width: '30%'}}> {/* Adjust width and height as necessary */}
          <img src={ProfilePicture} alt="Frank Guglielmo Headshot" className="w-full h-full object-cover" />
        </div>

      {/* Content */}
      <div className="relative z-20 pt-16 pb-16 optimized-mobile"> {/* Add padding to ensure content does not touch the edges */}
        <div className="container mx-auto flex flex-col lg:flex-row items-center justify-between">

          {/* Navigation */}
          <NavBar />
          <div className="flex items-center justify-center computer-hidden"> {/* Adjust width and height as necessary */}
              <img src={ProfilePicture} alt="Frank Guglielmo" className="w-full h-full object-cover" />
            </div>
          {/* Text content */}
          <div className="lg:w-1/2 pt-20 optimized-mobile-3">
            <h1 id="typing" className="text-7xl text-white font-bold mb-12">{typedText}</h1>
            <p className="mt-12 text-white text-xl mb-12">
              I'm a Software Engineer and App Developer. Welcome to my site! Here you can find some of the projects I've worked on, my work experience, as well as the technologies I'm most familiar with.
            </p>
            <div className="mt-8 flex justify-center items-center">
              <a href='/FrankGuglielmoResume.pdf' className="inline-block bg-transparent border-2 border-white text-white font-semibold px-8 py-3 rounded-lg mr-4 hover:bg-white hover:text-black transition duration-300">
                Resume
              </a>
              <a href="https://www.linkedin.com/in/fdguglielmo/" target="_blank" className="inline-block bg-transparent border-2 border-white text-white font-semibold px-8 py-3 rounded-lg hover:bg-white hover:text-black transition duration-300" rel="noreferrer">Connect With Me!</a>
            </div>
          </div>
        </div>
      </div>
    </div>
</section>
  );
};


