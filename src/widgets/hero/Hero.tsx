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
  const videoSrc = previewContent.hero.videoPath || siteConfig.heroVideoPath;
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const targetRatio = useRef(0.5);
  const targetTime = useRef(0);
  const smoothTime = useRef(0);
  const durationRef = useRef(0);
  const frameRef = useRef(0);
  const [resolvedVideoSrc, setResolvedVideoSrc] = useState<string | null>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const controller = new AbortController();
    let objectUrl: string | null = null;
    let active = true;

    durationRef.current = 0;
    setVideoReady(false);
    setResolvedVideoSrc(null);

    const bufferVideo = async () => {
      try {
        const response = await fetch(videoSrc, {
          cache: "force-cache",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`Hero video request failed: ${response.status}`);

        const blob = await response.blob();
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        setResolvedVideoSrc(objectUrl);
      } catch (error) {
        if (!active || controller.signal.aborted) return;
        // External CMS media can reject fetch because of CORS. Native video is a safe fallback.
        setResolvedVideoSrc(videoSrc);
      }
    };

    void bufferVideo();

    return () => {
      active = false;
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [videoSrc]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !resolvedVideoSrc) return undefined;

    setVideoReady(false);

    const setInitialTime = () => {
      if (!Number.isFinite(video.duration) || video.duration <= 0) return;
      durationRef.current = video.duration;
      const initialTime = video.duration * targetRatio.current;
      targetTime.current = initialTime;
      smoothTime.current = initialTime;
      video.currentTime = initialTime;
    };
    const markReady = () => {
      if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        setVideoReady(true);
      }
    };

    video.addEventListener("loadedmetadata", setInitialTime);
    video.addEventListener("seeked", markReady);
    video.pause();
    if (video.readyState >= HTMLMediaElement.HAVE_METADATA) setInitialTime();
    return () => {
      video.removeEventListener("loadedmetadata", setInitialTime);
      video.removeEventListener("seeked", markReady);
    };
  }, [resolvedVideoSrc]);

  useEffect(() => {
    const updateTargetFromX = (clientX: number) => {
      targetRatio.current = clamp(clientX / window.innerWidth, 0, 1);
      if (durationRef.current) {
        targetTime.current = targetRatio.current * durationRef.current;
      }
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

    let lastSeekAt = 0;
    const seekInterval = 1000 / 30;

    const raf = (now: number) => {
      smoothTime.current += (targetTime.current - smoothTime.current) * 0.16;

      if (
        durationRef.current
        && video.readyState >= HTMLMediaElement.HAVE_METADATA
        && !video.seeking
        && now - lastSeekAt >= seekInterval
      ) {
        const nextTime = clamp(smoothTime.current, 0, durationRef.current - 0.02);
        if (Math.abs(video.currentTime - nextTime) >= 0.025) {
          lastSeekAt = now;
          video.currentTime = nextTime;
        }
      }

      frameRef.current = requestAnimationFrame(raf);
    };

    frameRef.current = requestAnimationFrame(raf);
    return () => {
      cancelAnimationFrame(frameRef.current);
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
      <div className="hero__videoWrap" aria-hidden="true">
        <img
          className={`hero__poster ${videoReady ? "hero__poster--hidden" : ""}`}
          src="/hero-poster.webp"
          width="1280"
          height="720"
          alt=""
          decoding="async"
        />
        <video
          ref={videoRef}
          className={`hero__video ${videoReady ? "hero__video--ready" : ""}`}
          src={resolvedVideoSrc ?? undefined}
          preload="auto"
          muted
          playsInline
          disablePictureInPicture
        />
      </div>

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
