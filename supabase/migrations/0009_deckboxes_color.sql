-- Ajout de la couleur sur les deckboxes (si la table existe déjà sans cette colonne).
ALTER TABLE deckboxes ADD COLUMN IF NOT EXISTS color VARCHAR(7) NOT NULL DEFAULT '#6366f1';
