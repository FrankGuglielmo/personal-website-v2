import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// import Header from './components/Header';
import HeroSection from './components/HeroSection';
import ProjectSection from './components/ProjectSection';
import DetailedProject from './components/DetailedProject';
// import Footer from './components/Footer';
import { ProjectData } from './data/projectsData';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={
          <div className="App">
            <HeroSection id="hero"/>
            <ProjectSection projects={ProjectData} id="projects" />
          </div>
        } />
        <Route path="/projects/:projectId" element={
          <DetailedProject />
        } />
      </Routes>
    </Router>




    
  );
};

export default App;
