import React from 'react';

export default function Heading({ level = 2, className = '', children }) {
  const Tag = `h${level}`;
  return (
    <Tag className={`font-semibold tracking-tight text-3xl md:text-4xl text-text ${className}`}>
      {children}
    </Tag>
  );
}


