import './models/index';
import { sequelize } from './database/connection';
import Inventory from './models/Inventory';
import Material from './models/Material';
import Warehouse from './models/Warehouse';

const run = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connected to database.');

        const inventory = await Inventory.findAll({
            where: {
                material_id: 6
            },
            include: [
                { model: Material, as: 'material' },
                { model: Warehouse, as: 'warehouse' }
            ]
        });

        console.log('Inventory for Material ID 6:');
        console.log(JSON.stringify(inventory, null, 2));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
};

run();
