import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Brand, meta } from "@/components/Brand";
import { getSupabase, supabaseConfigured } from "@/lib/supabase";
import { NotConfigured } from "./auth";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: meta("Reset password — CoHost", "Choose a new password for your CoHost account.") }),
  component: Reset,
});

function Reset() {
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <div className="mx-auto max-w-md px-6 py-12">
      <Link to="/"><Brand /></Link>
      <div className="mt-10">{!supabaseConfigured ? <NotConfigured /> : (
        <form className="panel space-y-4" onSubmit={async (e) => {
          e.preventDefault();
          const pw = String(new FormData(e.currentTarget).get("password") ?? "");
          if (pw.length < 8 || pw.length > 72) return setMsg("Password must be 8–72 characters.");
          const { error } = await getSupabase()!.auth.updateUser({ password: pw });
          setMsg(error ? error.message : "Password updated. You can now sign in.");
        }}>
          <h1 className="text-xl font-bold">Set a new password</h1>
          <input name="password" type="password" autoComplete="new-password" className="field" minLength={8} maxLength={72} required />
          <button className="btn btn-primary w-full">Update password</button>
          {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
        </form>
      )}</div>
    </div>
  );
}
