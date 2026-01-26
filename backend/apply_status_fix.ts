import { sequelize } from './src/database/connection';

async function fixEnum() {
    try {
        console.log('Adding superseded to quotations status enum...');
        await sequelize.query(`
      ALTER TABLE quotations 
      MODIFY COLUMN status ENUM('draft', 'sent', 'accepted', 'rejected', 'approved', 'accepted_by_party', 'superseded') NOT NULL DEFAULT 'draft';
    `);
        console.log('Database updated successfully.');

        // Also clean up Lead 112 data for demonstration
        console.log('Cleaning up old versions for Lead 112...');
        await sequelize.query(`
      UPDATE quotations 
      SET status = 'superseded' 
      WHERE lead_id = (SELECT id FROM leads WHERE name = 'Lead 112' LIMIT 1)
      AND version_number < (
        SELECT max_v FROM (
          SELECT MAX(version_number) as max_v FROM quotations WHERE lead_id = (SELECT id FROM leads WHERE name = 'Lead 112' LIMIT 1)
        ) as t
      );
    `);
        console.log('Lead 112 versions updated.');

        process.exit(0);
    } catch (error) {
        console.error('Error updating database:', error);
        process.exit(1);
    }
}

fixEnum();
