import React from 'react';
// import Header from './components/Header';
import HeroSection from './components/HeroSection';
import ProjectSection from './components/ProjectSection';
// import Footer from './components/Footer';
import { ProjectData } from './data/projectsData';

const App = () => {
  return (
    <div className="App">
      <HeroSection id="hero"/>
      <ProjectSection projects={ProjectData} id="projects" />
    </div>
  );
};

export default App;
