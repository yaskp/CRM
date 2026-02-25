-- Contractor Billing Module - Database Migration
-- Date: 2026-02-04
-- Purpose: Implement contractor billing with variance support

-- ============================================================================
-- 1. VARIANCE SETTINGS
-- ============================================================================

-- Add variance fields to work_orders table
ALTER TABLE work_orders 
ADD COLUMN variance_positive DECIMAL(5,2) DEFAULT 5.00 COMMENT 'Positive variance percentage allowed',
ADD COLUMN variance_negative DECIMAL(5,2) DEFAULT 2.00 COMMENT 'Negative variance percentage allowed',
ADD COLUMN variance_type ENUM('percentage', 'absolute') DEFAULT 'percentage' COMMENT 'Type of variance calculation';

-- Add variance fields to work_order_items table  
ALTER TABLE work_order_items
ADD COLUMN variance_positive DECIMAL(5,2) COMMENT 'Item-specific positive variance',
ADD COLUMN variance_negative DECIMAL(5,2) COMMENT 'Item-specific negative variance',
ADD COLUMN max_quantity_with_variance DECIMAL(15,3) COMMENT 'Calculated max quantity including variance',
ADD COLUMN min_quantity_with_variance DECIMAL(15,3) COMMENT 'Calculated min quantity including variance';

-- Project-level variance settings (optional overrides)
CREATE TABLE IF NOT EXISTS project_variance_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    project_id INT NOT NULL,
    work_item_type_id INT,
    variance_positive DECIMAL(5,2) NOT NULL DEFAULT 5.00,
    variance_negative DECIMAL(5,2) NOT NULL DEFAULT 2.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (work_item_type_id) REFERENCES work_item_types(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id),
    
    UNIQUE KEY unique_project_item (project_id, work_item_type_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Work item type default variance (recommended settings)
CREATE TABLE IF NOT EXISTS work_item_variance_defaults (
    id INT PRIMARY KEY AUTO_INCREMENT,
    work_item_type_id INT NOT NULL,
    variance_positive DECIMAL(5,2) NOT NULL,
    variance_negative DECIMAL(5,2) NOT NULL,
    category VARCHAR(50) COMMENT 'structural, finishing, excavation, steel',
    remarks TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (work_item_type_id) REFERENCES work_item_types(id) ON DELETE CASCADE,
    UNIQUE KEY unique_work_item (work_item_type_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 2. CONTRACTOR BILLS
-- ============================================================================

CREATE TABLE IF NOT EXISTS contractor_bills (
    id INT PRIMARY KEY AUTO_INCREMENT,
    bill_number VARCHAR(50) UNIQUE NOT NULL,
    bill_date DATE NOT NULL,
    
    -- References
    project_id INT NOT NULL,
    work_order_id INT NOT NULL,
    vendor_id INT NOT NULL COMMENT 'Contractor/Subcontractor',
    
    -- Bill Period
    period_from DATE,
    period_to DATE,
    
    -- Amounts
    gross_amount DECIMAL(15,2) DEFAULT 0,
    previous_bills_amount DECIMAL(15,2) DEFAULT 0 COMMENT 'Sum of all previous bills',
    cumulative_amount DECIMAL(15,2) DEFAULT 0 COMMENT 'Total including this bill',
    
    -- Deductions
    tds_percentage DECIMAL(5,2) DEFAULT 2.00 COMMENT 'TDS rate (1% or 2%)',
    tds_amount DECIMAL(15,2) DEFAULT 0,
    retention_percentage DECIMAL(5,2) DEFAULT 10.00 COMMENT 'Retention money %',
    retention_amount DECIMAL(15,2) DEFAULT 0,
    other_deductions DECIMAL(15,2) DEFAULT 0,
    deduction_remarks TEXT,
    
    -- Net Amount
    net_amount DECIMAL(15,2) DEFAULT 0 COMMENT 'Amount payable after deductions',
    
    -- Status
    status ENUM('draft', 'submitted', 'verified', 'approved', 'rejected', 'paid') DEFAULT 'draft',
    
    -- Workflow
    submitted_by INT COMMENT 'User who submitted',
    submitted_at DATETIME,
    verified_by INT COMMENT 'Site Engineer',
    verified_at DATETIME,
    approved_by INT COMMENT 'Project Manager',
    approved_at DATETIME,
    rejected_by INT,
    rejected_at DATETIME,
    rejection_reason TEXT,
    
    -- Payment
    payment_date DATE,
    payment_reference VARCHAR(100),
    payment_mode ENUM('cash', 'cheque', 'neft', 'rtgs', 'upi', 'other'),
    
    -- Remarks
    remarks TEXT,
    internal_notes TEXT COMMENT 'Internal notes not visible to contractor',
    
    -- Audit
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (work_order_id) REFERENCES work_orders(id),
    FOREIGN KEY (vendor_id) REFERENCES vendors(id),
    FOREIGN KEY (submitted_by) REFERENCES users(id),
    FOREIGN KEY (verified_by) REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES users(id),
    FOREIGN KEY (rejected_by) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    
    INDEX idx_project (project_id),
    INDEX idx_work_order (work_order_id),
    INDEX idx_vendor (vendor_id),
    INDEX idx_status (status),
    INDEX idx_bill_date (bill_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 3. CONTRACTOR BILL ITEMS
-- ============================================================================

CREATE TABLE IF NOT EXISTS contractor_bill_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    bill_id INT NOT NULL,
    
    -- Work Reference
    work_order_item_id INT COMMENT 'Reference to work order item',
    work_item_type_id INT,
    description VARCHAR(500),
    
    -- Quantities
    boq_quantity DECIMAL(15,3) COMMENT 'Original BOQ quantity',
    work_order_quantity DECIMAL(15,3) NOT NULL COMMENT 'Work Order contracted quantity',
    previous_billed_quantity DECIMAL(15,3) DEFAULT 0 COMMENT 'Previously billed in earlier bills',
    dpr_actual_quantity DECIMAL(15,3) COMMENT 'Actual work done as per DPR',
    current_bill_quantity DECIMAL(15,3) NOT NULL COMMENT 'Quantity in this bill',
    cumulative_billed DECIMAL(15,3) DEFAULT 0 COMMENT 'Total billed including this bill',
    balance_quantity DECIMAL(15,3) COMMENT 'Remaining quantity',
    
    -- Variance
    variance_positive DECIMAL(5,2) COMMENT 'Allowed positive variance %',
    variance_negative DECIMAL(5,2) COMMENT 'Allowed negative variance %',
    max_allowed_quantity DECIMAL(15,3) COMMENT 'WO qty + positive variance',
    min_allowed_quantity DECIMAL(15,3) COMMENT 'WO qty - negative variance',
    variance_percentage DECIMAL(5,2) COMMENT 'Actual variance in this bill',
    variance_quantity DECIMAL(15,3) COMMENT 'Variance quantity',
    
    -- Validation Flags
    within_variance BOOLEAN DEFAULT TRUE,
    exceeds_work_order BOOLEAN DEFAULT FALSE,
    exceeds_dpr_actual BOOLEAN DEFAULT FALSE,
    requires_approval BOOLEAN DEFAULT FALSE,
    
    -- Rates & Amounts
    unit VARCHAR(50),
    rate DECIMAL(15,2) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    
    -- Verification
    verified_quantity DECIMAL(15,3) COMMENT 'Quantity verified by site engineer',
    verified_amount DECIMAL(15,2),
    approved_quantity DECIMAL(15,3) COMMENT 'Final approved quantity',
    approved_amount DECIMAL(15,2),
    verification_remarks TEXT,
    approval_remarks TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (bill_id) REFERENCES contractor_bills(id) ON DELETE CASCADE,
    FOREIGN KEY (work_order_item_id) REFERENCES work_order_items(id),
    FOREIGN KEY (work_item_type_id) REFERENCES work_item_types(id),
    
    INDEX idx_bill (bill_id),
    INDEX idx_work_order_item (work_order_item_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 4. CONTRACTOR BILL AUDIT LOG
-- ============================================================================

CREATE TABLE IF NOT EXISTS contractor_bill_audit (
    id INT PRIMARY KEY AUTO_INCREMENT,
    bill_id INT NOT NULL,
    action VARCHAR(50) NOT NULL COMMENT 'created, modified, submitted, verified, approved, rejected, paid',
    field_changed VARCHAR(100),
    old_value TEXT,
    new_value TEXT,
    changed_by INT NOT NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT,
    remarks TEXT,
    
    FOREIGN KEY (bill_id) REFERENCES contractor_bills(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES users(id),
    
    INDEX idx_bill (bill_id),
    INDEX idx_action (action),
    INDEX idx_changed_at (changed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 5. INSERT DEFAULT VARIANCE SETTINGS (Recommended)
-- ============================================================================

-- Insert default variance for common work item types
-- Note: Adjust work_item_type_id based on your actual data

INSERT INTO work_item_variance_defaults (work_item_type_id, variance_positive, variance_negative, category, remarks)
SELECT id, 
    CASE 
        WHEN name LIKE '%steel%' OR name LIKE '%reinforcement%' THEN 2.00
        WHEN name LIKE '%excavat%' OR name LIKE '%earth%' THEN 10.00
        WHEN name LIKE '%finish%' OR name LIKE '%paint%' OR name LIKE '%plaster%' THEN 7.00
        WHEN name LIKE '%concrete%' OR name LIKE '%rcc%' OR name LIKE '%structural%' THEN 5.00
        ELSE 5.00
    END as variance_positive,
    CASE 
        WHEN name LIKE '%steel%' OR name LIKE '%reinforcement%' THEN 1.00
        WHEN name LIKE '%excavat%' OR name LIKE '%earth%' THEN 5.00
        WHEN name LIKE '%finish%' OR name LIKE '%paint%' OR name LIKE '%plaster%' THEN 3.00
        WHEN name LIKE '%concrete%' OR name LIKE '%rcc%' OR name LIKE '%structural%' THEN 2.00
        ELSE 2.00
    END as variance_negative,
    CASE 
        WHEN name LIKE '%steel%' OR name LIKE '%reinforcement%' THEN 'steel'
        WHEN name LIKE '%excavat%' OR name LIKE '%earth%' THEN 'excavation'
        WHEN name LIKE '%finish%' OR name LIKE '%paint%' OR name LIKE '%plaster%' THEN 'finishing'
        WHEN name LIKE '%concrete%' OR name LIKE '%rcc%' OR name LIKE '%structural%' THEN 'structural'
        ELSE 'general'
    END as category,
    'Auto-generated default variance based on work type' as remarks
FROM work_item_types
WHERE id NOT IN (SELECT work_item_type_id FROM work_item_variance_defaults)
ON DUPLICATE KEY UPDATE 
    variance_positive = VALUES(variance_positive),
    variance_negative = VALUES(variance_negative),
    category = VALUES(category);

-- ============================================================================
-- 6. VIEWS FOR REPORTING
-- ============================================================================

-- View: Contractor Bill Summary
CREATE OR REPLACE VIEW v_contractor_bill_summary AS
SELECT 
    cb.id,
    cb.bill_number,
    cb.bill_date,
    p.name as project_name,
    v.name as contractor_name,
    wo.work_order_number,
    cb.gross_amount,
    cb.tds_amount,
    cb.retention_amount,
    cb.net_amount,
    cb.status,
    cb.verified_by,
    cb.approved_by,
    cb.payment_date,
    u_verified.name as verified_by_name,
    u_approved.name as approved_by_name
FROM contractor_bills cb
LEFT JOIN projects p ON cb.project_id = p.id
LEFT JOIN vendors v ON cb.vendor_id = v.id
LEFT JOIN work_orders wo ON cb.work_order_id = wo.id
LEFT JOIN users u_verified ON cb.verified_by = u_verified.id
LEFT JOIN users u_approved ON cb.approved_by = u_approved.id;

-- View: Variance Analysis
CREATE OR REPLACE VIEW v_contractor_variance_analysis AS
SELECT 
    cb.id as bill_id,
    cb.bill_number,
    p.name as project_name,
    v.name as contractor_name,
    cbi.description as work_item,
    cbi.work_order_quantity,
    cbi.cumulative_billed,
    cbi.variance_percentage,
    cbi.within_variance,
    cbi.exceeds_work_order,
    cbi.requires_approval,
    cbi.amount,
    cb.status
FROM contractor_bill_items cbi
JOIN contractor_bills cb ON cbi.bill_id = cb.id
JOIN projects p ON cb.project_id = p.id
JOIN vendors v ON cb.vendor_id = v.id
WHERE cbi.variance_percentage IS NOT NULL;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
