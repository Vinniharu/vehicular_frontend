"use client";

import React from "react";
import { Zap } from "lucide-react";
import { koboToNaira } from "@/lib/api";

export default function ProcessingSpeedSelector({
  value = "normal",
  onChange,
  fastTrackPriceKobo = 1000000,
  standardTurnaround = "3–5 business days",
  fastTrackTurnaround = "24–48 hours",
  disabled = false,
}) {
  const isNormal = value === "normal";
  const isFastTrack = value === "fast_track";

  return (
    <div className="space-y-3 my-4">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Processing Speed
        </label>
        {isFastTrack && (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <Zap className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
            Expedited Priority
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Standard Processing Option */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange && onChange("normal")}
          className={`relative flex flex-col p-4 rounded-xl border text-left transition-all cursor-pointer ${
            isNormal
              ? "border-[#28A745] bg-emerald-50/40 dark:bg-emerald-950/20 shadow-xs ring-1 ring-[#28A745]/30"
              : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-700"
          } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
        >
          <div className="flex items-start justify-between w-full mb-1.5">
            <div className="flex items-center gap-2.5">
              <span
                className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                  isNormal
                    ? "border-[#28A745] bg-[#28A745]"
                    : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                }`}
              >
                {isNormal && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
              </span>
              <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                Standard Processing
              </span>
            </div>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800">
              Included
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 pl-6">
            Estimated turnaround: <strong className="text-gray-700 dark:text-gray-300">{standardTurnaround}</strong>
          </p>
        </button>

        {/* Fast Track Option */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange && onChange("fast_track")}
          className={`relative flex flex-col p-4 rounded-xl border text-left transition-all cursor-pointer ${
            isFastTrack
              ? "border-[#28A745] bg-emerald-50/50 dark:bg-emerald-950/25 shadow-xs ring-2 ring-[#28A745]/30"
              : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-700"
          } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
        >
          <div className="flex items-start justify-between w-full mb-1.5">
            <div className="flex items-center gap-2.5">
              <span
                className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                  isFastTrack
                    ? "border-[#28A745] bg-[#28A745]"
                    : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                }`}
              >
                {isFastTrack && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
              </span>
              <div className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-500 fill-amber-400 animate-pulse" />
                <span className="font-bold text-sm text-gray-900 dark:text-gray-100">
                  Fast Track
                </span>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/50">
              +{koboToNaira(fastTrackPriceKobo)}
            </span>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-300 pl-6 mb-1">
            Turnaround: <strong className="text-emerald-700 dark:text-emerald-300">{fastTrackTurnaround}</strong>
          </p>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 pl-6">
            Priority processing • Jumps to front of all queues
          </p>
        </button>
      </div>
    </div>
  );
}

