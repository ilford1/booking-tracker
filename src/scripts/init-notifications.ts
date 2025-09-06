// Script to initialize the notifications table in Supabase
// Run this script to create the notifications table if it doesn't exist

import { createClient } from '@/utils/supabase/client'

async function initNotificationsTable() {
  console.log('Initializing notifications table...')
  
  const supabase = createClient()
  
  // Create the notifications table
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS notifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('booking', 'payment', 'campaign', 'creator', 'reminder', 'system')),
      priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
      read BOOLEAN NOT NULL DEFAULT FALSE,
      read_at TIMESTAMPTZ NULL,
      
      -- Optional metadata for context
      related_id UUID NULL,
      related_type TEXT NULL CHECK (related_type IN ('booking', 'payment', 'campaign', 'creator')),
      action_url TEXT NULL,
      expires_at TIMESTAMPTZ NULL,
      
      -- Audit fields
      actor TEXT NOT NULL DEFAULT 'system',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `
  
  try {
    // Execute the CREATE TABLE query
    const { error: createError } = await supabase.rpc('exec_sql', {
      query: createTableQuery
    }).single()
    
    if (createError) {
      // If RPC doesn't exist, try a different approach
      console.log('Note: Direct SQL execution not available. Please run the migration manually in Supabase dashboard.')
      console.log('\nSQL to run:')
      console.log(createTableQuery)
      return
    }
    
    console.log('✅ Notifications table created successfully!')
    
    // Create indexes
    const indexQueries = [
      `CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);`,
      `CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);`,
      `CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);`,
      `CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications(priority);`,
      `CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);`,
      `CREATE INDEX IF NOT EXISTS idx_notifications_related ON notifications(related_id, related_type);`,
      `CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, read, created_at DESC);`
    ]
    
    for (const query of indexQueries) {
      const { error } = await supabase.rpc('exec_sql', { query }).single()
      if (!error) {
        console.log('✅ Index created')
      }
    }
    
    // Enable RLS
    const rlsQuery = `ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;`
    await supabase.rpc('exec_sql', { query: rlsQuery }).single()
    
    console.log('✅ All notifications table setup complete!')
    
  } catch (error) {
    console.error('Error initializing notifications table:', error)
    console.log('\nPlease manually create the notifications table in your Supabase dashboard.')
    console.log('You can find the SQL in: supabase/migrations/20241206000000_create_notifications_table.sql')
  }
}

// Run the initialization
initNotificationsTable()
