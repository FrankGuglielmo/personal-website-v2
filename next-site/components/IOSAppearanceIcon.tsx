import React from "react";

type Props = React.SVGAttributes<SVGSVGElement> & { size?: number };

export default function IOSAppearanceIcon({ size = 22, ...rest }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      {...rest}
    >
      {/* Outer ring */}
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="2" />
      {/* Right half fill */}
      <path d="M12 4a8 8 0 1 1 0 16V4Z" fill="currentColor" />
      {/* Inner dot */}
      <circle cx="12" cy="12" r="2.6" fill="currentColor" />
    </svg>
  );
}



