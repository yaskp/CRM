-- Fix client_groups data: Update existing records instead of truncating

-- First, disable foreign key checks temporarily
SET FOREIGN_KEY_CHECKS = 0;

-- Clear all existing data
TRUNCATE TABLE client_groups;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Insert proper company groups with correct names and types
INSERT INTO client_groups (group_name, group_type, description) VALUES
('Rajhans Infrastructure', 'corporate', 'Rajhans Group - Large infrastructure and construction company'),
('Raghuver Developers', 'sme', 'Raghuver Group - Small and medium enterprise in real estate'),
('Adani Infrastructure', 'corporate', 'Adani Group - Large corporate infrastructure division'),
('Tata Projects', 'corporate', 'Tata Group - Construction and infrastructure projects'),
('L&T Construction', 'corporate', 'Larsen & Toubro - Engineering and construction'),
('Gujarat Government PWD', 'government', 'Public Works Department - Government organization'),
('Shapoorji Pallonji', 'corporate', 'Shapoorji Pallonji Group - Construction and engineering'),
('Ambuja Realty', 'sme', 'Ambuja Group - Real estate and construction'),
('Individual Clients', 'individual', 'Individual homeowners and private clients'),
('Retail Customers', 'retail', 'Small retail construction customers');

-- Verify the data
SELECT id, group_name, group_type, description FROM client_groups ORDER BY group_type, group_name;
