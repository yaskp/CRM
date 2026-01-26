
import { sequelize } from './src/database/connection'

const fixAnnexureDataReal = async () => {
    try {
        await sequelize.authenticate()

        // Update ID 1: Standard Civil Works
        await sequelize.query(`
      UPDATE annexures 
      SET 
        name = 'Standard Civil Works',
        title = 'Standard Civil & Labor Template',
        client_scope = '1. Water and electricity to be provided by client free of cost.\\n2. Secure storage space for materials.\\n3. Scaffolding if height exceeds 10ft.',
        contractor_scope = '1. Supply of all necessary materials.\\n2. Experienced labor for execution.\\n3. Supervision and quality control.',
        payment_terms = '50% Advance\\n40% on Progress\\n10% on Completion',
        clauses = '["1. All work will be executed as per standard engineering practices.", "2. Any extra work not mentioned in BOQ will be charged separately.", "3. GST will be extra as applicable.", "4. Water and Electricity to be provided by client free of cost."]'
      WHERE id = 1
    `)

        console.log('Fixed Annexure 1 data.')

    } catch (err) {
        console.error(err)
    } finally {
        await sequelize.close()
    }
}

fixAnnexureDataReal()
