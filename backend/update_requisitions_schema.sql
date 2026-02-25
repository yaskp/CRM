-- Update Material Requisitions table for new workflow
-- Make from_warehouse_id nullable
ALTER TABLE material_requisitions MODIFY COLUMN from_warehouse_id INT NULL;

-- Add purpose field
ALTER TABLE material_requisitions ADD COLUMN IF NOT EXISTS purpose TEXT NULL;

-- Add remarks field
ALTER TABLE material_requisitions ADD COLUMN IF NOT EXISTS remarks TEXT NULL;
