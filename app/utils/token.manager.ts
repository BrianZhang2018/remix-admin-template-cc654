import { validateToken, isTokenExpired, extractUserFromToken } from './auth.security';
import { createTokenStorage, TokenStorage } from './auth.storage';

export interface TokenInfo {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  expires_in: number;
  token_type: string;
  user: any;
}

export interface TokenStorageInterface {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
}

/**
 * Advanced token manager for handling JWT tokens with rotation and validation
 */
export class TokenManager {
  private storage: TokenStorage;
  private refreshPromise: Promise<TokenInfo | null> | null = null;

  constructor() {
    this.storage = createTokenStorage();
  }

  /**
   * Store tokens securely
   */
  async storeTokens(tokens: TokenInfo): Promise<void> {
    try {
      // Validate tokens before storing
      if (!validateToken(tokens.access_token)) {
        throw new Error('Invalid access token format');
      }

      if (!validateToken(tokens.refresh_token)) {
        throw new Error('Invalid refresh token format');
      }

      // Store tokens with expiration tracking
      const tokenData = {
        ...tokens,
        stored_at: Date.now()
      };

      await this.storage.storeTokens(tokenData);
      
      // Store user info separately for quick access
      if (tokens.user) {
        await this.storage.storeUser(tokens.user);
      }

      console.log('Tokens stored successfully');
    } catch (error) {
      console.error('Failed to store tokens:', error);
      throw error;
    }
  }

  /**
   * Retrieve stored tokens
   */
  async getTokens(): Promise<TokenInfo | null> {
    try {
      const tokens = await this.storage.getTokens();
      if (!tokens) return null;

      // Check if tokens are expired
      if (isTokenExpired(tokens.access_token)) {
        console.log('Access token expired, attempting refresh');
        return await this.refreshTokens(tokens.refresh_token);
      }

      return tokens;
    } catch (error) {
      console.error('Failed to retrieve tokens:', error);
      return null;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshTokens(refreshToken: string): Promise<TokenInfo | null> {
    // Prevent multiple simultaneous refresh attempts
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.performTokenRefresh(refreshToken);
    const result = await this.refreshPromise;
    this.refreshPromise = null;
    return result;
  }

  private async performTokenRefresh(refreshToken: string): Promise<TokenInfo | null> {
    try {
      if (!validateToken(refreshToken)) {
        throw new Error('Invalid refresh token');
      }

      // This would typically call your auth service to refresh tokens
      // For now, we'll simulate the refresh process
      console.log('Refreshing tokens...');
      
      // In a real implementation, you would make an API call here
      // const response = await fetch('/api/auth/refresh', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ refresh_token: refreshToken })
      // });
      
      // For demonstration, we'll return null to indicate refresh failed
      // In practice, you would return the new tokens from the API response
      return null;
    } catch (error) {
      console.error('Token refresh failed:', error);
      await this.clearTokens();
      return null;
    }
  }

  /**
   * Get current user information
   */
  async getCurrentUser(): Promise<any | null> {
    try {
      const userData = await this.storage.getUser();
      if (userData) {
        return userData;
      }

      // Fallback: extract from access token
      const tokens = await this.getTokens();
      if (tokens?.access_token) {
        return extractUserFromToken(tokens.access_token);
      }

      return null;
    } catch (error) {
      console.error('Failed to get current user:', error);
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const tokens = await this.getTokens();
      return tokens !== null && !isTokenExpired(tokens.access_token);
    } catch {
      return false;
    }
  }

  /**
   * Clear all stored tokens and user data
   */
  async clearTokens(): Promise<void> {
    try {
      await this.storage.clearAll();
      console.log('Tokens cleared successfully');
    } catch (error) {
      console.error('Failed to clear tokens:', error);
    }
  }

  /**
   * Get token expiration time
   */
  async getTokenExpiration(): Promise<number | null> {
    try {
      const tokens = await this.getTokens();
      return tokens?.expires_at || null;
    } catch {
      return null;
    }
  }

  /**
   * Check if token needs refresh (within 5 minutes of expiration)
   */
  async needsRefresh(): Promise<boolean> {
    try {
      const expiration = await this.getTokenExpiration();
      if (!expiration) return false;

      const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds
      return Date.now() + fiveMinutes > expiration;
    } catch {
      return false;
    }
  }

  /**
   * Validate and return access token for API calls
   */
  async getValidAccessToken(): Promise<string | null> {
    try {
      const tokens = await this.getTokens();
      if (!tokens) return null;

      // Check if token needs refresh
      if (await this.needsRefresh()) {
        const refreshedTokens = await this.refreshTokens(tokens.refresh_token);
        return refreshedTokens?.access_token || null;
      }

      return tokens.access_token;
    } catch (error) {
      console.error('Failed to get valid access token:', error);
      return null;
    }
  }

  /**
   * Store PKCE verifier for OAuth flow
   */
  async storePKCEVerifier(verifier: string): Promise<void> {
    await this.storage.storePKCEVerifier(verifier);
  }

  /**
   * Get stored PKCE verifier
   */
  async getPKCEVerifier(): Promise<string | null> {
    return await this.storage.getPKCEVerifier();
  }

  /**
   * Store OAuth state for CSRF protection
   */
  async storeState(state: string): Promise<void> {
    await this.storage.storeState(state);
  }

  /**
   * Get stored OAuth state
   */
  async getState(): Promise<string | null> {
    return await this.storage.getState();
  }
}

/**
 * Create a token manager instance
 */
export function createTokenManager(): TokenManager {
  return new TokenManager();
}
