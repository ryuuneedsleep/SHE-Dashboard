-- =============================================================================
-- SPLD SAFETY - Neon PostgreSQL Database Schema
-- Phase 2: Backend Foundation & Neon PostgreSQL Initial Migration
-- Platform: Tugas Akhir Praktikum Pemrograman Perangkat Bergerak
-- =============================================================================

-- Enable standard pgcrypto extension for gen_random_uuid() if needed
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- 1. TABLE: admin_users
-- Single Administrator and system governance entity
-- =============================================================================
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    password_hash TEXT NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(30),
    position VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Case-insensitive unique index for admin email
CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_users_email_lower ON admin_users (LOWER(email));

-- =============================================================================
-- 2. TABLE: admin_sessions
-- Server-side session records for administrator authentication
-- =============================================================================
CREATE TABLE IF NOT EXISTS admin_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMPTZ,
    user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin_id ON admin_sessions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires_at ON admin_sessions(expires_at);

-- =============================================================================
-- 3. SEQUENCE & TABLE: findings
-- Primary K3 Safety Finding Reports
-- =============================================================================
-- Sequence for report reference numbering (used by backend generator in Phase 4)
CREATE SEQUENCE IF NOT EXISTS finding_ref_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE IF NOT EXISTS findings (
    -- Identity
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_no VARCHAR(50) NOT NULL UNIQUE,
    created_by_admin_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,

    -- Reporter Information
    reporter_name VARCHAR(100) NOT NULL,
    reporter_department VARCHAR(50) NOT NULL,
    reporter_other_department VARCHAR(100),
    reporter_section_area VARCHAR(100) NOT NULL,

    -- Finding Information
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    finding_category VARCHAR(50) NOT NULL,
    hazard_category VARCHAR(50),
    risk_level VARCHAR(20) NOT NULL,
    finding_date DATE NOT NULL,

    -- Location
    operational_area VARCHAR(100) NOT NULL,
    location_detail TEXT NOT NULL,

    -- Resolution & Lifecycle
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    corrective_action TEXT,
    due_date DATE,

    -- Metadata & Archiving
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    archived_at TIMESTAMPTZ,

    -- CHECK Constraints
    CONSTRAINT chk_findings_department CHECK (
        reporter_department IN ('Warehouse', 'IM', 'SPPM', 'SM', 'QSHE & Jiritsuka', 'Lain-lain')
    ),
    CONSTRAINT chk_findings_other_department CHECK (
        (reporter_department = 'Lain-lain' AND reporter_other_department IS NOT NULL AND TRIM(reporter_other_department) <> '')
        OR
        (reporter_department <> 'Lain-lain' AND reporter_other_department IS NULL)
    ),
    CONSTRAINT chk_findings_category CHECK (
        finding_category IN ('UNSAFE_CONDITION', 'UNSAFE_ACTION', 'IMPROVEMENT_OPPORTUNITY')
    ),
    CONSTRAINT chk_findings_hazard CHECK (
        hazard_category IS NULL OR hazard_category IN ('PHYSICAL', 'CHEMICAL', 'BIOLOGICAL', 'ERGONOMIC', 'ENVIRONMENTAL')
    ),
    CONSTRAINT chk_findings_risk_level CHECK (
        risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')
    ),
    CONSTRAINT chk_findings_status CHECK (
        status IN ('OPEN', 'IN_PROGRESS', 'CLOSED')
    )
);

-- Search and Filter Indexes for findings
CREATE INDEX IF NOT EXISTS idx_findings_reference_no ON findings(reference_no);
CREATE INDEX IF NOT EXISTS idx_findings_status ON findings(status);
CREATE INDEX IF NOT EXISTS idx_findings_risk_level ON findings(risk_level);
CREATE INDEX IF NOT EXISTS idx_findings_category ON findings(finding_category);
CREATE INDEX IF NOT EXISTS idx_findings_department ON findings(reporter_department);
CREATE INDEX IF NOT EXISTS idx_findings_operational_area ON findings(operational_area);
CREATE INDEX IF NOT EXISTS idx_findings_finding_date ON findings(finding_date DESC);
CREATE INDEX IF NOT EXISTS idx_findings_created_at ON findings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_findings_archived_at ON findings(archived_at);

-- =============================================================================
-- 4. TABLE: finding_evidence
-- Photographic Evidence metadata (Private Vercel Blob)
-- =============================================================================
CREATE TABLE IF NOT EXISTS finding_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    finding_id UUID NOT NULL REFERENCES findings(id) ON DELETE RESTRICT,
    blob_pathname TEXT NOT NULL UNIQUE,
    file_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size_bytes INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- CHECK Constraints: Format, size limit (<= 5 MB = 5,242,880 bytes)
    CONSTRAINT chk_evidence_mime_type CHECK (
        mime_type IN ('image/jpeg', 'image/png', 'image/webp')
    ),
    CONSTRAINT chk_evidence_file_size CHECK (
        file_size_bytes > 0 AND file_size_bytes <= 5242880
    )
);

CREATE INDEX IF NOT EXISTS idx_finding_evidence_finding_id ON finding_evidence(finding_id);

-- =============================================================================
-- 5. TABLE: finding_status_history
-- Audit log of finding status lifecycle transitions
-- =============================================================================
CREATE TABLE IF NOT EXISTS finding_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    finding_id UUID NOT NULL REFERENCES findings(id) ON DELETE RESTRICT,
    old_status VARCHAR(20),
    new_status VARCHAR(20) NOT NULL,
    note TEXT,
    changed_by_admin_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- CHECK Constraints
    CONSTRAINT chk_history_old_status CHECK (
        old_status IS NULL OR old_status IN ('OPEN', 'IN_PROGRESS', 'CLOSED')
    ),
    CONSTRAINT chk_history_new_status CHECK (
        new_status IN ('OPEN', 'IN_PROGRESS', 'CLOSED')
    )
);

CREATE INDEX IF NOT EXISTS idx_finding_status_history_finding_id ON finding_status_history(finding_id);

-- =============================================================================
-- 6. TRIGGERS: Automatic updated_at timestamp maintenance
-- =============================================================================
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_admin_users_updated_at ON admin_users;
CREATE TRIGGER trg_admin_users_updated_at
BEFORE UPDATE ON admin_users
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS trg_findings_updated_at ON findings;
CREATE TRIGGER trg_findings_updated_at
BEFORE UPDATE ON findings
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();
