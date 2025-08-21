import { redirect } from "@remix-run/node";
import { createServerSupabaseClient } from "./supabase.server";

export async function requireAuth(request: Request) {
  const response = new Response();
  const supabase = createServerSupabaseClient(request, response);
  
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    throw redirect("/login");
  }
  
  return user;
}

export async function getOptionalUser(request: Request) {
  const response = new Response();
  const supabase = createServerSupabaseClient(request, response);
  
  const { data: { user }, error } = await supabase.auth.getUser();
  
  console.log('getOptionalUser result:', {
    hasUser: !!user,
    hasError: !!error,
    errorMessage: error?.message,
    userEmail: user?.email
  });
  
  if (error || !user) {
    console.log('User validation failed:', error?.message);
    return null;
  }
  
  return user;
}

export async function getUserProfile(userId: string) {
  // We need a request context for the server client, so we'll use the old client for this
  const { getSupabaseClient } = await import("./getSupabaseClient");
  const supabase = getSupabaseClient();
  
  const { data: profile, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", userId)
    .single();
    
  if (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
  
  return profile;
}

