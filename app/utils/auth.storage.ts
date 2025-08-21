// Enhanced storage utilities for authentication tokens

export interface StorageInterface {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
}

/**
 * Multi-layered storage implementation with localStorage and cookies
 */
export class EnhancedStorage implements StorageInterface {
  private maxChunkSize = 4000; // Cookie size limit

  async getItem(key: string): Promise<string | null> {
    try {
      // 1. Check localStorage first
      const localStorageValue = localStorage.getItem(key);
      if (localStorageValue) return localStorageValue;
      
      // 2. Check for chunked cookies
      const chunks = localStorage.getItem(`${key}_chunks`);
      if (chunks) {
        const chunkCount = parseInt(chunks);
        let fullValue = '';
        
        for (let i = 0; i < chunkCount; i++) {
          const chunk = this.getCookie(`${key}_chunk_${i}`);
          if (chunk) {
            fullValue += chunk;
          } else {
            // Missing chunk, return null
            return null;
          }
        }
        
        return fullValue;
      }
      
      // 3. Fallback to single cookie
      const cookieValue = this.getCookie(key);
      if (cookieValue) return cookieValue;
      
      return null;
    } catch (error) {
      console.error('Storage getItem error:', error);
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      // Store in localStorage
      localStorage.setItem(key, value);
      
      // Handle token chunking for size limits
      if (value.length > this.maxChunkSize) {
        const chunks = Math.ceil(value.length / this.maxChunkSize);
        
        // Store chunk count in localStorage
        localStorage.setItem(`${key}_chunks`, chunks.toString());
        
        // Store chunks in cookies
        for (let i = 0; i < chunks; i++) {
          const chunk = value.slice(i * this.maxChunkSize, (i + 1) * this.maxChunkSize);
          this.setCookie(`${key}_chunk_${i}`, chunk, 3600);
        }
        
        // Store chunk count in cookie
        this.setCookie(`${key}_chunks`, chunks.toString(), 3600);
      } else {
        // Store single cookie
        this.setCookie(key, value, 3600);
      }
    } catch (error) {
      console.error('Storage setItem error:', error);
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      // Clean up from localStorage
      localStorage.removeItem(key);
      
      // Remove chunked tokens
      const chunks = localStorage.getItem(`${key}_chunks`);
      if (chunks) {
        const chunkCount = parseInt(chunks);
        for (let i = 0; i < chunkCount; i++) {
          this.removeCookie(`${key}_chunk_${i}`);
        }
        this.removeCookie(`${key}_chunks`);
        localStorage.removeItem(`${key}_chunks`);
      }
      
      // Remove single cookie
      this.removeCookie(key);
    } catch (error) {
      console.error('Storage removeItem error:', error);
    }
  }

  private getCookie(name: string): string | null {
    const cookies = document.cookie.split(';');
    const cookie = cookies.find(c => c.trim().startsWith(`${name}=`));
    return cookie ? decodeURIComponent(cookie.split('=')[1]) : null;
  }

  private setCookie(name: string, value: string, maxAge: number): void {
    const secure = window.location.protocol === 'https:';
    const sameSite = secure ? 'strict' : 'lax';
    
    document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; ${secure ? 'secure; ' : ''}samesite=${sameSite}`;
  }

  private removeCookie(name: string): void {
    document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  }
}

/**
 * Create enhanced storage instance
 */
export function createEnhancedStorage(): EnhancedStorage {
  return new EnhancedStorage();
}

/**
 * Token-specific storage utilities
 */
export class TokenStorage {
  private storage: EnhancedStorage;
  private readonly TOKEN_KEY = 'auth_tokens';
  private readonly USER_KEY = 'auth_user';
  private readonly PKCE_VERIFIER_KEY = 'oauth_code_verifier';
  private readonly STATE_KEY = 'oauth_state';

  constructor() {
    this.storage = createEnhancedStorage();
  }

  async storeTokens(tokens: any): Promise<void> {
    await this.storage.setItem(this.TOKEN_KEY, JSON.stringify(tokens));
  }

  async getTokens(): Promise<any | null> {
    const data = await this.storage.getItem(this.TOKEN_KEY);
    return data ? JSON.parse(data) : null;
  }

  async clearTokens(): Promise<void> {
    await this.storage.removeItem(this.TOKEN_KEY);
    await this.storage.removeItem(this.USER_KEY);
  }

  async storeUser(user: any): Promise<void> {
    await this.storage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  async getUser(): Promise<any | null> {
    const data = await this.storage.getItem(this.USER_KEY);
    return data ? JSON.parse(data) : null;
  }

  async storePKCEVerifier(verifier: string): Promise<void> {
    await this.storage.setItem(this.PKCE_VERIFIER_KEY, verifier);
  }

  async getPKCEVerifier(): Promise<string | null> {
    return await this.storage.getItem(this.PKCE_VERIFIER_KEY);
  }

  async clearPKCEVerifier(): Promise<void> {
    await this.storage.removeItem(this.PKCE_VERIFIER_KEY);
  }

  async storeState(state: string): Promise<void> {
    await this.storage.setItem(this.STATE_KEY, state);
  }

  async getState(): Promise<string | null> {
    return await this.storage.getItem(this.STATE_KEY);
  }

  async clearState(): Promise<void> {
    await this.storage.removeItem(this.STATE_KEY);
  }

  async clearAll(): Promise<void> {
    await this.clearTokens();
    await this.clearPKCEVerifier();
    await this.clearState();
  }
}

/**
 * Create token storage instance
 */
export function createTokenStorage(): TokenStorage {
  return new TokenStorage();
}
