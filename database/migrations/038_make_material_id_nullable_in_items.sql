-- Migration: Make material_id nullable in store_transaction_items
-- This allows logging activities (quotation items) that may not be linked to physical inventory.

ALTER TABLE store_transaction_items MODIFY material_id INT NULL;
