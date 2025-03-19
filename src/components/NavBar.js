import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../styles/heroSection.css';

export default function NavBar() {
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  return (
    <nav className="absolute top-0 left-0 w-full z-40">
      <div className="container mx-auto flex justify-between items-center p-4 bg-transparent">
        <div className="font-bold text-xl text-white">
          <Link to="/" className="text-white hover:text-yellow-300 transition-colors">FrankGuglielmo.com</Link>
        </div>
        <div className="flex items-center mobile-hidden">
          {isHomePage ? (
            <>
              <a href="#projects" className="text-white px-4 py-2 hover:text-yellow-300 transition-colors font-semibold">Projects</a>
              <span className="text-white mx-2">|</span>
              <a href="#experience" className="text-white px-4 py-2 hover:text-yellow-300 transition-colors font-semibold">Work Experience</a>
              <span className="text-white mx-2">|</span>
              <a href="#technology" className="text-white px-4 py-2 hover:text-yellow-300 transition-colors font-semibold">Technology</a>
            </>
          ) : (
            <>
              <Link to="/" onClick={() => { setTimeout(() => document.getElementById('projects').scrollIntoView({ behavior: 'smooth' }), 100); }} className="text-white px-4 py-2 hover:text-yellow-300 transition-colors font-semibold">Projects</Link>
              <span className="text-white mx-2">|</span>
              <Link to="/" onClick={() => { setTimeout(() => document.getElementById('experience').scrollIntoView({ behavior: 'smooth' }), 100); }} className="text-white px-4 py-2 hover:text-yellow-300 transition-colors font-semibold">Work Experience</Link>
              <span className="text-white mx-2">|</span>
              <Link to="/" onClick={() => { setTimeout(() => document.getElementById('technology').scrollIntoView({ behavior: 'smooth' }), 100); }} className="text-white px-4 py-2 hover:text-yellow-300 transition-colors font-semibold">Technology</Link>
            </>
          )}
          <span className="text-white mx-2">|</span>
          <Link to="/blog" className="text-white px-4 py-2 hover:text-yellow-300 transition-colors font-semibold">Blog</Link>
        </div>
      </div>
    </nav>
  );
};
