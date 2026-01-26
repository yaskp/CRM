require('dotenv').config({ path: '../../backend/.env' });
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function removeRedundantFields() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'crm_db',
        multipleStatements: true
    });

    try {
        console.log('🧹 Removing redundant client fields from project_details...\n');

        const sql = fs.readFileSync(path.join(__dirname, '015_remove_redundant_client_fields.sql'), 'utf8');

        await connection.query(sql);

        console.log('✅ Successfully removed redundant fields:\n');
        console.log('   ❌ client_name');
        console.log('   ❌ client_contact_person');
        console.log('   ❌ client_email');
        console.log('   ❌ client_phone');
        console.log('   ❌ client_address');
        console.log('   ❌ client_gst_number');
        console.log('   ❌ client_pan_number\n');
        console.log('✨ Now using: projects.client_id → clients table');
        console.log('✨ Multiple contacts: client_contacts table\n');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        throw error;
    } finally {
        await connection.end();
    }
}

removeRedundantFields();
