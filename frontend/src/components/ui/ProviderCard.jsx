import React from 'react';
import { Phone, MessageSquare } from 'lucide-react';
import Button from './Button';
import Badge from './Badge';

export default function ProviderCard({
  provider,
  onMessage,
  className = '',
  style = {}
}) {
  if (!provider) {
    return (
      <div
        className={`resq-card ${className}`.trim()}
        style={{ padding: '20px', textAlign: 'center', ...style }}
      >
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          Searching for nearby roadside provider...
        </div>
      </div>
    );
  }

  const phoneLink = provider.phone ? `tel:${provider.phone}` : null;
  const initials = provider.name
    ? provider.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'SP';

  return (
    <div
      className={`resq-card ${className}`.trim()}
      style={{ padding: '20px', ...style }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>
          Assigned Provider
        </div>
        <Badge variant="blue" dot={true}>
          Verified
        </Badge>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <div
          style={{
            width: '36px',
            height: '36px',
            backgroundColor: 'var(--text-primary)',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            fontSize: '13px',
            fontWeight: 600,
            flexShrink: 0
          }}
        >
          {initials}
        </div>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
            {provider.name}
          </div>
          <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
            {provider.serviceType?.replace(/_/g, ' ') || 'Roadside Assistance'}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        {phoneLink ? (
          <a
            href={phoneLink}
            className="btn btn-secondary btn-sm"
            style={{ justifyContent: 'center' }}
          >
            <Phone size={13} style={{ color: 'var(--success)' }} />
            <span>Call Unit</span>
          </a>
        ) : (
          <Button variant="secondary" size="sm" disabled>
            <Phone size={13} />
            <span>Call Unit</span>
          </Button>
        )}

        {onMessage && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onMessage}
            style={{ justifyContent: 'center' }}
          >
            <MessageSquare size={13} style={{ color: 'var(--blue)' }} />
            <span>Message</span>
          </Button>
        )}
      </div>
    </div>
  );
}
