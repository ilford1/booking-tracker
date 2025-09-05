import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env.local') });

console.log('🔍 Authentication Debug Script\n');
console.log('=' .repeat(50));

// 1. Check environment variables
console.log('\n1️⃣ Environment Variables Check:');
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL is missing');
} else {
  console.log(`✅ SUPABASE_URL: ${url}`);
}

if (!anonKey) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY is missing');
} else {
  console.log(`✅ ANON_KEY: ${anonKey.substring(0, 20)}...`);
}

if (!url || !anonKey) {
  console.error('\n⚠️ Cannot proceed without environment variables');
  process.exit(1);
}

// 2. Test basic connectivity to Supabase
console.log('\n2️⃣ Testing Basic Connectivity:');
try {
  const response = await fetch(`${url}/rest/v1/`, {
    headers: {
      'apikey': anonKey,
      'Authorization': `Bearer ${anonKey}`
    }
  });
  
  if (response.ok) {
    console.log('✅ Basic API connectivity successful');
    console.log(`   Status: ${response.status} ${response.statusText}`);
  } else {
    console.error('❌ Basic API connectivity failed');
    console.log(`   Status: ${response.status} ${response.statusText}`);
    const text = await response.text();
    console.log(`   Response: ${text.substring(0, 200)}`);
  }
} catch (error) {
  console.error('❌ Network error connecting to Supabase:', error.message);
}

// 3. Test Auth API endpoint
console.log('\n3️⃣ Testing Auth API Endpoint:');
try {
  const authResponse = await fetch(`${url}/auth/v1/health`, {
    headers: {
      'apikey': anonKey
    }
  });
  
  if (authResponse.ok) {
    console.log('✅ Auth service is healthy');
    const data = await authResponse.json();
    console.log(`   Response:`, data);
  } else {
    console.error('❌ Auth service health check failed');
    console.log(`   Status: ${authResponse.status}`);
  }
} catch (error) {
  console.error('❌ Error checking auth service:', error.message);
}

// 4. Create Supabase client and test
console.log('\n4️⃣ Testing Supabase Client:');
try {
  const supabase = createClient(url, anonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      flowType: 'pkce'
    },
    global: {
      fetch: fetch
    }
  });
  
  console.log('✅ Supabase client created successfully');
  
  // Test getting session
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    console.log('ℹ️ No active session (expected)');
  } else {
    console.log('✅ Auth.getSession() works');
  }
  
  // Test sign in with test credentials (will fail but test the endpoint)
  console.log('\n5️⃣ Testing Sign-In Endpoint:');
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'test@example.com',
    password: 'test123456'
  });
  
  if (error) {
    if (error.message.includes('Invalid login credentials')) {
      console.log('✅ Sign-in endpoint is working (invalid credentials as expected)');
    } else {
      console.error('⚠️ Unexpected error:', error.message);
      console.log('   Error details:', error);
    }
  }
} catch (error) {
  console.error('❌ Error with Supabase client:', error.message);
}

// 5. Check CORS and redirect URLs
console.log('\n6️⃣ Checking Auth Configuration:');
console.log('ℹ️ Make sure the following URLs are configured in Supabase Auth settings:');
console.log('   - Site URL: https://your-app.vercel.app');
console.log('   - Redirect URLs:');
console.log('     • https://your-app.vercel.app/auth/callback');
console.log('     • http://localhost:3000/auth/callback');
console.log('\n⚠️ Common issues:');
console.log('   1. Redirect URLs not configured in Supabase dashboard');
console.log('   2. Site URL mismatch');
console.log('   3. CORS issues (check browser console)');
console.log('   4. Cookie settings (SameSite, Secure attributes)');
console.log('   5. Network/firewall blocking Supabase domains');

console.log('\n' + '='.repeat(50));
console.log('Debug complete!\n');
