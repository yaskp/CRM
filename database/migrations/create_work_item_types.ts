
import { sequelize } from '../src/database/connection'
import { DataTypes } from 'sequelize'

const migrate = async () => {
    try {
        await sequelize.authenticate()
        console.log('Connection established.')

        const queryInterface = sequelize.getQueryInterface()

        await queryInterface.createTable('work_item_types', {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            name: {
                type: DataTypes.STRING(100),
                allowNull: false,
                unique: true,
            },
            code: {
                type: DataTypes.STRING(50),
                allowNull: true,
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: true,
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

        console.log('Table work_item_types created.')

        // Seed initial data
        const initialTypes = [
            { name: 'Guide Wall', code: 'GW', description: 'Construction of guide wall' },
            { name: 'Grabbing', code: 'GR', description: 'Excavation via grabbing' },
            { name: 'Stop End', code: 'SE', description: 'Installation of stop ends' },
            { name: 'Rubber Stop', code: 'RS', description: '' },
            { name: 'Steel Fabrication', code: 'SF', description: 'Cage fabrication' },
            { name: 'Anchor', code: 'ANC', description: 'Anchor installation' },
            { name: 'Anchor Sleeve', code: 'ANS', description: 'Sleeve placement' },
        ]

        await queryInterface.bulkInsert('work_item_types', initialTypes.map(t => ({
            ...t,
            is_active: true,
            created_at: new Date()
        })))

        console.log('Initial data seeded.')

    } catch (error) {
        console.error('Migration failed:', error)
    } finally {
        await sequelize.close()
    }
}

migrate()
