import React from 'react';

/**
 * ResQDrive Premium Vector Brand Mark
 * Clean, geometric road perspective converging to an amber rescue beacon.
 */
export default function BrandLogo({ size = 24, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'block', flexShrink: 0 }}
    >
      {/* Precision Charcoal Squircle Foundation */}
      <rect width="32" height="32" rx="7.5" fill="#171717" />
      
      {/* Outer subtle bezel border */}
      <rect
        x="0.5"
        y="0.5"
        width="31"
        height="31"
        rx="7"
        stroke="rgba(255, 255, 255, 0.12)"
        strokeWidth="1"
      />

      {/* Converging Expressway Lanes */}
      <path
        d="M7.5 24.5L12.5 8.5H15.2L11.5 24.5H7.5Z"
        fill="#FFFFFF"
        fillOpacity="0.96"
      />
      <path
        d="M24.5 24.5L19.5 8.5H16.8L20.5 24.5H24.5Z"
        fill="#FFFFFF"
        fillOpacity="0.96"
      />

      {/* Center Dashed Guidance Guideline */}
      <line
        x1="16"
        y1="16"
        x2="16"
        y2="24"
        stroke="#FFFFFF"
        strokeOpacity="0.35"
        strokeWidth="1.5"
        strokeDasharray="2.5 2"
        strokeLinecap="round"
      />

      {/* Radiant Amber Rescue Beacon at Horizon */}
      <circle cx="16" cy="10" r="3" fill="#F5A623" />
      <circle cx="16" cy="10" r="5" stroke="#F5A623" strokeOpacity="0.35" strokeWidth="1" />
    </svg>
  );
}
