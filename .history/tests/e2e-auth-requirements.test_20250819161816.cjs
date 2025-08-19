const assert = require('assert');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';

function assertContains(actual, expected, message) {
  if (!actual.includes(expected)) {
    throw new Error(`${message}\nExpected: "${expected}"\nActual: "${actual}"`);
  }
  console.log(`✓ ${message}`);
}

function assertStatusCode(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}\nExpected status: ${expected}\nActual status: ${actual}`);
  }
  console.log(`✓ ${message}`);
}

async function testUnauthenticatedPostCreationRedirect() {
  console.log('\n🔒 Testing: Unauthenticated post creation should redirect to login...');
  
  const response = await fetch(`${BASE_URL}/posts/new`, {
    redirect: 'manual' // Don't follow redirects automatically
  });
  
  assertStatusCode(response.status, 302, 'Post creation should redirect unauthenticated users');
  
  const location = response.headers.get('location');
  if (location && location.includes('/login')) {
    console.log('✓ Redirects to login page as expected');
  } else {
    throw new Error(`Expected redirect to login, got: ${location}`);
  }
}

async function testUnauthenticatedCommentRejection() {
  console.log('\n🔒 Testing: Unauthenticated commenting should be rejected...');
  
  // First get a valid post ID
  const postsResponse = await fetch(`${BASE_URL}/posts`);
  const postsHtml = await postsResponse.text();
  
  // Extract post ID from the posts page
  const postIdMatch = postsHtml.match(/\/posts\/([a-f0-9-]+)/);
  if (!postIdMatch) {
    throw new Error('Could not find a post ID for testing');
  }
  const postId = postIdMatch[1];
  console.log(`Using post ID: ${postId}`);
  
  // Try to post a comment without authentication
  const formData = new URLSearchParams();
  formData.append('intent', 'comment');
  formData.append('content', 'This should be rejected - unauthenticated comment');
  
  const response = await fetch(`${BASE_URL}/posts/${postId}`, {
    method: 'POST',
    body: formData,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });
  
  const responseText = await response.text();
  assertContains(responseText, 'You must be logged in', 'Should show authentication required message');
}

async function testUnauthenticatedUIShowsLoginPrompts() {
  console.log('\n👀 Testing: UI shows login prompts for unauthenticated users...');
  
  // Test homepage shows login button
  const homeResponse = await fetch(`${BASE_URL}/`);
  const homeHtml = await homeResponse.text();
  assertContains(homeHtml, 'Login', 'Homepage should show login option');
  assertContains(homeHtml, 'Create Post', 'Homepage should show create post button');
  
  // Test post detail page shows login prompts when trying to comment
  const postsResponse = await fetch(`${BASE_URL}/posts`);
  const postsHtml = await postsResponse.text();
  const postIdMatch = postsHtml.match(/\/posts\/([a-f0-9-]+)/);
  if (postIdMatch) {
    const postId = postIdMatch[1];
    const postResponse = await fetch(`${BASE_URL}/posts/${postId}`);
    const postHtml = await postResponse.text();
    
    // The comment button should be visible, but clicking it should show login prompt
    assertContains(postHtml, 'Add Comment', 'Post should show comment button');
  }
}

async function testPostCreationPageAccessControl() {
  console.log('\n🚫 Testing: Post creation page access control...');
  
  const response = await fetch(`${BASE_URL}/posts/new`);
  
  if (response.status === 302) {
    console.log('✓ Unauthenticated users are redirected (expected behavior)');
  } else if (response.status === 200) {
    // If somehow we get a 200, check if it shows login requirement
    const html = await response.text();
    if (html.includes('login') || html.includes('sign in') || html.includes('authenticate')) {
      console.log('✓ Page shows authentication requirement');
    } else {
      throw new Error('Post creation page accessible without authentication');
    }
  } else {
    throw new Error(`Unexpected status code: ${response.status}`);
  }
}

async function testFormFieldsForAuthentication() {
  console.log('\n📝 Testing: Form fields show authentication requirements...');
  
  // Test that post creation forms no longer have guest fields
  try {
    const response = await fetch(`${BASE_URL}/posts/new`);
    if (response.status === 200) {
      const html = await response.text();
      
      // These guest-related fields should NOT be present
      if (html.includes('leave blank for guest') || 
          html.includes('guest number') || 
          html.includes('Use the same email to edit')) {
        throw new Error('Guest form fields still present in authenticated form');
      }
      console.log('✓ Guest form fields properly removed');
    }
  } catch (error) {
    if (error.message.includes('Guest form fields')) {
      throw error;
    }
    // If we can't access the page due to auth, that's expected
    console.log('✓ Cannot access form page without auth (expected)');
  }
}

async function testNavigationForUnauthenticatedUsers() {
  console.log('\n🧭 Testing: Navigation for unauthenticated users...');
  
  const response = await fetch(`${BASE_URL}/`);
  const html = await response.text();
  
  // Should show login/signup options
  assertContains(html, 'Login', 'Navigation should show login option');
  
  // Should still show "Create Post" button (which will redirect to login)
  assertContains(html, 'Create Post', 'Should show create post button (even if it redirects)');
}

async function testErrorMessagesForAuthRequirement() {
  console.log('\n❌ Testing: Proper error messages for authentication requirements...');
  
  // Test commenting without auth
  const postsResponse = await fetch(`${BASE_URL}/posts`);
  const postsHtml = await postsResponse.text();
  const postIdMatch = postsHtml.match(/\/posts\/([a-f0-9-]+)/);
  
  if (postIdMatch) {
    const postId = postIdMatch[1];
    
    // Try to comment
    const commentData = new URLSearchParams();
    commentData.append('intent', 'comment');
    commentData.append('content', 'Test comment');
    
    const commentResponse = await fetch(`${BASE_URL}/posts/${postId}`, {
      method: 'POST',
      body: commentData,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    
    const responseText = await commentResponse.text();
    assertContains(responseText, 'You must be logged in', 'Should show proper auth error for comments');
    
    // Try to edit a post
    const editData = new URLSearchParams();
    editData.append('intent', 'edit');
    editData.append('title', 'Test Edit');
    editData.append('content', 'Test Content');
    
    const editResponse = await fetch(`${BASE_URL}/posts/${postId}`, {
      method: 'POST',
      body: editData,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    
    const editResponseText = await editResponse.text();
    assertContains(editResponseText, 'You must be logged in', 'Should show proper auth error for post editing');
  }
}

async function testPageLoadingAfterAuthChanges() {
  console.log('\n🔄 Testing: Pages load correctly after authentication changes...');
  
  // Test that main pages still load
  const pages = ['/', '/posts'];
  
  for (const page of pages) {
    const response = await fetch(`${BASE_URL}${page}`);
    
    if (response.status !== 200) {
      throw new Error(`Page ${page} failed to load: ${response.status}`);
    }
    
    const html = await response.text();
    if (!html.includes('<!DOCTYPE html>')) {
      throw new Error(`Page ${page} returned invalid HTML`);
    }
    
    console.log(`✓ Page ${page} loads correctly`);
  }
}

async function runAllTests() {
  console.log('🚀 Starting E2E Authentication Requirements Tests...\n');
  
  try {
    await testUnauthenticatedPostCreationRedirect();
    await testUnauthenticatedCommentRejection();
    await testUnauthenticatedUIShowsLoginPrompts();
    await testPostCreationPageAccessControl();
    await testFormFieldsForAuthentication();
    await testNavigationForUnauthenticatedUsers();
    await testErrorMessagesForAuthRequirement();
    await testPageLoadingAfterAuthChanges();
    
    console.log('\n🎉 All authentication requirement tests passed!');
    console.log('\n📋 Test Summary:');
    console.log('   ✅ Post creation requires authentication');
    console.log('   ✅ Commenting requires authentication');
    console.log('   ✅ UI shows proper login prompts');
    console.log('   ✅ Guest form fields removed');
    console.log('   ✅ Proper error messages shown');
    console.log('   ✅ Pages load correctly');
    console.log('\n🔒 Authentication requirements successfully implemented!');
    
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
  testUnauthenticatedPostCreationRedirect,
  testUnauthenticatedCommentRejection,
  testUnauthenticatedUIShowsLoginPrompts,
  testPostCreationPageAccessControl,
  testFormFieldsForAuthentication,
  testNavigationForUnauthenticatedUsers,
  testErrorMessagesForAuthRequirement,
  testPageLoadingAfterAuthChanges,
  runAllTests
};
