import { redirect } from "@remix-run/node";
import { getSupabaseServerClient } from "./supabase.server";

export async function requireAuth(request: Request) {
  const response = new Response();
  const supabase = getSupabaseServerClient(request, response);
  
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    throw redirect("/login");
  }
  
  return user;
}

export async function getOptionalUser(request: Request) {
  const response = new Response();
  const supabase = getSupabaseServerClient(request, response);
  
  console.log('getOptionalUser called with auth helpers');
  
  const { data: { user }, error } = await supabase.auth.getUser();
  
  console.log('Supabase auth helpers getUser result:', {
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

export async function getUserProfile(userId: string, request: Request) {
  const response = new Response();
  const supabase = getSupabaseServerClient(request, response);
  
  // First try to get existing profile
  const { data: profile, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", userId)
    .single();
    
  if (error) {
    console.error("Error fetching user profile:", error);
    
    // If profile doesn't exist, try to create one
    if (error.code === 'PGRST116') {
      console.log("User profile not found, attempting to create one...");
      
      // Get user data to create profile
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error("Error getting user data for profile creation:", userError);
        return null;
      }
      
      // Create new profile
      const { data: newProfile, error: createError } = await supabase
        .from("user_profiles")
        .insert({
          user_id: userId,
          display_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0],
          avatar_url: user.user_metadata?.avatar_url,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select("*")
        .single();
        
      if (createError) {
        console.error("Error creating user profile:", createError);
        return null;
      }
      
      console.log("User profile created successfully");
      return newProfile;
    }
    
    return null;
  }
  
  return profile;
}

