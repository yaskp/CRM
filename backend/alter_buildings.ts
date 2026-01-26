
import { sequelize } from './src/database/connection';
import ProjectBuilding from './src/models/ProjectBuilding';

const run = async () => {
    try {
        console.log("Altering ProjectBuilding table...");
        await ProjectBuilding.sync({ alter: true });
        console.log('ProjectBuilding table altered successfully');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

run();
