
const { sequelize } = require('./backend/src/database/connection');

async function checkTable() {
    try {
        const [results] = await sequelize.query("SHOW TABLES LIKE 'warehouses'");
        if (results.length > 0) {
            console.log('Table warehouses exists');
            const [columns] = await sequelize.query("SHOW COLUMNS FROM warehouses");
            console.log('Columns:', JSON.stringify(columns, null, 2));
        } else {
            console.log('Table warehouses does NOT exist');
        }

        const [poColumns] = await sequelize.query("SHOW COLUMNS FROM purchase_orders LIKE 'warehouse_id'");
        console.log('purchase_orders warehouse_id exists:', poColumns.length > 0);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

checkTable();
