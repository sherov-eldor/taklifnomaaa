import { useMemo, useState, useEffect, useLayoutEffect, useRef } from "react";
import { motion } from "framer-motion";
import heroBanner from "../images/hero.png";
import IsmlarOverlay from "./IsmlarOverlay";

const targetDate = new Date("2026-03-14T18:00:00");

const getTimeLeft = () => {
  const diff = targetDate.getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
};

const COUNT_LABELS = [
  ["days", "DÍAS"],
  ["hours", "HORAS"],
  ["minutes", "MINUTOS"],
  ["seconds", "SEGUNDOS"],
];
const FRAME_COUNT = 288;

function HeroSection() {
  const [time, setTime] = useState(getTimeLeft());
  const [activeFrame, setActiveFrame] = useState(1);
  const headerMediaRef = useRef(null);
  const frameSequenceRef = useRef(null);
  const introVideoRef = useRef(null);
  const loopVideoRef = useRef(null);
  const touchStartYRef = useRef(null);
  const currentFrameRef = useRef(1);
  const queuedDeltaRef = useRef(0);
  const queuedRafRef = useRef(null);
  const lastFrameUpdateAtRef = useRef(0);
  const preloadedFramesRef = useRef(new Set());
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [hasSwitchedToLoop, setHasSwitchedToLoop] = useState(false);
  const [isSequenceActive, setIsSequenceActive] = useState(false);
  const [isSequenceDone, setIsSequenceDone] = useState(false);

  useLayoutEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    document.body.style.overflow = "";
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
    setActiveFrame(1);
    currentFrameRef.current = 1;
    setIsSequenceDone(false);
    setIsSequenceActive(false);
  }, []);

  useEffect(() => {
    currentFrameRef.current = activeFrame;
  }, [activeFrame]);

  useEffect(() => {
    let cancelled = false;
    let idleId = null;
    let timeoutId = null;
    let frame = 1;

    const preloadFrame = (index) => {
      if (preloadedFramesRef.current.has(index)) return;
      preloadedFramesRef.current.add(index);
      const img = new Image();
      img.decoding = "async";
      img.src = `/secure/frames/${String(index).padStart(3, "0")}.jpg`;
    };

    const schedule = () => {
      if (cancelled) return;

      if (typeof window.requestIdleCallback === "function") {
        idleId = window.requestIdleCallback(
          (deadline) => {
            while (
              frame <= FRAME_COUNT &&
              (deadline.timeRemaining() > 4 || deadline.didTimeout)
            ) {
              preloadFrame(frame);
              frame += 1;
            }
            if (frame <= FRAME_COUNT) schedule();
          },
          { timeout: 250 }
        );
      } else {
        timeoutId = window.setTimeout(() => {
          let batch = 0;
          while (frame <= FRAME_COUNT && batch < 10) {
            preloadFrame(frame);
            frame += 1;
            batch += 1;
          }
          if (frame <= FRAME_COUNT) schedule();
        }, 16);
      }
    };

    schedule();

    return () => {
      cancelled = true;
      if (idleId !== null && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setTime(getTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setPrefersReducedMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) return;
    const root = headerMediaRef.current;
    const introVideo = introVideoRef.current;
    const loopVideo = loopVideoRef.current;
    if (!root || !introVideo) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (hasSwitchedToLoop) {
            introVideo.pause();
            const freezeAt = Math.max((introVideo.duration || 0) - 0.05, 0);
            introVideo.currentTime = freezeAt;
            if (loopVideo) loopVideo.play().catch(() => {});
          } else {
            introVideo.play().catch(() => {});
          }
        } else {
          introVideo.pause();
          if (loopVideo) loopVideo.pause();
        }
      },
      { root: null, threshold: 0.15, rootMargin: "80px 0px" }
    );

    observer.observe(root);
    return () => observer.disconnect();
  }, [prefersReducedMotion, hasSwitchedToLoop]);

  const handleIntroEnded = () => {
    const introVideo = introVideoRef.current;
    if (!introVideo) return;
    const freezeAt = Math.max((introVideo.duration || 0) - 0.05, 0);
    introVideo.currentTime = freezeAt;
    introVideo.pause();
    setHasSwitchedToLoop(true);
    const loopVideo = loopVideoRef.current;
    if (loopVideo) loopVideo.play().catch(() => {});
  };

  useEffect(() => {
    const host = frameSequenceRef.current;
    if (!host) return;
    let rafId = null;

    const syncActiveState = () => {
      if (isSequenceDone) {
        setIsSequenceActive(false);
        rafId = null;
        return;
      }

      const rect = host.getBoundingClientRect();
      const viewportHeight = window.visualViewport?.height || window.innerHeight || 1;
      const reachedTop = rect.top <= 8;
      const stillOnScreen = rect.bottom > viewportHeight * 0.35;
      setIsSequenceActive(reachedTop && stillOnScreen);
      rafId = null;
    };

    const onScrollOrResize = () => {
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(syncActiveState);
    };

    onScrollOrResize();
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);

    return () => {
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
      if (rafId !== null) window.cancelAnimationFrame(rafId);
    };
  }, [isSequenceDone]);

  useEffect(() => {
    if (!isSequenceActive || isSequenceDone) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    let released = false;

    const releaseLock = () => {
      if (released) return;
      released = true;
      document.body.style.overflow = previousOverflow;
      setIsSequenceActive(false);
    };

    const applyQueuedDelta = (timestamp) => {
      if (timestamp - lastFrameUpdateAtRef.current < 33) {
        queuedRafRef.current = window.requestAnimationFrame(applyQueuedDelta);
        return;
      }
      lastFrameUpdateAtRef.current = timestamp;

      const deltaY = queuedDeltaRef.current;
      queuedDeltaRef.current = 0;
      queuedRafRef.current = null;
      if (!deltaY) return;
      const direction = deltaY > 0 ? 1 : -1;
      const step = Math.max(1, Math.round(Math.abs(deltaY) / 30));
      let didHitStart = false;
      let didHitEnd = false;

      const next = Math.min(
        FRAME_COUNT,
        Math.max(1, currentFrameRef.current + direction * step)
      );
      didHitStart = next <= 1 && direction < 0;
      didHitEnd = next >= FRAME_COUNT && direction > 0;
      if (next !== currentFrameRef.current) {
        currentFrameRef.current = next;
        setActiveFrame(next);
      }

      if (didHitStart) {
        releaseLock();
        window.scrollBy({ top: -8, behavior: "auto" });
        return;
      }

      if (didHitEnd) {
        setIsSequenceDone(true);
        releaseLock();
        window.scrollBy({ top: 8, behavior: "auto" });
      }
    };

    const queueDelta = (deltaY) => {
      queuedDeltaRef.current += deltaY;
      if (queuedRafRef.current !== null) return;
      queuedRafRef.current = window.requestAnimationFrame(applyQueuedDelta);
    };

    const onWheel = (event) => {
      if (!released) event.preventDefault();
      queueDelta(event.deltaY);
    };

    const onTouchStart = (event) => {
      touchStartYRef.current = event.touches?.[0]?.clientY ?? null;
    };

    const onTouchMove = (event) => {
      const currentY = event.touches?.[0]?.clientY;
      if (touchStartYRef.current == null || currentY == null) return;
      if (!released) event.preventDefault();
      const deltaY = touchStartYRef.current - currentY;
      touchStartYRef.current = currentY;
      queueDelta(deltaY * 1.4);
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: false });
    window.addEventListener("touchmove", onTouchMove, { passive: false });

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      if (queuedRafRef.current !== null) {
        window.cancelAnimationFrame(queuedRafRef.current);
        queuedRafRef.current = null;
      }
      queuedDeltaRef.current = 0;
      touchStartYRef.current = null;
    };
  }, [isSequenceActive, isSequenceDone]);

  const monthGrid = useMemo(
    () => ["LUN", "MAR", "MIE", "JUE", "VIE", "SAB", "DOM"],
    []
  );

  const marchLeadingBlanks = useMemo(() => {
    const dow = new Date(2026, 2, 1).getDay(); 
    const mondayFirstIndex = dow === 0 ? 6 : dow - 1;
    return mondayFirstIndex;
  }, []);

  return (
    <div className="relative z-10 flex min-h-full flex-col items-center pb-16 text-center text-[#2d4034]">
      {/* 1. Full-screen intro video */}
      <div className="relative h-[100svh] w-full">
        <div
          ref={headerMediaRef}
          className="relative h-full w-full overflow-hidden"
        >
          {prefersReducedMotion ? (
            <motion.img
              initial={{ opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.2 }}
              src={heroBanner}
              alt=""
              className="pointer-events-none h-full w-full object-cover"
            />
          ) : (
            <>
              <video
                ref={introVideoRef}
                className="pointer-events-none absolute inset-0 z-0 block h-full w-full object-cover bg-[#E3DDD5]/20"
                src="/1.webm"
                poster={heroBanner}
                muted
                onEnded={handleIntroEnded}
                playsInline
                preload="metadata"
                disablePictureInPicture
                aria-hidden
              />
              {hasSwitchedToLoop && (
                <video
                  ref={loopVideoRef}
                  className="pointer-events-none relative z-10 block h-full w-full object-cover"
                  src="/2.webm"
                  muted
                  loop
                  playsInline
                  preload="none"
                  disablePictureInPicture
                  aria-hidden
                  autoPlay
                />
              )}
            </>
          )}
          <IsmlarOverlay />
        </div>
      </div>

      <div className="relative w-full flex flex-col items-center">
        {/* 2. Scroll-controlled frame sequence */}
        <div ref={frameSequenceRef} className="relative w-full h-[100svh]">
          <div className="absolute inset-0 flex justify-center">
            <img
              src={`/secure/frames/${String(activeFrame).padStart(3, "0")}.jpg`}
              alt="Frame sequence"
              className="h-full w-full object-cover"
              loading="eager"
            />
          </div>
        </div>

      {/* 3. Quote */}
      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="font-playfair mx-auto mt-4 max-w-[85%] text-[0.7rem] leading-relaxed tracking-wider text-[#3d5248] uppercase"
      >
        "HAY MOMENTOS INOLVIDABLES QUE SE ATESORAN CON EL CORAZÓN PARA SIEMPRE,
        POR ESA RAZÓN, CON LA ALEGRÍA Y EMOCIÓN, QUIERO COMPARTIR CONTIGO ESTA
        NOCHE MARAVILLOSA CELEBRANDO JUNTOS MIS XV AÑOS."
      </motion.p>

      {/* 5. Details Section */}
      <div className="mt-12 space-y-4 px-4">
        <p className="font-playfair text-[0.7rem] font-bold tracking-[0.1em] text-[#3d5248] uppercase">
          ACOMPAÑAME EN ESTE DÍA TAN ESPECIAL JUNTO A MIS PADRES:
        </p>
        <p className="font-script text-[2.5rem] leading-none text-[#2d4034]">
          Rafael López & Emilia Peredo
        </p>
        <p className="font-playfair mt-6 text-[0.7rem] font-bold tracking-[0.2em] text-[#a68966] uppercase">
          MIS PADRINOS
        </p>
        <p className="font-script text-[2.2rem] leading-none text-[#2d4034]">
          Freddy Pérez & Mónica Bernat
        </p>
        <div className="pt-4">
          <p className="font-cinzel text-lg font-bold tracking-[0.1em] text-[#2d4034]">
            A FESTEJAR MIS
          </p>
          <p className="font-cinzel text-2xl font-bold tracking-[0.2em] text-[#2d4034]">
            XV AÑOS
          </p>
        </div>
      </div>

      {/* 6. Date Section */}
      <div className="mt-12 w-full max-w-[16rem]">
        <p className="font-script text-[2.8rem] text-[#b5935b]">Marzo</p>
        <div className="my-2 flex items-center justify-center gap-4">
          <div className="h-[1px] flex-1 bg-[#E3DDD5]" />
          <div className="flex items-center gap-3">
            <span className="font-playfair text-xs font-bold text-[#2d4034] uppercase">SÁBADO</span>
            <span className="font-script text-5xl text-[#b5935b] leading-none">14</span>
            <span className="font-playfair text-xs font-bold text-[#2d4034]">2026</span>
          </div>
          <div className="h-[1px] flex-1 bg-[#E3DDD5]" />
        </div>
      </div>

      {/* 7. Countdown Section */}
      <div className="mt-16 w-full px-6">
        <p className="font-script text-[2.2rem] text-[#b5935b]">Faltan</p>
        <div className="mt-4 flex justify-around">
          {COUNT_LABELS.map(([key, label]) => (
            <div key={key} className="flex flex-col items-center">
              <span className="font-playfair text-4xl font-bold text-[#2d4034] leading-none">
                {String(time[key]).padStart(2, "0")}
              </span>
              <span className="font-montserrat mt-2 text-[0.5rem] font-bold tracking-widest text-[#5a6b62]">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 8. Calendar Section */}
      <div className="mt-16 w-full max-w-[18rem] rounded-2xl bg-[#E3DDD5]/80 p-6 backdrop-blur-sm border border-[#E3DDD5] shadow-sm">
        <p className="font-script text-[2.2rem] text-[#b5935b]">El Gran Día</p>
        <p className="font-mis15 text-[1.8rem] text-[#2d4034] -mt-2">Marzo</p>
        
        <div className="mt-6 grid grid-cols-7 gap-y-3">
          {monthGrid.map((d) => (
            <span key={d} className="font-montserrat text-[0.55rem] font-bold text-[#5a6b62]">
              {d}
            </span>
          ))}
          {Array.from({ length: marchLeadingBlanks }).map((_, i) => (
            <span key={`e-${i}`} />
          ))}
          {Array.from({ length: 31 }, (_, i) => {
            const day = i + 1;
            const is14 = day === 14;
            return (
              <span
                key={day}
                className={`relative flex h-8 items-center justify-center font-playfair text-[0.8rem] ${
                  is14 ? "calendar-heart z-10 font-bold" : ""
                }`}
              >
                {day}
              </span>
            );
          })}
        </div>
        </div>
      </div>
    </div>
  );
}

export default HeroSection;

