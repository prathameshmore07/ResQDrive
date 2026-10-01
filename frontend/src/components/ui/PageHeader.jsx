import React from 'react';

export default function PageHeader({
  eyebrow,
  title,
  description,
  badge,
  actions,
  className = '',
  style = {}
}) {
  return (
    <div
      className={`page-header ${className}`.trim()}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '20px',
        ...style
      }}
    >
      <div>
        {eyebrow && (
          <div
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.4px',
              marginBottom: '3px'
            }}
          >
            {eyebrow}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h1
            style={{
              fontSize: '20px',
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.3px',
              margin: 0
            }}
          >
            {title}
          </h1>
          {badge}
        </div>
        {description && (
          <p
            style={{
              fontSize: '13px',
              color: 'var(--text-secondary)',
              marginTop: '4px',
              margin: '4px 0 0 0'
            }}
          >
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {actions}
        </div>
      )}
    </div>
  );
}
