import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import BrandWordmark from './ui/BrandWordmark';

// Auto-format vehicle license plate to standard Indian format: MH-00-EG-0000
const formatLicensePlate = (input) => {
  if (!input) return '';
  const raw = input.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 10);
  const parts = [];
  if (raw.length > 0) parts.push(raw.slice(0, 2));
  if (raw.length > 2) parts.push(raw.slice(2, 4));
  if (raw.length > 4) {
    if (raw.length <= 6) {
      parts.push(raw.slice(4));
    } else {
      parts.push(raw.slice(4, 6));
      parts.push(raw.slice(6, 10));
    }
  }
  return parts.join('-');
};

export default function AuthView({ initialRole = 'driver', initialMode = 'login', onAuthSuccess, onBackToLanding }) {
  const [mode, setMode] = useState(initialMode); // 'login' | 'register'
  const [role, setRole] = useState(initialRole); // 'driver' | 'provider'

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    setRole(initialRole);
  }, [initialRole]);

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');

  // Driver vehicle details
  const [vehicleMake, setVehicleMake] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [licensePlate, setLicensePlate] = useState('');

  // Provider service profile
  const [serviceType, setServiceType] = useState('TOWING');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Easy input validations
    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setError('Please enter a valid email address with @ and domain (e.g. user@gmail.com)');
      return;
    }

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (mode === 'register') {
      if (!name.trim()) {
        setError('Please enter your full name');
        return;
      }

      if (!phone || phone.length !== 10) {
        setError('Phone number must be exactly 10 digits (numbers only)');
        return;
      }
    }

    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await api.login({
          email: cleanEmail,
          password,
          role
        });
        if (res.token && res.user) {
          localStorage.setItem('resq_token', res.token);
          onAuthSuccess(res.user, res.token);
        } else {
          setError(res.message || 'Unable to sign in. Please verify your email and password.');
        }
      } else {
        const payload = {
          name: name.trim(),
          email: cleanEmail,
          password,
          phone: phone.trim(),
          role
        };

        if (role === 'driver') {
          payload.vehicle = {
            make: vehicleMake.trim(),
            model: vehicleModel.trim(),
            licensePlate: licensePlate.trim()
          };
        } else {
          payload.serviceType = serviceType;
        }

        const res = await api.register(payload);
        if (res.token && res.user) {
          localStorage.setItem('resq_token', res.token);
          onAuthSuccess(res.user, res.token);
        } else {
          setError(res.message || 'Registration failed. Please check the details and try again.');
        }
      }
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fillQuickDemo = (demoEmail, demoRole) => {
    setRole(demoRole);
    setMode('login');
    setEmail(demoEmail);
    setPassword('password123');
    setError('');
  };

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 56px)',
        backgroundColor: 'var(--bg-page)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px'
      }}
    >
      <div style={{ width: '100%', maxWidth: '420px' }}>
        {/* Back Link */}
        <button
          onClick={onBackToLanding}
          className="btn btn-ghost btn-sm"
          style={{ marginBottom: '24px', paddingLeft: 0, color: 'var(--text-secondary)' }}
        >
          <ArrowLeft size={14} />
          <span>Back to home</span>
        </button>

        {/* Auth Card */}
        <div
          className="card"
          style={{
            padding: '36px 32px',
            backgroundColor: '#FFFFFF',
            boxShadow: 'var(--shadow-md)'
          }}
        >
          {/* Brand Typography & Headline */}
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px'
              }}
            >
              <BrandWordmark height={28} />
            </div>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
              {mode === 'login' ? 'Welcome back' : 'Create your account'}
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              Roadside help when you need it.
            </p>
          </div>

          {/* Role Selection (Human language per Section 15) */}
          <div style={{ marginBottom: '22px' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                backgroundColor: 'var(--surface-secondary)',
                padding: '4px',
                borderRadius: 'var(--radius-sm)'
              }}
            >
              <button
                type="button"
                onClick={() => setRole('driver')}
                style={{
                  padding: '8px 10px',
                  borderRadius: '6px',
                  fontSize: '12.5px',
                  fontWeight: role === 'driver' ? 600 : 400,
                  backgroundColor: role === 'driver' ? '#FFFFFF' : 'transparent',
                  color: role === 'driver' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  boxShadow: role === 'driver' ? 'var(--shadow-sm)' : 'none',
                  textAlign: 'center',
                  transition: 'all var(--transition-fast)'
                }}
              >
                I need help
              </button>
              <button
                type="button"
                onClick={() => setRole('provider')}
                style={{
                  padding: '8px 10px',
                  borderRadius: '6px',
                  fontSize: '12.5px',
                  fontWeight: role === 'provider' ? 600 : 400,
                  backgroundColor: role === 'provider' ? '#FFFFFF' : 'transparent',
                  color: role === 'provider' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  boxShadow: role === 'provider' ? 'var(--shadow-sm)' : 'none',
                  textAlign: 'center',
                  transition: 'all var(--transition-fast)'
                }}
              >
                I provide service
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div
              style={{
                padding: '10px 14px',
                backgroundColor: 'var(--error-subtle)',
                color: 'var(--error)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '18px'
              }}
            >
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {mode === 'register' && (
              <div className="form-group">
                <label className="form-label">Full name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder={role === 'driver' ? 'Rahul Sharma' : 'Apex Towing Services'}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Email address</label>
              <input
                type="email"
                className="form-input"
                placeholder={role === 'driver' ? 'rahul@driver.com' : 'apex@provider.com'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                Must be at least 6 characters
              </span>
            </div>

            {mode === 'register' && (
              <>
                <div className="form-group">
                  <label className="form-label">Phone number</label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    className="form-input"
                    placeholder="10-digit mobile number (e.g. 9876543210)"
                    value={phone}
                    maxLength={10}
                    onChange={(e) => {
                      // Only numbers allowed, max 10 digits
                      const numbersOnly = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setPhone(numbersOnly);
                    }}
                    required
                  />
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Numbers only (no alphabets)</span>
                    <span style={{ fontWeight: phone.length === 10 ? 600 : 400, color: phone.length === 10 ? 'var(--success)' : 'var(--text-muted)' }}>
                      {phone.length}/10 digits
                    </span>
                  </div>
                </div>

                {role === 'driver' ? (
                  <div style={{ marginTop: '14px', marginBottom: '14px', borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '10px' }}>
                      Your vehicle
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Make (e.g. Hyundai)"
                        value={vehicleMake}
                        onChange={(e) => setVehicleMake(e.target.value)}
                        required
                      />
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Model (e.g. Creta)"
                        value={vehicleModel}
                        onChange={(e) => setVehicleModel(e.target.value)}
                        required
                      />
                    </div>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="License Plate (e.g. MH-12-AB-1234)"
                      value={licensePlate}
                      onChange={(e) => setLicensePlate(formatLicensePlate(e.target.value))}
                      maxLength={13}
                      style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}
                      required
                    />
                  </div>
                ) : (
                  <div className="form-group">
                    <label className="form-label">Primary service offered</label>
                    <select
                      className="form-input"
                      value={serviceType}
                      onChange={(e) => setServiceType(e.target.value)}
                    >
                      <option value="TOWING">Flatbed Towing</option>
                      <option value="BATTERY">Battery Jumpstart</option>
                      <option value="TIRE">Tire Replacement</option>
                      <option value="LOCKOUT">Lockout Assistance</option>
                      <option value="FUEL">Emergency Fuel Delivery</option>
                      <option value="MECHANICAL">Mechanical Repair</option>
                    </select>
                  </div>
                )}
              </>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '12px' }}
              disabled={loading}
            >
              {loading
                ? 'Please wait...'
                : mode === 'login'
                ? 'Sign in'
                : 'Create account'}
            </button>
          </form>

          {/* Toggle Login / Register */}
          <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '13px', color: 'var(--text-secondary)' }}>
            {mode === 'login' ? (
              <div>
                Don’t have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('register'); setError(''); }}
                  style={{ fontWeight: 600, color: 'var(--text-primary)', textDecoration: 'underline' }}
                >
                  Create account
                </button>
              </div>
            ) : (
              <div>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(''); }}
                  style={{ fontWeight: 600, color: 'var(--text-primary)', textDecoration: 'underline' }}
                >
                  Sign in
                </button>
              </div>
            )}
          </div>

          {/* Quick Demo Credentials */}
          <div
            style={{
              marginTop: '28px',
              paddingTop: '18px',
              borderTop: '1px solid var(--border)',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginBottom: '8px' }}>
              Quick demo accounts:
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => fillQuickDemo('rahul@driver.com', 'driver')}
              >
                Rahul (Driver)
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => fillQuickDemo('apex@provider.com', 'provider')}
              >
                Apex (Provider)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
