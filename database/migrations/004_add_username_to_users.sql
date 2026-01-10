-- Add username column to users table
ALTER TABLE users ADD COLUMN username VARCHAR(50) UNIQUE AFTER employee_id;

-- Update existing users to have username same as employee_id
UPDATE users SET username = employee_id WHERE username IS NULL;

-- Make username NOT NULL after populating
ALTER TABLE users MODIFY COLUMN username VARCHAR(50) NOT NULL;
