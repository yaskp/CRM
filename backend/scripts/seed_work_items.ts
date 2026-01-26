
import { sequelize } from '../src/database/connection';
import WorkItemType from '../src/models/WorkItemType';

const seedWorkItems = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        const items = [
            // D-Wall Specific
            { name: 'D-Wall Trenching / Excavation', code: 'DW-EXC', uom: 'CUM', description: 'Excavation of trench for diaphragm wall using grab.' },
            { name: 'Panel Concreting (Tremie)', code: 'DW-CONC', uom: 'CUM', description: 'Concreting of panels using tremie pipe method.' },
            { name: 'Rebar Cage Fabrication & Lowering', code: 'DW-REBAR', uom: 'MT', description: 'Cutting, bending, binding and lowering of reinforcement cage.' },
            { name: 'Stop-End Installation & Extraction', code: 'DW-STOP', uom: 'NOS', description: 'Installation and removal of steel stop-ends for panel joints.' },
            { name: 'Bentonite / Slurry Management', code: 'DW-SLR', uom: 'LS', description: 'Preparation and circulation of bentonite/polymer slurry.' },
            { name: 'Rock Anchoring / Strutting', code: 'DW-ANC', uom: 'RMT', description: 'Installation of rock anchors or steel struts for wall support.' },

            // Labour / General
            { name: 'Skilled Labour (Technician)', code: 'LAB-SKL', uom: 'DAY', description: 'High-skilled labour like fitters, welders, or rig operators.' },
            { name: 'Unskilled Labour (Helper)', code: 'LAB-UNSKL', uom: 'DAY', description: 'General helpers for site work.' },
            { name: 'Site Supervision & Management', code: 'STAFF-SUP', uom: 'MONTH', description: 'Charges for site engineers and supervisors.' },
            { name: 'PCC Work (Plain Cement Concrete)', code: 'CIV-PCC', uom: 'CUM', description: 'Laying of plain cement concrete for leveling/foundation.' },
            { name: 'RCC Work (Reinforced Concrete)', code: 'CIV-RCC', uom: 'CUM', description: 'General reinforced concrete work including formwork.' }
        ];

        for (const item of items) {
            const [record, created] = await WorkItemType.findOrCreate({
                where: { code: item.code },
                defaults: item
            });
            if (created) {
                console.log(`Created: ${item.name}`);
            } else {
                console.log(`Exists: ${item.name}`);
            }
        }

        console.log('Work Item Master Seeding Completed.');
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
};

seedWorkItems();
