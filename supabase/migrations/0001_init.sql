-- Initial schema: binders, binder_cards, user_settings + RLS policies.
-- Idempotent: safe to re-run.

CREATE TABLE IF NOT EXISTS binders (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT NOT NULL,
  name        VARCHAR(100) NOT NULL,
  description TEXT,
  color       VARCHAR(7) NOT NULL,
  page_format INT NOT NULL CHECK (page_format IN (4, 9, 12)),
  cover_image TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS binder_cards (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  binder_id   UUID REFERENCES binders(id) ON DELETE CASCADE,
  user_id     TEXT NOT NULL,
  card_id     TEXT NOT NULL,
  game        VARCHAR(50) NOT NULL,
  page_number INT NOT NULL DEFAULT 1,
  slot        INT NOT NULL,
  quantity    INT NOT NULL DEFAULT 1,
  condition   VARCHAR(20),
  is_foil     BOOLEAN DEFAULT false,
  notes       TEXT,
  added_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE (binder_id, page_number, slot)
);

CREATE TABLE IF NOT EXISTS user_settings (
  user_id      TEXT PRIMARY KEY,
  default_game VARCHAR(50) DEFAULT 'pokemon',
  theme        VARCHAR(20) DEFAULT 'light',
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE binders        ENABLE ROW LEVEL SECURITY;
ALTER TABLE binder_cards   ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings  ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "users_own_binders" ON binders
    USING (user_id = auth.jwt() ->> 'sub')
    WITH CHECK (user_id = auth.jwt() ->> 'sub');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "users_own_cards" ON binder_cards
    USING (user_id = auth.jwt() ->> 'sub')
    WITH CHECK (user_id = auth.jwt() ->> 'sub');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "users_own_settings" ON user_settings
    USING (user_id = auth.jwt() ->> 'sub')
    WITH CHECK (user_id = auth.jwt() ->> 'sub');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
