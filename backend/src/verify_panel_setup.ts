
import { sequelize } from './database/connection';
import DrawingPanel from './models/DrawingPanel';

async function verifySetup() {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');

        // Force sync for DrawingPanel to update schema
        await DrawingPanel.sync({ alter: true });
        console.log('DrawingPanel model synced with alter: true.');

    } catch (error) {
        console.error('Unable to connect to the database:', error);
    } finally {
        await sequelize.close();
    }
}

verifySetup();
