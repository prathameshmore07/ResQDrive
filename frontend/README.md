# ResQDrive Client Application

**Author**: Prathamesh More  
**Framework**: React.js with Vite  
**License**: MIT  

---

## Application Overview

ResQDrive Client is the dedicated frontend interface for the emergency roadside assistance dispatch system. It provides high-reliability, zero-jargon user workflows for stranded motorists needing immediate rescue, and an operational command console for service providers managing active dispatch calls.

---

## Key Workflows & Features

### 1. Stranded Motorist Portal (`DriverView.jsx`)
- **Emergency Breakdown Intake**:
  - One-click incident classification across 7 real breakdown types (Flat Tire, Dead Battery, Engine Stalled, Towing Required, Fuel Depleted, Lockout, and General Mechanical).
  - Landmark location input with functional GPS coordinate pinning.
  - Automatic pre-fill of registered vehicle particulars (make, model, license plate).
  - Critical highway safety protocol reminder.
- **Incident Status Tracker**:
  - Linear 4-stage operational progress indicator (`Logged` → `Dispatched` → `En Route / On Site` → `Resolved`).
  - Dispatched Provider unit card with direct telephone click-to-call.
  - Chronological audit log with exact timestamps and technician notes.
  - Secure cancellation modal with confirmation to prevent accidental dismissal.
- **Assistance History Table**:
  - Searchable and status-filtered record of all previous roadside assistance calls.
- **Registered Vehicle Profile**:
  - Overview of driver profile and default vehicle registration data.

### 2. Service Provider Command Terminal (`ProviderDashboard.jsx`)
- **Operational Duty Switch**:
  - Instant toggle between **On Duty (Available for Dispatch)** and **Off Duty (Unavailable)** with server persistence.
- **Two-Column Dispatch Console**:
  - **Active Assigned Calls**: Displays assigned motorist phone, exact location, vehicle details, and situational notes. Features a status progression action (`Confirm En Route / Arrived` → `Mark Incident Resolved`) with optional technician notes input.
  - **Incoming Dispatch Queue**: Real-time pool of unassigned breakdown calls waiting in the coverage zone, with a 1-click `Claim & Dispatch Unit` action.
- **Resolved Incident Archive**:
  - Searchable data table with complete historical service records.
- **Station Capabilities & Depot Management**:
  - View certified service specialty and update depot base address and GPS coordinates via backend API.

### 3. Authentication & Profile Switcher (`AuthModal.jsx`, `Navbar.jsx`)
- Fast role toggle between Driver and Provider portals.
- 1-click pre-seeded evaluation profiles for rapid grading and demonstration:
  - Driver: Rahul Sharma (`rahul@driver.com`)
  - Driver: Ananya Patel (`ananya@driver.com`)
  - Provider: Apex Quick Towing (`apex@provider.com`)
  - Provider: Metro Rapid Tire & Battery (`metro@provider.com`)

---

## Design System Principles

- **Utilitarian & High-Contrast**: Designed specifically for high visibility on mobile screens during roadside breakdowns and on dispatch consoles.
- **Strictly No Emojis**: Every indicator, category, and action utilizes semantic SVG icons from `lucide-react`.
- **Pure CSS Tokens**: Zero reliance on heavy CSS frameworks or AI-generated glassmorphic blobs. Clean borders, standard data tables, and structured form grids.

---

## Directory Layout

```
frontend/
├── src/
│   ├── components/
│   │   ├── AuthModal.jsx         # Sign in, registration, and test profile switcher
│   │   ├── DriverView.jsx        # Intake form, live stepper tracker, history table
│   │   ├── Navbar.jsx            # Top app bar, system connectivity status, profile menu
│   │   └── ProviderDashboard.jsx # Duty switch, 2-pane dispatch console, archive table
│   ├── api.js                    # Centralized Fetch API abstraction with JWT handling
│   ├── App.jsx                   # Root coordinator & session initializer
│   ├── index.css                 # Complete design system tokens & layout utilities
│   └── main.jsx
├── index.html                    # Application entry point with metadata
├── package.json
└── vite.config.js
```

---

## Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Start Vite development server
npm run dev

# 3. Create production bundle
npm run build
```

The application runs on `http://localhost:5173` and communicates with the backend Express API on `http://localhost:5001/api`.
