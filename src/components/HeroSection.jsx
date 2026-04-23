import { useMemo, useState, useEffect, useLayoutEffect, useRef } from "react";
import { motion, useScroll, useTransform, useVelocity, useMotionValue, useMotionValueEvent, useInView } from "framer-motion";

import IsmlarOverlay from "./IsmlarOverlay";
import carImage from "../assets/car.png";
import weddingBuilding from "../assets/wedding_building.png";

const targetDate = new Date("2026-04-05T18:00:00");

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
const FRAME_COUNT = 198;

function HeroSection() {
  const [time, setTime] = useState(getTimeLeft());
  const [activeFrame, setActiveFrame] = useState(1);
  const headerMediaRef = useRef(null);
  const frameSequenceRef = useRef(null);
  const canvasRef = useRef(null);
  const introVideoRef = useRef(null);
  const loopVideoRef = useRef(null);
  const touchStartYRef = useRef(null);
  const currentFrameRef = useRef(1);
  const queuedDeltaRef = useRef(0);
  const queuedRafRef = useRef(null);
  const lastFrameUpdateAtRef = useRef(0);
  const preloadedFramesRef = useRef(new Set());
  const imagesMapRef = useRef(new Map());
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [hasSwitchedToLoop, setHasSwitchedToLoop] = useState(false);
  const [isSequenceActive, setIsSequenceActive] = useState(false);
  const [isSequenceDone, setIsSequenceDone] = useState(false);
  const carXRef = useRef(110);
  const carTargetXRef = useRef(110);
  const carRafRef = useRef(null);
  const carNeedsResetRef = useRef(false);
  const [carXVw, setCarXVw] = useState(110);
  const frameExitedAboveRef = useRef(false);

  const invitationRef = useRef(null);
  const { scrollYProgress: invScrollY } = useScroll({
    target: invitationRef,
    offset: ["start end", "end start"],
  });
  const carX = useTransform(invScrollY, [0, 1], ["120%", "-120%"]);
  const carScaleX = useMotionValue(-1);
  const invVelocity = useVelocity(invScrollY);

  useMotionValueEvent(invVelocity, "change", (v) => {
    if (v === 0) return;
    const xNum = parseFloat(carX.get());
    if (Math.abs(xNum) > 105) {
      carScaleX.set(v > 0 ? -1 : 1);
    }
  });

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
    carXRef.current = 110;
    carTargetXRef.current = 110;
    setCarXVw(110);
  }, []);

  useEffect(() => {
    currentFrameRef.current = activeFrame;
    renderCanvasFrame(activeFrame);
  }, [activeFrame]);

  const renderCanvasFrame = (frameIndex) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const img = imagesMapRef.current.get(frameIndex);
    if (!img) return;

    const dpr = window.devicePixelRatio || 1;
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const imageWidth = img.width;
    const imageHeight = img.height;

    const ratio = Math.max(canvasWidth / imageWidth, canvasHeight / imageHeight);
    const newWidth = imageWidth * ratio;
    const newHeight = imageHeight * ratio;
    const x = (canvasWidth - newWidth) / 2;
    const y = (canvasHeight - newHeight) / 2;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.drawImage(img, x, y, newWidth, newHeight);
  };

  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      renderCanvasFrame(currentFrameRef.current);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
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
      img.onload = () => {
        imagesMapRef.current.set(index, img);
        if (index === currentFrameRef.current) {
          renderCanvasFrame(index);
        }
      };
      img.src = `/secure/666/${String(index).padStart(3, "0")}.jpg`;
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

  // Reset frame sequence when user scrolls back down into frame section after leaving above
  useEffect(() => {
    if (!isSequenceDone) return;
    frameExitedAboveRef.current = false;

    const onScroll = () => {
      const frameEl = frameSequenceRef.current;
      if (!frameEl) return;
      const rect = frameEl.getBoundingClientRect();
      const vh = window.innerHeight;

      if (rect.top >= vh) {
        frameExitedAboveRef.current = true;
      }

      if (frameExitedAboveRef.current && rect.top < vh) {
        frameExitedAboveRef.current = false;
        setIsSequenceDone(false);
        setIsSequenceActive(false);
        setActiveFrame(1);
        currentFrameRef.current = 1;
        carXRef.current = 110;
        setCarXVw(110);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isSequenceDone]);

  // Car slides in from right when user scrolls UP through frame section (lerp smoothed)
  useEffect(() => {
    if (!isSequenceDone) return;
    let lastScrollY = window.scrollY;

    const lerp = () => {
      const diff = carTargetXRef.current - carXRef.current;
      if (Math.abs(diff) < 0.05) {
        carXRef.current = carTargetXRef.current;
        setCarXVw(carTargetXRef.current);
        carRafRef.current = null;
        return;
      }
      carXRef.current += diff * 0.12;
      setCarXVw(carXRef.current);
      carRafRef.current = requestAnimationFrame(lerp);
    };

    const onScroll = () => {
      const currentY = window.scrollY;
      const delta = currentY - lastScrollY;
      lastScrollY = currentY;

      const frameEl = frameSequenceRef.current;
      if (!frameEl) return;
      const rect = frameEl.getBoundingClientRect();
      const vh = window.innerHeight;

      // Frame section fully above viewport → user went below, mark car for reset
      if (rect.bottom <= 0) {
        carNeedsResetRef.current = true;
        return;
      }

      // User scrolled back up into frame section → reset car to start position
      if (carNeedsResetRef.current) {
        carNeedsResetRef.current = false;
        if (carRafRef.current) {
          cancelAnimationFrame(carRafRef.current);
          carRafRef.current = null;
        }
        carXRef.current = 110;
        carTargetXRef.current = 110;
        setCarXVw(110);
      }

      if (delta >= 0 || carTargetXRef.current <= -120) return;
      if (rect.top >= vh) return;

      const step = Math.abs(delta) * 0.16;
      carTargetXRef.current = Math.max(-120, carTargetXRef.current - step);

      if (!carRafRef.current) {
        carRafRef.current = requestAnimationFrame(lerp);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (carRafRef.current) {
        cancelAnimationFrame(carRafRef.current);
        carRafRef.current = null;
      }
    };
  }, [isSequenceDone]);

  const weekDays = ["DU", "SE", "CHOR", "PAY", "JU", "SHA", "YA"];
  // April 5, 2026 is Sunday (YA = Yakshanba), week: March 30 – April 5
  const weekDates = [30, 31, 1, 2, 3, 4, 5];

  const buildingRef = useRef(null);
  const isBuildingInView = useInView(buildingRef, { once: true, amount: 0.3 });

  return (
    <div className="relative z-10 flex min-h-full flex-col items-center pb-16 text-center text-[#2d4034]">
      {/* 1. Full-screen intro video */}
      <div className="relative h-[100svh] w-full">
        <div
          ref={headerMediaRef}
          className="relative h-full w-full overflow-hidden"
        >
          {prefersReducedMotion ? (
            <div className="h-full w-full bg-[#E3DDD5]/20 animate-pulse" />
          ) : (
            <>
              <video
                ref={introVideoRef}
                className="pointer-events-none absolute inset-0 z-0 block h-full w-full object-cover bg-[#E3DDD5]/20"
                src="/1.webm"

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
        <div
          ref={frameSequenceRef}
          className="relative w-full h-[100svh] overflow-hidden"
        >
          <div className="absolute inset-0 flex justify-center">
            <canvas
              ref={canvasRef}
              className="h-full w-full object-cover"
            />
          </div>
          {isSequenceDone && (
            <img
              src={carImage}
              alt=""
              aria-hidden
              className="absolute w-96 pointer-events-none z-10"
              style={{
                top: "calc(50% + 30px)",
                transform: `translateX(${carXVw}vw) translateY(-50%) scaleX(-1)`,
                willChange: "transform",
                opacity: 0.9,
              }}
            />
          )}
        </div>

      {/* 3. Invitation Text Section */}
      <div ref={invitationRef} className="relative mt-16 w-full overflow-hidden">
        {/* Car — behind text */}
        <motion.img
          src={carImage}
          alt=""
          aria-hidden
          className="absolute top-1/2 -translate-y-1/2 w-64 pointer-events-none z-0"
          style={{ x: carX, scaleX: carScaleX, opacity: 0.4 }}
        />

        <div className="relative z-10 space-y-8 px-6 text-center">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="font-script text-[2.5rem] leading-tight text-[#b5935b]"
          >
            Qadrli va hurmatli insonimiz!
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-4"
          >
            <p className="font-script text-[1.8rem] leading-relaxed text-[#2d4034]">
              Oila deb atalmish muqaddas dargoh ostonasidamiz.
            </p>
            <p className="font-script text-[2.2rem] leading-relaxed text-[#2d4034]">
              Ushbu hayajonli va baxtli lahzalarni <br/> o'zimizning eng yaqinlarimiz davrasida <br/> o'tkazishni niyat qildik.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="pt-4 space-y-6"
          >
            <p className="font-script text-[1.9rem] leading-relaxed text-[#2d4034]">
              Sizni nikoh to'yimiz tantanasiga <br/> lutfan taklif etamiz.
            </p>
            <div className="flex items-center justify-center gap-4 py-2">
              <div className="h-[1px] w-12 bg-[#b5935b]/50" />
              <span className="font-script text-3xl text-[#b5935b]">❧</span>
              <div className="h-[1px] w-12 bg-[#b5935b]/50" />
            </div>
            <p className="font-script text-[2.4rem] leading-tight text-[#b5935b]">
              Quvonchli kunimizning <br/> aziz mehmoni bo'lishingizni <br/> kutib qolamiz!
            </p>
          </motion.div>
        </div>
      </div>

      {/* 8. Calendar Section */}
      <div className="mt-16 w-full max-w-[26rem] px-4 py-5">
        {/* Title */}
        <p
          style={{ fontFamily: '"Great Vibes", cursive' }}
          className="text-[2.4rem] text-[#2d4034] mb-6 leading-none"
        >
          Aprel, 2026
        </p>
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {weekDays.map((d) => (
            <span key={d} className="text-center font-montserrat text-[0.75rem] font-semibold tracking-wide text-[#b0b0b0] uppercase">
              {d}
            </span>
          ))}
        </div>
        {/* Week row: March 30 – April 5, 2026 */}
        <div className="grid grid-cols-7 gap-2">
          {weekDates.map((day) => {
            const isWedding = day === 5;
            return (
              <div key={day} className="relative flex items-center justify-center h-14">
                {isWedding && (
                  <svg
                    className="absolute"
                    style={{ width: "3.5rem", height: "3.5rem" }}
                    viewBox="0 0 100 90"
                    fill="#e8849a"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M50 85 C50 85 5 52 5 28 C5 14 16 5 29 5 C38 5 46 10 50 18 C54 10 62 5 71 5 C84 5 95 14 95 28 C95 52 50 85 50 85Z" />
                  </svg>
                )}
                <span
                  className={`relative z-10 font-playfair leading-none ${
                    isWedding
                      ? "text-white font-bold text-xl"
                      : "text-[#8a8a8a] text-lg"
                  }`}
                >
                  {day}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 9. Venue Section */}
      <div className="mt-16 w-full max-w-[22rem] px-4 text-center">
        <p
          style={{ fontFamily: '"Great Vibes", cursive' }}
          className="text-[2.6rem] text-[#2d4034] leading-tight mb-3"
        >
          To'y manzili
        </p>
        <p className="font-montserrat text-sm font-bold tracking-widest text-[#2d4034] uppercase leading-relaxed">
          Yakka Saroy<br />Restorani
        </p>
        <p className="font-montserrat mt-3 text-[0.8rem] text-[#7a8c82]">
          Qarshi shaxri
        </p>
        <p className="font-montserrat mt-2 text-[0.72rem] text-[#9aaa9f] leading-relaxed">
          Mo'ljal: Qarshi-Beshkent yo'li,<br />TATU Qarshi filiali.
        </p>
        <div className="mt-8 flex gap-4">
          <a
            href="https://yandex.com/maps/?text=Yakka+Saroy+Restorani+Qarshi"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 rounded-2xl border border-[#2d4034] py-4 font-montserrat text-[0.78rem] font-semibold text-[#2d4034] tracking-wide"
          >
            Yandex xaritasi
          </a>
          <a
            href="https://maps.google.com/?q=Yakka+Saroy+Restorani+Qarshi"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 rounded-2xl border border-[#2d4034] py-4 font-montserrat text-[0.78rem] font-semibold text-[#2d4034] tracking-wide"
          >
            Google Maps
          </a>
        </div>
      </div>

      {/* 10. Building + Car Section */}
      <div ref={buildingRef} className="mt-10 w-full relative" style={{ overflow: "hidden" }}>
        {/* Car enters from left, stops at center — in the road at bottom of building */}
        <motion.img
          src={carImage}
          alt=""
          aria-hidden
          className="absolute pointer-events-none z-10 w-56"
          initial={{ x: "-110vw", scaleX: -1 }}
          animate={
            isBuildingInView
              ? { x: "calc(50vw - 7rem)", scaleX: -1 }
              : { x: "-110vw", scaleX: -1 }
          }
          transition={{ duration: 1.8, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{ bottom: "8%", top: "auto" }}
        />
        <img
          src={weddingBuilding}
          alt="Yakka Saroy Restorani"
          className="relative z-0 w-full block"
        />
      </div>
      </div>
    </div>
  );
}

export default HeroSection;

