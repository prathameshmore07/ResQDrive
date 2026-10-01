import React from 'react';

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = '',
  style = {}
}) {
  return (
    <div
      className={`text-center ${className}`.trim()}
      style={{
        padding: '40px 24px',
        backgroundColor: 'var(--surface-primary)',
        border: '1px dashed var(--border)',
        borderRadius: 'var(--radius-sm)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        ...style
      }}
    >
      {Icon && (
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--surface-secondary)',
            border: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
            marginBottom: '4px'
          }}
        >
          <Icon size={20} strokeWidth={1.75} />
        </div>
      )}
      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
        {title}
      </div>
      {description && (
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', maxWidth: '400px', lineHeight: 1.5 }}>
          {description}
        </div>
      )}
      {action && <div style={{ marginTop: '10px' }}>{action}</div>}
    </div>
  );
}
