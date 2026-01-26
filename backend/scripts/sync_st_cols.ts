import { sequelize } from '../src/database/connection'

async function syncStoreTransactionColumns() {
    try {
        await sequelize.authenticate()
        console.log('Connected')

        const cols = [
            { name: 'source_type', type: "ENUM('warehouse', 'project', 'vendor') DEFAULT 'warehouse'" },
            { name: 'destination_type', type: "ENUM('warehouse', 'project', 'vendor') DEFAULT 'warehouse'" },
            { name: 'from_project_id', type: 'INT NULL', fk: 'projects(id)' },
            { name: 'to_project_id', type: 'INT NULL', fk: 'projects(id)' },
            { name: 'to_warehouse_id', type: 'INT NULL', fk: 'warehouses(id)' },
            { name: 'vendor_id', type: 'INT NULL', fk: 'vendors(id)' },
            { name: 'purchase_order_id', type: 'INT NULL', fk: 'purchase_orders(id)' },
            { name: 'to_building_id', type: 'INT NULL', fk: 'project_buildings(id)' },
            { name: 'to_floor_id', type: 'INT NULL', fk: 'project_floors(id)' },
            { name: 'to_zone_id', type: 'INT NULL', fk: 'project_zones(id)' },
            { name: 'temp_number', type: 'VARCHAR(50) NULL' },
            { name: 'cgst_amount', type: 'DECIMAL(15, 2) DEFAULT 0' },
            { name: 'sgst_amount', type: 'DECIMAL(15, 2) DEFAULT 0' },
            { name: 'igst_amount', type: 'DECIMAL(15, 2) DEFAULT 0' },
            { name: 'truck_number', type: 'VARCHAR(50) NULL' },
            { name: 'driver_name', type: 'VARCHAR(100) NULL' },
            { name: 'driver_phone', type: 'VARCHAR(20) NULL' },
            { name: 'quality_check_status', type: "ENUM('pending', 'passed', 'failed', 'partial') DEFAULT 'pending'" },
            { name: 'inspector_name', type: 'VARCHAR(100) NULL' },
            { name: 'inspection_date', type: 'DATE NULL' },
        ]

        for (const col of cols) {
            try {
                await sequelize.query(`
                ALTER TABLE store_transactions 
                ADD COLUMN ${col.name} ${col.type}
            `)
                console.log(`Added column ${col.name}`)

                if (col.fk) {
                    await sequelize.query(`
                    ALTER TABLE store_transactions 
                    ADD CONSTRAINT fk_st_${col.name}
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

syncStoreTransactionColumns()
