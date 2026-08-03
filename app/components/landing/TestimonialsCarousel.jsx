"use client";

import { useEffect, useRef, useState } from "react";
import { Star, ShieldCheck } from "lucide-react";
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

  useEffect(() => {
    if (paused || items.length <= visible) return;
    const t = setInterval(() => {
      setIndex((i) => (i >= maxIndex ? 0 : i + 1));
    }, intervalMs);
    return () => clearInterval(t);
  }, [paused, items.length, visible, intervalMs, maxIndex]);

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
      className="relative overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
    >
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
              <div className="flex items-center gap-3">
                <img
                  src={t.customer_photo_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
                  alt={t.customer_name}
                  loading="lazy"
                  className="h-14 w-14 shrink-0 rounded-full object-cover"
                  style={{ boxShadow: `0 0 0 2px ${GREEN}33` }}
                />
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

      {/* Dots */}
      {maxIndex > 0 && (
        <div className="mt-6 flex justify-center gap-1.5">
          {Array.from({ length: maxIndex + 1 }).map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? "w-6 bg-[#28A745]" : "w-1.5 bg-gray-300"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
