import type { ActionFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { destroySession, getSession } from "~/session.server";
import { getSupabaseServerClient } from "~/utils/supabase.server";

export async function action({ request }: ActionFunctionArgs) {
  const response = new Response();
  const supabase = getSupabaseServerClient(request, response);
  
  // Sign out from Supabase
  await supabase.auth.signOut();
  
  // Get and destroy the Remix session
  const session = await getSession(request.headers.get("Cookie"));
  
  // Create a new response with both Supabase and Remix session cleared
  const finalResponse = redirect("/login", {
    headers: {
      "Set-Cookie": await destroySession(session),
    },
  });
  
  // Add Supabase session headers to the final response
  response.headers.forEach((value, key) => {
    finalResponse.headers.set(key, value);
  });
  
  return finalResponse;
}
