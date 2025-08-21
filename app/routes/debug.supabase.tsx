import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { getSupabaseClient } from "~/utils/getSupabaseClient";

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const supabase = getSupabaseClient();
    
    // Test basic connection
    const { data: categories, error } = await supabase
      .from("categories")
      .select("id, name")
      .limit(1);

    return Response.json({
      success: true,
      hasCategories: !!categories && categories.length > 0,
      error: error?.message || null,
      env: {
        hasSupabaseUrl: !!process.env.SUPABASE_URL,
        hasSupabaseDatabaseUrl: !!process.env.SUPABASE_DATABASE_URL,
        hasSupabaseAnonKey: !!process.env.SUPABASE_ANON_KEY,
      }
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      env: {
        hasSupabaseUrl: !!process.env.SUPABASE_URL,
        hasSupabaseDatabaseUrl: !!process.env.SUPABASE_DATABASE_URL,
        hasSupabaseAnonKey: !!process.env.SUPABASE_ANON_KEY,
      }
    }, { status: 500 });
  }
}

export default function DebugSupabase() {
  const data = useLoaderData<typeof loader>();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Supabase Debug Info</h1>
      <pre className="bg-slate-100 p-4 rounded-lg overflow-auto">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}
