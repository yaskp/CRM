import { sequelize } from './connection'
import { readFileSync } from 'fs'
import { join } from 'path'

const migrateDatabase = async () => {
  try {
    await sequelize.authenticate()
    console.log('Database connection established')

    // Read and execute schema.sql
    const schemaPath = join(__dirname, '../../../database/schema.sql')
    const schema = readFileSync(schemaPath, 'utf-8')

    // Split by semicolons and execute each statement
    const statements = schema
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith('--'))

    for (const statement of statements) {
      if (statement) {
        try {
          await sequelize.query(statement)
        } catch (error: any) {
          // Ignore "table already exists" errors
          if (!error.message.includes('already exists')) {
            console.error('Error executing statement:', error.message)
          }
        }
      }
    }

    console.log('Database migration completed successfully')
  } catch (error) {
    console.error('Migration failed:', error)
    throw error
  } finally {
    await sequelize.close()
  }
}

if (require.main === module) {
  migrateDatabase()
    .then(() => {
      console.log('Migration completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Migration failed:', error)
      process.exit(1)
    })
}

export default migrateDatabase

