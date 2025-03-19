import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../styles/heroSection.css';

export default function NavBar() {
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <nav className="absolute top-0 left-0 w-full z-40">
      <div className="container mx-auto flex justify-between items-center p-4 bg-transparent">
        <div className="flex items-center">
          <div className="font-bold text-xl text-white">
            <Link to="/" className="text-white hover:text-yellow-300 transition-colors">FrankGuglielmo.com</Link>
          </div>
          <button 
            className="text-white ml-4 computer-hidden focus:outline-none"
            onClick={toggleMobileMenu}
            aria-label="Toggle navigation menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              {mobileMenuOpen ? (
                // X icon when menu is open
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                // Hamburger icon when menu is closed
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
        
        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="fixed top-16 left-0 right-0 bg-gray-900 bg-opacity-95 p-4 computer-hidden">
            <div className="flex flex-col space-y-4">
              {isHomePage ? (
                <>
                  <a href="#projects" className="text-white py-2 text-center hover:text-yellow-300 transition-colors font-semibold" onClick={() => setMobileMenuOpen(false)}>Projects</a>
                  <a href="#experience" className="text-white py-2 text-center hover:text-yellow-300 transition-colors font-semibold" onClick={() => setMobileMenuOpen(false)}>Work Experience</a>
                  <a href="#technology" className="text-white py-2 text-center hover:text-yellow-300 transition-colors font-semibold" onClick={() => setMobileMenuOpen(false)}>Technology</a>
                </>
              ) : (
                <>
                  <Link to="/" onClick={() => { setMobileMenuOpen(false); setTimeout(() => document.getElementById('projects').scrollIntoView({ behavior: 'smooth' }), 100); }} className="text-white py-2 text-center hover:text-yellow-300 transition-colors font-semibold">Projects</Link>
                  <Link to="/" onClick={() => { setMobileMenuOpen(false); setTimeout(() => document.getElementById('experience').scrollIntoView({ behavior: 'smooth' }), 100); }} className="text-white py-2 text-center hover:text-yellow-300 transition-colors font-semibold">Work Experience</Link>
                  <Link to="/" onClick={() => { setMobileMenuOpen(false); setTimeout(() => document.getElementById('technology').scrollIntoView({ behavior: 'smooth' }), 100); }} className="text-white py-2 text-center hover:text-yellow-300 transition-colors font-semibold">Technology</Link>
                </>
              )}
              <Link to="/blog" className="text-white py-2 text-center hover:text-yellow-300 transition-colors font-semibold" onClick={() => setMobileMenuOpen(false)}>Blog</Link>
            </div>
          </div>
        )}
        
        {/* Desktop navigation menu - hidden on mobile */}
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
