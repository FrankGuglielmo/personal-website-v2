import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
// import Header from './components/Header';
import HeroSection from './components/HeroSection';
import ProjectSection from './components/ProjectSection';
import DetailedProject from './components/DetailedProject';
import TechnologySection from './components/TechnologySection';
import WorkSection from './components/WorkSection';
import Footer from './components/Footer';
// import Footer from './components/Footer';
import { ProjectData } from './data/projectsData';
import { Analytics } from "@vercel/analytics/react"
import SupportPage from './components/LibrarioSupport';
import PrivacyPolicy from './components/PrivacyPolicy';
import BlogPage from './components/BlogPage';
import BlogPost from './components/BlogPost';

// Custom hook to scroll to a hash fragment
const ScrollToHashFragment = () => {
  const location = useLocation();
  
  useEffect(() => {
    // If hash exists in the URL
    if (location.hash) {
      // Get the element with that ID
      const element = document.getElementById(location.hash.substring(1));
      if (element) {
        // Scroll to the element
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (location.pathname === '/') {
      // Scroll to top for home page without hash
      window.scrollTo(0, 0);
    }
  }, [location]);
  
  return null;
};

const App = () => {
  useEffect(() => {
    // Attach smooth scroll to all anchor tags
    const smoothScrollAnchors = document.querySelectorAll('a[href^="#"]');
    smoothScrollAnchors.forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

    // Optional: Clean up the event listeners
    return () => {
        smoothScrollAnchors.forEach(anchor => {
            anchor.removeEventListener('click', function (e) {
                e.preventDefault();
                document.querySelector(this.getAttribute('href')).scrollIntoView({
                    behavior: 'smooth'
                });
            });
        });
    };
  }, []);

  return (
    <Router>
      <Analytics />
      <ScrollToHashFragment />
      <Routes>
        <Route path="/" element={
          <div className="App">
            <HeroSection id="hero"/>
            <ProjectSection projects={ProjectData} id="projects" />
            <WorkSection/>
            <TechnologySection/>
            <Footer />
          </div>
        } />
        <Route path="/projects/:projectName" element={
          <DetailedProject />
        } />
        
        <Route path="/Librario/support" element={
          <SupportPage />
        } />
        <Route path="/Librario/privacy" element={
          <PrivacyPolicy />
        } />
        
        <Route path="/blog" element={
          <BlogPage />
        } />
        
        <Route path="/blog/:postId" element={
          <BlogPost />
        } />

      </Routes>
    </Router>

  );
};

export default App;
