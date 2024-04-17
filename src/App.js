import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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

      </Routes>
    </Router>

  );
};

export default App;
