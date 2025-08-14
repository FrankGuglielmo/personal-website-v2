import React from 'react';
import { twMerge } from 'tailwind-merge';

export default function GlassPanel({ as: Component = 'div', className = '', children, role, style, ...props }) {
  const mergedClassName = twMerge('glass rounded-3xl shadow-glass border border-white/40', className);
  const mergedStyle = {
    WebkitBackdropFilter: 'blur(12px) saturate(140%)',
    backdropFilter: 'blur(12px) saturate(140%)',
    ...style,
  };

  return (
    <Component
      className={mergedClassName}
      role={role}
      style={mergedStyle}
      {...props}
    >
      {children}
    </Component>
  );
}


