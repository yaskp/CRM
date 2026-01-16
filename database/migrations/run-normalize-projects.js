const mysql = require('mysql2/promise')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../../backend/.env') })

async function runMigration() {
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

        const file = '006_normalize_projects.sql'
        console.log(`\nRunning migration: ${file}`)
        const sql = fs.readFileSync(path.join(__dirname, file), 'utf8')

        try {
            await connection.query(sql)
            console.log(`✓ ${file} completed successfully`)
        } catch (error) {
            console.error(`✗ ${file} failed:`, error.message)
            throw error
        }

    } catch (error) {
        console.error('Migration error:', error)
        process.exit(1)
    } finally {
        if (connection) await connection.end()
    }
}

runMigration()
