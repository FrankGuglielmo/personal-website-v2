import * as d3 from "d3";
import React, { useRef, useEffect } from "react";
import { TechData } from "../data/TechData";

const TechnologySection = () => {
  const svgRef = useRef(null);

  useEffect(() => {
    const svg = d3.select(svgRef.current);

    // Add an invisible bubble for the mouse
    const mouseBubble = { x: 0, y: 0, radius: 30 }; // Adjust radius as needed

    // Combine TechData with the mouse bubble
    const combinedData = [...TechData, mouseBubble];

    // Set up simulation with combined data
    const simulation = d3
      .forceSimulation(combinedData)
      .force("center", d3.forceCenter(500, 300))
      .force("charge", d3.forceManyBody().strength(-20))
      .force("collide", d3.forceCollide().radius(d => d.radius))
      .alphaMin(0.01);


    // Create bubbles
    const bubbles = svg
      .selectAll("circle")
      .data(combinedData)
      .enter()
      .append("circle")
      .attr("r", d =>  d === mouseBubble ? d.radius : d.strengthLevel * 10)
      .attr("fill", d => d === mouseBubble ? "steelblue" : "steelblue"); // Invisible fill for mouse bubble

    // If the mouse bubble touches the tech bubble, push it around
    simulation.on("tick", () => {
      bubbles
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);
    });

    //When clicking, stop the simulation. When clicking again, restart it.
    let isStopped = false;
    svg.on("click", () => {
      if (isStopped) {
        simulation.alpha(1).restart();
      } else {
        simulation.stop();
      }
      isStopped = !isStopped;
    });


    // Update mouse bubble position on mousemove
    svg.on("mousemove", (event) => {
      const [x, y] = d3.pointer(event);
      mouseBubble.x = x;
      mouseBubble.y = y;
      simulation.alpha(1).restart(); // Restart simulation with new mouse position
    });

  }, []);

  return <svg ref={svgRef} width={1000} height={600}></svg>;
};

export default TechnologySection;