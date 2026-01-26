
import { sequelize } from '../src/database/connection';
import ClientGroup from '../src/models/ClientGroup';

const checkGroups = async () => {
    try {
        await sequelize.authenticate();
        const groups = await ClientGroup.findAll();
        console.log('Existing Client Groups:');
        groups.forEach(g => console.log(`- ${g.id}: ${g.group_name} (${g.group_type})`));
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

checkGroups();
