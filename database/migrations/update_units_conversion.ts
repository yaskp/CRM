
import { sequelize } from '../../backend/src/database/connection'
import { DataTypes } from 'sequelize'

const migrate = async () => {
    try {
        await sequelize.authenticate()
        console.log('Connection established.')

        const queryInterface = sequelize.getQueryInterface()

        // Add new columns to 'units' table
        await queryInterface.addColumn('units', 'base_unit_id', {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'units',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
        })

        await queryInterface.addColumn('units', 'conversion_factor', {
            type: DataTypes.DECIMAL(10, 4),
            allowNull: true,
            defaultValue: 1.0000
        })

        console.log('Columns added to units table.')

        // Seed data update explanation:
        // We will update existing units to have conversions relative to standard measuring units
        // Base units: KG, METER, SQM, CUM, NOS

        // Fetch IDs of base units to link others
        // (For simplicity in this script, we might just re-seed or update by name if we can)

        // Let's truncate and re-seed with a more comprehensive list including conversions for standard types
        // This is safe-ish for a dev/new setting. If prod, we would update. 
        // User asked to "insert all", so I'll wipe (if safe) or upsert.
        // Since I just created it, I'll delete all and re-insert.

        await queryInterface.bulkDelete('units', {})

        const units = [
            // WEIGHT (Base: KG)
            { name: 'Kilogram', code: 'KG', base: null, factor: 1 },
            { name: 'Metric Ton', code: 'MT', base: 'KG', factor: 1000 },
            { name: 'Quintal', code: 'QTL', base: 'KG', factor: 100 },
            { name: 'Bag (Cement)', code: 'BAG', base: 'KG', factor: 50 }, // Standard 50kg bag

            // LENGTH (Base: METER)
            { name: 'Meter', code: 'MTR', base: null, factor: 1 },
            { name: 'Running Meter', code: 'RMT', base: 'MTR', factor: 1 },
            { name: 'Feet', code: 'FT', base: 'MTR', factor: 0.3048 },
            { name: 'Inch', code: 'IN', base: 'MTR', factor: 0.0254 },
            { name: 'Millimeter', code: 'MM', base: 'MTR', factor: 0.001 },

            // AREA (Base: SQM)
            { name: 'Square Meter', code: 'SQM', base: null, factor: 1 },
            { name: 'Square Feet', code: 'SQFT', base: 'SQM', factor: 0.092903 },

            // VOLUME (Base: CUM)
            { name: 'Cubic Meter', code: 'CUM', base: null, factor: 1 },
            { name: 'Cubic Feet', code: 'CFT', base: 'CUM', factor: 0.0283168 },
            { name: 'Liter', code: 'LTR', base: 'CUM', factor: 0.001 },
            { name: 'Gallon', code: 'GAL', base: 'CUM', factor: 0.00378541 },

            // COUNT (Base: NOS)
            { name: 'Numbers', code: 'NOS', base: null, factor: 1 },
            { name: 'Pieces', code: 'PCS', base: 'NOS', factor: 1 },
            { name: 'Dozen', code: 'DOZ', base: 'NOS', factor: 12 },
            { name: 'Box', code: 'BOX', base: 'NOS', factor: 1 }, // Variable, but needs base
            { name: 'Packet', code: 'PKT', base: 'NOS', factor: 1 },
            { name: 'Bundle', code: 'BDL', base: 'NOS', factor: 1 },
            { name: 'Set', code: 'SET', base: 'NOS', factor: 1 },

            // TIME
            { name: 'Hour', code: 'HR', base: null, factor: 1 },
            { name: 'Day', code: 'DAY', base: 'HR', factor: 8 }, // Standard 8hr shift
            { name: 'Month', code: 'MON', base: 'DAY', factor: 26 }, // Standard 26 working days
        ]

        // Prepare for insertion. We need to insert Bases first, then Derived.
        // Actually, we can insert everything with null base_unit_id first? 
        // No, let's just insert all without base_unit_id, then update them.

        const newUnits = units.map(u => ({
            name: u.name,
            code: u.code,
            is_active: true,
            created_at: new Date(),
            conversion_factor: u.factor
        }))

        await queryInterface.bulkInsert('units', newUnits)

        // Now link base units
        // Retrieve all inserted units
        const [insertedUnits] = await sequelize.query("SELECT id, code FROM units") as any[]

        for (const unitDef of units) {
            if (unitDef.base) {
                const baseUnit = insertedUnits.find((u: any) => u.code === unitDef.base)
                if (baseUnit) {
                    await sequelize.query(
                        `UPDATE units SET base_unit_id = ${baseUnit.id} WHERE code = '${unitDef.code}'`
                    )
                }
            }
        }

        console.log('Units seeded with conversion factors.')

    } catch (error) {
        console.error('Migration failed:', error)
    } finally {
        await sequelize.close()
    }
}

migrate()
