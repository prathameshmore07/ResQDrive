import React from 'react';

/**
 * Premium Vector Icons for ResQDrive Workflow Steps
 * Replaces generic/cheap icons with bespoke editorial vectors.
 */

export function IntakeStepIcon({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="#171717" />
      {/* Pinpoint / Location Waveform */}
      <circle cx="16" cy="14" r="4.5" stroke="#FFFFFF" strokeWidth="1.75" />
      <circle cx="16" cy="14" r="1.75" fill="#F5A623" />
      <path d="M16 19.5V24M12.5 24H19.5" stroke="#FFFFFF" strokeWidth="1.75" strokeLinecap="round" />
      {/* Incident Signal Radians */}
      <path d="M8.5 11C7.5 12.8 7.5 15.2 8.5 17" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M23.5 11C24.5 12.8 24.5 15.2 23.5 17" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function DispatchStepIcon({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="#171717" />
      {/* Radar rings */}
      <circle cx="16" cy="16" r="9.5" stroke="rgba(255,255,255,0.2)" strokeWidth="1.25" strokeDasharray="3 2" />
      <circle cx="16" cy="16" r="5.5" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
      {/* Responder node */}
      <circle cx="20.5" cy="11.5" r="2.5" fill="#F5A623" />
      {/* Dispatch chevron */}
      <path d="M13 19L16 16L19 19" stroke="#FFFFFF" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function TrackingStepIcon({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="#171717" />
      {/* Turn-by-turn route path */}
      <path
        d="M9 23V17C9 14.7909 10.7909 13 13 13H19C21.2091 13 23 11.2091 23 9"
        stroke="rgba(255,255,255,0.3)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Active route path in brand amber */}
      <path
        d="M9 23V17C9 14.7909 10.7909 13 13 13H17"
        stroke="#F5A623"
        strokeWidth="2.25"
        strokeLinecap="round"
      />
      {/* Current vehicle position indicator */}
      <circle cx="17" cy="13" r="3" fill="#F5A623" />
      {/* Destination target */}
      <circle cx="23" cy="9" r="2" fill="#FFFFFF" />
    </svg>
  );
}

export function ResolutionStepIcon({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="#171717" />
      {/* Resolution Shield */}
      <path
        d="M16 6.5L8.5 9.5V16C8.5 21 11.8 24.8 16 26C20.2 24.8 23.5 21 23.5 16V9.5L16 6.5Z"
        stroke="rgba(255,255,255,0.3)"
        strokeWidth="1.5"
      />
      {/* Verified Success Check */}
      <path
        d="M12.5 16L15 18.5L20 13.5"
        stroke="#1F9D68"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
