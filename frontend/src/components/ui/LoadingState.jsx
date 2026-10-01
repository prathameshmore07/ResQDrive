import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingState({
  message = 'Loading operational telemetry...',
  subtext,
  minHeight = '240px'
}) {
  return (
    <div
      style={{
        minHeight,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '32px 24px',
        textAlign: 'center',
        gap: '12px'
      }}
    >
      <Loader2
        size={24}
        style={{
          color: 'var(--accent)',
          animation: 'spin 1s linear infinite'
        }}
      />
      <div>
        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
          {message}
        </div>
        {subtext && (
          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '3px' }}>
            {subtext}
          </div>
        )}
      </div>
    </div>
  );
}
