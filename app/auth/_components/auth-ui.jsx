"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";

// Shared presentation for the /auth pages (light "mk" card on bg-mk-bg).
// Logic stays in each page; these are styling-only building blocks.

export const authLabel = "mb-1.5 block text-[13.5px] font-medium text-mk-ink";

export const authInput =
  "h-12 w-full rounded-xl border border-mk-line-strong bg-white px-4 text-base sm:text-[15px] text-mk-ink placeholder:text-mk-muted/60 shadow-mk-sm outline-none transition-[border-color,box-shadow] duration-200 hover:border-mk-ink/25 focus:border-cx-brand focus:ring-4 focus:ring-cx-brand/15";

export const authPrimaryButton =
  "mk-focus mk-shine group flex h-12 w-full items-center justify-center gap-2.5 rounded-xl bg-cx-brand text-[15px] font-semibold text-white shadow-mk-brand transition-[background-color,transform,opacity] duration-200 hover:bg-[#23933d] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70";

export const authLink = "mk-focus rounded font-semibold text-cx-brand-deep underline-offset-4 hover:underline";

/** Square 44px tap target that sits inside the right edge of an h-12 input. */
export const authEyeButton =
  "mk-focus absolute right-0.5 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg text-mk-muted transition-colors hover:text-mk-ink";

export const authSpinner = "h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin";

export function AuthHeader({ title, description }) {
  return (
    <div className="mb-7">
      <h1 className="text-[26px] sm:text-[30px] font-semibold leading-tight tracking-[-0.025em] text-mk-ink text-balance">{title}</h1>
      {description ? <p className="mt-2 text-[14.5px] leading-relaxed text-mk-muted text-pretty">{description}</p> : null}
    </div>
  );
}

/** tone: error | success | info */
export function AuthAlert({ tone = "error", flush = false, className = "", children }) {
  const tones = {
    error: "border-red-200 bg-red-50 text-red-800",
    success: "border-cx-brand/25 bg-cx-brand-soft text-cx-brand-deep",
    info: "border-mk-line-strong bg-mk-bg text-mk-ink-2",
  };
  const Icon = tone === "error" ? AlertCircle : tone === "success" ? CheckCircle2 : AlertCircle;
  const iconTone = tone === "error" ? "text-red-500" : tone === "success" ? "text-cx-brand" : "text-mk-muted";
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`${flush ? "" : "mb-6 "}flex items-start gap-3 rounded-xl border p-4 text-[13.5px] leading-relaxed ${tones[tone]} ${className}`}>
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${iconTone}`} aria-hidden />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

export function AuthDivider({ label = "Or continue with email" }) {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center" aria-hidden>
        <div className="w-full border-t border-mk-line"></div>
      </div>
      <div className="relative flex justify-center text-[12.5px]">
        <span className="bg-mk-surface px-3 font-medium text-mk-muted">{label}</span>
      </div>
    </div>
  );
}

/**
 * Measures the slot so the fixed-width Google iframe never overflows a
 * narrow phone (it accepts 200–400px). Children is a render function that
 * receives the width as a string; nothing renders until it's measured.
 */
export function GoogleButtonSlot({ children }) {
  const ref = useRef(null);
  const [width, setWidth] = useState(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const w = Math.floor(el.getBoundingClientRect().width);
      const next = String(Math.max(200, Math.min(400, w)));
      setWidth((prev) => (prev === next ? prev : next));
    };
    measure();
    let t;
    const onResize = () => {
      clearTimeout(t);
      t = setTimeout(measure, 200);
    };
    window.addEventListener("resize", onResize);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", onResize);
    };
  }, []);
  return (
    <div ref={ref} className="flex min-h-[44px] w-full justify-center">
      {width ? children(width) : null}
    </div>
  );
}

export function AuthFooterNote({ children }) {
  return (
    <div className="mt-8 border-t border-mk-line pt-6 text-center">
      <p className="text-[14px] text-mk-muted">{children}</p>
    </div>
  );
}

export function AuthLoading({ label }) {
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-sm text-mk-muted">
      <span className="h-4 w-4 rounded-full border-2 border-mk-line-strong border-t-cx-brand animate-spin" aria-hidden />
      {label}
    </div>
  );
}
