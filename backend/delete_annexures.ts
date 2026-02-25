
import { sequelize } from './src/database/connection';

async function deleteAnnexures() {
    try {
        console.log("Deleting all annexures...");

        // Disable FK checks temporarily if needed, but better to be safe
        // If there are quotations linked to these, this might fail.
        // However, usually yaskp wants a clean slate.

        await sequelize.query("SET FOREIGN_KEY_CHECKS = 0");
        await sequelize.query("TRUNCATE TABLE annexures");
        await sequelize.query("SET FOREIGN_KEY_CHECKS = 1");

        console.log("Success: All annexures deleted.");
        process.exit(0);
    } catch (error) {
        console.error("Error deleting annexures:", error);
        process.exit(1);
    }
}

deleteAnnexures();
