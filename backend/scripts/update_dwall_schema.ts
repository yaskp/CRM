import { sequelize } from '../src/database/connection.ts'

async function updateDWallSchema() {
    try {
        await sequelize.authenticate()
        console.log('Connected to DB')

        // 1. Update drawing_panels table
        const panelCols = [
            { name: 'design_depth', type: 'DECIMAL(10, 2)' },
            { name: 'width', type: 'DECIMAL(10, 2)' },
            { name: 'thickness', type: 'DECIMAL(10, 2)' },
            { name: 'theoretical_concrete_volume', type: 'DECIMAL(10, 2)' },
            { name: 'theoretical_steel_kg', type: 'DECIMAL(10, 2)' }
        ]

        for (const col of panelCols) {
            try {
                await sequelize.query(`ALTER TABLE drawing_panels ADD COLUMN ${col.name} ${col.type}`)
                console.log(`Added ${col.name} to drawing_panels`)
            } catch (e) {
                console.log(`Skipping ${col.name} in drawing_panels (might exist)`)
            }
        }

        // 2. Update daily_progress_reports table
        const dprCols = [
            { name: 'actual_depth', type: 'DECIMAL(10, 2)' },
            { name: 'verticality_x', type: 'DECIMAL(5, 2)' },
            { name: 'verticality_y', type: 'DECIMAL(5, 2)' },
            { name: 'slurry_density', type: 'DECIMAL(5, 3)' },
            { name: 'slurry_viscosity', type: 'DECIMAL(5, 2)' },
            { name: 'slurry_sand_content', type: 'DECIMAL(5, 2)' },
            { name: 'cage_id_ref', type: 'STRING(100)' },
            { name: 'start_time', type: 'STRING(10)' },
            { name: 'end_time', type: 'STRING(10)' },
            { name: 'slump_flow', type: 'DECIMAL(10, 2)' },
            { name: 'tremie_pipe_count', type: 'INT' },
            { name: 'theoretical_concrete_qty', type: 'DECIMAL(10, 2)' },
            { name: 'overbreak_percentage', type: 'DECIMAL(10, 2)' }
        ]

        for (const col of dprCols) {
            try {
                // Determine actual SQL type mapping for "STRING"
                const sqlType = col.type.startsWith('STRING') ? `VARCHAR${col.type.substring(6)}` : col.type;
                await sequelize.query(`ALTER TABLE daily_progress_reports ADD COLUMN ${col.name} ${sqlType}`)
                console.log(`Added ${col.name} to daily_progress_reports`)
            } catch (e) {
                console.log(`Skipping ${col.name} in daily_progress_reports (might exist)`)
            }

            try {
                const sqlType = col.type.startsWith('STRING') ? `VARCHAR${col.type.substring(6)}` : col.type;
                await sequelize.query(`ALTER TABLE store_transactions ADD COLUMN ${col.name} ${sqlType}`)
                console.log(`Added ${col.name} to store_transactions`)
            } catch (e) {
                console.log(`Skipping ${col.name} in store_transactions (might exist)`)
            }
        }

        // 3. Create dpr_rmc_logs table
        await sequelize.query(`
            CREATE TABLE IF NOT EXISTS dpr_rmc_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                dpr_id INT NOT NULL,
                vehicle_no VARCHAR(50) NOT NULL,
                quantity DECIMAL(10, 2) NOT NULL,
                slump DECIMAL(10, 2),
                in_time VARCHAR(10),
                start_time VARCHAR(10),
                out_time VARCHAR(10),
                remarks TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (dpr_id) REFERENCES daily_progress_reports(id) ON DELETE CASCADE
            )
        `)
        console.log('Created table dpr_rmc_logs')

        console.log('Schema update complete!')
        process.exit(0)
    } catch (error) {
        console.error('Fatal error:', error)
        process.exit(1)
    }
}

updateDWallSchema()
