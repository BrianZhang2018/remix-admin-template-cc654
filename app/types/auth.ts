// Enhanced authentication types for the application

export interface AuthUser {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
    name?: string;
    avatar_url?: string;
    provider?: string;
  };
  app_metadata?: {
    provider?: string;
    providers?: string[];
  };
  created_at?: string;
  updated_at?: string;
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  expires_in: number;
  token_type: string;
  user: AuthUser;
}

export interface PKCEParams {
  code_verifier: string;
  code_challenge: string;
  code_challenge_method: 'S256';
  state: string;
}

export interface OAuthProvider {
  id: string;
  name: string;
  icon: string;
  color: string;
  enabled: boolean;
}

export interface AuthState {
  user: AuthUser | null;
  session: AuthSession | null;
  isLoading: boolean;
  error: string | null;
}

export interface AuthError {
  code: string;
  message: string;
  description?: string;
  action?: string;
  timestamp: number;
  requestId?: string;
}

export interface TokenInfo {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  expires_in: number;
  token_type: string;
  user: AuthUser;
  stored_at?: number;
}

export interface AuthConfig {
  providers: OAuthProvider[];
  sessionTimeout: number;
  refreshThreshold: number;
  enablePKCE: boolean;
  enableStateValidation: boolean;
  enableTokenRotation: boolean;
}

export interface AuthStorage {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
}

export interface AuthSecurity {
  validateToken: (token: string) => boolean;
  isTokenExpired: (token: string) => boolean;
  extractUserFromToken: (token: string) => AuthUser | null;
  generateCodeVerifier: (length?: number) => string;
  generateCodeChallenge: (verifier: string) => Promise<string>;
  generateState: () => string;
  validateCodeVerifier: (verifier: string) => boolean;
  validateCodeChallenge: (challenge: string) => boolean;
  validateState: (state: string) => boolean;
}

export interface AuthCallback {
  onLogin?: (user: AuthUser, session: AuthSession) => void;
  onLogout?: () => void;
  onError?: (error: AuthError) => void;
  onTokenRefresh?: (session: AuthSession) => void;
}

export interface AuthProvider {
  name: string;
  login: (options?: any) => Promise<AuthSession>;
  logout: () => Promise<void>;
  refresh: (refreshToken: string) => Promise<AuthSession>;
  getUser: () => Promise<AuthUser | null>;
  getSession: () => Promise<AuthSession | null>;
}

export interface AuthManager {
  login: (provider: string, options?: any) => Promise<AuthSession>;
  logout: () => Promise<void>;
  refresh: () => Promise<AuthSession | null>;
  getUser: () => Promise<AuthUser | null>;
  getSession: () => Promise<AuthSession | null>;
  isAuthenticated: () => Promise<boolean>;
  onAuthStateChange: (callback: (state: AuthState) => void) => () => void;
}

// OAuth specific types
export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope: string[];
  responseType: 'code' | 'token';
  grantType: 'authorization_code' | 'refresh_token';
}

export interface OAuthTokens {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope?: string;
}

export interface OAuthUserInfo {
  id: string;
  email: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  locale?: string;
  verified_email?: boolean;
}

// Session management types
export interface SessionConfig {
  name: string;
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  maxAge: number;
  domain?: string;
  path: string;
}

export interface SessionData {
  userId: string;
  userEmail: string;
  createdAt: number;
  userAgent: string;
  ipAddress: string;
  lastActivity: number;
}

// Error handling types
export interface AuthErrorResponse {
  error: AuthError;
  timestamp: number;
  requestId?: string;
  context?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Security types
export interface SecurityConfig {
  enablePKCE: boolean;
  enableCSRF: boolean;
  enableTokenRotation: boolean;
  enableRateLimiting: boolean;
  maxLoginAttempts: number;
  lockoutDuration: number;
}

export interface SecurityContext {
  ipAddress: string;
  userAgent: string;
  timestamp: number;
  sessionId: string;
}
