import React from 'react';
import {
  Phone,
  MessageSquare,
  ArrowRight
} from 'lucide-react';
import MapView from './MapView';
import {
  IntakeStepIcon,
  DispatchStepIcon,
  TrackingStepIcon,
  ResolutionStepIcon
} from './ui/WorkflowIcons';

const WORKFLOW_STEPS = [
  {
    step: '01',
    title: 'Tell us what happened',
    description: 'Select your vehicle issue and verify your GPS breakdown location in under 30 seconds.',
    tag: 'Instant intake',
    accent: '#171717'
  },
  {
    step: '02',
    title: 'Nearby provider dispatch',
    description: 'Our system automatically connects you with the closest verified roadside recovery specialist.',
    tag: 'Auto-matching',
    accent: '#171717'
  },
  {
    step: '03',
    title: 'Live arrival tracking',
    description: 'Watch your provider approach in real time on the interactive map with continuous route and ETA updates.',
    tag: 'Live GPS route',
    accent: '#F5A623'
  },
  {
    step: '04',
    title: 'Back on the road',
    description: 'Your certified technician arrives equipped to repair, jump, unlock, or safely tow your vehicle.',
    tag: 'On-scene resolution',
    accent: '#1F9D68'
  }
];

const SERVICES = [
  {
    category: 'Emergency Transport',
    title: 'Flatbed & Towing',
    description: 'Safe transport to your preferred authorized workshop or home when your vehicle cannot be driven.',
    specs: 'Flatbed & Wheel-lift • All vehicle types'
  },
  {
    category: 'Electrical & Power',
    title: 'Battery Jump-Start',
    description: 'On-scene voltage testing, alternator check, and high-amperage jump-start assistance.',
    specs: '12V / 24V Systems • Instant on-scene start'
  },
  {
    category: 'Wheel & Tire',
    title: 'Flat Tire Replacement',
    description: 'Rapid wheel swap with your mounted spare or mobile puncture repair for passenger vehicles.',
    specs: 'Spare installation • Mobile inflation'
  },
  {
    category: 'Certified Entry',
    title: 'Lockout Assistance',
    description: 'Specialized, non-destructive vehicle entry techniques to safely recover locked keys without damage.',
    specs: 'Zero damage guarantee • Fast entry'
  },
  {
    category: 'Fuel Logistics',
    title: 'Emergency Fuel Delivery',
    description: 'Direct delivery of petrol or diesel to stalled vehicles to reach the nearest fueling station.',
    specs: 'Petrol & Diesel • Delivered to location'
  },
  {
    category: 'Mobile Diagnostics',
    title: 'Roadside Mechanical Triage',
    description: 'On-site diagnosis and repair for overheating, auxiliary belts, starter faults, and loose connections.',
    specs: 'Certified technicians • Diagnostic triage'
  }
];

export default function LandingView({ onNavigate, onGetHelp }) {
  // Active demo incident centered at ITM Skills University, Sector 4, Kharghar, Navi Mumbai
  const demoIncident = {
    location: {
      address: 'ITM Skills University, Sector 4, Kharghar, Navi Mumbai',
      lat: 19.0337,
      lng: 73.0645
    },
    vehicleDetails: {
      make: 'Hyundai',
      model: 'Creta',
      licensePlate: 'MH-46-AB-1234'
    },
    issueType: 'FLAT_TIRE',
    status: 'IN_PROGRESS'
  };

  return (
    <div style={{ backgroundColor: 'var(--bg-page)', minHeight: 'calc(100vh - 56px)' }}>
      {/* =========================================================================
          HERO SECTION (BALANCED TWO-COLUMN COMPOSITION - FULL FIRST FOLD)
          ========================================================================= */}
      <section
        style={{
          padding: '64px 0 60px 0',
          boxSizing: 'border-box',
          position: 'relative'
        }}
      >
        <div className="container">
          <div className="hero-two-column">
            {/* Left Column (~45%) */}
            <div>
              <h1
                className="font-hero"
                style={{
                  fontSize: 'clamp(32px, 3.8vw, 50px)',
                  lineHeight: 1.12,
                  letterSpacing: '-0.035em',
                  marginBottom: '18px',
                  maxWidth: '500px'
                }}
              >
                Roadside help,
                <br />
                without the waiting.
              </h1>

              <p
                style={{
                  fontSize: '16.5px',
                  lineHeight: 1.55,
                  color: 'var(--text-secondary)',
                  marginBottom: '28px',
                  maxWidth: '460px'
                }}
              >
                Tell us what happened. We’ll connect you with nearby help and keep you updated until you’re back on the road.
              </p>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  flexWrap: 'wrap',
                  marginBottom: '22px'
                }}
              >
                <button
                  type="button"
                  className="btn btn-primary btn-lg"
                  onClick={onGetHelp}
                >
                  <span>Get roadside help</span>
                </button>

                <button
                  type="button"
                  className="btn btn-secondary btn-lg"
                  onClick={() => {
                    const el = document.getElementById('how-it-works');
                    if (el) {
                      const navOffset = 64;
                      const elementPosition = el.getBoundingClientRect().top + window.pageYOffset;
                      window.scrollTo({ top: elementPosition - navOffset, behavior: 'smooth' });
                    }
                  }}
                >
                  <span>Learn how it works →</span>
                </button>
              </div>

              {/* Small Trust Line */}
              <div
                style={{
                  fontSize: '13px',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  flexWrap: 'wrap'
                }}
              >
                <span>Nearby providers</span>
                <span>•</span>
                <span>Live location</span>
                <span>•</span>
                <span>Clear arrival times</span>
              </div>
            </div>

            {/* Right Column (~55%): Real Product Preview with Balanced Proportion */}
            <div>
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border)',
                  boxShadow: 'var(--shadow-lg)',
                  overflow: 'hidden'
                }}
              >
                {/* Header Row */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 18px',
                    borderBottom: '1px solid var(--border)',
                    backgroundColor: '#FFFFFF'
                  }}
                >
                  <div>
                    <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      Help is on the way
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--brand-amber)'
                      }}
                    />
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      4 min away
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>•</span>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      1.2 km
                    </span>
                  </div>
                </div>

                {/* Map in the Middle: Edge-to-Edge Flush with optimal 270px height */}
                <MapView
                  incident={demoIncident}
                  eta="4 min away"
                  distance="1.2 km"
                  height="270px"
                  interactive={true}
                  status="IN_PROGRESS"
                  borderless={true}
                  showFloatingEta={false}
                />

                {/* Footer Row */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 18px',
                    borderTop: '1px solid var(--border)',
                    backgroundColor: '#FFFFFF',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: '#171717',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#FFFFFF',
                        fontSize: '12px',
                        fontWeight: 600,
                        letterSpacing: '-0.02em',
                        flexShrink: 0
                      }}
                    >
                      AT
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        Apex Towing & Recovery
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                        Flatbed recovery • ITM Kharghar
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={onGetHelp}
                      style={{ height: '28px', padding: '0 10px', fontSize: '12px' }}
                    >
                      <Phone size={12} />
                      <span>Call</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={onGetHelp}
                      style={{ height: '28px', padding: '0 10px', fontSize: '12px' }}
                    >
                      <MessageSquare size={12} />
                      <span>Message</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </section>

      {/* =========================================================================
          HOW IT WORKS (STRUCTURED 4-STEP SEQUENCE CARDS)
          ========================================================================= */}
      <section
        id="how-it-works"
        style={{
          padding: '88px 0',
          borderTop: '1px solid var(--border)',
          backgroundColor: '#FFFFFF'
        }}
      >
        <div className="container">
          <div style={{ maxWidth: '560px', marginBottom: '48px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--brand-amber)', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '8px' }}>
              How it works
            </div>
            <h2 className="font-section-title" style={{ fontSize: '28px', marginBottom: '10px' }}>
              From breakdown to back on the road.
            </h2>
            <p className="font-body" style={{ color: 'var(--text-secondary)' }}>
              Four seamless steps designed for speed, clarity, and peace of mind when you need help most.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '20px'
            }}
          >
            {WORKFLOW_STEPS.map((item) => (
              <div
                key={item.step}
                className="card"
                style={{
                  padding: '28px 24px',
                  backgroundColor: 'var(--bg-page)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '20px',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Top hairline progress accent */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '3px',
                    backgroundColor: item.accent
                  }}
                />

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {item.step === '01' && <IntakeStepIcon size={32} />}
                      {item.step === '02' && <DispatchStepIcon size={32} />}
                      {item.step === '03' && <TrackingStepIcon size={32} />}
                      {item.step === '04' && <ResolutionStepIcon size={32} />}
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          fontFamily: 'var(--font-mono)',
                          color: 'var(--text-muted)',
                          letterSpacing: '0.04em'
                        }}
                      >
                        STEP {item.step}
                      </span>
                    </div>

                    <span
                      style={{
                        fontSize: '11.5px',
                        color: 'var(--text-secondary)',
                        fontWeight: 500,
                        backgroundColor: '#FFFFFF',
                        border: '1px solid var(--border)',
                        padding: '2px 8px',
                        borderRadius: '6px'
                      }}
                    >
                      {item.tag}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '17px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px', letterSpacing: '-0.015em' }}>
                    {item.title}
                  </h3>

                  <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          ROADSIDE SERVICES (PREMIUM EDITORIAL CARDS - NO CHEAP ICONS)
          ========================================================================= */}
      <section
        id="services"
        style={{
          padding: '88px 0',
          borderTop: '1px solid var(--border)',
          backgroundColor: 'var(--bg-page)'
        }}
      >
        <div className="container">
          <div style={{ maxWidth: '560px', marginBottom: '44px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--brand-amber)', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '8px' }}>
              Roadside services
            </div>
            <h2 className="font-section-title" style={{ fontSize: '28px', marginBottom: '10px' }}>
              Comprehensive assistance for every breakdown.
            </h2>
            <p className="font-body" style={{ color: 'var(--text-secondary)' }}>
              Certified specialists dispatched with the exact equipment required for your vehicle.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '20px'
            }}
          >
            {SERVICES.map((srv) => (
              <div
                key={srv.title}
                className="card"
                style={{
                  padding: '28px 24px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '20px'
                }}
              >
                <div>
                  <div style={{ display: 'inline-block', marginBottom: '14px' }}>
                    <span
                      style={{
                        fontSize: '11.5px',
                        fontWeight: 600,
                        color: 'var(--text-secondary)',
                        backgroundColor: 'var(--surface-secondary)',
                        border: '1px solid var(--border)',
                        padding: '3px 9px',
                        borderRadius: '6px',
                        letterSpacing: '-0.01em'
                      }}
                    >
                      {srv.category}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '17px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px', letterSpacing: '-0.015em' }}>
                    {srv.title}
                  </h3>

                  <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    {srv.description}
                  </p>
                </div>

                <div
                  style={{
                    paddingTop: '16px',
                    borderTop: '1px solid var(--border)',
                    fontSize: '12.5px',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <span>{srv.specs}</span>
                  <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>→</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          FOR PROVIDERS SECTION
          ========================================================================= */}
      <section
        id="for-providers"
        style={{
          padding: '88px 0',
          borderTop: '1px solid var(--border)',
          backgroundColor: '#FFFFFF'
        }}
      >
        <div className="container">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
              gap: '48px',
              alignItems: 'center'
            }}
            className="hero-two-column"
          >
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--brand-amber)', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '8px' }}>
                For providers
              </div>
              <h2 className="font-section-title" style={{ fontSize: '28px', marginBottom: '12px' }}>
                Built for roadside professionals
              </h2>
              <p className="font-body" style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '24px' }}>
                Turn vehicle downtime into revenue. Connect with nearby motorists in your service territory with instant dispatch notifications, direct turn-by-turn routing, and transparent job details.
              </p>

              <button
                className="btn btn-secondary btn-lg"
                onClick={() => onNavigate('auth', 'provider')}
              >
                <span>Provider sign in</span>
                <ArrowRight size={14} />
              </button>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}
            >
              <div
                className="card"
                style={{
                  padding: '20px',
                  backgroundColor: 'var(--bg-page)',
                  border: '1px solid var(--border)'
                }}
              >
                <div style={{ fontSize: '14.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  Clear job requests
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Review vehicle make, model, reported issue, and exact GPS location before accepting.
                </div>
              </div>

              <div
                className="card"
                style={{
                  padding: '20px',
                  backgroundColor: 'var(--bg-page)',
                  border: '1px solid var(--border)'
                }}
              >
                <div style={{ fontSize: '14.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  Turn-by-turn routing
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Direct navigation to the stranded vehicle with real distance and ETA calculations.
                </div>
              </div>

              <div
                className="card"
                style={{
                  padding: '20px',
                  backgroundColor: 'var(--bg-page)',
                  border: '1px solid var(--border)'
                }}
              >
                <div style={{ fontSize: '14.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  Single-tap status updates
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Easily advance from "Start trip" to "Arrived" and "Complete" with one tap.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          FINAL CALL TO ACTION
          ========================================================================= */}
      <section
        style={{
          padding: '88px 0',
          borderTop: '1px solid var(--border)',
          backgroundColor: 'var(--bg-page)',
          textAlign: 'center'
        }}
      >
        <div className="container" style={{ maxWidth: '560px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '10px' }}>
            Ready when you need us.
          </h2>
          <p className="font-body" style={{ color: 'var(--text-secondary)', marginBottom: '28px' }}>
            No memberships or annual fees. Just fast, verified roadside assistance whenever you need it.
          </p>

          <button
            className="btn btn-primary btn-lg"
            onClick={onGetHelp || (() => onNavigate('auth', 'driver'))}
          >
            <span>Get roadside help now</span>
          </button>
        </div>
      </section>
    </div>
  );
}
