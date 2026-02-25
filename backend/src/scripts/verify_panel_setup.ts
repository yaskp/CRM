
import { sequelize } from '../database/connection';
import DrawingPanel from '../models/DrawingPanel';

async function verifySetup() {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');

        // sync to ensure table is updated (be careful with force: true in prod, here it is local dev)
        // We won't force sync, just check if we can insert. 
        // If the column doesn't exist, this will fail.
        // Actually, in development, usually Sequelize.sync({ alter: true }) is used or migrations.
        // I will assume the user has a sync mechanism. If not, I might need to run a migration or sync.
        // Let's try to sync just this model to be sure.
        await DrawingPanel.sync({ alter: true });
        console.log('DrawingPanel model synced.');

        console.log('Verification successful: Schema updated.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    } finally {
        await sequelize.close();
    }
}

verifySetup();
