// Test script to verify comment submission prevention and post editing
const BASE_URL = 'http://localhost:5173';
const TEST_POST_ID = '6b2c24b0-ee0a-4c73-83c5-eeb741caaaf5'; // Our test post

async function testEditPost() {
  console.log('🧪 Testing post editing functionality...');
  
  const formData = new FormData();
  formData.append('intent', 'edit');
  formData.append('title', 'Test Post: Forum Functionality Check (EDITED)');
  formData.append('content', '# Test Post (EDITED)\n\nThis post has been successfully edited! ✅\n\n```javascript\nconsole.log("Edit functionality works!");\n```\n\nTesting **edited** content and *formatting*.');
  formData.append('excerpt', 'An edited test post to verify forum functionality and markdown rendering.');
  formData.append('authorEmail', 'test@example.com'); // Should match the original post author

  try {
    const response = await fetch(`${BASE_URL}/posts/${TEST_POST_ID}`, {
      method: 'POST',
      body: formData,
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Post editing successful!');
      console.log('Response:', result);
      return true;
    } else {
      const error = await response.text();
      console.log('❌ Post editing failed with status:', response.status);
      console.log('Error:', error.substring(0, 200) + '...');
      return false;
    }
  } catch (error) {
    console.log('❌ Post editing error:', error.message);
    return false;
  }
}

async function testUnauthorizedEdit() {
  console.log('🧪 Testing unauthorized post editing (should fail)...');
  
  const formData = new FormData();
  formData.append('intent', 'edit');
  formData.append('title', 'Unauthorized Edit Attempt');
  formData.append('content', 'This should not work');
  formData.append('excerpt', 'Unauthorized edit');
  formData.append('authorEmail', 'wrong@example.com'); // Wrong email

  try {
    const response = await fetch(`${BASE_URL}/posts/${TEST_POST_ID}`, {
      method: 'POST',
      body: formData,
    });

    if (response.status === 403) {
      console.log('✅ Unauthorized edit correctly blocked!');
      return true;
    } else {
      console.log('❌ Security issue: Unauthorized edit was allowed!');
      return false;
    }
  } catch (error) {
    console.log('❌ Unauthorized edit test error:', error.message);
    return false;
  }
}

async function testCommentSubmission() {
  console.log('🧪 Testing comment submission...');
  
  const formData = new FormData();
  formData.append('intent', 'comment');
  formData.append('content', 'This is a test comment to verify no duplicate submissions!');
  formData.append('authorName', 'Test Commenter 2');
  formData.append('authorEmail', 'commenter2@example.com');

  try {
    const response = await fetch(`${BASE_URL}/posts/${TEST_POST_ID}`, {
      method: 'POST',
      body: formData,
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Comment submission successful!');
      console.log('Response:', result);
      return true;
    } else {
      console.log('❌ Comment submission failed with status:', response.status);
      const error = await response.text();
      console.log('Error:', error.substring(0, 200) + '...');
      return false;
    }
  } catch (error) {
    console.log('❌ Comment submission error:', error.message);
    return false;
  }
}

async function verifyChanges() {
  console.log('🧪 Verifying changes are visible...');
  
  try {
    const response = await fetch(`${BASE_URL}/posts/${TEST_POST_ID}`);
    const html = await response.text();
    
    if (html.includes('EDITED')) {
      console.log('✅ Post edit is visible on the page!');
    } else {
      console.log('❌ Post edit is not visible on the page');
    }
    
    if (html.includes('Test Commenter 2')) {
      console.log('✅ New comment is visible on the page!');
    } else {
      console.log('❌ New comment is not visible on the page');
    }
  } catch (error) {
    console.log('❌ Verification error:', error.message);
  }
}

async function runTests() {
  console.log('🚀 Starting bug fix tests...\n');
  
  const editResult = await testEditPost();
  console.log('');
  
  const securityResult = await testUnauthorizedEdit();
  console.log('');
  
  const commentResult = await testCommentSubmission();
  console.log('');
  
  await verifyChanges();
  
  console.log('\n📊 Test Results:');
  console.log(`   Post Editing: ${editResult ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Security Check: ${securityResult ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Comment Submission: ${commentResult ? '✅ PASS' : '❌ FAIL'}`);
  
  const allPassed = editResult && securityResult && commentResult;
  console.log(`\n🎯 Overall: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  
  if (allPassed) {
    console.log(`🔗 Check the updated post at: ${BASE_URL}/posts/${TEST_POST_ID}`);
  }
}

// Run the tests
runTests().catch(console.error);
