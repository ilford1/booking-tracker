const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

require('dotenv').config()

// Create Supabase admin client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function runMigration(migrationName, sql) {
  console.log(`Running migration: ${migrationName}`)
  
  try {
    const { error } = await supabase.rpc('exec_sql', { sql })
    
    if (error) {
      console.error(`Error in ${migrationName}:`, error)
      return false
    }
    
    console.log(`✅ ${migrationName} completed successfully`)
    return true
  } catch (err) {
    console.error(`Error running ${migrationName}:`, err)
    return false
  }
}

async function setupDatabase() {
  console.log('Setting up database schema and sample data...\n')

  // Read migration files
  const schema = fs.readFileSync(path.join(__dirname, '../supabase/migrations/001_initial_schema.sql'), 'utf8')
  const sampleData = fs.readFileSync(path.join(__dirname, '../supabase/migrations/002_sample_data.sql'), 'utf8')

  // Run migrations
  const schemaSuccess = await runMigration('001_initial_schema.sql', schema)
  if (!schemaSuccess) {
    console.error('❌ Schema migration failed. Stopping.')
    process.exit(1)
  }

  console.log('')
  
  const dataSuccess = await runMigration('002_sample_data.sql', sampleData)
  if (!dataSuccess) {
    console.error('❌ Sample data migration failed.')
    process.exit(1)
  }

  console.log('\n🎉 Database setup completed successfully!')
  console.log('\nYou can now:')
  console.log('1. Run "npm run dev" to start the development server')
  console.log('2. Visit http://localhost:3000 to see the app with data')
  console.log('3. Check your Supabase dashboard to see the tables and data')
}

// Handle the case where we need to create the exec_sql function first
async function createExecSqlFunction() {
  const { error } = await supabase.rpc('exec_sql', { sql: 'SELECT 1' })
  
  if (error && error.message.includes('function "exec_sql" does not exist')) {
    console.log('Creating exec_sql function...')
    
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION exec_sql(sql TEXT)
      RETURNS TEXT
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        EXECUTE sql;
        RETURN 'OK';
      END;
      $$;
    `
    
    try {
      const { error: createError } = await supabase.from('').select('').eq('', '').single()
      // This will fail, but we use it to execute raw SQL via PostgREST
    } catch (e) {
      // Expected to fail
    }
    
    // Alternative: Use the SQL editor in Supabase dashboard to create the function
    console.log('Please run this SQL in your Supabase SQL editor first:')
    console.log(createFunctionSQL)
    console.log('\nThen run this script again.')
    process.exit(1)
  }
}

// Run setup
setupDatabase().catch(console.error)
