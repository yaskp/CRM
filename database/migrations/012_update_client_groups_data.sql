-- Update client_groups table to better reflect company groups
-- Rename description to notes for better clarity

-- Clear existing default groups
TRUNCATE TABLE client_groups;

-- Insert real company group examples
INSERT INTO client_groups (group_name, description) VALUES
('Rajhans Group', 'Rajhans Infrastructure and Construction'),
('Raghuver Group', 'Raghuver Developers'),
('Adani Group', 'Adani Infrastructure'),
('Tata Projects', 'Tata Group Construction Division'),
('L&T Construction', 'Larsen & Toubro Construction');

-- Note: client_group represents the parent company/organization
-- Each client under a group represents a specific site/project location
