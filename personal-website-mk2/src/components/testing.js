import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TechData } from '../data/TechData';
import  '../index.css';


const width = window.innerWidth / 1.25;
const height = window.innerHeight / 1.25;
const circleRadius = 30;
const initialMousePosition = { x: width / 2, y: height / 2 };

function getRandomInt(min, max) {
  const minCeiled = Math.ceil(min);
  const maxFloored = Math.floor(max);
  return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled); // The maximum is exclusive and the minimum is inclusive
}

  const techBubbles = TechData.map(item => ({
    x: getRandomInt(circleRadius, width - circleRadius),
    y: getRandomInt(circleRadius, height - circleRadius),
    radius: item.strengthLevel * 15 + 15,
    content: item.imageUrl
  }));

const Test = () => {
  const [mousePosition, setMousePosition] = useState(initialMousePosition);
  const [bubbles, setBubbles] = useState(techBubbles);
  const svgRef = useRef();
  const bubblesRef = useRef(techBubbles); // Use ref to track bubbles

  const handleMouseMove = useCallback(event => {
    const { clientX, clientY } = event;
    const { left, top } = svgRef.current.getBoundingClientRect();
    setMousePosition({ x: clientX - left, y: clientY - top });
  }, [setMousePosition]);

  const updateBubbles = useCallback(() => {
    let newBubbles = bubblesRef.current.map(bubble => {
      let newX = bubble.x;
      let newY = bubble.y;
  
      // Handle collision with mouse-controlled circle
      const dx = bubble.x - mousePosition.x;
      const dy = bubble.y - mousePosition.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
    
      if (distance < bubble.radius + circleRadius) {
        newX += dx / distance * 25;
        newY += dy / distance * 25;
      }
  
      // Boundary checks
      newX = Math.max(bubble.radius, Math.min(newX, width - bubble.radius));
      newY = Math.max(bubble.radius, Math.min(newY, height - bubble.radius));
  
      return {
        ...bubble,
        x: newX,
        y: newY
      };
    });
  
    // Handle collisions between bubbles
    for (let i = 0; i < newBubbles.length; i++) {
      for (let j = i + 1; j < newBubbles.length; j++) {
        const bubble1 = newBubbles[i];
        const bubble2 = newBubbles[j];
  
        const dx = bubble2.x - bubble1.x;
        const dy = bubble2.y - bubble1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDistance = bubble1.radius + bubble2.radius;
  
        if (distance < minDistance) {
          const angle = Math.atan2(dy, dx);
          const overlap = (minDistance - distance) / 2;
  
          newBubbles[i] = {
            ...bubble1,
            x: bubble1.x - overlap * Math.cos(angle),
            y: bubble1.y - overlap * Math.sin(angle)
          };
  
          newBubbles[j] = {
            ...bubble2,
            x: bubble2.x + overlap * Math.cos(angle),
            y: bubble2.y + overlap * Math.sin(angle)
          };
        }
      }
    }
  
    bubblesRef.current = newBubbles; // Update the ref
    setBubbles(newBubbles); // Update the state to trigger re-render
  }, [mousePosition, bubblesRef]);


  useEffect(() => {
    const handle = requestAnimationFrame(updateBubbles);
    return () => cancelAnimationFrame(handle);
  }, [updateBubbles]);


  return (
    <div className="svg-container">
      <svg ref={svgRef} width={width} height={height} onMouseMove={handleMouseMove}>
      {bubbles.map((bubble, index) => (
          <g key={index}>
            <clipPath id={`clip-circle-${index}`}>
              <circle cx={bubble.x} cy={bubble.y} r={bubble.radius} />
            </clipPath>
            <image
              href={TechData[index].imageUrl} // Ensure the image URLs are correctly referenced
              x={bubble.x - bubble.radius}
              y={bubble.y - bubble.radius}
              height={bubble.radius * 2}
              width={bubble.radius * 2}
              clipPath={`url(#clip-circle-${index})`} // Apply the clip path
            />
            <circle 
              cx={bubble.x} 
              cy={bubble.y} 
              r={bubble.radius} 
              fill="none"  // Ensures that the circle itself is transparent
              stroke="black"  // Color of the stroke
              strokeWidth="1" // Width of the stroke
              filter="drop-shadow(2px 2px 2px rgba(0, 0, 0, 0.5))" // Adds a drop shadow
            />
          </g>
        ))}
        <circle cx={mousePosition.x} cy={mousePosition.y} r={circleRadius} fill="none" />
      </svg>
    </div>
    
  );
};

export default Test;