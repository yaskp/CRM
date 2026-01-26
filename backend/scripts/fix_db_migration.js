
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function run() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'crm_construction'
    });

    console.log('Connected to database.');

    try {
        const [rows] = await connection.query("SHOW COLUMNS FROM purchase_orders LIKE 'annexure_id'");
        if (rows.length === 0) {
            await connection.query("ALTER TABLE purchase_orders ADD COLUMN annexure_id INT NULL");
            await connection.query("ALTER TABLE purchase_orders ADD INDEX idx_po_annexure (annexure_id)");
            console.log("Added annexure_id");
        } else {
            console.log("annexure_id exists");
        }

        const [rows2] = await connection.query("SHOW COLUMNS FROM purchase_orders LIKE 'warehouse_id'");
        if (rows2.length === 0) {
            await connection.query("ALTER TABLE purchase_orders ADD COLUMN warehouse_id INT NULL");
            await connection.query("ALTER TABLE purchase_orders ADD INDEX idx_po_warehouse (warehouse_id)");
            console.log("Added warehouse_id");
        }

        const [rows3] = await connection.query("SHOW COLUMNS FROM purchase_orders LIKE 'delivery_type'");
        if (rows3.length === 0) {
            await connection.query("ALTER TABLE purchase_orders ADD COLUMN delivery_type ENUM('direct_to_site', 'central_warehouse', 'mixed') DEFAULT 'central_warehouse'");
            console.log("Added delivery_type");
        }

        const [rows4] = await connection.query("SHOW COLUMNS FROM purchase_orders LIKE 'gst_type'");
        if (rows4.length === 0) {
            await connection.query("ALTER TABLE purchase_orders ADD COLUMN gst_type ENUM('intra_state', 'inter_state') NULL");
            console.log("Added gst_type");
        }

        const [rows5] = await connection.query("SHOW COLUMNS FROM purchase_orders LIKE 'cgst_amount'");
        if (rows5.length === 0) {
            await connection.query("ALTER TABLE purchase_orders ADD COLUMN cgst_amount DECIMAL(15,2) DEFAULT 0");
            await connection.query("ALTER TABLE purchase_orders ADD COLUMN sgst_amount DECIMAL(15,2) DEFAULT 0");
            await connection.query("ALTER TABLE purchase_orders ADD COLUMN igst_amount DECIMAL(15,2) DEFAULT 0");
            console.log("Added GST columns");
        }

        // Check temp_number (add if missing)
        const [rows6] = await connection.query("SHOW COLUMNS FROM purchase_orders LIKE 'temp_number'");
        if (rows6.length === 0) {
            await connection.query("ALTER TABLE purchase_orders ADD COLUMN temp_number VARCHAR(50) NULL");
            console.log("Added temp_number");
        }

        console.log('Migration complete.');
    } catch (err) {
        console.error(err);
    } finally {
        await connection.end();
    }
}

run();
