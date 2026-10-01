import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import MapView from './MapView';
import {
  Wrench,
  Battery,
  Fuel,
  AlertTriangle,
  KeyRound,
  HelpCircle,
  Phone,
  MessageSquare,
  Check,
  CheckCircle2,
  Clock,
  ArrowLeft,
  ArrowRight,
  X,
  AlertCircle,
  Navigation,
  Send,
  LogOut
} from 'lucide-react';

// 6 Simple, Consumer Service Options per Design Brief
const SERVICE_OPTIONS = [
  {
    id: 'FLAT_TIRE',
    title: 'Flat tire',
    icon: Wrench,
    description: 'Puncture repair or wheel swap with spare'
  },
  {
    id: 'BATTERY_DEAD',
    title: 'Battery',
    icon: Battery,
    description: 'Dead battery jump-start or battery test'
  },
  {
    id: 'FUEL_DELIVERY',
    title: 'Fuel',
    icon: Fuel,
    description: 'Emergency delivery of petrol or diesel'
  },
  {
    id: 'TOWING',
    title: 'Towing',
    icon: AlertTriangle,
    description: 'Safe flatbed towing to your preferred garage'
  },
  {
    id: 'LOCK_OUT',
    title: 'Locked out',
    icon: KeyRound,
    description: 'Keys locked inside or door opening service'
  },
  {
    id: 'OTHER',
    title: 'Other problem',
    icon: HelpCircle,
    description: 'Engine won’t start, overheating, or unknown breakdown'
  }
];

// Human-readable status mapping (NO backend enums shown to users)
function getHumanStatus(status) {
  switch (status) {
    case 'PENDING':
      return {
        label: 'Request sent',
        color: '#D97706',
        bg: '#FEF3C7',
        border: '#FDE68A',
        stepIndex: 1
      };
    case 'ASSIGNED':
      return {
        label: 'Provider found',
        color: '#2563EB',
        bg: '#DBEAFE',
        border: '#BFDBFE',
        stepIndex: 2
      };
    case 'IN_PROGRESS':
      return {
        label: 'On the way',
        color: '#D97706',
        bg: '#FEF3C7',
        border: '#FDE68A',
        stepIndex: 3
      };
    case 'ARRIVED':
      return {
        label: 'Arrived',
        color: '#059669',
        bg: '#D1FAE5',
        border: '#A7F3D0',
        stepIndex: 4
      };
    case 'COMPLETED':
      return {
        label: 'Completed',
        color: '#059669',
        bg: '#D1FAE5',
        border: '#A7F3D0',
        stepIndex: 5
      };
    case 'CANCELLED':
      return {
        label: 'Cancelled',
        color: '#6B7280',
        bg: '#F3F4F6',
        border: '#E5E7EB',
        stepIndex: 0
      };
    default:
      return {
        label: 'Request sent',
        color: '#4B5563',
        bg: '#F3F4F6',
        border: '#E5E7EB',
        stepIndex: 1
      };
  }
}

function getIssueTitle(issueId) {
  const match = SERVICE_OPTIONS.find((s) => s.id === issueId);
  if (match) return match.title;
  if (!issueId) return 'Roadside help';
  return issueId.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function DriverPortal({
  user,
  initialRequesting = false,
  onResetInitialRequesting,
  activeTab = 'home',
  onSelectTab,
  onLogout
}) {
  // Navigation: 'home' | 'my-requests' | 'profile'
  const [currentTab, setCurrentTab] = useState(activeTab || 'home');

  // Requests Data
  const [requests, setRequests] = useState([]);
  const [activeRequest, setActiveRequest] = useState(null);
  const [error, setError] = useState('');

  // 4-Step Request Flow: false | 1 | 2 | 3 | 4
  const [isRequesting, setIsRequesting] = useState(initialRequesting);
  const [requestStep, setRequestStep] = useState(1);

  // Form State (empty defaults so user isn't forced into hardcoded vehicles or addresses)
  const [selectedIssue, setSelectedIssue] = useState('FLAT_TIRE');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [coords, setCoords] = useState({ lat: 19.0337, lng: 73.0645 });
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [vehicleMake, setVehicleMake] = useState(user?.vehicle?.make || '');
  const [vehicleModel, setVehicleModel] = useState(user?.vehicle?.model || '');
  const [licensePlate, setLicensePlate] = useState(user?.vehicle?.licensePlate || '');
  const [submitting, setSubmitting] = useState(false);

  // Modals & Popovers
  const [selectedDetailsRequest, setSelectedDetailsRequest] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [messageSent, setMessageSent] = useState(false);
  const [showHowItWorksModal, setShowHowItWorksModal] = useState(false);

  // My Requests Filter: 'all' | 'active' | 'completed'
  const [requestFilter, setRequestFilter] = useState('all');

  // Synchronize tab prop with local tab state
  useEffect(() => {
    if (activeTab) setCurrentTab(activeTab);
  }, [activeTab]);

  const switchTab = (tab) => {
    setCurrentTab(tab);
    setIsRequesting(false);
    if (onSelectTab) onSelectTab(tab);
  };

  useEffect(() => {
    if (initialRequesting) {
      setIsRequesting(true);
      setRequestStep(1);
      setCurrentTab('home');
      if (onResetInitialRequesting) onResetInitialRequesting();
    }
  }, [initialRequesting, onResetInitialRequesting]);

  const loadRequests = useCallback(async () => {
    try {
      const data = await api.getMyRequests();
      const allReqs = data.requests || [];
      setRequests(allReqs);

      // Active request is either PENDING, ASSIGNED, or IN_PROGRESS
      const active = allReqs.find(
        (r) => r.status === 'PENDING' || r.status === 'ASSIGNED' || r.status === 'IN_PROGRESS'
      );
      setActiveRequest(active || null);
      setError('');
    } catch (err) {
      setError(err.message || 'Unable to load your requests.');
    }
  }, []);

  useEffect(() => {
    loadRequests();
    const interval = setInterval(loadRequests, 4000);
    return () => clearInterval(interval);
  }, [loadRequests]);

  // Auto-detect location when reaching Step 2 if not yet populated
  useEffect(() => {
    if (requestStep === 2 && !address && navigator.geolocation) {
      setDetectingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setCoords({ lat, lng });
          setAddress(`Current Location (${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E)`);
          setDetectingLocation(false);
        },
        () => {
          setDetectingLocation(false);
        },
        { timeout: 6000, enableHighAccuracy: true }
      );
    }
  }, [requestStep, address]);

  // Use browser geolocation to find current coordinates
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setAddress('Sector 4, Kharghar, Navi Mumbai');
      return;
    }
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCoords({ lat, lng });
        setAddress(`Near ${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E, Kharghar, Navi Mumbai`);
        setDetectingLocation(false);
      },
      () => {
        setDetectingLocation(false);
        setCoords({ lat: 19.0337, lng: 73.0645 });
        setAddress('Sector 4, Kharghar, Navi Mumbai');
      },
      { timeout: 7000, enableHighAccuracy: true }
    );
  };

  // Submit roadside request
  const handleSubmitRequest = async () => {
    setSubmitting(true);
    setError('');
    try {
      const finalAddress = address.trim() || 'Sector 4, Kharghar, Navi Mumbai';
      const finalMake = vehicleMake.trim() || user?.vehicle?.make || 'Vehicle';
      const finalModel = vehicleModel.trim() || user?.vehicle?.model || '';
      const finalPlate = licensePlate.trim() || user?.vehicle?.licensePlate || '';

      const payload = {
        issueType: selectedIssue,
        location: {
          address: finalAddress,
          city: 'Navi Mumbai',
          lat: coords.lat,
          lng: coords.lng
        },
        vehicleDetails: {
          make: finalMake,
          model: finalModel,
          licensePlate: finalPlate
        },
        description: description.trim()
      };

      const res = await api.createRequest(payload);
      if (res.request) {
        setIsRequesting(false);
        setRequestStep(1);
        setDescription('');
        await loadRequests();
        setCurrentTab('home');
      }
    } catch (err) {
      setError(err.message || 'Failed to submit request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Cancel pending request
  const handleCancelRequest = async () => {
    if (!activeRequest) return;
    setCancelling(true);
    try {
      await api.cancelRequest(activeRequest._id);
      setShowCancelModal(false);
      await loadRequests();
    } catch (err) {
      setError(err.message || 'Could not cancel request.');
    } finally {
      setCancelling(false);
    }
  };

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

  // Quick click from Home issue grid: preselect issue and enter request flow
  const handleQuickIssueSelect = (issueId) => {
    setSelectedIssue(issueId);
    setIsRequesting(true);
    setRequestStep(2); // Jump straight to step 2 (location)
  };

  return (
    <div style={{ backgroundColor: 'var(--bg-page)', minHeight: 'calc(100vh - 56px)' }}>
      <div className="container" style={{ paddingTop: '28px', paddingBottom: '64px' }}>
        {/* Error Feedback Banner */}
        {error && (
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: 'var(--error-subtle)',
              color: 'var(--error)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '13.5px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
            <button
              className="btn btn-secondary btn-sm"
              onClick={loadRequests}
              style={{ height: '28px', padding: '0 10px', fontSize: '12px' }}
            >
              Retry
            </button>
          </div>
        )}

        {/* =========================================================================
            VIEW 1: REQUEST FLOW (3–4 SIMPLE STEPS WIZARD)
            ========================================================================= */}
        {isRequesting ? (
          <div style={{ maxWidth: '620px', margin: '0 auto' }}>
            {/* Wizard Header */}
            <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button
                type="button"
                onClick={() => {
                  if (requestStep > 1) {
                    setRequestStep(requestStep - 1);
                  } else {
                    setIsRequesting(false);
                  }
                }}
                className="btn btn-ghost btn-sm"
                style={{ paddingLeft: 0, color: 'var(--text-secondary)' }}
              >
                <ArrowLeft size={16} />
                <span>{requestStep === 1 ? 'Cancel' : 'Back'}</span>
              </button>

              <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-muted)' }}>
                Step {requestStep} of 4
              </div>
            </div>

            {/* Clean Progress Line */}
            <div
              style={{
                height: '4px',
                width: '100%',
                backgroundColor: 'var(--border)',
                borderRadius: '2px',
                marginBottom: '28px',
                overflow: 'hidden'
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${(requestStep / 4) * 100}%`,
                  backgroundColor: 'var(--brand-dark)',
                  transition: 'width 240ms ease'
                }}
              />
            </div>

            {/* Card Container */}
            <div
              className="card"
              style={{
                padding: '32px 28px',
                backgroundColor: '#FFFFFF',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              {/* STEP 1: WHAT'S WRONG? */}
              {requestStep === 1 && (
                <div>
                  <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                    What do you need help with?
                  </h1>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
                    Select the option that best describes your situation.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', marginBottom: '24px' }}>
                    {SERVICE_OPTIONS.map((item) => {
                      const Icon = item.icon;
                      const isSelected = selectedIssue === item.id;
                      return (
                        <div
                          key={item.id}
                          onClick={() => setSelectedIssue(item.id)}
                          style={{
                            padding: '16px',
                            borderRadius: 'var(--radius-md)',
                            border: isSelected ? '1.5px solid #0D0D0D' : '1px solid var(--border)',
                            backgroundColor: isSelected ? '#F3F3F3' : '#FFFFFF',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            transition: 'all var(--transition-fast)'
                          }}
                        >
                          <div
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '8px',
                              backgroundColor: isSelected ? '#E5E7EB' : 'var(--surface-secondary)',
                              color: '#0D0D0D',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}
                          >
                            <Icon size={18} />
                          </div>
                          <div>
                            <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
                              {item.title}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                              {item.description}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="form-group" style={{ marginBottom: '28px' }}>
                    <label className="form-label" style={{ fontSize: '13px' }}>
                      Additional details (Optional)
                    </label>
                    <textarea
                      className="form-input"
                      rows={2}
                      placeholder="e.g. Front right tire is flat, car is parked on the shoulder."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      style={{ height: 'auto', resize: 'vertical' }}
                    />
                  </div>

                  <button
                    type="button"
                    className="btn btn-primary btn-lg"
                    style={{ width: '100%' }}
                    onClick={() => setRequestStep(2)}
                  >
                    <span>Continue to location</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              )}

              {/* STEP 2: WHERE ARE YOU? */}
              {requestStep === 2 && (
                <div>
                  <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                    Where are you?
                  </h1>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                    Confirm your breakdown location so nearby help knows where to find you.
                  </p>

                  {/* Real OpenStreetMap Preview */}
                  <div style={{ marginBottom: '18px', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border)' }}>
                    <MapView
                      incident={{ location: { address, lat: coords.lat, lng: coords.lng } }}
                      height="220px"
                      interactive={true}
                      showFloatingEta={false}
                      borderless={true}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '14px' }}>
                    <label className="form-label" style={{ fontSize: '13px' }}>
                      Breakdown address or landmark
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Enter street, landmark, or area name"
                      required
                    />
                  </div>

                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handleUseCurrentLocation}
                    disabled={detectingLocation}
                    style={{ marginBottom: '28px', gap: '6px' }}
                  >
                    <Navigation size={13} />
                    <span>{detectingLocation ? 'Locating...' : 'Use my current location'}</span>
                  </button>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-lg"
                      onClick={() => setRequestStep(1)}
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary btn-lg"
                      style={{ flex: 1 }}
                      onClick={() => setRequestStep(3)}
                    >
                      <span>Continue to vehicle details</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: YOUR VEHICLE */}
              {requestStep === 3 && (
                <div>
                  <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                    Your vehicle
                  </h1>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
                    Confirm your vehicle details so the specialist brings the right tools or towing setup.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: '13px' }}>Vehicle Make</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Hyundai, Honda, Tata"
                        value={vehicleMake}
                        onChange={(e) => setVehicleMake(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: '13px' }}>Model</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Creta, City, Nexon"
                        value={vehicleModel}
                        onChange={(e) => setVehicleModel(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: '28px' }}>
                    <label className="form-label" style={{ fontSize: '13px' }}>License Plate / Registration</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. MH-46-AB-1234"
                      value={licensePlate}
                      onChange={(e) => setLicensePlate(e.target.value)}
                      required
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-lg"
                      onClick={() => setRequestStep(2)}
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary btn-lg"
                      style={{ flex: 1 }}
                      onClick={() => setRequestStep(4)}
                    >
                      <span>Review & confirm</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4: CONFIRM */}
              {requestStep === 4 && (
                <div>
                  <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                    Request roadside help
                  </h1>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
                    Review your request before we connect you with nearby help.
                  </p>

                  <div
                    style={{
                      backgroundColor: 'var(--surface-secondary)',
                      borderRadius: 'var(--radius-md)',
                      padding: '20px',
                      border: '1px solid var(--border)',
                      marginBottom: '28px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Problem</div>
                      <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                        {getIssueTitle(selectedIssue)}
                      </div>
                      {description && (
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px', fontStyle: 'italic' }}>
                          "{description}"
                        </div>
                      )}
                    </div>

                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Location</div>
                      <div style={{ fontSize: '14.5px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                        {address}
                      </div>
                    </div>

                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Vehicle</div>
                      <div style={{ fontSize: '14.5px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                        {vehicleMake} {vehicleModel} • {licensePlate}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-lg"
                      onClick={() => setRequestStep(3)}
                      disabled={submitting}
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary btn-lg"
                      style={{ flex: 1 }}
                      onClick={handleSubmitRequest}
                      disabled={submitting}
                    >
                      <span>{submitting ? 'Connecting with help...' : 'Request help'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : currentTab === 'home' ? (
          /* =========================================================================
              VIEW 2: HOME TAB
              ========================================================================= */
          <div>
            {/* If an active request exists, prioritize the ACTIVE REQUEST SCREEN */}
            {activeRequest ? (
              <div style={{ maxWidth: '860px', margin: '0 auto' }}>
                {/* Active Status Banner */}
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: activeRequest.status === 'PENDING' ? 'var(--brand-amber)' : 'var(--success)'
                      }}
                    />
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {activeRequest.status === 'PENDING' ? 'Searching nearby' : 'Active Assistance'}
                    </span>
                  </div>

                  <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                    {activeRequest.status === 'PENDING' ? 'Finding help nearby' : 'Help is on the way'}
                  </h1>

                  <p style={{ fontSize: '15px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    {activeRequest.status === 'PENDING'
                      ? 'We are matching your request with the closest roadside service provider in your area.'
                      : `A certified specialist is dispatched to assist you at ${activeRequest.location?.address}.`}
                  </p>
                </div>

                {/* Real Prominent Map */}
                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border)',
                    boxShadow: 'var(--shadow-md)',
                    overflow: 'hidden',
                    marginBottom: '24px'
                  }}
                >
                  {/* Clean OpenStreetMap */}
                  <MapView
                    incident={activeRequest}
                    provider={activeRequest.provider}
                    eta={activeRequest.status === 'IN_PROGRESS' ? '4 min away' : (activeRequest.status === 'ASSIGNED' ? '7 min away' : 'Calculating...')}
                    distance="1.2 km"
                    height="360px"
                    interactive={true}
                    status={activeRequest.status}
                    borderless={true}
                    showFloatingEta={false}
                  />

                  {/* Below / alongside map: ETA & Distance Pill */}
                  <div
                    style={{
                      padding: '14px 24px',
                      backgroundColor: '#FFFFFF',
                      borderTop: '1px solid var(--border)',
                      borderBottom: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: activeRequest.status === 'PENDING' ? 'var(--brand-amber)' : 'var(--success)'
                        }}
                      />
                      <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                        {activeRequest.status === 'PENDING'
                          ? 'Finding nearby provider'
                          : activeRequest.status === 'IN_PROGRESS'
                          ? '4 min away · 1.2 km'
                          : activeRequest.status === 'ARRIVED'
                          ? 'Specialist has arrived'
                          : '7 min away · 2.4 km'}
                      </span>
                    </div>

                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      {getHumanStatus(activeRequest.status).label}
                    </div>
                  </div>

                  {/* Provider Card below map */}
                  <div
                    style={{
                      padding: '20px 24px',
                      backgroundColor: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '16px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div
                        style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: '#171717',
                          color: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '16px'
                        }}
                      >
                        {activeRequest.provider?.name ? activeRequest.provider.name.charAt(0) : 'A'}
                      </div>
                      <div>
                        <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {activeRequest.provider?.name || 'Apex Towing & Recovery'}
                        </div>
                        <div style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          {getIssueTitle(activeRequest.issueType)} · {activeRequest.vehicleDetails?.make || 'Hyundai'} {activeRequest.vehicleDetails?.model || 'Creta'}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <a
                        href={activeRequest.provider?.phone ? `tel:${activeRequest.provider.phone}` : 'tel:+919876543210'}
                        className="btn btn-secondary btn-sm"
                        style={{ height: '36px', padding: '0 16px', fontSize: '13px' }}
                      >
                        <Phone size={14} />
                        <span>Call</span>
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
                  </div>
                </div>

                {/* Simple 5-Step Progress Indicator */}
                <div
                  className="card"
                  style={{
                    padding: '24px',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid var(--border)',
                    marginBottom: '24px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                    {[
                      { step: 1, label: 'Request sent' },
                      { step: 2, label: 'Provider found' },
                      { step: 3, label: 'On the way' },
                      { step: 4, label: 'Arrived' },
                      { step: 5, label: 'Completed' }
                    ].map((item, idx, arr) => {
                      const currentStepNum = getHumanStatus(activeRequest.status).stepIndex;
                      const isDone = currentStepNum >= item.step;
                      const isCurrent = currentStepNum === item.step;

                      return (
                        <React.Fragment key={item.step}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              flexShrink: 0
                            }}
                          >
                            <div
                              style={{
                                width: '22px',
                                height: '22px',
                                borderRadius: '50%',
                                backgroundColor: isDone ? '#171717' : '#F3F4F6',
                                color: isDone ? '#FFFFFF' : '#9CA3AF',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '11px',
                                fontWeight: 700,
                                border: isCurrent ? '2px solid var(--brand-amber)' : 'none'
                              }}
                            >
                              {isDone ? <Check size={12} /> : item.step}
                            </div>
                            <span
                              style={{
                                fontSize: '13px',
                                fontWeight: isCurrent ? 600 : 400,
                                color: isDone ? 'var(--text-primary)' : 'var(--text-muted)',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {item.label}
                            </span>
                          </div>

                          {idx < arr.length - 1 && (
                            <span
                              style={{
                                color: isDone && currentStepNum > item.step ? 'var(--text-primary)' : 'var(--border-strong)',
                                fontSize: '14px',
                                margin: '0 4px',
                                userSelect: 'none'
                              }}
                            >
                              →
                            </span>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>

                {/* Request Details Card */}
                <div
                  className="card"
                  style={{
                    padding: '24px',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid var(--border)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                      Request details
                    </h2>
                    {(activeRequest.status === 'PENDING' || activeRequest.status === 'ASSIGNED') && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => setShowCancelModal(true)}
                        style={{ color: 'var(--error)', fontSize: '13px' }}
                      >
                        Cancel request
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '18px', marginBottom: '20px' }}>
                    <div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Problem</div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                        {getIssueTitle(activeRequest.issueType)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Location</div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                        {activeRequest.location?.address}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Vehicle</div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                        {activeRequest.vehicleDetails?.make} {activeRequest.vehicleDetails?.model} ({activeRequest.vehicleDetails?.licensePlate})
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Provider</div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                        {activeRequest.provider?.name || 'Apex Towing & Recovery'}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Current status</div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: getHumanStatus(activeRequest.status).color, marginTop: '2px' }}>
                        {getHumanStatus(activeRequest.status).label}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>ETA</div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                        {activeRequest.status === 'IN_PROGRESS' ? '4 min away' : (activeRequest.status === 'ASSIGNED' ? '7 min away' : 'Calculating...')}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Request date</div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                        {new Date(activeRequest.createdAt).toLocaleDateString()} at {new Date(activeRequest.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>

                  {/* Actions inside Request Details */}
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px' }}>
                    <a
                      href={activeRequest.provider?.phone ? `tel:${activeRequest.provider.phone}` : 'tel:+919876543210'}
                      className="btn btn-secondary btn-sm"
                    >
                      <Phone size={13} />
                      <span>Call provider</span>
                    </a>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setShowMessageModal(true)}
                    >
                      <MessageSquare size={13} />
                      <span>Message provider</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* HOME SCREEN — NO ACTIVE REQUEST */
              <div style={{ maxWidth: '840px', margin: '0 auto' }}>
                {/* Clean Consumer Welcome Banner */}
                <div
                  className="card"
                  style={{
                    padding: '36px 32px',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid var(--border)',
                    boxShadow: 'var(--shadow-sm)',
                    marginBottom: '36px'
                  }}
                >
                  <h1 style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '8px' }}>
                    Need help with your vehicle?
                  </h1>
                  <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.55, maxWidth: '580px', marginBottom: '24px' }}>
                    Tell us what's wrong and we'll connect you with a nearby roadside service provider.
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn btn-primary btn-lg"
                      onClick={() => {
                        setIsRequesting(true);
                        setRequestStep(1);
                      }}
                    >
                      <span>Get roadside help</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-lg"
                      onClick={() => setShowHowItWorksModal(true)}
                    >
                      <span>How it works</span>
                    </button>
                  </div>
                </div>

                {/* Service Options: "What can we help with?" */}
                <div style={{ marginBottom: '40px' }}>
                  <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>
                    What can we help with?
                  </h2>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                    {SERVICE_OPTIONS.map((item) => {
                      const Icon = item.icon;
                      return (
                        <div
                          key={item.id}
                          onClick={() => handleQuickIssueSelect(item.id)}
                          className="card"
                          style={{
                            padding: '20px',
                            backgroundColor: '#FFFFFF',
                            border: '1px solid var(--border)',
                            cursor: 'pointer',
                            transition: 'all var(--transition-fast)'
                          }}
                        >
                          <div
                            style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '8px',
                              backgroundColor: 'var(--surface-secondary)',
                              color: 'var(--text-primary)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginBottom: '12px'
                            }}
                          >
                            <Icon size={18} />
                          </div>
                          <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                            {item.title}
                          </div>
                          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                            {item.description}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Recent Requests Section */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Your recent requests
                    </h2>
                    {requests.length > 0 && (
                      <button
                        type="button"
                        onClick={() => switchTab('my-requests')}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          fontSize: '13px',
                          fontWeight: 500,
                          color: 'var(--text-secondary)',
                          cursor: 'pointer'
                        }}
                      >
                        View all
                      </button>
                    )}
                  </div>

                  {requests.length === 0 ? (
                    <div
                      className="card"
                      style={{
                        padding: '36px 20px',
                        textAlign: 'center',
                        backgroundColor: '#FFFFFF',
                        border: '1px solid var(--border)'
                      }}
                    >
                      <Clock size={28} style={{ color: 'var(--text-muted)', margin: '0 auto 8px auto' }} />
                      <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                        No recent requests
                      </div>
                      <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)' }}>
                        When you request roadside assistance, your service history will appear here.
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {requests.slice(0, 3).map((req) => {
                        const statusObj = getHumanStatus(req.status);
                        return (
                          <div
                            key={req._id}
                            className="card"
                            style={{
                              padding: '16px 20px',
                              backgroundColor: '#FFFFFF',
                              border: '1px solid var(--border)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              flexWrap: 'wrap',
                              gap: '12px'
                            }}
                          >
                            <div>
                              <div style={{ fontSize: '14.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                                {getIssueTitle(req.issueType)}
                              </div>
                              <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                {req.provider?.name || 'Searching for provider'} • {new Date(req.createdAt).toLocaleDateString()}
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
                                onClick={() => setSelectedDetailsRequest(req)}
                                style={{ height: '30px', fontSize: '12.5px' }}
                              >
                                View details
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : currentTab === 'my-requests' ? (
          /* =========================================================================
              VIEW 3: MY REQUESTS TAB
              ========================================================================= */
          <div style={{ maxWidth: '840px', margin: '0 auto' }}>
            <div style={{ marginBottom: '24px' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '6px' }}>
                My requests
              </h1>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                View your active and past roadside assistance requests.
              </p>
            </div>

            {/* Filter Tabs: All | Active | Completed */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              {[
                { id: 'all', label: 'All' },
                { id: 'active', label: 'Active' },
                { id: 'completed', label: 'Completed' }
              ].map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setRequestFilter(filter.id)}
                  className={`filter-pill ${requestFilter === filter.id ? 'active' : ''}`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {/* Filtered List */}
            {(() => {
              const filtered = requests.filter((r) => {
                if (requestFilter === 'active') {
                  return r.status === 'PENDING' || r.status === 'ASSIGNED' || r.status === 'IN_PROGRESS';
                }
                if (requestFilter === 'completed') {
                  return r.status === 'COMPLETED' || r.status === 'CANCELLED';
                }
                return true;
              });

              if (filtered.length === 0) {
                return (
                  <div
                    className="card"
                    style={{
                      padding: '48px 24px',
                      textAlign: 'center',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid var(--border)'
                    }}
                  >
                    <Clock size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 12px auto' }} />
                    <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                      No {requestFilter !== 'all' ? requestFilter : ''} requests found
                    </div>
                    <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)' }}>
                      Your roadside requests will appear here once submitted.
                    </p>
                  </div>
                );
              }

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {filtered.map((req) => {
                    const statusObj = getHumanStatus(req.status);
                    return (
                      <div
                        key={req._id}
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
                          <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {getIssueTitle(req.issueType)}
                          </div>
                          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '3px' }}>
                            {req.provider?.name || 'Searching for provider'} • {new Date(req.createdAt).toLocaleDateString()}
                          </div>
                          <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {req.location?.address}
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
                              if (req.status === 'PENDING' || req.status === 'ASSIGNED' || req.status === 'IN_PROGRESS') {
                                setActiveRequest(req);
                                switchTab('home');
                              } else {
                                setSelectedDetailsRequest(req);
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
        ) : (
          /* =========================================================================
              VIEW 4: PROFILE TAB
              ========================================================================= */
          <div style={{ maxWidth: '640px', margin: '0 auto' }}>
            <div style={{ marginBottom: '24px' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '6px' }}>
                Profile
              </h1>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                Your personal and registered vehicle details.
              </p>
            </div>

            {/* Personal Details */}
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
                Personal details
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>Name</div>
                  <div style={{ fontSize: '14.5px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                    {user?.name || 'Driver'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>Email</div>
                  <div style={{ fontSize: '14.5px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                    {user?.email}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>Phone number</div>
                  <div style={{ fontSize: '14.5px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                    {user?.phone || '+91 98765 43210'}
                  </div>
                </div>
              </div>
            </div>

            {/* Vehicle Details */}
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
                Vehicle
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>Vehicle model</div>
                  <div style={{ fontSize: '14.5px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                    {user?.vehicle?.make || 'Hyundai'} {user?.vehicle?.model || 'Creta'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>Registration number</div>
                  <div style={{ fontSize: '14.5px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                    {user?.vehicle?.licensePlate || 'MH-46-AB-1234'}
                  </div>
                </div>
              </div>
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
                  Log out of your ResQDrive driver profile on this device.
                </div>
              </div>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={onLogout}
                style={{ color: 'var(--error)' }}
              >
                <LogOut size={14} />
                <span>Sign out</span>
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            MODAL 1: REQUEST DETAILS (FOR COMPLETED/PAST CALLS)
            ========================================================================= */}
        {selectedDetailsRequest && (
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
                maxWidth: '500px',
                width: '100%',
                padding: '28px',
                backgroundColor: '#FFFFFF',
                border: '1px solid var(--border)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {getIssueTitle(selectedDetailsRequest.issueType)}
                </h3>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: getHumanStatus(selectedDetailsRequest.status).color,
                    backgroundColor: getHumanStatus(selectedDetailsRequest.status).bg,
                    padding: '3px 8px',
                    borderRadius: '6px'
                  }}
                >
                  {getHumanStatus(selectedDetailsRequest.status).label}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Location</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                    {selectedDetailsRequest.location?.address}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Vehicle</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                    {selectedDetailsRequest.vehicleDetails?.make} {selectedDetailsRequest.vehicleDetails?.model} ({selectedDetailsRequest.vehicleDetails?.licensePlate})
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Provider</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                    {selectedDetailsRequest.provider?.name || 'Apex Towing & Recovery'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Request date</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                    {new Date(selectedDetailsRequest.createdAt).toLocaleDateString()} at {new Date(selectedDetailsRequest.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                {selectedDetailsRequest.description && (
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Note</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px', fontStyle: 'italic' }}>
                      "{selectedDetailsRequest.description}"
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelectedDetailsRequest(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            MODAL 2: CANCEL REQUEST CONFIRMATION
            ========================================================================= */}
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
                padding: '28px',
                backgroundColor: '#FFFFFF',
                border: '1px solid var(--border)'
              }}
            >
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                Cancel assistance request?
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '24px' }}>
                Are you sure you want to cancel this request? Nearby service providers will be notified.
              </p>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCancelModal(false)}
                  disabled={cancelling}
                >
                  Keep request
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleCancelRequest}
                  disabled={cancelling}
                  style={{ backgroundColor: 'var(--error)' }}
                >
                  {cancelling ? 'Cancelling...' : 'Cancel request'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            MODAL 3: DIRECT MESSAGE MODAL
            ========================================================================= */}
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
                  Message {activeRequest?.provider?.name || 'Provider'}
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
                      placeholder="e.g. I am standing near the petrol pump entrance."
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
                    <button
                      type="submit"
                      className="btn btn-primary"
                    >
                      <Send size={14} />
                      <span>Send message</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* =========================================================================
            MODAL 4: HOW IT WORKS EXPLAINER
            ========================================================================= */}
        {showHowItWorksModal && (
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
                maxWidth: '480px',
                width: '100%',
                padding: '28px',
                backgroundColor: '#FFFFFF',
                border: '1px solid var(--border)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  How roadside help works
                </h3>
                <button
                  type="button"
                  onClick={() => setShowHowItWorksModal(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  <X size={18} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '14px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#171717', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, flexShrink: 0 }}>
                    1
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Tell us what's wrong</div>
                    <div style={{ color: 'var(--text-secondary)', marginTop: '2px', fontSize: '13px' }}>
                      Choose your issue (flat tire, battery, fuel, tow, lockout) and verify your location.
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#171717', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, flexShrink: 0 }}>
                    2
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Nearby provider assigned</div>
                    <div style={{ color: 'var(--text-secondary)', marginTop: '2px', fontSize: '13px' }}>
                      We match your call with the closest verified recovery specialist.
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#171717', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, flexShrink: 0 }}>
                    3
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Live tracking & arrival</div>
                    <div style={{ color: 'var(--text-secondary)', marginTop: '2px', fontSize: '13px' }}>
                      Track the provider's vehicle in real time on the map with clear arrival times.
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="btn btn-primary"
                style={{ width: '100%' }}
                onClick={() => {
                  setShowHowItWorksModal(false);
                  setIsRequesting(true);
                  setRequestStep(1);
                }}
              >
                Get roadside help now
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
