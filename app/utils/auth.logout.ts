// Client-side logout utilities for enhanced OAuth implementation

import { createTokenManager } from './token.manager';
import { getSupabaseClient } from './supabase.client';

/**
 * Perform a complete client-side logout
 * Clears all stored tokens, session data, and Supabase session
 */
export async function performClientLogout(): Promise<void> {
  try {
    // Clear tokens from our enhanced storage
    const tokenManager = createTokenManager();
    await tokenManager.clearTokens();
    
    // Clear any additional OAuth parameters
    await tokenManager.clearPKCEVerifier();
    await tokenManager.clearState();
    
    // Clear localStorage items that might not be handled by token manager
    if (typeof window !== 'undefined') {
      // Clear any remaining auth-related localStorage items
      const authKeys = [
        'auth_tokens',
        'auth_user',
        'oauth_code_verifier',
        'oauth_state',
        'supabase.auth.token',
        'supabase.auth.expires_at',
        'supabase.auth.refresh_token'
      ];
      
      authKeys.forEach(key => {
        localStorage.removeItem(key);
      });
      
      // Clear any auth-related cookies
      const authCookies = [
        'auth_tokens',
        'auth_user',
        'oauth_code_verifier',
        'oauth_state',
        '__session'
      ];
      
      authCookies.forEach(cookieName => {
        document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; domain=${window.location.hostname}`;
      });
      
      // Clear chunked cookies
      const chunkedCookies = document.cookie.split(';').map(c => c.trim());
      chunkedCookies.forEach(cookie => {
        if (cookie.includes('_chunk_') || cookie.includes('_chunks')) {
          const cookieName = cookie.split('=')[0];
          document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        }
      });
    }
    
    // Sign out from Supabase client
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
    
    console.log('Client-side logout completed successfully');
  } catch (error) {
    console.error('Error during client-side logout:', error);
    // Continue with logout even if there are errors
  }
}

/**
 * Clear all authentication data without signing out from Supabase
 * Useful for clearing stale data
 */
export async function clearAuthData(): Promise<void> {
  try {
    const tokenManager = createTokenManager();
    await tokenManager.clearAll();
    
    if (typeof window !== 'undefined') {
      // Clear localStorage
      const authKeys = [
        'auth_tokens',
        'auth_user',
        'oauth_code_verifier',
        'oauth_state'
      ];
      
      authKeys.forEach(key => {
        localStorage.removeItem(key);
      });
      
      // Clear cookies
      const authCookies = [
        'auth_tokens',
        'auth_user',
        'oauth_code_verifier',
        'oauth_state'
      ];
      
      authCookies.forEach(cookieName => {
        document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      });
    }
    
    console.log('Auth data cleared successfully');
  } catch (error) {
    console.error('Error clearing auth data:', error);
  }
}

/**
 * Check if user is currently logged in
 */
export async function isLoggedIn(): Promise<boolean> {
  try {
    const tokenManager = createTokenManager();
    return await tokenManager.isAuthenticated();
  } catch (error) {
    console.error('Error checking login status:', error);
    return false;
  }
}

/**
 * Force logout by redirecting to logout endpoint
 */
export function forceLogout(): void {
  if (typeof window !== 'undefined') {
    // Create and submit a form to the logout endpoint
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/logout';
    document.body.appendChild(form);
    form.submit();
  }
}
