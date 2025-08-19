import { redirect } from "@remix-run/node";
import { getSession } from "~/session.server";
import { getSupabaseClient } from "./getSupabaseClient";

export async function requireAuth(request: Request) {
  const session = await getSession(request.headers.get("Cookie"));
  const token = session.get("__session");
  
  if (!token) {
    throw redirect("/login");
  }
  
  const supabase = getSupabaseClient();
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    throw redirect("/login");
  }
  
  return user;
}

export async function getOptionalUser(request: Request) {
  const session = await getSession(request.headers.get("Cookie"));
  const token = session.get("__session");
  
  if (!token) {
    return null;
  }
  
  const supabase = getSupabaseClient();
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    return null;
  }
  
  return user;
}

export async function getUserProfile(userId: string) {
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

