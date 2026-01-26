import { sequelize } from '../src/database/connection'

async function finalSync() {
    try {
        await sequelize.authenticate()
        console.log('Connected')

        const configs = [
            {
                table: 'daily_progress_reports',
                cols: [
                    { name: 'work_completion_percentage', type: 'DECIMAL(5, 2) DEFAULT 0' }
                ]
            },
            {
                table: 'inventory_ledger',
                cols: [
                    { name: 'project_id', type: 'INT NULL', fk: 'projects(id)' },
                    { name: 'building_id', type: 'INT NULL', fk: 'project_buildings(id)' },
                    { name: 'floor_id', type: 'INT NULL', fk: 'project_floors(id)' },
                    { name: 'zone_id', type: 'INT NULL', fk: 'project_zones(id)' },
                    { name: 'work_item_type_id', type: 'INT NULL', fk: 'work_item_types(id)' },
                ]
            }
        ]

        for (const config of configs) {
            for (const col of config.cols) {
                try {
                    await sequelize.query(`
                    ALTER TABLE ${config.table} 
                    ADD COLUMN ${col.name} ${col.type}
                `)
                    console.log(`Added column ${col.name} to ${config.table}`)

                    if (col.fk) {
                        await sequelize.query(`
                        ALTER TABLE ${config.table} 
                        ADD CONSTRAINT fk_${config.table}_${col.name}
                        FOREIGN KEY (${col.name}) REFERENCES ${col.fk}
                    `)
                        console.log(`Added FK for ${col.name} in ${config.table}`)
                    }
                } catch (e: any) {
                    console.log(`Skipping ${col.name} in ${config.table} (might exist):`, e.original?.sqlMessage || e.message)
                }
            }
        }

        process.exit(0)
    } catch (error) {
        console.error('Fatal error:', error)
        process.exit(1)
    }
}

finalSync()
