
import { sequelize } from '../src/database/connection';
import * as fs from 'fs';
import * as path from 'path';

const run = async () => {
    try {
        const sql = fs.readFileSync(path.join(__dirname, '../../database/migrations/025_add_work_item_type_to_zones.sql'), 'utf8');
        await sequelize.query(sql);
        console.log('Migration 025 executed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

run();
