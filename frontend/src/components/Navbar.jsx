import React from 'react';
import { LogOut } from 'lucide-react';
import BrandWordmark from './ui/BrandWordmark';

export default function Navbar({
  user,
  onLogout,
  onNavigate,
  onGetHelp,
  activeView,
  driverTab = 'home',
  onSelectDriverTab
}) {
  const scrollToSection = (id) => {
    if (activeView !== 'landing') {
      onNavigate('landing');
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) {
          const navOffset = 64;
          const elementPosition = el.getBoundingClientRect().top + window.pageYOffset;
          window.scrollTo({ top: elementPosition - navOffset, behavior: 'smooth' });
        }
      }, 150);
    } else {
      const el = document.getElementById(id);
      if (el) {
        const navOffset = 64;
        const elementPosition = el.getBoundingClientRect().top + window.pageYOffset;
        window.scrollTo({ top: elementPosition - navOffset, behavior: 'smooth' });
      }
    }
  };

  return (
    <header
      style={{
        height: '56px',
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid var(--border)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}
    >
      <div
        style={{
          height: '100%',
          width: '100%',
          padding: user?.role === 'provider' ? '0 20px' : '0 24px',
          maxWidth: user?.role === 'provider' ? '100%' : '1120px',
          margin: user?.role === 'provider' ? '0' : '0 auto',
          display: 'grid',
          gridTemplateColumns: !user ? '1fr auto 1fr' : 'auto 1fr auto',
          alignItems: 'center',
          boxSizing: 'border-box'
        }}
      >
        {/* Left: Brand / Logo + Driver Simple Nav */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: user?.role === 'driver' ? '32px' : '10px',
            justifySelf: 'start'
          }}
        >
          {/* Brand Typography Wordmark */}
          <div
            onClick={() => {
              onNavigate(user ? 'portal' : 'landing');
              if (user?.role === 'driver' && onSelectDriverTab) onSelectDriverTab('home');
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer'
            }}
          >
            <BrandWordmark height={23} />
            {user?.role === 'provider' && (
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--brand-amber)',
                  backgroundColor: 'rgba(245, 166, 35, 0.12)',
                  border: '1px solid rgba(245, 166, 35, 0.25)',
                  padding: '2px 7px',
                  borderRadius: '5px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}
              >
                Provider
              </span>
            )}
          </div>

          {/* Simple Driver Navigation: Home, My requests, Profile */}
          {user?.role === 'driver' && (
            <nav style={{ display: 'flex', alignItems: 'center', gap: '22px' }}>
              <button
                type="button"
                onClick={() => {
                  onNavigate('portal');
                  if (onSelectDriverTab) onSelectDriverTab('home');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  font: 'inherit',
                  fontSize: '14px',
                  fontWeight: driverTab === 'home' || !driverTab ? 600 : 400,
                  color: driverTab === 'home' || !driverTab ? 'var(--text-primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'color var(--transition-fast)'
                }}
              >
                Home
              </button>
              <button
                type="button"
                onClick={() => {
                  onNavigate('portal');
                  if (onSelectDriverTab) onSelectDriverTab('my-requests');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  font: 'inherit',
                  fontSize: '14px',
                  fontWeight: driverTab === 'my-requests' ? 600 : 400,
                  color: driverTab === 'my-requests' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'color var(--transition-fast)'
                }}
              >
                My requests
              </button>
              <button
                type="button"
                onClick={() => {
                  onNavigate('portal');
                  if (onSelectDriverTab) onSelectDriverTab('profile');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  font: 'inherit',
                  fontSize: '14px',
                  fontWeight: driverTab === 'profile' ? 600 : 400,
                  color: driverTab === 'profile' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'color var(--transition-fast)'
                }}
              >
                Profile
              </button>
            </nav>
          )}
        </div>

        {/* Center: When not logged in, show centered landing navigation links */}
        {!user ? (
          <nav
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              justifySelf: 'center',
              gap: '32px',
              fontSize: '14px',
              color: 'var(--text-secondary)'
            }}
          >
            <button
              type="button"
              onClick={() => scrollToSection('how-it-works')}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                font: 'inherit',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                color: 'var(--text-secondary)',
                transition: 'color var(--transition-fast)'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
            >
              How it works
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('services')}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                font: 'inherit',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                color: 'var(--text-secondary)',
                transition: 'color var(--transition-fast)'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
            >
              Services
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('for-providers')}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                font: 'inherit',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                color: 'var(--text-secondary)',
                transition: 'color var(--transition-fast)'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
            >
              For providers
            </button>
          </nav>
        ) : (
          <div />
        )}

        {/* Right Corner: Landing CTAs OR Logged-in Driver/Provider Profile & Sign Out */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifySelf: 'end' }}>
          {!user ? (
            <>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => onNavigate('auth', 'driver', 'login')}
              >
                Sign in
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={onGetHelp}
              >
                Get help
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: user.role === 'provider' ? '#171717' : 'var(--surface-secondary)',
                    color: user.role === 'provider' ? '#FFFFFF' : 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 600
                  }}
                >
                  {user.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <span style={{ fontSize: '13.5px', fontWeight: 500, color: 'var(--text-primary)' }}>
                  {user.name}
                </span>
              </div>

              <button
                className="btn btn-ghost btn-sm"
                onClick={onLogout}
                title="Sign out"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: 'var(--text-secondary)',
                  fontSize: '13px'
                }}
              >
                <LogOut size={14} />
                <span>Sign out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
