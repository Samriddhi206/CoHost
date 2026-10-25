import { createContext, useContext, useState, type ReactNode } from "react";
import { DomainError, initialState, type State } from "./domain";

type Ctx = { s: State; run: (fn: (s: State) => State) => void; error: string | null; clear: () => void; reset: () => void; setUser: (id: string) => void };
const C = createContext<Ctx | null>(null);

// Isolated in-memory demo state. The account switcher only changes this
// state; it is never used as identity for the real (Supabase) mode.
export function DemoProvider({ children }: { children: ReactNode }) {
  const [s, setS] = useState<State>(initialState);
  const [error, setError] = useState<string | null>(null);
  const run = (fn: (s: State) => State) => {
    try {
      setS(fn(s));
      setError(null);
    } catch (e) {
      setError(e instanceof DomainError ? e.message : "Unexpected error");
    }
  };
  return (
    <C.Provider value={{ s, run, error, clear: () => setError(null), reset: () => { setS(initialState()); setError(null); }, setUser: (id) => setS({ ...s, currentUserId: id }) }}>
      {children}
    </C.Provider>
  );
}
export function useDemo() {
  const c = useContext(C);
  if (!c) throw new Error("useDemo outside DemoProvider");
  return c;
}
