"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { HOW_STEPS } from "../landing-data";
import { Section, SectionHeading } from "@/app/components/marketing/ui";
import { EASE, Stagger, StaggerItem } from "@/app/components/marketing/motion";

const STEP_MS = 4000;

function HowStep({ step, index, isActive, onClick, reduce }) {
  const Icon = step.icon;
  const onKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick();
    }
  };
  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={isActive}
      onClick={onClick}
      onKeyDown={onKeyDown}
      className="mk-focus group relative flex cursor-pointer gap-5 rounded-mk-lg text-left md:block"
    >
      {/* Mono step marker; sits on the connecting line on desktop */}
      <div className="relative z-10 flex shrink-0 flex-col items-center md:items-start">
        <span
          className={`inline-flex h-12 w-12 items-center justify-center rounded-full border font-mono text-[13px] font-semibold transition-[background-color,border-color,color,box-shadow] duration-300 ${
            isActive
              ? "border-cx-brand bg-cx-brand text-white shadow-mk-brand"
              : "border-mk-line-strong bg-mk-surface text-mk-ink-2 group-hover:border-cx-brand/40"
          }`}
        >
          {String(index + 1).padStart(2, "0")}
        </span>
      </div>

      <div
        className={`relative flex-1 overflow-hidden rounded-mk-lg border p-5 sm:p-6 md:mt-6 transition-[background-color,border-color,box-shadow] duration-300 ${
          isActive ? "border-cx-brand/25 bg-mk-surface shadow-mk" : "border-mk-line bg-mk-surface/60 group-hover:bg-mk-surface"
        }`}
      >
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex h-10 w-10 items-center justify-center rounded-xl transition-colors duration-300 ${
              isActive ? "bg-cx-brand-soft text-cx-brand-deep" : "bg-mk-ink/[0.04] text-mk-ink-2"
            }`}
          >
            <Icon className="h-5 w-5" />
          </span>
          <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-mk-muted">Step {String(index + 1).padStart(2, "0")}</span>
        </div>
        <h3 className="mt-4 text-[18px] font-semibold tracking-[-0.02em] leading-tight text-mk-ink">{step.title}</h3>
        <p className="mt-2 text-[14.5px] leading-relaxed text-mk-muted">{step.blurb}</p>

        {/* Auto-advance progress (transform only) */}
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-[3px] bg-transparent">
          <div
            className="h-full origin-left bg-cx-brand"
            style={{
              transform: `scaleX(${isActive ? 1 : 0})`,
              transition: reduce ? "none" : isActive ? `transform ${STEP_MS}ms linear` : "transform 200ms ease",
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default function HowItWorks() {
  const reduce = useReducedMotion();
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    if (reduce) return;
    const timer = setInterval(() => setActiveStep((s) => (s + 1) % HOW_STEPS.length), STEP_MS);
    return () => clearInterval(timer);
  }, [reduce, activeStep]);

  const handleStepClick = useCallback((i) => setActiveStep(i), []);

  return (
    <Section id="how" tone="light">
      <SectionHeading
        align="center"
        eyebrow="How it works — a 3-step sequence"
        title="Submit online."
        accent="We handle the rest."
        description="Start a request in under 2 minutes from your phone. We process it with the relevant authority or vendor and deliver the result back to you."
      />

      <div className="relative mt-14 sm:mt-16">
        {/* Connecting line: vertical on mobile, horizontal on desktop; draws in on view */}
        <motion.div
          aria-hidden
          className="absolute left-6 top-6 bottom-6 w-px origin-top bg-gradient-to-b from-cx-brand/60 via-mk-line-strong to-mk-line md:hidden"
          initial={reduce ? false : { scaleY: 0 }}
          whileInView={{ scaleY: 1 }}
          viewport={{ once: true, margin: "0px 0px -15% 0px" }}
          transition={{ duration: 1.1, ease: EASE }}
        />
        <motion.div
          aria-hidden
          className="absolute left-6 right-[calc(33.333%-1.5rem)] top-6 hidden h-px origin-left bg-gradient-to-r from-cx-brand/60 via-mk-line-strong to-mk-line md:block"
          initial={reduce ? false : { scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true, margin: "0px 0px -15% 0px" }}
          transition={{ duration: 1.2, ease: EASE }}
        />

        <Stagger gap={0.12} className="relative grid gap-6 md:grid-cols-3 md:gap-6 lg:gap-8">
          {HOW_STEPS.map((s, i) => (
            <StaggerItem key={i}>
              <HowStep step={s} index={i} isActive={activeStep === i} onClick={() => handleStepClick(i)} reduce={reduce} />
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </Section>
  );
}
