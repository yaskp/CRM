import { Sequelize } from 'sequelize';

async function runSQL() {
    const sequelize = new Sequelize('crm_construction', 'root', 'root', {
        host: 'localhost',
        dialect: 'mysql',
        logging: console.log
    });

    try {
        const sql = `
          ALTER TABLE dpr_pile_work_logs 
          ADD COLUMN actual_concrete_qty DECIMAL(10, 3) NULL AFTER concrete_poured;
        `;
        await sequelize.query(sql);
        console.log("SQL executed successfully");

        // Record it in executed_migrations
        await sequelize.query(
            "INSERT INTO executed_migrations (name) VALUES (?)",
            { replacements: ['035_add_pile_actual_concrete_qty.sql'] }
        );
        console.log("Recorded in executed_migrations");

    } catch (error: any) {
        if (error.message.includes('Duplicate column name')) {
            console.log("Column already exists");
        } else {
            console.error("Error:", error.message);
        }
    } finally {
        await sequelize.close();
    }
}

runSQL();
