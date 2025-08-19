// Test script to verify post creation and commenting functionality
const BASE_URL = 'http://localhost:5173';

async function testPostCreation() {
  console.log('🧪 Testing post creation...');
  
  const formData = new FormData();
  formData.append('title', 'Test Post: Forum Functionality Check');
  formData.append('content', '# Test Post\n\nThis is a test post to verify the forum functionality.\n\n```javascript\nconsole.log("Hello, AI Vibecoding Forum!");\n```\n\nTesting **markdown** and *formatting*.');
  formData.append('excerpt', 'A test post to verify forum functionality and markdown rendering.');
  formData.append('category_id', '52a3ecd8-9f42-4b06-af41-4f021f5a39b5'); // AI Tools category
  formData.append('author_name', 'Test User');
  formData.append('author_email', 'test@example.com');
  formData.append('tags', '7f8fe37d-91ad-4a97-9fad-832154dc5495'); // AI tag

  try {
    const response = await fetch(`${BASE_URL}/posts/new`, {
      method: 'POST',
      body: formData,
    });

    if (response.redirected) {
      console.log('✅ Post creation successful! Redirected to:', response.url);
      return response.url.split('/').pop(); // Extract post ID
    } else if (response.ok) {
      console.log('✅ Post creation successful!');
      const result = await response.text();
      console.log('Response:', result.substring(0, 200) + '...');
      return null;
    } else {
      console.log('❌ Post creation failed with status:', response.status);
      const error = await response.text();
      console.log('Error:', error.substring(0, 200) + '...');
      return null;
    }
  } catch (error) {
    console.log('❌ Post creation error:', error.message);
    return null;
  }
}

async function testCommentCreation(postId) {
  if (!postId) {
    console.log('⏭️  Skipping comment test - no post ID available');
    return;
  }

  console.log('🧪 Testing comment creation on post:', postId);
  
  const formData = new FormData();
  formData.append('intent', 'comment');
  formData.append('content', 'This is a test comment to verify the commenting functionality works correctly!');
  formData.append('authorName', 'Test Commenter');
  formData.append('authorEmail', 'commenter@example.com');

  try {
    const response = await fetch(`${BASE_URL}/posts/${postId}`, {
      method: 'POST',
      body: formData,
    });

    if (response.ok) {
      console.log('✅ Comment creation successful!');
      const result = await response.json();
      console.log('Response:', result);
    } else {
      console.log('❌ Comment creation failed with status:', response.status);
      const error = await response.text();
      console.log('Error:', error.substring(0, 200) + '...');
    }
  } catch (error) {
    console.log('❌ Comment creation error:', error.message);
  }
}

async function runTests() {
  console.log('🚀 Starting forum functionality tests...\n');
  
  // Test post creation
  const postId = await testPostCreation();
  
  console.log(''); // Empty line
  
  // Test comment creation
  await testCommentCreation(postId);
  
  console.log('\n✨ Tests completed!');
  
  if (postId) {
    console.log(`🔗 Check your new post at: ${BASE_URL}/posts/${postId}`);
  }
}

// Run the tests
runTests().catch(console.error);
