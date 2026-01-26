import { sequelize } from './src/database/connection';

async function migrate() {
    try {
        console.log('Allowing NULL for file_url in drawings table...');
        await sequelize.query(`
      ALTER TABLE drawings 
      MODIFY COLUMN file_url VARCHAR(500) NULL;
    `);
        console.log('Database updated successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Error updating database:', error);
        process.exit(1);
    }
}

migrate();
