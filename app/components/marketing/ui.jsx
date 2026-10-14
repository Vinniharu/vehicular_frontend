"use client";

import Link from "next/link";
import { Reveal, Magnetic } from "./motion";

// Building blocks for the public marketing pages. Tokens live in
// app/globals.css under "Public marketing site" (mk-*); the brand green
// comes from the shared cx palette.

const cx = (...parts) => parts.filter(Boolean).join(" ");

export function Container({ className, children }) {
  return <div className={cx("mx-auto w-full max-w-[1200px] px-5 sm:px-6 lg:px-8", className)}>{children}</div>;
}

/** A page section with the standard vertical rhythm. tone: light | white | dark */
export function Section({ id, tone = "light", className, containerClassName, children }) {
  const tones = {
    light: "bg-mk-bg text-mk-ink",
    white: "bg-mk-surface text-mk-ink",
    dark: "bg-mk-dark text-white",
  };
  return (
    <section id={id} className={cx("relative py-20 sm:py-24 lg:py-28 scroll-mt-20", tones[tone], className)}>
      <Container className={containerClassName}>{children}</Container>
    </section>
  );
}

/** Small mono label above a heading, with a brand dot. */
export function Eyebrow({ children, tone = "light", className }) {
  return (
    <p
      className={cx(
        "inline-flex items-center gap-2 font-mono text-[11.5px] font-medium uppercase tracking-[0.16em]",
        tone === "dark" ? "text-[#5fd17a]" : "text-cx-brand-deep",
        className
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-cx-brand" aria-hidden />
      {children}
    </p>
  );
}

/**
 * Section heading block. `accent` renders as an italic serif word in brand
 * green after the title (e.g. title="Renew your papers" accent="without the queue").
 */
export function SectionHeading({ eyebrow, title, accent, description, align = "left", tone = "light", as: H = "h2", className }) {
  const centered = align === "center";
  return (
    <Reveal className={cx(centered ? "mx-auto text-center" : "", "max-w-2xl", className)}>
      {eyebrow ? <Eyebrow tone={tone}>{eyebrow}</Eyebrow> : null}
      <H
        className={cx(
          "mt-4 font-semibold tracking-[-0.03em] text-balance",
          tone === "dark" ? "text-white" : "text-mk-ink"
        )}
        style={{ fontSize: "clamp(1.85rem, 2.4vw + 1rem, 3rem)", lineHeight: 1.08 }}
      >
        {title}
        {accent ? (
          <>
            {" "}
            <span className="font-display font-normal italic text-cx-brand">{accent}</span>
          </>
        ) : null}
      </H>
      {description ? (
        <p className={cx("mt-4 text-[16px] sm:text-[17px] leading-relaxed text-pretty", tone === "dark" ? "text-white/60" : "text-mk-muted")}>
          {description}
        </p>
      ) : null}
    </Reveal>
  );
}

const BUTTON_BASE =
  "mk-focus group inline-flex items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap transition-[background-color,color,box-shadow,border-color,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none";
const BUTTON_SIZES = {
  sm: "h-9 px-4 text-[13.5px]",
  md: "h-11 px-6 text-[14.5px]",
  lg: "h-[52px] px-7 text-[15.5px]",
};
const BUTTON_VARIANTS = {
  primary: "mk-shine bg-cx-brand text-white shadow-mk-brand hover:bg-[#23933d]",
  dark: "mk-shine bg-mk-ink text-white shadow-mk hover:bg-black",
  secondary: "bg-mk-surface text-mk-ink border border-mk-line-strong shadow-mk-sm hover:border-mk-ink/30 hover:shadow-mk",
  ghost: "text-mk-ink-2 hover:text-mk-ink hover:bg-mk-ink/[0.04]",
  onDark: "bg-white/[0.06] text-white border border-white/15 hover:bg-white/[0.12] hover:border-white/25",
};

/**
 * Link-or-button. Pass `href` for navigation (internal hrefs use next/link,
 * http(s) and #anchors use <a>), otherwise it renders a <button>.
 */
export function MkButton({ href, variant = "primary", size = "md", magnetic = false, className, children, ...rest }) {
  const classes = cx(BUTTON_BASE, BUTTON_SIZES[size], BUTTON_VARIANTS[variant], className);
  let el;
  if (href) {
    const external = /^https?:/.test(href) || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:");
    el = external ? (
      <a href={href} className={classes} {...rest}>
        {children}
      </a>
    ) : (
      <Link href={href} className={classes} {...rest}>
        {children}
      </Link>
    );
  } else {
    el = (
      <button type="button" className={classes} {...rest}>
        {children}
      </button>
    );
  }
  return magnetic ? <Magnetic className="max-sm:w-full [&>*]:max-sm:w-full">{el}</Magnetic> : el;
}

/** Bordered surface card. `interactive` adds the hover lift. */
export function MkCard({ as: Tag = "div", interactive = false, featured = false, tone = "light", className, children, ...rest }) {
  return (
    <Tag
      className={cx(
        "rounded-mk-lg",
        tone === "dark"
          ? "border border-white/10 bg-mk-dark-card text-white"
          : featured
            ? "mk-gradient-border shadow-mk"
            : "border border-mk-line bg-mk-surface shadow-mk-sm",
        interactive && "mk-lift",
        className
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export function BentoGrid({ className, children }) {
  return <div className={cx("grid gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-6", className)}>{children}</div>;
}

export function Pill({ tone = "brand", className, children }) {
  const tones = {
    brand: "bg-cx-brand-soft text-cx-brand-deep border-cx-brand/20",
    neutral: "bg-mk-ink/[0.04] text-mk-ink-2 border-mk-line",
    gold: "bg-[#c9a227]/10 text-[#8a6d12] border-[#c9a227]/25",
    dark: "bg-white/[0.06] text-white/80 border-white/10",
  };
  return (
    <span className={cx("inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12.5px] font-medium", tones[tone], className)}>
      {children}
    </span>
  );
}

/** Simple page header for inner marketing pages (pricing, services, legal). */
export function PageHero({ eyebrow, title, accent, description, children, className }) {
  return (
    <section className={cx("relative overflow-hidden border-b border-mk-line bg-mk-surface", className)}>
      <div aria-hidden className="mk-grid-bg pointer-events-none absolute inset-0" />
      <div aria-hidden className="mk-glow pointer-events-none absolute -top-40 left-1/2 h-[420px] w-[720px] -translate-x-1/2" />
      <Container className="relative py-16 sm:py-20 lg:py-24">
        <SectionHeading as="h1" eyebrow={eyebrow} title={title} accent={accent} description={description} align="center" />
        {children ? <Reveal delay={0.1} className="mt-8">{children}</Reveal> : null}
      </Container>
    </section>
  );
}
