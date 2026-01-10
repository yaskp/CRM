-- Migration: 002_create_vendor_types_table.sql
-- Description: Create vendor_types table and migrate existing vendor types

-- Create vendor_types table
CREATE TABLE IF NOT EXISTS vendor_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_code (code),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default vendor types
INSERT INTO vendor_types (name, code, description) VALUES
('Steel Contractor', 'STEEL', 'Contractors specializing in steel work and fabrication'),
('Concrete Contractor', 'CONCRETE', 'Contractors for concrete work and RMC supply'),
('Rig Vendor', 'RIG', 'Suppliers of construction rigs and drilling equipment'),
('Crane Vendor', 'CRANE', 'Crane rental and operation services'),
('JCB Vendor', 'JCB', 'JCB and earthmoving equipment suppliers'),
('Other', 'OTHER', 'Other types of vendors')
ON DUPLICATE KEY UPDATE name=name;

-- Add vendor_type_id column to vendors table
ALTER TABLE vendors 
ADD COLUMN vendor_type_id INT NULL AFTER vendor_type,
ADD CONSTRAINT fk_vendor_type 
    FOREIGN KEY (vendor_type_id) 
    REFERENCES vendor_types(id)
    ON DELETE SET NULL;

-- Migrate existing vendor_type enum values to vendor_type_id
UPDATE vendors v
INNER JOIN vendor_types vt ON (
    (v.vendor_type = 'steel_contractor' AND vt.code = 'STEEL') OR
    (v.vendor_type = 'concrete_contractor' AND vt.code = 'CONCRETE') OR
    (v.vendor_type = 'rig_vendor' AND vt.code = 'RIG') OR
    (v.vendor_type = 'crane_vendor' AND vt.code = 'CRANE') OR
    (v.vendor_type = 'jcb_vendor' AND vt.code = 'JCB') OR
    (v.vendor_type = 'other' AND vt.code = 'OTHER')
)
SET v.vendor_type_id = vt.id;

-- Note: Keep vendor_type column for now for backward compatibility
-- It can be removed in a future migration after all code is updated
