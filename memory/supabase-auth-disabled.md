---
name: supabase-auth-disabled
description: Auth is intentionally OFF; Supabase config specifics for this project
metadata:
  type: project
---

Login/auth was **intentionally removed** ("for now") — there is no middleware guard, no login page, no signout. The app talks to Supabase as the **anon** role, so RLS policies in `supabase/schema.sql` grant full access to `anon, authenticated`. To re-enable login later, change policies back to `to authenticated` and restore the login page/middleware.

Supabase env (`.env.local`, git-ignored):
- `NEXT_PUBLIC_SUPABASE_URL` = the project URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = holds the **publishable** key (`sb_publishable_...`). The new Supabase key naming calls it "publishable" but the code reads the `...ANON_KEY` variable name — value is correct, name just differs.

Dev server: `npm run dev` (often lands on **port 3001** because 3000 is taken on this machine). Related: [[project-overview]].
