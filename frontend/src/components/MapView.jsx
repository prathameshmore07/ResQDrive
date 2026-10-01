import React, { useEffect, useRef } from 'react';
import { Map, Marker, AttributionControl, setWorkerUrl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Plus, Minus, Navigation } from 'lucide-react';

try {
  setWorkerUrl('/assets/maplibre-gl-worker.mjs');
} catch (e) {
  // worker URL already initialized
}

export default function MapView({
  incident = null,
  provider = null,
  eta = '4 min away',
  distance = '1.2 km',
  height = '360px',
  interactive = true,
  status = 'ASSIGNED',
  borderless = false,
  showFloatingEta = true
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const driverMarkerRef = useRef(null);
  const providerMarkerRef = useRef(null);

  // Driver breakdown coordinates (default: Kharghar, Navi Mumbai)
  const driverLat = (incident?.location?.lat && incident.location.lat > 18.8 && incident.location.lat < 19.5)
    ? incident.location.lat
    : 19.0282;
  const driverLng = (incident?.location?.lng && incident.location.lng > 72.8 && incident.location.lng < 73.4)
    ? incident.location.lng
    : 73.0612;

  // Provider coordinates & assignment check
  const hasProvider = Boolean(provider && status !== 'PENDING');
  const isEnRoute = status === 'IN_PROGRESS';
  const isCompleted = status === 'COMPLETED';

  // Strictly enforce that provider is local to Kharghar/Navi Mumbai (never allow distant Pune coordinates)
  let rawProviderLat = provider?.currentLocation?.lat;
  let rawProviderLng = provider?.currentLocation?.lng;

  const isLocalToKharghar =
    rawProviderLat &&
    rawProviderLat >= 18.95 &&
    rawProviderLat <= 19.25 &&
    rawProviderLng >= 72.9 &&
    rawProviderLng <= 73.2 &&
    Math.abs(rawProviderLat - driverLat) < 0.1;

  const providerLat = isLocalToKharghar
    ? rawProviderLat
    : isCompleted
    ? driverLat
    : isEnRoute
    ? driverLat + 0.005
    : driverLat + 0.008;

  const providerLng = isLocalToKharghar
    ? rawProviderLng
    : isCompleted
    ? driverLng
    : isEnRoute
    ? driverLng + 0.004
    : driverLng + 0.006;

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Use CARTO Voyager tiles with desaturation/contrast for visible roads, or OSM fallback
    const cartoKey = import.meta.env.VITE_CARTO_API_KEY;
    const tileUrl = cartoKey
      ? `https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=${encodeURIComponent(cartoKey)}`
      : 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

    const mapCenter = hasProvider
      ? [(driverLng + providerLng) / 2, (driverLat + providerLat) / 2]
      : [driverLng, driverLat];

    const mapZoom = hasProvider ? 14 : 15;

    const map = new Map({
      container: mapContainerRef.current,
      style: {
        version: 8,
        sources: {
          'carto-tiles': {
            type: 'raster',
            tiles: [tileUrl],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors, © CARTO'
          }
        },
        layers: [
          {
            id: 'carto-tiles-layer',
            type: 'raster',
            source: 'carto-tiles',
            minzoom: 0,
            maxzoom: 19,
            paint: {
              'raster-saturation': -0.75, // muted, near-grayscale cartography
              'raster-contrast': 0.12,    // crisp, darker roads and typography
              'raster-brightness-max': 0.98
            }
          }
        ]
      },
      center: mapCenter,
      zoom: mapZoom,
      attributionControl: false
    });

    mapRef.current = map;

    // Add minimal custom attribution
    map.addControl(new AttributionControl({ compact: true }), 'bottom-right');

    map.on('load', () => {
      // Only draw route line if a provider is actually assigned to this incident
      if (hasProvider) {
        const routeCoordinates = [
          [providerLng, providerLat],
          [(driverLng + providerLng) / 2 + 0.001, (driverLat + providerLat) / 2],
          [driverLng, driverLat]
        ];

        map.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: routeCoordinates
            }
          }
        });

        // Route casing for contrast
        map.addLayer({
          id: 'route-casing',
          type: 'line',
          source: 'route',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#FFFFFF',
            'line-width': 7,
            'line-opacity': 0.9
          }
        });

        // Driving route
        map.addLayer({
          id: 'route-line',
          type: 'line',
          source: 'route',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#3978D8',
            'line-width': 4,
            'line-opacity': 0.95
          }
        });
      }
    });

    // Custom Driver Location Pin (Sleek dark location marker with "Your location" badge)
    const driverEl = document.createElement('div');
    driverEl.className = 'driver-marker';
    driverEl.style.display = 'flex';
    driverEl.style.flexDirection = 'column';
    driverEl.style.alignItems = 'center';
    driverEl.style.cursor = 'default';
    driverEl.innerHTML = `
      <div style="
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background-color: #2563EB;
        border: 2.5px solid #FFFFFF;
        box-shadow: 0 2px 10px rgba(37, 99, 235, 0.45);
      "></div>
      <span style="
        font-family: var(--font-sans);
        font-size: 10px;
        font-weight: 600;
        color: #171717;
        background: rgba(255,255,255,0.95);
        padding: 1px 6px;
        border-radius: 4px;
        margin-top: 3px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.12);
        letter-spacing: -0.01em;
        white-space: nowrap;
      ">${hasProvider ? 'Customer' : 'Your location'}</span>
    `;

    const driverMarker = new Marker({ element: driverEl, offset: [0, -12] })
      .setLngLat([driverLng, driverLat])
      .addTo(map);
    driverMarkerRef.current = driverMarker;

    // Only add Provider marker if a provider is assigned
    if (hasProvider) {
      const providerEl = document.createElement('div');
      providerEl.className = 'provider-nav-marker';
      providerEl.style.display = 'flex';
      providerEl.style.flexDirection = 'column';
      providerEl.style.alignItems = 'center';
      providerEl.style.cursor = 'default';

      providerEl.innerHTML = `
        <div style="
          background: #FFFFFF;
          color: #171717;
          font-family: var(--font-sans);
          font-size: 11px;
          font-weight: 600;
          padding: 2px 7px;
          border-radius: 9999px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.12);
          border: 1px solid rgba(0,0,0,0.08);
          margin-bottom: 4px;
          white-space: nowrap;
          letter-spacing: -0.01em;
        ">
          ${isCompleted ? 'Arrived' : eta || '4 min'}
        </div>
        <div style="
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background-color: #F5A623;
          border: 2px solid #FFFFFF;
          box-shadow: 0 3px 10px rgba(245, 166, 35, 0.45);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="#171717" style="transform: rotate(45deg);">
            <path d="M12 2L19 21L12 17L5 21L12 2Z"></path>
          </svg>
        </div>
      `;

      const providerMarker = new Marker({ element: providerEl, offset: [0, -18] })
        .setLngLat([providerLng, providerLat])
        .addTo(map);
      providerMarkerRef.current = providerMarker;
    }

    return () => {
      map.remove();
    };
  }, [driverLat, driverLng, providerLat, providerLng, hasProvider, isCompleted, eta]);

  const handleZoomIn = () => {
    if (mapRef.current) mapRef.current.zoomIn();
  };

  const handleZoomOut = () => {
    if (mapRef.current) mapRef.current.zoomOut();
  };

  const handleRecenter = () => {
    if (mapRef.current) {
      const center = hasProvider
        ? [(driverLng + providerLng) / 2, (driverLat + providerLat) / 2]
        : [driverLng, driverLat];
      mapRef.current.flyTo({
        center,
        zoom: hasProvider ? 14 : 15
      });
    }
  };

  return (
    <div
      className={borderless ? 'map-viewport-flush' : 'map-viewport'}
      style={{
        height,
        position: 'relative'
      }}
    >
      {/* Real MapLibre Canvas */}
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

      {/* Floating Status Pill (Apple Maps-style ETA banner) */}
      {showFloatingEta && (
        <div
          style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            backgroundColor: '#FFFFFF',
            borderRadius: 'var(--radius-full)',
            padding: '6px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            border: '1px solid var(--border)',
            zIndex: 10
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: isCompleted ? 'var(--success)' : 'var(--brand-amber)'
            }}
          />
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
            {isCompleted ? 'Provider on scene' : eta}
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>•</span>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            {isCompleted ? 'Resolved' : distance}
          </span>
        </div>
      )}

      {/* Clean Apple-style Zoom & Recenter Controls */}
      {interactive && (
        <div
          style={{
            position: 'absolute',
            bottom: '12px',
            right: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            zIndex: 10
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 'var(--radius-sm)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              border: '1px solid var(--border)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <button
              onClick={handleZoomIn}
              style={{
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-primary)',
                borderBottom: '1px solid var(--border)'
              }}
              title="Zoom in"
            >
              <Plus size={15} />
            </button>
            <button
              onClick={handleZoomOut}
              style={{
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-primary)'
              }}
              title="Zoom out"
            >
              <Minus size={15} />
            </button>
          </div>

          <button
            onClick={handleRecenter}
            style={{
              width: '32px',
              height: '32px',
              backgroundColor: '#FFFFFF',
              borderRadius: 'var(--radius-sm)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-primary)'
            }}
            title="Recenter"
          >
            <Navigation size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
