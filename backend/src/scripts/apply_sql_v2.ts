
import { Sequelize } from 'sequelize';

async function runSQL() {
    const sequelize = new Sequelize('crm_construction', 'root', 'root', {
        host: 'localhost',
        dialect: 'mysql',
        logging: console.log
    });

    try {
        const columnsToAdd = [
            { name: 'pile_work_logs', type: 'JSON' },
            { name: 'panel_work_logs', type: 'JSON' },
            { name: 'overbreak_percentage', type: 'DECIMAL(10, 2)' }
        ];

        for (const col of columnsToAdd) {
            try {
                await sequelize.query(`ALTER TABLE store_transactions ADD COLUMN ${col.name} ${col.type} NULL`);
                console.log(`Added column ${col.name}`);
            } catch (err) {
                if (err.message.includes('Duplicate column name')) {
                    console.log(`Column ${col.name} already exists`);
                } else {
                    console.error(`Error adding ${col.name}:`, err.message);
                }
            }
        }

        // Record it in executed_migrations if not already there
        const migrationName = '033_add_pile_and_panel_work_logs.sql';
        try {
            await sequelize.query(
                "INSERT INTO executed_migrations (name) VALUES (?)",
                { replacements: [migrationName] }
            );
            console.log(`Recorded ${migrationName} in executed_migrations`);
        } catch (e) {
            console.log(`Migration ${migrationName} already recorded or error recording.`);
        }

    } catch (error) {
        console.error("Critical Error:", error.message);
    } finally {
        await sequelize.close();
    }
}

runSQL();
