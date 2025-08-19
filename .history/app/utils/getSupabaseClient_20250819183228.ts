import { createClient } from "@supabase/supabase-js";

export function getSupabaseClient() {
  // Use environment variables (Netlify uses SUPABASE_URL, local uses SUPABASE_DATABASE_URL)
  const supabaseUrl = process.env.SUPABASE_URL || process.env.SUPABASE_DATABASE_URL || 'http://127.0.0.1:54321';
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables. Please check SUPABASE_URL and SUPABASE_ANON_KEY.');
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

// Client-side Supabase client for browser usage
export function getSupabaseClientBrowser() {
  if (typeof window === 'undefined') {
    throw new Error('This function can only be called on the client side');
  }
  
  // Use window.ENV for client-side environment variables
  const supabaseUrl = window.ENV?.SUPABASE_URL || 'http://127.0.0.1:54321';
  const supabaseAnonKey = window.ENV?.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing client-side Supabase environment variables. Using fallback values.');
  }
  
  return createClient(supabaseUrl, supabaseAnonKey);
}
