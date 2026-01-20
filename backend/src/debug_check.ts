import dotenv from 'dotenv';
dotenv.config();

import { sequelize } from './database/connection';
import './models/index';
import User from './models/User';
import Project from './models/Project';
import Expense from './models/Expense';
import DailyProgressReport from './models/DailyProgressReport';
import fs from 'fs';
import path from 'path';

const debug = async () => {
    try {
        await sequelize.authenticate();

        let output = '';
        const log = (msg: string) => { output += msg + '\n'; console.log(msg); };

        log('Database Connected Successfully');

        // Check Users
        const users = await User.findAll();
        log(`\nUsers Found: ${users.length}`);
        for (const u of users) {
            const roles = await u.getRoles();
            log(`- ID: ${u.id}, User: ${u.username}, Company: ${u.company_id}, Roles: [${roles.map((r: any) => r.name).join(', ')}]`);
        }

        // Check Projects
        const projects = await Project.findAll();
        log(`\nProjects Found: ${projects.length}`);
        for (const p of projects) {
            log(`- ID: ${p.id}, Code: ${p.project_code}, Name: ${p.name}, Company: ${p.company_id}, CreatedBy: ${p.created_by}, Status: ${p.status}`);
        }

        // Check Expenses
        const expenseCount = await Expense.count();
        log(`\nExpenses Found: ${expenseCount}`);

        // Check DPR
        const dprCount = await DailyProgressReport.count();
        log(`\nDPR Found: ${dprCount}`);

        const filePath = path.join(process.cwd(), 'debug_result_v2.txt');
        log(`Writing to ${filePath}`);
        fs.writeFileSync(filePath, output);

    } catch (err) {
        console.error('Debug Error:', err);
    } finally {
        await sequelize.close();
    }
};

debug();
