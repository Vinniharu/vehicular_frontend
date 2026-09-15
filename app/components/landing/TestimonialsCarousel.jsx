"use client";

import { useEffect, useRef, useState } from "react";
import { Star, ShieldCheck, ChevronLeft, ChevronRight, MessageCircle, ZoomIn, X } from "lucide-react";
import { INK, GREEN, GOLD } from "./theme";

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

export function TestimonialsCarousel({
  testimonials = [],
  loading = false,
  intervalMs = 4000,
}) {
  const visible = useVisibleCount();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const trackRef = useRef(null);

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

  // Auto-advance interval, resetting whenever index, paused, or modal state changes
  useEffect(() => {
    if (paused || selectedImage || items.length <= visible) return;
    const t = setInterval(() => {
      setIndex((i) => (i >= maxIndex ? 0 : i + 1));
    }, intervalMs);
    return () => clearInterval(t);
  }, [paused, selectedImage, items.length, visible, intervalMs, maxIndex, index]);

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
          <div
            key={i}
            className="h-52 animate-pulse rounded-2xl bg-white/5 border border-white/10"
          />
        ))}
      </div>
    );
  }

  if (testimonials.length === 0) return null;

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
        <div className="overflow-hidden py-1">
          <div
            ref={trackRef}
            className="flex transition-transform duration-500 ease-out"
            style={{
              transform: `translateX(-${(index * 100) / visible}%)`,
            }}
          >
            {items.map((t, i) => (
              <div
                key={`${t.id || i}-${i}`}
                className="shrink-0 px-2"
                style={{ width: `${100 / visible}%` }}
              >
                {t.image ? (
                  <article
                    onClick={() => setSelectedImage(t)}
                    className="group relative flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-xs transition-all duration-300 hover:shadow-md hover:border-slate-300 cursor-pointer"
                    style={{ border: `1px solid ${INK}1a` }}
                  >
                    {/* Header with WhatsApp badge */}
                    <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 py-2.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#25D366]/15 text-[#25D366]">
                          <MessageCircle className="h-3.5 w-3.5 fill-[#25D366]" />
                        </span>
                        <span className="truncate text-[13px] font-semibold text-slate-800">
                          {t.title || "WhatsApp Review"}
                        </span>
                      </div>
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 border border-emerald-200/60">
                        <ShieldCheck className="h-3 w-3 text-emerald-600" />
                        Verified
                      </span>
                    </div>

                    {/* Image showcase */}
                    <div className="relative flex h-[380px] sm:h-[410px] w-full items-center justify-center overflow-hidden bg-slate-900/[0.02] p-3 sm:p-4">
                      <img
                        src={t.image}
                        alt={t.alt || "WhatsApp customer review"}
                        className="h-full w-auto max-w-full rounded-xl object-contain shadow-xs transition-transform duration-300 group-hover:scale-[1.02]"
                        loading="lazy"
                      />
                      {/* Hover overlay hint */}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/25 opacity-0 transition-opacity duration-200 group-hover:opacity-100 rounded-b-2xl">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-[12px] font-semibold text-slate-800 shadow-md backdrop-blur-xs">
                          <ZoomIn className="h-3.5 w-3.5 text-slate-600" /> Click to enlarge
                        </span>
                      </div>
                    </div>
                  </article>
                ) : (
                  <article
                    className="flex h-full flex-col rounded-2xl bg-white p-5 sm:p-6 shadow-sm"
                    style={{ border: `1px solid ${INK}1a` }}
                  >
                    <div className="min-w-0">
                      <p className="text-[15px] font-semibold truncate" style={{ color: INK }}>
                        {t.customer_name}
                      </p>
                      <p className="text-[13px] truncate" style={{ color: `${INK}99` }}>{t.customer_location}</p>
                      <div className="mt-0.5 flex">
                        {Array.from({ length: 5 }).map((_, n) => (
                          <Star
                            key={n}
                            className={`h-3.5 w-3.5 ${
                              n < (t.rating || 5) ? "fill-amber-400 text-amber-400" : "text-gray-200"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <blockquote className="mt-4 text-[15px] italic leading-relaxed" style={{ color: `${INK}cc` }}>
                      &ldquo;{t.testimonial_text}&rdquo;
                    </blockquote>
                    <div className="mt-auto pt-4 space-y-2">
                      {t.service_completed && (
                        <span className="inline-block rounded-full px-2.5 py-1 text-[12px] font-medium" style={{ background: `${GREEN}1a`, color: GREEN }}>
                          {t.service_completed}
                        </span>
                      )}
                      {t.verified !== false && (
                        <p className="flex items-center gap-1 text-[12px] font-medium" style={{ color: GOLD }}>
                          <ShieldCheck className="h-3.5 w-3.5" />
                          Verified customer
                        </p>
                      )}
                    </div>
                  </article>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Desktop / Tablet Left and Right Buttons */}
        {maxIndex > 0 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous testimonial"
              className="hidden sm:flex absolute -left-4 md:-left-5 lg:-left-6 top-1/2 -translate-y-1/2 z-10 h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-white shadow-md transition-all hover:bg-neutral-50 hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#28A745] cursor-pointer"
              style={{
                border: `1px solid ${INK}1a`,
                color: INK,
              }}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next testimonial"
              className="hidden sm:flex absolute -right-4 md:-right-5 lg:-right-6 top-1/2 -translate-y-1/2 z-10 h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-white shadow-md transition-all hover:bg-neutral-50 hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#28A745] cursor-pointer"
              style={{
                border: `1px solid ${INK}1a`,
                color: INK,
              }}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {/* Controls */}
      {maxIndex > 0 && (
        <>
          {/* Mobile navigation: Left Button, Dots, Right Button */}
          <div className="mt-6 flex sm:hidden items-center justify-center gap-3">
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous testimonial"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm transition-all hover:bg-neutral-50 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#28A745] cursor-pointer"
              style={{
                border: `1px solid ${INK}1a`,
                color: INK,
              }}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-1.5 px-1">
              {Array.from({ length: maxIndex + 1 }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Go to slide ${i + 1}`}
                  onClick={() => setIndex(i)}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    i === index ? "w-6 bg-[#28A745]" : "w-1.5 bg-gray-300 hover:bg-gray-400"
                  }`}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={handleNext}
              aria-label="Next testimonial"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm transition-all hover:bg-neutral-50 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#28A745] cursor-pointer"
              style={{
                border: `1px solid ${INK}1a`,
                color: INK,
              }}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Desktop dots */}
          <div className="mt-6 hidden sm:flex justify-center gap-1.5">
            {Array.from({ length: maxIndex + 1 }).map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => setIndex(i)}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  i === index ? "w-6 bg-[#28A745]" : "w-1.5 bg-gray-300 hover:bg-gray-400"
                }`}
              />
            ))}
          </div>
        </>
      )}

      {/* Lightbox / Zoom Modal */}
      {selectedImage && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative flex max-h-[92vh] max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#25D366]/15 text-[#25D366]">
                  <MessageCircle className="h-3.5 w-3.5 fill-[#25D366]" />
                </span>
                <span className="text-sm font-semibold text-slate-800">
                  {selectedImage.title || "WhatsApp Customer Review"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition cursor-pointer"
                aria-label="Close review modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex items-center justify-center bg-neutral-950/5 p-4 sm:p-6 overflow-auto">
              <img
                src={selectedImage.image}
                alt={selectedImage.alt || "WhatsApp customer testimony"}
                className="max-h-[75vh] w-auto max-w-full rounded-xl object-contain shadow-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
