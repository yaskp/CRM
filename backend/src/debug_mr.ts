import './models/index';
import { sequelize } from './database/connection';
import MaterialRequisition from './models/MaterialRequisition';
import MaterialRequisitionItem from './models/MaterialRequisitionItem';
import Project from './models/Project';
import User from './models/User';

const run = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connected');

        const mrs = await MaterialRequisition.findAll({
            include: [
                { model: Project, as: 'project' },
                { model: User, as: 'requester' },
                { model: MaterialRequisitionItem, as: 'items' }
            ]
        });

        console.log(`Found ${mrs.length} requisitions.`);
        console.log(JSON.stringify(mrs, null, 2));

    } catch (err) {
        console.error(err);
    } finally {
        await sequelize.close();
    }
};

run();
