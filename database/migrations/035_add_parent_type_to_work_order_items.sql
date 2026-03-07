-- Migration: Add parent_work_item_type_id and reference_id to work_order_items
ALTER TABLE work_order_items 
ADD COLUMN parent_work_item_type_id INT NULL AFTER item_type,
ADD COLUMN reference_id INT NULL AFTER parent_work_item_type_id,
ADD CONSTRAINT fk_work_order_items_parent_type 
FOREIGN KEY (parent_work_item_type_id) REFERENCES work_item_types(id);
