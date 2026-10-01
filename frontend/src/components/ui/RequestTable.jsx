import React, { useState } from 'react';
import Badge from './Badge';
import EmptyState from './EmptyState';
import { FileText } from 'lucide-react';

export default function RequestTable({
  requests = [],
  onSelectRequest,
  className = '',
  style = {}
}) {
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'

  const activeCount = requests.filter(
    (r) => r.status === 'PENDING' || r.status === 'ASSIGNED' || r.status === 'IN_PROGRESS'
  ).length;

  const completedCount = requests.filter((r) => r.status === 'COMPLETED').length;
  const cancelledCount = requests.filter((r) => r.status === 'CANCELLED').length;

  const filteredRequests = requests.filter((req) => {
    if (filter === 'ACTIVE') {
      return req.status === 'PENDING' || req.status === 'ASSIGNED' || req.status === 'IN_PROGRESS';
    }
    if (filter === 'COMPLETED') return req.status === 'COMPLETED';
    if (filter === 'CANCELLED') return req.status === 'CANCELLED';
    return true; // 'ALL'
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <Badge variant="green" dot={true}>
            COMPLETED
          </Badge>
        );
      case 'CANCELLED':
        return (
          <Badge variant="red" dot={true}>
            CANCELLED
          </Badge>
        );
      case 'IN_PROGRESS':
        return (
          <Badge variant="blue" dot={true}>
            EN ROUTE
          </Badge>
        );
      case 'ASSIGNED':
        return (
          <Badge variant="blue" dot={true}>
            ASSIGNED
          </Badge>
        );
      default:
        return (
          <Badge variant="amber" dot={true}>
            PENDING
          </Badge>
        );
    }
  };

  return (
    <div className={`request-history-block ${className}`.trim()} style={style}>
      {/* Header & Filter Controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Assistance Call History
          </h2>
          <span className="mono-token" style={{ color: 'var(--text-muted)' }}>
            ({requests.length})
          </span>
        </div>

        {/* Filter Pills */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            padding: '2px',
            gap: '2px'
          }}
        >
          <button
            onClick={() => setFilter('ALL')}
            className={`btn btn-sm ${filter === 'ALL' ? 'btn-secondary' : 'btn-ghost'}`}
            style={{
              height: '26px',
              padding: '0 10px',
              fontSize: '11.5px',
              backgroundColor: filter === 'ALL' ? 'var(--surface-elevated)' : 'transparent',
              color: filter === 'ALL' ? 'var(--text-primary)' : 'var(--text-secondary)'
            }}
          >
            All ({requests.length})
          </button>
          <button
            onClick={() => setFilter('ACTIVE')}
            className={`btn btn-sm ${filter === 'ACTIVE' ? 'btn-secondary' : 'btn-ghost'}`}
            style={{
              height: '26px',
              padding: '0 10px',
              fontSize: '11.5px',
              backgroundColor: filter === 'ACTIVE' ? 'var(--surface-elevated)' : 'transparent',
              color: filter === 'ACTIVE' ? 'var(--text-primary)' : 'var(--text-secondary)'
            }}
          >
            Active ({activeCount})
          </button>
          <button
            onClick={() => setFilter('COMPLETED')}
            className={`btn btn-sm ${filter === 'COMPLETED' ? 'btn-secondary' : 'btn-ghost'}`}
            style={{
              height: '26px',
              padding: '0 10px',
              fontSize: '11.5px',
              backgroundColor: filter === 'COMPLETED' ? 'var(--surface-elevated)' : 'transparent',
              color: filter === 'COMPLETED' ? 'var(--text-primary)' : 'var(--text-secondary)'
            }}
          >
            Completed ({completedCount})
          </button>
          <button
            onClick={() => setFilter('CANCELLED')}
            className={`btn btn-sm ${filter === 'CANCELLED' ? 'btn-secondary' : 'btn-ghost'}`}
            style={{
              height: '26px',
              padding: '0 10px',
              fontSize: '11.5px',
              backgroundColor: filter === 'CANCELLED' ? 'var(--surface-elevated)' : 'transparent',
              color: filter === 'CANCELLED' ? 'var(--text-primary)' : 'var(--text-secondary)'
            }}
          >
            Cancelled ({cancelledCount})
          </button>
        </div>
      </div>

      {filteredRequests.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No calls found for this filter"
          description={
            requests.length === 0
              ? 'No roadside assistance calls logged on this account yet.'
              : `There are currently no calls with status matching "${filter.toLowerCase()}".`
          }
        />
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="table-container desktop-table-only" style={{ display: 'block' }}>
            <table className="resq-table">
              <thead>
                <tr>
                  <th>Call ID</th>
                  <th>Date & Time</th>
                  <th>Issue</th>
                  <th>Location</th>
                  <th>Provider Unit</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((req) => (
                  <tr
                    key={req._id}
                    onClick={() => onSelectRequest && onSelectRequest(req)}
                    style={{ cursor: onSelectRequest ? 'pointer' : 'default' }}
                  >
                    <td className="mono-token" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      #{req._id ? req._id.slice(-6).toUpperCase() : 'CALL'}
                    </td>
                    <td className="mono-token">
                      {new Date(req.createdAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      {req.issueType ? req.issueType.replace(/_/g, ' ') : 'Roadside Call'}
                    </td>
                    <td>{req.location?.address || 'Highway location'}</td>
                    <td>
                      {req.provider ? (
                        <span style={{ color: 'var(--blue)', fontWeight: 500 }}>
                          {req.provider.name}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>
                      )}
                    </td>
                    <td>{getStatusBadge(req.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Stacked Cards (Visible on smaller screens via CSS) */}
          <div className="mobile-cards-only" style={{ display: 'none', flexDirection: 'column', gap: '10px' }}>
            {filteredRequests.map((req) => (
              <div
                key={req._id}
                className="resq-card"
                style={{ padding: '14px', cursor: onSelectRequest ? 'pointer' : 'default' }}
                onClick={() => onSelectRequest && onSelectRequest(req)}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span className="mono-token" style={{ fontWeight: 700, color: 'var(--accent)' }}>
                    #{req._id.slice(-6).toUpperCase()}
                  </span>
                  {getStatusBadge(req.status)}
                </div>

                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  {req.issueType?.replace(/_/g, ' ')}
                </div>

                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  {req.location?.address}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>
                  <span>{new Date(req.createdAt).toLocaleDateString()}</span>
                  <span>{req.provider?.name || 'Unassigned'}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Style for responsive table/cards toggle */}
      <style>{`
        @media (max-width: 768px) {
          .desktop-table-only {
            display: none !important;
          }
          .mobile-cards-only {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  );
}
