<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Demo mode (src/lib/domain.ts, /demo routes) is isolated in-memory state; never use its account switcher as identity. Why: production identity must come from Supabase Auth.
- Real-mode authorization lives only in db/migrations (RLS + SECURITY DEFINER RPCs using auth.uid()); tables are SELECT-only for clients. Why: no client-only authorization.
- Supabase is the user's external project; do not enable Lovable Cloud. SQL lives in db/ (copied into supabase/ by the user).
