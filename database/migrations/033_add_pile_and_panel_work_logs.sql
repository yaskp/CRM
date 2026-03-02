
ALTER TABLE store_transactions 
ADD COLUMN overbreak_percentage DECIMAL(10, 2) NULL,
ADD COLUMN pile_work_logs JSON NULL,
ADD COLUMN panel_work_logs JSON NULL;
