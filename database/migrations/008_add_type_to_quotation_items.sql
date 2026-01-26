ALTER TABLE quotation_items ADD COLUMN item_type VARCHAR(50) DEFAULT 'material';
ALTER TABLE quotation_items ADD COLUMN reference_id INT NULL;
