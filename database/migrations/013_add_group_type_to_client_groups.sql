-- Update client_groups table to add group_type field

-- Add group_type column to client_groups
ALTER TABLE client_groups
ADD COLUMN group_type ENUM('corporate', 'sme', 'government', 'individual', 'retail') DEFAULT 'corporate' AFTER group_name;

-- Update existing groups with appropriate types
UPDATE client_groups SET group_type = 'corporate' WHERE group_name IN ('Rajhans Group', 'Adani Group', 'Tata Projects', 'L&T Construction');
UPDATE client_groups SET group_type = 'sme' WHERE group_name = 'Raghuver Group';

-- Clear and insert fresh examples
TRUNCATE TABLE client_groups;

INSERT INTO client_groups (group_name, group_type, description) VALUES
('Rajhans Infrastructure', 'corporate', 'Large corporate construction group'),
('Adani Group', 'corporate', 'Adani infrastructure and construction'),
('Raghuver Developers', 'sme', 'Small and medium enterprise'),
('Gujarat Government PWD', 'government', 'Public Works Department'),
('Tata Projects', 'corporate', 'Tata Group construction division');
