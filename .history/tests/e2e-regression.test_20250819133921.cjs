/**
 * E2E Regression Tests for AI Vibecoding Forum
 * 
 * These tests verify baseline functionality of the forum to ensure
 * deployments don't break core features.
 */

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5173';

// Simple test runner
const tests = [];
const results = {
  passed: 0,
  failed: 0,
  total: 0
};

function test(name, testFn) {
  tests.push({ name, testFn });
}

async function runTests() {
  console.log(`🧪 Running E2E Regression Tests for AI Vibecoding Forum`);
  console.log(`📍 Testing against: ${BASE_URL}\n`);

  for (const { name, testFn } of tests) {
    results.total++;
    try {
      await testFn();
      console.log(`✅ ${name}`);
      results.passed++;
    } catch (error) {
      console.log(`❌ ${name}: ${error.message}`);
      results.failed++;
    }
  }

  console.log(`\n📊 Test Results:`);
  console.log(`   Passed: ${results.passed}/${results.total}`);
  console.log(`   Failed: ${results.failed}/${results.total}`);
  
  if (results.failed > 0) {
    process.exit(1);
  }
}

// Test utilities
async function fetchPage(path) {
  const response = await fetch(`${BASE_URL}${path}`);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return response.text();
}

function assertContains(content, text, context = '') {
  if (!content.includes(text)) {
    throw new Error(`Expected content to contain "${text}"${context ? ` in ${context}` : ''}`);
  }
}

function assertStatus(response, expectedStatus) {
  if (response.status !== expectedStatus) {
    throw new Error(`Expected status ${expectedStatus}, got ${response.status}`);
  }
}

// ========================================
// HOMEPAGE TESTS
// ========================================

test('Homepage loads successfully', async () => {
  const content = await fetchPage('/');
  assertContains(content, 'AI Vibecoding Forum', 'homepage title');
  assertContains(content, 'Share AI tools, get code help, showcase projects', 'homepage description');
});

test('Homepage shows forum categories', async () => {
  const content = await fetchPage('/');
  assertContains(content, 'AI Tools &amp; Prompts', 'AI Tools category');
  assertContains(content, 'Code Review &amp; Help', 'Code Review category');
  assertContains(content, 'Project Showcases', 'Project Showcases category');
  assertContains(content, 'Learning Resources', 'Learning Resources category');
});

test('Homepage shows recent posts section', async () => {
  const content = await fetchPage('/');
  assertContains(content, 'Recent Posts', 'recent posts section');
  assertContains(content, 'View all posts', 'view all posts link');
});

test('Homepage navigation links work', async () => {
  const content = await fetchPage('/');
  assertContains(content, 'href="/login"', 'login link');
  assertContains(content, 'href="/posts/new"', 'create post link');
  assertContains(content, 'href="/posts"', 'all posts link');
});

// ========================================
// POSTS LISTING TESTS
// ========================================

test('Posts listing page loads', async () => {
  const content = await fetchPage('/posts');
  assertContains(content, 'All Posts', 'posts page title');
  assertContains(content, 'posts •', 'post count indicator');
});

test('Posts listing shows filters sidebar', async () => {
  const content = await fetchPage('/posts');
  assertContains(content, 'Filters', 'filters section');
  assertContains(content, 'Search Posts', 'search filter');
  assertContains(content, 'Sort By', 'sort filter');
  assertContains(content, 'Category', 'category filter');
  assertContains(content, 'Popular Tags', 'tags filter');
});

test('Posts listing shows sorting options', async () => {
  const content = await fetchPage('/posts');
  assertContains(content, 'Newest first', 'newest sort option');
  assertContains(content, 'Most upvoted', 'most upvoted sort option');
  assertContains(content, 'Most commented', 'most commented sort option');
});

test('Posts are displayed with voting buttons', async () => {
  const content = await fetchPage('/posts');
  assertContains(content, 'Upvote this post', 'upvote button');
  assertContains(content, 'Downvote this post', 'downvote button');
});

// ========================================
// CATEGORY TESTS
// ========================================

test('AI Tools category page loads', async () => {
  const content = await fetchPage('/categories/ai-tools');
  assertContains(content, 'AI Tools &amp; Prompts', 'category title');
  assertContains(content, 'Share and discover AI tools', 'category description');
});

test('Code Help category page loads', async () => {
  const content = await fetchPage('/categories/code-help');
  assertContains(content, 'Code Review &amp; Help', 'category title');
  assertContains(content, 'Get help with code', 'category description');
});

test('Project Showcases category page loads', async () => {
  const content = await fetchPage('/categories/showcases');
  assertContains(content, 'Project Showcases', 'category title');
  assertContains(content, 'Show off your AI projects', 'category description');
});

test('Category page shows breadcrumb navigation', async () => {
  const content = await fetchPage('/categories/ai-tools');
  assertContains(content, 'Home', 'breadcrumb home');
  assertContains(content, 'Posts', 'breadcrumb posts');
  assertContains(content, 'AI Tools &amp; Prompts', 'breadcrumb category');
});

// ========================================
// INDIVIDUAL POST TESTS
// ========================================

test('Individual post page loads', async () => {
  // Test the AI Code Review Tools post
  const content = await fetchPage('/posts/4759eaac-9607-4c48-ad65-e6256c93fc60');
  assertContains(content, 'Getting Started with AI Code Review Tools', 'post title');
  assertContains(content, 'AI-powered code review tools', 'post content');
});

test('Post page shows voting interface', async () => {
  const content = await fetchPage('/posts/4759eaac-9607-4c48-ad65-e6256c93fc60');
  assertContains(content, 'Upvote this post', 'post upvote button');
  assertContains(content, 'Downvote this post', 'post downvote button');
});

test('Post page shows comments section', async () => {
  const content = await fetchPage('/posts/4759eaac-9607-4c48-ad65-e6256c93fc60');
  assertContains(content, 'Comments', 'comments section title');
  assertContains(content, 'Add a Comment', 'add comment form');
});

test('Post page shows breadcrumb navigation', async () => {
  const content = await fetchPage('/posts/4759eaac-9607-4c48-ad65-e6256c93fc60');
  assertContains(content, 'Home', 'breadcrumb home');
  assertContains(content, 'Posts', 'breadcrumb posts');
  assertContains(content, 'AI Tools &amp; Prompts', 'breadcrumb category');
});

// ========================================
// AUTHENTICATION TESTS
// ========================================

test('Login page loads', async () => {
  const content = await fetchPage('/login');
  assertContains(content, 'Log In to Remix Dashboard', 'login page title');
  assertContains(content, 'Email address', 'email field');
  assertContains(content, 'Password', 'password field');
});

test('Login page shows demo credentials', async () => {
  const content = await fetchPage('/login');
  assertContains(content, 'demo@example.com', 'demo email');
  assertContains(content, 'demo123', 'demo password');
});

// ========================================
// POST CREATION TESTS
// ========================================

test('New post creation page loads', async () => {
  const content = await fetchPage('/posts/new');
  assertContains(content, 'Create New Post', 'page title');
  assertContains(content, 'Post Title', 'title field');
  assertContains(content, 'Your Name', 'author name field');
  assertContains(content, 'Category', 'category field');
  assertContains(content, 'Post Content', 'content field');
});

test('Post creation form has all required fields', async () => {
  const content = await fetchPage('/posts/new');
  assertContains(content, 'name="title"', 'title input');
  assertContains(content, 'name="author_name"', 'author name input');
  assertContains(content, 'name="author_email"', 'author email input');
  assertContains(content, 'name="category_id"', 'category select');
  assertContains(content, 'name="content"', 'content textarea');
});

test('Post creation form shows categories and tags', async () => {
  const content = await fetchPage('/posts/new');
  assertContains(content, 'AI Tools &amp; Prompts', 'AI Tools category');
  assertContains(content, 'Code Review &amp; Help', 'Code Review category');
  assertContains(content, '#AI', 'AI tag');
  assertContains(content, '#React', 'React tag');
  assertContains(content, '#JavaScript', 'JavaScript tag');
});

test('Post creation page shows posting guidelines', async () => {
  const content = await fetchPage('/posts/new');
  assertContains(content, 'Posting Guidelines', 'guidelines section');
  assertContains(content, 'Be clear and descriptive', 'guideline text');
  assertContains(content, 'Include relevant code examples', 'code examples guideline');
});

// ========================================
// ERROR HANDLING TESTS
// ========================================

test('404 page for non-existent post', async () => {
  const response = await fetch(`${BASE_URL}/posts/non-existent-id`);
  assertStatus(response, 404);
});

test('404 page for non-existent category', async () => {
  const response = await fetch(`${BASE_URL}/categories/non-existent-category`);
  assertStatus(response, 404);
});

// ========================================
// PERFORMANCE TESTS
// ========================================

test('Homepage loads within reasonable time', async () => {
  const start = Date.now();
  await fetchPage('/');
  const duration = Date.now() - start;
  
  if (duration > 3000) {
    throw new Error(`Homepage took ${duration}ms to load (threshold: 3000ms)`);
  }
});

test('Posts page loads within reasonable time', async () => {
  const start = Date.now();
  await fetchPage('/posts');
  const duration = Date.now() - start;
  
  if (duration > 3000) {
    throw new Error(`Posts page took ${duration}ms to load (threshold: 3000ms)`);
  }
});

// ========================================
// ACCESSIBILITY TESTS
// ========================================

test('Pages have proper meta tags', async () => {
  const content = await fetchPage('/');
  assertContains(content, '<title>', 'page title tag');
  assertContains(content, 'name="description"', 'meta description');
  assertContains(content, 'name="viewport"', 'viewport meta tag');
});

test('Navigation uses semantic HTML', async () => {
  const content = await fetchPage('/');
  assertContains(content, '<nav', 'semantic nav element');
  assertContains(content, '<main', 'semantic main element');
  assertContains(content, '<header', 'semantic header element');
  assertContains(content, '<footer', 'semantic footer element');
});

// ========================================
// FORUM FUNCTIONALITY TESTS
// ========================================

test('Posts show proper metadata', async () => {
  const content = await fetchPage('/posts');
  assertContains(content, 'views', 'view count displayed');
  assertContains(content, 'comments', 'comment count displayed');
  assertContains(content, 'votes_count', 'vote count in data');
});

test('Tags are displayed and linked', async () => {
  const content = await fetchPage('/posts');
  assertContains(content, 'href="/tags/', 'tag links present');
  assertContains(content, 'JavaScript', 'JavaScript tag');
  assertContains(content, 'AI', 'AI tag');
});

test('Categories show post counts', async () => {
  const content = await fetchPage('/');
  assertContains(content, 'posts</span>', 'post count in categories');
});

// Run all tests
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests, test, fetchPage, assertContains, assertStatus };
