import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// import Header from './components/Header';
import HeroSection from './components/HeroSection';
import ProjectSection from './components/ProjectSection';
import DetailedProject from './components/DetailedProject';
import TestingSection from './components/testing';
// import Footer from './components/Footer';
import { ProjectData } from './data/projectsData';
import TechnologySection from './components/TechnologySection';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={
          <div className="App">
            <HeroSection id="hero"/>
            <ProjectSection projects={ProjectData} id="projects" />

            <TestingSection/>



          </div>
        } />
        <Route path="/projects/:projectName" element={
          <DetailedProject />
        } />

        <Route path="/test" element={
        <TechnologySection/>
        } />

      </Routes>
    </Router>




    
  );
};

export default App;
