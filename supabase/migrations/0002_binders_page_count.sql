-- Persist user-added page count on binders. Cards' page_number can equal page_count.
ALTER TABLE binders
  ADD COLUMN IF NOT EXISTS page_count INT NOT NULL DEFAULT 1 CHECK (page_count >= 1);
