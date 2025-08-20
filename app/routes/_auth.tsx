import { redirect } from "@remix-run/node";
import { Outlet } from "@remix-run/react";

import Logo from "~/components/Logo";
import { getSupabaseClient } from "~/utils/getSupabaseClient";

export function loader() {
  try {
    getSupabaseClient(); // Throws an error if Supabase is not set
  } catch (error) {
    return redirect("/"); // Redirect to _index.tsx
  }

  return Response.json({});
}

export default function AuthLayout() {
  return (
    <main className="flex grow">
      <div className="absolute left-4 top-4">
        <Logo />
      </div>
      <div className="hidden p-8 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 lg:basis-5/12 lg:flex lg:items-center lg:justify-center">
        <img src="/user.jpg" alt="AI VibeCoding Forum" className="w-64 h-64 rounded-lg object-cover shadow-2xl" />
      </div>
      <div className="flex flex-col items-center justify-center w-full px-4 py-24 lg:px-8 lg:basis-7/12">
        <Outlet />
      </div>
    </main>
  );
}
