-- Add optional selling price (in user's preferred currency).
ALTER TABLE binder_cards
  ADD COLUMN IF NOT EXISTS selling_price NUMERIC(10, 2);
