-- Credit Notes and Items Tables

CREATE TABLE IF NOT EXISTS credit_notes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    credit_note_number VARCHAR(50) NOT NULL UNIQUE,
    transaction_date DATE NOT NULL,
    srn_id INT NOT NULL,
    vendor_id INT NOT NULL,
    purchase_order_id INT NULL,
    subtotal DECIMAL(15, 2) DEFAULT 0,
    tax_amount DECIMAL(15, 2) DEFAULT 0,
    total_amount DECIMAL(15, 2) DEFAULT 0,
    gst_type ENUM('intra_state', 'inter_state') DEFAULT 'intra_state',
    status ENUM('draft', 'approved', 'cancelled') DEFAULT 'draft',
    remarks TEXT NULL,
    created_by INT NOT NULL,
    approved_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (srn_id) REFERENCES store_transactions(id),
    FOREIGN KEY (vendor_id) REFERENCES vendors(id),
    FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS credit_note_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    credit_note_id INT NOT NULL,
    material_id INT NOT NULL,
    quantity DECIMAL(15, 3) NOT NULL,
    unit_price DECIMAL(15, 2) NOT NULL,
    tax_percentage DECIMAL(5, 2) DEFAULT 0,
    tax_amount DECIMAL(15, 2) DEFAULT 0,
    total_amount DECIMAL(15, 2) DEFAULT 0,
    unit VARCHAR(20) NULL,
    remarks TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (credit_note_id) REFERENCES credit_notes(id),
    FOREIGN KEY (material_id) REFERENCES materials(id)
);
