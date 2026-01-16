const mysql = require('mysql2/promise')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') })

async function checkUser() {
    let connection
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'crm_construction',
        })

        const [rows] = await connection.query("SELECT id, email, username, company_id FROM users WHERE email = 'admin@crm.com'")
        console.log('User:', rows)

    } catch (error) {
        console.error('Error:', error)
    } finally {
        if (connection) await connection.end()
    }
}

checkUser()
