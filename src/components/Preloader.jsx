import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const ASSETS_TO_PRELOAD = [
  "/1.webm",
  "/2.webm",
  // 198 ta kadrning 2/3 qismi taxminan 132 ta. Qolganlari orqa fonda yuklanadi.
  ...Array.from({ length: 132 }, (_, i) => `/secure/666/${String(i + 1).padStart(3, "0")}.jpg`),
];

export default function Preloader({ children }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Yuklanish jarayonida scrollni qulflaymiz
    document.body.style.overflow = "hidden";

    let loadedCount = 0;
    const total = ASSETS_TO_PRELOAD.length;
    let isAssetsLoaded = false;
    let isMinTimePassed = false;

    // Eng kamida 3 soniya kutamiz, hatto keshdan juda tez yuklansa ham animatsiya chiroyli tugashi kerak
    const minTimeTimeout = setTimeout(() => {
      isMinTimePassed = true;
      checkAndFinish();
    }, 3000);

    let fallbackTimeout;

    const checkAndFinish = () => {
      if (isAssetsLoaded && isMinTimePassed) {
        setLoading(false);
        document.body.style.overflow = "";
        clearTimeout(fallbackTimeout);
      }
    };

    const handleLoad = () => {
      loadedCount++;
      if (loadedCount >= total) {
        isAssetsLoaded = true;
        checkAndFinish();
      }
    };

    ASSETS_TO_PRELOAD.forEach((src) => {
      if (src.endsWith(".webm")) {
        const video = document.createElement("video");
        video.src = src;
        video.oncanplaythrough = handleLoad;
        video.onerror = handleLoad;
        video.load();
      } else {
        const img = new Image();
        img.src = src;
        img.onload = handleLoad;
        img.onerror = handleLoad;
      }
    });

    // 132 ta rasm yuklanishi ko'proq vaqt olishi mumkin, shuning uchun fallback vaqtini 15 sekundgacha uzaytiramiz
    fallbackTimeout = setTimeout(() => {
      setLoading(false);
      document.body.style.overflow = "";
    }, 15000);

    return () => {
      clearTimeout(minTimeTimeout);
      clearTimeout(fallbackTimeout);
    };
  }, []);

  return (
    <>
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="preloader"
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: "easeInOut" }}
            className="fixed inset-0 z-[99999] flex items-center justify-center bg-[#f5efe7]"
          >
            {/* Elegant Wedding Rings with Diamond Animation (Rasmdagidek) */}
            <svg
              viewBox="0 0 240 160"
              className="w-48 md:w-64 lg:w-80 h-auto stroke-[#b5935b] transition-all duration-300"
              fill="transparent"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ filter: "drop-shadow(0px 0px 4px rgba(181, 147, 91, 0.4))" }}
            >
              <defs>
                <mask id="left-ring-mask">
                  <rect width="100%" height="100%" fill="white" stroke="none" />
                  {/* O'ng uzuk ustidan o'tadigan joyini kesish */}
                  <circle cx="120" cy="73" r="14" fill="black" stroke="none" />
                </mask>
                <mask id="right-ring-mask">
                  <rect width="100%" height="100%" fill="white" stroke="none" />
                  {/* Chap uzuk ustidan o'tadigan joyini kesish */}
                  <circle cx="120" cy="117" r="14" fill="black" stroke="none" />
                  {/* Brilliant orqasidagi chiziqlarni kesish */}
                  <polygon points="120,20 176,20 180,38 148,70 116,38" fill="black" stroke="none" />
                </mask>
              </defs>

              {/* Chap Uzuk (Left Ring) */}
              <g mask="url(#left-ring-mask)">
                <motion.ellipse
                  cx="100" cy="95" rx="50" ry="30" transform="rotate(-15 100 95)"
                  initial={{ pathLength: 0, opacity: 0.2 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 2, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
                />
                <motion.ellipse
                  cx="100" cy="95" rx="40" ry="22" transform="rotate(-15 100 95)"
                  initial={{ pathLength: 0, opacity: 0.2 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 2, repeat: Infinity, repeatType: "reverse", ease: "easeInOut", delay: 0.2 }}
                />
              </g>

              {/* O'ng Uzuk (Right Ring) */}
              <g mask="url(#right-ring-mask)">
                <motion.ellipse
                  cx="140" cy="95" rx="50" ry="30" transform="rotate(15 140 95)"
                  initial={{ pathLength: 0, opacity: 0.2 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 2, repeat: Infinity, repeatType: "reverse", ease: "easeInOut", delay: 0.4 }}
                />
                <motion.ellipse
                  cx="140" cy="95" rx="40" ry="22" transform="rotate(15 140 95)"
                  initial={{ pathLength: 0, opacity: 0.2 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 2, repeat: Infinity, repeatType: "reverse", ease: "easeInOut", delay: 0.6 }}
                />
              </g>

              {/* Brilliant (Diamond) */}
              <g stroke="#0ea5e9" fill="rgba(14, 165, 233, 0.15)" style={{ filter: "drop-shadow(0px 0px 6px rgba(14, 165, 233, 0.6))" }}>
                {/* Crown */}
                <motion.path d="M 133 25 L 163 25 L 173 35 L 123 35 Z" 
                  initial={{ pathLength: 0, opacity: 0.2 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 2, repeat: Infinity, repeatType: "reverse", ease: "easeInOut", delay: 0.8 }} />
                {/* Pavilion */}
                <motion.path d="M 123 35 L 148 65 L 173 35" 
                  initial={{ pathLength: 0, opacity: 0.2 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 2, repeat: Infinity, repeatType: "reverse", ease: "easeInOut", delay: 0.8 }} />
                {/* Facets */}
                <motion.path d="M 133 25 L 148 35 L 163 25" 
                  initial={{ pathLength: 0, opacity: 0.2 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 2, repeat: Infinity, repeatType: "reverse", ease: "easeInOut", delay: 1.0 }} />
                <motion.path d="M 148 35 L 148 65" 
                  initial={{ pathLength: 0, opacity: 0.2 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 2, repeat: Infinity, repeatType: "reverse", ease: "easeInOut", delay: 1.0 }} />
                <motion.path d="M 133 35 L 148 65 M 163 35 L 148 65" 
                  initial={{ pathLength: 0, opacity: 0.2 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 2, repeat: Infinity, repeatType: "reverse", ease: "easeInOut", delay: 1.0 }} />
              </g>
            </svg>
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="w-full"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
