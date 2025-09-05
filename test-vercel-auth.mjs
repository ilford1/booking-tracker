import fetch from 'node-fetch';

const VERCEL_URL = 'https://booking-tracker-delta.vercel.app';

console.log('🔍 Testing Authentication on Vercel Deployment\n');
console.log('=' .repeat(50));
console.log(`\nTesting URL: ${VERCEL_URL}`);

async function testEndpoint(path, description) {
  console.log(`\n📍 ${description}:`);
  try {
    const response = await fetch(`${VERCEL_URL}${path}`, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    if (response.headers.get('content-type')?.includes('application/json')) {
      const data = await response.json();
      console.log(`   Response:`, JSON.stringify(data, null, 2));
    } else if (response.status >= 300 && response.status < 400) {
      console.log(`   Redirect to: ${response.headers.get('location')}`);
    } else {
      const text = await response.text();
      if (text.length < 200) {
        console.log(`   Response: ${text}`);
      } else {
        console.log(`   Response (truncated): ${text.substring(0, 200)}...`);
      }
    }
    return response;
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return null;
  }
}

// Test various endpoints
await testEndpoint('/api/test-connectivity', 'Testing API connectivity');
await testEndpoint('/api/auth-test', 'Testing auth endpoint');
await testEndpoint('/auth/signin', 'Testing signin page');

// Test authentication flow simulation
console.log('\n📍 Testing Authentication Flow:');
try {
  const response = await fetch(`${VERCEL_URL}/api/auth-test`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    },
    body: JSON.stringify({
      email: 'test@example.com',
      password: 'test123456'
    })
  });
  
  console.log(`   Status: ${response.status}`);
  const data = await response.json();
  console.log(`   Response:`, JSON.stringify(data, null, 2));
  
  // Check cookies
  const cookies = response.headers.get('set-cookie');
  if (cookies) {
    console.log(`   Cookies set: ${cookies.substring(0, 100)}...`);
  } else {
    console.log(`   ⚠️ No cookies set in response`);
  }
} catch (error) {
  console.error(`   ❌ Error: ${error.message}`);
}

console.log('\n' + '='.repeat(50));
console.log('\n✅ Test complete! Check the results above for issues.\n');
