import type { MetaFunction, ActionFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { Form, Link, useNavigation, useSearchParams, useActionData } from "@remix-run/react";

import Button from "~/components/Button";
import TextField from "~/components/TextField";
import { getSupabaseClient } from "~/utils/getSupabaseClient";
import { getSession, commitSession } from "~/session.server";

export const meta: MetaFunction = () => {
  return [
    {
      title: "Sign Up | AI Vibecoding Forum",
    },
  ];
};

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const name = formData.get("name");
  const email = formData.get("email");
  const password = formData.get("password");

  if (typeof name !== "string" || typeof email !== "string" || typeof password !== "string") {
    return Response.json(
      { error: "Name, email, and password must be provided." },
      { status: 400 }
    );
  }

  if (!name.trim() || !email.trim() || !password.trim()) {
    return Response.json(
      { error: "All fields are required." },
      { status: 400 }
    );
  }

  if (password.length < 6) {
    return Response.json(
      { error: "Password must be at least 6 characters long." },
      { status: 400 }
    );
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: name.trim(),
      }
    }
  });

  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  // If signup successful and user is confirmed, sign them in
  if (data.user && !data.user.email_confirmed_at) {
    return Response.json({ 
      success: true, 
      message: "Account created! Please check your email to confirm your account before signing in." 
    });
  }

  // If user is auto-confirmed, sign them in
  if (data.session) {
    const session = await getSession(request.headers.get("Cookie"));
    session.set("__session", data.session.access_token);

    return redirect("/dashboard", {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    });
  }

  return Response.json({ 
    success: true, 
    message: "Account created successfully! Please sign in." 
  });
}

export default function SignUp() {
  const navigation = useNavigation();
  const [searchParams] = useSearchParams();

  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="w-full max-w-2xl px-8 py-10 space-y-8 bg-white shadow-md rounded-xl lg:space-y-10 lg:px-10 lg:py-12 ">
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl lg:text-4xl">
          Sign Up for Remix Dashboard
        </h1>
        <p className="text-sm">
          Already have an account?{" "}
          <Link
            className="underline text-cyan-600"
            to={{
              pathname: "/login",
              search: searchParams.toString(),
            }}
          >
            Sign in
          </Link>
        </p>
      </div>
      <Form method="POST">
        <fieldset
          className="w-full space-y-4 lg:space-y-6 disabled:opacity-70"
          disabled={isSubmitting}
        >
          <TextField
            id="name"
            name="name"
            label="Name"
            required
            type="text"
            placeholder="Name Surname"
          />
          <TextField
            id="password"
            name="password"
            label="Password"
            required
            type="password"
            placeholder="password"
          />
          <Button type="submit" className="w-full" loading={isSubmitting}>
            Login
          </Button>
        </fieldset>
      </Form>
    </div>
  );
}
