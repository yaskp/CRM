-- Phase 0A: Work Type Integration (Safe Migration)
-- Link work_item_types master across all modules
-- This migration safely adds columns only if they don't exist

-- Helper procedure to add column if not exists
DELIMITER $$

CREATE PROCEDURE AddColumnIfNotExists(
    IN tableName VARCHAR(100),
    IN columnName VARCHAR(100),
    IN columnDefinition TEXT
)
BEGIN
    DECLARE columnExists INT;
    
    SELECT COUNT(*) INTO columnExists
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = tableName
    AND COLUMN_NAME = columnName;
    
    IF columnExists = 0 THEN
        SET @sql = CONCAT('ALTER TABLE `', tableName, '` ADD COLUMN `', columnName, '` ', columnDefinition);
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
        SELECT CONCAT('✅ Added column ', columnName, ' to ', tableName) AS Result;
    ELSE
        SELECT CONCAT('⏭️  Column ', columnName, ' already exists in ', tableName) AS Result;
    END IF;
END$$

DELIMITER ;

-- 1. Add work_item_type_id to quotation_items
CALL AddColumnIfNotExists('quotation_items', 'work_item_type_id', 
    'INT NULL AFTER item_type, ADD CONSTRAINT fk_quotation_items_work_type FOREIGN KEY (work_item_type_id) REFERENCES work_item_types(id) ON DELETE SET NULL');

-- 2. Add work_item_type_id to work_order_items
CALL AddColumnIfNotExists('work_order_items', 'work_item_type_id', 
    'INT NULL AFTER category, ADD CONSTRAINT fk_work_order_items_work_type FOREIGN KEY (work_item_type_id) REFERENCES work_item_types(id) ON DELETE SET NULL');

-- 3. Add work_item_type_id to daily_progress_reports
CALL AddColumnIfNotExists('daily_progress_reports', 'work_item_type_id', 
    'INT NULL AFTER remarks, ADD CONSTRAINT fk_dpr_work_type FOREIGN KEY (work_item_type_id) REFERENCES work_item_types(id) ON DELETE SET NULL');

-- 4. Add work_item_type_id to purchase_order_items
CALL AddColumnIfNotExists('purchase_order_items', 'work_item_type_id', 
    'INT NULL AFTER material_id, ADD CONSTRAINT fk_po_items_work_type FOREIGN KEY (work_item_type_id) REFERENCES work_item_types(id) ON DELETE SET NULL');

-- 5. Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_quotation_items_work_type ON quotation_items(work_item_type_id);
CREATE INDEX IF NOT EXISTS idx_work_order_items_work_type ON work_order_items(work_item_type_id);
CREATE INDEX IF NOT EXISTS idx_dpr_work_type ON daily_progress_reports(work_item_type_id);
CREATE INDEX IF NOT EXISTS idx_po_items_work_type ON purchase_order_items(work_item_type_id);

-- 6. Update existing data to link work types based on item_type field
-- For quotation_items (only where not already set)
UPDATE quotation_items qi
JOIN work_item_types wit ON qi.item_type = wit.name
SET qi.work_item_type_id = wit.id
WHERE qi.work_item_type_id IS NULL;

-- For work_order_items (only where not already set)
UPDATE work_order_items woi
JOIN work_item_types wit ON woi.item_type = wit.name
SET woi.work_item_type_id = wit.id
WHERE woi.work_item_type_id IS NULL;

-- Clean up procedure
DROP PROCEDURE IF EXISTS AddColumnIfNotExists;

SELECT '✅ Phase 0A Migration Completed!' AS Status;
