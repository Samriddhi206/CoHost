# Email authentication setup

Production: https://cohost-theta.vercel.app

Supabase settings verified on October 24, 2026:
- Site URL: https://cohost-theta.vercel.app
- Exact redirects: https://cohost-theta.vercel.app/auth/callback and https://cohost-theta.vercel.app/reset-password
- Email sign-in/sign-up enabled; email confirmation enabled; anonymous sign-in disabled.
- Default Supabase SMTP is enabled; custom SMTP is not configured. Default sender is for organization-member tests only and currently limited to two messages/hour. General campus signups require a custom SMTP provider and verified sender. See https://supabase.com/docs/guides/auth/auth-smtp.

The client uses PKCE with explicit code exchange. Email links must open in the browser where signup/reset started. Codes are removed from browser history after reading; invalid/expired/used links show a recovery path. Confirmation can be resent. Password changes require a verified recovery session, matching password entries, then global sign-out before normal sign-in.

Verified automatically: TypeScript, production build, and 23 app tests, including mocked sign-in, signup callback, reset email destination, expired link handling, code exchange, recovery session gating, password matching, and global sign-out. These are not proof of inbox delivery.

Pending real-inbox test with the owner's authorized email: signup → receive confirmation → verify signed-in workspace → sign out → sign in with original password → request reset → receive recovery email → update password → old password rejected/new password accepted. Password entry and reset require user handoff; never collect passwords or email tokens in chat.
