import { sequelize } from './database/connection';

const run = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connected to database.');

        const query = `
        CREATE TABLE IF NOT EXISTS purchase_order_items (
            id INT AUTO_INCREMENT PRIMARY KEY,
            po_id INT NOT NULL,
            material_id INT,
            description TEXT NOT NULL,
            quantity DECIMAL(10, 2) NOT NULL DEFAULT 1,
            unit VARCHAR(20) NOT NULL DEFAULT 'units',
            unit_price DECIMAL(15, 2) NOT NULL DEFAULT 0,
            tax_percentage DECIMAL(5, 2) NOT NULL DEFAULT 0,
            tax_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
            total_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (po_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
            FOREIGN KEY (material_id) REFERENCES materials(id)
        );
        `;

        await sequelize.query(query);
        console.log('Created purchase_order_items table.');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
};

run();
