-- Public sharing: revokable token per binder.
-- Idempotent: safe to re-run.

ALTER TABLE binders
  ADD COLUMN IF NOT EXISTS share_token TEXT;

DO $$ BEGIN
  CREATE UNIQUE INDEX idx_binders_share_token
    ON binders(share_token)
    WHERE share_token IS NOT NULL;
EXCEPTION WHEN duplicate_table THEN NULL; END $$;
