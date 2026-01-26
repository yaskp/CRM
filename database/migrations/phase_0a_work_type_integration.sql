-- Phase 0A: Work Type Integration
-- Link work_item_types master across all modules

-- 1. Add work_item_type_id to quotation_items (if not exists)
ALTER TABLE quotation_items 
ADD COLUMN work_item_type_id INT NULL AFTER item_type,
ADD CONSTRAINT fk_quotation_items_work_type 
  FOREIGN KEY (work_item_type_id) REFERENCES work_item_types(id) ON DELETE SET NULL;

-- 2. Add work_item_type_id to work_order_items (if not exists)
ALTER TABLE work_order_items 
ADD COLUMN work_item_type_id INT NULL AFTER item_type,
ADD CONSTRAINT fk_work_order_items_work_type 
  FOREIGN KEY (work_item_type_id) REFERENCES work_item_types(id) ON DELETE SET NULL;

-- 3. Add work_item_type_id to daily_progress_reports
ALTER TABLE daily_progress_reports 
ADD COLUMN work_item_type_id INT NULL AFTER remarks,
ADD CONSTRAINT fk_dpr_work_type 
  FOREIGN KEY (work_item_type_id) REFERENCES work_item_types(id) ON DELETE SET NULL;

-- 4. Add work_item_type_id to purchase_order_items
ALTER TABLE purchase_order_items 
ADD COLUMN work_item_type_id INT NULL AFTER material_id,
ADD CONSTRAINT fk_po_items_work_type 
  FOREIGN KEY (work_item_type_id) REFERENCES work_item_types(id) ON DELETE SET NULL;

-- 5. Create index for better performance
CREATE INDEX idx_quotation_items_work_type ON quotation_items(work_item_type_id);
CREATE INDEX idx_work_order_items_work_type ON work_order_items(work_item_type_id);
CREATE INDEX idx_dpr_work_type ON daily_progress_reports(work_item_type_id);
CREATE INDEX idx_po_items_work_type ON purchase_order_items(work_item_type_id);

-- 6. Update existing data to link work types based on item_type field
-- For quotation_items
UPDATE quotation_items qi
JOIN work_item_types wit ON qi.item_type = wit.name
SET qi.work_item_type_id = wit.id
WHERE qi.work_item_type_id IS NULL;

-- For work_order_items  
UPDATE work_order_items woi
JOIN work_item_types wit ON woi.item_type = wit.name
SET woi.work_item_type_id = wit.id
WHERE woi.work_item_type_id IS NULL;

-- 7. Add comments for documentation
ALTER TABLE quotation_items MODIFY COLUMN work_item_type_id INT NULL 
  COMMENT 'Links to work_item_types master for consistent categorization';
  
ALTER TABLE work_order_items MODIFY COLUMN work_item_type_id INT NULL 
  COMMENT 'Links to work_item_types master for consistent categorization';
  
ALTER TABLE daily_progress_reports MODIFY COLUMN work_item_type_id INT NULL 
  COMMENT 'Links to work_item_types master for work type tracking';
  
ALTER TABLE purchase_order_items MODIFY COLUMN work_item_type_id INT NULL 
  COMMENT 'Links to work_item_types master for material categorization';
