
import { Sequelize } from 'sequelize';

async function runSQL() {
    const sequelize = new Sequelize('crm_construction', 'root', 'root', {
        host: 'localhost',
        dialect: 'mysql',
        logging: console.log
    });

    try {
        const sql = `
      ALTER TABLE store_transactions 
      ADD COLUMN overbreak_percentage DECIMAL(10, 2) NULL,
      ADD COLUMN pile_work_logs JSON NULL,
      ADD COLUMN panel_work_logs JSON NULL;
    `;
        await sequelize.query(sql);
        console.log("SQL executed successfully");

        // Also record it in executed_migrations to keep it clean
        await sequelize.query(
            "INSERT INTO executed_migrations (name) VALUES (?)",
            { replacements: ['033_add_pile_and_panel_work_logs.sql'] }
        );
        console.log("Recorded in executed_migrations");

    } catch (error) {
        if (error.message.includes('Duplicate column name')) {
            console.log("Columns already exist, just recording in migrations table if missing");
            try {
                await sequelize.query(
                    "INSERT INTO executed_migrations (name) VALUES (?)",
                    { replacements: ['033_add_pile_and_panel_work_logs.sql'] }
                );
            } catch (e) {
                console.log("Already recorded in migrations too.");
            }
        } else {
            console.error("Error:", error.message);
        }
    } finally {
        await sequelize.close();
    }
}

runSQL();
