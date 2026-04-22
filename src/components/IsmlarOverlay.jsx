import { useEffect, useRef } from "react";
import "./ismlar-overlay.css";

function IsmlarOverlay() {
  const name1Ref = useRef(null);
  const name2Ref = useRef(null);
  const andRef = useRef(null);

  useEffect(() => {
    const name1 = name1Ref.current;
    const name2 = name2Ref.current;
    const andSign = andRef.current;
    if (!name1 || !name2 || !andSign) return;
    const timeoutIds = [];

    const setupAndAnimate = (el, duration, delay) => {
      const length = el.getComputedTextLength() * 1.5;
      el.style.strokeDasharray = String(length);
      el.style.strokeDashoffset = String(length);

      const drawTimeout = window.setTimeout(() => {
        el.style.transition = `stroke-dashoffset ${duration}s cubic-bezier(0.45, 0, 0.55, 1), fill-opacity 2.2s cubic-bezier(0.22, 1, 0.36, 1), stroke 1.8s ease, stroke-width 1.8s ease, filter 2s ease`;
        el.style.strokeDashoffset = "0";
      }, delay);
      timeoutIds.push(drawTimeout);
    };

    setupAndAnimate(name1, 4, 500);
    setupAndAnimate(name2, 4, 500);
    setupAndAnimate(andSign, 2.5, 2500);

    const fillStartAt = 5000;
    timeoutIds.push(
      window.setTimeout(() => {
        name1.classList.add("filled");
        name2.classList.add("filled");
        andSign.classList.add("filled");
      }, fillStartAt)
    );

    return () => {
      timeoutIds.forEach((id) => window.clearTimeout(id));
      [name1, name2, andSign].forEach((el) => el.classList.remove("filled"));
    };
  }, []);

  return (
    <div className="ismlar-overlay pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
      <svg viewBox="0 0 800 500" className="calligraphy-stage">
        <text
          ref={name1Ref}
          x="50%"
          y="120"
          textAnchor="middle"
          className="path name-text"
          id="name1"
        >
          Omad
        </text>
        <text
          ref={andRef}
          x="55%"
          y="225"
          textAnchor="middle"
          className="path ampersand"
          id="and-sign"
        >
          &
        </text>
        <g className="reverse-draw">
          <text
            ref={name2Ref}
            x="50%"
            y="360"
            textAnchor="middle"
            className="path name-text rtl-fix"
            id="name2"
          >
            Diyora
          </text>
        </g>
      </svg>
    </div>
  );
}

export default IsmlarOverlay;
