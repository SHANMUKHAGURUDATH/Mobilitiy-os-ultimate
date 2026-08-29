-- ============================================================================
-- AI-Powered Unified Vehicle, Mobility & Urban Safety Intelligence Platform
-- PostgreSQL schema
--
-- This schema defines structure only. The running prototype (backend/)
-- currently serves simulated in-memory data so it works without a database.
-- Wire backend/src/data/*.ts up to these tables when moving off demo data.
-- ============================================================================

CREATE TYPE role_type AS ENUM (
  'PUBLIC', 'DRIVER', 'TRANSPORT_ADMIN', 'AUTHORITY', 'EMERGENCY_OPERATOR', 'SUPER_ADMIN'
);

CREATE TYPE vehicle_category AS ENUM (
  'COLLEGE_BUS', 'RTC_BUS', 'PRIVATE_BUS', 'EMERGENCY', 'HAZMAT', 'AUTHORIZED_OTHER'
);

CREATE TYPE vehicle_status AS ENUM ('ON_ROUTE', 'DELAYED', 'STOPPED', 'OFFLINE');
CREATE TYPE risk_level AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE document_kind AS ENUM ('RC', 'INSURANCE', 'PUC', 'LICENCE', 'PERMIT');
CREATE TYPE document_status AS ENUM ('VALID', 'EXPIRING_SOON', 'EXPIRED', 'PROCESSING');
CREATE TYPE emergency_type AS ENUM ('ACCIDENT', 'MEDICAL', 'FIRE', 'BREAKDOWN', 'HAZARD', 'OTHER');
CREATE TYPE incident_type AS ENUM (
  'POTHOLE', 'FLOODING', 'SIGNAL_FAULT', 'FALLEN_TREE', 'BLOCKAGE', 'CONSTRUCTION', 'ACCIDENT', 'OTHER'
);

-- ----------------------------------------------------------------------------
-- Users & auth (real deployment: hash passwords, integrate SSO/OAuth as needed)
-- ----------------------------------------------------------------------------
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role          role_type NOT NULL DEFAULT 'PUBLIC',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- Personal vehicles & the document vault (owner-only visibility, enforced in
-- the application layer via row-level ownership checks / Postgres RLS)
-- ----------------------------------------------------------------------------
CREATE TABLE personal_vehicles (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vehicle_type        TEXT NOT NULL, -- BIKE | CAR | OTHER
  registration_number TEXT NOT NULL,
  manufacturer        TEXT,
  model               TEXT,
  year                INT,
  fuel_type           TEXT,
  insurance_expiry    DATE,
  puc_expiry          DATE,
  maintenance_score   INT DEFAULT 100,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE vehicle_documents (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id       UUID NOT NULL REFERENCES personal_vehicles(id) ON DELETE CASCADE,
  kind             document_kind NOT NULL,
  status           document_status NOT NULL DEFAULT 'PROCESSING',
  expiry_date      DATE,
  extracted_fields JSONB, -- OCR output; never exposed outside the owning user's session
  storage_uri      TEXT,  -- pointer to encrypted object storage, not the file itself
  uploaded_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- Live/authorized vehicles (public-facing; deliberately excludes any PII)
-- ----------------------------------------------------------------------------
CREATE TABLE live_vehicles (
  id             TEXT PRIMARY KEY, -- anonymous id, e.g. 'RTC-AP-102'
  category       vehicle_category NOT NULL,
  status         vehicle_status NOT NULL DEFAULT 'OFFLINE',
  route_id       TEXT,
  destination    TEXT,
  last_lat       DOUBLE PRECISION,
  last_lng       DOUBLE PRECISION,
  heading_deg    REAL,
  speed_kmh      REAL,
  eta_minutes    INT,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Hazardous-vehicle sensitive fields live in a separate, tightly-scoped table
-- so only AUTHORITY-tier queries ever join into it.
CREATE TABLE hazardous_vehicle_details (
  vehicle_id      TEXT PRIMARY KEY REFERENCES live_vehicles(id) ON DELETE CASCADE,
  material_class  TEXT,      -- never returned to PUBLIC/DRIVER roles
  owner_org_id    UUID,      -- never returned to PUBLIC/DRIVER roles
  restricted_zone_ids TEXT[]
);

CREATE TABLE transit_routes (
  id             TEXT PRIMARY KEY,
  name           TEXT NOT NULL,
  operator       TEXT NOT NULL, -- COLLEGE | RTC | PRIVATE
  service_status TEXT NOT NULL DEFAULT 'NORMAL',
  path           JSONB NOT NULL -- array of {lat,lng}
);

CREATE TABLE transit_stops (
  id        TEXT PRIMARY KEY,
  route_id  TEXT NOT NULL REFERENCES transit_routes(id) ON DELETE CASCADE,
  name      TEXT NOT NULL,
  lat       DOUBLE PRECISION NOT NULL,
  lng       DOUBLE PRECISION NOT NULL,
  seq       INT NOT NULL
);

-- ----------------------------------------------------------------------------
-- Safety intelligence
-- ----------------------------------------------------------------------------
CREATE TABLE risk_zones (
  id             TEXT PRIMARY KEY,
  lat            DOUBLE PRECISION NOT NULL,
  lng            DOUBLE PRECISION NOT NULL,
  radius_meters  INT NOT NULL,
  level          risk_level NOT NULL,
  score          INT NOT NULL,
  factors        JSONB NOT NULL, -- [{label, weightPct}]
  computed_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE road_incidents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type          incident_type NOT NULL,
  lat           DOUBLE PRECISION NOT NULL,
  lng           DOUBLE PRECISION NOT NULL,
  severity      risk_level NOT NULL,
  description   TEXT,
  image_uri     TEXT,
  status        TEXT NOT NULL DEFAULT 'REPORTED',
  reported_by   UUID REFERENCES users(id),
  reported_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- Parking, fuel & EV
-- ----------------------------------------------------------------------------
CREATE TABLE parking_spots (
  id               TEXT PRIMARY KEY,
  name             TEXT NOT NULL,
  lat              DOUBLE PRECISION NOT NULL,
  lng              DOUBLE PRECISION NOT NULL,
  total_slots      INT NOT NULL,
  available_slots  INT NOT NULL,
  price_per_hour   NUMERIC(6,2),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE fuel_stations (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  type            TEXT NOT NULL, -- PETROL | EV_CHARGING | BOTH
  lat             DOUBLE PRECISION NOT NULL,
  lng             DOUBLE PRECISION NOT NULL,
  fuel_available  BOOLEAN,
  ev_ports_total  INT,
  ev_ports_free   INT,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- Emergency & verification
-- ----------------------------------------------------------------------------
CREATE TABLE emergency_alerts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type         emergency_type NOT NULL,
  lat          DOUBLE PRECISION NOT NULL,
  lng          DOUBLE PRECISION NOT NULL,
  raised_by    UUID REFERENCES users(id),
  status       TEXT NOT NULL DEFAULT 'DISPATCHED',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE verification_reports (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category      TEXT NOT NULL,
  description   TEXT NOT NULL,
  submitted_by  UUID REFERENCES users(id),
  status        TEXT NOT NULL DEFAULT 'RECEIVED',
  ai_note       TEXT, -- phrased as "anomaly requiring verification", never an accusation
  submitted_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE audit_log (
  id          BIGSERIAL PRIMARY KEY,
  actor_id    UUID,
  actor_role  role_type,
  action      TEXT NOT NULL,
  resource    TEXT NOT NULL,
  metadata    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_live_vehicles_category ON live_vehicles(category);
CREATE INDEX idx_risk_zones_level ON risk_zones(level);
CREATE INDEX idx_road_incidents_status ON road_incidents(status);
CREATE INDEX idx_audit_log_actor ON audit_log(actor_id);
