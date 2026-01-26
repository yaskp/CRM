-- Migration: Enhanced Procurement and GRN Variance Tracking
-- Phase: 1

-- 1. Create Purchase Order Terms Master
CREATE TABLE IF NOT EXISTS po_terms_master (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    payment_terms TEXT,
    delivery_terms TEXT,
    quality_terms TEXT,
    warranty_terms TEXT,
    penalty_clause TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Add terms reference to Purchase Orders
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS terms_master_id INT;

-- 3. Enhance Store Transaction Items for Variance Tracking (GRN)
ALTER TABLE store_transaction_items
ADD COLUMN IF NOT EXISTS ordered_quantity DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS accepted_quantity DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS rejected_quantity DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS excess_quantity DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS shortage_quantity DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS variance_type ENUM('exact', 'excess', 'shortage', 'defective') DEFAULT 'exact',
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- 4. Add Inspection details to Store Transactions (GRN)
ALTER TABLE store_transactions
ADD COLUMN IF NOT EXISTS inspector_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS inspection_date DATE;
