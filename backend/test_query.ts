import { DrawingPanel } from './src/models/index.js';
import { sequelize } from './src/database/connection.js';

const testQuery = async () => {
    try {
        const panels = await DrawingPanel.findAll({
            where: { drawing_id: '3' },
            include: [
                {
                    association: 'dprRecords',
                    order: [['report_date', 'DESC']],
                },
                {
                    association: 'consumptions', // The new StoreTransaction association
                    where: { transaction_type: 'CONSUMPTION' },
                    required: false,
                    include: [
                        { association: 'items' },
                        { association: 'rmcLogs' }
                    ],
                    order: [['transaction_date', 'DESC']],
                }
            ],
            logging: (sql) => console.log('SQL:', sql)
        });
        console.log('Panels found:', panels.length);
        if (panels.length > 0 && panels[0].get('consumptions')) {
            console.log('Consumptions found:', (panels[0].get('consumptions') as any).length);
        }
    } catch (error) {
        console.error('Query Error:', error);
    } finally {
        await sequelize.close();
    }
};

testQuery();
