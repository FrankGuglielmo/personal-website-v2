import React from 'react';
// import Header from './components/Header';
import HeroSection from './components/HeroSection';
import ProjectSection from './components/ProjectSection';
// import Footer from './components/Footer';
import { ProjectData } from './data/projectsData';
import Fade from 'react-reveal/Fade';

const App = () => {
  return (
    <div className="App">
      <HeroSection />
      <Fade bottom>
      <ProjectSection projects={ProjectData} />
      </Fade>
    </div>
  );
};

export default App;
