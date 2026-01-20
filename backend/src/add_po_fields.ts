import { sequelize } from './database/connection';

const run = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connected to database.');

        const queries = [
            `ALTER TABLE purchase_orders ADD COLUMN expected_delivery_date DATE;`,
            `ALTER TABLE purchase_orders ADD COLUMN shipping_address TEXT;`,
            `ALTER TABLE purchase_orders ADD COLUMN payment_terms TEXT;`,
            `ALTER TABLE purchase_orders ADD COLUMN notes TEXT;`
        ];

        for (const query of queries) {
            try {
                await sequelize.query(query);
                console.log(`Executed: ${query}`);
            } catch (err: any) {
                if (err.original && err.original.code === 'ER_DUP_FIELDNAME') {
                    console.log(`Skipped (already exists): ${query}`);
                } else {
                    console.error(`Error executing ${query}:`, err);
                }
            }
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
};

run();
