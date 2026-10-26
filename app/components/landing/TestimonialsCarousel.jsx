"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useReducedMotion } from "framer-motion";
import { Star, ChevronLeft, ChevronRight, MessageCircle, ZoomIn, X, Quote } from "lucide-react";

function useVisibleCount() {
  const [n, setN] = useState(1);
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      setN(w >= 1024 ? 3 : w >= 640 ? 2 : 1);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return n;
}

const NAV_BTN =
  "mk-focus inline-flex h-11 w-11 items-center justify-center rounded-full border border-mk-line-strong bg-mk-surface text-mk-ink shadow-mk-sm transition-[box-shadow,border-color,transform] duration-300 hover:border-mk-ink/25 hover:shadow-mk active:scale-95 cursor-pointer";

function Dots({ count, index, onSelect }) {
  // Many slides on a phone: a compact counter keeps prev/next on screen.
  const counter = (
    <span className="font-mono text-[12.5px] tabular-nums text-mk-muted" aria-live="polite">
      {String(index + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
    </span>
  );
  return (
    <>
      {count > 8 && <span className="sm:hidden">{counter}</span>}
      <div className={`min-w-0 flex-wrap items-center justify-center ${count > 8 ? "hidden sm:flex" : "flex"}`}>
      {Array.from({ length: count }).map((_, i) => (
        <button
          key={i}
          type="button"
          aria-label={`Go to slide ${i + 1}`}
          aria-current={i === index ? "true" : undefined}
          onClick={() => onSelect(i)}
          className="mk-focus group inline-flex h-11 w-6 items-center justify-center rounded-full cursor-pointer"
        >
          <span
            className={`block h-1.5 rounded-full transition-colors duration-300 ${
              i === index ? "w-5 bg-cx-brand" : "w-1.5 bg-mk-line-strong group-hover:bg-mk-muted"
            }`}
          />
        </button>
      ))}
      </div>
    </>
  );
}

export function TestimonialsCarousel({
  testimonials = [],
  loading = false,
  intervalMs = 4000,
}) {
  const reduce = useReducedMotion();
  const visible = useVisibleCount();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [mounted, setMounted] = useState(false);
  const trackRef = useRef(null);

  useEffect(() => setMounted(true), []);

  const items =
    testimonials.length === 0
      ? []
      : testimonials.length < visible
        ? Array.from({ length: visible }, (_, i) => testimonials[i % testimonials.length])
        : testimonials;
  const maxIndex = Math.max(0, items.length - visible);

  // Keep index within bounds if window resize reduces maxIndex
  useEffect(() => {
    setIndex((prev) => Math.min(prev, maxIndex));
  }, [maxIndex]);

  // Auto-advance (off under reduced motion), resetting whenever index, paused, or modal state changes
  useEffect(() => {
    if (reduce || paused || selectedImage || items.length <= visible) return;
    const t = setInterval(() => {
      setIndex((i) => (i >= maxIndex ? 0 : i + 1));
    }, intervalMs);
    return () => clearInterval(t);
  }, [reduce, paused, selectedImage, items.length, visible, intervalMs, maxIndex, index]);

  // Close lightbox on Escape key
  useEffect(() => {
    if (!selectedImage) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setSelectedImage(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedImage]);

  const handlePrev = () => {
    setIndex((i) => (i <= 0 ? maxIndex : i - 1));
  };

  const handleNext = () => {
    setIndex((i) => (i >= maxIndex ? 0 : i + 1));
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].slice(0, visible).map((i) => (
          <div key={i} className="h-52 animate-pulse rounded-mk-lg border border-mk-line bg-mk-bg" />
        ))}
      </div>
    );
  }

  if (testimonials.length === 0) return null;

  const lightbox =
    selectedImage && (
      <div
        role="dialog"
        aria-modal="true"
        aria-label={selectedImage.title || "WhatsApp Customer Review"}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-mk-dark/70 p-4 backdrop-blur-sm"
        onClick={() => setSelectedImage(null)}
      >
        <div
          className="relative flex max-h-[92vh] max-w-xl flex-col overflow-hidden rounded-mk-lg border border-mk-line bg-mk-surface shadow-mk-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between gap-3 border-b border-mk-line bg-mk-bg px-4 py-2">
            <div className="flex min-w-0 items-center gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#25D366]/15 text-[#25D366]">
                <MessageCircle className="h-3.5 w-3.5 fill-[#25D366]" />
              </span>
              <span className="truncate text-sm font-semibold text-mk-ink">{selectedImage.title || "WhatsApp Customer Review"}</span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedImage(null)}
              className="mk-focus inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-mk-muted transition-colors hover:bg-mk-ink/[0.05] hover:text-mk-ink cursor-pointer"
              aria-label="Close review modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex items-center justify-center overflow-auto bg-mk-bg/60 p-4 sm:p-6">
            <img
              src={selectedImage.image}
              alt={selectedImage.alt || "WhatsApp customer testimony"}
              className="max-h-[75vh] w-auto max-w-full rounded-xl object-contain shadow-mk"
            />
          </div>
        </div>
      </div>
    );

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
    >
      {/* Slider area */}
      <div className="relative">
        <div className="-mx-2 overflow-hidden py-3">
          <div
            ref={trackRef}
            className="flex"
            style={{
              transform: `translateX(-${(index * 100) / visible}%)`,
              transition: reduce ? "none" : "transform 700ms cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          >
            {items.map((t, i) => (
              <div key={`${t.id || i}-${i}`} className="shrink-0 px-2" style={{ width: `${100 / visible}%` }}>
                {t.image ? (
                  <article
                    onClick={() => setSelectedImage(t)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedImage(t);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label={`Enlarge: ${t.title || "WhatsApp review"}`}
                    className="mk-focus mk-lift group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-mk-lg border border-mk-line bg-mk-surface shadow-mk-sm"
                  >
                    {/* Header with WhatsApp badge */}
                    <div className="flex items-center justify-between gap-2 border-b border-mk-line px-4 py-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#25D366]/15 text-[#25D366]">
                          <MessageCircle className="h-3.5 w-3.5 fill-[#25D366]" />
                        </span>
                        <span className="truncate text-[13px] font-semibold text-mk-ink">{t.title || "WhatsApp Review"}</span>
                      </div>
                    </div>

                    {/* Image showcase */}
                    <div className="relative flex h-[380px] sm:h-[410px] w-full items-center justify-center overflow-hidden bg-mk-bg p-3 sm:p-4">
                      <img
                        src={t.image}
                        alt={t.alt || "WhatsApp customer review"}
                        className="h-full w-auto max-w-full rounded-xl object-contain shadow-mk-sm transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.02]"
                        loading="lazy"
                      />
                      {/* Hover overlay hint */}
                      <div className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-mk-dark/40 via-transparent to-transparent pb-5 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-[12px] font-semibold text-mk-ink shadow-mk">
                          <ZoomIn className="h-3.5 w-3.5 text-mk-muted" /> Click to enlarge
                        </span>
                      </div>
                    </div>
                  </article>
                ) : (
                  <article className="relative flex h-full flex-col rounded-mk-lg border border-mk-line bg-mk-surface p-6 shadow-mk-sm sm:p-7">
                    <Quote aria-hidden className="h-7 w-7 fill-cx-brand/15 text-cx-brand" strokeWidth={1.5} />
                    <blockquote className="mt-4 text-[15.5px] leading-relaxed text-mk-ink-2">
                      &ldquo;{t.testimonial_text}&rdquo;
                    </blockquote>
                    <div className="mt-auto pt-6">
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, n) => (
                          <Star
                            key={n}
                            className={`h-3.5 w-3.5 ${n < (t.rating || 5) ? "fill-mk-gold text-mk-gold" : "text-mk-line-strong"}`}
                          />
                        ))}
                      </div>
                      <div className="mt-3 border-t border-mk-line pt-4 min-w-0">
                        <p className="truncate text-[15px] font-semibold text-mk-ink">{t.customer_name}</p>
                        <p className="truncate text-[13px] text-mk-muted">{t.customer_location}</p>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {t.service_completed && (
                          <span className="inline-block rounded-full border border-cx-brand/20 bg-cx-brand-soft px-2.5 py-1 text-[12px] font-medium text-cx-brand-deep">
                            {t.service_completed}
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Controls */}
      {maxIndex > 0 && (
        <div className="mt-6 flex items-center justify-center gap-2 sm:justify-between">
          <button type="button" onClick={handlePrev} aria-label="Previous testimonial" className={NAV_BTN}>
            <ChevronLeft className="h-5 w-5" />
          </button>
          <Dots count={maxIndex + 1} index={index} onSelect={setIndex} />
          <button type="button" onClick={handleNext} aria-label="Next testimonial" className={NAV_BTN}>
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Lightbox / Zoom Modal — portalled so transformed ancestors can't trap position:fixed */}
      {lightbox && (mounted ? createPortal(lightbox, document.body) : lightbox)}
    </div>
  );
}
