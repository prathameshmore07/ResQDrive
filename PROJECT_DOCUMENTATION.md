# ResQDrive — Comprehensive Project Report & System Documentation

**Project Title:** ResQDrive: Cloud-Native On-Demand Roadside Assistance & Emergency Dispatch Platform  
**Developer:** Prathamesh More  
**Academic Module / Context:** Final Year University Examination Project  
**Technology Stack:** Node.js, Express.js, MongoDB, Mongoose ODM, JWT Authentication, React 19, Vite, Docker, Docker Compose, Nginx  

---

## 1. Executive Summary & Problem Statement

### 1.1 Background
Automotive breakdowns—such as tyre punctures, battery failures, mechanical breakdowns, lockouts, or sudden fuel exhaustion—cause severe delays, safety hazards, and commuter distress on expressways and urban arterial roads. Traditional roadside assistance services suffer from:
- Long telephone wait times and manual call-center routing.
- Total lack of real-time visibility into technician location and accurate arrival estimates (ETAs).
- Disconnected information flow between drivers and nearby emergency service garages.
- Inefficient allocation of tow trucks and roadside technicians.

### 1.2 The ResQDrive Solution
**ResQDrive** is an end-to-end, real-time web application and dispatch system that connects stranded drivers directly with certified roadside service providers.
- **Drivers** can request assistance in under 60 seconds with GPS-aware pinpointing, exact vehicle details, and clear problem categorisation.
- **Providers** operate an operational workspace displaying inbound requests, live route tracking, job acceptance, multi-stage status management, and complete service histories.
- **Security & Concurrency:** The platform enforces strict Role-Based Access Control (RBAC), resource ownership verification, state machine constraints, and atomic provider availability locking to eliminate race conditions.

---

## 2. System Architecture & Component Design

The platform adopts a decoupled client-server architecture containerized with Docker:

```
+---------------------------------------------------------------------------------+
|                                 CLIENT LAYER                                    |
|                                                                                 |
|   +----------------------------------+     +--------------------------------+   |
|   |          Driver Portal           |     |        Provider Portal         |   |
|   |  - 4-Step Emergency Request Flow |     |  - Inbound Real-Time Queue     |   |
|   |  - Live Request Status Tracker   |     |  - One-Click Job Acceptance    |   |
|   |  - Interactive Map & Navigation  |     |  - Multi-Step Trip Progression |   |
|   |  - Past Trip Receipts & History  |     |  - Availability & Depot Config |   |
|   +-----------------+----------------+     +---------------+----------------+   |
|                     |                                      |                    |
|                     +-------------------+------------------+                    |
|                                         |                                       |
|                              HTTP / JSON REST API                               |
+-----------------------------------------+---------------------------------------+
                                          |
                                          v
+---------------------------------------------------------------------------------+
|                          EXPRESS GATEWAY & MIDDLEWARE                           |
|                                                                                 |
|   [ CORS & JSON Parser ]  -->  [ JWT Authentication Middleware (Bearer) ]       |
|                                         |                                       |
|                                         v                                       |
|                        [ Role Guard: requireRole() ]                            |
|                                         |                                       |
|                                         v                                       |
|               [ Ownership Guard: requireDriverOwnership / Provider ]            |
|                                         |                                       |
|                                         v                                       |
|               [ Schema & Transition Validator: validateAssistanceRequest ]      |
+-----------------------------------------+---------------------------------------+
                                          |
                                          v
+---------------------------------------------------------------------------------+
|                             BUSINESS LOGIC CONTROLLERS                          |
|                                                                                 |
|   +-----------------------+ +-------------------------+ +---------------------+ |
|   |    authController     | |    requestController    | |  providerController  | |
|   |  - Register Driver/Prv| |  - createRequest        | |  - toggleAvailability| |
|   |  - Login & Issue JWT  | |  - getPendingRequests   | |  - updateLocation    | |
|   |  - Profile Me endpoint| |  - acceptRequest (Claim)| |  - getAvailablePrvs  | |
|   |                       | |  - updateRequestStatus  | |                     | |
|   +-----------+-----------+ +------------+------------+ +----------+----------+ |
|               |                          |                         |            |
+---------------+--------------------------+-------------------------+------------+
                                           |
                                           v
+---------------------------------------------------------------------------------+
|                         PERSISTENCE LAYER (MONGODB 7.0)                         |
|                                                                                 |
|   +-----------------------+ +-------------------------+ +---------------------+ |
|   |   drivers Collection  | |   providers Collection  | | assistancerequests  | |
|   |   - Name, Email, Hash | |   - Name, Email, Hash   | | - Driver FK, Prv FK | |
|   |   - Vehicle Details   | |   - Service Type, Depot | | - Status & History  | |
|   |   - Contact Number    | |   - Availability Flag   | | - GPS Coordinates   | |
|   +-----------------------+ +-------------------------+ +---------------------+ |
+---------------------------------------------------------------------------------+
```

---

## 3. Database Schema & Data Models

### 3.1 `Driver` Collection (`drivers`)
Represents registered motorists seeking roadside emergency support.

| Field | Type | Required | Description |
|---|---|---|---|
| `_id` | ObjectId | Auto | Primary identifier |
| `name` | String | Yes | Driver's legal full name |
| `email` | String | Yes | Unique login credential (indexed, lowercase) |
| `password` | String | Yes | Bcrypt salted hash (min 6 chars, salt rounds = 10) |
| `phone` | String | Yes | Primary mobile number for emergency callback |
| `vehicle.make` | String | Optional | Automobile manufacturer (e.g., Hyundai, Tata, Mahindra) |
| `vehicle.model` | String | Optional | Automobile model (e.g., Creta, Nexon EV, Thar) |
| `vehicle.licensePlate` | String | Optional | Official registration number (e.g., MH-46-AB-1234) |
| `role` | String | Yes | Constant `"driver"` |
| `createdAt` / `updatedAt` | Date | Auto | ISO timestamps |

### 3.2 `Provider` Collection (`providers`)
Represents towing operators, mechanic garages, and mobile tire/battery squads.

| Field | Type | Required | Description |
|---|---|---|---|
| `_id` | ObjectId | Auto | Primary identifier |
| `name` | String | Yes | Business / Agency name |
| `email` | String | Yes | Unique login credential |
| `password` | String | Yes | Bcrypt salted hash |
| `phone` | String | Yes | Operations contact line |
| `serviceType` | String | Yes | Enum: `TOWING`, `TIRE_REPAIR`, `MECHANIC`, `BATTERY_SERVICE`, `ALL_ROUNDER` |
| `isAvailable` | Boolean | Yes | Operational toggle (default: `true`). Becomes `false` upon accepting a job |
| `currentLocation.address` | String | Yes | Physical depot / hub address |
| `currentLocation.lat` | Number | Yes | Depot latitude (WGS84) |
| `currentLocation.lng` | Number | Yes | Depot longitude (WGS84) |
| `role` | String | Yes | Constant `"provider"` |

### 3.3 `AssistanceRequest` Collection (`assistancerequests`)
Represents an incident ticket tracking the complete lifecycle of a service call.

| Field | Type | Required | Description |
|---|---|---|---|
| `_id` | ObjectId | Auto | Unique incident reference ID |
| `driver` | ObjectId | Yes | Foreign Key referencing `Driver` |
| `provider` | ObjectId | No | Foreign Key referencing assigned `Provider` (`null` when pending) |
| `issueType` | String | Yes | Enum: `FLAT_TIRE`, `BATTERY_DEAD`, `ENGINE_FAILURE`, `FUEL_DELIVERY`, `TOWING`, `LOCK_OUT`, `OTHER` |
| `location.address` | String | Yes | Physical breakdown location text |
| `location.city` | String | No | Municipality / City (e.g., Navi Mumbai, Pune) |
| `location.lat` | Number | No | Exact GPS breakdown latitude |
| `location.lng` | Number | No | Exact GPS breakdown longitude |
| `description` | String | No | Driver's note regarding the breakdown circumstances |
| `vehicleDetails` | Object | Yes | Snapshot of vehicle at time of incident (`make`, `model`, `licensePlate`) |
| `status` | String | Yes | Workflow state enum: `PENDING`, `ASSIGNED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED` |
| `statusHistory` | Array | Yes | Complete audit trail array with timestamps, updatedByRole, updatedById, and notes |

---

## 4. Real-Life Request Lifecycle & State Machine

```
                      +-----------------------------+
                      |   Driver creates request    |
                      +--------------+--------------+
                                     |
                                     v
                      +-----------------------------+
                      |      status: PENDING        |
                      |      provider: null         |
                      +-------+-------------+-------+
                              |             |
           Provider clicks    |             | Driver clicks
           [ Accept Job ]     |             | [ Cancel Request ]
                              v             v
       +----------------------------+   +----------------------------+
       |      status: ASSIGNED      |   |     status: CANCELLED      |
       |  provider: <providerId>    |   |     (Terminal State)       |
       |  provider.isAvailable: 0   |   +----------------------------+
       +--------------+-------------+
                      |
       Provider clicks|
       [ Start Trip ] |
                      v
       +----------------------------+
       |    status: IN_PROGRESS     |
       | (Sub-steps: En Route,      |
       |  Arrived, Service Active)  |
       +--------------+-------------+
                      |
       Provider clicks|
       [ Complete ]   |
                      v
       +----------------------------+
       |     status: COMPLETED      |
       |  provider.isAvailable: 1   |
       |     (Terminal State)       |
       +----------------------------+
```

### State Machine Constraints:
1. **PENDING $\rightarrow$ ASSIGNED**: Triggered when an active provider claims the ticket via `PATCH /api/requests/:id/accept`. The provider is marked `isAvailable: false` to ensure atomic exclusivity.
2. **ASSIGNED $\rightarrow$ IN_PROGRESS**: Triggered when the service technician commences travel towards the stranded driver.
3. **IN_PROGRESS $\rightarrow$ COMPLETED**: Triggered upon completion of tire change, jump-start, towing, or fueling. The provider's `isAvailable` flag automatically resets to `true`.
4. **Any active state $\rightarrow$ CANCELLED**: Drivers may cancel while pending; providers or drivers may cancel with recorded reasons if vehicle is recovered independently. Provider availability is immediately restored.

---

## 5. Security & Authorization Rules

1. **Password Encryption**: All credentials are pre-hashed using `bcryptjs` with salt round cost factor 10 before saving to MongoDB.
2. **Stateless JWT Tokens**: Upon login, signed JSON Web Tokens containing `{ id, role }` are issued with 7-day expiration.
3. **Authorization Middleware Hierarchy**:
   - `authMiddleware`: Parses and validates the Bearer token in the `Authorization` header.
   - `requireRole('driver' | 'provider')`: Restricts administrative actions according to user role.
   - `requireDriverOwnership`: Ensures motorists can only inspect or modify their own incidents.
   - `requireAssignedProvider`: Ensures only the officially assigned mechanic can transition status.

---

## 6. Execution & Deployment Setup

### 6.1 Backend API Execution
```bash
cd backend
npm install
node seed.js     # Seeds real drivers, providers and requests
npm run dev      # Runs Express server on port 5001 with nodemon
```

### 6.2 Frontend Application Execution
```bash
cd frontend
npm install
npm run dev      # Runs Vite dev server on http://localhost:5173
```

---

## 7. Pre-Seeded Evaluation Accounts

The MongoDB database is seeded with complete real-world scenarios:

### 7.1 Drivers
| Name | Email | Password | Vehicle | Current State |
|---|---|---|---|---|
| **Rahul Sharma** | `rahul@driver.com` | `password123` | Hyundai Creta (MH-46-AB-1234) | Ready to raise new live request |
| **Ananya Patel** | `ananya@driver.com` | `password123` | Tata Nexon EV (MH-14-CD-5678) | Has active **PENDING** battery request |
| **Rohit Verma** | `rohit@driver.com` | `password123` | Mahindra Thar (MH-02-EF-9012) | Has active **PENDING** flat tyre request |
| **Sneha Kulkarni** | `sneha@driver.com` | `password123` | Maruti Swift (MH-12-GH-3456) | 1 completed towing request |
| **Vikram Mehta** | `vikram@driver.com` | `password123` | Toyota Fortuner (MH-04-JK-7890) | 1 completed battery request |
| **Priya Nair** | `priya@driver.com` | `password123` | Honda City (MH-43-MN-1122) | 1 completed fuel delivery request |

### 7.2 Providers
| Provider Name | Email | Password | Speciality | Base Location |
|---|---|---|---|---|
| **Apex Quick Towing** | `apex@provider.com` | `password123` | Towing & Flatbed | Kharghar Highway Hub, Navi Mumbai |
| **Metro Rapid Squad** | `metro@provider.com` | `password123` | Tire & Battery | Sector 17, Vashi, Navi Mumbai |
| **Highway Angels 24x7**| `highway@provider.com`| `password123` | All-Rounder Rescue | Expressway Toll Plaza, Khalapur |
| **Express Battery** | `battery@provider.com`| `password123` | Battery & Jump-Start| Belapur CBD, Navi Mumbai |
| **Pune Express Garage**| `pune@provider.com` | `password123` | Mechanical & Engine | Shivaji Nagar, Pune |

---

## 8. College Viva / Examiner Q&A Guide

**Q1: How does ResQDrive prevent two providers from accepting the same request simultaneously?**  
*Answer:* In `requestController.js`, `acceptRequest` verifies that `request.status === "PENDING"` and `request.provider === null`. Upon claiming, it assigns the provider ID, transitions the status to `"ASSIGNED"`, and sets the provider's `isAvailable` flag to `false`. Subsequent requests by other providers receive an HTTP 400 rejection stating the request is already claimed.

**Q2: What is the purpose of the statusHistory array in AssistanceRequest?**  
*Answer:* Rather than merely recording the current status string, `statusHistory` acts as an append-only immutable audit ledger. Each entry captures `{ status, timestamp, updatedByRole, updatedById, note }`, giving drivers and operations full transparency into every step of the emergency resolution.

**Q3: Why separate the Driver and Provider schemas into separate collections?**  
*Answer:* Separation of concerns. Drivers have consumer attributes (vehicle make, model, registration number, personal contact), whereas Providers possess operational business attributes (service speciality, fleet readiness, dispatch depot coordinates, online/offline availability state).

**Q4: How does the application operate without third-party proprietary mapping APIs?**  
*Answer:* ResQDrive leverages MapLibre GL with Carto / OpenStreetMap vector and raster tiles, together with the mathematical Haversine formula on the client for zero-dependency distance and ETA computation.
