-- Deckboxes : collections plates de cartes sans organisation par pages/slots.

CREATE TABLE deckboxes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT NOT NULL,
  name        VARCHAR(100) NOT NULL,
  description TEXT,
  color       VARCHAR(7) NOT NULL DEFAULT '#6366f1',
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE deckbox_cards (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deckbox_id    UUID NOT NULL REFERENCES deckboxes(id) ON DELETE CASCADE,
  user_id       TEXT NOT NULL,
  card_id       TEXT NOT NULL,
  game          VARCHAR(50) NOT NULL,
  quantity      INT NOT NULL DEFAULT 1 CHECK (quantity >= 1),
  condition     VARCHAR(20),
  is_foil       BOOLEAN NOT NULL DEFAULT false,
  notes         TEXT,
  selling_price NUMERIC(10,2),
  added_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE deckboxes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE deckbox_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_deckboxes" ON deckboxes
  USING (user_id = auth.jwt() ->> 'sub')
  WITH CHECK (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "users_own_deckbox_cards" ON deckbox_cards
  USING (user_id = auth.jwt() ->> 'sub')
  WITH CHECK (user_id = auth.jwt() ->> 'sub');
