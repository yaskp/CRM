ALTER TABLE store_transactions 
ADD COLUMN grabbing_depth DECIMAL(10, 2) NULL,
ADD COLUMN grabbing_sqm DECIMAL(10, 2) NULL,
ADD COLUMN concreting_depth DECIMAL(10, 2) NULL,
ADD COLUMN concreting_sqm DECIMAL(10, 2) NULL;
