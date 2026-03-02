
import '../models/index';
import DrawingPanel from '../models/DrawingPanel';
import StoreTransaction from '../models/StoreTransaction';

async function testQuery() {
    try {
        const panels = await DrawingPanel.findAll({
            limit: 1,
            include: [
                {
                    association: 'consumptions',
                    where: { transaction_type: 'CONSUMPTION' },
                    required: false,
                }
            ],
        });
        console.log("Query successful, found", panels.length, "panels");
    } catch (error) {
        console.error("Query failed:", error.message);
        if (error.sql) console.log("SQL:", error.sql);
    } finally {
        process.exit(0);
    }
}

testQuery();
