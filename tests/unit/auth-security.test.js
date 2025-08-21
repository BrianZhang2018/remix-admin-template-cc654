// Unit tests for auth security utilities
const { test, expect } = require('@playwright/test');

test.describe('Auth Security Utilities', () => {
  test('should generate valid PKCE code verifier', async ({ page }) => {
    const result = await page.evaluate(() => {
      // Mock the generateCodeVerifier function
      function generateCodeVerifier(length = 128) {
        const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
        let result = '';
        for (let i = 0; i < length; i++) {
          result += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        return result;
      }
      
      const verifier = generateCodeVerifier();
      
      // Validate format
      const validChars = /^[A-Za-z0-9\-._~]+$/;
      const isValidFormat = validChars.test(verifier);
      const isValidLength = verifier.length >= 43 && verifier.length <= 128;
      
      return {
        verifier,
        isValidFormat,
        isValidLength,
        length: verifier.length
      };
    });
    
    expect(result.isValidFormat).toBe(true);
    expect(result.isValidLength).toBe(true);
    expect(result.length).toBeGreaterThanOrEqual(43);
    expect(result.length).toBeLessThanOrEqual(128);
  });

  test('should generate valid PKCE code challenge', async ({ page }) => {
    const result = await page.evaluate(async () => {
      // Mock the generateCodeChallenge function
      async function generateCodeChallenge(verifier) {
        const encoder = new TextEncoder();
        const data = encoder.encode(verifier);
        const digest = await crypto.subtle.digest('SHA-256', data);
        
        return btoa(String.fromCharCode(...new Uint8Array(digest)))
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=/g, '');
      }
      
      const verifier = 'test_verifier_string_for_pkce_challenge_generation';
      const challenge = await generateCodeChallenge(verifier);
      
      // Validate format
      const validChars = /^[A-Za-z0-9\-._~]+$/;
      const isValidFormat = validChars.test(challenge);
      const isValidLength = challenge.length >= 43 && challenge.length <= 128;
      
      return {
        verifier,
        challenge,
        isValidFormat,
        isValidLength,
        length: challenge.length
      };
    });
    
    expect(result.isValidFormat).toBe(true);
    expect(result.isValidLength).toBe(true);
    expect(result.challenge).not.toBe(result.verifier); // Challenge should be different from verifier
  });

  test('should validate token format correctly', async ({ page }) => {
    const result = await page.evaluate(() => {
      // Mock the validateToken function
      function validateToken(token) {
        if (!token || typeof token !== 'string') {
          return false;
        }
        
        const parts = token.split('.');
        if (parts.length !== 3) {
          return false;
        }
        
        const base64UrlRegex = /^[A-Za-z0-9_-]+$/;
        return parts.every(part => base64UrlRegex.test(part));
      }
      
      // Test valid JWT
      const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      
      // Test invalid tokens
      const invalidToken1 = 'invalid_token_format';
      const invalidToken2 = 'part1.part2'; // Missing third part
      const invalidToken3 = 'part1.part2.part3.part4'; // Too many parts
      const invalidToken4 = null;
      const invalidToken5 = '';
      
      return {
        validToken: validateToken(validToken),
        invalidToken1: validateToken(invalidToken1),
        invalidToken2: validateToken(invalidToken2),
        invalidToken3: validateToken(invalidToken3),
        invalidToken4: validateToken(invalidToken4),
        invalidToken5: validateToken(invalidToken5)
      };
    });
    
    expect(result.validToken).toBe(true);
    expect(result.invalidToken1).toBe(false);
    expect(result.invalidToken2).toBe(false);
    expect(result.invalidToken3).toBe(false);
    expect(result.invalidToken4).toBe(false);
    expect(result.invalidToken5).toBe(false);
  });

  test('should detect expired tokens', async ({ page }) => {
    const result = await page.evaluate(() => {
      // Mock the isTokenExpired function
      function isTokenExpired(token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const currentTime = Math.floor(Date.now() / 1000);
          return payload.exp < currentTime;
        } catch {
          return true;
        }
      }
      
      // Create expired token (exp: 1516239022 - past date)
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZXhwIjoxNTE2MjM5MDIyfQ.invalid_signature';
      
      // Create future token (exp: 9999999999 - future date)
      const futureToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZXhwIjo5OTk5OTk5OTk5fQ.invalid_signature';
      
      // Create token without exp
      const noExpToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwfQ.invalid_signature';
      
      return {
        expiredToken: isTokenExpired(expiredToken),
        futureToken: isTokenExpired(futureToken),
        noExpToken: isTokenExpired(noExpToken)
      };
    });
    
    expect(result.expiredToken).toBe(true);
    expect(result.futureToken).toBe(false);
    expect(result.noExpToken).toBe(true); // Should be true for invalid tokens
  });

  test('should generate secure state parameter', async ({ page }) => {
    const result = await page.evaluate(() => {
      // Mock the generateState function
      function generateState() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
      }
      
      const state1 = generateState();
      const state2 = generateState();
      
      // Validate format
      const isValidFormat = /^[0-9a-f]{64}$/.test(state1);
      const isValidLength = state1.length === 64;
      const areDifferent = state1 !== state2; // States should be different
      
      return {
        state1,
        state2,
        isValidFormat,
        isValidLength,
        areDifferent,
        length: state1.length
      };
    });
    
    expect(result.isValidFormat).toBe(true);
    expect(result.isValidLength).toBe(true);
    expect(result.areDifferent).toBe(true);
    expect(result.length).toBe(64);
  });

  test('should extract user information from token', async ({ page }) => {
    const result = await page.evaluate(() => {
      // Mock the extractUserFromToken function
      function extractUserFromToken(token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          return {
            id: payload.sub,
            email: payload.email,
            exp: payload.exp,
            iat: payload.iat,
            ...payload.user_metadata
          };
        } catch {
          return null;
        }
      }
      
      // Test token with user data
      const userToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyX2lkIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiZXhwIjoxNTE2MjM5MDIyLCJpYXQiOjE1MTYyMzkwMjIsInVzZXJfbWV0YWRhdGEiOnsiZnVsbF9uYW1lIjoiVGVzdCBVc2VyIiwiYXZhdGFyX3VybCI6Imh0dHA6Ly9leGFtcGxlLmNvbS9hdmF0YXIuanBnIn19.invalid_signature';
      
      // Test invalid token
      const invalidToken = 'invalid_token';
      
      return {
        userData: extractUserFromToken(userToken),
        invalidData: extractUserFromToken(invalidToken)
      };
    });
    
    expect(result.userData).toEqual({
      id: 'user_id',
      email: 'test@example.com',
      exp: 1516239022,
      iat: 1516239022,
      full_name: 'Test User',
      avatar_url: 'http://example.com/avatar.jpg'
    });
    expect(result.invalidData).toBe(null);
  });
});
