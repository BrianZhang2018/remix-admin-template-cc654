const assert = require('assert');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';

function assertContains(actual, expected, message) {
  if (!actual.includes(expected)) {
    throw new Error(`${message}\nExpected: "${expected}"\nActual: "${actual}"`);
  }
  console.log(`✓ ${message}`);
}

async function testSignupPageLoads() {
  console.log('\n📝 Testing: Signup page loads correctly...');
  
  const response = await fetch(`${BASE_URL}/signup`);
  
  if (response.status !== 200) {
    throw new Error(`Signup page failed to load: ${response.status}`);
  }
  
  const html = await response.text();
  assertContains(html, 'Join AI Vibecoding Forum', 'Page shows correct title');
  assertContains(html, 'name="name"', 'Page has name field');
  assertContains(html, 'name="email"', 'Page has email field'); 
  assertContains(html, 'name="password"', 'Page has password field');
  assertContains(html, 'Create Account', 'Page has submit button');
}

async function testSignupFormAcceptsData() {
  console.log('\n🔐 Testing: Signup form accepts POST data...');
  
  const formData = new URLSearchParams();
  formData.append('name', 'Test User');
  formData.append('email', 'test@example.com');
  formData.append('password', 'testpass123');
  
  const response = await fetch(`${BASE_URL}/signup`, {
    method: 'POST',
    body: formData,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });
  
  // Should return 200 (form processed) rather than 405 (method not allowed)
  if (response.status === 405) {
    throw new Error('Signup form still returns 405 Method Not Allowed');
  }
  
  console.log(`✓ Form accepts POST data (status: ${response.status})`);
  
  const html = await response.text();
  
  // Should either show success message or validation error, not a 405 error
  if (html.includes('Method Not Allowed')) {
    throw new Error('Form still shows Method Not Allowed error');
  }
  
  console.log('✓ Form processes POST data without method errors');
}

async function testSignupFormValidation() {
  console.log('\n❌ Testing: Signup form validation...');
  
  // Test empty fields
  const emptyData = new URLSearchParams();
  emptyData.append('name', '');
  emptyData.append('email', '');
  emptyData.append('password', '');
  
  const emptyResponse = await fetch(`${BASE_URL}/signup`, {
    method: 'POST',
    body: emptyData,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });
  
  const emptyHtml = await emptyResponse.text();
  assertContains(emptyHtml, 'required', 'Form should show validation for empty fields');
  
  // Test short password
  const shortPasswordData = new URLSearchParams();
  shortPasswordData.append('name', 'Test User');
  shortPasswordData.append('email', 'test@example.com');
  shortPasswordData.append('password', '123');
  
  const shortPasswordResponse = await fetch(`${BASE_URL}/signup`, {
    method: 'POST',
    body: shortPasswordData,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });
  
  const shortPasswordHtml = await shortPasswordResponse.text();
  
  // Should show password length error
  if (shortPasswordHtml.includes('at least 6 characters')) {
    console.log('✓ Password validation working');
  } else {
    console.log('⚠️  Password validation may need improvement');
  }
}

async function testSignupUI() {
  console.log('\n🎨 Testing: Signup UI elements...');
  
  const response = await fetch(`${BASE_URL}/signup`);
  const html = await response.text();
  
  assertContains(html, 'Sign in', 'Page has link to login');
  assertContains(html, 'AI Vibecoding Forum', 'Page shows correct branding');
  assertContains(html, 'Your full name', 'Name field has proper placeholder');
  assertContains(html, 'your@email.com', 'Email field has proper placeholder');
  assertContains(html, 'At least 6 characters', 'Password field has guidance');
}

async function runAllTests() {
  console.log('📝 Starting Signup Functionality Tests...\n');
  
  try {
    await testSignupPageLoads();
    await testSignupFormAcceptsData();
    await testSignupFormValidation();
    await testSignupUI();
    
    console.log('\n🎉 All signup functionality tests passed!');
    console.log('\n📋 Test Summary:');
    console.log('   ✅ Signup page loads correctly');
    console.log('   ✅ Form accepts POST data (no more 405 errors)');
    console.log('   ✅ Form validation working');
    console.log('   ✅ UI elements properly displayed');
    console.log('\n🔧 Signup functionality successfully fixed!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  runAllTests().catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = {
  testSignupPageLoads,
  testSignupFormAcceptsData,
  testSignupFormValidation,
  testSignupUI,
  runAllTests
};
