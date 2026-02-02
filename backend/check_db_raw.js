const mysql = require('mysql2/promise');
require('dotenv').config();

async function check() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || 'root',
        database: process.env.DB_NAME || 'crm_construction',
        port: parseInt(process.env.DB_PORT || '3306')
    });

    console.log('--- STORE TRANSACTION 12 ---');
    const [tx] = await connection.execute('SELECT * FROM store_transactions WHERE id = 12');
    console.log(JSON.stringify(tx, null, 2));

    console.log('\n--- ITEMS FOR TX 12 ---');
    const [items] = await connection.execute(`
        SELECT sti.*, m.name as material_name, m.material_code 
        FROM store_transaction_items sti 
        LEFT JOIN materials m ON sti.material_id = m.id 
        WHERE sti.transaction_id = 12
    `);
    console.table(items);

    console.log('\n--- ALL MATERIALS ---');
    const [mats] = await connection.execute('SELECT id, name, material_code FROM materials LIMIT 50');
    console.table(mats);

    await connection.end();
}

check().catch(console.error);
