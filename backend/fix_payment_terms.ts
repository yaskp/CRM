
import { sequelize } from './src/database/connection'
import { DataTypes } from 'sequelize'

async function fixPaymentTerms() {
    try {
        await sequelize.authenticate()
        console.log('Connected.')
        await sequelize.getQueryInterface().changeColumn('work_orders', 'payment_terms', {
            type: DataTypes.TEXT,
            allowNull: true
        })
        console.log('payment_terms column changed to TEXT successfully.')
    } catch (error: any) {
        console.error('Error:', error.message)
    } finally {
        await sequelize.close()
    }
}

fixPaymentTerms()
