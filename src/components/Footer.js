import React from 'react';
import { IoLogoGithub } from "react-icons/io";
import { FaLinkedin } from "react-icons/fa";
import '../index.css'; // Adjust the path to where your Footer.css is located

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <p className='text-white'>© {new Date().getFullYear()} FrankGuglielmo.com.</p>
        <div className="footer-links p-2">
          <a href="https://github.com/FrankGuglielmo" 
             target="_blank" 
             rel="noopener noreferrer" 
             className="github-icon">
            <IoLogoGithub size={24} />
          </a>
          <a href="https://www.linkedin.com/in/fdguglielmo/" 
             target="_blank" 
             rel="noopener noreferrer" 
             className="linkedin-icon">
            <FaLinkedin size={24} />
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;