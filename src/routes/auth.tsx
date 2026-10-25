import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Brand, meta } from "@/components/Brand";
import { getSupabase, supabaseConfigured } from "@/lib/supabase";
import { authErrorMessage } from "@/lib/auth-error";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: meta("Sign in — CoHost", "Sign in, create an account or recover your CoHost password.") }),
  component: Auth,
});

const email = z.string().trim().email().max(255);
const password = z.string().min(8, "Password must be at least 8 characters").max(72);

export function NotConfigured() {
  return (
    <div className="panel">
      <span className="badge badge-pending">Backend not configured</span>
      <p className="mt-3 text-sm text-muted-foreground">Real accounts are disabled until Supabase public configuration is provided. Nothing falls back to demo identity.</p>
      <Link to="/demo" className="btn btn-primary mt-4">Open the demo instead</Link>
    </div>
  );
}

export function Auth() {
  const [mode, setMode] = useState<"in" | "up" | "recover" | "resend">("in");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const sb = getSupabase();
    if (!sb) return setMsg("Backend not configured.");
    const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    const em = email.safeParse(f["email"]);
    if (!em.success) return setMsg("Enter a valid email.");
    if (mode === "in" || mode === "up") { const p = password.safeParse((f["password"] ?? "")); if (!p.success) return setMsg(p.error.issues[0]?.message ?? "Invalid password"); }
    setBusy(true);
    try {
      if (mode === "in") {
        const { error } = await sb.auth.signInWithPassword({ email: em.data, password: (f["password"] ?? "") });
        if (error) throw error;
        nav({ to: "/app" });
      } else if (mode === "up") {
        const { error } = await sb.auth.signUp({ email: em.data, password: (f["password"] ?? ""), options: { emailRedirectTo: `${window.location.origin}/auth/callback` } });
        if (error) throw error;
        setMsg("Check your email to confirm your account. Open the link in this browser.");
      } else if (mode === "resend") {
        const {error}=await sb.auth.resend({type:'signup',email:em.data,options:{emailRedirectTo:`${window.location.origin}/auth/callback`}});
        if(error)throw error;
        setMsg('If this account needs confirmation, a new email is on its way. Open it in this browser.');
      } else {
        const { error } = await sb.auth.resetPasswordForEmail(em.data, { redirectTo: `${window.location.origin}/reset-password` });
        if (error) throw error;
        setMsg("If that account exists, a reset link is on its way. Open it in this browser.");
      }
    } catch (err) { setMsg(authErrorMessage(err)); } finally { setBusy(false); }
  }
  return (
    <div className="mx-auto max-w-md px-6 py-12">
      <Link to="/"><Brand /></Link>
      <div className="mt-10">
        {!supabaseConfigured ? <NotConfigured /> : (
          <form className="panel space-y-4" onSubmit={submit}>
            <div className="flex flex-wrap gap-2">{([["in", "Sign in"], ["up", "Sign up"], ["recover", "Forgot password"], ["resend", "Resend confirmation"]] as const).map(([k, l]) => <button type="button" key={k} onClick={() => { setMode(k); setMsg(null); }} className={`btn ${mode === k ? "btn-primary" : "btn-ghost"} px-3 py-1 text-xs`}>{l}</button>)}</div>
            <label className="block text-sm font-medium">Email<input name="email" type="email" autoComplete="email" className="field mt-1" required maxLength={255} /></label>
            {(mode === "in" || mode === "up") && <label className="block text-sm font-medium">Password<input name="password" type="password" autoComplete={mode === "up" ? "new-password" : "current-password"} className="field mt-1" required minLength={8} maxLength={72} /></label>}
            <button className="btn btn-primary w-full" disabled={busy}>{mode === "in" ? "Sign in" : mode === "up" ? "Create account" : mode === "resend" ? "Resend confirmation" : "Send reset link"}</button>
            {msg && <p role="status" className="text-sm text-muted-foreground">{msg}</p>}
          </form>
        )}
      </div>
    </div>
  );
}
