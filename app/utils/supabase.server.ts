import { createServerClient } from '@supabase/ssr'
import { getSupabaseClient } from './getSupabaseClient'

export const createServerSupabaseClient = (request: Request, response: Response) => {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.SUPABASE_DATABASE_URL || 'http://127.0.0.1:54321'
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.headers.get('Cookie')?.split(';').map(cookie => {
          const [name, ...value] = cookie.split('=')
          return { name: name?.trim(), value: value?.join('=') }
        }) || []
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.headers.append('Set-Cookie', `${name}=${value}; Path=${options.path || '/'}; Max-Age=${options.maxAge || 2592000}; SameSite=${options.sameSite || 'Lax'}${options.secure ? '; Secure' : ''}${options.httpOnly ? '; HttpOnly' : ''}`)
        })
      },
    },
  })
}

// Fallback to the old client for backward compatibility
export const getSupabaseServerClient = () => {
  return getSupabaseClient()
}
