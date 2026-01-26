
import { sequelize } from './src/database/connection'

const fixAnnexureData = async () => {
    try {
        await sequelize.authenticate()

        // Update ID 1
        await sequelize.query(`
      UPDATE annexures 
      SET 
        name = 'Standard Civil Works',
        title = 'Standard Civil Works Template',
        client_scope = '1. Water and electricity to be provided by client free of cost.\n2. Secure storage space for materials.\n3. Scaffolding if height exceeds 10ft.',
        contractor_scope = '1. Supply of all necessary materials.\n2. Experienced labor for execution.\n3. Supervision and quality control.',
        payment_terms = '50% Advance\n40% on Progress\n10% on Completion'
      WHERE id = 1
    `)

        // Update ID 2 if exists (it was in the count 3)
        await sequelize.query(`
      UPDATE annexures 
      SET 
        name = 'Labor Only Contract',
        title = 'Labor Only Template',
        client_scope = '1. All materials to be supplied by client.\n2. Water/Electricity on site.',
        contractor_scope = '1. Labor force only.\n2. Tools and tackles.',
        payment_terms = 'Weekly RA Bills'
      WHERE id = 2
    `)

        console.log('Fixed Annexure data.')

    } catch (err) {
        console.error(err)
    } finally {
        await sequelize.close()
    }
}

fixAnnexureData()
