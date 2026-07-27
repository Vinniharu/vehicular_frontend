"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";

/**
 * Signature Document Ring Component (Rule #4)
 * Visual shorthand for "we're always watching this so you don't have to."
 *
 * Rules & Constraints FulfiIled:
 * - Appears small (size="small") as summary chip in list views (Surface A only).
 * - Appears large (size="large") as hero element on single vehicle/application detail page (Surface A only).
 * - Animates fill in once on load in under 400ms (duration-300 ease-out), not on every re-render.
 * - Never appear on Surface B (staff console).
 * - Colors segments calmly by status (current: #28A745, expiring: #F59E0B, expired: #64748B calm neutral).
 */
export default function DocumentRing({ documents = [], size = "medium", overrideStatus = null }) {
  const [animatedProgress, setAnimatedProgress] = useState(0);

  // Calculate compliance statistics across document records
  const totalRequired = Math.max(5, Array.isArray(documents) ? documents.length : 0);
  const validDocs = Array.isArray(documents)
    ? documents.filter((d) => d.status === "valid" || d.status === "verified" || !d.status).length
    : 0;
  const expiringDocs = Array.isArray(documents)
    ? documents.filter((d) => d.status === "expiring").length
    : 0;
  const expiredDocs = Array.isArray(documents)
    ? documents.filter((d) => d.status === "expired" || d.status === "rejected").length
    : 0;

  const targetProgress = Array.isArray(documents) && documents.length > 0
    ? Math.min(1, validDocs / documents.length)
    : overrideStatus === "completed" || overrideStatus === "valid" ? 1
    : overrideStatus === "in_progress" ? 0.6
    : 0.2; // Default starting progress if fresh

  useEffect(() => {
    // Animate fill once on load in under 400ms (Rule #4)
    const timer = setTimeout(() => {
      setAnimatedProgress(targetProgress);
    }, 50);
    return () => clearTimeout(timer);
  }, [targetProgress]);

  // Dimension scaling
  const isLarge = size === "large";
  const isSmall = size === "small";
  const dimensions = isLarge ? 140 : isSmall ? 44 : 96;
  const stroke = isLarge ? 10 : isSmall ? 5 : 8;
  const r = (dimensions - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - animatedProgress);

  // Determine primary ring tone based on everyday calm expired rule (Rule #5)
  const ringColor =
    animatedProgress === 1
      ? "#28A745" // Emerald Green (Brand Primary)
      : expiringDocs > 0 && animatedProgress >= 0.5
      ? "#F59E0B" // Amber warning
      : animatedProgress < 0.4 || expiredDocs > 0
      ? "#64748B" // Slate calm neutral for everyday renewal
      : "#28A745";

  return (
    <div
      className="relative inline-flex items-center justify-center shrink-0 select-none"
      style={{ width: dimensions, height: dimensions }}
      title={`Compliance: ${Math.round(animatedProgress * 100)}%`}
    >
      <svg width={dimensions} height={dimensions} className="-rotate-90">
        {/* Background track */}
        <circle
          cx={dimensions / 2}
          cy={dimensions / 2}
          r={r}
          strokeWidth={stroke}
          className="stroke-slate-100"
          fill="none"
        />
        {/* Active compliance ring with <400ms animation */}
        <circle
          cx={dimensions / 2}
          cy={dimensions / 2}
          r={r}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          stroke={ringColor}
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-300 ease-out"
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {animatedProgress === 1 ? (
          <CheckCircle2 className={`${isLarge ? "h-8 w-8" : isSmall ? "h-4 w-4" : "h-6 w-6"} text-[#28A745]`} />
        ) : isSmall ? (
          <span className="text-[10px] font-bold font-mono text-slate-700 leading-none">
            {Math.round(animatedProgress * 100)}%
          </span>
        ) : (
          <>
            <span
              className={`${
                isLarge ? "text-xl" : "text-base"
              } font-bold font-mono text-slate-800 leading-none`}
            >
              {Math.round(animatedProgress * 100)}%
            </span>
            <span className="mt-1 text-[9.5px] font-bold uppercase tracking-wider text-slate-400 leading-none">
              {expiredDocs > 0 ? "Expiring" : "Compliant"}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
