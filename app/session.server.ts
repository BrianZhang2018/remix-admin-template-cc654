import { createCookieSessionStorage } from "@remix-run/node";

export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "__session",
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secrets: [process.env.SESSION_SECRET ?? "s3cr3t"],
    secure: process.env.NODE_ENV === "production",
    // Enhanced security settings
    maxAge: 60 * 60 * 24 * 7, // 7 days
    expires: new Date(Date.now() + 60 * 60 * 24 * 7 * 1000), // 7 days from now
    // Additional security headers
    domain: process.env.NODE_ENV === "production" ? process.env.COOKIE_DOMAIN : undefined,
  },
});

export const { getSession, commitSession, destroySession } = sessionStorage;

// Enhanced session utilities for better security
export async function createSecureSession(data: any) {
  const session = await getSession();
  
  // Add security metadata
  session.set("created_at", Date.now());
  session.set("user_agent", data.userAgent || "unknown");
  session.set("ip_address", data.ipAddress || "unknown");
  
  // Store user data securely
  if (data.user) {
    session.set("user_id", data.user.id);
    session.set("user_email", data.user.email);
    // Don't store sensitive data in cookies
  }
  
  return session;
}

export async function validateSession(session: any) {
  const createdAt = session.get("created_at");
  const maxAge = 60 * 60 * 24 * 7 * 1000; // 7 days in milliseconds
  
  if (!createdAt || Date.now() - createdAt > maxAge) {
    return false;
  }
  
  return true;
}
