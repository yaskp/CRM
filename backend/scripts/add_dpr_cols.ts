import { sequelize } from '../src/database/connection'

async function addDPRColumns() {
    try {
        await sequelize.authenticate()
        console.log('Connected')

        const cols = [
            { name: 'work_item_type_id', type: 'INT NULL', fk: 'work_item_types(id)' },
            // Add others if possibly missing (model said they existed, but table might not have them if created long ago)
            { name: 'building_id', type: 'INT NULL', fk: 'project_buildings(id)' },
            { name: 'floor_id', type: 'INT NULL', fk: 'project_floors(id)' },
            { name: 'zone_id', type: 'INT NULL', fk: 'project_zones(id)' },
        ]

        for (const col of cols) {
            try {
                await sequelize.query(`
                ALTER TABLE daily_progress_reports 
                ADD COLUMN ${col.name} ${col.type}
            `)
                console.log(`Added column ${col.name}`)

                if (col.fk) {
                    await sequelize.query(`
                    ALTER TABLE daily_progress_reports 
                    ADD CONSTRAINT fk_dpr_${col.name}
                    FOREIGN KEY (${col.name}) REFERENCES ${col.fk}
                `)
                    console.log(`Added FK for ${col.name}`)
                }
            } catch (e: any) {
                console.log(`Skipping ${col.name} (might exist):`, e.original?.sqlMessage || e.message)
            }
        }

        process.exit(0)
    } catch (error) {
        console.error('Fatal error:', error)
        process.exit(1)
    }
}

addDPRColumns()
