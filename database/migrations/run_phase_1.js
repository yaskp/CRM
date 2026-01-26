const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../backend/.env') });

async function runPhase1() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'crm_construction',
            multipleStatements: false
        });

        console.log('Connected to database');
        const sqlFile = fs.readFileSync(path.join(__dirname, 'phase_1_project_hierarchy.sql'), 'utf8');

        const statements = sqlFile.split(';').map(s => s.trim()).filter(s => s.length > 0);

        for (const statement of statements) {
            try {
                await connection.query(statement);
            } catch (error) {
                // Ignore "Already exists" errors
                const ignoreCodes = [
                    1060, // Duplicate column name
                    1061, // Duplicate key name
                    1022, // Can't write; duplicate key in table
                    1050, // Table already exists
                    1826, // Duplicate foreign key constraint name
                ];

                if (ignoreCodes.includes(error.errno)) {
                    console.log(`Skipping: ${error.message}`);
                } else {
                    console.error(`Statement failed: ${statement}`);
                    console.error('Error:', error.message, 'Errno:', error.errno);
                    throw error;
                }
            }
        }

        console.log('✓ Phase 1 hierarchy migration completed successfully');

    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

runPhase1();
