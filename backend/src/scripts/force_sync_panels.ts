
import { sequelize } from '../database/connection';
import DrawingPanel from '../models/DrawingPanel';

async function forceSync() {
    try {
        await sequelize.authenticate();
        console.log('Database connection OK.');

        // Sync only the DrawingPanel model
        await DrawingPanel.sync({ alter: true });
        console.log('DrawingPanel model synced successfully (alter: true).');

    } catch (error) {
        console.error('Error syncing DrawingPanel:', error);
    } finally {
        await sequelize.close();
    }
}

forceSync();
