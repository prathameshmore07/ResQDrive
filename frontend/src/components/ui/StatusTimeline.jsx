import React from 'react';
import { Check, X } from 'lucide-react';

const STEPS = [
  { id: 'REQUESTED', label: 'Requested' },
  { id: 'ASSIGNED', label: 'Provider found' },
  { id: 'IN_PROGRESS', label: 'On the way' },
  { id: 'ARRIVED', label: 'Arrived' },
  { id: 'COMPLETED', label: 'Completed' }
];

export default function StatusTimeline({ status = 'PENDING', compact = false }) {
  if (status === 'CANCELLED') {
    return (
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 14px',
          backgroundColor: 'var(--error-subtle)',
          color: 'var(--error)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '13.5px',
          fontWeight: 500
        }}
      >
        <X size={15} />
        <span>Request was cancelled</span>
      </div>
    );
  }

  // Determine current active step index
  let activeIndex = 0;
  if (status === 'ASSIGNED') activeIndex = 1;
  else if (status === 'IN_PROGRESS') activeIndex = 2;
  else if (status === 'COMPLETED') activeIndex = 4;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: compact ? '8px' : '16px', flexWrap: 'wrap' }}>
      {STEPS.map((step, idx) => {
        const isDone = idx < activeIndex || (status === 'COMPLETED' && idx <= 4);
        const isCurrent = idx === activeIndex && status !== 'COMPLETED';

        return (
          <React.Fragment key={step.id}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div
                style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  backgroundColor: isDone
                    ? 'var(--success)'
                    : isCurrent
                    ? 'var(--brand-amber)'
                    : 'var(--surface-secondary)',
                  color: isDone || isCurrent ? '#FFFFFF' : 'var(--text-muted)',
                  border: isDone || isCurrent ? 'none' : '1px solid var(--border)'
                }}
              >
                {isDone ? (
                  <Check size={11} strokeWidth={3} />
                ) : isCurrent ? (
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#171717' }} />
                ) : (
                  <span style={{ fontSize: '9px', fontWeight: 600 }}>{idx + 1}</span>
                )}
              </div>

              <span
                style={{
                  fontSize: compact ? '12px' : '13px',
                  fontWeight: isCurrent ? 600 : isDone ? 500 : 400,
                  color: isCurrent ? 'var(--text-primary)' : isDone ? 'var(--text-secondary)' : 'var(--text-muted)'
                }}
              >
                {step.label}
              </span>
            </div>

            {idx < STEPS.length - 1 && (
              <div
                style={{
                  width: compact ? '14px' : '24px',
                  height: '1px',
                  backgroundColor: isDone ? 'var(--success)' : 'var(--border)'
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
