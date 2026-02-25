import { sequelize } from '../src/database/connection'
import { QueryTypes } from 'sequelize'

async function migrate() {
    console.log('Starting migration: Adding scope_matrix columns...')
    try {
        // 1. Add scope_matrix to quotations
        await sequelize.query(`
            ALTER TABLE quotations 
            ADD COLUMN scope_matrix JSON DEFAULT NULL AFTER contractor_scope;
        `).catch(e => console.log('quotations.scope_matrix might already exist:', e.message))

        // 2. Add scope_matrix to annexures (template support)
        await sequelize.query(`
            ALTER TABLE annexures 
            ADD COLUMN scope_matrix JSON DEFAULT NULL AFTER contractor_scope;
        `).catch(e => console.log('annexures.scope_matrix might already exist:', e.message))

        // 3. Update Enum for Annexure Type if necessary
        // Note: MySQL/MariaDB might behave differently with ENUM. 
        // We'll check if we can add 'scope_matrix' to the type enum.
        try {
            await sequelize.query(`
                ALTER TABLE annexures 
                MODIFY COLUMN type ENUM('client_scope', 'contractor_scope', 'payment_terms', 'general_terms', 'purchase_order', 'scope_matrix') 
                DEFAULT 'general_terms';
            `)
            console.log('Updated Annexure type enum')
        } catch (e: any) {
            console.log('Failed to update enum (this is common):', e.message)
        }

        console.log('Migration completed successfully!')
        process.exit(0)
    } catch (error) {
        console.error('Migration failed:', error)
        process.exit(1)
    }
}

migrate()
