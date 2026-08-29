-- ============================================================================
-- Mobility OS — migration 001_init
-- This is the schema actually used by backend/src/routes/*.ts via src/db/pool.ts.
-- Applied with: npm run db:migrate  (see src/db/migrate.ts)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto; -- gen_random_uuid()

CREATE TYPE role_type AS ENUM ('SUPER_ADMIN','AUTHORITY','TRANSPORT_OPERATOR','DRIVER','CITIZEN','ANALYST');
CREATE TYPE vehicle_category AS ENUM ('RTC_BUS','COLLEGE_BUS','PRIVATE_BUS','EMERGENCY','HAZMAT','TAXI','AUTO','TRUCK','TWO_WHEELER','OTHER');
CREATE TYPE vehicle_status AS ENUM ('ON_ROUTE','DELAYED','STOPPED','OFFLINE');
CREATE TYPE connection_status AS ENUM ('LIVE','STALE','OFFLINE');
CREATE TYPE document_status AS ENUM ('VALID','EXPIRING_SOON','EXPIRED','PROCESSING');
CREATE TYPE incident_type AS ENUM ('HIT_AND_RUN','RASH_DRIVING','ACCIDENT','POTHOLE','FLOODING','SIGNAL_FAULT','FALLEN_TREE','BLOCKAGE','CONSTRUCTION','OTHER');
CREATE TYPE incident_severity AS ENUM ('LOW','MEDIUM','HIGH','CRITICAL');
CREATE TYPE incident_status AS ENUM ('OPEN','INVESTIGATING','ASSIGNED','RESOLVED','REJECTED');
CREATE TYPE evidence_status AS ENUM ('UPLOADED','PROCESSING','COMPLETED','FAILED');
CREATE TYPE risk_level AS ENUM ('LOW','MEDIUM','HIGH','CRITICAL');
CREATE TYPE report_status AS ENUM ('REPORTED','VERIFIED','ASSIGNED','IN_PROGRESS','RESOLVED','REJECTED');

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role          role_type NOT NULL DEFAULT 'CITIZEN',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE drivers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  phone           TEXT NOT NULL,
  license_number  TEXT UNIQUE NOT NULL,
  license_expiry  DATE,
  experience_yrs  INT,
  safety_score    INT NOT NULL DEFAULT 100,
  status          TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE vehicles (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_number  TEXT UNIQUE NOT NULL,
  vehicle_type         TEXT NOT NULL,
  category             vehicle_category NOT NULL,
  operator             TEXT,
  route_name           TEXT,
  capacity             INT,
  status               vehicle_status NOT NULL DEFAULT 'OFFLINE',
  gps_device_id        TEXT,
  fuel_type            TEXT,
  model                TEXT,
  year                 INT,
  last_service_at      TIMESTAMPTZ,
  insurance_status     document_status NOT NULL DEFAULT 'PROCESSING',
  permit_status        document_status NOT NULL DEFAULT 'PROCESSING',
  last_lat             DOUBLE PRECISION,
  last_lng             DOUBLE PRECISION,
  last_heading         DOUBLE PRECISION,
  last_speed_kmh       DOUBLE PRECISION,
  last_update_at       TIMESTAMPTZ,
  connection_status    connection_status NOT NULL DEFAULT 'OFFLINE',
  driver_id            UUID REFERENCES drivers(id) ON DELETE SET NULL,
  owner_id             UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_vehicles_category ON vehicles(category);
CREATE INDEX idx_vehicles_status ON vehicles(status);

CREATE TABLE vehicle_locations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  latitude   DOUBLE PRECISION NOT NULL,
  longitude  DOUBLE PRECISION NOT NULL,
  speed_kmh  DOUBLE PRECISION,
  heading    DOUBLE PRECISION,
  accuracy   DOUBLE PRECISION,
  altitude   DOUBLE PRECISION,
  source     TEXT NOT NULL DEFAULT 'gps',
  timestamp  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_locations_vehicle_ts ON vehicle_locations(vehicle_id, timestamp DESC);

CREATE TABLE vehicle_documents (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name    TEXT NOT NULL,
  file_type    TEXT NOT NULL,
  size         INT NOT NULL,
  storage_url  TEXT NOT NULL,
  kind         TEXT,
  status       document_status NOT NULL DEFAULT 'PROCESSING',
  expiry_date  DATE,
  uploaded_by  UUID REFERENCES users(id),
  vehicle_id   UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  incident_id  UUID,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_docs_vehicle ON vehicle_documents(vehicle_id);
CREATE INDEX idx_docs_incident ON vehicle_documents(incident_id);

CREATE TABLE incidents (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type             incident_type NOT NULL,
  severity         incident_severity NOT NULL DEFAULT 'MEDIUM',
  status           incident_status NOT NULL DEFAULT 'OPEN',
  latitude         DOUBLE PRECISION NOT NULL,
  longitude        DOUBLE PRECISION NOT NULL,
  description      TEXT,
  plate_number     TEXT,
  plate_confidence DOUBLE PRECISION,
  vehicle_id       UUID REFERENCES vehicles(id),
  assigned_to      TEXT,
  occurred_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_severity ON incidents(severity);

ALTER TABLE vehicle_documents
  ADD CONSTRAINT fk_docs_incident FOREIGN KEY (incident_id) REFERENCES incidents(id) ON DELETE SET NULL;

CREATE TABLE evidence (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id  UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  file_name    TEXT NOT NULL,
  file_type    TEXT NOT NULL,
  storage_url  TEXT NOT NULL,
  status       evidence_status NOT NULL DEFAULT 'UPLOADED',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE ai_analyses (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evidence_id  UUID NOT NULL REFERENCES evidence(id) ON DELETE CASCADE,
  kind         TEXT NOT NULL, -- plate_ocr | vehicle_detection
  status       evidence_status NOT NULL DEFAULT 'PROCESSING',
  result_json  JSONB,
  model_name   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE road_defects (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type         TEXT NOT NULL,
  severity     incident_severity NOT NULL DEFAULT 'MEDIUM',
  confidence   DOUBLE PRECISION,
  latitude     DOUBLE PRECISION NOT NULL,
  longitude    DOUBLE PRECISION NOT NULL,
  evidence_url TEXT,
  status       report_status NOT NULL DEFAULT 'REPORTED',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE citizen_reports (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES users(id),
  description TEXT NOT NULL,
  photo_url   TEXT,
  latitude    DOUBLE PRECISION NOT NULL,
  longitude   DOUBLE PRECISION NOT NULL,
  status      report_status NOT NULL DEFAULT 'REPORTED',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE risk_zones (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  latitude   DOUBLE PRECISION NOT NULL,
  longitude  DOUBLE PRECISION NOT NULL,
  radius_m   INT NOT NULL DEFAULT 200,
  level      risk_level NOT NULL,
  score      INT NOT NULL,
  factors    JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE parking (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  latitude        DOUBLE PRECISION NOT NULL,
  longitude       DOUBLE PRECISION NOT NULL,
  capacity        INT,
  available_slots INT,
  type            TEXT,
  price_info      TEXT,
  has_ev_charging BOOLEAN NOT NULL DEFAULT false,
  occupancy_known BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE fuel_stations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  latitude   DOUBLE PRECISION NOT NULL,
  longitude  DOUBLE PRECISION NOT NULL,
  is_ev      BOOLEAN NOT NULL DEFAULT false,
  brand      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id),
  type       TEXT NOT NULL,
  title      TEXT NOT NULL,
  message    TEXT NOT NULL,
  read       BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_notif_user_read ON notifications(user_id, read);

CREATE TABLE maintenance_records (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id   UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  description  TEXT NOT NULL,
  due_at       TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE audit_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id),
  action     TEXT NOT NULL,
  entity     TEXT,
  entity_id  TEXT,
  meta_json  JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_action ON audit_logs(action);
