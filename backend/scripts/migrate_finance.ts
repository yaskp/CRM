import { sequelize } from '../src/database/connection';

const migrateFinance = async () => {
    try {
        console.log('Starting Finance migration...');

        // 1. Create financial_transactions table
        await sequelize.query(`
      CREATE TABLE IF NOT EXISTS financial_transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        transaction_number VARCHAR(50) NOT NULL UNIQUE,
        transaction_date DATE NOT NULL,
        type ENUM('payment', 'receipt', 'contra', 'journal') NOT NULL,
        category ENUM('vendor', 'client', 'site_expense', 'salary', 'advance', 'other') NOT NULL,
        amount DECIMAL(15, 2) NOT NULL,
        tds_amount DECIMAL(15, 2) DEFAULT 0,
        retention_amount DECIMAL(15, 2) DEFAULT 0,
        net_amount DECIMAL(15, 2) NOT NULL,
        project_id INT NULL,
        vendor_id INT NULL,
        client_id INT NULL,
        user_id INT NULL,
        payment_mode ENUM('cash', 'cheque', 'neft', 'rtgs', 'upi') NOT NULL DEFAULT 'neft',
        reference_number VARCHAR(100) NULL,
        bank_name VARCHAR(100) NULL,
        bank_account_id INT NULL,
        status ENUM('draft', 'pending', 'cleared', 'cancelled') DEFAULT 'draft',
        remarks TEXT NULL,
        attachment_url VARCHAR(255) NULL,
        created_by INT NOT NULL,
        approved_by INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_ft_project FOREIGN KEY (project_id) REFERENCES projects(id),
        CONSTRAINT fk_ft_vendor FOREIGN KEY (vendor_id) REFERENCES vendors(id),
        CONSTRAINT fk_ft_client FOREIGN KEY (client_id) REFERENCES clients(id),
        CONSTRAINT fk_ft_creator FOREIGN KEY (created_by) REFERENCES users(id)
      ) ENGINE=InnoDB;
    `);

        // 2. Create payment_allocations table
        await sequelize.query(`
      CREATE TABLE IF NOT EXISTS payment_allocations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        financial_transaction_id INT NOT NULL,
        purchase_order_id INT NULL,
        work_order_id INT NULL,
        expense_id INT NULL,
        allocated_amount DECIMAL(15, 2) NOT NULL,
        tds_allocated DECIMAL(15, 2) DEFAULT 0,
        retention_allocated DECIMAL(15, 2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_pa_ft FOREIGN KEY (financial_transaction_id) REFERENCES financial_transactions(id) ON DELETE CASCADE,
        CONSTRAINT fk_pa_po FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id),
        CONSTRAINT fk_pa_wo FOREIGN KEY (work_order_id) REFERENCES work_orders(id),
        CONSTRAINT fk_pa_exp FOREIGN KEY (expense_id) REFERENCES expenses(id)
      ) ENGINE=InnoDB;
    `);

        console.log('Finance migration completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

migrateFinance();
