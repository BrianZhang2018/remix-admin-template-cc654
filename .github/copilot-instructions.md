# Copilot Instructions for AI Vibecoding Forum

## Project Overview
- **Stack:** Remix (React), Supabase (Postgres), Netlify, Tailwind CSS, Vite
- **Purpose:** Modern AI-focused coding forum supporting guest and authenticated users, with voting, tagging, moderation, and full-text search.
- **Key Directories:**
  - `app/` — Main Remix app (routes, components, utils, i18n)
  - `supabase/` — Database migrations, schema, and seed data
  - `tests/` — E2E regression and authentication tests

## Architecture & Patterns
- **Remix Routing:**
  - All routes in `app/routes/` use file-based routing. Dynamic segments: `$.tsx`, `categories.$slug.tsx`, etc.
  - Auth flows: `_auth.*.tsx` files (login, signup, reset-password, etc.)
- **Components:**
  - UI in `app/components/` (Button, Sidebar, ProfilePopup, etc.)
  - Forum-specific UI in `app/components/forum/`
  - Icons in `app/components/icons/`
- **i18n:**
  - Language files in `app/locales/` (English, Chinese)
  - `I18nProvider` and `LanguageSwitcher` handle runtime language switching
- **Session/Auth:**
  - `app/session.server.ts` and `app/utils/auth.server.ts` manage sessions and Supabase auth
  - Guest posting is supported via RLS policies in Supabase
- **Database:**
  - All schema/migrations in `supabase/migrations/`
  - Use Supabase CLI for local/remote DB management (see `supabase/README.md`)
  - RLS, triggers, and sample data included

## Developer Workflows
- **Start Dev Server:** `npm run dev`
- **Build for Production:** `npm run build`
- **Run in Production:** `npm start`
- **Supabase Local DB:** `supabase start` (requires Docker)
- **Run E2E Tests:**
  - `npm run test:e2e` (regression)
  - `npm run test:auth` (auth requirements)
  - `npm run test:auth-user` (user structure)
  - `npm run test:all` (all suites)
- **Test Utilities:** See `tests/README.md` for test runner and helpers

## Project Conventions
- **TypeScript:** All app code is TypeScript-first
- **File Naming:**
  - Route files use Remix conventions (`_index.tsx`, `$.tsx`, etc.)
  - Components are PascalCase
- **Styling:** Tailwind CSS via `app/styles/tailwind.css`
- **Environment:**
  - Local: `.env` with Supabase keys (see `supabase/README.md`)
  - Production: Netlify manages env vars via Supabase extension
- **Testing:**
  - E2E tests are Node scripts, no external test runner
  - Test commands expect dev server running

## Integration Points
- **Supabase:**
  - Used for all data, auth, and RLS
  - Managed via CLI and Docker for local, Netlify for prod
- **Netlify:**
  - Deploy via Netlify button or manually
  - Env vars auto-configured with Supabase extension

## Examples
- **Add a new forum feature:**
  1. Create DB migration in `supabase/migrations/`
  2. Update models/types in `app/types/`
  3. Add/modify route/component in `app/routes/` or `app/components/`
  4. Add/extend E2E test in `tests/`

- **Debugging auth/session:**
  - Check `app/session.server.ts` and `app/utils/auth.server.ts`
  - Use Supabase Studio (http://127.0.0.1:54323) for DB inspection

## References
- See `README.md`, `supabase/README.md`, and `tests/README.md` for full details and troubleshooting.
