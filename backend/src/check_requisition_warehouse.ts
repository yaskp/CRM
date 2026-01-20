import './models/index';
import { sequelize } from './database/connection';
import MaterialRequisition from './models/MaterialRequisition';

const run = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connected to database.');

        const requisitionId = 1;
        const requisition = await MaterialRequisition.findByPk(requisitionId);

        if (requisition) {
            console.log(`Requisition ID: ${requisition.id}`);
            console.log(`From Warehouse ID: ${requisition.from_warehouse_id}`);
            console.log(`Project ID: ${requisition.project_id}`);
            console.log(`Request payload details associated with this error likely used this warehouse ID.`);
        } else {
            console.log(`Requisition with ID ${requisitionId} not found.`);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
};

run();
