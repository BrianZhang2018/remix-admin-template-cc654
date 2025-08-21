import { useEffect } from 'react';
import { useNavigate } from '@remix-run/react';
import { getSupabaseClientBrowser } from '~/utils/getSupabaseClient';
import { validateToken, isTokenExpired, extractUserFromToken } from '~/utils/auth.security';
import { parseOAuthError, logAuthError, getUserFriendlyMessage } from '~/utils/auth.errors';
import { createTokenManager } from '~/utils/token.manager';

export default function OAuthHandler() {
  const navigate = useNavigate();

  useEffect(() => {
    console.log('OAuthHandler: Component mounted');
    
    const handleOAuthCallback = async () => {
      // Check if we're on the OAuth callback page
      const hash = window.location.hash;
      console.log('OAuthHandler: Checking hash:', hash);
      console.log('OAuthHandler: Current URL:', window.location.href);
      
      if (!hash || !hash.includes('access_token')) {
        console.log('OAuthHandler: No access_token found in hash');
        return;
      }

      try {
        // Parse the hash parameters with enhanced validation
        const params = new URLSearchParams(hash.substring(1));
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        const error = params.get('error');
        const errorDescription = params.get('error_description');
        const expiresIn = params.get('expires_in');
        const tokenType = params.get('token_type');
        
        console.log('OAuthHandler: Parsed tokens:', {
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken,
          error,
          errorDescription,
          expiresIn,
          tokenType
        });

        if (error) {
          logAuthError({ error, error_description: errorDescription }, 'OAuth hash error');
          const userMessage = getUserFriendlyMessage({ error, error_description: errorDescription });
          navigate(`/login?error=${error}&message=${encodeURIComponent(userMessage)}`);
          return;
        }

        if (!accessToken) {
          console.error('No access token found in OAuth callback');
          navigate('/login?error=no_token');
          return;
        }

        // Validate token format before processing
        if (!validateToken(accessToken)) {
          console.error('Invalid access token format');
          navigate('/login?error=invalid_token');
          return;
        }

        // Check if token is already expired
        if (isTokenExpired(accessToken)) {
          console.error('Access token is already expired');
          navigate('/login?error=expired_token');
          return;
        }

        // Get the Supabase client
        const supabase = getSupabaseClientBrowser();
        
        console.log('OAuthHandler: Setting session with tokens');
        
        // Create token manager for enhanced token handling
        const tokenManager = createTokenManager();
        
        // Prepare token data with proper structure
        const tokenData = {
          access_token: accessToken,
          refresh_token: refreshToken || '',
          expires_at: expiresIn ? Date.now() + (parseInt(expiresIn) * 1000) : Date.now() + (3600 * 1000), // Default 1 hour
          expires_in: expiresIn ? parseInt(expiresIn) : 3600,
          token_type: tokenType || 'bearer',
          user: null
        };

        // Extract user information from token
        const userInfo = extractUserFromToken(accessToken);
        if (userInfo) {
          tokenData.user = userInfo;
        }
        
        // Set the session manually with enhanced validation
        const { data, error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || '',
        });

        if (sessionError) {
          logAuthError(sessionError, 'Session setting failed');
          console.error('Failed to set session:', sessionError);
          navigate('/login?error=session_failed');
          return;
        }

        if (!data.session) {
          console.error('No session created');
          navigate('/login?error=no_session');
          return;
        }

        console.log('OAuth session created successfully for user:', data.user?.email);
        console.log('OAuthHandler: Session data:', {
          hasSession: !!data.session,
          hasUser: !!data.user,
          userEmail: data.user?.email
        });

        // Store tokens securely using token manager
        try {
          await tokenManager.storeTokens({
            ...tokenData,
            user: data.user || userInfo
          });
          console.log('Tokens stored securely');
        } catch (storageError) {
          console.error('Failed to store tokens:', storageError);
          // Continue with login even if storage fails
        }

        // Create or update user profile with enhanced error handling
        if (data.user) {
          try {
            const { error: profileError } = await supabase
              .from('user_profiles')
              .upsert({
                user_id: data.user.id,
                display_name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || data.user.email?.split('@')[0],
                avatar_url: data.user.user_metadata?.avatar_url,
                updated_at: new Date().toISOString()
              }, {
                onConflict: 'user_id'
              });

            if (profileError) {
              console.error('Failed to update user profile:', profileError);
              // Don't fail the login for profile errors
            } else {
              console.log('User profile updated successfully');
            }
          } catch (profileError) {
            console.error('Profile update exception:', profileError);
            // Continue with login even if profile update fails
          }
        }

        // Clean up URL hash for security
        window.history.replaceState(null, '', window.location.pathname + window.location.search);

        // Redirect to clean URL
        console.log('OAuthHandler: Redirecting to homepage');
        navigate('/', { replace: true });

      } catch (error) {
        logAuthError(error, 'OAuth callback exception');
        console.error('OAuth callback error:', error);
        navigate('/login?error=callback_failed');
      }
    };

    handleOAuthCallback();
  }, [navigate]);

  return (
    <div style={{ display: 'none' }}>
      OAuth Handler Active
    </div>
  );
}
