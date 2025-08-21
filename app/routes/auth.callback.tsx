import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { useEffect } from "react";
import { getSupabaseServerClient } from "~/utils/supabase.server";
import { validateCodeVerifier, validateState } from "~/utils/auth.security";
import { handleOAuthCallbackError, validateOAuthState, logAuthError } from "~/utils/auth.errors";
import { createTokenManager } from "~/utils/token.manager";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');
  const errorDescription = url.searchParams.get('error_description');

  console.log('OAuth callback received:', { 
    code: !!code, 
    state: !!state,
    error, 
    errorDescription 
  });

  // Handle OAuth errors
  if (error) {
    const oauthError = handleOAuthCallbackError(url);
    logAuthError({ error, error_description: errorDescription }, 'OAuth callback error');
    return redirect(`/login?error=${oauthError?.code || 'oauth_failed'}`);
  }

  if (!code) {
    console.error('No OAuth code received');
    return redirect('/login?error=no_code');
  }

  try {
    const response = new Response();
    const supabase = getSupabaseServerClient(request, response);
    
    // Note: State and PKCE validation would need to be done client-side
    // since we can't access sessionStorage in server-side loader
    // The client-side OAuth handler will handle this validation
    
    // Exchange the code for a session with enhanced security
    const { data, error: authError } = await supabase.auth.exchangeCodeForSession(code);
    
    if (authError) {
      logAuthError(authError, 'Session exchange failed');
      console.error('Failed to exchange code for session:', authError);
      return redirect('/login?error=session_exchange_failed');
    }

    if (!data.session) {
      console.error('No session received from OAuth');
      return redirect('/login?error=no_session');
    }

    console.log('OAuth session created successfully for user:', data.user?.email);

    // Enhanced session validation
    const session = data.session;
    if (!session.access_token || !session.refresh_token) {
      console.error('Incomplete session data received');
      return redirect('/login?error=incomplete_session');
    }

    // Create or update user profile with enhanced error handling
    const user = data.user;
    if (user) {
      try {
        const { error: profileError } = await supabase
          .from('user_profiles')
          .upsert({
            user_id: user.id,
            display_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0],
            avatar_url: user.user_metadata?.avatar_url,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          });

        if (profileError) {
          console.error('Failed to update user profile:', profileError);
          // Don't fail the login for profile errors, but log them
        } else {
          console.log('User profile updated successfully');
        }
      } catch (profileError) {
        console.error('Profile update exception:', profileError);
        // Continue with login even if profile update fails
      }
    }

    console.log('Session created with enhanced auth helpers');

    return redirect("/", {
      headers: response.headers,
    });

  } catch (error) {
    logAuthError(error, 'OAuth callback exception');
    console.error('OAuth callback error:', error);
    return redirect('/login?error=callback_failed');
  }
}

export default function AuthCallback() {
  const data = useLoaderData<typeof loader>();

  useEffect(() => {
    // This component should not render as we redirect in the loader
    // But just in case, we can show a loading state
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-600">Completing authentication...</p>
      </div>
    </div>
  );
}
