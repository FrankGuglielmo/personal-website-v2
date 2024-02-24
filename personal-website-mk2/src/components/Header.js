// components/Header.js
import React from 'react';

const Header = () => {
  return (
    <header className="bg-purple-600 text-white">
      <nav className="container mx-auto flex justify-between items-center py-4">
        {/* Logo and navigation items */}
        <div className="logo">
          {/* Place logo here */}
        </div>
        <div className="nav-items hidden md:flex">
          {/* Navigation links */}
        </div>
        {/* Mobile menu button */}
        <div className="md:hidden">
          <button>{/* Mobile menu icon */}</button>
        </div>
      </nav>
      {/* Main headline */}
      <div className="text-center py-12">
        <h1 className="text-4xl font-bold">Changing your eating habits</h1>
        <p className="text-lg mt-4">
          Always take care of your health starting from the food menu that you consume every day.
        </p>
        {/* Call to action buttons */}
        <div className="mt-8">
          <button className="bg-yellow-400 text-purple-700 px-6 py-2 rounded-md mr-4">
            Explore Menu
          </button>
          <button className="text-white border-2 border-white px-6 py-2 rounded-md">
            Watch Video
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;