// Test file for logout functionality
const { test, expect } = require('@playwright/test');

test.describe('Logout Functionality', () => {
  test('should perform complete logout and clear all session data', async ({ page }) => {
    // First, simulate a logged-in state by setting some auth data
    await page.addInitScript(() => {
      // Mock authentication data
      localStorage.setItem('auth_tokens', JSON.stringify({
        access_token: 'test_access_token',
        refresh_token: 'test_refresh_token',
        expires_at: Date.now() + 3600000,
        expires_in: 3600,
        token_type: 'bearer',
        user: {
          id: 'test_user_id',
          email: 'test@example.com'
        }
      }));
      
      localStorage.setItem('auth_user', JSON.stringify({
        id: 'test_user_id',
        email: 'test@example.com',
        user_metadata: {
          full_name: 'Test User'
        }
      }));
      
      // Mock OAuth parameters
      localStorage.setItem('oauth_code_verifier', 'test_verifier');
      localStorage.setItem('oauth_state', 'test_state');
      
      // Mock Supabase auth data
      localStorage.setItem('supabase.auth.token', 'test_token');
      localStorage.setItem('supabase.auth.expires_at', (Date.now() + 3600000).toString());
      localStorage.setItem('supabase.auth.refresh_token', 'test_refresh_token');
    });
    
    await page.goto('/');
    
    // Verify auth data exists
    const hasAuthData = await page.evaluate(() => {
      return !!localStorage.getItem('auth_tokens') && 
             !!localStorage.getItem('auth_user') &&
             !!localStorage.getItem('oauth_code_verifier');
    });
    
    expect(hasAuthData).toBe(true);
    
    // Perform logout by submitting the logout form
    await page.evaluate(() => {
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = '/logout';
      document.body.appendChild(form);
      form.submit();
    });
    
    // Wait for redirect to login page
    await page.waitForURL(/\/login/);
    
    // Verify all auth data has been cleared
    const authDataCleared = await page.evaluate(() => {
      return !localStorage.getItem('auth_tokens') && 
             !localStorage.getItem('auth_user') &&
             !localStorage.getItem('oauth_code_verifier') &&
             !localStorage.getItem('oauth_state') &&
             !localStorage.getItem('supabase.auth.token');
    });
    
    expect(authDataCleared).toBe(true);
    
    // Verify we're on the login page
    await expect(page).toHaveURL(/\/login/);
  });

  test('should handle logout when no session exists', async ({ page }) => {
    await page.goto('/logout');
    
    // Should redirect to login even without session
    await expect(page).toHaveURL(/\/login/);
  });

  test('should clear chunked cookies during logout', async ({ page }) => {
    // Mock chunked cookies
    await page.addInitScript(() => {
      // Set chunked cookies
      document.cookie = 'auth_tokens_chunk_0=chunk1; path=/; max-age=3600';
      document.cookie = 'auth_tokens_chunk_1=chunk2; path=/; max-age=3600';
      document.cookie = 'auth_tokens_chunks=2; path=/; max-age=3600';
    });
    
    await page.goto('/');
    
    // Verify chunked cookies exist
    const hasChunkedCookies = await page.evaluate(() => {
      return document.cookie.includes('auth_tokens_chunk_0') &&
             document.cookie.includes('auth_tokens_chunk_1') &&
             document.cookie.includes('auth_tokens_chunks');
    });
    
    expect(hasChunkedCookies).toBe(true);
    
    // Perform logout
    await page.evaluate(() => {
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = '/logout';
      document.body.appendChild(form);
      form.submit();
    });
    
    // Wait for redirect
    await page.waitForURL(/\/login/);
    
    // Verify chunked cookies are cleared
    const chunkedCookiesCleared = await page.evaluate(() => {
      return !document.cookie.includes('auth_tokens_chunk_0') &&
             !document.cookie.includes('auth_tokens_chunk_1') &&
             !document.cookie.includes('auth_tokens_chunks');
    });
    
    expect(chunkedCookiesCleared).toBe(true);
  });

  test('should prevent access to protected routes after logout', async ({ page }) => {
    // Mock authenticated state
    await page.addInitScript(() => {
      localStorage.setItem('auth_tokens', JSON.stringify({
        access_token: 'test_access_token',
        refresh_token: 'test_refresh_token',
        expires_at: Date.now() + 3600000,
        expires_in: 3600,
        token_type: 'bearer',
        user: { id: 'test_user_id', email: 'test@example.com' }
      }));
    });
    
    await page.goto('/dashboard');
    
    // Should be able to access dashboard initially
    await expect(page).toHaveURL(/\/dashboard/);
    
    // Perform logout
    await page.evaluate(() => {
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = '/logout';
      document.body.appendChild(form);
      form.submit();
    });
    
    // Wait for redirect to login
    await page.waitForURL(/\/login/);
    
    // Try to access dashboard again
    await page.goto('/dashboard');
    
    // Should be redirected to login
    await expect(page).toHaveURL(/\/login/);
  });

  test('should handle logout errors gracefully', async ({ page }) => {
    // Mock a scenario where localStorage is not available
    await page.addInitScript(() => {
      // Temporarily disable localStorage
      const originalGetItem = localStorage.getItem;
      const originalRemoveItem = localStorage.removeItem;
      
      localStorage.getItem = () => null;
      localStorage.removeItem = () => {
        throw new Error('Storage not available');
      };
      
      // Restore after a delay
      setTimeout(() => {
        localStorage.getItem = originalGetItem;
        localStorage.removeItem = originalRemoveItem;
      }, 1000);
    });
    
    await page.goto('/');
    
    // Perform logout (should not crash even with storage errors)
    await page.evaluate(() => {
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = '/logout';
      document.body.appendChild(form);
      form.submit();
    });
    
    // Should still redirect to login
    await page.waitForURL(/\/login/);
    await expect(page).toHaveURL(/\/login/);
  });
});
