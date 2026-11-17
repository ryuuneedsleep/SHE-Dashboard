-- =============================================================================
-- SPLD SAFETY - Migration 001: Phase 2.1 Schema Alignment
-- Forward-only, non-destructive migration matching Blueprint Final
-- =============================================================================

-- 1. Ensure admin_users has is_active flag
ALTER TABLE admin_users 
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- 2. Ensure case-insensitive unique index for admin email
CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_users_email_lower ON admin_users (LOWER(email));

-- 3. Update Foreign Key on finding_evidence to prevent accidental cascade deletion
ALTER TABLE finding_evidence 
  DROP CONSTRAINT IF EXISTS finding_evidence_finding_id_fkey;

ALTER TABLE finding_evidence 
  ADD CONSTRAINT finding_evidence_finding_id_fkey 
  FOREIGN KEY (finding_id) REFERENCES findings(id) ON DELETE RESTRICT;

-- 4. Update Foreign Key on finding_status_history to prevent accidental cascade deletion
ALTER TABLE finding_status_history 
  DROP CONSTRAINT IF EXISTS finding_status_history_finding_id_fkey;

ALTER TABLE finding_status_history 
  ADD CONSTRAINT finding_status_history_finding_id_fkey 
  FOREIGN KEY (finding_id) REFERENCES findings(id) ON DELETE RESTRICT;
