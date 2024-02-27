import React from 'react';

export default function NavBar() {
  return (
    <nav className="absolute top-0 left-0 w-full z-40">
      <div className="container mx-auto flex justify-between items-center p-4">
        <div className="font-bold text-xl text-white">FrankGuglielmo.com</div>
        <div className="flex items-center">
          <a href="/projects" className="text-white px-4 py-2 hover:text-yellow-300 transition-colors">Projects</a>
          <a href="/work" className="text-white px-4 py-2 hover:text-yellow-300 transition-colors">Work Experience</a>
          <a href="/tech" className="text-white px-4 py-2 hover:text-yellow-300 transition-colors">Technology</a>
          {/* <a href="/blog" className="text-white px-4 py-2 hover:text-yellow-300 transition-colors">Blog</a> */}
        </div>
      </div>
    </nav>
  );
};