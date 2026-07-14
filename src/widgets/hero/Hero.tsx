import { Menu, X } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { navigationItems, siteConfig } from "@shared/config/site";
import { useSiteContent } from "@features/site-content/SiteContentContext";

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function Hero() {
  const { content: previewContent } = useSiteContent();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const targetTime = useRef(0);
  const smoothTime = useRef(0);
  const durationRef = useRef(0);
  const isSeeking = useRef(false);
  const pendingTime = useRef<number | null>(null);
  const frameRef = useRef(0);
  const [videoReady, setVideoReady] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;

    const setInitialTime = () => {
      if (!Number.isFinite(video.duration) || video.duration <= 0) return;
      durationRef.current = video.duration;
      const middle = video.duration * 0.5;
      targetTime.current = middle;
      smoothTime.current = middle;
      video.currentTime = middle;
    };
    const markReady = () => setVideoReady(true);

    video.addEventListener("loadedmetadata", setInitialTime);
    video.addEventListener("loadeddata", markReady);
    video.pause();
    return () => {
      video.removeEventListener("loadedmetadata", setInitialTime);
      video.removeEventListener("loadeddata", markReady);
    };
  }, []);

  useEffect(() => {
    const updateTargetFromX = (clientX: number) => {
      if (!durationRef.current) return;
      targetTime.current = clamp(clientX / window.innerWidth, 0, 1) * durationRef.current;
    };
    const onPointerMove = (event: PointerEvent) => updateTargetFromX(event.clientX);
    const onTouchMove = (event: TouchEvent) => {
      if (event.touches[0]) updateTargetFromX(event.touches[0].clientX);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("touchmove", onTouchMove);
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;

    const seekTo = (time: number) => {
      if (!durationRef.current) return;
      const nextTime = clamp(time, 0, durationRef.current);
      if (Math.abs(video.currentTime - nextTime) < 0.015) return;
      if (isSeeking.current) {
        pendingTime.current = nextTime;
        return;
      }
      isSeeking.current = true;
      video.currentTime = nextTime;
    };
    const onSeeked = () => {
      isSeeking.current = false;
      if (pendingTime.current !== null) {
        const next = pendingTime.current;
        pendingTime.current = null;
        seekTo(next);
      }
    };
    const raf = () => {
      smoothTime.current += (targetTime.current - smoothTime.current) * 0.1;
      seekTo(smoothTime.current);
      frameRef.current = requestAnimationFrame(raf);
    };

    video.addEventListener("seeked", onSeeked);
    frameRef.current = requestAnimationFrame(raf);
    return () => {
      cancelAnimationFrame(frameRef.current);
      video.removeEventListener("seeked", onSeeked);
    };
  }, []);

  return (
    <section className="hero" id="top">
      <header className="hero__nav" aria-label="Главная навигация">
        <a className="hero__brand" href="#top" aria-label={siteConfig.brandName}>
          <span>{siteConfig.brandName}</span>
        </a>
        <nav className="hero__links" aria-label="Разделы сайта">
          {navigationItems.map((item) => <a key={item.label} href={item.href}>{item.label}</a>)}
        </nav>
        <a className="hero__navCta" href="#brief">{previewContent.hero.ctaLabel}</a>
        <button
          className="hero__menuButton"
          type="button"
          aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((current) => !current)}
        >
          {menuOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
      </header>

      <div className={`hero__mobileMenu ${menuOpen ? "hero__mobileMenu--open" : ""}`}>
        {navigationItems.map((item) => (
          <a key={item.label} href={item.href} onClick={() => setMenuOpen(false)}>{item.label}</a>
        ))}
        <a href="#brief" onClick={() => setMenuOpen(false)}>{previewContent.hero.ctaLabel}</a>
      </div>

      <div className="hero__glow" aria-hidden="true" />
      <motion.div
        className="hero__videoWrap"
        initial={prefersReducedMotion ? false : { opacity: 0 }}
        animate={{ opacity: videoReady ? 1 : 0.22 }}
        transition={{ duration: 1.15, ease: [0.16, 1, 0.3, 1] }}
      >
        <video ref={videoRef} className="hero__video" src={previewContent.hero.videoPath || siteConfig.heroVideoPath} preload="auto" muted playsInline disablePictureInPicture />
      </motion.div>

      <motion.div
        className="hero__content"
        initial={prefersReducedMotion ? false : { opacity: 0, y: 18, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 1.05, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
      >
        <p className="hero__brandLabel">{previewContent.hero.eyebrow}</p>
        <h1>
          <span>{previewContent.hero.title}</span>
          <em>{previewContent.hero.accent}</em>
        </h1>
        <p>{previewContent.hero.description}</p>
      </motion.div>
    </section>
  );
}
