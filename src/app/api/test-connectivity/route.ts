import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Test basic fetch to Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({
        success: false,
        error: 'Missing environment variables',
        url: !!supabaseUrl,
        key: !!supabaseAnonKey
      })
    }
    
    // Test basic HTTP connectivity to Supabase
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
    })
    
    const responseText = await response.text()
    
    return NextResponse.json({
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      url: supabaseUrl.substring(0, 30) + '...',
      keyLength: supabaseAnonKey.length,
      responseLength: responseText.length,
      headers: Object.fromEntries(response.headers.entries()),
      responsePreview: responseText.substring(0, 200)
    })
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      errorType: error.constructor.name,
      stack: error.stack?.substring(0, 500)
    }, { status: 500 })
  }
}
