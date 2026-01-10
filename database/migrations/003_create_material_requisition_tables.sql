-- Migration: 003_create_material_requisition_tables.sql
-- Description: Create material requisition and material requisition items tables

-- Create material_requisitions table
CREATE TABLE IF NOT EXISTS material_requisitions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    requisition_number VARCHAR(50) NOT NULL UNIQUE,
    project_id INT NOT NULL,
    requested_by INT NOT NULL,
    requisition_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    required_date DATETIME NOT NULL,
    priority ENUM('low', 'medium', 'high', 'urgent') NOT NULL DEFAULT 'medium',
    status ENUM('draft', 'pending', 'approved', 'partially_approved', 'rejected', 'cancelled') NOT NULL DEFAULT 'draft',
    purpose TEXT NOT NULL,
    remarks TEXT,
    approved_by INT NULL,
    approved_at DATETIME NULL,
    rejection_reason TEXT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_requisition_number (requisition_number),
    INDEX idx_project_id (project_id),
    INDEX idx_requested_by (requested_by),
    INDEX idx_status (status),
    INDEX idx_priority (priority),
    INDEX idx_requisition_date (requisition_date),
    
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE RESTRICT,
    FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create material_requisition_items table
CREATE TABLE IF NOT EXISTS material_requisition_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    requisition_id INT NOT NULL,
    material_id INT NOT NULL,
    requested_quantity DECIMAL(10, 2) NOT NULL,
    approved_quantity DECIMAL(10, 2) NULL,
    unit VARCHAR(20) NOT NULL,
    estimated_rate DECIMAL(10, 2) NULL,
    estimated_amount DECIMAL(12, 2) NULL,
    specification TEXT NULL,
    remarks TEXT NULL,
    status ENUM('pending', 'approved', 'partially_approved', 'rejected') NOT NULL DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_requisition_id (requisition_id),
    INDEX idx_material_id (material_id),
    INDEX idx_status (status),
    
    FOREIGN KEY (requisition_id) REFERENCES material_requisitions(id) ON DELETE CASCADE,
    FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add comments
ALTER TABLE material_requisitions COMMENT = 'Material requisitions for projects';
ALTER TABLE material_requisition_items COMMENT = 'Line items for material requisitions';
