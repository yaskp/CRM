-- Remove redundant client fields from project_details table
-- These fields are now handled by the clients table via client_id in projects

ALTER TABLE project_details
DROP COLUMN client_name,
DROP COLUMN client_contact_person,
DROP COLUMN client_email,
DROP COLUMN client_phone,
DROP COLUMN client_address,
DROP COLUMN client_gst_number,
DROP COLUMN client_pan_number;

-- Verify the changes
SELECT COLUMN_NAME 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'project_details'
ORDER BY ORDINAL_POSITION;
