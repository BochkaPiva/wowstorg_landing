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

type StoryScene = {
  title: string;
  text: string;
  aside: string;
  align: "left" | "right" | "center";
  action: { label: string; href: string } | null;
};

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
  shouldLoad,
}: {
  index: number;
  progress: MotionValue<number>;
  shouldLoad: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const isSeekingRef = useRef(false);
  const pendingTimeRef = useRef<number | null>(null);
  const [frameReady, setFrameReady] = useState(false);
  const opacity = useSceneOpacity(progress, index);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return undefined;
    }

    const seekTo = (time: number) => {
      if (Math.abs(video.currentTime - time) <= 0.035) {
        return;
      }

      if (isSeekingRef.current || video.seeking) {
        pendingTimeRef.current = time;
        return;
      }

      isSeekingRef.current = true;
      video.currentTime = time;
    };

    const onSeeked = () => {
      isSeekingRef.current = false;
      setFrameReady(true);
      const pendingTime = pendingTimeRef.current;
      pendingTimeRef.current = null;

      if (pendingTime !== null) {
        seekTo(pendingTime);
      }
    };

    const onLoadedData = () => setFrameReady(true);
    const onLoadedMetadata = () => {
      const value = progress.get();
      const start = index / SCENE_COUNT;
      const end = (index + 1) / SCENE_COUNT;
      const localProgress = Math.min(1, Math.max(0, (value - start) / (end - start)));
      const duration = Number.isFinite(video.duration) ? video.duration : CLIP_DURATION;
      seekTo(Math.min(duration - 0.04, localProgress * (duration - 0.04)));
    };

    video.addEventListener("loadeddata", onLoadedData);
    video.addEventListener("loadedmetadata", onLoadedMetadata);
    video.addEventListener("seeked", onSeeked);
    return () => {
      video.removeEventListener("loadeddata", onLoadedData);
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
      video.removeEventListener("seeked", onSeeked);
    };
  }, [index, progress, shouldLoad]);

  useMotionValueEvent(progress, "change", (value) => {
    const video = videoRef.current;
    const start = index / SCENE_COUNT;
    const end = (index + 1) / SCENE_COUNT;

    if (!video || value < start - 0.04 || value > end + 0.04) {
      return;
    }

    const localProgress = Math.min(1, Math.max(0, (value - start) / (end - start)));
    const duration = Number.isFinite(video.duration) ? video.duration : CLIP_DURATION;
    const cleanDuration = duration - 0.04;
    const targetTime = Math.min(cleanDuration, localProgress * cleanDuration);

    if (Math.abs(video.currentTime - targetTime) <= 0.035) {
      return;
    }

    if (isSeekingRef.current || video.seeking) {
      pendingTimeRef.current = targetTime;
      return;
    }

    isSeekingRef.current = true;
    video.currentTime = targetTime;
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
        alt=""
        width="1280"
        height="720"
        loading="eager"
        decoding="async"
        fetchPriority={index === 0 ? "high" : "low"}
      />
      <video
        ref={videoRef}
        className={`dino-story__video ${frameReady ? "is-ready" : ""}`}
        src={shouldLoad ? `/dino/${index + 1}.mp4` : undefined}
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
}: {
  scene: StoryScene;
  index: number;
  progress: MotionValue<number>;
  active: boolean;
}) {
  const opacity = useSceneOpacity(progress, index);
  const start = index / SCENE_COUNT;
  const end = (index + 1) / SCENE_COUNT;
  const y = useTransform(progress, [start, end], [34, -34]);

  return (
    <motion.div
      className={`dino-story__copy dino-story__copy--${scene.align} dino-story__copy--scene-${index + 1} ${active ? "is-active" : ""}`}
      style={{ opacity, y }}
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
  const reducedMotion = useReducedMotion();
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
  const progressScale = useTransform(cinematicProgress, [0, 1], [0, 1]);

  useMotionValueEvent(cinematicProgress, "change", (value) => {
    setActiveScene(Math.min(SCENE_COUNT - 1, Math.floor(value * SCENE_COUNT)));
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
      { rootMargin: "1200px 0px" },
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
    <section ref={sectionRef} className="dino-story" id="story" aria-label="Как ВАУСТОРГ собирает событие">
      <div className="dino-story__stage">
        <div className="dino-story__chapterLabel">{content.label}</div>
        <div className="dino-story__media" aria-hidden="true">
          {scenes.map((scene, index) => (
            <StoryVideo
              key={scene.title}
              index={index}
              progress={cinematicProgress}
              shouldLoad={mediaRequested}
            />
          ))}
        </div>

        <div className="dino-story__vignette" aria-hidden="true" />

        {scenes.map((scene, index) => (
          <StoryCopy
            key={scene.title}
            scene={scene}
            index={index}
            progress={cinematicProgress}
            active={activeScene === index}
          />
        ))}

        <div className="dino-story__progress" aria-hidden="true">
          <motion.span style={{ scaleX: progressScale }} />
        </div>
      </div>
    </section>
  );
}
