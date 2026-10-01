import React from 'react';

export default function Badge({
  children,
  variant = 'neutral', // 'amber' | 'blue' | 'green' | 'red' | 'neutral'
  dot = false,
  className = '',
  style = {}
}) {
  const dotColorClass =
    variant === 'amber'
      ? 'pulse-dot-amber'
      : variant === 'blue'
      ? 'pulse-dot-blue'
      : variant === 'green'
      ? 'pulse-dot-green'
      : variant === 'red'
      ? 'pulse-dot-red'
      : '';

  return (
    <span className={`badge badge-${variant} ${className}`.trim()} style={style}>
      {dot && <span className={`pulse-dot ${dotColorClass}`} />}
      {children}
    </span>
  );
}
