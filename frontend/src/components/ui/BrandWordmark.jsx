import React from 'react';

export default function BrandWordmark({ height = 22, style = {}, className = '' }) {
  return (
    <img
      src="/resqdrive-typography.png"
      alt="ResQDrive"
      className={className}
      style={{
        height: typeof height === 'number' ? `${height}px` : height,
        width: 'auto',
        display: 'block',
        objectFit: 'contain',
        userSelect: 'none',
        ...style
      }}
    />
  );
}
