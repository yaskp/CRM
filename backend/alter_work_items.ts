
import { sequelize } from './src/database/connection';
import WorkItemType from './src/models/WorkItemType';

const run = async () => {
    try {
        console.log("Altering WorkItemType table...");
        await WorkItemType.sync({ alter: true });
        console.log('WorkItemType table altered successfully');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

run();
