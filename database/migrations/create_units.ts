
import { sequelize } from '../src/database/connection'
import { DataTypes } from 'sequelize'

const migrate = async () => {
    try {
        await sequelize.authenticate()
        console.log('Connection established.')

        const queryInterface = sequelize.getQueryInterface()

        await queryInterface.createTable('units', {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            name: {
                type: DataTypes.STRING(50),
                allowNull: false,
            },
            code: {
                type: DataTypes.STRING(20),
                allowNull: false,
                unique: true,
            },
            is_active: {
                type: DataTypes.BOOLEAN,
                defaultValue: true,
            },
            created_at: {
                type: DataTypes.DATE,
                defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
            },
        })

        console.log('Table units created.')

        // Seed initial data
        const initialUnits = [
            { name: 'Kilogram', code: 'KG' },
            { name: 'Metric Ton', code: 'MT' },
            { name: 'Ton', code: 'Ton' },
            { name: 'Bag', code: 'Bag' },
            { name: 'Numbers', code: 'Nos' },
            { name: 'Pieces', code: 'Pcs' },
            { name: 'Square Feet', code: 'Sqft' },
            { name: 'Square Meter', code: 'Sqm' },
            { name: 'Cubic Feet', code: 'Cft' },
            { name: 'Cubic Meter', code: 'Cum' },
            { name: 'Liter', code: 'Ltr' },
            { name: 'Running Meter', code: 'Rmt' },
            { name: 'Bundle', code: 'Bundle' },
            { name: 'Box', code: 'Box' },
            { name: 'Packet', code: 'Packet' },
        ]

        await queryInterface.bulkInsert('units', initialUnits.map(t => ({
            ...t,
            is_active: true,
            created_at: new Date()
        })))

        console.log('Initial units seeded.')

    } catch (error) {
        console.error('Migration failed:', error)
    } finally {
        await sequelize.close()
    }
}

migrate()
