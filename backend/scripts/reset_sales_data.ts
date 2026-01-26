
import { sequelize } from '../src/database/connection';
import Project from '../src/models/Project';
import Lead from '../src/models/Lead';
import Quotation from '../src/models/Quotation';
import ProjectBOQ from '../src/models/ProjectBOQ';
import ProjectBOQItem from '../src/models/ProjectBOQItem';
import Client from '../src/models/Client';
import Warehouse from '../src/models/Warehouse';
import InventoryItem from '../src/models/InventoryItem';

const resetSalesData = async () => {
    console.log('Resetting Sales Data (Projects, Leads, Quotes)...');
    try {
        await sequelize.transaction(async (t) => {
            // 1. Delete Inventory Items related to sites (optional, but good for clean slate)
            await InventoryItem.destroy({ where: {}, transaction: t });
            console.log('- Inventory Cleared');

            // 2. Delete BOQ Items and BOQs
            await ProjectBOQItem.destroy({ where: {}, transaction: t });
            await ProjectBOQ.destroy({ where: {}, transaction: t });
            console.log('- BOQs Cleared');

            // 3. Clear Project Links in Leads and Quotes
            // We need to unlink first before deleting projects if constraints exist, 
            // but CASCADE usually handles it. However, Lead.project_id might be set.
            // Let's just update all leads and quotes to have null project_id
            await Lead.update({ project_id: null, client_id: null, status: 'new' }, { where: {}, transaction: t });
            await Quotation.update({ project_id: null }, { where: {}, transaction: t });
            console.log('- Unlinked Leads & Quotes');

            // 4. Delete Projects and Warehouses
            // Warehouses might be linked to projects
            await Warehouse.destroy({ where: { type: 'site' }, transaction: t });
            await Project.destroy({ where: {}, transaction: t });
            console.log('- Projects and Site Warehouses Deleted');

            // 5. Delete Quotations (All?)
            await Quotation.destroy({ where: {}, transaction: t });
            console.log('- Quotations Deleted');

            // 6. Delete Leads (All?)
            await Lead.destroy({ where: {}, transaction: t });
            console.log('- Leads Deleted');

            // 7. Delete Clients (All?)
            await Client.destroy({ where: {}, transaction: t });
            console.log('- Clients Deleted');
        });

        console.log('Successfully reset all sales data!');
        process.exit(0);
    } catch (error) {
        console.error('Failed to reset data:', error);
        process.exit(1);
    }
};

resetSalesData();
