import { sequelize } from './database/connection';

const run = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connected to Database');

        console.log('Updating leads table with location fields...');
        const queryInterface = sequelize.getQueryInterface();

        const tableInfo = await queryInterface.describeTable('leads');

        if (!tableInfo.city) {
            await sequelize.query('ALTER TABLE leads ADD COLUMN city VARCHAR(100) NULL AFTER address;');
            console.log('Added city');
        }
        if (!tableInfo.state) {
            await sequelize.query('ALTER TABLE leads ADD COLUMN state VARCHAR(100) NULL AFTER city;');
            console.log('Added state');
        }
        if (!tableInfo.state_code) {
            await sequelize.query('ALTER TABLE leads ADD COLUMN state_code VARCHAR(2) NULL AFTER state;');
            console.log('Added state_code');
        }

        console.log('Successfully updated leads table');
    } catch (err: any) {
        console.error('Update failed:', err.message);
    } finally {
        await sequelize.close();
        process.exit(0);
    }
};

run();
