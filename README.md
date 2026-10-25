# CoHost

One club’s idea. A whole campus behind it.

Lovable generated the initial design and demo; the live frontend and database enforcement were completed directly after Lovable's credit limit.

## Run locally

Node 24+ and npm:

```sh
npm ci --ignore-scripts
cp .env.example .env.local
npm run dev -- --host 127.0.0.1 --port 4173
```

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in `.env.local`. These are public browser configuration, never a service-role key. The separate CoHost backend is project `coyvvzgprivwcbltqdiq`.

## Live flow

1. Create an account at `/auth` and confirm your email. `/app` requires real Supabase authentication.
2. In Clubs & people, create your club and event. Other leaders use their own accounts to create partner clubs.
3. Invite partner clubs before the first proposal. Each leader saves their own private brief, contribution limit, and optional setup deadline in My agent.
4. Coordinate a proposal in Event workspace. Bounded rules-based agents allocate funding and move setup earlier to fit partner deadlines. Insufficient funding blocks negotiation. Private notes are not shared.
5. Each club leader approves their own current-version commitment. New proposals or brief changes invalidate prior approvals.
6. Organizer adds volunteer roles and publishes only after every required leader approves.
7. Students request club membership; leaders approve requests. Students save availability and self-reported skills, then explicitly confirm or cancel eligible shifts.
8. Refresh to see other accounts' changes. Cancelled roles reopen; eligible students see recommendations without automatic enrollment.

`/demo` is isolated in-memory state with simulated account switching. It does not grant access to live accounts or data.

## Backend and security

Supabase Auth + Postgres RLS. Browser tables are SELECT-only; writes use authenticated invoker wrappers around checked functions in an unexposed private schema. Function identity comes from `auth.uid()`. The database enforces club roles, current approvals, private brief isolation, organizer-only publication, skill/availability matching, shift capacity, and overlap checks. Privileged implementations never accept client identity as authorization.

SQL replay order on an EMPTY project: `db/migrations/20261025000000_cohost_init.sql`, `db/hardening.sql`, `db/workflows.sql`, `db/private-api.sql`. These changes are already applied on CoHost. Do not re-run against an initialized project.

## Verification

```sh
npx tsc --noEmit
npm test
npm run build
npm audit
```

`db/tests/live-security.sql` runs 34 pgTAP assertions with transactional fixtures and rolls everything back. Run with a privileged SQL session against a test project; assertions switch to anon/authenticated roles. `VERIFICATION.md` records results and limits.

## Vercel

Import `Samriddhi206/cohost`, use `npm ci --ignore-scripts` and `npm run build`, and set the two public Supabase variables. Nitro's Vercel preset generates `.vercel/output` including the server function; there is no SPA rewrite. Vercel access was not available during this build, so no production deployment is claimed.

Set Supabase Auth Site URL and redirect allowlist to the deployed origin and its `/reset-password` path. Do not use wildcard callback URLs. Keep email confirmation enabled. Real sign-in/email recovery and production headers still need verification on that origin.
