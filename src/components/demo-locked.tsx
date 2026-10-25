import { Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";

/** Shown to plain members on officer-only demo pages. */
export function MembersOnlySeeBasics({ what }: { what: string }) {
  return (
    <section className="panel flex flex-col gap-4 md:flex-row md:items-center">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-secondary text-secondary-foreground"><Lock size={20} aria-hidden="true" /></span>
      <div className="flex-1">
        <h2 className="font-display text-lg font-bold">Only officers can see {what}</h2>
        <p className="mt-1 text-sm text-muted-foreground">As a member, you see where and when the event is, and you can volunteer for shifts. Switch to an officer on the left to see more.</p>
      </div>
      <Link to="/demo/crew" className="btn btn-primary">See volunteer shifts</Link>
    </section>
  );
}
