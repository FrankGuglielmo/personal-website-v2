import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TechData } from '../data/TechData';
import '../index.css';

// Use a function for dimensions to allow for responsive updates
const getViewDimensions = () => {
  // Make it more compact on mobile
  const isMobile = window.innerWidth <= 768;
  return {
    width: isMobile ? window.innerWidth * 0.95 : window.innerWidth / 1.25,
    height: isMobile ? window.innerHeight * 0.6 : window.innerHeight / 1.25,
  };
};

const BASE_SPEED = 0.25; // Constant speed for all bubbles

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min) + min);
}

// Function to generate bubbles with current dimensions
const generateBubbles = (dimensions) => {
  return TechData.map(item => {
    // Scale radius based on screen size
    const scaleFactor = window.innerWidth <= 768 ? 0.7 : 1;
    const radius = (item.strengthLevel * 15 + 15) * scaleFactor;
    let vx = (Math.random() - 0.5);
    let vy = (Math.random() - 0.5);
    const mag = Math.sqrt(vx * vx + vy * vy);
    vx = (vx / mag) * BASE_SPEED;
    vy = (vy / mag) * BASE_SPEED;
    return {
      x: getRandomInt(radius, dimensions.width - radius),
      y: getRandomInt(radius, dimensions.height - radius),
      radius,
      content: item.imageUrl,
      vx,
      vy,
    };
  });
};

const TechnologySection = () => {
  const [dimensions, setDimensions] = useState(getViewDimensions());
  const [bubbles, setBubbles] = useState(() => generateBubbles(dimensions));
  const svgRef = useRef();
  const bubblesRef = useRef(bubbles);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const newDimensions = getViewDimensions();
      setDimensions(newDimensions);
      
      // Reset bubbles when window size changes significantly
      bubblesRef.current = generateBubbles(newDimensions);
      setBubbles(bubblesRef.current);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const updateBubbles = useCallback(() => {
    // Update positions and handle boundary collisions.
    let newBubbles = bubblesRef.current.map(bubble => {
      let { x, y, vx, vy, radius } = bubble;
      
      x += vx;
      y += vy;
      
      // Bounce off left/right boundaries.
      if (x < radius) {
        x = radius;
        vx = Math.abs(vx);
      } else if (x > dimensions.width - radius) {
        x = dimensions.width - radius;
        vx = -Math.abs(vx);
      }
      
      // Bounce off top/bottom boundaries.
      if (y < radius) {
        y = radius;
        vy = Math.abs(vy);
      } else if (y > dimensions.height - radius) {
        y = dimensions.height - radius;
        vy = -Math.abs(vy);
      }
      
      return { ...bubble, x, y, vx, vy };
    });
    
    // Light collision detection with an explosion-like impulse.
    for (let i = 0; i < newBubbles.length; i++) {
      for (let j = i + 1; j < newBubbles.length; j++) {
        let bubble1 = newBubbles[i];
        let bubble2 = newBubbles[j];
        const dx = bubble2.x - bubble1.x;
        const dy = bubble2.y - bubble1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDistance = bubble1.radius + bubble2.radius;
        
        if (distance < minDistance && distance > 0) {
          const overlap = (minDistance - distance) / 2;
          const angle = Math.atan2(dy, dx);
          
          // Apply a collision impulse scaled by average bubble size.
          const collisionForce = 0.05 * ((bubble1.radius + bubble2.radius) / 6);
          const forceX = collisionForce * Math.cos(angle);
          const forceY = collisionForce * Math.sin(angle);
          bubble1.vx -= forceX;
          bubble1.vy -= forceY;
          bubble2.vx += forceX;
          bubble2.vy += forceY;
          
          // Nudge bubbles apart to resolve overlap.
          bubble1.x -= overlap * Math.cos(angle);
          bubble1.y -= overlap * Math.sin(angle);
          bubble2.x += overlap * Math.cos(angle);
          bubble2.y += overlap * Math.sin(angle);
        }
      }
    }
    
    // Normalize each bubble's velocity to gradually return to BASE_SPEED.
    const decayRate = 0.05;
    newBubbles = newBubbles.map(bubble => {
      let { vx, vy } = bubble;
      let speed = Math.sqrt(vx * vx + vy * vy);
      if (speed === 0) {
        vx = (Math.random() - 0.5);
        vy = (Math.random() - 0.5);
        speed = Math.sqrt(vx * vx + vy * vy);
      }
      let newSpeed = speed > BASE_SPEED 
        ? speed - (speed - BASE_SPEED) * decayRate 
        : speed + (BASE_SPEED - speed) * decayRate;
      
      return {
        ...bubble,
        vx: (vx / speed) * newSpeed,
        vy: (vy / speed) * newSpeed,
      };
    });
    
    bubblesRef.current = newBubbles;
    setBubbles(newBubbles);
    requestAnimationFrame(updateBubbles);
  }, [dimensions]);
  
  useEffect(() => {
    requestAnimationFrame(updateBubbles);
  }, [updateBubbles]);

  return (
    <section id='technology' className="py-8">
      <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
        Technologies I've Worked With
      </h2>
      <div className="svg-container rounded-xl shadow-lg mx-auto" style={{ maxWidth: '100%', overflow: 'hidden' }}>
        <svg ref={svgRef} width={dimensions.width} height={dimensions.height}>
          {bubbles.map((bubble, index) => (
            <g key={index}>
              <clipPath id={`clip-circle-${index}`}>
                <circle cx={bubble.x} cy={bubble.y} r={bubble.radius} />
              </clipPath>
              <image
                href={TechData[index].imageUrl}
                x={bubble.x - bubble.radius}
                y={bubble.y - bubble.radius}
                height={bubble.radius * 2}
                width={bubble.radius * 2}
                clipPath={`url(#clip-circle-${index})`}
              />
              <circle 
                cx={bubble.x} 
                cy={bubble.y} 
                r={bubble.radius} 
                fill="none"
                stroke="#E4E4E4"
                strokeWidth="0.3"
                filter="drop-shadow(2px 2px 2px rgba(0, 0, 0, 0.5))"
              />
            </g>
          ))}
        </svg>
      </div>
    </section>
  );
};

export default TechnologySection;
