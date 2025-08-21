// PKCE (Proof Key for Code Exchange) utilities for enhanced OAuth security

/**
 * Generate a random string for PKCE code verifier
 */
export function generateCodeVerifier(length: number = 128): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return result;
}

/**
 * Generate PKCE code challenge from verifier using SHA256
 */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Validate PKCE code verifier format
 */
export function validateCodeVerifier(verifier: string): boolean {
  // Must be 43-128 characters long
  if (verifier.length < 43 || verifier.length > 128) {
    return false;
  }
  
  // Must only contain: A-Z, a-z, 0-9, -, ., _, ~
  const validChars = /^[A-Za-z0-9\-._~]+$/;
  return validChars.test(verifier);
}

/**
 * Validate PKCE code challenge format
 */
export function validateCodeChallenge(challenge: string): boolean {
  // Must be 43-128 characters long
  if (challenge.length < 43 || challenge.length > 128) {
    return false;
  }
  
  // Must only contain: A-Z, a-z, 0-9, -, ., _, ~
  const validChars = /^[A-Za-z0-9\-._~]+$/;
  return validChars.test(challenge);
}

/**
 * Generate secure random state parameter for CSRF protection
 */
export function generateState(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Validate state parameter
 */
export function validateState(state: string): boolean {
  return state.length === 64 && /^[0-9a-f]{64}$/.test(state);
}

/**
 * Secure token validation
 */
export function validateToken(token: string): boolean {
  if (!token || typeof token !== 'string') {
    return false;
  }
  
  // Basic JWT format validation (header.payload.signature)
  const parts = token.split('.');
  if (parts.length !== 3) {
    return false;
  }
  
  // Validate each part is base64url encoded
  const base64UrlRegex = /^[A-Za-z0-9_-]+$/;
  return parts.every(part => base64UrlRegex.test(part));
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp < currentTime;
  } catch {
    return true;
  }
}

/**
 * Extract user information from JWT token
 */
export function extractUserFromToken(token: string): any {
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
