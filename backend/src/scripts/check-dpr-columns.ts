import { Sequelize } from 'sequelize';

async function listColumns() {
    const sequelize = new Sequelize('crm_construction', 'root', 'root', {
        host: 'localhost',
        dialect: 'mysql',
        logging: false
    });

    try {
        const [resultsPile] = await sequelize.query("SHOW COLUMNS FROM dpr_pile_work_logs;");
        console.log("Columns in dpr_pile_work_logs:\n", resultsPile.map((c: any) => c.Field).join('\n'));

        const [resultsPanel] = await sequelize.query("SHOW COLUMNS FROM dpr_panel_work_logs;");
        console.log("\nColumns in dpr_panel_work_logs:\n", resultsPanel.map((c: any) => c.Field).join('\n'));
    } catch (error: any) {
        console.error("Error:", error.message);
    } finally {
        await sequelize.close();
    }
}

listColumns();
