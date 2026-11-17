-- =============================================================================
-- SPLD SAFETY - Migration 002: Schema Contract Alignment
-- Blueprint Final Verification & Idempotent Contract Alignment
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. TABLE: admin_users Alignment
-- -----------------------------------------------------------------------------
DO $$
BEGIN
    -- Ensure is_active column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'admin_users' AND column_name = 'is_active'
    ) THEN
        ALTER TABLE admin_users ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;
    END IF;

    -- Ensure case-insensitive unique index exists on LOWER(email)
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'public' AND tablename = 'admin_users' AND indexname = 'idx_admin_users_email_lower'
    ) THEN
        CREATE UNIQUE INDEX idx_admin_users_email_lower ON admin_users (LOWER(email));
    END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 2. TABLE: admin_sessions Alignment
-- -----------------------------------------------------------------------------
DO $$
BEGIN
    -- Rename user_id to admin_id if legacy column exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'admin_sessions' AND column_name = 'user_id'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'admin_sessions' AND column_name = 'admin_id'
    ) THEN
        ALTER TABLE admin_sessions RENAME COLUMN user_id TO admin_id;
    END IF;

    -- Ensure foreign key constraint references admin_users(id) ON DELETE CASCADE
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_schema = 'public' AND table_name = 'admin_sessions' AND constraint_name = 'admin_sessions_admin_id_fkey'
    ) THEN
        ALTER TABLE admin_sessions 
        ADD CONSTRAINT admin_sessions_admin_id_fkey 
        FOREIGN KEY (admin_id) REFERENCES admin_users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 3. TABLE: findings Alignment
-- -----------------------------------------------------------------------------
DO $$
BEGIN
    -- A. Migrate reporter_section -> reporter_section_area if legacy column exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'findings' AND column_name = 'reporter_section'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'findings' AND column_name = 'reporter_section_area'
    ) THEN
        ALTER TABLE findings RENAME COLUMN reporter_section TO reporter_section_area;
    END IF;

    -- B. Ensure reporter_section_area exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'findings' AND column_name = 'reporter_section_area'
    ) THEN
        ALTER TABLE findings ADD COLUMN reporter_section_area VARCHAR(100) NOT NULL DEFAULT 'General';
    END IF;

    -- C. Migrate is_archived (boolean) -> archived_at (timestamptz) if legacy column exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'findings' AND column_name = 'is_archived'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'findings' AND column_name = 'archived_at'
        ) THEN
            ALTER TABLE findings ADD COLUMN archived_at TIMESTAMPTZ;
            -- Safe data migration without losing archival flag
            UPDATE findings SET archived_at = updated_at WHERE is_archived = TRUE;
        END IF;
        ALTER TABLE findings DROP COLUMN is_archived;
    END IF;

    -- D. Ensure archived_at exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'findings' AND column_name = 'archived_at'
    ) THEN
        ALTER TABLE findings ADD COLUMN archived_at TIMESTAMPTZ;
    END IF;

    -- E. Ensure closed_at exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'findings' AND column_name = 'closed_at'
    ) THEN
        ALTER TABLE findings ADD COLUMN closed_at TIMESTAMPTZ;
    END IF;

    -- F. Ensure created_by_admin_id exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'findings' AND column_name = 'created_by_admin_id'
    ) THEN
        ALTER TABLE findings ADD COLUMN created_by_admin_id UUID REFERENCES admin_users(id) ON DELETE SET NULL;
    END IF;

    -- G. Ensure index on archived_at exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'public' AND tablename = 'findings' AND indexname = 'idx_findings_archived_at'
    ) THEN
        CREATE INDEX idx_findings_archived_at ON findings(archived_at);
    END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 4. TABLE: finding_evidence Alignment
-- -----------------------------------------------------------------------------
DO $$
BEGIN
    -- A. Migrate file_url -> blob_pathname if legacy column exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'finding_evidence' AND column_name = 'file_url'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'finding_evidence' AND column_name = 'blob_pathname'
    ) THEN
        ALTER TABLE finding_evidence RENAME COLUMN file_url TO blob_pathname;
    END IF;

    -- B. Migrate file_pathname -> blob_pathname if legacy column exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'finding_evidence' AND column_name = 'file_pathname'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'finding_evidence' AND column_name = 'blob_pathname'
    ) THEN
        ALTER TABLE finding_evidence RENAME COLUMN file_pathname TO blob_pathname;
    END IF;

    -- C. Migrate uploaded_at -> created_at if legacy column exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'finding_evidence' AND column_name = 'uploaded_at'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'finding_evidence' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE finding_evidence RENAME COLUMN uploaded_at TO created_at;
    END IF;

    -- D. Ensure Foreign Key is ON DELETE RESTRICT (prevent accidental cascade)
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_schema = 'public' AND table_name = 'finding_evidence' AND constraint_name = 'finding_evidence_finding_id_fkey'
    ) THEN
        ALTER TABLE finding_evidence DROP CONSTRAINT finding_evidence_finding_id_fkey;
    END IF;

    ALTER TABLE finding_evidence 
    ADD CONSTRAINT finding_evidence_finding_id_fkey 
    FOREIGN KEY (finding_id) REFERENCES findings(id) ON DELETE RESTRICT;

    -- E. Ensure unique constraint on blob_pathname
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_schema = 'public' AND table_name = 'finding_evidence' AND constraint_name = 'finding_evidence_blob_pathname_key'
    ) THEN
        ALTER TABLE finding_evidence ADD CONSTRAINT finding_evidence_blob_pathname_key UNIQUE (blob_pathname);
    END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 5. TABLE: finding_status_history Alignment
-- -----------------------------------------------------------------------------
DO $$
BEGIN
    -- A. Migrate from_status -> old_status
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'finding_status_history' AND column_name = 'from_status'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'finding_status_history' AND column_name = 'old_status'
    ) THEN
        ALTER TABLE finding_status_history RENAME COLUMN from_status TO old_status;
    END IF;

    -- B. Migrate to_status -> new_status
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'finding_status_history' AND column_name = 'to_status'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'finding_status_history' AND column_name = 'new_status'
    ) THEN
        ALTER TABLE finding_status_history RENAME COLUMN to_status TO new_status;
    END IF;

    -- C. Migrate changed_by_user_id -> changed_by_admin_id
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'finding_status_history' AND column_name = 'changed_by_user_id'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'finding_status_history' AND column_name = 'changed_by_admin_id'
    ) THEN
        ALTER TABLE finding_status_history RENAME COLUMN changed_by_user_id TO changed_by_admin_id;
    END IF;

    -- D. Migrate notes -> note
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'finding_status_history' AND column_name = 'notes'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'finding_status_history' AND column_name = 'note'
    ) THEN
        ALTER TABLE finding_status_history RENAME COLUMN notes TO note;
    END IF;

    -- E. Ensure Foreign Key is ON DELETE RESTRICT (prevent accidental cascade)
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_schema = 'public' AND table_name = 'finding_status_history' AND constraint_name = 'finding_status_history_finding_id_fkey'
    ) THEN
        ALTER TABLE finding_status_history DROP CONSTRAINT finding_status_history_finding_id_fkey;
    END IF;

    ALTER TABLE finding_status_history 
    ADD CONSTRAINT finding_status_history_finding_id_fkey 
    FOREIGN KEY (finding_id) REFERENCES findings(id) ON DELETE RESTRICT;

    -- F. Ensure check constraints on status values
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_schema = 'public' AND table_name = 'finding_status_history' AND constraint_name = 'chk_history_new_status'
    ) THEN
        ALTER TABLE finding_status_history 
        ADD CONSTRAINT chk_history_new_status CHECK (new_status IN ('OPEN', 'IN_PROGRESS', 'CLOSED'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_schema = 'public' AND table_name = 'finding_status_history' AND constraint_name = 'chk_history_old_status'
    ) THEN
        ALTER TABLE finding_status_history 
        ADD CONSTRAINT chk_history_old_status CHECK (old_status IS NULL OR old_status IN ('OPEN', 'IN_PROGRESS', 'CLOSED'));
    END IF;
END $$;

COMMIT;
