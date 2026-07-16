import { useEffect } from "react";

type LenisInstance = import("lenis").default;

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function prefersNativeTouchScroll() {
  return window.matchMedia("(pointer: coarse), (max-width: 760px)").matches;
}

export function useLenis() {
  useEffect(() => {
    let lenis: LenisInstance | null = null;
    let cancelled = false;
    let frame = 0;
    let hashFrame = 0;
    let hashFrameAfterLayout = 0;

    const scrollToHash = () => {
      const hash = decodeURIComponent(window.location.hash.slice(1));
      if (!hash) return;

      const target = document.getElementById(hash);
      if (!target) return;

      if (lenis) {
        lenis.scrollTo(target, { immediate: true, force: true });
      } else {
        target.scrollIntoView({ behavior: "auto", block: "start" });
      }
    };

    const scheduleHashScroll = () => {
      cancelAnimationFrame(hashFrame);
      cancelAnimationFrame(hashFrameAfterLayout);
      hashFrame = requestAnimationFrame(() => {
        hashFrameAfterLayout = requestAnimationFrame(scrollToHash);
      });
    };

    window.addEventListener("hashchange", scheduleHashScroll);
    scheduleHashScroll();
    void document.fonts.ready.then(scheduleHashScroll);

    if (prefersReducedMotion() || prefersNativeTouchScroll()) {
      return () => {
        cancelAnimationFrame(hashFrame);
        cancelAnimationFrame(hashFrameAfterLayout);
        window.removeEventListener("hashchange", scheduleHashScroll);
      };
    }

    const handleScrollLock = (event: Event) => {
      const isLocked = (event as CustomEvent<boolean>).detail;
      if (isLocked) {
        lenis?.stop();
      } else {
        lenis?.start();
      }
    };

    void import("lenis").then(({ default: Lenis }) => {
      if (cancelled) return;
      lenis = new Lenis({
        lerp: 0.09,
        wheelMultiplier: 0.9,
        touchMultiplier: 1.1,
      });
      window.addEventListener("wowstorg:scroll-lock", handleScrollLock);
      const raf = (time: number) => {
        lenis?.raf(time);
        frame = requestAnimationFrame(raf);
      };
      frame = requestAnimationFrame(raf);
      scheduleHashScroll();
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      cancelAnimationFrame(hashFrame);
      cancelAnimationFrame(hashFrameAfterLayout);
      window.removeEventListener("wowstorg:scroll-lock", handleScrollLock);
      window.removeEventListener("hashchange", scheduleHashScroll);
      lenis?.destroy();
    };
  }, []);
}
