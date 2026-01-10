-- Migration: 005_enhance_projects_table.sql
-- Description: Add comprehensive fields to projects table for construction CRM

-- Add project type
ALTER TABLE projects ADD COLUMN project_type ENUM('residential', 'commercial', 'industrial', 'infrastructure', 'renovation', 'other') NOT NULL DEFAULT 'residential' AFTER name;

-- Client Information
ALTER TABLE projects ADD COLUMN client_name VARCHAR(200) NOT NULL DEFAULT 'Unknown Client' AFTER project_type;
ALTER TABLE projects ADD COLUMN client_contact_person VARCHAR(100) AFTER client_name;
ALTER TABLE projects ADD COLUMN client_email VARCHAR(100) AFTER client_contact_person;
ALTER TABLE projects ADD COLUMN client_phone VARCHAR(20) AFTER client_email;
ALTER TABLE projects ADD COLUMN client_address TEXT AFTER client_phone;
ALTER TABLE projects ADD COLUMN client_gst_number VARCHAR(15) AFTER client_address;
ALTER TABLE projects ADD COLUMN client_pan_number VARCHAR(10) AFTER client_gst_number;

-- Site Information (rename and enhance existing location fields)
ALTER TABLE projects CHANGE COLUMN location site_location VARCHAR(200) NOT NULL;
ALTER TABLE projects ADD COLUMN site_address TEXT AFTER site_location;
ALTER TABLE projects CHANGE COLUMN city site_city VARCHAR(100);
ALTER TABLE projects CHANGE COLUMN state site_state VARCHAR(100);
ALTER TABLE projects ADD COLUMN site_pincode VARCHAR(10) AFTER site_state;
ALTER TABLE projects ADD COLUMN site_area DECIMAL(10, 2) AFTER site_pincode;
ALTER TABLE projects ADD COLUMN site_area_unit ENUM('sqft', 'sqm', 'acre', 'hectare') DEFAULT 'sqft' AFTER site_area;
ALTER TABLE projects ADD COLUMN site_latitude VARCHAR(50) AFTER site_area_unit;
ALTER TABLE projects ADD COLUMN site_longitude VARCHAR(50) AFTER site_latitude;
ALTER TABLE projects ADD COLUMN site_engineer_id INT AFTER site_longitude;

-- Financial Information
ALTER TABLE projects ADD COLUMN contract_value DECIMAL(15, 2) AFTER site_engineer_id;
ALTER TABLE projects ADD COLUMN budget_amount DECIMAL(15, 2) AFTER contract_value;
ALTER TABLE projects ADD COLUMN payment_terms TEXT AFTER budget_amount;
ALTER TABLE projects ADD COLUMN advance_percentage DECIMAL(5, 2) AFTER payment_terms;
ALTER TABLE projects ADD COLUMN retention_percentage DECIMAL(5, 2) AFTER advance_percentage;

-- Timeline
ALTER TABLE projects ADD COLUMN start_date DATE AFTER retention_percentage;
ALTER TABLE projects ADD COLUMN expected_end_date DATE AFTER start_date;
ALTER TABLE projects ADD COLUMN actual_end_date DATE AFTER expected_end_date;
ALTER TABLE projects ADD COLUMN duration_days INT AFTER actual_end_date;

-- Design & Technical
ALTER TABLE projects ADD COLUMN architect_name VARCHAR(200) AFTER duration_days;
ALTER TABLE projects ADD COLUMN architect_contact VARCHAR(100) AFTER architect_name;
ALTER TABLE projects ADD COLUMN consultant_name VARCHAR(200) AFTER architect_contact;
ALTER TABLE projects ADD COLUMN consultant_contact VARCHAR(100) AFTER consultant_name;
ALTER TABLE projects ADD COLUMN total_floors INT AFTER consultant_contact;
ALTER TABLE projects ADD COLUMN basement_floors INT DEFAULT 0 AFTER total_floors;
ALTER TABLE projects ADD COLUMN built_up_area DECIMAL(10, 2) AFTER basement_floors;
ALTER TABLE projects ADD COLUMN carpet_area DECIMAL(10, 2) AFTER built_up_area;

-- Project Scope
ALTER TABLE projects ADD COLUMN scope_of_work TEXT AFTER carpet_area;
ALTER TABLE projects ADD COLUMN specifications TEXT AFTER scope_of_work;
ALTER TABLE projects ADD COLUMN special_requirements TEXT AFTER specifications;

-- Status & Management
ALTER TABLE projects MODIFY COLUMN status ENUM('lead', 'quotation', 'confirmed', 'design', 'mobilization', 'execution', 'completed', 'on_hold', 'cancelled') NOT NULL DEFAULT 'lead';
ALTER TABLE projects ADD COLUMN priority ENUM('low', 'medium', 'high', 'urgent') NOT NULL DEFAULT 'medium' AFTER status;
ALTER TABLE projects ADD COLUMN completion_percentage DECIMAL(5, 2) DEFAULT 0 AFTER priority;

-- Documents & Attachments
ALTER TABLE projects ADD COLUMN contract_document_path VARCHAR(500) AFTER completion_percentage;
ALTER TABLE projects ADD COLUMN drawing_folder_path VARCHAR(500) AFTER contract_document_path;
ALTER TABLE projects ADD COLUMN boq_document_path VARCHAR(500) AFTER drawing_folder_path;

-- Remarks
ALTER TABLE projects ADD COLUMN remarks TEXT AFTER boq_document_path;
ALTER TABLE projects ADD COLUMN cancellation_reason TEXT AFTER remarks;

-- System Fields
ALTER TABLE projects ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE AFTER cancellation_reason;

-- Add foreign key for site engineer
ALTER TABLE projects ADD CONSTRAINT fk_site_engineer FOREIGN KEY (site_engineer_id) REFERENCES users(id) ON DELETE SET NULL;

-- Add indexes for better performance
CREATE INDEX idx_project_type ON projects(project_type);
CREATE INDEX idx_project_status ON projects(status);
CREATE INDEX idx_project_priority ON projects(priority);
CREATE INDEX idx_client_name ON projects(client_name);
CREATE INDEX idx_site_city ON projects(site_city);
CREATE INDEX idx_site_state ON projects(site_state);
CREATE INDEX idx_is_active ON projects(is_active);
CREATE INDEX idx_start_date ON projects(start_date);
CREATE INDEX idx_expected_end_date ON projects(expected_end_date);

-- Update existing projects with default client name
UPDATE projects SET client_name = 'Existing Client' WHERE client_name IS NULL OR client_name = '';
