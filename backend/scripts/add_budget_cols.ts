import { sequelize } from '../src/database/connection'

async function fixDb() {
    try {
        await sequelize.authenticate()
        console.log('Connected')

        // Expenses table
        try {
            await sequelize.query(`
            ALTER TABLE expenses 
            ADD COLUMN budget_head_id INT NULL,
            ADD CONSTRAINT fk_expenses_budget_head 
            FOREIGN KEY (budget_head_id) REFERENCES budget_heads(id)
        `)
            console.log('Added budget_head_id to expenses')
        } catch (e: any) {
            console.log('Error adding column (might exist):', e.original?.sqlMessage || e.message)
        }

        // Material table (just in case)
        try {
            await sequelize.query(`
            ALTER TABLE materials 
            ADD COLUMN budget_head_id INT NULL,
            ADD CONSTRAINT fk_materials_budget_head 
            FOREIGN KEY (budget_head_id) REFERENCES budget_heads(id)
        `)
            console.log('Added budget_head_id to materials')
        } catch (e: any) {
            console.log('Error adding column to materials (might exist):', e.original?.sqlMessage || e.message)
        }

        process.exit(0)
    } catch (error) {
        console.error('Fatal error:', error)
        process.exit(1)
    }
}

fixDb()
