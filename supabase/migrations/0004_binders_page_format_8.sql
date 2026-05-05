ALTER TABLE binders DROP CONSTRAINT IF EXISTS binders_page_format_check;
ALTER TABLE binders ADD CONSTRAINT binders_page_format_check CHECK (page_format IN (4, 8, 9, 12));
