-- Run this script to apply the username migration
-- You can run this in MySQL Workbench, phpMyAdmin, or command line

USE crm_construction;

-- Check if username column already exists
SELECT COUNT(*) as column_exists
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'crm_construction'
  AND TABLE_NAME = 'users'
  AND COLUMN_NAME = 'username';

-- If the above returns 0, run the following:

-- Add username column if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS username VARCHAR(50) UNIQUE AFTER employee_id;

-- Make email optional
ALTER TABLE users 
MODIFY COLUMN email VARCHAR(100) NULL;

-- Verify the changes
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_KEY
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'crm_construction'
  AND TABLE_NAME = 'users'
ORDER BY ORDINAL_POSITION;
