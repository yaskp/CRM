const mysql = require('mysql2/promise')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../../backend/.env') })

async function addUsernameColumn() {
    let connection

    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'crm_construction',
            multipleStatements: true
        })

        console.log('Connected to database')

        const sql = fs.readFileSync(path.join(__dirname, '004_add_username_to_users.sql'), 'utf8')

        await connection.query(sql)
        console.log('✓ Username column added successfully')

    } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
            console.log('⚠ Username column already exists (skipping)')
        } else {
            console.error('Migration error:', error.message)
            process.exit(1)
        }
    } finally {
        if (connection) {
            await connection.end()
        }
    }
}

addUsernameColumn()
