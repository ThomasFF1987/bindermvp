-- Atomic move/swap for binder_cards.
-- Moves a card to (p_to_page, p_to_slot). If that location is occupied by
-- another card in the same binder, swaps the two cards in a single
-- transaction using a temporary sentinel position to dodge the
-- (binder_id, page_number, slot) unique constraint.

CREATE OR REPLACE FUNCTION move_binder_card(
  p_card_id UUID,
  p_to_page INT,
  p_to_slot INT
)
RETURNS TABLE (moved_id UUID, swapped_id UUID)
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_binder_id  UUID;
  v_from_page  INT;
  v_from_slot  INT;
  v_other_id   UUID;
  v_tmp_page   INT;
  v_tmp_slot   INT;
BEGIN
  SELECT binder_id, page_number, slot
    INTO v_binder_id, v_from_page, v_from_slot
    FROM binder_cards
    WHERE id = p_card_id;

  IF v_binder_id IS NULL THEN
    RAISE EXCEPTION 'card_not_found';
  END IF;

  -- No-op
  IF v_from_page = p_to_page AND v_from_slot = p_to_slot THEN
    RETURN QUERY SELECT p_card_id, NULL::UUID;
    RETURN;
  END IF;

  SELECT id INTO v_other_id
    FROM binder_cards
    WHERE binder_id = v_binder_id
      AND page_number = p_to_page
      AND slot = p_to_slot;

  IF v_other_id IS NULL THEN
    UPDATE binder_cards
       SET page_number = p_to_page, slot = p_to_slot
     WHERE id = p_card_id;
    RETURN QUERY SELECT p_card_id, NULL::UUID;
    RETURN;
  END IF;

  -- Park the displaced card at a sentinel position (negative values never
  -- collide with real slots) so the unique constraint stays satisfied.
  v_tmp_page := -1;
  v_tmp_slot := -1;

  UPDATE binder_cards
     SET page_number = v_tmp_page, slot = v_tmp_slot
   WHERE id = v_other_id;

  UPDATE binder_cards
     SET page_number = p_to_page, slot = p_to_slot
   WHERE id = p_card_id;

  UPDATE binder_cards
     SET page_number = v_from_page, slot = v_from_slot
   WHERE id = v_other_id;

  RETURN QUERY SELECT p_card_id, v_other_id;
END;
$$;
