import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import LandingView from './components/LandingView';
import AuthView from './components/AuthView';
import DriverPortal from './components/DriverPortal';
import ProviderPortal from './components/ProviderPortal';
import { api } from './api';
import BrandWordmark from './components/ui/BrandWordmark';

export default function App() {
  const [user, setUser] = useState(null);
  const [activeView, setActiveView] = useState('landing'); // 'landing' | 'auth' | 'portal'
  const [authRole, setAuthRole] = useState('driver');
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [driverTab, setDriverTab] = useState('home'); // 'home' | 'my-requests' | 'profile'
  const [providerTab, setProviderTab] = useState('home'); // 'home' | 'requests' | 'my-jobs' | 'profile'
  const [initializing, setInitializing] = useState(() => Boolean(localStorage.getItem('resq_token')));

  useEffect(() => {
    const token = localStorage.getItem('resq_token');
    if (!token) return;

    api
      .getMe()
      .then((data) => {
        if (data.user) {
          setUser(data.user);
          setActiveView('portal');
        }
      })
      .catch(() => {
        localStorage.removeItem('resq_token');
        setActiveView('landing');
      })
      .finally(() => {
        setInitializing(false);
      });
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('resq_token');
    setUser(null);
    setActiveView('landing');
  };

  const handleNavigate = (view, role = 'driver', mode = 'login') => {
    if (view === 'auth') {
      setAuthRole(role);
      setAuthMode(mode);
    }
    setActiveView(view);
  };

  const [portalInitialRequesting, setPortalInitialRequesting] = useState(false);

  const handleAuthSuccess = (userData, token) => {
    if (token) {
      localStorage.setItem('resq_token', token);
    }
    setUser(userData);
    setActiveView('portal');
  };

  const handleGetHelp = () => {
    // If driver is already authenticated, immediately launch request flow
    if (user?.role === 'driver') {
      setPortalInitialRequesting(true);
      setActiveView('portal');
      return;
    }

    // Direct motorists to Driver Registration/intake to get help — NO BYPASS!
    handleNavigate('auth', 'driver', 'register');
  };

  if (initializing) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--bg-page)',
          color: 'var(--text-secondary)'
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
            <BrandWordmark height={30} />
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Loading your session...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-page)' }}>
      <Navbar
        user={user}
        activeView={activeView}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        onGetHelp={handleGetHelp}
        driverTab={driverTab}
        onSelectDriverTab={setDriverTab}
      />

      <main style={{ flex: 1 }}>
        {!user ? (
          activeView === 'auth' ? (
            <AuthView
              initialRole={authRole}
              initialMode={authMode}
              onAuthSuccess={handleAuthSuccess}
              onBackToLanding={() => setActiveView('landing')}
            />
          ) : (
            <LandingView onNavigate={handleNavigate} onGetHelp={handleGetHelp} />
          )
        ) : user.role === 'driver' ? (
          <DriverPortal
            user={user}
            initialRequesting={portalInitialRequesting}
            onResetInitialRequesting={() => setPortalInitialRequesting(false)}
            activeTab={driverTab}
            onSelectTab={setDriverTab}
            onLogout={handleLogout}
          />
        ) : (
          <ProviderPortal
            user={user}
            activeTab={providerTab}
            onSelectTab={setProviderTab}
            onLogout={handleLogout}
          />
        )}
      </main>

      <footer
        style={{
          borderTop: '1px solid var(--border)',
          backgroundColor: '#FFFFFF',
          padding: '24px 0',
          fontSize: '13px',
          color: 'var(--text-muted)'
        }}
      >
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BrandWordmark height={17} />
            <span style={{ color: 'var(--border-strong)' }}>•</span>
            <span>Roadside assistance when you need it</span>
          </div>
          <div>
            © 2026 ResQDrive. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
