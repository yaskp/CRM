
import { sequelize } from './src/database/connection';

async function fixAnnexureSchema() {
    try {
        console.log("Starting database schema fix for annexures...");

        // 1. Add scope_matrix column if it doesn't exist
        const [columns]: any = await sequelize.query("SHOW COLUMNS FROM annexures LIKE 'scope_matrix'");
        if (columns.length === 0) {
            console.log("Adding 'scope_matrix' column...");
            await sequelize.query("ALTER TABLE annexures ADD COLUMN scope_matrix JSON AFTER penalty_clause");
        } else {
            console.log("'scope_matrix' column already exists.");
        }

        // 2. Update type ENUM to include 'scope_matrix'
        console.log("Updating 'type' ENUM...");
        await sequelize.query("ALTER TABLE annexures MODIFY COLUMN type ENUM('client_scope', 'contractor_scope', 'payment_terms', 'general_terms', 'purchase_order', 'scope_matrix') DEFAULT 'general_terms'");

        console.log("Success: Annexure schema updated successfully.");
        process.exit(0);
    } catch (error: any) {
        console.error("Error fixing schema:", error.message);
        process.exit(1);
    }
}

fixAnnexureSchema();
