import React from 'react';
import { Loader2 } from 'lucide-react';

export default function Button({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'ghost' | 'destructive' | 'blue' | 'location'
  size = 'md', // 'sm' | 'md' | 'lg' | 'icon' | 'icon-sm'
  className = '',
  disabled = false,
  isLoading = false,
  onClick,
  type = 'button',
  title,
  style = {},
  ...props
}) {
  const variantClass = `btn-${variant}`;
  const sizeClass = size === 'md' ? '' : `btn-${size}`;

  return (
    <button
      type={type}
      className={`btn ${variantClass} ${sizeClass} ${className}`.trim()}
      disabled={disabled || isLoading}
      onClick={onClick}
      title={title}
      style={style}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 size={size === 'sm' ? 12 : 14} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
          <span>Processing...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
