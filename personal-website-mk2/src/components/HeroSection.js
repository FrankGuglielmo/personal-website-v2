// components/HeroSection.js
import React from 'react';
import BackgroundImage from '../images/heroBackground.png';
import HeaderGradient from '../images/headerGradient.png';
import ProfilePicture from '../images/profilePicture.png';

export default function HeroSection() {
  return (
    <section className="relative text-white py-20">
        {/* Make a div container on the lowest z index with the bacground image taking up 4/5 of the container and the header taking up the last 1/5 */}
        <div className="absolute inset-0 z-0">
          <img src={BackgroundImage} alt="Background" className="w-full h-full object-cover" />
        </div>
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-transparent to-black" style={{ backgroundImage: `url(${HeaderGradient})` }}></div>

      <div className="container mx-auto px-6 relative z-10 flex justify-between items-center" style={{ height: '500px' }}> {/* Adjust height as needed */}
        {/* Text content */}
        <div className="flex flex-col justify-center h-full">
          <h1 className="text-5xl font-bold">Hi, I'm Frank.</h1>
          <p className="text-xl my-4">
            Always take care of your health starting from the food menu that you consume every day.
          </p>
          <div>
            <a href="/menu" className="inline-block bg-yellow-400 text-purple-700 font-semibold px-8 py-3 rounded-lg mr-4 hover:bg-yellow-300 transition duration-300">
              Explore Menu
            </a>
            <a href="/video" className="inline-block bg-transparent border-2 border-white text-white font-semibold px-8 py-3 rounded-lg hover:bg-white hover:text-purple-700 transition duration-300">
              Watch Video
            </a>
          </div>
        </div>
        
        {/* Profile picture */}
        <div className="flex-shrink-0">
          <img src={ProfilePicture} className="rounded-t-full" alt="Profile" style={{ width: '300px', height: 'auto' }} /> {/* Adjust width and height as needed */}
        </div>
      </div>
    </section>
  );
};