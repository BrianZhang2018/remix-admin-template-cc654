import { createClient } from "@supabase/supabase-js";

export function getSupabaseClient() {
  // Use environment variables if available, otherwise fallback to local development
  const supabaseUrl = process.env.SUPABASE_DATABASE_URL || 'http://127.0.0.1:54321';
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

  return createClient(supabaseUrl, supabaseAnonKey);
}

// Client-side Supabase client for browser usage
export function getSupabaseClientBrowser() {
  if (typeof window === 'undefined') {
    throw new Error('This function can only be called on the client side');
  }
  
  const supabaseUrl = window.ENV?.SUPABASE_URL || 'http://127.0.0.1:54321';
  const supabaseAnonKey = window.ENV?.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
  
  return createClient(supabaseUrl, supabaseAnonKey);
}
