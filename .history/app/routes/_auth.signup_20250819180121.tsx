import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { Form, Link, useActionData, useNavigation, useSearchParams } from "@remix-run/react";

import { commitSession, getSession } from "~/session.server";

import Button from "~/components/Button";
import TextField from "~/components/TextField";
import { getSupabaseClient } from "~/utils/getSupabaseClient";

export const meta: MetaFunction = () => {
  return [
    {
      title: "Sign Up | AI-VibeCoding Forum",
    },
  ];
};

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = formData.get("email");
  const password = formData.get("password");
  const name = formData.get("name");

  if (typeof email !== "string" || typeof password !== "string" || typeof name !== "string") {
    return Response.json(
      { error: "Email, password, and name must be provided." },
      { status: 400 }
    );
  }

  if (!email.trim() || !password.trim() || !name.trim()) {
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
        display_name: name,
      },
    },
  });

  if (error) {
    console.error("Supabase signup error:", error);
    return Response.json({ error: error.message }, { status: 400 });
  }

  if (!data.session) {
    return Response.json(
      { error: "Please check your email to confirm your account." },
      { status: 200 }
    );
  }

  const session = await getSession(request.headers.get("Cookie"));
  session.set("__session", data.session.access_token);

  return redirect("/dashboard", {
    headers: {
      "Set-Cookie": await commitSession(session),
    },
  });
}

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  const token = session.get("__session");

  if (token) {
    return redirect("/dashboard");
  }

  return Response.json({});
}

export default function SignUp() {
  const actionData = useActionData<{ error?: string }>();
  const navigation = useNavigation();
  const [searchParams] = useSearchParams();

  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="w-full max-w-2xl px-8 py-10 space-y-8 bg-white shadow-md rounded-xl lg:space-y-10 lg:px-10 lg:py-12 ">
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl lg:text-4xl">
          Sign Up for AI-VibeCoding Forum
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
        {actionData?.error && (
          <p className="p-3 mb-4 text-sm rounded-md bg-rose-50 text-rose-700">
            {actionData.error}
          </p>
        )}
        <fieldset
          className="w-full space-y-4 lg:space-y-6 disabled:opacity-70"
          disabled={isSubmitting}
        >
          <TextField
            id="name"
            name="name"
            label="Full Name"
            required
            type="text"
            placeholder="John Doe"
          />
          <TextField
            id="email"
            name="email"
            label="Email address"
            required
            type="email"
            placeholder="john@example.com"
          />
          <TextField
            id="password"
            name="password"
            label="Password"
            required
            type="password"
            placeholder="Password (min. 6 characters)"
          />
          <Button type="submit" className="w-full" loading={isSubmitting}>
            Sign Up
          </Button>
        </fieldset>
      </Form>
    </div>
  );
}
