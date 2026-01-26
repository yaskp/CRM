
import { sequelize } from '../src/database/connection';
import fs from 'fs';
import path from 'path';

const runMigration = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        const sql = fs.readFileSync(path.join(process.cwd(), '../database/migrations/010_create_work_templates.sql'), 'utf8');
        const commands = sql.split(';').filter(cmd => cmd.trim().length > 0);

        for (const cmd of commands) {
            await sequelize.query(cmd);
        }

        console.log('Work Templates tables created.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

runMigration();
