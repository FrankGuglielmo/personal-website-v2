import React, { useState, useEffect, useCallback, useRef } from 'react';
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

const initialBubbles = [
  { x: getRandomInt(circleRadius, height - circleRadius), y: getRandomInt(circleRadius, height - circleRadius), radius: 20, color: 'red' },
  { x: getRandomInt(circleRadius, height - circleRadius), y: getRandomInt(circleRadius, height - circleRadius), radius: 25, color: 'green' },
  // Add more bubbles as needed
];

const Test = () => {
  const [mousePosition, setMousePosition] = useState(initialMousePosition);
  const [bubbles, setBubbles] = useState(initialBubbles);
  const svgRef = useRef();

  const handleMouseMove = useCallback(event => {
    const { clientX, clientY } = event;
    const { left, top } = svgRef.current.getBoundingClientRect();
    setMousePosition({ x: clientX - left, y: clientY - top });
  }, [setMousePosition]);

  useEffect(() => {
    const newBubbles = bubbles.map(bubble => {
      let newX = bubble.x;
      let newY = bubble.y;

      // Collision detection
      const dx = bubble.x - mousePosition.x;
      const dy = bubble.y - mousePosition.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < bubble.radius + circleRadius) {
        newX = bubble.x + dx / distance * 25;
        newY = bubble.y + dy / distance * 25;
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
    setBubbles(newBubbles);
  }, [mousePosition, bubbles]);



  return (
    <div className="svg-container">
      <svg ref={svgRef} width={width} height={height} onMouseMove={handleMouseMove}>
      {bubbles.map((bubble, index) => (
          <circle key={index} cx={bubble.x} cy={bubble.y} r={bubble.radius} fill={bubble.color} />
        ))}
        <circle cx={mousePosition.x} cy={mousePosition.y} r={circleRadius} fill="blue" />
      </svg>
    </div>
  );
};

export default Test;