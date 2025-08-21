import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { createServerSupabaseClient } from "~/utils/supabase.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const response = new Response();
  const supabase = createServerSupabaseClient(request, response);

  // Check for OAuth tokens in URL parameters
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');
  const errorDescription = url.searchParams.get('error_description');

  console.log('OAuth callback received:', { code: !!code, error, errorDescription });

  if (error) {
    console.error('OAuth error:', error, errorDescription);
    return redirect('/login?error=oauth_failed', {
      headers: response.headers,
    });
  }

  if (!code) {
    console.error('No OAuth code received');
    return redirect('/login?error=no_code', {
      headers: response.headers,
    });
  }

  try {
    // Exchange the code for a session
    const { data, error: authError } = await supabase.auth.exchangeCodeForSession(code);
    
    if (authError) {
      console.error('Failed to exchange code for session:', authError);
      return redirect('/login?error=session_exchange_failed', {
        headers: response.headers,
      });
    }

    if (!data.session) {
      console.error('No session received from OAuth');
      return redirect('/login?error=no_session', {
        headers: response.headers,
      });
    }

        // Create or update user profile
    if (data.user) {
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
    }

    // Redirect to homepage with session cookies
    return redirect("/", {
      headers: response.headers,
    });

  } catch (error) {
    console.error('OAuth callback error:', error);
    return redirect('/login?error=callback_failed', {
      headers: response.headers,
    });
  }

  // Redirect to homepage with session cookies
  return redirect("/", {
    headers: response.headers,
  });
}

export default function AuthCallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-600">Completing authentication...</p>
      </div>
    </div>
  );
}
