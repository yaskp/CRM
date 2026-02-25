
import { sequelize } from './src/database/connection'
import { DataTypes } from 'sequelize'

async function addScopeMatrixColumn() {
    try {
        await sequelize.authenticate()
        console.log('Database connection established.')

        const queryInterface = sequelize.getQueryInterface()
        const tableInfo = await queryInterface.describeTable('work_orders')

        if (!tableInfo['scope_matrix']) {
            console.log('Adding scope_matrix column to work_orders table...')
            await queryInterface.addColumn('work_orders', 'scope_matrix', {
                type: DataTypes.JSON,
                allowNull: true,
            })
            console.log('scope_matrix column added successfully.')
        } else {
            console.log('scope_matrix column already exists.')
        }

    } catch (error) {
        console.error('Error adding column:', error)
    } finally {
        await sequelize.close()
    }
}

addScopeMatrixColumn()
