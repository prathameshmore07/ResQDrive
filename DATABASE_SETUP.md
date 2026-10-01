# ResQDrive — MongoDB Setup & Compass Guide

This guide details how MongoDB is structured for the ResQDrive project and how to inspect, seed, and query data using **MongoDB Compass** or the command line.

---

## 1. MongoDB Connection Details

- **URI:** `mongodb://localhost:27017/roadside_assistance`
- **Database Name:** `roadside_assistance`
- **Port:** `27017`

### Connecting with MongoDB Compass:
1. Open **MongoDB Compass**.
2. In the "New Connection" screen, enter the connection string:
   ```text
   mongodb://localhost:27017
   ```
3. Click **Connect**.
4. In the left navigation pane, select the **`roadside_assistance`** database.
5. You will see the three primary collections:
   - `drivers`
   - `providers`
   - `assistancerequests`

---

## 2. Collections Overview

### 2.1 Collection: `drivers`
Stores motorist accounts and their primary vehicle registrations.

**Sample Document in MongoDB Compass:**
```json
{
  "_id": { "$oid": "6abe31812266a0e24db8e0b4" },
  "name": "Rahul Sharma",
  "email": "rahul@driver.com",
  "phone": "+91 9876543210",
  "vehicle": {
    "make": "Hyundai",
    "model": "Creta SX",
    "licensePlate": "MH-46-AB-1234"
  },
  "role": "driver",
  "createdAt": { "$date": "2026-10-01T10:10:09.762Z" },
  "updatedAt": { "$date": "2026-10-01T10:10:09.762Z" },
  "__v": 0
}
```

---

### 2.2 Collection: `providers`
Stores certified roadside assistance companies, towing squads, and mechanic bases.

**Sample Document in MongoDB Compass:**
```json
{
  "_id": { "$oid": "6abe31812266a0e24db8e0c0" },
  "name": "Apex Quick Towing & Mechanics",
  "email": "apex@provider.com",
  "phone": "+91 9988776655",
  "serviceType": "TOWING",
  "isAvailable": true,
  "currentLocation": {
    "address": "Kharghar Highway Hub, Sector 4, Kharghar, Navi Mumbai",
    "lat": 19.0337,
    "lng": 73.0645
  },
  "role": "provider",
  "createdAt": { "$date": "2026-10-01T10:10:09.763Z" },
  "updatedAt": { "$date": "2026-10-01T10:11:36.602Z" },
  "__v": 0
}
```

---

### 2.3 Collection: `assistancerequests`
Stores active emergency requests, pending queues, and historical completed incident logs.

**Sample Document in MongoDB Compass:**
```json
{
  "_id": { "$oid": "6abe31812266a0e24db8e0cd" },
  "driver": { "$oid": "6abe31812266a0e24db8e0b8" },
  "provider": null,
  "issueType": "FLAT_TIRE",
  "location": {
    "address": "Sion-Panvel Highway, Near Kharghar Station Flyover, Navi Mumbai",
    "city": "Navi Mumbai",
    "lat": 19.0282,
    "lng": 73.0612
  },
  "description": "Rear passenger tire punctured by road debris on highway. Car safely parked on left shoulder. Spare wheel is in boot.",
  "vehicleDetails": {
    "make": "Mahindra",
    "model": "Thar 4x4",
    "licensePlate": "MH-02-EF-9012"
  },
  "status": "PENDING",
  "statusHistory": [
    {
      "status": "PENDING",
      "timestamp": { "$date": "2026-10-01T10:02:09.765Z" },
      "updatedByRole": "driver",
      "updatedById": { "$oid": "6abe31812266a0e24db8e0b8" },
      "note": "Request logged by driver. Emergency tire replacement needed.",
      "_id": { "$oid": "6abe31812266a0e24db8e0ce" }
    }
  ],
  "createdAt": { "$date": "2026-10-01T10:10:09.766Z" },
  "updatedAt": { "$date": "2026-10-01T10:10:09.766Z" },
  "__v": 0
}
```

---

## 3. Useful MongoDB Compass Filter Queries

You can paste these JSON filters into the MongoDB Compass **Filter** bar:

1. **Find all pending unassigned requests (Provider's incoming queue):**
   ```json
   { "status": "PENDING" }
   ```

2. **Find all available providers ready for dispatch:**
   ```json
   { "isAvailable": true }
   ```

3. **Find requests for a specific driver (by email lookup):**
   ```json
   { "status": { "$in": ["PENDING", "ASSIGNED", "IN_PROGRESS"] } }
   ```

4. **Find completed incidents by issue type:**
   ```json
   { "status": "COMPLETED", "issueType": "FLAT_TIRE" }
   ```

---

## 4. Re-seeding the Database Anytime

To reset or populate the database with fresh test accounts and emergency incidents:
```bash
cd backend
node seed.js
```
This automatically clears existing records and populates:
- 6 Driver accounts
- 5 Provider accounts
- 2 Pending roadside assistance calls (Kharghar / Navi Mumbai)
- 4 Completed historical jobs
- 1 Cancelled request
