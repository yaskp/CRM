
import { sequelize } from '../src/database/connection';
import WorkItemType from '../src/models/WorkItemType';

const listWorkItems = async () => {
    try {
        await sequelize.authenticate();
        const items = await WorkItemType.findAll();
        console.log('Current Work Item Types:');
        items.forEach(i => console.log(`- ${i.id}: ${i.name} (${i.code}) [${i.uom}]`));
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

listWorkItems();
