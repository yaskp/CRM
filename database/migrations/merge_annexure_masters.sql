-- Migration: Merge PO Terms Master into Annexure Master
-- Purpose: Unify all contract/document terms into a single "Annexure Master"

-- 1. Add PO-specific columns to annexures table
ALTER TABLE annexures 
ADD COLUMN payment_terms TEXT NULL,
ADD COLUMN delivery_terms TEXT NULL,
ADD COLUMN quality_terms TEXT NULL,
ADD COLUMN warranty_terms TEXT NULL,
ADD COLUMN penalty_clause TEXT NULL;

-- 2. Update type enum in annexures
ALTER TABLE annexures MODIFY COLUMN type ENUM('client_scope', 'contractor_scope', 'payment_terms', 'general_terms', 'purchase_order') DEFAULT 'general_terms';

-- 3. Prepare for data transfer
ALTER TABLE annexures ADD COLUMN _old_po_terms_id INT NULL;

-- 4. Transfer existing PO Terms data to Annexures
INSERT INTO annexures (name, description, payment_terms, delivery_terms, quality_terms, warranty_terms, penalty_clause, type, is_active, created_at, updated_at, _old_po_terms_id)
SELECT name, description, payment_terms, delivery_terms, quality_terms, warranty_terms, penalty_clause, 'purchase_order', is_active, created_at, updated_at, id
FROM po_terms_master;

-- 5. Update Purchase Orders to reference Annexures
UPDATE purchase_orders po
JOIN annexures a ON po.terms_master_id = a._old_po_terms_id
SET po.terms_master_id = a.id
WHERE po.terms_master_id IS NOT NULL;

-- 6. Cleanup old reference column (actually we'll rename it in the next step to annexure_id)
ALTER TABLE purchase_orders CHANGE COLUMN terms_master_id annexure_id INT NULL;

-- 7. Cleanup
ALTER TABLE annexures DROP COLUMN _old_po_terms_id;
-- DROP TABLE po_terms_master; -- Disabled for safety, but can be done manually
