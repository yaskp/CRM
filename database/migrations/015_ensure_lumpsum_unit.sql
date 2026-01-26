-- Migration: Ensure Lump Sum Unit exists
-- Purpose: Add LS unit if missing for work template and quotation fallbacks

INSERT IGNORE INTO units (name, code, is_active) 
VALUES ('Lump Sum', 'LS', true);
