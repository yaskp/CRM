import './models/index';
import { sequelize } from './database/connection';
import Inventory from './models/Inventory';

const run = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connected to database.');

        // Add 1000 units of Material 8 to Warehouse 1
        const [inventory, created] = await Inventory.findOrCreate({
            where: {
                warehouse_id: 1,
                material_id: 8
            },
            defaults: {
                quantity: 1000,
                reserved_quantity: 0,
                min_stock_level: 10,
                max_stock_level: 10000
            }
        });

        if (!created) {
            await inventory.update({ quantity: 1000 });
            console.log('Updated existing inventory for Material 8 to 1000.');
        } else {
            console.log('Created new inventory for Material 8 with 1000 units.');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
};

run();
