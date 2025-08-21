// Simple test script to verify logout functionality
const fetch = require('node-fetch');

async function testLogout() {
  const baseUrl = 'http://localhost:5177';
  
  console.log('🧪 Testing logout functionality...');
  
  try {
    // Test 1: Direct logout endpoint
    console.log('1. Testing direct logout endpoint...');
    const logoutResponse = await fetch(`${baseUrl}/logout`, {
      method: 'POST',
      redirect: 'manual'
    });
    
    console.log(`   Status: ${logoutResponse.status}`);
    console.log(`   Headers: ${JSON.stringify(Object.fromEntries(logoutResponse.headers.entries()), null, 2)}`);
    
    if (logoutResponse.status === 302) {
      const location = logoutResponse.headers.get('location');
      console.log(`   Redirect location: ${location}`);
      
      if (location && location.includes('/login')) {
        console.log('   ✅ Logout redirects to login page');
      } else {
        console.log('   ❌ Logout does not redirect to login page');
      }
    } else {
      console.log('   ❌ Logout does not return 302 redirect');
    }
    
    // Test 2: Check if login page is accessible after logout
    console.log('\n2. Testing login page accessibility...');
    const loginResponse = await fetch(`${baseUrl}/login`);
    
    if (loginResponse.status === 200) {
      console.log('   ✅ Login page is accessible');
    } else {
      console.log(`   ❌ Login page returned status: ${loginResponse.status}`);
    }
    
    // Test 3: Check if dashboard redirects to login (should be protected)
    console.log('\n3. Testing dashboard protection...');
    const dashboardResponse = await fetch(`${baseUrl}/dashboard`, {
      redirect: 'manual'
    });
    
    if (dashboardResponse.status === 302) {
      const location = dashboardResponse.headers.get('location');
      console.log(`   Dashboard redirects to: ${location}`);
      
      if (location && location.includes('/login')) {
        console.log('   ✅ Dashboard properly protected');
      } else {
        console.log('   ❌ Dashboard not properly protected');
      }
    } else {
      console.log(`   ❌ Dashboard returned status: ${dashboardResponse.status}`);
    }
    
    console.log('\n🎉 Logout functionality test completed!');
    
  } catch (error) {
    console.error('❌ Error testing logout:', error.message);
  }
}

// Run the test
testLogout();
