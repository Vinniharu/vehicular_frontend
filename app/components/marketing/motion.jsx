"use client";

import { Children, useEffect, useRef, useState } from "react";
import { animate, motion, useInView, useMotionValue, useReducedMotion, useSpring } from "framer-motion";

// One easing and timing scale for the whole public site, so every reveal,
// hover and stagger feels like the same hand made it.
export const EASE = [0.22, 1, 0.36, 1];
export const DURATION = 0.6;

/** Fade + small rise when scrolled into view (once). */
export function Reveal({ as = "div", delay = 0, y = 14, className, children, ...rest }) {
  const reduce = useReducedMotion();
  const Tag = motion[as] || motion.div;
  if (reduce) {
    const Plain = as;
    return (
      <Plain className={className} {...rest}>
        {children}
      </Plain>
    );
  }
  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: DURATION, ease: EASE, delay }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

const staggerParent = (gap, delay) => ({
  hidden: {},
  show: { transition: { staggerChildren: gap, delayChildren: delay } },
});
const staggerChild = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: DURATION, ease: EASE } },
};

/**
 * Children appear one after another when the group scrolls into view.
 * `animateOnMount` plays immediately instead (for above-the-fold heroes).
 */
export function Stagger({ as = "div", gap = 0.06, delay = 0, animateOnMount = false, className, children, ...rest }) {
  const reduce = useReducedMotion();
  const Tag = motion[as] || motion.div;
  if (reduce) {
    const Plain = as;
    return (
      <Plain className={className} {...rest}>
        {children}
      </Plain>
    );
  }
  const trigger = animateOnMount
    ? { animate: "show" }
    : { whileInView: "show", viewport: { once: true, margin: "0px 0px -10% 0px" } };
  return (
    <Tag className={className} variants={staggerParent(gap, delay)} initial="hidden" {...trigger} {...rest}>
      {children}
    </Tag>
  );
}

export function StaggerItem({ as = "div", className, children, ...rest }) {
  const reduce = useReducedMotion();
  const Tag = motion[as] || motion.div;
  if (reduce) {
    const Plain = as;
    return (
      <Plain className={className} {...rest}>
        {children}
      </Plain>
    );
  }
  return (
    <Tag className={className} variants={staggerChild} {...rest}>
      {children}
    </Tag>
  );
}

/**
 * Counts a stat up when it scrolls into view. Accepts display strings such
 * as "12,400+", "98%" or "₦2.4M" and animates only the numeric part, keeping
 * the prefix/suffix. Non-numeric values render as-is.
 */
export function CountUp({ value, duration = 1.4, className }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  const reduce = useReducedMotion();
  const str = String(value ?? "");
  const match = str.match(/^(\D*?)(\d[\d,]*\.?\d*)(.*)$/);
  const [display, setDisplay] = useState(() => (match && !reduce ? `${match[1]}0${match[3]}` : str));

  useEffect(() => {
    if (!match || reduce) {
      setDisplay(str);
      return;
    }
    if (!inView) return;
    const [, prefix, num, suffix] = match;
    const target = parseFloat(num.replace(/,/g, ""));
    const decimals = (num.split(".")[1] || "").length;
    const useCommas = num.includes(",");
    const controls = animate(0, target, {
      duration,
      ease: EASE,
      onUpdate: (v) => {
        const fixed = v.toFixed(decimals);
        const formatted = useCommas ? Number(fixed).toLocaleString("en-US", { minimumFractionDigits: decimals }) : fixed;
        setDisplay(`${prefix}${formatted}${suffix}`);
      },
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, str, reduce]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}

/** Pulls its child slightly toward the cursor. Desktop pointers only. */
export function Magnetic({ strength = 0.25, className, children }) {
  const reduce = useReducedMotion();
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 18, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 220, damping: 18, mass: 0.4 });

  if (reduce) return <span className={className}>{children}</span>;

  const onMove = (e) => {
    if (e.pointerType !== "mouse" || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * strength);
    y.set((e.clientY - (r.top + r.height / 2)) * strength);
  };
  const reset = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.span ref={ref} className={className} style={{ x: sx, y: sy, display: "inline-flex" }} onPointerMove={onMove} onPointerLeave={reset}>
      {children}
    </motion.span>
  );
}

/** Endless horizontal strip; pauses on hover; static under reduced motion. */
export function Marquee({ className = "", itemClassName = "", children }) {
  const items = Children.toArray(children);
  return (
    <div className={`mk-marquee relative overflow-hidden ${className}`}>
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[var(--mk-bg)] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[var(--mk-bg)] to-transparent" />
      <div className="mk-marquee-track flex w-max">
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0" aria-hidden={copy === 1 || undefined}>
            {items.map((child, i) => (
              <div key={i} className={itemClassName}>
                {child}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
