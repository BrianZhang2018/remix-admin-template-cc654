import { createBrowserClient } from "@supabase/auth-helpers-remix";

// Type declaration for window.ENV
declare global {
  interface Window {
    ENV?: {
      SUPABASE_URL?: string;
      SUPABASE_ANON_KEY?: string;
    };
  }
}

export const getSupabaseClient = () => {
  // Use window.ENV for client-side environment variables
  const supabaseUrl = window.ENV?.SUPABASE_URL || 'http://127.0.0.1:54321';
  const supabaseAnonKey = window.ENV?.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing client-side Supabase environment variables. Using fallback values.');
  }
  
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
};