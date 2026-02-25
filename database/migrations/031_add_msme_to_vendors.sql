-- Add MSME fields to vendors table
ALTER TABLE vendors ADD COLUMN is_msme BOOLEAN DEFAULT FALSE;
ALTER TABLE vendors ADD COLUMN msme_number VARCHAR(100);
ALTER TABLE vendors ADD COLUMN msme_category VARCHAR(50);
