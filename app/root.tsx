import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";
import type { LinksFunction, LoaderFunctionArgs } from "@remix-run/node";
import { useEffect } from "react";
import './i18n';
import { createI18nServer, resources } from './i18n.server';

import styles from "~/styles/tailwind.css?url";

export const links: LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
  { rel: "stylesheet", href: styles },
];

export async function loader({ request }: LoaderFunctionArgs) {
  // Get language from Accept-Language header or default to 'en'
  const acceptLanguage = request.headers.get('accept-language') || '';
  const lng = acceptLanguage.includes('zh') ? 'zh' : 'en';
  
  // Initialize i18n on server side
  try {
    await createI18nServer(lng);
  } catch (error) {
    console.error('Failed to initialize i18n server:', error);
  }
  
  // Expose environment variables, language, and translations to the client
  return Response.json({
    ENV: {
      SUPABASE_URL: process.env.SUPABASE_URL || process.env.SUPABASE_DATABASE_URL,
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    },
    lng,
    resources,
  });
}

export default function App() {
  const data = useLoaderData<typeof loader>();
  
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.ENV = ${JSON.stringify(data.ENV)}; window.LNG = ${JSON.stringify(data.lng)}; window.RESOURCES = ${JSON.stringify(data.resources)};`,
          }}
        />
      </head>
      <body className="flex flex-col min-h-screen text-slate-700 bg-slate-100">
        <Outlet />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
