// components/HeroSection.js
import React from 'react';
import BackgroundImage from '../images/heroBackground.png';
import HeaderGradient from '../images/headerGradient.crop.png';
import ProfilePicture from '../images/profilePicture.png';

export default function HeroSection() {
  return (
    <section className="relative text-white py-20">
        
        
        <div className="absolute inset-0 z-0" id='HeroBackground'>

          <div className="w-full h-4/5 object-cover">
            <img src={BackgroundImage} alt="Background" className="w-full h-full object-cover" />
          </div>
          <div className='w-full h-1/5 object-cover relative'>
            <img src={HeaderGradient} className="w-full h-full object-cover" />
            {/* Text Section */}
            <div className="absolute top-5 left-10 right-0 bottom-0 z-10 flex items-top justify-left">
              <p className="text-black text-lg">My Socials:</p>
            </div>
          </div>
        </div>
        

        <div className="container mx-auto px-6 relative z-10 flex justify-between items-center" style={{ height: '500px' }}> {/* Adjust height as needed */}
          {/* Text content */}
          <div className="flex flex-row justify-center h-full">
            <div className="flex flex-col justify-center">
              <h1 className="text-5xl font-bold">Hi, I'm Frank.</h1>
              <h3 className="text-xl my-4">
                I am a Software Engineer currently enrolled as a Senior at the University of San Francisco.
              </h3>
              <div className='flex flex-row justify-center'>
                <a href="/contact" className="inline-block bg-yellow-400 text-purple-700 font-semibold px-8 py-3 rounded-lg mr-4 hover:bg-yellow-300 transition duration-300">
                  Contact Me
                </a>
                <a href="/Resume" className="inline-block bg-transparent border-2 border-white text-white font-semibold px-8 py-3 rounded-lg hover:bg-white hover:text-purple-700 transition duration-300">
                  Resume
                </a>
              </div>
            </div>
            <div className="relative flex-shrink-0 flex items-center justify-end">
              {/* Put the profile picture in the center right on the bottom of the section*/}
              <img src={ProfilePicture} alt="Profile Picture" className="z-20 -mb-10" style={{width: '58%'}} />
            </div>
          </div>
          
          {/* Profile picture */}
        </div>
    </section>
  );
};