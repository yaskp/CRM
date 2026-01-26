
import { sequelize } from '../src/database/connection.ts';
import { QueryTypes } from 'sequelize';

async function addMissingVendorColumns() {
    try {
        await sequelize.authenticate();
        console.log('Database connection established successfully.');

        const queryInterface = sequelize.getQueryInterface();

        const columnsToAdd = [
            { name: 'city', type: 'VARCHAR(100)' },
            { name: 'state', type: 'VARCHAR(100)' },
            { name: 'pincode', type: 'VARCHAR(20)' },
            { name: 'bank_name', type: 'VARCHAR(100)' },
            { name: 'account_number', type: 'VARCHAR(50)' },
            { name: 'ifsc_code', type: 'VARCHAR(20)' },
            { name: 'branch', type: 'VARCHAR(100)' }
        ];

        for (const col of columnsToAdd) {
            try {
                await sequelize.query(`ALTER TABLE vendors ADD COLUMN ${col.name} ${col.type};`, { type: QueryTypes.RAW });
                console.log(`Added column ${col.name}`);
            } catch (error: any) {
                // Ignore if column already exists (common in re-runs)
                if (error.original && error.original.code === 'ER_DUP_FIELDNAME') {
                    console.log(`Column ${col.name} already exists.`);
                } else if (error.message && error.message.includes('Duplicate column name')) {
                    console.log(`Column ${col.name} already exists.`);
                } else {
                    console.log(`Could not add column ${col.name}, it might already exist or error: ${error.message}`);
                }
            }
        }

        console.log('Vendor table updated successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Unable to connect to the database or run migration:', error);
        process.exit(1);
    }
}

addMissingVendorColumns();
