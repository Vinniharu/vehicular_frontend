"use client";

import React from "react";

export function DeviceStage({ children, className = "" }) {
  return (
    <div
      className={`relative flex items-center justify-center p-6 sm:p-10 rounded-3xl overflow-hidden ${className}`}
      style={{
        background: "radial-gradient(circle at 50% 30%, rgba(40, 167, 69, 0.18), transparent 70%), #111111",
      }}
    >
      {children}
    </div>
  );
}

export function DeviceFrame({
  src,
  alt,
  tone = "graphite",
  className = "",
}) {
  const isNatural = tone === "natural";
  const frameBg = isNatural
    ? "linear-gradient(145deg, #3d3b38 0%, #524f4b 30%, #2b2a28 60%, #474542 100%)"
    : "linear-gradient(145deg, #1a1a1c 0%, #2a2a2d 28%, #0e0e10 55%, #26262a 78%, #101012 100%)";

  return (
    <div
      role="img"
      aria-label={alt || "Device mockup"}
      className={`relative rounded-[2.5rem] p-3 shadow-2xl ${className}`}
      style={{
        background: frameBg,
        width: "100%",
        maxWidth: "320px",
        aspectRatio: "320 / 660",
        boxShadow:
          "0 40px 80px -20px rgba(0,0,0,0.60), 0 20px 40px -15px rgba(0,0,0,0.45), inset 0 0 0 1px rgba(255,255,255,0.12)",
      }}
    >
      {/* Side buttons */}
      <span
        className="absolute left-[-3px] top-[14%] w-[3px] h-[3.2%] rounded-l-[2px]"
        style={{ background: "#0a0a0b" }}
      />
      <span
        className="absolute left-[-3px] top-[22%] w-[3px] h-[7%] rounded-l-[2px]"
        style={{ background: "#0a0a0b" }}
      />
      <span
        className="absolute left-[-3px] top-[31%] w-[3px] h-[7%] rounded-l-[2px]"
        style={{ background: "#0a0a0b" }}
      />
      <span
        className="absolute right-[-3px] top-[24%] w-[3px] h-[10%] rounded-r-[2px]"
        style={{ background: "#0a0a0b" }}
      />

      {/* Screen container */}
      <div
        className="relative h-full w-full overflow-hidden rounded-[2rem] bg-[#111111]"
        style={{
          boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08), inset 0 0 20px rgba(0,0,0,0.6)",
        }}
      >
        {/* Dynamic Island */}
        <div
          className="absolute left-1/2 top-2 z-30 h-[22px] w-[31%] -translate-x-1/2 rounded-full bg-[#050505]"
          style={{
            boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.05), 0 1px 2px rgba(0,0,0,0.6)",
          }}
        />

        {/* Screen Content / Image */}
        {src ? (
          <img src={src} alt={alt} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-white/50 text-xs">
            Preview
          </div>
        )}

        {/* Glossy screen reflection */}
        <div
          className="absolute inset-0 pointer-events-none z-20"
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%)",
            mixBlendMode: "screen",
          }}
        />
      </div>
    </div>
  );
}
