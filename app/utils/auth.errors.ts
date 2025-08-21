// Comprehensive OAuth error handling utilities

export interface OAuthError {
  code: string;
  message: string;
  description?: string;
  action?: string;
}

export interface AuthErrorResponse {
  error: OAuthError;
  timestamp: number;
  requestId?: string;
}

/**
 * OAuth error codes and their descriptions
 */
export const OAUTH_ERRORS = {
  // Authentication errors
  INVALID_CREDENTIALS: {
    code: 'invalid_credentials',
    message: 'Invalid email or password',
    action: 'Please check your credentials and try again'
  },
  ACCOUNT_NOT_FOUND: {
    code: 'account_not_found',
    message: 'Account not found',
    action: 'Please check your email or create a new account'
  },
  ACCOUNT_DISABLED: {
    code: 'account_disabled',
    message: 'Account has been disabled',
    action: 'Please contact support for assistance'
  },

  // OAuth specific errors
  OAUTH_PROVIDER_ERROR: {
    code: 'oauth_provider_error',
    message: 'Authentication provider error',
    action: 'Please try again or use a different sign-in method'
  },
  OAUTH_CANCELLED: {
    code: 'oauth_cancelled',
    message: 'Authentication was cancelled',
    action: 'Please complete the authentication process'
  },
  OAUTH_TIMEOUT: {
    code: 'oauth_timeout',
    message: 'Authentication request timed out',
    action: 'Please try again'
  },
  OAUTH_INVALID_STATE: {
    code: 'oauth_invalid_state',
    message: 'Invalid authentication state',
    action: 'Please try signing in again'
  },
  OAUTH_INVALID_CODE: {
    code: 'oauth_invalid_code',
    message: 'Invalid authorization code',
    action: 'Please try signing in again'
  },

  // Token errors
  TOKEN_EXPIRED: {
    code: 'token_expired',
    message: 'Authentication token has expired',
    action: 'Please sign in again'
  },
  TOKEN_INVALID: {
    code: 'token_invalid',
    message: 'Invalid authentication token',
    action: 'Please sign in again'
  },
  TOKEN_REFRESH_FAILED: {
    code: 'token_refresh_failed',
    message: 'Failed to refresh authentication token',
    action: 'Please sign in again'
  },

  // Network and server errors
  NETWORK_ERROR: {
    code: 'network_error',
    message: 'Network connection error',
    action: 'Please check your internet connection and try again'
  },
  SERVER_ERROR: {
    code: 'server_error',
    message: 'Server error occurred',
    action: 'Please try again later'
  },
  RATE_LIMITED: {
    code: 'rate_limited',
    message: 'Too many authentication attempts',
    action: 'Please wait a moment before trying again'
  },

  // Security errors
  CSRF_ERROR: {
    code: 'csrf_error',
    message: 'Security validation failed',
    action: 'Please try signing in again'
  },
  INVALID_REDIRECT: {
    code: 'invalid_redirect',
    message: 'Invalid redirect URL',
    action: 'Please try signing in again'
  },

  // PKCE errors
  PKCE_ERROR: {
    code: 'pkce_error',
    message: 'Security verification failed',
    action: 'Please try signing in again'
  },
  INVALID_CODE_VERIFIER: {
    code: 'invalid_code_verifier',
    message: 'Invalid security verification',
    action: 'Please try signing in again'
  },

  // Unknown error
  UNKNOWN_ERROR: {
    code: 'unknown_error',
    message: 'An unexpected error occurred',
    action: 'Please try again or contact support'
  }
} as const;

/**
 * Parse OAuth error from various sources
 */
export function parseOAuthError(error: any): OAuthError {
  // Handle Supabase auth errors
  if (error?.message) {
    const message = error.message.toLowerCase();
    
    if (message.includes('invalid login credentials')) {
      return OAUTH_ERRORS.INVALID_CREDENTIALS;
    }
    if (message.includes('user not found')) {
      return OAUTH_ERRORS.ACCOUNT_NOT_FOUND;
    }
    if (message.includes('email not confirmed')) {
      return {
        code: 'email_not_confirmed',
        message: 'Email not confirmed',
        action: 'Please check your email and confirm your account'
      };
    }
    if (message.includes('too many requests')) {
      return OAUTH_ERRORS.RATE_LIMITED;
    }
    if (message.includes('network')) {
      return OAUTH_ERRORS.NETWORK_ERROR;
    }
  }

  // Handle URL parameter errors
  if (error?.error) {
    switch (error.error) {
      case 'access_denied':
        return OAUTH_ERRORS.OAUTH_CANCELLED;
      case 'invalid_request':
        return OAUTH_ERRORS.OAUTH_INVALID_STATE;
      case 'server_error':
        return OAUTH_ERRORS.SERVER_ERROR;
      case 'temporarily_unavailable':
        return OAUTH_ERRORS.SERVER_ERROR;
      default:
        return {
          code: error.error,
          message: error.error_description || 'OAuth error occurred',
          action: 'Please try again'
        };
    }
  }

  // Handle generic errors
  if (error?.code) {
    const errorCode = error.code as keyof typeof OAUTH_ERRORS;
    if (OAUTH_ERRORS[errorCode]) {
      return OAUTH_ERRORS[errorCode];
    }
  }

  // Default to unknown error
  return OAUTH_ERRORS.UNKNOWN_ERROR;
}

/**
 * Create a standardized error response
 */
export function createAuthErrorResponse(error: any, requestId?: string): AuthErrorResponse {
  const parsedError = parseOAuthError(error);
  
  return {
    error: parsedError,
    timestamp: Date.now(),
    requestId
  };
}

/**
 * Log authentication error for debugging
 */
export function logAuthError(error: any, context?: string): void {
  const errorResponse = createAuthErrorResponse(error);
  
  console.error('Authentication Error:', {
    context,
    ...errorResponse,
    originalError: error
  });
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyMessage(error: any): string {
  const parsedError = parseOAuthError(error);
  return parsedError.message;
}

/**
 * Get suggested action for error
 */
export function getSuggestedAction(error: any): string {
  const parsedError = parseOAuthError(error);
  return parsedError.action || 'Please try again';
}

/**
 * Check if error is recoverable
 */
export function isRecoverableError(error: any): boolean {
  const parsedError = parseOAuthError(error);
  
  const nonRecoverableCodes = [
    'account_disabled',
    'invalid_redirect',
    'csrf_error'
  ];
  
  return !nonRecoverableCodes.includes(parsedError.code);
}

/**
 * Handle OAuth callback errors
 */
export function handleOAuthCallbackError(url: URL): OAuthError | null {
  const error = url.searchParams.get('error');
  const errorDescription = url.searchParams.get('error_description');
  
  if (!error) return null;
  
  return parseOAuthError({
    error,
    error_description: errorDescription
  });
}

/**
 * Validate OAuth state parameter
 */
export function validateOAuthState(state: string | null, storedState: string | null): boolean {
  if (!state || !storedState) {
    return false;
  }
  
  return state === storedState;
}
