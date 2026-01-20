const { sequelize } = require('../../backend/src/database/connection');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    try {
        console.log('Starting client management migration...');
        const sql = fs.readFileSync(path.join(__dirname, '010_create_clients_table.sql'), 'utf8');

        // Split by semicolon and execute each statement
        const statements = sql.split(';').filter(stmt => stmt.trim());

        for (const statement of statements) {
            if (statement.trim()) {
                console.log('Executing:', statement.substring(0, 50) + '...');
                await sequelize.query(statement);
            }
        }

        console.log('✅ Client management migration completed successfully.');
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        throw error;
    } finally {
        await sequelize.close();
    }
}

runMigration();
