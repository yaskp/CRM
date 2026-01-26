-- Migration: Project BOQ (Bill of Quantities)
-- Phase: 2
-- Purpose: Control material consumption by defining limits per project/work-type/location.

-- 1. Project BOQ Header
CREATE TABLE IF NOT EXISTS project_boqs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    version INT DEFAULT 1,
    status ENUM('draft', 'approved', 'revised', 'obsolete') DEFAULT 'draft',
    total_estimated_amount DECIMAL(15, 2) DEFAULT 0,
    created_by INT NOT NULL,
    approved_by INT DEFAULT NULL,
    approved_at TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES users(id)
);

-- 2. Project BOQ Items (Material Estimates)
CREATE TABLE IF NOT EXISTS project_boq_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    boq_id INT NOT NULL,
    material_id INT NOT NULL,
    work_item_type_id INT NULL, -- Link to work type
    building_id INT NULL,
    floor_id INT NULL,
    zone_id INT NULL,
    
    quantity DECIMAL(15, 2) NOT NULL,
    unit VARCHAR(20),
    estimated_rate DECIMAL(15, 2) DEFAULT 0,
    estimated_amount DECIMAL(15, 2) AS (quantity * estimated_rate) STORED,
    
    -- Consumption Tracking (Will be updated by POs/GRNs)
    ordered_quantity DECIMAL(15, 2) DEFAULT 0,
    consumed_quantity DECIMAL(15, 2) DEFAULT 0,
    
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (boq_id) REFERENCES project_boqs(id) ON DELETE CASCADE,
    FOREIGN KEY (material_id) REFERENCES materials(id),
    FOREIGN KEY (work_item_type_id) REFERENCES work_item_types(id),
    FOREIGN KEY (building_id) REFERENCES project_buildings(id),
    FOREIGN KEY (floor_id) REFERENCES project_floors(id),
    FOREIGN KEY (zone_id) REFERENCES project_zones(id)
);

-- 3. Add BOQ Reference to Material Requisitions and POs for tracking
ALTER TABLE material_requisition_items ADD COLUMN boq_item_id INT NULL;
ALTER TABLE material_requisition_items ADD CONSTRAINT fk_mri_boq_item FOREIGN KEY (boq_item_id) REFERENCES project_boq_items(id);

ALTER TABLE purchase_order_items ADD COLUMN boq_item_id INT NULL;
ALTER TABLE purchase_order_items ADD CONSTRAINT fk_poi_boq_item FOREIGN KEY (boq_item_id) REFERENCES project_boq_items(id);
