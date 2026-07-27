"use client";

import { useEffect, useRef, useState } from "react";

const JADE = "#28A745";
const FOREST = "#111111";
const FOREST_CARD = "#0f2415";
const CREAM = "#f0ede6";
const JADE_SOFT = "rgba(40, 167, 69,0.25)";

function StatusBar() {
  return (
    <div className="sps-status">
      <span>9:41</span>
      <span className="sps-status-r">
        <span className="sps-sig" /> <span>5G</span> <span className="sps-bat" />
      </span>
    </div>
  );
}

function ScreenStatusRing({ s, active, reduce }) {
  const target = s.ringValue;
  const [val, setVal] = useState(reduce ? target : 0);
  useEffect(() => {
    if (reduce) { setVal(target); return; }
    if (!active) { setVal(0); return; }
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
  }, [active, target, reduce]);

  const r = 38;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - val / 100);

  return (
    <div className="sps-screen">
      <StatusBar />
      <div className="sps-header">
        <div className="sps-eyebrow">{s.eyebrow}</div>
        <div className="sps-h1">{s.title}</div>
        <div className="sps-sub">{s.sub}</div>
        <div className="sps-ring-wrap">
          <svg viewBox="0 0 100 100" className="sps-ring">
            <circle cx="50" cy="50" r={r} stroke="rgba(245, 245, 245,0.15)" strokeWidth="7" fill="none" />
            <circle
              cx="50" cy="50" r={r}
              stroke={CREAM} strokeWidth="7" fill="none" strokeLinecap="round"
              strokeDasharray={c} strokeDashoffset={offset}
              transform="rotate(-90 50 50)"
            />
          </svg>
          <div className="sps-ring-val">
            <div className="sps-ring-num">{val}</div>
            <div className="sps-ring-lbl">{s.ringLabel}</div>
          </div>
        </div>
      </div>
      <div className="sps-section-h">Services</div>
      <div className="sps-grid">
        {s.tiles.map((t) => (
          <div key={t} className="sps-tile">
            <div className="sps-tile-dot" />
            <div className="sps-tile-lbl">{t}</div>
          </div>
        ))}
      </div>
      <div className="sps-spacer" />
      <div className="sps-nav">
        {["Home", "Bookings", "Services", "Wallet", "More"].map((n, i) => (
          <div key={n} className={`sps-nav-i ${i === 0 ? "is-active" : ""}`}>
            <div className="sps-nav-icn" />
            <div className="sps-nav-lbl">{n}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScreenTracker({ s, active, reduce }) {
  const [w, setW] = useState(reduce ? s.progressPct : 0);
  useEffect(() => {
    if (reduce) { setW(s.progressPct); return; }
    if (!active) { setW(0); return; }
    const id = requestAnimationFrame(() => setW(s.progressPct));
    return () => cancelAnimationFrame(id);
  }, [active, s.progressPct, reduce]);

  return (
    <div className="sps-screen">
      <StatusBar />
      <div className="sps-back">‹ Back</div>
      <div className="sps-tr-title">{s.title}</div>
      <div className="sps-tr-meta">{s.meta}</div>
      <div className="sps-prog-track">
        <div className="sps-prog-fill" style={{ width: `${w}%`, transition: "width 1000ms cubic-bezier(0.65,0,0.35,1)" }} />
      </div>
      <div className="sps-prog-labels">
        {s.stages.map((st, i) => (
          <span key={st} className={i <= s.currentStage ? "is-done" : ""}>{st}</span>
        ))}
      </div>
      {s.agent && (
        <div className="sps-tr-card">
          <div className="sps-tr-row">
            <div className="sps-avatar">{s.agent.initial}</div>
            <div>
              <div className="sps-tr-strong">{s.agent.line1}</div>
              <div className="sps-tr-soft">{s.agent.line2}</div>
            </div>
          </div>
        </div>
      )}
      {s.doc && (
        <div className="sps-doc-card">
          <div className="sps-check">✓</div>
          <div>
            <div className="sps-tr-strong">{s.doc.line1}</div>
            <div className="sps-tr-soft">{s.doc.line2}</div>
          </div>
        </div>
      )}
    </div>
  );
}

function ScreenCertificate({ s }) {
  return (
    <div className="sps-screen">
      <StatusBar />
      <div className="sps-back">‹ Back</div>
      <div className="sps-wal-eyebrow">{s.eyebrow}</div>
      <div className="sps-tr-title" style={{ marginTop: 4 }}>{s.title}</div>

      <div className="sps-cert">
        <div className="sps-cert-ribbon">VERIFIED</div>
        <div className="sps-cert-seal">✓</div>
        <div className="sps-cert-title">{s.docTitle}</div>
        <div className="sps-cert-meta">{s.docMeta}</div>
        <div className="sps-cert-foot">{s.footer}</div>
      </div>

      {s.bigStat && (
        <div className="sps-bigstat">
          <div className="sps-bigstat-val">{s.bigStat.value}</div>
          <div className="sps-bigstat-lbl">{s.bigStat.label}</div>
        </div>
      )}
    </div>
  );
}

function ScreenList({ s, active, reduce }) {
  const targetNum = s.total ? Number(s.total.value.replace(/[^\d]/g, "")) || 0 : 0;
  const [n, setN] = useState(reduce ? targetNum : 0);
  useEffect(() => {
    if (reduce) { setN(targetNum); return; }
    if (!active || !s.total) { setN(0); return; }
    const start = performance.now();
    const dur = 1000;
    let raf = 0;
    const step = (t) => {
      const p = Math.min(1, (t - start) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      setN(Math.round(targetNum * e));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [active, targetNum, s.total, reduce]);

  const totalPrefix = s.total?.value.startsWith("₦") ? "₦" : "";

  return (
    <div className="sps-screen">
      <StatusBar />
      <div className="sps-wal-eyebrow">{s.eyebrow}</div>
      {s.total ? (
        <div className="sps-wal-bal">{totalPrefix}{n.toLocaleString()}</div>
      ) : (
        <div className="sps-tr-title" style={{ marginTop: 4 }}>{s.title}</div>
      )}
      {s.total && <div className="sps-tr-soft" style={{ marginTop: 4 }}>{s.total.label}</div>}
      <div className="sps-section-h">{s.total ? s.title : "Recent"}</div>
      {s.rows.map((r, i) => (
        <div key={i} className="sps-tx">
          <div>
            <div className="sps-tr-strong">{r.title}</div>
            <div className="sps-tr-soft">{r.sub}</div>
          </div>
          {r.right && (
            <div className={r.positive ? "sps-tx-pos" : "sps-tx-neg"}>{r.right}</div>
          )}
        </div>
      ))}
    </div>
  );
}

function ScreenSwitch({ s, active, reduce }) {
  switch (s.kind) {
    case "status_ring": return <ScreenStatusRing s={s} active={active} reduce={reduce} />;
    case "tracker": return <ScreenTracker s={s} active={active} reduce={reduce} />;
    case "certificate": return <ScreenCertificate s={s} />;
    case "list": return <ScreenList s={s} active={active} reduce={reduce} />;
    default: return null;
  }
}

function MiniRing({ value, size = 36 }) {
  const r = (size - 4) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size}>
      <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(245, 245, 245,0.18)" strokeWidth="3" fill="none" />
      <circle cx={size / 2} cy={size / 2} r={r} stroke={JADE} strokeWidth="3" fill="none" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)}
        transform={`rotate(-90 ${size / 2} ${size / 2})`} />
    </svg>
  );
}

function CardContents({ c }) {
  if (c.kind === "check") {
    return (
      <div className="sps-fc-row">
        <div className="sps-check sm">✓</div>
        <div>
          <div className="sps-fc-title">{c.title}</div>
          <div className="sps-fc-sub">{c.sub}</div>
        </div>
      </div>
    );
  }
  if (c.kind === "ring") {
    return (
      <div className="sps-fc-row">
        <MiniRing value={c.value} />
        <div>
          <div className="sps-fc-sub">{c.label}</div>
          <div className="sps-fc-big">{c.big}</div>
        </div>
      </div>
    );
  }
  if (c.kind === "naira") {
    return (
      <div className="sps-fc-row">
        <div className="sps-bell">₦</div>
        <div>
          <div className="sps-fc-title">{c.title}</div>
          <div className="sps-fc-sub">{c.sub}</div>
        </div>
      </div>
    );
  }
  return (
    <div className="sps-fc-row">
      <div className="sps-bell">🔔</div>
      <div>
        <div className="sps-fc-title">{c.title}</div>
        <div className="sps-fc-sub">{c.sub}</div>
      </div>
    </div>
  );
}

export function ServicePhoneShowcase({ config }) {
  const sectionRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [activeScreen, setActiveScreen] = useState(0);
  const [reduce, setReduce] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mr = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mm = window.matchMedia("(max-width: 767px)");
    const sync = () => { setReduce(mr.matches); setIsMobile(mm.matches); };
    sync();
    mr.addEventListener("change", sync);
    mm.addEventListener("change", sync);
    return () => { mr.removeEventListener("change", sync); mm.removeEventListener("change", sync); };
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
      setProgress(Math.max(0, Math.min(1, passed / total)));
    };
    const onScroll = () => { if (queued) return; queued = true; raf = requestAnimationFrame(tick); };
    tick();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); };
  }, []);

  useEffect(() => {
    if (reduce || !config?.screens?.length) { setActiveScreen(0); return; }
    const id = setInterval(() => setActiveScreen((s) => (s + 1) % config.screens.length), 3600);
    return () => clearInterval(id);
  }, [reduce, config]);

  if (!config || !config.screens) return null;

  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const enterT = clamp(progress / 0.2);
  const tiltT = clamp((progress - 0.2) / 0.3);
  const stage3T = clamp((progress - 0.5) / 0.3);
  const exitT = clamp((progress - 0.8) / 0.2);

  const noTilt = reduce || isMobile;
  const enterScale = reduce ? 1 : 0.92 + 0.08 * enterT;
  const enterOpacity = reduce ? 1 : enterT;
  const tiltY = noTilt ? 0 : -8 * (1 - tiltT);
  const tiltX = noTilt ? 0 : 2 * (1 - tiltT);
  const focalScale = reduce ? 1 : 1 + 0.08 * stage3T;
  const exitOpacity = reduce ? 1 : 1 - 0.7 * exitT;
  const exitScale = focalScale - (reduce ? 0 : 0.08 * exitT);
  const parallaxY = reduce ? 0 : -progress * 30;

  const animating = !reduce && progress > 0.001 && progress < 0.999;
  const finalOpacity = reduce ? 1 : enterOpacity * exitOpacity;
  const finalScale = reduce ? 1 : enterScale * (exitT > 0 ? exitScale : focalScale);

  return (
    <div ref={sectionRef} className={`sps-root ${reduce ? "is-static" : ""}`}>
      <div className="sps-bg" aria-hidden />
      <div className="sps-bg-grain" aria-hidden />

      <div className="sps-stage" style={{ transform: `translateY(${parallaxY}px)` }}>
        <div
          className="sps-phone-wrap"
          style={{
            opacity: finalOpacity,
            transform: `scale(${finalScale}) rotateY(${tiltY}deg) rotateX(${tiltX}deg)`,
            willChange: animating ? "transform, opacity" : "auto",
            transformStyle: reduce ? "flat" : "preserve-3d",
          }}
        >
          <div className={`sps-phone-float ${reduce ? "is-reduce" : ""}`}>
            <div className="sps-phone">
              <span className="sps-btn sps-btn-mute" />
              <span className="sps-btn sps-btn-vu" />
              <span className="sps-btn sps-btn-vd" />
              <span className="sps-btn sps-btn-pw" />
              <div className="sps-screen-wrap">
                <div className="sps-island" />
                {config.screens.map((s, i) => (
                  <div key={i} className={`sps-fade ${activeScreen === i ? "is-on" : ""}`}>
                    <ScreenSwitch s={s} active={activeScreen === i} reduce={reduce} />
                  </div>
                ))}
                <div className="sps-reflect" />
              </div>
            </div>
          </div>

          {(["tl", "mr", "bl"]).map((pos, i) => (
            config.cards && config.cards[i] ? (
              <FloatingCard key={pos} position={pos} t={stage3T} delayIndex={i} reduce={reduce} isMobile={isMobile} floatDur={5200 + i * 600}>
                <CardContents c={config.cards[i]} />
              </FloatingCard>
            ) : null
          ))}
        </div>
      </div>

      <style>{styles}</style>
    </div>
  );
}

function FloatingCard({
  position, t, delayIndex, reduce, isMobile, floatDur, children,
}) {
  const cardT = reduce ? 1 : Math.max(0, Math.min(1, (t - delayIndex * 0.12) / 0.5));
  const fromX = position === "mr" ? 60 : -60;
  const tx = (1 - cardT) * fromX;
  const op = reduce ? 1 : cardT;
  return (
    <div
      className={`sps-fc sps-fc-${position} ${reduce ? "is-reduce" : ""}`}
      style={{
        opacity: op,
        transform: `translateX(${tx}px)`,
        animationDuration: `${floatDur}ms`,
        animationDelay: `${delayIndex * 400}ms`,
        willChange: cardT > 0 && cardT < 1 ? "transform, opacity" : "auto",
      }}
    >
      {children}
    </div>
  );
}

const styles = `
.sps-root {
  position: relative;
  width: 100%;
  min-height: clamp(560px, 70vh, 760px);
  overflow: hidden;
  border-radius: 28px;
  isolation: isolate;
  perspective: 1400px;
  font-family: 'Inter Tight', system-ui, sans-serif;
}
.sps-bg {
  position: absolute; inset: 0; z-index: 0;
  background:
    radial-gradient(60% 50% at 18% 12%, rgba(40, 167, 69,0.22), transparent 60%),
    radial-gradient(50% 40% at 88% 86%, rgba(40, 167, 69,0.18), transparent 60%),
    linear-gradient(180deg, #07140c 0%, ${FOREST} 60%, #06120a 100%);
}
.sps-bg-grain {
  position: absolute; inset: 0; z-index: 0; opacity: 0.06; mix-blend-mode: overlay; pointer-events: none;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");
}
.sps-stage {
  position: relative; z-index: 1;
  display: flex; align-items: center; justify-content: center;
  min-height: clamp(560px, 70vh, 760px);
  padding: clamp(24px, 6vw, 60px);
}
.sps-phone-wrap { position: relative; transform-style: preserve-3d; transition: opacity 200ms linear; }

@keyframes sps-float-phone { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
.sps-phone-float { animation: sps-float-phone 6000ms cubic-bezier(0.45,0,0.55,1) infinite; }
.sps-phone-float.is-reduce { animation: none; }

.sps-phone {
  position: relative;
  width: clamp(220px, 26vw, 300px);
  aspect-ratio: 320 / 660;
  border-radius: 48px;
  background: linear-gradient(145deg, #1a1a1c 0%, #2a2a2d 28%, #0e0e10 55%, #26262a 78%, #101012 100%);
  padding: 12px;
  box-shadow:
    inset 0 0 0 1px rgba(255,255,255,0.08),
    inset 0 1px 0 rgba(255,255,255,0.18),
    inset 0 -1px 0 rgba(0,0,0,0.5),
    0 18px 30px rgba(17, 17, 17,.28),
    0 40px 80px rgba(17, 17, 17,.22);
}
.sps-btn { position: absolute; background: #0a0a0b; border-radius: 2px; }
.sps-btn-mute { left: -2px; top: 14%; width: 3px; height: 3.2%; }
.sps-btn-vu   { left: -2px; top: 22%; width: 3px; height: 7%; }
.sps-btn-vd   { left: -2px; top: 31%; width: 3px; height: 7%; }
.sps-btn-pw   { right: -2px; top: 24%; width: 3px; height: 10%; }

.sps-screen-wrap {
  position: relative; height: 100%; width: 100%;
  border-radius: 38px; overflow: hidden;
  background: ${FOREST};
  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.06), inset 0 0 24px rgba(0,0,0,0.55);
}
.sps-island {
  position: absolute; left: 50%; top: 8px; z-index: 30;
  width: 31%; height: 22px; transform: translateX(-50%);
  background: #050505; border-radius: 20px;
}
.sps-reflect {
  position: absolute; inset: 0; z-index: 25; pointer-events: none;
  background: linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%);
  mix-blend-mode: screen;
}
.sps-fade { position: absolute; inset: 0; opacity: 0; transition: opacity 400ms ease; z-index: 1; }
.sps-fade.is-on { opacity: 1; z-index: 2; }

.sps-screen { position: relative; width: 100%; height: 100%; padding: 40px 14px 0; color: ${CREAM}; display: flex; flex-direction: column; font-size: 11px; }
.sps-status { position: absolute; top: 12px; left: 18px; right: 18px; display: flex; justify-content: space-between; align-items: center; font-size: 11px; font-weight: 600; color: ${CREAM}; z-index: 20; }
.sps-status-r { display: inline-flex; align-items: center; gap: 4px; font-size: 10px; }
.sps-sig { display:inline-block; width: 14px; height: 8px; background: ${CREAM}; -webkit-mask-image: linear-gradient(to top, #000 50%, #0006); }
.sps-bat { display:inline-block; width: 18px; height: 9px; border:1px solid ${CREAM}; border-radius: 2px; position: relative; }
.sps-bat::after { content:''; position:absolute; left:1px; top:1px; bottom:1px; width: 70%; background:${CREAM}; border-radius:1px; }
.sps-section-h { font-family: var(--font-geist-sans), sans-serif; font-size: 13px; font-weight: 600; color: ${CREAM}; margin: 14px 4px 8px; letter-spacing: -0.01em; }

.sps-header { position: relative; margin-top: 6px; padding: 14px 14px 16px; border-radius: 18px; background: linear-gradient(135deg, ${JADE} 0%, #0a7050 100%); color: ${CREAM}; overflow: hidden; }
.sps-eyebrow { font-size: 10px; opacity: 0.8; text-transform: uppercase; letter-spacing: 0.12em; }
.sps-h1 { font-family: var(--font-geist-sans), sans-serif; font-size: 20px; line-height: 1.1; margin-top: 2px; font-weight: 600; letter-spacing: -0.02em; }
.sps-sub { font-size: 11px; opacity: 0.85; margin-top: 4px; max-width: 70%; }
.sps-ring-wrap { position: absolute; right: 10px; top: 10px; width: 64px; height: 64px; }
.sps-ring { width: 100%; height: 100%; display: block; }
.sps-ring-val { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.sps-ring-num { font-family: var(--font-geist-mono), monospace; font-size: 18px; font-weight: 600; line-height: 1; }
.sps-ring-lbl { font-size: 7px; text-transform: uppercase; letter-spacing: 0.1em; margin-top: 2px; }

.sps-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 7px; }
.sps-tile { background: ${FOREST_CARD}; border: 1px solid ${JADE_SOFT}; border-radius: 12px; padding: 10px 8px; display: flex; flex-direction: column; gap: 6px; min-height: 64px; }
.sps-tile-dot { width: 18px; height: 18px; border-radius: 6px; background: linear-gradient(135deg, ${JADE}, #0a7050); }
.sps-tile-lbl { font-family: var(--font-geist-sans), sans-serif; font-size: 10px; line-height: 1.15; font-weight: 600; }

.sps-spacer { flex: 1; }
.sps-nav { position: absolute; left: 0; right: 0; bottom: 0; display: grid; grid-template-columns: repeat(5, 1fr); padding: 8px 6px 14px; background: rgba(10, 10, 10,0.92); border-top: 1px solid rgba(245, 245, 245,0.08); }
.sps-nav-i { display:flex; flex-direction:column; align-items:center; gap:3px; opacity: 0.55; }
.sps-nav-i.is-active { opacity: 1; }
.sps-nav-icn { width: 16px; height: 16px; border-radius: 4px; background: ${CREAM}; }
.sps-nav-i.is-active .sps-nav-icn { background: ${JADE}; }
.sps-nav-lbl { font-size: 8px; letter-spacing: 0.04em; }

.sps-back { font-size: 11px; opacity: 0.7; margin-top: 4px; }
.sps-tr-title { font-family: var(--font-geist-sans), sans-serif; font-size: 17px; line-height: 1.15; margin-top: 6px; letter-spacing: -0.01em; font-weight: 600; }
.sps-tr-meta { font-size: 10px; opacity: 0.65; margin-top: 4px; }
.sps-prog-track { margin-top: 14px; height: 6px; border-radius: 999px; background: rgba(245, 245, 245,0.1); overflow: hidden; }
.sps-prog-fill { height: 100%; background: linear-gradient(90deg, ${JADE}, #38d39f); border-radius: 999px; }
.sps-prog-labels { display: flex; justify-content: space-between; margin-top: 6px; font-size: 8px; }
.sps-prog-labels span { opacity: 0.5; letter-spacing: 0.04em; }
.sps-prog-labels span.is-done { opacity: 1; color: ${JADE}; font-weight: 600; }
.sps-tr-card, .sps-doc-card { margin-top: 12px; padding: 12px; border-radius: 14px; background: ${FOREST_CARD}; border: 1px solid ${JADE_SOFT}; }
.sps-tr-row { display: flex; gap: 10px; align-items: center; }
.sps-avatar { width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, ${JADE}, #1F8838); display: grid; place-items: center; font-family: var(--font-geist-sans), sans-serif; font-weight: 600; font-size: 14px; }
.sps-tr-strong { font-size: 11px; font-weight: 600; }
.sps-tr-soft { font-size: 10px; opacity: 0.6; margin-top: 2px; }
.sps-doc-card { display: flex; gap: 10px; align-items: center; }
.sps-check { width: 28px; height: 28px; border-radius: 50%; background: ${JADE}; color: ${FOREST}; display: grid; place-items: center; font-weight: 800; font-size: 14px; }
.sps-check.sm { width: 24px; height: 24px; font-size: 12px; }

.sps-cert {
  position: relative;
  margin-top: 14px; padding: 22px 14px 16px;
  border-radius: 18px;
  background: linear-gradient(160deg, #0a7050 0%, ${JADE} 100%);
  text-align: center;
  overflow: hidden;
}
.sps-cert::before {
  content: ''; position: absolute; inset: 0;
  background: radial-gradient(60% 80% at 50% 0%, rgba(255,255,255,0.18), transparent 60%);
}
.sps-cert-ribbon { display:inline-block; font-size: 8px; letter-spacing: 0.18em; padding: 2px 8px; border-radius: 999px; background: rgba(255,255,255,0.18); color: ${CREAM}; font-weight: 700; }
.sps-cert-seal { margin: 10px auto 6px; width: 44px; height: 44px; border-radius: 50%; background: ${CREAM}; color: ${JADE}; display: grid; place-items: center; font-size: 22px; font-weight: 800; box-shadow: 0 4px 12px rgba(0,0,0,0.25); }
.sps-cert-title { font-family: var(--font-geist-sans), sans-serif; font-size: 15px; font-weight: 600; letter-spacing: -0.01em; }
.sps-cert-meta { font-size: 10px; opacity: 0.85; margin-top: 4px; }
.sps-cert-foot { margin-top: 10px; font-size: 9px; opacity: 0.75; letter-spacing: 0.06em; text-transform: uppercase; }
.sps-bigstat { margin-top: 14px; padding: 12px 14px; border-radius: 14px; background: ${FOREST_CARD}; border: 1px solid ${JADE_SOFT}; text-align: center; }
.sps-bigstat-val { font-family: var(--font-geist-mono), monospace; font-size: 22px; font-weight: 600; letter-spacing: -0.02em; }
.sps-bigstat-lbl { font-size: 9px; opacity: 0.65; margin-top: 2px; text-transform: uppercase; letter-spacing: 0.1em; }

.sps-wal-eyebrow { font-size: 10px; text-transform: uppercase; letter-spacing: 0.12em; opacity: 0.7; margin-top: 6px; }
.sps-wal-bal { font-family: var(--font-geist-mono), monospace; font-size: 32px; line-height: 1; letter-spacing: -0.02em; margin-top: 4px; font-weight: 600; }
.sps-tx { display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; border-radius: 12px; background: ${FOREST_CARD}; border: 1px solid ${JADE_SOFT}; margin-top: 6px; }
.sps-tx-pos { color: ${JADE}; font-weight: 700; font-size: 12px; }
.sps-tx-neg { color: ${CREAM}; font-weight: 700; font-size: 12px; opacity: 0.85; }

.sps-fc {
  position: absolute; padding: 14px;
  background: ${FOREST_CARD}; border: 1px solid ${JADE_SOFT};
  border-radius: 16px; box-shadow: 0 8px 24px rgba(0,0,0,0.4);
  color: ${CREAM}; min-width: 170px; max-width: 210px;
  font-family: 'Inter Tight', sans-serif;
  transition: opacity 200ms linear;
  animation: sps-float-card 6000ms ease-in-out infinite;
}
.sps-fc.is-reduce { animation: none; }
@keyframes sps-float-card { 0%,100% { translate: 0 0; } 50% { translate: 0 -6px; } }
.sps-fc-tl { top: 4%; left: -22%; }
.sps-fc-mr { top: 38%; right: -28%; }
.sps-fc-bl { bottom: 6%; left: -18%; }

@media (max-width: 900px) {
  .sps-fc { min-width: 140px; max-width: 170px; padding: 11px; }
  .sps-fc-tl { left: -6%; top: -2%; }
  .sps-fc-mr { right: -8%; top: 40%; }
  .sps-fc-bl { left: -4%; bottom: 2%; }
}
@media (max-width: 600px) {
  .sps-fc-tl, .sps-fc-bl { left: 4%; }
  .sps-fc-mr { right: 4%; }
  .sps-fc { min-width: 120px; max-width: 144px; font-size: 10px; padding: 9px; }
  .sps-phone-float { animation: none; }
}
.sps-fc-row { display: flex; gap: 10px; align-items: center; }
.sps-fc-title { font-family: var(--font-geist-sans), sans-serif; font-size: 12px; font-weight: 600; letter-spacing: -0.01em; }
.sps-fc-sub { font-size: 10px; opacity: 0.65; margin-top: 2px; }
.sps-fc-big { font-family: var(--font-geist-mono), monospace; font-size: 20px; font-weight: 600; line-height: 1; margin-top: 2px; }
.sps-bell { width: 28px; height: 28px; border-radius: 50%; background: rgba(40, 167, 69,0.18); display: grid; place-items: center; font-size: 14px; font-weight: 700; color: ${JADE}; }

.sps-root.is-static .sps-phone-float,
.sps-root.is-static .sps-fc { animation: none !important; }
.sps-root.is-static .sps-phone-wrap { transition: none !important; }
.sps-root.is-static .sps-prog-fill { transition: none !important; }

@media (prefers-reduced-motion: reduce) {
  .sps-phone-float, .sps-fc { animation: none !important; }
  .sps-fade { transition: none !important; }
  .sps-phone-wrap { transition: none !important; }
  .sps-prog-fill { transition: none !important; }
}
`;

export default ServicePhoneShowcase;
