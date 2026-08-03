"use client";

import { useEffect, useRef, useState } from "react";

const JADE = "#28A745";
const FOREST = "#0B1210";
const FOREST_CARD = "#13221B";
const CREAM = "#F3F5F2";
const JADE_SOFT = "rgba(40, 167, 69,0.25)";

function ScreenHome({ active }) {
  const target = 94;
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active) {
      setVal(0);
      return;
    }
    const start = performance.now();
    const dur = 1200;
    let raf = 0;
    const step = (t) => {
      const p = Math.min(1, (t - start) / dur);
      const e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
      setVal(Math.round(target * e));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [active]);

  const r = 38;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - val / 100);

  const tiles = ["Particulars", "Driver's Licence", "Inspection", "Tinted Permit", "Plate", "Roadworthy"];

  return (
    <div className="hps-screen">
      <div className="hps-status">
        <span>9:41</span>
        <span className="hps-status-r">
          <span className="hps-sig" /> <span>5G</span> <span className="hps-bat" />
        </span>
      </div>
      <div className="hps-header">
        <div className="hps-eyebrow">Welcome to</div>
        <div className="hps-h1">Vehiculars</div>
        <div className="hps-sub">All your documents are up to date</div>
        <div className="hps-ring-wrap">
          <svg viewBox="0 0 100 100" className="hps-ring">
            <circle cx="50" cy="50" r={r} stroke="rgba(245, 245, 245,0.15)" strokeWidth="7" fill="none" />
            <circle
              cx="50"
              cy="50"
              r={r}
              stroke={CREAM}
              strokeWidth="7"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={c}
              strokeDashoffset={offset}
              transform="rotate(-90 50 50)"
              style={{ transition: "none" }}
            />
          </svg>
          <div className="hps-ring-val">
            <div className="hps-ring-num">{val}</div>
            <div className="hps-ring-lbl">On track</div>
          </div>
        </div>
      </div>
      <div className="hps-section-h">Services</div>
      <div className="hps-grid">
        {tiles.map((t) => (
          <div key={t} className="hps-tile">
            <div className="hps-tile-dot" />
            <div className="hps-tile-lbl">{t}</div>
          </div>
        ))}
      </div>
      <div className="hps-spacer" />
      <div className="hps-nav">
        {["Home", "Bookings", "Services", "Wallet", "More"].map((n, i) => (
          <div key={n} className={`hps-nav-i ${i === 0 ? "is-active" : ""}`}>
            <div className="hps-nav-icn" />
            <div className="hps-nav-lbl">{n}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScreenTracking({ active }) {
  const [w, setW] = useState(0);
  useEffect(() => {
    if (!active) {
      setW(0);
      return;
    }
    const id = requestAnimationFrame(() => setW(60));
    return () => cancelAnimationFrame(id);
  }, [active]);

  const stages = ["Paid", "Assigned", "Working", "Done", "Complete"];
  const current = 2;

  return (
    <div className="hps-screen">
      <div className="hps-status">
        <span>9:41</span>
        <span className="hps-status-r"><span className="hps-sig" /> <span>5G</span> <span className="hps-bat" /></span>
      </div>
      <div className="hps-back">‹ Back</div>
      <div className="hps-tr-title">Vehicle Particulars Renewal</div>
      <div className="hps-tr-meta">SR-2406 · Toyota Camry · LSD-284-AB</div>

      <div className="hps-prog-track">
        <div
          className="hps-prog-fill"
          style={{ width: `${w}%`, transition: "width 1000ms cubic-bezier(0.65,0,0.35,1)" }}
        />
      </div>
      <div className="hps-prog-labels">
        {stages.map((s, i) => (
          <span key={s} className={i <= current ? "is-done" : ""}>{s}</span>
        ))}
      </div>

      <div className="hps-tr-card">
        <div className="hps-tr-row">
          <div className="hps-avatar">A</div>
          <div>
            <div className="hps-tr-strong">Agent AGT-A047 is on the way</div>
            <div className="hps-tr-soft">Sorting your Vehicle Particulars</div>
          </div>
        </div>
      </div>

      <div className="hps-doc-card">
        <div className="hps-check">✓</div>
        <div>
          <div className="hps-tr-strong">Vehicle Particulars approved</div>
          <div className="hps-tr-soft">Expires Mar 2027</div>
        </div>
      </div>
    </div>
  );
}

function ScreenWallet({ active }) {
  const target = 24500;
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!active) {
      setN(0);
      return;
    }
    const start = performance.now();
    const dur = 1000;
    let raf = 0;
    const step = (t) => {
      const p = Math.min(1, (t - start) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      setN(Math.round(target * e));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [active]);

  return (
    <div className="hps-screen">
      <div className="hps-status">
        <span>9:41</span>
        <span className="hps-status-r"><span className="hps-sig" /> <span>5G</span> <span className="hps-bat" /></span>
      </div>
      <div className="hps-wal-eyebrow">Wallet balance</div>
      <div className="hps-wal-bal">₦{n.toLocaleString()}</div>
      <div className="hps-wal-card">
        <div className="hps-tr-soft">Dedicated account</div>
        <div className="hps-tr-strong">0123 456 789</div>
        <div className="hps-tr-soft">Wema Bank · Vehiculars / Demo User</div>
      </div>
      <div className="hps-section-h">Recent activity</div>
      <div className="hps-tx">
        <div>
          <div className="hps-tr-strong">Wallet funded</div>
          <div className="hps-tr-soft">Today · 10:42</div>
        </div>
        <div className="hps-tx-pos">+₦10,000</div>
      </div>
      <div className="hps-tx">
        <div>
          <div className="hps-tr-strong">Vehicle Particulars</div>
          <div className="hps-tr-soft">Yesterday</div>
        </div>
        <div className="hps-tx-neg">−₦8,500</div>
      </div>
      <div className="hps-tx">
        <div>
          <div className="hps-tr-strong">Inspection booking</div>
          <div className="hps-tr-soft">3 days ago</div>
        </div>
        <div className="hps-tx-neg">−₦4,000</div>
      </div>
    </div>
  );
}

function MiniRing({ value, size = 28 }) {
  const r = (size - 4) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size}>
      <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(245, 245, 245,0.18)" strokeWidth="3" fill="none" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={JADE}
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - value / 100)}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  );
}

export function HeroPhoneShowcase() {
  const sectionRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [activeScreen, setActiveScreen] = useState(0);
  const [reduce, setReduce] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mr = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mm = window.matchMedia("(max-width: 767px)");
    const sync = () => {
      setReduce(mr.matches);
      setIsMobile(mm.matches);
    };
    sync();
    mr.addEventListener("change", sync);
    mm.addEventListener("change", sync);
    return () => {
      mr.removeEventListener("change", sync);
      mm.removeEventListener("change", sync);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let raf = 0;
    let queued = false;
    const tick = () => {
      queued = false;
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const total = rect.height + vh;
      const passed = vh - rect.top;
      const p = Math.max(0, Math.min(1, passed / total));
      setProgress(p);
    };
    const onScroll = () => {
      if (queued) return;
      queued = true;
      raf = requestAnimationFrame(tick);
    };
    tick();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const id = setInterval(() => setActiveScreen((s) => (s + 1) % 3), 3600);
    const timer = setTimeout(() => setLoaded(true), 120);
    return () => {
      clearInterval(id);
      clearTimeout(timer);
    };
  }, []);

  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const tiltT = clamp((progress - 0.1) / 0.4);
  const tiltY = reduce || isMobile ? 0 : -5 * (1 - tiltT);
  const tiltX = reduce || isMobile ? 0 : 2 * (1 - tiltT);
  const parallaxY = reduce ? 0 : -progress * 20;

  const animating = progress > 0.001 && progress < 0.999;
  const finalOpacity = 1;
  const finalScale = 1;
  const cardProgress = loaded ? 1 : 0;

  return (
    <div ref={sectionRef} className="hps-root">
      <div
        className="hps-stage"
        style={{
          transform: `translateY(${parallaxY}px)`,
        }}
      >
        <div
          className="hps-phone-wrap"
          style={{
            opacity: finalOpacity,
            transform: `scale(${finalScale}) rotateY(${tiltY}deg) rotateX(${tiltX}deg)`,
            willChange: animating ? "transform" : "auto",
          }}
        >
          <div className={`hps-phone-float ${reduce ? "is-reduce" : ""}`}>
            <div className="hps-phone">
              <span className="hps-btn hps-btn-mute" />
              <span className="hps-btn hps-btn-vu" />
              <span className="hps-btn hps-btn-vd" />
              <span className="hps-btn hps-btn-pw" />
              <div className="hps-screen-wrap">
                <div className="hps-island" />
                <div className={`hps-fade ${activeScreen === 0 ? "is-on" : ""}`}>
                  <ScreenHome active={activeScreen === 0} />
                </div>
                <div className={`hps-fade ${activeScreen === 1 ? "is-on" : ""}`}>
                  <ScreenTracking active={activeScreen === 1} />
                </div>
                <div className={`hps-fade ${activeScreen === 2 ? "is-on" : ""}`}>
                  <ScreenWallet active={activeScreen === 2} />
                </div>
                <div className="hps-reflect" />
              </div>
            </div>
          </div>

          <FloatingCard
            position="tl"
            visible={loaded}
            t={cardProgress}
            delayIndex={0}
            reduce={reduce}
            floatDur={5200}
          >
            <div className="hps-fc-row">
              <div className="hps-check sm">✓</div>
              <div>
                <div className="hps-fc-title">Document approved</div>
                <div className="hps-fc-sub">Vehicle Particulars · expires Mar 2027</div>
              </div>
            </div>
          </FloatingCard>

          <FloatingCard
            position="mr"
            visible={loaded}
            t={cardProgress}
            delayIndex={1}
            reduce={reduce}
            floatDur={6400}
          >
            <div className="hps-fc-row">
              <MiniRing value={94} size={36} />
              <div>
                <div className="hps-fc-sub">Compliance score</div>
                <div className="hps-fc-big">94%</div>
              </div>
            </div>
          </FloatingCard>

          <FloatingCard
            position="bl"
            visible={loaded}
            t={cardProgress}
            delayIndex={2}
            reduce={reduce}
            floatDur={5800}
          >
            <div className="hps-fc-row">
              <div className="hps-bell">🔔</div>
              <div>
                <div className="hps-fc-title">Agent AGT-A047 assigned</div>
                <div className="hps-fc-sub">Working on your Vehicle Particulars</div>
              </div>
            </div>
          </FloatingCard>
        </div>
      </div>

      <style>{styles}</style>
    </div>
  );
}

function FloatingCard({
  position,
  visible,
  t,
  delayIndex,
  reduce,
  floatDur,
  children,
}) {
  const cardT = Math.max(0, Math.min(1, (t - delayIndex * 0.12) / 0.5));
  const fromX = position === "mr" ? 40 : -40;
  const tx = (1 - cardT) * fromX;
  const op = reduce ? (t > 0 ? 1 : 0) : cardT;

  return (
    <div
      className={`hps-fc hps-fc-${position} ${reduce ? "is-reduce" : ""}`}
      style={{
        opacity: op,
        transform: `translateX(${tx}px)`,
        animationDuration: `${floatDur}ms`,
        animationDelay: `${delayIndex * 400}ms`,
        pointerEvents: visible ? "auto" : "none",
        willChange: cardT > 0 && cardT < 1 ? "transform, opacity" : "auto",
      }}
    >
      {children}
    </div>
  );
}

const styles = `
.hps-root {
  position: relative;
  width: 100%;
  min-height: auto;
  overflow: visible;
  isolation: isolate;
  perspective: 1400px;
  font-family: 'Inter Tight', system-ui, sans-serif;
}
.hps-bg, .hps-bg-grain {
  display: none;
}

.hps-stage {
  position: relative; z-index: 1;
  display: flex; align-items: center; justify-content: center;
  min-height: auto;
  padding: clamp(16px, 3vw, 36px) 0;
}

.hps-phone-wrap {
  position: relative;
  transform-style: preserve-3d;
  transition: opacity 300ms ease, transform 600ms cubic-bezier(0.16,1,0.3,1);
}

@keyframes hps-float-phone {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-8px); }
}
.hps-phone-float {
  animation: hps-float-phone 6000ms cubic-bezier(0.45,0,0.55,1) infinite;
}
.hps-phone-float.is-reduce { animation: none; }

.hps-phone {
  position: relative;
  width: clamp(240px, 28vw, 310px);
  aspect-ratio: 320 / 660;
  border-radius: 48px;
  background: linear-gradient(145deg, #1a1a1c 0%, #2a2a2d 28%, #0e0e10 55%, #26262a 78%, #101012 100%);
  padding: 12px;
  box-shadow:
    inset 0 0 0 1px rgba(255,255,255,0.08),
    inset 0 1px 0 rgba(255,255,255,0.18),
    inset 0 -1px 0 rgba(0,0,0,0.5),
    0 1px 0 rgba(255,255,255,0.04),
    0 18px 30px rgba(17, 17, 17,.28),
    0 40px 80px rgba(17, 17, 17,.22);
}
.hps-btn { position: absolute; background: #0a0a0b; box-shadow: inset 0 1px 0 rgba(255,255,255,0.08), 0 1px 0 rgba(0,0,0,0.6); border-radius: 2px; }
.hps-btn-mute { left: -2px; top: 14%; width: 3px; height: 3.2%; border-top-left-radius: 2px; border-bottom-left-radius: 2px; }
.hps-btn-vu   { left: -2px; top: 22%; width: 3px; height: 7%; border-top-left-radius: 2px; border-bottom-left-radius: 2px; }
.hps-btn-vd   { left: -2px; top: 31%; width: 3px; height: 7%; border-top-left-radius: 2px; border-bottom-left-radius: 2px; }
.hps-btn-pw   { right: -2px; top: 24%; width: 3px; height: 10%; border-top-right-radius: 2px; border-bottom-right-radius: 2px; }

.hps-screen-wrap {
  position: relative; height: 100%; width: 100%;
  border-radius: 38px; overflow: hidden;
  background: ${FOREST};
  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.06), inset 0 0 24px rgba(0,0,0,0.55);
}

.hps-island {
  position: absolute; left: 50%; top: 8px; z-index: 30;
  width: 31%; height: 22px; transform: translateX(-50%);
  background: #050505; border-radius: 20px;
  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.04), 0 1px 2px rgba(0,0,0,0.6);
}

.hps-reflect {
  position: absolute; inset: 0; z-index: 25; pointer-events: none;
  background: linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%);
  mix-blend-mode: screen;
}

.hps-fade {
  position: absolute; inset: 0; opacity: 0;
  transition: opacity 400ms ease;
  z-index: 1;
}
.hps-fade.is-on { opacity: 1; z-index: 2; }

.hps-screen {
  position: relative; width: 100%; height: 100%;
  padding: 40px 14px 0;
  color: ${CREAM};
  display: flex; flex-direction: column;
  font-size: 11px;
}
.hps-status {
  position: absolute; top: 12px; left: 18px; right: 18px;
  display: flex; justify-content: space-between; align-items: center;
  font-size: 11px; font-weight: 600; color: ${CREAM};
  z-index: 20;
}
.hps-status-r { display: inline-flex; align-items: center; gap: 4px; font-size: 10px; }
.hps-sig { display:inline-block; width: 14px; height: 8px; background:
  linear-gradient(to right, ${CREAM} 25%, ${CREAM} 25%, ${CREAM} 50%, ${CREAM} 50%, rgba(245, 245, 245,0.4) 50%);
  -webkit-mask-image: linear-gradient(to top, #000 50%, #0006);
}
.hps-bat { display:inline-block; width: 18px; height: 9px; border:1px solid ${CREAM}; border-radius: 2px; position: relative; }
.hps-bat::after { content:''; position:absolute; left:1px; top:1px; bottom:1px; width: 70%; background:${CREAM}; border-radius:1px; }

.hps-section-h {
  font-family: var(--font-geist-sans), sans-serif;
  font-size: 13px; font-weight: 600;
  color: ${CREAM};
  margin: 14px 4px 8px;
  letter-spacing: -0.01em;
}

.hps-header {
  position: relative;
  margin-top: 6px;
  padding: 14px 14px 16px;
  border-radius: 18px;
  background: linear-gradient(135deg, ${JADE} 0%, #0a7050 100%);
  color: ${CREAM};
  overflow: hidden;
}
.hps-eyebrow { font-size: 10px; opacity: 0.8; text-transform: uppercase; letter-spacing: 0.12em; }
.hps-h1 { font-family: var(--font-geist-sans), sans-serif; font-size: 22px; line-height: 1.1; margin-top: 2px; font-weight: 600; letter-spacing: -0.02em; }
.hps-sub { font-size: 11px; opacity: 0.85; margin-top: 4px; max-width: 70%; }
.hps-ring-wrap { position: absolute; right: 10px; top: 10px; width: 64px; height: 64px; }
.hps-ring { width: 100%; height: 100%; display: block; }
.hps-ring-val { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.hps-ring-num { font-family: var(--font-geist-mono), monospace; font-size: 18px; font-weight: 600; line-height: 1; }
.hps-ring-lbl { font-size: 7px; text-transform: uppercase; letter-spacing: 0.1em; margin-top: 2px; }

.hps-grid {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 7px;
}
.hps-tile {
  background: ${FOREST_CARD};
  border: 1px solid ${JADE_SOFT};
  border-radius: 12px;
  padding: 10px 8px;
  display: flex; flex-direction: column; gap: 6px;
  min-height: 64px;
}
.hps-tile-dot { width: 18px; height: 18px; border-radius: 6px; background: linear-gradient(135deg, ${JADE}, #0a7050); }
.hps-tile-lbl { font-family: var(--font-geist-sans), sans-serif; font-size: 10px; line-height: 1.15; font-weight: 600; }

.hps-spacer { flex: 1; }

.hps-nav {
  position: absolute; left: 0; right: 0; bottom: 0;
  display: grid; grid-template-columns: repeat(5, 1fr);
  padding: 8px 6px 14px;
  background: rgba(10, 10, 10,0.92);
  border-top: 1px solid rgba(245, 245, 245,0.08);
  backdrop-filter: blur(8px);
}
.hps-nav-i { display:flex; flex-direction:column; align-items:center; gap:3px; opacity: 0.55; }
.hps-nav-i.is-active { opacity: 1; }
.hps-nav-icn { width: 16px; height: 16px; border-radius: 4px; background: ${CREAM}; }
.hps-nav-i.is-active .hps-nav-icn { background: ${JADE}; }
.hps-nav-lbl { font-size: 8px; letter-spacing: 0.04em; }

.hps-back { font-size: 11px; opacity: 0.7; margin-top: 4px; }
.hps-tr-title { font-family: var(--font-geist-sans), sans-serif; font-size: 18px; line-height: 1.15; margin-top: 6px; letter-spacing: -0.01em; font-weight: 600; }
.hps-tr-meta { font-size: 10px; opacity: 0.65; margin-top: 4px; }
.hps-prog-track { margin-top: 16px; height: 6px; border-radius: 999px; background: rgba(245, 245, 245,0.1); overflow: hidden; }
.hps-prog-fill { height: 100%; background: linear-gradient(90deg, ${JADE}, #38d39f); border-radius: 999px; }
.hps-prog-labels { display: flex; justify-content: space-between; margin-top: 6px; font-size: 8px; }
.hps-prog-labels span { opacity: 0.5; letter-spacing: 0.04em; }
.hps-prog-labels span.is-done { opacity: 1; color: ${JADE}; font-weight: 600; }
.hps-tr-card, .hps-doc-card {
  margin-top: 12px; padding: 12px; border-radius: 14px;
  background: ${FOREST_CARD};
  border: 1px solid ${JADE_SOFT};
}
.hps-tr-row { display: flex; gap: 10px; align-items: center; }
.hps-avatar { width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, ${JADE}, #1F8838); display: grid; place-items: center; font-family: var(--font-geist-sans), sans-serif; font-weight: 600; font-size: 14px; }
.hps-tr-strong { font-size: 11px; font-weight: 600; }
.hps-tr-soft { font-size: 10px; opacity: 0.6; margin-top: 2px; }
.hps-doc-card { display: flex; gap: 10px; align-items: center; }
.hps-check { width: 28px; height: 28px; border-radius: 50%; background: ${JADE}; color: ${FOREST}; display: grid; place-items: center; font-weight: 800; font-size: 14px; }
.hps-check.sm { width: 24px; height: 24px; font-size: 12px; }

.hps-wal-eyebrow { font-size: 10px; text-transform: uppercase; letter-spacing: 0.12em; opacity: 0.7; margin-top: 6px; }
.hps-wal-bal { font-family: var(--font-geist-mono), monospace; font-size: 36px; line-height: 1; letter-spacing: -0.02em; margin-top: 4px; font-weight: 600; }
.hps-wal-card { margin-top: 14px; padding: 12px 14px; border-radius: 14px; background: ${FOREST_CARD}; border: 1px solid ${JADE_SOFT}; }
.hps-tx {
  display: flex; justify-content: space-between; align-items: center;
  padding: 10px 12px; border-radius: 12px; background: ${FOREST_CARD};
  border: 1px solid ${JADE_SOFT};
  margin-top: 6px;
}
.hps-tx-pos { color: ${JADE}; font-weight: 700; font-size: 12px; }
.hps-tx-neg { color: ${CREAM}; font-weight: 700; font-size: 12px; opacity: 0.85; }

.hps-fc {
  position: absolute;
  padding: 14px;
  background: ${FOREST_CARD};
  border: 1px solid ${JADE_SOFT};
  border-radius: 16px;
  box-shadow: 0 12px 30px rgba(0,0,0,0.5);
  color: ${CREAM};
  min-width: 180px;
  max-width: 220px;
  font-family: 'Inter Tight', sans-serif;
  transition: opacity 400ms cubic-bezier(0.16,1,0.3,1), transform 600ms cubic-bezier(0.16,1,0.3,1);
  animation: hps-float-card 6000ms ease-in-out infinite;
}
.hps-fc.is-reduce { animation: none; }
@keyframes hps-float-card {
  0%, 100% { translate: 0 0; }
  50%      { translate: 0 -6px; }
}
.hps-fc-tl { top: 6%; left: -24%; }
.hps-fc-mr { top: 38%; right: -28%; }
.hps-fc-bl { bottom: 8%; left: -20%; }

@media (max-width: 1024px) {
  .hps-fc { min-width: 160px; max-width: 190px; padding: 12px; }
  .hps-fc-tl { left: -10%; top: 2%; }
  .hps-fc-mr { right: -12%; top: 40%; }
  .hps-fc-bl { left: -8%; bottom: 4%; }
}
@media (max-width: 767px) {
  .hps-phone { width: clamp(230px, 66vw, 270px); aspect-ratio: 320 / 660; }
  .hps-fc { min-width: 145px; max-width: 175px; padding: 10px 12px; font-size: 10px; border-radius: 14px; }
  .hps-fc-tl { left: 0%; top: -4%; }
  .hps-fc-mr { right: 0%; top: 40%; }
  .hps-fc-bl { left: 0%; bottom: 0%; }
  .hps-fc-big { font-size: 18px; }
  .hps-fc-title { font-size: 12px; }
}

.hps-fc-row { display: flex; gap: 10px; align-items: center; }
.hps-fc-title { font-family: var(--font-geist-sans), sans-serif; font-size: 13px; font-weight: 600; letter-spacing: -0.01em; }
.hps-fc-sub { font-size: 10px; opacity: 0.65; margin-top: 2px; }
.hps-fc-big { font-family: var(--font-geist-mono), monospace; font-size: 22px; font-weight: 600; line-height: 1; margin-top: 2px; }
.hps-bell { width: 28px; height: 28px; border-radius: 50%; background: rgba(40, 167, 69,0.18); display: grid; place-items: center; font-size: 14px; }

@media (prefers-reduced-motion: reduce) {
  .hps-phone-float, .hps-fc { animation: none !important; }
  .hps-fade { transition: opacity 200ms linear; }
}
`;

export default HeroPhoneShowcase;
