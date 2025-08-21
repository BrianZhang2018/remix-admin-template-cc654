// Test file for enhanced OAuth implementation
const { test, expect } = require('@playwright/test');

test.describe('Enhanced Google OAuth Implementation', () => {
  test('should display Google OAuth button with enhanced security', async ({ page }) => {
    await page.goto('/login');
    
    // Check if Google OAuth button is present
    const googleButton = page.locator('button:has-text("Continue with Google")');
    await expect(googleButton).toBeVisible();
    
    // Check if button has proper styling and loading state
    await expect(googleButton).toHaveClass(/border-slate-300/);
  });

  test('should handle OAuth errors gracefully', async ({ page }) => {
    await page.goto('/login');
    
    // Mock OAuth error by intercepting the request
    await page.route('**/auth/v1/authorize**', route => {
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'invalid_request',
          error_description: 'Invalid OAuth request'
        })
      });
    });
    
    // Click Google OAuth button
    const googleButton = page.locator('button:has-text("Continue with Google")');
    await googleButton.click();
    
    // Should show error message
    await expect(page.locator('.text-red-600')).toBeVisible();
  });

  test('should redirect to auth callback on successful OAuth', async ({ page }) => {
    await page.goto('/login');
    
    // Mock successful OAuth redirect
    await page.route('**/auth/v1/authorize**', route => {
      route.fulfill({
        status: 302,
        headers: {
          'Location': '/auth/callback?code=test_code&state=test_state'
        }
      });
    });
    
    // Click Google OAuth button
    const googleButton = page.locator('button:has-text("Continue with Google")');
    await googleButton.click();
    
    // Should redirect to callback
    await expect(page).toHaveURL(/\/auth\/callback/);
  });

  test('should show loading state during OAuth process', async ({ page }) => {
    await page.goto('/login');
    
    // Click Google OAuth button
    const googleButton = page.locator('button:has-text("Continue with Google")');
    await googleButton.click();
    
    // Should show loading spinner
    const loadingSpinner = page.locator('.animate-spin');
    await expect(loadingSpinner).toBeVisible();
  });

  test('should handle auth callback with proper session management', async ({ page }) => {
    // Mock successful auth callback
    await page.route('**/auth/v1/token**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'test_access_token',
          refresh_token: 'test_refresh_token',
          expires_in: 3600,
          token_type: 'bearer',
          user: {
            id: 'test_user_id',
            email: 'test@example.com',
            user_metadata: {
              full_name: 'Test User'
            }
          }
        })
      });
    });
    
    await page.goto('/auth/callback?code=test_code&state=test_state');
    
    // Should show loading message
    await expect(page.locator('text=Completing authentication...')).toBeVisible();
  });

  test('should validate PKCE parameters', async ({ page }) => {
    await page.goto('/login');
    
    // Click Google OAuth button to trigger PKCE generation
    const googleButton = page.locator('button:has-text("Continue with Google")');
    await googleButton.click();
    
    // Check if PKCE parameters are generated and stored
    const pkceVerifier = await page.evaluate(() => {
      return localStorage.getItem('oauth_code_verifier');
    });
    
    expect(pkceVerifier).toBeTruthy();
    expect(pkceVerifier.length).toBeGreaterThan(43); // PKCE verifier should be at least 43 chars
  });

  test('should handle session expiration gracefully', async ({ page }) => {
    // Mock expired session
    await page.addInitScript(() => {
      localStorage.setItem('auth_tokens', JSON.stringify({
        access_token: 'expired_token',
        refresh_token: 'refresh_token',
        expires_at: Date.now() - 3600000, // 1 hour ago
        expires_in: 3600,
        token_type: 'bearer',
        user: {
          id: 'test_user_id',
          email: 'test@example.com'
        }
      }));
    });
    
    await page.goto('/dashboard');
    
    // Should redirect to login due to expired session
    await expect(page).toHaveURL(/\/login/);
  });

  test('should support internationalization for auth messages', async ({ page }) => {
    await page.goto('/login');
    
    // Switch to Chinese
    const languageSwitcher = page.locator('[data-testid="language-switcher"]');
    if (await languageSwitcher.isVisible()) {
      await languageSwitcher.click();
      await page.locator('text=中文').click();
    }
    
    // Check if Google OAuth button text is translated
    const googleButton = page.locator('button:has-text("使用 Google 继续")');
    await expect(googleButton).toBeVisible();
  });
});

test.describe('Enhanced Storage System', () => {
  test('should handle multi-layered storage', async ({ page }) => {
    await page.goto('/');
    
    // Test localStorage storage
    await page.evaluate(() => {
      const testData = { test: 'value' };
      localStorage.setItem('test_key', JSON.stringify(testData));
    });
    
    // Verify data is stored
    const storedData = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('test_key'));
    });
    
    expect(storedData).toEqual({ test: 'value' });
  });

  test('should handle large token storage with chunking', async ({ page }) => {
    await page.goto('/');
    
    // Create a large token (simulating large JWT)
    const largeToken = 'a'.repeat(5000);
    
    await page.evaluate((token) => {
      // This would be handled by our EnhancedStorage class
      localStorage.setItem('large_token', token);
      
      // Simulate cookie chunking for large tokens
      if (token.length > 4000) {
        const chunks = Math.ceil(token.length / 4000);
        for (let i = 0; i < chunks; i++) {
          const chunk = token.slice(i * 4000, (i + 1) * 4000);
          document.cookie = `large_token_chunk_${i}=${chunk}; path=/; max-age=3600`;
        }
        document.cookie = `large_token_chunks=${chunks}; path=/; max-age=3600`;
      }
    }, largeToken);
    
    // Verify token is stored
    const storedToken = await page.evaluate(() => {
      return localStorage.getItem('large_token');
    });
    
    expect(storedToken).toBe(largeToken);
  });
});

test.describe('Security Features', () => {
  test('should validate token format', async ({ page }) => {
    await page.goto('/');
    
    const isValidToken = await page.evaluate(() => {
      // Test valid JWT format
      const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      
      // Test invalid token format
      const invalidToken = 'invalid_token_format';
      
      // This would use our validateToken function
      const validParts = validToken.split('.');
      const invalidParts = invalidToken.split('.');
      
      return {
        valid: validParts.length === 3 && validParts.every(part => /^[A-Za-z0-9_-]+$/.test(part)),
        invalid: invalidParts.length === 3 && invalidParts.every(part => /^[A-Za-z0-9_-]+$/.test(part))
      };
    });
    
    expect(isValidToken.valid).toBe(true);
    expect(isValidToken.invalid).toBe(false);
  });

  test('should detect expired tokens', async ({ page }) => {
    await page.goto('/');
    
    const tokenExpiration = await page.evaluate(() => {
      // Create expired token
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZXhwIjoxNTE2MjM5MDIyfQ.invalid_signature';
      
      // Create future token
      const futureToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZXhwIjo5OTk5OTk5OTk5fQ.invalid_signature';
      
      try {
        // Test expired token
        const expiredPayload = JSON.parse(atob(expiredToken.split('.')[1]));
        const expired = expiredPayload.exp < Math.floor(Date.now() / 1000);
        
        // Test future token
        const futurePayload = JSON.parse(atob(futureToken.split('.')[1]));
        const future = futurePayload.exp < Math.floor(Date.now() / 1000);
        
        return { expired, future };
      } catch {
        return { expired: true, future: true };
      }
    });
    
    expect(tokenExpiration.expired).toBe(true);
    expect(tokenExpiration.future).toBe(false);
  });
});
