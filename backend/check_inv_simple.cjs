const mysql = require('mysql2/promise');

async function main() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'root',
        database: 'crm_construction'
    });
    const [rows] = await connection.execute('DESCRIBE inventory');
    console.log(JSON.stringify(rows, null, 2));
    await connection.end();
}

main().catch(console.error);
