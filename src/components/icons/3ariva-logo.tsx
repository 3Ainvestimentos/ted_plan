import React from 'react';

export function ThreeARivaLogo(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 350 150"
      width="250"
      height="100"
      {...props}
    >
      <defs>
        <linearGradient id="gold-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#E4C58F', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#C59A5F', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      <style>
        {`
          .riva-text { font-family: 'Roboto', sans-serif; font-weight: 700; font-size: 60px; fill: #000; letter-spacing: -2px; }
          .invest-text { font-family: 'Roboto', sans-serif; font-weight: 400; font-size: 20px; fill: #000; letter-spacing: 5px; }
        `}
      </style>
      
      <text x="5" y="70" className="riva-text">3A</text>
      
      <g transform="translate(100, 28)">
        <rect x="0" y="0" width="12" height="25" fill="url(#gold-gradient)" transform="skewX(-15)" />
        <rect x="18" y="0" width="12" height="35" fill="url(#gold-gradient)" transform="skewX(-15)" />
        <rect x="36" y="0" width="12" height="45" fill="url(#gold-gradient)" transform="skewX(-15)" />
      </g>
      
      <text x="160" y="70" className="riva-text">IVA</text>
      
      <text x="58" y="110" className="invest-text">INVESTIMENTOS</text>
    </svg>
  );
}