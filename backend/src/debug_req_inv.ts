import './models/index';
import { sequelize } from './database/connection';
import MaterialRequisition from './models/MaterialRequisition';
import Inventory from './models/Inventory';

const run = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connected to database.');

        // details for req 1
        const req1 = await MaterialRequisition.findByPk(1);
        if (req1) {
            console.log('--- Requisition 1 ---');
            console.log('ID:', req1.id);
            console.log('From Warehouse ID:', req1.from_warehouse_id);
            console.log('---------------------');
        } else {
            console.log('Requisition 1 not found');
        }

        // inventory for mat 8
        const inv8 = await Inventory.findAll({ where: { material_id: 8 } });
        console.log('--- Inventory for Material 8 ---');
        console.log(JSON.stringify(inv8, null, 2));
        console.log('--------------------------------');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
};

run();
