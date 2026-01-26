
import { sequelize } from './src/database/connection';
import Quotation from './src/models/Quotation';
import QuotationItem from './src/models/QuotationItem';
import WorkOrderItem from './src/models/WorkOrderItem';

const run = async () => {
    try {
        console.log("Altering Quotation and QuotationItem tables...");
        await Quotation.sync({ alter: true });
        await QuotationItem.sync({ alter: true });

        console.log("Altering WorkOrderItem table...");
        await WorkOrderItem.sync({ alter: true });

        console.log('Structural changes applied successfully');
        process.exit(0);
    } catch (error) {
        console.error('Alteration failed:', error);
        process.exit(1);
    }
};

run();
