import { sequelize } from './src/database/connection.js';
import pkg from 'sequelize';
const { DataTypes } = pkg;

async function migrate() {
    try {
        console.log('--- STARTING MULTI-UNIT GST MIGRATION ---');
        const queryInterface = sequelize.getQueryInterface();

        // 1. Create Company Branches table
        console.log('Creating company_branches table...');
        await queryInterface.createTable('company_branches', {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            company_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: { model: 'companies', key: 'id' }
            },
            branch_name: {
                type: DataTypes.STRING(100),
                allowNull: false,
            },
            gstin: {
                type: DataTypes.STRING(20),
                allowNull: false,
            },
            state_code: {
                type: DataTypes.STRING(2),
                allowNull: false,
            },
            address: { type: DataTypes.TEXT },
            city: { type: DataTypes.STRING(100) },
            state: { type: DataTypes.STRING(100) },
            pincode: { type: DataTypes.STRING(10) },
            is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
            created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
            updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
        });

        // 2. Seed default branches (Maharashtra HO and Rajasthan Jaipur Site)
        console.log('Seeding default branches...');
        const [companies]: any = await sequelize.query('SELECT id FROM companies LIMIT 1');
        if (companies.length > 0) {
            const companyId = companies[0].id;
            await sequelize.query(`
        INSERT INTO company_branches (company_id, branch_name, gstin, state_code, address, city, state, pincode)
        VALUES 
        (${companyId}, 'Maharashtra - Head Office', '27AABCU9603R1ZM', '27', 'Sector 10, Nerul', 'Navi Mumbai', 'Maharashtra', '400706'),
        (${companyId}, 'Rajasthan - Jaipur Site Office', '08AABCU9603R1ZM', '08', 'Vaishali Nagar', 'Jaipur', 'Rajasthan', '302021'),
        (${companyId}, 'Gujarat - Regional Office', '24AABCU9603R1ZM', '24', 'S G Highway', 'Ahmedabad', 'Gujarat', '380054')
      `);
        }

        // 3. Add billing_unit_id to Purchase Orders
        console.log('Updating purchase_orders table...');
        const poDesc: any = await queryInterface.describeTable('purchase_orders');
        if (!poDesc.billing_unit_id) {
            await queryInterface.addColumn('purchase_orders', 'billing_unit_id', {
                type: DataTypes.INTEGER,
                allowNull: true,
                references: { model: 'company_branches', key: 'id' }
            });
        }

        // 4. Add billing_unit_id to Quotations
        console.log('Updating quotations table...');
        const quoteDesc: any = await queryInterface.describeTable('quotations');
        if (!quoteDesc.billing_unit_id) {
            await queryInterface.addColumn('quotations', 'billing_unit_id', {
                type: DataTypes.INTEGER,
                allowNull: true,
                references: { model: 'company_branches', key: 'id' }
            });
        }

        console.log('--- MIGRATION COMPLETE! ---');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
