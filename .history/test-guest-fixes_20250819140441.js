// Test script to verify guest security and comment reply functionality
const BASE_URL = 'http://localhost:5173';

async function testGuestPostCreation() {
  console.log('🧪 Testing guest post creation (no name/email)...');
  
  const formData = new FormData();
  formData.append('title', 'Guest Post Test');
  formData.append('content', 'This is a test post created by a guest user without providing name or email.');
  formData.append('excerpt', 'Testing guest post creation');
  formData.append('category_id', '52a3ecd8-9f42-4b06-af41-4f021f5a39b5'); // AI Tools category
  // Intentionally NOT providing author_name or author_email

  try {
    const response = await fetch(`${BASE_URL}/posts/new`, {
      method: 'POST',
      body: formData,
    });

    if (response.redirected) {
      console.log('✅ Guest post creation successful! Redirected to:', response.url);
      return response.url.split('/').pop(); // Extract post ID
    } else {
      console.log('❌ Guest post creation failed with status:', response.status);
      return null;
    }
  } catch (error) {
    console.log('❌ Guest post creation error:', error.message);
    return null;
  }
}

async function testGuestComment() {
  console.log('🧪 Testing guest comment (no name/email)...');
  
  const formData = new FormData();
  formData.append('intent', 'comment');
  formData.append('content', 'This is a guest comment without providing name or email!');
  // Intentionally NOT providing authorName or authorEmail

  try {
    const response = await fetch(`${BASE_URL}/posts/6b2c24b0-ee0a-4c73-83c5-eeb741caaaf5`, {
      method: 'POST',
      body: formData,
    });

    if (response.ok) {
      console.log('✅ Guest comment creation successful!');
      return true;
    } else {
      console.log('❌ Guest comment creation failed with status:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Guest comment creation error:', error.message);
    return false;
  }
}

async function testCommentReply() {
  console.log('🧪 Testing comment reply functionality...');
  
  const formData = new FormData();
  formData.append('intent', 'comment');
  formData.append('content', 'This is a reply to an existing comment!');
  formData.append('parentId', '4a9e6f2e-7990-4275-b426-e64150830eab'); // Existing comment ID
  formData.append('authorName', 'Reply Tester');
  formData.append('authorEmail', 'reply@test.com');

  try {
    const response = await fetch(`${BASE_URL}/posts/6b2c24b0-ee0a-4c73-83c5-eeb741caaaf5`, {
      method: 'POST',
      body: formData,
    });

    if (response.ok) {
      console.log('✅ Comment reply creation successful!');
      return true;
    } else {
      console.log('❌ Comment reply creation failed with status:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Comment reply creation error:', error.message);
    return false;
  }
}

async function testUnauthorizedEdit() {
  console.log('🧪 Testing unauthorized edit attempt (should fail)...');
  
  const formData = new FormData();
  formData.append('intent', 'edit');
  formData.append('title', 'Unauthorized Edit');
  formData.append('content', 'This should not work');
  formData.append('authorEmail', 'unauthorized@example.com'); // Wrong email

  try {
    const response = await fetch(`${BASE_URL}/posts/6b2c24b0-ee0a-4c73-83c5-eeb741caaaf5`, {
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

async function verifyGuestFeatures(postId) {
  if (!postId) return;
  
  console.log('🧪 Verifying guest post contains guest number...');
  
  try {
    const response = await fetch(`${BASE_URL}/posts/${postId}`);
    const html = await response.text();
    
    if (html.includes('Guest') && /Guest\d{4}/.test(html)) {
      console.log('✅ Guest number found in post!');
    } else {
      console.log('❌ Guest number not found in post');
    }
    
    if (html.includes('@guest.local')) {
      console.log('✅ Guest email pattern found!');
    } else {
      console.log('❌ Guest email pattern not found');
    }
  } catch (error) {
    console.log('❌ Verification error:', error.message);
  }
}

async function runTests() {
  console.log('🚀 Starting guest security and comment reply tests...\n');
  
  const guestPostId = await testGuestPostCreation();
  console.log('');
  
  const guestCommentResult = await testGuestComment();
  console.log('');
  
  const replyResult = await testCommentReply();
  console.log('');
  
  const securityResult = await testUnauthorizedEdit();
  console.log('');
  
  await verifyGuestFeatures(guestPostId);
  
  console.log('\n📊 Test Results:');
  console.log(`   Guest Post Creation: ${guestPostId ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Guest Comment: ${guestCommentResult ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Comment Reply: ${replyResult ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Security (Unauthorized Edit): ${securityResult ? '✅ PASS' : '❌ FAIL'}`);
  
  const allPassed = guestPostId && guestCommentResult && replyResult && securityResult;
  console.log(`\n🎯 Overall: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  
  if (guestPostId) {
    console.log(`🔗 Check the new guest post at: ${BASE_URL}/posts/${guestPostId}`);
  }
}

// Run the tests
runTests().catch(console.error);
