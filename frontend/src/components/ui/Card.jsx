import React from 'react';

export function Card({ children, className = '', secondary = false, interactive = false, style = {}, onClick, ...props }) {
  const baseClass = secondary ? 'resq-card-secondary' : 'resq-card';
  const interactiveClass = interactive ? 'resq-card-interactive' : '';
  return (
    <div
      className={`${baseClass} ${interactiveClass} ${className}`.trim()}
      style={style}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '', style = {}, ...props }) {
  return (
    <div className={`resq-card-header ${className}`.trim()} style={style} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '', style = {}, ...props }) {
  return (
    <h3
      className={`font-semibold text-primary ${className}`.trim()}
      style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: 0, ...style }}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({ children, className = '', style = {}, ...props }) {
  return (
    <p
      className={`text-muted ${className}`.trim()}
      style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px', margin: 0, ...style }}
      {...props}
    >
      {children}
    </p>
  );
}

export function CardContent({ children, className = '', style = {}, ...props }) {
  return (
    <div className={`resq-card-body ${className}`.trim()} style={style} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '', style = {}, ...props }) {
  return (
    <div className={`resq-card-footer ${className}`.trim()} style={style} {...props}>
      {children}
    </div>
  );
}

export default Card;
