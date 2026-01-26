import { sequelize } from './src/database/connection';

async function migrate() {
    try {
        console.log('Adding drawing_panel_id to daily_progress_reports table...');
        await sequelize.query(`
      ALTER TABLE daily_progress_reports 
      ADD COLUMN drawing_panel_id INT NULL,
      ADD CONSTRAINT fk_dpr_drawing_panels FOREIGN KEY (drawing_panel_id) REFERENCES drawing_panels(id);
    `);
        console.log('Database updated successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Error updating database:', error);
        process.exit(1);
    }
}

migrate();
