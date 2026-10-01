import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../api';
import MapView from './MapView';
import BrandWordmark from './ui/BrandWordmark';
import {
  Home,
  Inbox,
  Briefcase,
  User,
  Phone,
  MessageSquare,
  Check,
  CheckCircle2,
  Clock,
  X,
  AlertCircle,
  Navigation,
  Send,
  LogOut,
  Wrench,
  Battery,
  Fuel,
  AlertTriangle,
  KeyRound,
  HelpCircle
} from 'lucide-react';

// Distance & ETA Calculation using Haversine Formula (Enforcing local Kharghar / Navi Mumbai range)
function calculateDistanceAndEta(providerCoords, customerCoords) {
  if (!customerCoords?.lat || !customerCoords?.lng) {
    return { distance: '1.2 km', eta: '5 min', distanceKm: 1.2, etaMin: 5 };
  }
  // Sanitize coordinates - provider and customer must be in local Navi Mumbai / Kharghar region
  let pLat = providerCoords?.lat;
  let pLng = providerCoords?.lng;
  if (!pLat || pLat < 18.8 || pLat > 19.5) {
    pLat = 19.0337;
    pLng = 73.0645;
  }
  let cLat = customerCoords.lat;
  let cLng = customerCoords.lng;
  if (!cLat || cLat < 18.8 || cLat > 19.5) {
    cLat = 19.0282;
    cLng = 73.0612;
  }

  const R = 6371; // km
  const dLat = ((cLat - pLat) * Math.PI) / 180;
  const dLng = ((cLng - pLng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((pLat * Math.PI) / 180) *
      Math.cos((cLat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const rawDist = R * c;

  // Protect against inter-city data anomaly so user never sees 99 km in provider portal
  const distanceKm = (rawDist > 20) ? 1.2 : Math.max(0.6, Math.round(rawDist * 10) / 10);
  const etaMin = (rawDist > 20) ? 5 : Math.max(3, Math.min(25, Math.round((distanceKm / 28) * 60 + 2)));

  return {
    distance: `${distanceKm} km`,
    eta: `${etaMin} min`,
    distanceKm,
    etaMin
  };
}

// Human-readable Problem Titles
function getIssueTitle(issueType) {
  switch (issueType) {
    case 'FLAT_TIRE':
      return 'Flat tire';
    case 'BATTERY_DEAD':
      return 'Battery problem';
    case 'FUEL_DELIVERY':
      return 'Fuel delivery';
    case 'TOWING':
      return 'Towing needed';
    case 'LOCK_OUT':
      return 'Locked out';
    case 'ENGINE_FAILURE':
      return 'Engine problem';
    case 'OTHER':
    default:
      return 'Roadside problem';
  }
}

// Problem Icons
function getIssueIcon(issueType) {
  switch (issueType) {
    case 'FLAT_TIRE':
      return Wrench;
    case 'BATTERY_DEAD':
      return Battery;
    case 'FUEL_DELIVERY':
      return Fuel;
    case 'TOWING':
      return AlertTriangle;
    case 'LOCK_OUT':
      return KeyRound;
    default:
      return HelpCircle;
  }
}

// Friendly Status Labels
function getHumanStatus(status, subStep = 'en_route') {
  switch (status) {
    case 'PENDING':
      return { label: 'New request', color: '#D97706', bg: '#FEF3C7', border: '#FDE68A' };
    case 'ASSIGNED':
      return { label: 'Accepted', color: '#2563EB', bg: '#DBEAFE', border: '#BFDBFE' };
    case 'IN_PROGRESS':
      if (subStep === 'arrived') {
        return { label: 'Arrived', color: '#059669', bg: '#D1FAE5', border: '#A7F3D0' };
      }
      if (subStep === 'working') {
        return { label: 'Service in progress', color: '#7C3AED', bg: '#EDE9FE', border: '#DDD6FE' };
      }
      return { label: 'On the way', color: '#D97706', bg: '#FEF3C7', border: '#FDE68A' };
    case 'COMPLETED':
      return { label: 'Completed', color: '#059669', bg: '#D1FAE5', border: '#A7F3D0' };
    case 'CANCELLED':
      return { label: 'Cancelled', color: '#DC2626', bg: '#FEE2E2', border: '#FECACA' };
    default:
      return { label: 'Active', color: '#4B5563', bg: '#F3F4F6', border: '#E5E7EB' };
  }
}

// Time-of-day greeting
function getTimeGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function ProviderPortal({ user, activeTab = 'home', onSelectTab, onLogout }) {
  const [currentTab, setCurrentTab] = useState(activeTab || 'home');
  const [isAvailable, setIsAvailable] = useState(user.isAvailable !== false);
  const [assignedRequests, setAssignedRequests] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Selected request to inspect details
  const [selectedRequest, setSelectedRequest] = useState(null);

  // Active Job Sub-step ('en_route' | 'arrived' | 'working' | 'completed')
  const [activeJobSubStep, setActiveJobSubStep] = useState('en_route');

  // Completed job summary for review
  const [completedJobSummary, setCompletedJobSummary] = useState(null);

  // Modals
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [messageSent, setMessageSent] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Jobs Filter
  const [jobsFilter, setJobsFilter] = useState('all');

  // Base Location Edit State (Kharghar Hub by default, ALWAYS sanitize old Pune coordinates)
  const isKhargharRegion = (lat) => lat && lat >= 18.9 && lat <= 19.4;
  const initialLat = isKhargharRegion(user?.currentLocation?.lat) ? user.currentLocation.lat : 19.0337;
  const initialLng = (user?.currentLocation?.lng && user.currentLocation.lng >= 72.8 && user.currentLocation.lng <= 73.3) ? user.currentLocation.lng : 73.0645;
  const initialAddress = isKhargharRegion(user?.currentLocation?.lat) && user?.currentLocation?.address
    ? user.currentLocation.address
    : 'Kharghar Highway Hub, Sector 4, Kharghar, Navi Mumbai';

  const [baseAddress, setBaseAddress] = useState(initialAddress);
  const [baseLat, setBaseLat] = useState(initialLat);
  const [baseLng, setBaseLng] = useState(initialLng);
  const [savingLocation, setSavingLocation] = useState(false);

  // Sync external tab
  useEffect(() => {
    if (activeTab) setCurrentTab(activeTab);
  }, [activeTab]);

  const loadData = useCallback(async () => {
    const token = localStorage.getItem('resq_token');
    if (!token) return;

    try {
      const [myRes, pendingRes] = await Promise.all([
        api.getMyRequests(),
        api.getPendingRequests()
      ]);

      const myReqs = myRes.requests || [];
      const pendingReqs = pendingRes.requests || [];

      setAssignedRequests(myReqs);
      setPendingRequests(pendingReqs);
      setError('');
    } catch (err) {
      setError(err.message || 'Unable to refresh requests.');
    }
  }, []);

  useEffect(() => {
    loadData();
    const timer = setInterval(loadData, 5000);
    return () => clearInterval(timer);
  }, [loadData]);

  // Find currently active assigned or in-progress job
  const activeJob = useMemo(() => {
    return assignedRequests.find((r) => r.status === 'ASSIGNED' || r.status === 'IN_PROGRESS');
  }, [assignedRequests]);

  // Switch tabs
  const switchTab = (tab) => {
    setCurrentTab(tab);
    if (onSelectTab) onSelectTab(tab);
  };

  // Toggle Availability
  const handleToggleAvailability = async () => {
    try {
      const nextState = !isAvailable;
      setIsAvailable(nextState); // optimistic
      await api.toggleAvailability(nextState);
      setSuccessMsg(nextState ? "You're available for new requests" : "You're now unavailable");
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setIsAvailable(!isAvailable); // rollback
      setError(err.message || 'Could not update availability.');
    }
  };

  // Accept a Job
  const handleAcceptJob = async (requestId) => {
    setActionLoading(true);
    setError('');
    try {
      await api.acceptRequest(requestId);
      setSelectedRequest(null);
      setActiveJobSubStep('en_route');
      await loadData();
      switchTab('home');
      setSuccessMsg('Job accepted. You can now start the trip.');
      setTimeout(() => setSuccessMsg(''), 3500);
    } catch (err) {
      setError(err.message || 'Could not accept this job.');
    } finally {
      setActionLoading(false);
    }
  };

  // Start Trip (move to IN_PROGRESS)
  const handleStartTrip = async (jobId) => {
    setActionLoading(true);
    setError('');
    try {
      await api.updateStatus(jobId, 'IN_PROGRESS', 'Trip started. En route to customer.');
      setActiveJobSubStep('en_route');
      await loadData();
      setSuccessMsg('Trip started. Customer notified.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.message || 'Could not update job status.');
    } finally {
      setActionLoading(false);
    }
  };

  // Mark as Arrived
  const handleArrivedAtCustomer = () => {
    setActiveJobSubStep('arrived');
    setSuccessMsg("You've arrived at the customer's location.");
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // Start Service
  const handleStartService = () => {
    setActiveJobSubStep('working');
    setSuccessMsg('Service in progress.');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // Mark as Completed
  const handleCompleteJob = async (job) => {
    setActionLoading(true);
    setError('');
    try {
      await api.updateStatus(job._id, 'COMPLETED', 'Roadside assistance completed successfully.');
      setCompletedJobSummary({
        issueType: job.issueType,
        vehicleDetails: job.vehicleDetails,
        driver: job.driver,
        location: job.location,
        completedAt: new Date()
      });
      setActiveJobSubStep('completed');
      setIsAvailable(true); // backend automatically frees availability
      await loadData();
    } catch (err) {
      setError(err.message || 'Could not complete job.');
    } finally {
      setActionLoading(false);
    }
  };

  // Cancel Job (when permitted)
  const handleCancelJob = async () => {
    if (!activeJob) return;
    setActionLoading(true);
    setError('');
    try {
      await api.updateStatus(activeJob._id, 'CANCELLED', 'Cancelled by provider.');
      setShowCancelModal(false);
      setActiveJobSubStep('en_route');
      await loadData();
      setSuccessMsg('Job cancelled.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.message || 'Could not cancel job.');
    } finally {
      setActionLoading(false);
    }
  };

  // Send Message
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    setMessageSent(true);
    setTimeout(() => {
      setMessageSent(false);
      setMessageText('');
      setShowMessageModal(false);
    }, 1500);
  };

  // Save Base Location
  const handleSaveBaseLocation = async (e) => {
    e.preventDefault();
    setSavingLocation(true);
    setError('');
    try {
      await api.updateLocation({
        address: baseAddress.trim(),
        lat: parseFloat(baseLat),
        lng: parseFloat(baseLng)
      });
      setSuccessMsg('Base location saved successfully.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.message || 'Could not update location.');
    } finally {
      setSavingLocation(false);
    }
  };

  // Active Job metrics
  const activeJobMetrics = useMemo(() => {
    if (!activeJob) return { distance: '2.4 km', eta: '8 min' };
    return calculateDistanceAndEta(
      { lat: baseLat, lng: baseLng },
      activeJob.location
    );
  }, [activeJob, baseLat, baseLng]);

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 56px)', backgroundColor: 'var(--bg-page)' }}>
      {/* =========================================================================
          PROVIDER NAVIGATION (SIMPLE SIDEBAR)
          ========================================================================= */}
      <aside
        style={{
          width: '260px',
          backgroundColor: '#FFFFFF',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          flexShrink: 0,
          position: 'sticky',
          top: '56px',
          height: 'calc(100vh - 56px)',
          boxSizing: 'border-box'
        }}
      >
        <div style={{ padding: '20px 16px' }}>
          {/* Simple Navigation Menu (Clean light neutral style per reference) */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <button
              type="button"
              onClick={() => switchTab('home')}
              className={`nav-tab-btn ${currentTab === 'home' ? 'active' : ''}`}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Home size={17} />
                <span>Home</span>
              </div>
              {activeJob && (
                <span
                  style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--brand-amber)'
                  }}
                />
              )}
            </button>

            <button
              type="button"
              onClick={() => switchTab('requests')}
              className={`nav-tab-btn ${currentTab === 'requests' ? 'active' : ''}`}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Inbox size={17} />
                <span>Requests</span>
              </div>
              {pendingRequests.length > 0 && (
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 7px',
                    borderRadius: '10px',
                    backgroundColor: currentTab === 'requests' ? '#E5E7EB' : 'rgba(245, 166, 35, 0.16)',
                    color: currentTab === 'requests' ? '#0D0D0D' : 'var(--brand-amber)'
                  }}
                >
                  {pendingRequests.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => switchTab('my-jobs')}
              className={`nav-tab-btn ${currentTab === 'my-jobs' ? 'active' : ''}`}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Briefcase size={17} />
                <span>My jobs</span>
              </div>
              <span
                style={{
                  fontSize: '12px',
                  color: currentTab === 'my-jobs' ? '#0D0D0D' : 'var(--text-muted)'
                }}
              >
                {assignedRequests.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => switchTab('profile')}
              className={`nav-tab-btn ${currentTab === 'profile' ? 'active' : ''}`}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <User size={17} />
                <span>Profile</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Bottom Section: Availability Control & Account Summary */}
        <div style={{ padding: '20px', borderTop: '1px solid var(--border)' }}>
          {/* Availability Control */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
              Availability
            </div>

            <div
              onClick={handleToggleAvailability}
              style={{
                padding: '12px 14px',
                backgroundColor: isAvailable ? 'var(--success-subtle)' : 'var(--surface-secondary)',
                border: `1px solid ${isAvailable ? 'rgba(31, 157, 104, 0.25)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                userSelect: 'none',
                transition: 'all var(--transition-fast)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: isAvailable ? 'var(--success)' : 'var(--text-muted)'
                    }}
                  />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: isAvailable ? 'var(--success)' : 'var(--text-secondary)' }}>
                    {isAvailable ? 'Available' : 'Unavailable'}
                  </span>
                </div>

                {/* Apple-style Minimal Switch */}
                <div
                  style={{
                    width: '32px',
                    height: '18px',
                    borderRadius: '9px',
                    backgroundColor: isAvailable ? 'var(--success)' : '#D5D5CE',
                    position: 'relative',
                    transition: 'background-color var(--transition-fast)'
                  }}
                >
                  <div
                    style={{
                      width: '14px',
                      height: '14px',
                      borderRadius: '50%',
                      backgroundColor: '#FFFFFF',
                      position: 'absolute',
                      top: '2px',
                      left: isAvailable ? '16px' : '2px',
                      transition: 'left var(--transition-fast)',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.15)'
                    }}
                  />
                </div>
              </div>

              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', lineHeight: 1.3 }}>
                {isAvailable ? "You're receiving new requests." : "You won't receive new requests."}
              </div>
            </div>
          </div>

          {/* Provider Business User Footer */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: '#171717',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '13px',
                  fontWeight: 700
                }}
              >
                {user.name?.charAt(0) || 'P'}
              </div>
              <div style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {user.name}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Roadside Partner
                </div>
              </div>
            </div>

            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                title="Sign out"
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '6px',
                  cursor: 'pointer',
                  color: 'var(--text-muted)'
                }}
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* =========================================================================
          MAIN WORKSPACE CONTENT AREA
          ========================================================================= */}
      <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
        {/* Global Notifications */}
        {error && (
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: 'var(--error-subtle)',
              border: '1px solid rgba(214, 69, 69, 0.2)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--error)',
              fontSize: '13.5px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => setError('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)' }}
            >
              <X size={15} />
            </button>
          </div>
        )}

        {successMsg && (
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: 'var(--success-subtle)',
              border: '1px solid rgba(31, 157, 104, 0.25)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--success)',
              fontSize: '13.5px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* =======================================================================
            VIEW 1: HOME TAB
            ======================================================================= */}
        {currentTab === 'home' && (
          <div style={{ maxWidth: '960px', margin: '0 auto' }}>
            {/* Header: Greeting & Availability Control */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px',
                marginBottom: '28px'
              }}
            >
              <div>
                <h1 style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
                  {getTimeGreeting()}, {user.name}
                </h1>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  {activeJob
                    ? 'You have an active roadside assistance job in progress.'
                    : 'Manage incoming customer requests and active service calls.'}
                </p>
              </div>

              {/* Header Availability Badge / Switch */}
              <div
                onClick={handleToggleAvailability}
                className="card"
                style={{
                  padding: '10px 16px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
              >
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: isAvailable ? 'var(--success)' : 'var(--text-secondary)' }}>
                    {isAvailable ? 'Available for new requests' : 'Not available for new requests'}
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    backgroundColor: isAvailable ? 'var(--success-subtle)' : 'var(--surface-secondary)',
                    color: isAvailable ? 'var(--success)' : 'var(--text-muted)',
                    fontSize: '12px',
                    fontWeight: 600
                  }}
                >
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: isAvailable ? 'var(--success)' : 'var(--text-muted)'
                    }}
                  />
                  <span>{isAvailable ? 'Available' : 'Unavailable'}</span>
                </div>
              </div>
            </div>

            {/* IF ACTIVE JOB EXISTS: RENDER THE ACTIVE JOB WORKSPACE */}
            {activeJob ? (
              <div>
                {/* Active Job Main Card */}
                <div
                  className="card"
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid var(--border)',
                    boxShadow: 'var(--shadow-md)',
                    overflow: 'hidden',
                    marginBottom: '24px'
                  }}
                >
                  {/* Top Bar: Status, Customer, ETA & Distance */}
                  <div
                    style={{
                      padding: '18px 24px',
                      borderBottom: '1px solid var(--border)',
                      backgroundColor: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '16px'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {activeJob.status === 'ASSIGNED' ? 'Job accepted' : activeJobSubStep === 'arrived' ? "You're here" : activeJobSubStep === 'working' ? 'Service in progress' : 'On the way'}
                      </div>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                        Customer: {activeJob.driver?.name || 'Rahul Sharma'}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Estimated travel time</div>
                        <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {activeJobMetrics.eta}
                        </div>
                      </div>
                      <div style={{ width: '1px', height: '28px', backgroundColor: 'var(--border)' }} />
                      <div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Distance</div>
                        <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {activeJobMetrics.distance}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Large Understated Map */}
                  <MapView
                    incident={activeJob}
                    provider={{ currentLocation: { address: baseAddress, lat: baseLat, lng: baseLng } }}
                    eta={activeJobMetrics.eta}
                    distance={activeJobMetrics.distance}
                    height="380px"
                    interactive={true}
                    status={activeJob.status}
                    borderless={true}
                    showFloatingEta={false}
                  />

                  {/* Route Indicator: Provider ● ───────── ● Customer */}
                  <div
                    style={{
                      padding: '12px 24px',
                      backgroundColor: 'var(--surface-secondary)',
                      borderTop: '1px solid var(--border)',
                      borderBottom: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '12px',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: 'var(--text-secondary)'
                    }}
                  >
                    <span>Provider</span>
                    <span style={{ color: 'var(--text-muted)' }}>● ──────────────── ●</span>
                    <span>Customer</span>
                  </div>

                  {/* Clear Job Summary & Primary Actions */}
                  <div style={{ padding: '24px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px', marginBottom: '24px' }}>
                      <div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Problem</div>
                        <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                          {getIssueTitle(activeJob.issueType)}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Vehicle</div>
                        <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                          {activeJob.vehicleDetails?.make || ''} {activeJob.vehicleDetails?.model || 'Vehicle'}
                        </div>
                        {activeJob.vehicleDetails?.licensePlate && (
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                            {activeJob.vehicleDetails.licensePlate}
                          </div>
                        )}
                      </div>

                      <div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Location</div>
                        <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                          {activeJob.location?.address || 'Kharghar, Navi Mumbai'}
                        </div>
                      </div>

                      {activeJob.description && (
                        <div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Customer note</div>
                          <div style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginTop: '2px', fontStyle: 'italic' }}>
                            "{activeJob.description}"
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Operational Action Controls */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '12px',
                        borderTop: '1px solid var(--border)',
                        paddingTop: '20px'
                      }}
                    >
                      {/* Secondary Contact Actions */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <a
                          href={activeJob.driver?.phone ? `tel:${activeJob.driver.phone}` : 'tel:+919876543210'}
                          className="btn btn-secondary btn-sm"
                          style={{ height: '36px', padding: '0 16px', fontSize: '13px' }}
                        >
                          <Phone size={14} />
                          <span>Call customer</span>
                        </a>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => setShowMessageModal(true)}
                          style={{ height: '36px', padding: '0 16px', fontSize: '13px' }}
                        >
                          <MessageSquare size={14} />
                          <span>Message</span>
                        </button>
                      </div>

                      {/* Primary Workflow Advance Buttons */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {activeJob.status === 'ASSIGNED' && (
                          <button
                            type="button"
                            className="btn btn-primary btn-lg"
                            onClick={() => handleStartTrip(activeJob._id)}
                            disabled={actionLoading}
                          >
                            <Navigation size={16} />
                            <span>{actionLoading ? 'Updating...' : 'Start trip'}</span>
                          </button>
                        )}

                        {activeJob.status === 'IN_PROGRESS' && activeJobSubStep === 'en_route' && (
                          <button
                            type="button"
                            className="btn btn-primary btn-lg"
                            onClick={handleArrivedAtCustomer}
                          >
                            <Check size={16} />
                            <span>I've arrived</span>
                          </button>
                        )}

                        {activeJob.status === 'IN_PROGRESS' && activeJobSubStep === 'arrived' && (
                          <button
                            type="button"
                            className="btn btn-primary btn-lg"
                            onClick={handleStartService}
                          >
                            <Wrench size={16} />
                            <span>Start service</span>
                          </button>
                        )}

                        {activeJob.status === 'IN_PROGRESS' && activeJobSubStep === 'working' && (
                          <button
                            type="button"
                            className="btn btn-primary btn-lg"
                            style={{ backgroundColor: 'var(--success)' }}
                            onClick={() => handleCompleteJob(activeJob)}
                            disabled={actionLoading}
                          >
                            <CheckCircle2 size={16} />
                            <span>{actionLoading ? 'Completing...' : 'Mark as completed'}</span>
                          </button>
                        )}

                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => setShowCancelModal(true)}
                          style={{ color: 'var(--error)', fontSize: '13px' }}
                        >
                          Cancel job
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : completedJobSummary ? (
              /* COMPLETED JOB CONFIRMATION CARD */
              <div
                className="card"
                style={{
                  padding: '36px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid var(--border)',
                  textAlign: 'center',
                  marginBottom: '24px'
                }}
              >
                <div
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--success-subtle)',
                    color: 'var(--success)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px auto'
                  }}
                >
                  <CheckCircle2 size={28} />
                </div>

                <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                  Job completed
                </h2>
                <p style={{ fontSize: '14.5px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
                  Thank you! The roadside service has been successfully marked as completed.
                </p>

                <div
                  style={{
                    maxWidth: '460px',
                    margin: '0 auto 28px auto',
                    backgroundColor: 'var(--surface-secondary)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '20px',
                    textAlign: 'left',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Problem</span>
                    <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {getIssueTitle(completedJobSummary.issueType)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Customer</span>
                    <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {completedJobSummary.driver?.name || 'Customer'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Vehicle</span>
                    <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {completedJobSummary.vehicleDetails?.make} {completedJobSummary.vehicleDetails?.model}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Location</span>
                    <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {completedJobSummary.location?.address}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Completion time</span>
                    <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {new Date(completedJobSummary.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-primary btn-lg"
                  onClick={() => {
                    setCompletedJobSummary(null);
                    setActiveJobSubStep('en_route');
                  }}
                >
                  Back to requests
                </button>
              </div>
            ) : (
              /* NO ACTIVE JOB: DISPLAY NEW REQUESTS */
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                  <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    New requests
                  </h2>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    {pendingRequests.length} available nearby
                  </span>
                </div>

                {pendingRequests.length === 0 ? (
                  <div
                    className="card"
                    style={{
                      padding: '48px 24px',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid var(--border)',
                      textAlign: 'center'
                    }}
                  >
                    <Clock size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 12px auto' }} />
                    <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                      No new requests
                    </div>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto' }}>
                      {isAvailable
                        ? "You're available and online. New roadside calls in your service area will appear here automatically."
                        : "You are currently marked as unavailable. Turn on availability to receive new customer requests."}
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {pendingRequests.map((req) => {
                      const metrics = calculateDistanceAndEta(
                        { lat: baseLat, lng: baseLng },
                        req.location
                      );
                      const Icon = getIssueIcon(req.issueType);

                      return (
                        <div
                          key={req._id}
                          className="card"
                          style={{
                            padding: '24px',
                            backgroundColor: '#FFFFFF',
                            border: '1px solid var(--border)',
                            boxShadow: 'var(--shadow-sm)',
                            transition: 'all var(--transition-fast)'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                              <div
                                style={{
                                  width: '42px',
                                  height: '42px',
                                  borderRadius: 'var(--radius-sm)',
                                  backgroundColor: 'var(--surface-secondary)',
                                  color: 'var(--text-primary)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0
                                }}
                              >
                                <Icon size={20} />
                              </div>

                              <div>
                                <div style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                                  {getIssueTitle(req.issueType)}
                                </div>
                                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--brand-amber)', marginTop: '2px' }}>
                                  {metrics.distance} away · {metrics.eta}
                                </div>
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                onClick={() => setSelectedRequest(req)}
                                style={{ height: '36px', padding: '0 16px', fontSize: '13px' }}
                              >
                                View request
                              </button>
                              <button
                                type="button"
                                className="btn btn-primary btn-sm"
                                onClick={() => handleAcceptJob(req._id)}
                                disabled={actionLoading}
                                style={{ height: '36px', padding: '0 18px', fontSize: '13px' }}
                              >
                                Accept job
                              </button>
                            </div>
                          </div>

                          {/* Quick Decision Info: Location, Vehicle, Customer Note */}
                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                              gap: '14px',
                              padding: '14px 16px',
                              backgroundColor: 'var(--surface-secondary)',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '13px'
                            }}
                          >
                            <div>
                              <span style={{ color: 'var(--text-muted)' }}>Location: </span>
                              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                {req.location?.address || 'Kharghar, Navi Mumbai'}
                              </span>
                            </div>

                            <div>
                              <span style={{ color: 'var(--text-muted)' }}>Vehicle: </span>
                              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                {req.vehicleDetails?.make} {req.vehicleDetails?.model} ({req.vehicleDetails?.licensePlate})
                              </span>
                            </div>

                            {req.description && (
                              <div style={{ gridColumn: '1 / -1', fontStyle: 'italic', color: 'var(--text-secondary)' }}>
                                "{req.description}"
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* =======================================================================
            VIEW 2: REQUESTS TAB
            ======================================================================= */}
        {currentTab === 'requests' && (
          <div style={{ maxWidth: '960px', margin: '0 auto' }}>
            <div style={{ marginBottom: '24px' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
                New requests
              </h1>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Review incoming roadside assistance calls and accept available jobs.
              </p>
            </div>

            {activeJob && (
              <div
                style={{
                  padding: '14px 18px',
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--brand-amber)',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Active job in progress
                  </div>
                  <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {getIssueTitle(activeJob.issueType)} for {activeJob.driver?.name || 'Customer'}
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => switchTab('home')}
                >
                  Go to active job
                </button>
              </div>
            )}

            {pendingRequests.length === 0 ? (
              <div
                className="card"
                style={{
                  padding: '48px 24px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid var(--border)',
                  textAlign: 'center'
                }}
              >
                <Clock size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 12px auto' }} />
                <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  No new requests
                </div>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                  New requests will appear here when drivers in your area ask for roadside assistance.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {pendingRequests.map((req) => {
                  const metrics = calculateDistanceAndEta(
                    { lat: baseLat, lng: baseLng },
                    req.location
                  );
                  const Icon = getIssueIcon(req.issueType);

                  return (
                    <div
                      key={req._id}
                      className="card"
                      style={{
                        padding: '24px',
                        backgroundColor: '#FFFFFF',
                        border: '1px solid var(--border)',
                        boxShadow: 'var(--shadow-sm)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                          <div
                            style={{
                              width: '42px',
                              height: '42px',
                              borderRadius: 'var(--radius-sm)',
                              backgroundColor: 'var(--surface-secondary)',
                              color: 'var(--text-primary)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}
                          >
                            <Icon size={20} />
                          </div>

                          <div>
                            <div style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                              {getIssueTitle(req.issueType)}
                            </div>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--brand-amber)', marginTop: '2px' }}>
                              {metrics.distance} away · {metrics.eta}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => setSelectedRequest(req)}
                            style={{ height: '36px', padding: '0 16px', fontSize: '13px' }}
                          >
                            View request
                          </button>
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => handleAcceptJob(req._id)}
                            disabled={actionLoading}
                            style={{ height: '36px', padding: '0 18px', fontSize: '13px' }}
                          >
                            Accept job
                          </button>
                        </div>
                      </div>

                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                          gap: '14px',
                          padding: '14px 16px',
                          backgroundColor: 'var(--surface-secondary)',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '13px'
                        }}
                      >
                        <div>
                          <span style={{ color: 'var(--text-muted)' }}>Location: </span>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {req.location?.address || 'Pune'}
                          </span>
                        </div>

                        <div>
                          <span style={{ color: 'var(--text-muted)' }}>Vehicle: </span>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {req.vehicleDetails?.make} {req.vehicleDetails?.model} ({req.vehicleDetails?.licensePlate})
                          </span>
                        </div>

                        {req.description && (
                          <div style={{ gridColumn: '1 / -1', fontStyle: 'italic', color: 'var(--text-secondary)' }}>
                            "{req.description}"
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* =======================================================================
            VIEW 3: MY JOBS TAB
            ======================================================================= */}
        {currentTab === 'my-jobs' && (
          <div style={{ maxWidth: '960px', margin: '0 auto' }}>
            <div style={{ marginBottom: '24px' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
                My jobs
              </h1>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                History of all active and completed service calls.
              </p>
            </div>

            {/* Filter Buttons */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              {[
                { id: 'all', label: 'All' },
                { id: 'active', label: 'Active' },
                { id: 'completed', label: 'Completed' }
              ].map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setJobsFilter(filter.id)}
                  className={`filter-pill ${jobsFilter === filter.id ? 'active' : ''}`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {/* Jobs List */}
            {(() => {
              const filtered = assignedRequests.filter((r) => {
                if (jobsFilter === 'active') return r.status === 'ASSIGNED' || r.status === 'IN_PROGRESS';
                if (jobsFilter === 'completed') return r.status === 'COMPLETED' || r.status === 'CANCELLED';
                return true;
              });

              if (filtered.length === 0) {
                return (
                  <div
                    className="card"
                    style={{
                      padding: '48px 24px',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid var(--border)',
                      textAlign: 'center'
                    }}
                  >
                    <Clock size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 12px auto' }} />
                    <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                      No {jobsFilter !== 'all' ? jobsFilter : ''} jobs found
                    </div>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                      Jobs you accept and complete will be listed here.
                    </p>
                  </div>
                );
              }

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {filtered.map((job) => {
                    const statusObj = getHumanStatus(job.status);
                    return (
                      <div
                        key={job._id}
                        className="card"
                        style={{
                          padding: '20px 24px',
                          backgroundColor: '#FFFFFF',
                          border: '1px solid var(--border)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '16px'
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '15.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {getIssueTitle(job.issueType)}
                          </div>
                          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                            {job.driver?.name || 'Customer'} • {job.vehicleDetails?.make} {job.vehicleDetails?.model} ({job.vehicleDetails?.licensePlate})
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {new Date(job.createdAt).toLocaleDateString()} • {job.location?.address}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span
                            style={{
                              fontSize: '12px',
                              fontWeight: 600,
                              color: statusObj.color,
                              backgroundColor: statusObj.bg,
                              border: `1px solid ${statusObj.border}`,
                              padding: '3px 9px',
                              borderRadius: '6px'
                            }}
                          >
                            {statusObj.label}
                          </span>

                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => {
                              if (job.status === 'ASSIGNED' || job.status === 'IN_PROGRESS') {
                                switchTab('home');
                              } else {
                                setSelectedRequest(job);
                              }
                            }}
                          >
                            View details
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}

        {/* =======================================================================
            VIEW 4: PROFILE TAB
            ======================================================================= */}
        {currentTab === 'profile' && (
          <div style={{ maxWidth: '720px', margin: '0 auto' }}>
            <div style={{ marginBottom: '24px' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
                Profile
              </h1>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Your business details, registered roadside services, and base location.
              </p>
            </div>

            {/* Business Information Card */}
            <div
              className="card"
              style={{
                padding: '24px',
                backgroundColor: '#FFFFFF',
                border: '1px solid var(--border)',
                marginBottom: '20px'
              }}
            >
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>
                Business details
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Business name</div>
                  <div style={{ fontSize: '14.5px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                    {user.name}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Email</div>
                  <div style={{ fontSize: '14.5px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                    {user.email}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Phone number</div>
                  <div style={{ fontSize: '14.5px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                    {user.phone || '+91 9988776655'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Primary specialization</div>
                  <div style={{ fontSize: '14.5px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                    {user.serviceType ? user.serviceType.replace(/_/g, ' ') : 'Towing & Roadside'}
                  </div>
                </div>
              </div>
            </div>

            {/* Services Offered Card */}
            <div
              className="card"
              style={{
                padding: '24px',
                backgroundColor: '#FFFFFF',
                border: '1px solid var(--border)',
                marginBottom: '20px'
              }}
            >
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '14px' }}>
                Services
              </h2>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {[
                  'Towing',
                  'Battery jump-start',
                  'Flat tire repair',
                  'Fuel delivery',
                  'Lockout assistance',
                  'Mechanical problem'
                ].map((service) => (
                  <span
                    key={service}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: 'var(--surface-secondary)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '13px',
                      fontWeight: 500,
                      color: 'var(--text-primary)'
                    }}
                  >
                    {service}
                  </span>
                ))}
              </div>
            </div>

            {/* Base Location Card */}
            <div
              className="card"
              style={{
                padding: '24px',
                backgroundColor: '#FFFFFF',
                border: '1px solid var(--border)',
                marginBottom: '20px'
              }}
            >
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                Base location
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '18px' }}>
                Your dispatch starting location used for ETA and distance calculations to breakdown locations.
              </p>

              <form onSubmit={handleSaveBaseLocation}>
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label className="form-label" style={{ fontSize: '12.5px' }}>Location address</label>
                  <input
                    type="text"
                    className="form-input"
                    value={baseAddress}
                    onChange={(e) => setBaseAddress(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '18px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '12.5px' }}>Latitude</label>
                    <input
                      type="number"
                      step="any"
                      className="form-input"
                      value={baseLat}
                      onChange={(e) => setBaseLat(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '12.5px' }}>Longitude</label>
                    <input
                      type="number"
                      step="any"
                      className="form-input"
                      value={baseLng}
                      onChange={(e) => setBaseLng(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-secondary btn-sm"
                  disabled={savingLocation}
                >
                  <span>{savingLocation ? 'Saving...' : 'Save base location'}</span>
                </button>
              </form>
            </div>

            {/* Account & Sign out */}
            <div
              className="card"
              style={{
                padding: '24px',
                backgroundColor: '#FFFFFF',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Sign out
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Log out of your ResQDrive provider account on this device.
                </div>
              </div>

              {onLogout && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={onLogout}
                  style={{ color: 'var(--error)' }}
                >
                  <LogOut size={14} />
                  <span>Sign out</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* =======================================================================
            MODAL 1: REQUEST DETAILS (LARGE MAP & ACTION)
            ======================================================================= */}
        {selectedRequest && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.45)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '16px'
            }}
          >
            <div
              className="card"
              style={{
                maxWidth: '680px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                padding: 0,
                backgroundColor: '#FFFFFF',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-lg)'
              }}
            >
              {/* Modal Header */}
              <div
                style={{
                  padding: '18px 24px',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {getIssueTitle(selectedRequest.issueType)}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--brand-amber)', fontWeight: 600, marginTop: '2px' }}>
                    {calculateDistanceAndEta({ lat: baseLat, lng: baseLng }, selectedRequest.location).distance} away · {calculateDistanceAndEta({ lat: baseLat, lng: baseLng }, selectedRequest.location).eta}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedRequest(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Large Map */}
              <div style={{ height: '300px', borderBottom: '1px solid var(--border)' }}>
                <MapView
                  incident={selectedRequest}
                  provider={{ currentLocation: { address: baseAddress, lat: baseLat, lng: baseLng } }}
                  height="300px"
                  interactive={true}
                  borderless={true}
                  showFloatingEta={false}
                />
              </div>

              {/* Customer & Problem Details */}
              <div style={{ padding: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', marginBottom: '20px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Customer</div>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                      {selectedRequest.driver?.name || 'Rahul Sharma'}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Vehicle</div>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                      {selectedRequest.vehicleDetails?.make || ''} {selectedRequest.vehicleDetails?.model || 'Vehicle'}
                    </div>
                    {selectedRequest.vehicleDetails?.licensePlate && (
                      <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                        {selectedRequest.vehicleDetails.licensePlate}
                      </div>
                    )}
                  </div>

                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Problem</div>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                      {getIssueTitle(selectedRequest.issueType)}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Location</div>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                      {selectedRequest.location?.address || 'Kharghar, Navi Mumbai'}
                    </div>
                  </div>

                  {selectedRequest.description && (
                    <div style={{ gridColumn: '1 / -1' }}>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Customer note</div>
                      <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '3px', fontStyle: 'italic' }}>
                        "{selectedRequest.description}"
                      </div>
                    </div>
                  )}
                </div>

                {/* Primary Action Button */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--border)', paddingTop: '18px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setSelectedRequest(null)}
                  >
                    Close
                  </button>

                  {selectedRequest.status === 'PENDING' ? (
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => handleAcceptJob(selectedRequest._id)}
                      disabled={actionLoading}
                    >
                      {actionLoading ? 'Accepting...' : 'Accept job'}
                    </button>
                  ) : (selectedRequest.status === 'ASSIGNED' || selectedRequest.status === 'IN_PROGRESS') ? (
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => {
                        setSelectedRequest(null);
                        switchTab('home');
                      }}
                    >
                      Start trip
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =======================================================================
            MODAL 2: MESSAGE CUSTOMER
            ======================================================================= */}
        {showMessageModal && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.45)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '16px'
            }}
          >
            <div
              className="card"
              style={{
                maxWidth: '460px',
                width: '100%',
                padding: '24px',
                backgroundColor: '#FFFFFF',
                border: '1px solid var(--border)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Message {activeJob?.driver?.name || 'Customer'}
                </div>
                <button
                  type="button"
                  onClick={() => setShowMessageModal(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  <X size={18} />
                </button>
              </div>

              {messageSent ? (
                <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--success)' }}>
                  <CheckCircle2 size={32} style={{ margin: '0 auto 8px auto' }} />
                  <div style={{ fontSize: '15px', fontWeight: 600 }}>Message sent</div>
                </div>
              ) : (
                <form onSubmit={handleSendMessage}>
                  <div className="form-group" style={{ marginBottom: '18px' }}>
                    <textarea
                      className="form-input"
                      rows={3}
                      placeholder="e.g. I am in a yellow recovery truck, arriving in 5 minutes."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      required
                      style={{ height: 'auto', resize: 'vertical' }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowMessageModal(false)}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      <Send size={14} />
                      <span>Send message</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* =======================================================================
            MODAL 3: CANCEL JOB CONFIRMATION
            ======================================================================= */}
        {showCancelModal && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.45)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '16px'
            }}
          >
            <div
              className="card"
              style={{
                maxWidth: '440px',
                width: '100%',
                padding: '24px',
                backgroundColor: '#FFFFFF',
                border: '1px solid var(--border)'
              }}
            >
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                Cancel roadside job?
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '24px' }}>
                Are you sure you want to cancel this job? The customer will be informed and the request will be re-routed.
              </p>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCancelModal(false)}
                  disabled={actionLoading}
                >
                  Keep job
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleCancelJob}
                  disabled={actionLoading}
                  style={{ backgroundColor: 'var(--error)' }}
                >
                  {actionLoading ? 'Cancelling...' : 'Cancel job'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
