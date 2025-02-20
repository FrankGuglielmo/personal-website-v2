import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TechData } from '../data/TechData';
import '../index.css';

const width = window.innerWidth / 1.25;
const height = window.innerHeight / 1.25;
const BASE_SPEED = 0.25; // Constant speed for all bubbles

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min) + min);
}

const techBubbles = TechData.map(item => {
  const radius = item.strengthLevel * 15 + 15;
  let vx = (Math.random() - 0.5);
  let vy = (Math.random() - 0.5);
  const mag = Math.sqrt(vx * vx + vy * vy);
  vx = (vx / mag) * BASE_SPEED;
  vy = (vy / mag) * BASE_SPEED;
  return {
    x: getRandomInt(radius, width - radius),
    y: getRandomInt(radius, height - radius),
    radius,
    content: item.imageUrl,
    vx,
    vy,
  };
});

const TechnologySection = () => {
  const [bubbles, setBubbles] = useState(techBubbles);
  const svgRef = useRef();
  const bubblesRef = useRef(techBubbles);

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
      } else if (x > width - radius) {
        x = width - radius;
        vx = -Math.abs(vx);
      }
      
      // Bounce off top/bottom boundaries.
      if (y < radius) {
        y = radius;
        vy = Math.abs(vy);
      } else if (y > height - radius) {
        y = height - radius;
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
  }, []);
  
  useEffect(() => {
    requestAnimationFrame(updateBubbles);
  }, [updateBubbles]);

  return (
    <section id='technology'>
      <h2 className="text-3xl font-bold text-center text-gray-800">
        Technologies I've Worked With
      </h2>
      <div className="svg-container rounded-xl shadow-lg">
        <svg ref={svgRef} width={width} height={height}>
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
