# Mobility OS — AI-Powered Unified Vehicle, Mobility & Urban Safety Intelligence Platform

A working full-stack prototype for an SIH-style demonstration. All positions, incidents,
scores and documents shown are **DEMO / SIMULATED DATA** unless you wire in a real
data source as described below.

## What's included

```
frontend/     React + TypeScript + Vite + Tailwind — the full UI, works standalone
backend/      Node.js + Express + WebSocket — REST API, mock auth/RBAC, live vehicle sim
ai-service/   Python + FastAPI — modular rule-based scoring endpoints
database/     schema.sql — Postgres schema (not wired up yet; backend runs in-memory)
```

## Quick start

You can run the frontend alone (it falls back to an in-browser simulation), or run all
three services for the full experience with a real WebSocket-driven live map.

### 1. Frontend

```bash
cd frontend
npm install
cp .env.example .env      # points to the backend, defaults to http://localhost:4000
npm run dev
```

Open the printed local URL. The landing page is at `/`, the app shell at `/dashboard`.

### 2. Backend (optional but recommended)

```bash
cd backend
npm install
npm run dev
```

Starts Express on `http://localhost:4000` and a WebSocket vehicle stream at
`ws://localhost:4000/ws/vehicles`. With this running, the frontend's Live Map switches
from local simulation to the real backend stream automatically (see
`frontend/src/lib/useFleet.ts`) — you'll see a "LIVE BACKEND" badge in the UI.

### 3. AI service (optional)

```bash
cd ai-service
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Exposes `/v1/risk-score`, `/v1/classify-road-hazard`, `/v1/maintenance-score`. The
Node backend's risk-zone logic currently duplicates this scoring rule inline
(`backend/src/data/risk.ts`) for simplicity — point it at this service instead once
you're ready to centralize AI logic or swap in a trained model.

## How each AI module works right now

All "AI" in this prototype is a clearly-labelled **rule-based demo engine**, not a
trained/validated model:

- **Accident-risk scoring**: weighted sum of simulated traffic density (30%), accident
  history (30%), weather (20%) and road condition (20%). See `ai-service/main.py` and
  `backend/src/data/risk.ts`.
- **Road-hazard classification**: keyword-matches a citizen's text description to a
  hazard type. Replace with a real vision model behind `/v1/classify-road-hazard`.
- **Predictive maintenance**: a simple decay formula from mileage and time since
  service. Replace with a telemetry-trained model behind `/v1/maintenance-score`.
- **Government verification**: anomalies are always phrased as "requires official
  verification" — the platform never auto-accuses anyone of fraud.

## Where to connect real data later

- **Live GPS**: replace `backend/src/data/fleet.ts` + `ws/simulation.ts` with ingestion
  from real vehicle telematics/GPS hardware, writing into the `live_vehicles` table in
  `database/schema.sql`.
- **Routing**: `frontend/src/pages/Navigation.tsx` currently fabricates route options.
  Swap in a real routing engine (e.g. self-hosted OSRM or GraphHopper on OpenStreetMap
  data — both free, no paid API required) behind the same `RouteOption` shape.
- **OCR**: `frontend/src/pages/Documents.tsx` simulates the upload → OCR → validate
  pipeline. Wire the backend to Tesseract or a cloud OCR API and populate
  `vehicle_documents.extracted_fields`.
- **Government/verification APIs**: `backend/src/routes/verification.ts` is a mock
  service by design — no real government API is invented here. Point it at an
  authorized integration if/when one exists, and keep the "requires official
  verification" language rather than automated accusations.
- **Fuel/parking/EV availability**: `backend/src/data` generators can be replaced with
  real provider feeds once available; the frontend already renders whatever the API
  returns.

## Authentication & roles (current: mock)

`backend/src/middleware/auth.ts` issues demo JWTs via `POST /api/auth/demo-login` with
no password check — this is intentional for the prototype. The six roles (`PUBLIC`,
`DRIVER`, `TRANSPORT_ADMIN`, `AUTHORITY`, `EMERGENCY_OPERATOR`, `SUPER_ADMIN`) are
enforced with real middleware (`requireRole`), so the access-control logic itself is
production-shaped — only the credential check needs replacing with real user
verification (hashed passwords, OAuth, or SSO) before going live.

In the frontend, use the role switcher in the dashboard header (or Settings page) to
preview how each role's view changes — Hazardous Vehicles, Government Verification and
Urban Digital Twin are gated to authorized roles only.

## Privacy by design

No driver, passenger, vehicle-owner, or patient identity is ever modeled or returned
by any endpoint in this codebase — not just hidden in the UI. Vehicles are identified
only by anonymous IDs (`RTC-AP-04`, `HAZ-TNK-02`, etc). See
`frontend/src/pages/Privacy.tsx` for the full access matrix, and
`database/schema.sql` for how hazardous-material sensitive fields are isolated into a
separate, tightly-scoped table.

## Environment variables

See `frontend/.env.example` and `backend/.env.example`.

## Tech stack

- Frontend: React 19, TypeScript, Vite, Tailwind CSS v4, React Router, Leaflet +
  OpenStreetMap/CARTO tiles (no paid map API), Recharts, lucide-react
- Backend: Node.js, Express 5, `ws` (WebSocket), `jsonwebtoken`
- AI service: Python, FastAPI, Pydantic
- Database: PostgreSQL (schema provided; backend currently runs in-memory for the demo)

## Known limitations of this prototype

- No real database connection yet — the backend regenerates simulated fleets/risk
  zones in memory on each restart.
- No real OCR, routing engine, or government API integration (all clearly labelled
  mocks, per the brief's own instructions not to invent unavailable integrations).
- Single dark theme only (light mode can be added by extending `frontend/src/index.css`).
- The production JS bundle is a single chunk (~250KB gzipped); for a real deployment,
  code-split routes with `React.lazy`.
