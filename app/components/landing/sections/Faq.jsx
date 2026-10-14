"use client";

import { useId, useState } from "react";
import { Plus, MessageCircle } from "lucide-react";
import { FAQ_ITEMS } from "../landing-data";
import { Section, SectionHeading, MkButton } from "@/app/components/marketing/ui";
import { Reveal, Stagger, StaggerItem } from "@/app/components/marketing/motion";

// Grid-rows height animation keeps every answer in the DOM (crawlable,
// no layout jank); motion-reduce:transition-none flattens it.
function FaqItem({ q, a, open, onToggle, id }) {
  return (
    <div
      className={`rounded-mk-lg border bg-mk-surface transition-[border-color,box-shadow] duration-300 ${
        open ? "border-mk-line-strong shadow-mk" : "border-mk-line shadow-mk-sm hover:border-mk-line-strong"
      }`}
    >
      <h3>
        <button
          type="button"
          id={`${id}-q`}
          aria-expanded={open}
          aria-controls={`${id}-a`}
          onClick={onToggle}
          className="mk-focus flex min-h-[56px] w-full items-center justify-between gap-5 rounded-mk-lg px-5 py-4 text-left sm:px-6 sm:py-5"
        >
          <span className="text-[15.5px] sm:text-[16.5px] font-medium leading-snug tracking-[-0.01em] text-mk-ink">{q}</span>
          <span
            aria-hidden
            className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-[transform,background-color,border-color,color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
              open ? "rotate-45 border-cx-brand bg-cx-brand text-white" : "border-mk-line-strong text-mk-ink-2"
            }`}
          >
            <Plus className="h-4 w-4" />
          </span>
        </button>
      </h3>
      <div
        id={`${id}-a`}
        role="region"
        aria-labelledby={`${id}-q`}
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden" aria-hidden={!open}>
          <p className="px-5 pb-5 sm:px-6 sm:pb-6 max-w-2xl text-[15px] leading-[1.7] text-mk-muted">{a}</p>
        </div>
      </div>
    </div>
  );
}

export default function Faq() {
  // Several answers can be open at once, as with the old <details> list.
  const [openSet, setOpenSet] = useState(() => new Set([0]));
  const toggle = (i) =>
    setOpenSet((cur) => {
      const next = new Set(cur);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  const baseId = useId();

  return (
    <Section id="faq" tone="light">
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-28">
            <SectionHeading
              eyebrow="FAQ"
              title="Questions,"
              accent="answered."
              description="Everything you need to know before you get started. Still stuck? Reach out and a human will reply."
            />
            <Reveal delay={0.1} className="mt-7">
              <MkButton href="#contact" variant="secondary">
                <MessageCircle className="h-4 w-4" />
                Contact us
              </MkButton>
            </Reveal>
          </div>
        </div>

        <Stagger gap={0.05} className="lg:col-span-7 space-y-3">
          {FAQ_ITEMS.map((item, i) => (
            <StaggerItem key={i}>
              <FaqItem
                q={item.q}
                a={item.a}
                id={`${baseId}-faq-${i}`}
                open={openSet.has(i)}
                onToggle={() => toggle(i)}
              />
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </Section>
  );
}
