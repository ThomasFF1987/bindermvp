-- Private user-to-user messaging with inbox / important / trash.
-- Idempotent: safe to re-run.

CREATE TABLE IF NOT EXISTS messages (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id    TEXT NOT NULL,
  recipient_id TEXT NOT NULL,
  subject      VARCHAR(200),
  body         TEXT NOT NULL,
  is_important BOOLEAN NOT NULL DEFAULT false,
  read_at      TIMESTAMPTZ,
  deleted_at   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_recipient
  ON messages(recipient_id, deleted_at, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_trash_purge
  ON messages(deleted_at)
  WHERE deleted_at IS NOT NULL;

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "messages_select" ON messages FOR SELECT
    USING (recipient_id = auth.jwt() ->> 'sub' OR sender_id = auth.jwt() ->> 'sub');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "messages_insert" ON messages FOR INSERT
    WITH CHECK (sender_id = auth.jwt() ->> 'sub');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "messages_update" ON messages FOR UPDATE
    USING (recipient_id = auth.jwt() ->> 'sub')
    WITH CHECK (recipient_id = auth.jwt() ->> 'sub');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "messages_delete" ON messages FOR DELETE
    USING (recipient_id = auth.jwt() ->> 'sub');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
