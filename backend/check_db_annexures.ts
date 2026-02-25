
import { sequelize } from './src/database/connection';

async function checkColumns() {
    try {
        const [results] = await sequelize.query("DESCRIBE annexures");
        console.log("Columns in annexures table:", results);

        // Also check for the ENUM type update if it's MySQL
        const [typeEnum] = await sequelize.query("SHOW COLUMNS FROM annexures LIKE 'type'");
        console.log("Type column definition:", typeEnum);

        process.exit(0);
    } catch (error) {
        console.error("Error checking columns:", error);
        process.exit(1);
    }
}

checkColumns();
