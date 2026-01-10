const mysql = require('mysql2/promise')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../../backend/.env') })

async function runMigrations() {
    let connection

    try {
        // Create connection
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'crm_construction',
            multipleStatements: true
        })

        console.log('Connected to database')

        // Read all migration files
        const migrationFiles = fs.readdirSync(__dirname)
            .filter(file => file.endsWith('.sql'))
            .sort()

        console.log(`Found ${migrationFiles.length} migration files`)

        for (const file of migrationFiles) {
            console.log(`\nRunning migration: ${file}`)

            const sql = fs.readFileSync(path.join(__dirname, file), 'utf8')

            try {
                await connection.query(sql)
                console.log(`✓ ${file} completed successfully`)
            } catch (error) {
                // Check if error is due to duplicate entry or table already exists
                if (error.code === 'ER_DUP_ENTRY' || error.code === 'ER_TABLE_EXISTS_ERROR') {
                    console.log(`⚠ ${file} - Already applied (skipping)`)
                } else {
                    console.error(`✗ ${file} failed:`, error.message)
                    throw error
                }
            }
        }

        console.log('\n✓ All migrations completed successfully')

    } catch (error) {
        console.error('Migration error:', error)
        process.exit(1)
    } finally {
        if (connection) {
            await connection.end()
        }
    }
}

runMigrations()
