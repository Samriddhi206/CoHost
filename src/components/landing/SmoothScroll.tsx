import { useEffect } from "react";
import Lenis from "lenis";

// Landing-page-only smooth scrolling. Skipped entirely for reduced-motion users.
export function useSmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({ duration: 1.1, easing: (t) => 1 - Math.pow(1 - t, 4), smoothWheel: true });
    let frame = 0;
    const loop = (time: number) => { lenis.raf(time); frame = requestAnimationFrame(loop); };
    frame = requestAnimationFrame(loop);
    const onAnchor = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
      if (!a) return;
      const el = document.querySelector(a.getAttribute("href")!);
      if (!el) return;
      e.preventDefault();
      lenis.scrollTo(el as HTMLElement, { offset: -16 });
    };
    document.addEventListener("click", onAnchor);
    return () => { cancelAnimationFrame(frame); document.removeEventListener("click", onAnchor); lenis.destroy(); };
  }, []);
}
