"use client";

import { useEffect, useRef, useState } from "react";
import { Star, ShieldCheck, ChevronLeft, ChevronRight } from "lucide-react";
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

  // Auto-advance interval, resetting whenever index or paused state changes
  useEffect(() => {
    if (paused || items.length <= visible) return;
    const t = setInterval(() => {
      setIndex((i) => (i >= maxIndex ? 0 : i + 1));
    }, intervalMs);
    return () => clearInterval(t);
  }, [paused, items.length, visible, intervalMs, maxIndex, index]);

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
                key={`${t.id}-${i}`}
                className="shrink-0 px-2"
                style={{ width: `${100 / visible}%` }}
              >
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
    </div>
  );
}
