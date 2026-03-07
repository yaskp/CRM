import { sequelize } from '../database/connection'

const updateEnum = async () => {
    try {
        await sequelize.query(`
            ALTER TABLE quotations 
            MODIFY COLUMN status ENUM('draft', 'sent', 'accepted', 'rejected', 'approved', 'accepted_by_party', 'superseded') DEFAULT 'draft'
        `);
        console.log('Quotation status ENUM updated successfully!');
    } catch (e) {
        console.error('Failed to update ENUM', e);
    } finally {
        await sequelize.close();
    }
}

updateEnum();
