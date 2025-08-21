import { createServerClient } from "@supabase/auth-helpers-remix";

export const getSupabaseServerClient = (request: Request, response: Response) => {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.SUPABASE_DATABASE_URL || 'http://127.0.0.1:54321';
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey,
      url: supabaseUrl ? 'set' : 'missing',
      key: supabaseAnonKey ? 'set' : 'missing'
    });
    throw new Error('Missing Supabase environment variables. Please check SUPABASE_URL and SUPABASE_ANON_KEY.');
  }

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    { 
      request, 
      response
    }
  );
};