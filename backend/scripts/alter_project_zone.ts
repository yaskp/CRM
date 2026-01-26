
import { sequelize } from '../src/database/connection';
import ProjectZone from '../src/models/ProjectZone';

const run = async () => {
    try {
        console.log("Altering table...");
        await ProjectZone.sync({ alter: true });
        console.log('ProjectZone table altered successfully');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

run();
