const mysql = require('mysql2/promise')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../../backend/.env') })

async function enhanceProjectsTable() {
    let connection

    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'crm_construction',
        })

        console.log('Connected to database')
        console.log('Checking existing columns...')

        // Get existing columns
        const [columns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'projects'
    `, [process.env.DB_NAME || 'crm_construction'])

        const existingColumns = columns.map(row => row.COLUMN_NAME)
        console.log('Existing columns:', existingColumns.length)

        // Define columns to add
        const columnsToAdd = [
            { name: 'project_type', sql: "ALTER TABLE projects ADD COLUMN project_type ENUM('residential', 'commercial', 'industrial', 'infrastructure', 'renovation', 'other') NOT NULL DEFAULT 'residential' AFTER name" },
            { name: 'client_name', sql: "ALTER TABLE projects ADD COLUMN client_name VARCHAR(200) NOT NULL DEFAULT 'Unknown Client' AFTER project_type" },
            { name: 'client_contact_person', sql: "ALTER TABLE projects ADD COLUMN client_contact_person VARCHAR(100) AFTER client_name" },
            { name: 'client_email', sql: "ALTER TABLE projects ADD COLUMN client_email VARCHAR(100) AFTER client_contact_person" },
            { name: 'client_phone', sql: "ALTER TABLE projects ADD COLUMN client_phone VARCHAR(20) AFTER client_email" },
            { name: 'client_address', sql: "ALTER TABLE projects ADD COLUMN client_address TEXT AFTER client_phone" },
            { name: 'client_gst_number', sql: "ALTER TABLE projects ADD COLUMN client_gst_number VARCHAR(15) AFTER client_address" },
            { name: 'client_pan_number', sql: "ALTER TABLE projects ADD COLUMN client_pan_number VARCHAR(10) AFTER client_gst_number" },
            { name: 'site_address', sql: "ALTER TABLE projects ADD COLUMN site_address TEXT AFTER site_location" },
            { name: 'site_pincode', sql: "ALTER TABLE projects ADD COLUMN site_pincode VARCHAR(10) AFTER site_state" },
            { name: 'site_area', sql: "ALTER TABLE projects ADD COLUMN site_area DECIMAL(10, 2) AFTER site_pincode" },
            { name: 'site_area_unit', sql: "ALTER TABLE projects ADD COLUMN site_area_unit ENUM('sqft', 'sqm', 'acre', 'hectare') DEFAULT 'sqft' AFTER site_area" },
            { name: 'site_latitude', sql: "ALTER TABLE projects ADD COLUMN site_latitude VARCHAR(50) AFTER site_area_unit" },
            { name: 'site_longitude', sql: "ALTER TABLE projects ADD COLUMN site_longitude VARCHAR(50) AFTER site_latitude" },
            { name: 'site_engineer_id', sql: "ALTER TABLE projects ADD COLUMN site_engineer_id INT AFTER site_longitude" },
            { name: 'contract_value', sql: "ALTER TABLE projects ADD COLUMN contract_value DECIMAL(15, 2) AFTER site_engineer_id" },
            { name: 'budget_amount', sql: "ALTER TABLE projects ADD COLUMN budget_amount DECIMAL(15, 2) AFTER contract_value" },
            { name: 'payment_terms', sql: "ALTER TABLE projects ADD COLUMN payment_terms TEXT AFTER budget_amount" },
            { name: 'advance_percentage', sql: "ALTER TABLE projects ADD COLUMN advance_percentage DECIMAL(5, 2) AFTER payment_terms" },
            { name: 'retention_percentage', sql: "ALTER TABLE projects ADD COLUMN retention_percentage DECIMAL(5, 2) AFTER advance_percentage" },
            { name: 'start_date', sql: "ALTER TABLE projects ADD COLUMN start_date DATE AFTER retention_percentage" },
            { name: 'expected_end_date', sql: "ALTER TABLE projects ADD COLUMN expected_end_date DATE AFTER start_date" },
            { name: 'actual_end_date', sql: "ALTER TABLE projects ADD COLUMN actual_end_date DATE AFTER expected_end_date" },
            { name: 'duration_days', sql: "ALTER TABLE projects ADD COLUMN duration_days INT AFTER actual_end_date" },
            { name: 'architect_name', sql: "ALTER TABLE projects ADD COLUMN architect_name VARCHAR(200) AFTER duration_days" },
            { name: 'architect_contact', sql: "ALTER TABLE projects ADD COLUMN architect_contact VARCHAR(100) AFTER architect_name" },
            { name: 'consultant_name', sql: "ALTER TABLE projects ADD COLUMN consultant_name VARCHAR(200) AFTER architect_contact" },
            { name: 'consultant_contact', sql: "ALTER TABLE projects ADD COLUMN consultant_contact VARCHAR(100) AFTER consultant_name" },
            { name: 'total_floors', sql: "ALTER TABLE projects ADD COLUMN total_floors INT AFTER consultant_contact" },
            { name: 'basement_floors', sql: "ALTER TABLE projects ADD COLUMN basement_floors INT DEFAULT 0 AFTER total_floors" },
            { name: 'built_up_area', sql: "ALTER TABLE projects ADD COLUMN built_up_area DECIMAL(10, 2) AFTER basement_floors" },
            { name: 'carpet_area', sql: "ALTER TABLE projects ADD COLUMN carpet_area DECIMAL(10, 2) AFTER built_up_area" },
            { name: 'scope_of_work', sql: "ALTER TABLE projects ADD COLUMN scope_of_work TEXT AFTER carpet_area" },
            { name: 'specifications', sql: "ALTER TABLE projects ADD COLUMN specifications TEXT AFTER scope_of_work" },
            { name: 'special_requirements', sql: "ALTER TABLE projects ADD COLUMN special_requirements TEXT AFTER specifications" },
            { name: 'priority', sql: "ALTER TABLE projects ADD COLUMN priority ENUM('low', 'medium', 'high', 'urgent') NOT NULL DEFAULT 'medium' AFTER status" },
            { name: 'completion_percentage', sql: "ALTER TABLE projects ADD COLUMN completion_percentage DECIMAL(5, 2) DEFAULT 0 AFTER priority" },
            { name: 'contract_document_path', sql: "ALTER TABLE projects ADD COLUMN contract_document_path VARCHAR(500) AFTER completion_percentage" },
            { name: 'drawing_folder_path', sql: "ALTER TABLE projects ADD COLUMN drawing_folder_path VARCHAR(500) AFTER contract_document_path" },
            { name: 'boq_document_path', sql: "ALTER TABLE projects ADD COLUMN boq_document_path VARCHAR(500) AFTER drawing_folder_path" },
            { name: 'remarks', sql: "ALTER TABLE projects ADD COLUMN remarks TEXT AFTER boq_document_path" },
            { name: 'cancellation_reason', sql: "ALTER TABLE projects ADD COLUMN cancellation_reason TEXT AFTER remarks" },
            { name: 'is_active', sql: "ALTER TABLE projects ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE AFTER cancellation_reason" },
        ]

        let added = 0
        let skipped = 0

        for (const column of columnsToAdd) {
            if (!existingColumns.includes(column.name)) {
                try {
                    await connection.query(column.sql)
                    console.log(`✓ Added column: ${column.name}`)
                    added++
                } catch (error) {
                    console.error(`✗ Failed to add ${column.name}:`, error.message)
                }
            } else {
                skipped++
            }
        }

        // Rename columns if they exist
        if (existingColumns.includes('location') && !existingColumns.includes('site_location')) {
            await connection.query("ALTER TABLE projects CHANGE COLUMN location site_location VARCHAR(200) NOT NULL")
            console.log('✓ Renamed location to site_location')
        }

        if (existingColumns.includes('city') && !existingColumns.includes('site_city')) {
            await connection.query("ALTER TABLE projects CHANGE COLUMN city site_city VARCHAR(100)")
            console.log('✓ Renamed city to site_city')
        }

        if (existingColumns.includes('state') && !existingColumns.includes('site_state')) {
            await connection.query("ALTER TABLE projects CHANGE COLUMN state site_state VARCHAR(100)")
            console.log('✓ Renamed state to site_state')
        }

        // Update status enum
        await connection.query("ALTER TABLE projects MODIFY COLUMN status ENUM('lead', 'quotation', 'confirmed', 'design', 'mobilization', 'execution', 'completed', 'on_hold', 'cancelled') NOT NULL DEFAULT 'lead'")
        console.log('✓ Updated status enum')

        console.log(`\n✓ Projects table enhanced successfully`)
        console.log(`  - Added: ${added} columns`)
        console.log(`  - Skipped (already exist): ${skipped} columns`)

    } catch (error) {
        console.error('Migration error:', error.message)
        process.exit(1)
    } finally {
        if (connection) {
            await connection.end()
        }
    }
}

enhanceProjectsTable()
