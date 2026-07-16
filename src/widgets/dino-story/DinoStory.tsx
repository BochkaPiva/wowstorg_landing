import {
  motion,
  type MotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useSiteContent } from "@features/site-content/SiteContentContext";

const SCENE_COUNT = 5;
const CLIP_DURATION = 5.09;
const VIDEO_SOURCES = Array.from({ length: SCENE_COUNT }, (_, index) => `/dino/${index + 1}.mp4`);

type StoryScene = {
  title: string;
  text: string;
  aside: string;
  align: "left" | "right" | "center";
  action: { label: string; href: string } | null;
};

function useNativeStoryProgress() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(pointer: coarse), (max-width: 960px)");
    const update = () => setEnabled(query.matches);

    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return enabled;
}

function useStoryVideoSources(enabled: boolean, useDirectSources: boolean, activeIndex: number) {
  const [sources, setSources] = useState<Array<string | undefined>>(() => Array(SCENE_COUNT).fill(undefined));

  useEffect(() => {
    if (!enabled) return undefined;
    if (useDirectSources) {
      setSources((current) => current.map((source, index) => source ?? (index <= activeIndex + 1 ? VIDEO_SOURCES[index] : undefined)));
      return undefined;
    }

    const controller = new AbortController();
    const objectUrls: string[] = [];

    VIDEO_SOURCES.forEach((source, index) => {
      void fetch(source, { cache: "force-cache", signal: controller.signal })
        .then((response) => {
          if (!response.ok) throw new Error(`Video preload failed: ${response.status}`);
          return response.blob();
        })
        .then((blob) => {
          if (controller.signal.aborted) return;
          const objectUrl = URL.createObjectURL(blob);
          objectUrls.push(objectUrl);
          setSources((current) => {
            const next = [...current];
            next[index] = objectUrl;
            return next;
          });
        })
        .catch(() => {
          if (controller.signal.aborted) return;
          setSources((current) => {
            const next = [...current];
            next[index] = source;
            return next;
          });
        });
    });

    return () => {
      controller.abort();
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [activeIndex, enabled, useDirectSources]);

  return sources;
}

function useSceneOpacity(progress: MotionValue<number>, index: number) {
  const start = index / SCENE_COUNT;
  const end = (index + 1) / SCENE_COUNT;
  const transition = 0.018;

  if (index === 0) {
    return useTransform(progress, [0, end - transition, end], [1, 1, 0]);
  }

  if (index === SCENE_COUNT - 1) {
    return useTransform(progress, [start, start + transition, 1], [0, 1, 1]);
  }

  return useTransform(progress, [start, start + transition, end - transition, end], [0, 1, 1, 0]);
}

function StoryVideo({
  index,
  progress,
  src,
  canSeek,
}: {
  index: number;
  progress: MotionValue<number>;
  src?: string;
  canSeek: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const targetTimeRef = useRef(0);
  const [frameReady, setFrameReady] = useState(false);
  const opacity = useSceneOpacity(progress, index);
  const shouldLoad = Boolean(src);

  useEffect(() => {
    const video = videoRef.current;
    setFrameReady(false);
    targetTimeRef.current = 0;
    if (!video) return;
    video.pause();
    video.load();
  }, [src]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return undefined;
    }

    let animationFrame = 0;
    let frameCallback = 0;
    let lastSeekAt = 0;
    const seekInterval = 1000 / 24;

    const revealFrame = () => {
      if (typeof video.requestVideoFrameCallback === "function") {
        if (frameCallback) video.cancelVideoFrameCallback(frameCallback);
        frameCallback = video.requestVideoFrameCallback(() => setFrameReady(true));
      } else {
        setFrameReady(true);
      }
    };

    const updateTargetFromProgress = () => {
      const value = progress.get();
      const start = index / SCENE_COUNT;
      const end = (index + 1) / SCENE_COUNT;
      const localProgress = Math.min(1, Math.max(0, (value - start) / (end - start)));
      const duration = Number.isFinite(video.duration) ? video.duration : CLIP_DURATION;
      targetTimeRef.current = Math.min(duration - 0.04, localProgress * (duration - 0.04));
    };

    const seekLatestFrame = (now: number) => {
      if (
        canSeek
        && shouldLoad
        && video.readyState >= HTMLMediaElement.HAVE_METADATA
        && !video.seeking
        && now - lastSeekAt >= seekInterval
      ) {
        const duration = Number.isFinite(video.duration) ? video.duration : CLIP_DURATION;
        const targetTime = Math.min(duration - 0.04, targetTimeRef.current);

        if (Math.abs(video.currentTime - targetTime) > 0.04) {
          lastSeekAt = now;
          video.currentTime = targetTime;
        }
      }

      if (canSeek && shouldLoad) {
        animationFrame = requestAnimationFrame(seekLatestFrame);
      }
    };

    const onLoadedMetadata = () => updateTargetFromProgress();
    const onLoadedData = () => revealFrame();
    const onSeeked = () => revealFrame();

    video.addEventListener("loadeddata", onLoadedData);
    video.addEventListener("loadedmetadata", onLoadedMetadata);
    video.addEventListener("seeked", onSeeked);
    updateTargetFromProgress();
    if (canSeek && shouldLoad) {
      animationFrame = requestAnimationFrame(seekLatestFrame);
    }

    return () => {
      cancelAnimationFrame(animationFrame);
      if (frameCallback && typeof video.cancelVideoFrameCallback === "function") {
        video.cancelVideoFrameCallback(frameCallback);
      }
      video.removeEventListener("loadeddata", onLoadedData);
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
      video.removeEventListener("seeked", onSeeked);
    };
  }, [canSeek, index, progress, shouldLoad]);

  useMotionValueEvent(progress, "change", (value) => {
    const video = videoRef.current;
    const start = index / SCENE_COUNT;
    const end = (index + 1) / SCENE_COUNT;

    if (!video || !shouldLoad || !canSeek || value < start - 0.04 || value > end + 0.04) {
      return;
    }

    const localProgress = Math.min(1, Math.max(0, (value - start) / (end - start)));
    if (video.readyState < HTMLMediaElement.HAVE_METADATA) {
      targetTimeRef.current = localProgress * CLIP_DURATION;
      return;
    }
    const duration = Number.isFinite(video.duration) ? video.duration : CLIP_DURATION;
    const cleanDuration = duration - 0.04;
    targetTimeRef.current = Math.min(cleanDuration, localProgress * cleanDuration);
  });

  return (
    <motion.div
      className={`dino-story__scene dino-story__scene--${index + 1}`}
      style={{ opacity }}
      aria-hidden="true"
    >
      <img
        className="dino-story__poster"
        src={`/dino/${index + 1}-poster.webp`}
        srcSet={`/dino/${index + 1}-poster-640.webp 640w, /dino/${index + 1}-poster.webp 1280w`}
        sizes="100vw"
        alt=""
        width="1280"
        height="720"
        loading="lazy"
        decoding="async"
      />
      <video
        ref={videoRef}
        className={`dino-story__video ${frameReady ? "is-ready" : ""}`}
        src={src}
        preload={shouldLoad ? "auto" : "none"}
        muted
        playsInline
        disablePictureInPicture
      />
    </motion.div>
  );
}

function StoryCopy({
  scene,
  index,
  progress,
  active,
  staticPosition,
}: {
  scene: StoryScene;
  index: number;
  progress: MotionValue<number>;
  active: boolean;
  staticPosition: boolean;
}) {
  const opacity = useSceneOpacity(progress, index);
  const start = index / SCENE_COUNT;
  const end = (index + 1) / SCENE_COUNT;
  const y = useTransform(progress, [start, end], [34, -34]);

  return (
    <motion.div
      className={`dino-story__copy dino-story__copy--${scene.align} dino-story__copy--scene-${index + 1} ${active ? "is-active" : ""}`}
      style={staticPosition ? undefined : { opacity, y }}
      aria-hidden={!active}
    >
      <h2>{scene.title}</h2>
      <p>{scene.text}</p>
      {scene.aside ? <small>{scene.aside}</small> : null}
      {scene.action ? (
        <a className="story-action" href={scene.action.href} tabIndex={active ? 0 : -1}>
          {scene.action.label}
          <ArrowUpRight size={18} aria-hidden="true" />
        </a>
      ) : null}
    </motion.div>
  );
}

export function DinoStory() {
  const { content: siteContent } = useSiteContent();
  const content = siteContent.story;
  const scenes: StoryScene[] = content.scenes.slice(0, SCENE_COUNT);
  const sectionRef = useRef<HTMLElement | null>(null);
  const [activeScene, setActiveScene] = useState(0);
  const [mediaRequested, setMediaRequested] = useState(false);
  const [storyPlaybackActive, setStoryPlaybackActive] = useState(true);
  const reducedMotion = useReducedMotion();
  const nativeStoryProgress = useNativeStoryProgress();
  const videoSources = useStoryVideoSources(mediaRequested, nativeStoryProgress, activeScene);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });
  const cinematicProgress = useSpring(scrollYProgress, {
    stiffness: 46,
    damping: 20,
    mass: 0.5,
    restDelta: 0.0001,
  });
  const storyProgress = nativeStoryProgress ? scrollYProgress : cinematicProgress;
  const progressScale = useTransform(storyProgress, [0, 1], [0, 1]);

  useMotionValueEvent(storyProgress, "change", (value) => {
    setActiveScene(Math.min(SCENE_COUNT - 1, Math.floor(value * SCENE_COUNT)));
  });

  useMotionValueEvent(scrollYProgress, "change", (value) => {
    setStoryPlaybackActive(value < 0.999);
  });

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || typeof IntersectionObserver === "undefined") {
      setMediaRequested(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setMediaRequested(true);
          observer.disconnect();
        }
      },
      { rootMargin: "800px 0px" },
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  if (reducedMotion) {
    return (
      <section className="dino-story dino-story--reduced" id="story">
        {scenes.map((scene, index) => (
          <article
            key={scene.title}
            className="dino-story__reducedScene"
          >
            <video
              src={`/dino/${index + 1}.mp4`}
              poster={`/dino/${index + 1}-poster.webp`}
              muted
              playsInline
              preload="metadata"
              aria-hidden="true"
            />
            <div>
              <h2>{scene.title}</h2>
              <p>{scene.text}</p>
              {scene.action ? <a href={scene.action.href}>{scene.action.label}</a> : null}
            </div>
          </article>
        ))}
      </section>
    );
  }

  return (
    <section ref={sectionRef} className={`dino-story ${nativeStoryProgress ? "dino-story--native" : ""}`} id="story" aria-label="Как ВАУСТОРГ собирает событие">
      <div className="dino-story__stage">
        <div className="dino-story__chapterLabel">{content.label}</div>
        <div className="dino-story__media" aria-hidden="true">
          {scenes.map((scene, index) => (
            <StoryVideo
              key={scene.title}
              index={index}
              progress={storyProgress}
              src={videoSources[index]}
              canSeek={storyPlaybackActive && Math.abs(activeScene - index) <= 1}
            />
          ))}
        </div>

        <div className="dino-story__vignette" aria-hidden="true" />

        {scenes.map((scene, index) => (
          <StoryCopy
            key={scene.title}
            scene={scene}
            index={index}
            progress={storyProgress}
            active={activeScene === index}
            staticPosition={nativeStoryProgress}
          />
        ))}

        <div className="dino-story__progress" aria-hidden="true">
          <motion.span style={{ scaleX: progressScale }} />
        </div>
      </div>
    </section>
  );
}
