import { useEffect } from "react";
import Lenis from "lenis";

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function useLenis() {
  useEffect(() => {
    if (prefersReducedMotion()) {
      return undefined;
    }

    const lenis = new Lenis({
      lerp: 0.09,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.1,
    });

    const handleScrollLock = (event: Event) => {
      const isLocked = (event as CustomEvent<boolean>).detail;
      if (isLocked) {
        lenis.stop();
      } else {
        lenis.start();
      }
    };

    window.addEventListener("wowstorg:scroll-lock", handleScrollLock);

    let frame = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    };

    frame = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("wowstorg:scroll-lock", handleScrollLock);
      lenis.destroy();
    };
  }, []);
}
