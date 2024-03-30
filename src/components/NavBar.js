import React from 'react';
import '../styles/heroSection.css';

export default function NavBar() {
  return (
    <nav className="absolute top-0 left-0 w-full z-40">
      <div className="container mx-auto flex justify-between items-center p-4">
        <div className="font-bold text-xl text-white">FrankGuglielmo.com</div>
        <div className="flex items-center mobile-hidden">
          <a href="#projects" className="text-white px-4 py-2 hover:text-yellow-300 transition-colors font-semibold">Projects</a>
          <span className="text-white mx-2">|</span>
          <a href="#experience" className="text-white px-4 py-2 hover:text-yellow-300 transition-colors font-semibold">Work Experience</a>
          <span className="text-white mx-2">|</span>
          <a href="#technology" className="text-white px-4 py-2 hover:text-yellow-300 transition-colors font-semibold">Technology</a>
          {/* Uncomment and add another separator for the Blog link */}
          {/* <span className="text-white mx-2">|</span>
          <a href="/blog" className="text-white px-4 py-2 hover:text-yellow-300 transition-colors font-extrabold">Blog</a> */}
        </div>
      </div>
    </nav>
  );
};