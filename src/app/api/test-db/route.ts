import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    
    // Test which tables exist
    const tables = ['bookings', 'campaigns', 'notifications', 'user_profiles']
    const results: any = {}
    
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1)
      
      if (error) {
        results[table] = {
          exists: false,
          error: error.message,
          code: error.code
        }
      } else {
        results[table] = {
          exists: true,
          hasData: data && data.length > 0
        }
      }
    }
    
    // Also check if we can get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    return NextResponse.json({
      tables: results,
      session: {
        exists: !!session,
        userId: session?.user?.id,
        email: session?.user?.email,
        error: sessionError?.message
      },
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Error testing database:', error)
    return NextResponse.json({ 
      error: 'Failed to test database',
      details: error 
    }, { status: 500 })
  }
}
