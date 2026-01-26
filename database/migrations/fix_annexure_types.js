const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../backend/.env') });

async function fixAnnexureTypes() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'crm_construction'
        });

        console.log('Connected to database.');

        // Update ID 2 to client_scope (Assuming it is Client Scope based on name)
        await connection.execute("UPDATE annexures SET type = 'client_scope' WHERE name LIKE '%FREE OF COST%'");
        console.log("Updated 'FREE OF COST' annexures to client_scope");

        // Update ID 3 to contractor_scope (Assuming 'VHSHRI SCOPE')
        await connection.execute("UPDATE annexures SET type = 'contractor_scope' WHERE name LIKE '%VHSHRI SCOPE%'");
        console.log("Updated 'VHSHRI SCOPE' annexures to contractor_scope");

        // Also checks if there are any that look like payment terms
        await connection.execute("UPDATE annexures SET type = 'payment_terms' WHERE name LIKE '%Payment%'");

    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (connection) await connection.end();
    }
}

fixAnnexureTypes();
