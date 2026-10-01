import React from 'react';
import { Check } from 'lucide-react';
import Button from './Button';
import Badge from './Badge';

export default function RequestCard({
  request,
  isSelected = false,
  onClick,
  onAction,
  actionLabel = 'Claim Call & Deploy',
  actionLoading = false,
  actionDisabled = false,
  showAction = true,
  distance = '~2.4 MI',
  className = '',
  style = {}
}) {
  if (!request) return null;

  const issueLabel = request.issueType ? request.issueType.replace(/_/g, ' ') : 'General Assistance';
  const vehicleText = request.vehicleDetails
    ? `${request.vehicleDetails.make || ''} ${request.vehicleDetails.model || ''} (${request.vehicleDetails.licensePlate || 'NO PLATE'})`.trim()
    : 'Motorist Vehicle';

  const statusVariant =
    request.status === 'COMPLETED'
      ? 'green'
      : request.status === 'CANCELLED'
      ? 'red'
      : request.status === 'IN_PROGRESS' || request.status === 'ASSIGNED'
      ? 'blue'
      : 'amber';

  return (
    <div
      onClick={onClick}
      className={`resq-card ${isSelected ? 'resq-card-interactive' : ''} ${className}`.trim()}
      style={{
        backgroundColor: isSelected ? 'var(--surface-elevated)' : 'var(--surface)',
        borderColor: isSelected ? 'var(--accent)' : 'var(--border)',
        padding: '16px',
        cursor: onClick ? 'pointer' : 'default',
        ...style
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="mono-token" style={{ fontWeight: 700, color: 'var(--accent)' }}>
            #{request._id ? request._id.slice(-6).toUpperCase() : 'CALL'}
          </span>
          <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
            {issueLabel}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {distance && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700, color: 'var(--blue)' }}>
              {distance}
            </span>
          )}
          <Badge variant={statusVariant}>
            {request.status}
          </Badge>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
        <div>
          <span style={{ color: 'var(--text-muted)' }}>Location: </span>
          <strong style={{ color: 'var(--text-primary)' }}>{request.location?.address || 'Highway breakdown'}</strong>
        </div>
        <div>
          <span style={{ color: 'var(--text-muted)' }}>Vehicle: </span>
          <strong style={{ color: 'var(--text-primary)' }}>{vehicleText}</strong>
        </div>
      </div>

      {request.description && (
        <div
          style={{
            fontSize: '11.5px',
            color: 'var(--text-secondary)',
            marginBottom: '10px',
            backgroundColor: 'var(--bg-secondary)',
            padding: '6px 10px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)'
          }}
        >
          "{request.description}"
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
        <span className="mono-token" style={{ fontSize: '11px' }}>
          {new Date(request.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>

        {showAction && onAction && (
          <Button
            variant="primary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onAction(request._id);
            }}
            disabled={actionDisabled || actionLoading}
            isLoading={actionLoading}
          >
            <Check size={13} />
            <span>{actionLabel}</span>
          </Button>
        )}
      </div>
    </div>
  );
}
