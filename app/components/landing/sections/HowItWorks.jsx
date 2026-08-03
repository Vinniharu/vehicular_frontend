"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { HOW_STEPS } from "../landing-data";
import { INK, GREEN, PAPER, INK_SOFT } from "../theme";

function HowStep({ step, index, isActive, onClick }) {
  const Icon = step.icon;
  return (
    <div className="relative cursor-pointer group" onClick={onClick}>
      <div className="h-[3px] w-full rounded-full mb-8 overflow-hidden" style={{ background: `${INK}14` }}>
        <div
          className="h-full rounded-full"
          style={{
            background: GREEN,
            width: isActive ? "100%" : "0%",
            transition: isActive ? "width 4s linear" : "width 0.2s ease",
            willChange: isActive ? "width" : "auto",
          }}
        />
      </div>
      <div
        className={`flex items-start gap-4 rounded-2xl p-6 transition-colors duration-200 ${isActive ? "bg-white shadow-lg shadow-black/5" : "hover:bg-white/50"}`}
        style={{ border: isActive ? `1px solid ${GREEN}26` : "1px solid transparent" }}
      >
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors duration-200"
          style={{ background: isActive ? GREEN : `${INK}14`, color: isActive ? PAPER : `${INK}99` }}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <span className="font-mono text-[11px] uppercase tracking-widest" style={{ color: `${INK}59` }}>
            Step {String(index + 1).padStart(2, "0")}
          </span>
          <h3 className="mt-1.5 font-display text-[19px] font-medium leading-tight" style={{ color: INK }}>
            {step.title}
          </h3>
          <p
            className={`mt-2 text-[14px] leading-relaxed transition-opacity duration-200 ${isActive ? "opacity-100" : "opacity-0 h-0 overflow-hidden md:opacity-100 md:h-auto"}`}
            style={{ color: INK_SOFT }}
          >
            {step.blurb}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setActiveStep((s) => (s + 1) % HOW_STEPS.length), 4000);
    return () => clearInterval(timer);
  }, []);

  const handleStepClick = useCallback((i) => setActiveStep(i), []);

  return (
    <section id="how" className="relative px-4 sm:px-6 md:px-10 py-[64px] sm:py-[80px] lg:py-[96px]" style={{ background: PAPER }}>
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto"
        >
          <p className="font-mono text-[11px] uppercase tracking-widest" style={{ color: GREEN }}>
            How it works — a 3-step sequence
          </p>
          <h2 className="mt-4 font-display font-medium tracking-[-0.02em] leading-[1.05] text-[clamp(1.75rem,2.4vw+1rem,2.5rem)]" style={{ color: INK }}>
            Submit online. We handle the rest.
          </h2>
          <p className="mt-5 max-w-md mx-auto text-[16px] leading-[1.7]" style={{ color: INK_SOFT }}>
            Start a request in under 2 minutes from your phone. We process it with the relevant authority or vendor and deliver the result back to you.
          </p>
        </motion.div>

        <div className="mt-16 grid md:grid-cols-3 gap-0">
          {HOW_STEPS.map((s, i) => (
            <HowStep key={i} step={s} index={i} isActive={activeStep === i} onClick={() => handleStepClick(i)} />
          ))}
        </div>
      </div>
    </section>
  );
}
