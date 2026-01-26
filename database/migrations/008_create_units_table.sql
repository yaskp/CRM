-- Migration: Units Master Table
-- Purpose: Store all measurement units used in the system

CREATE TABLE IF NOT EXISTS units (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL UNIQUE,
    base_unit_id INT NULL,
    conversion_factor DECIMAL(10, 4) DEFAULT 1.0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (base_unit_id) REFERENCES units(id) ON DELETE SET NULL
);

-- Insert common units
INSERT INTO units (name, code, base_unit_id, conversion_factor) VALUES
-- Length
('Meter', 'm', NULL, 1.0),
('Running Meter', 'RMT', 1, 1.0),
('Centimeter', 'cm', 1, 0.01),
('Millimeter', 'mm', 1, 0.001),
('Kilometer', 'km', 1, 1000.0),

-- Area
('Square Meter', 'Sqm', NULL, 1.0),
('Square Feet', 'Sqft', 6, 0.092903),

-- Volume
('Cubic Meter', 'CUM', NULL, 1.0),
('Liter', 'Ltr', 8, 0.001),

-- Weight
('Kilogram', 'Kg', NULL, 1.0),
('Metric Ton', 'MT', 10, 1000.0),
('Gram', 'g', 10, 0.001),
('Quintal', 'Qtl', 10, 100.0),

-- Count
('Numbers', 'Nos', NULL, 1.0),
('Pieces', 'Pcs', 14, 1.0),
('Bags', 'Bag', NULL, 1.0),
('Boxes', 'Box', NULL, 1.0),

-- Special
('Lump Sum', 'LS', NULL, 1.0),
('Per Day', 'Day', NULL, 1.0),
('Per Hour', 'Hr', NULL, 1.0),
('Per Month', 'Month', NULL, 1.0);
