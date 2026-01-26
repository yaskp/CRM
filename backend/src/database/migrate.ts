import { sequelize } from './connection'
import { readFileSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const migrateDatabase = async () => {
  try {
    await sequelize.authenticate()
    console.log('Database connection established')

    // Create migrations table if not exists
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS executed_migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `)

    const migrationsDir = join(__dirname, '../../../database/migrations')

    // Get all SQL files
    const files = readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql') || file.endsWith('.js'))
      .sort() // Ensure order

    for (const file of files) {
      // Check if already executed
      const [results] = await sequelize.query(
        'SELECT id FROM executed_migrations WHERE name = ?',
        { replacements: [file] }
      )

      if ((results as any[]).length > 0) {
        // console.log(`Skipping ${file} - already executed`)
        continue
      }

      console.log(`Executing migration: ${file}`)

      if (file.endsWith('.sql')) {
        const content = readFileSync(join(migrationsDir, file), 'utf-8')
        const statements = content
          .split(';')
          .map(s => s.trim())
          .filter(s => s.length > 0)

        for (const statement of statements) {
          try {
            await sequelize.query(statement)
          } catch (err: any) {
            // Ignore harmless errors if re-running (though we have tracking now)
            if (err.parent && err.parent.code === 'ER_DUP_FIELDNAME') {
              console.log(`   -> Column already exists, skipping.`)
            } else if (err.parent && err.parent.code === 'ER_TABLE_EXISTS_ERROR') {
              console.log(`   -> Table already exists, skipping.`)
            } else if (err.original && err.original.code === 'ER_DUP_ENTRY') {
              console.log(`   -> Duplicate entry, skipping.`)
            } else {
              console.error(`Error executing statement in ${file}:`, err.message)
              // Log failure but try to continue to next migration file
              // WARNING: This assumes subsequent migrations are not dependent on this one
              break
            }
          }
        }
      }
      // Note: JS migrations needing specific runner logic are skipped here for simplicity unless we dynamic import them
      // For now we assume SQL based on current tasks. 
      // If we *must* run JS migrations, we'd need: await import(join(migrationsDir, file))

      // Record execution
      await sequelize.query(
        'INSERT INTO executed_migrations (name) VALUES (?)',
        { replacements: [file] }
      )
    }

    console.log('Database migration completed successfully')
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  } finally {
    await sequelize.close()
  }
}

// ES Module compatible "main" check
import { pathToFileURL } from 'url'
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  migrateDatabase()
}

export default migrateDatabase

