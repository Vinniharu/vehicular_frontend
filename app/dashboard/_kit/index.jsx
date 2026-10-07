"use client";

// Customer portal component kit. Mobile-first: inputs are 16px on phones so
// iOS doesn't zoom on focus, tap targets are at least 44px, and the primary
// action of a screen lives in a sticky bar above the bottom tab bar.
// Colours come from the cx-* tokens in app/globals.css — never hard-code hex.

import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, ChevronLeft, Loader2, RefreshCw, X } from "lucide-react";
import Link from "next/link";
import { forwardRef, useId } from "react";

export { koboToNaira } from "@/lib/api";

const cx = (...parts) => parts.filter(Boolean).join(" ");

/* ── Buttons ─────────────────────────────────────────────────────────── */

const BUTTON_VARIANTS = {
  primary:
    "bg-cx-brand text-white hover:bg-cx-brand-deep disabled:bg-cx-line-strong disabled:text-white",
  secondary:
    "bg-cx-surface text-cx-ink border border-cx-line-strong hover:bg-cx-sunken disabled:text-cx-muted",
  ghost: "bg-transparent text-cx-ink-2 hover:bg-cx-sunken disabled:text-cx-muted",
  danger: "bg-cx-red text-white hover:brightness-95 disabled:opacity-60",
  soft: "bg-cx-brand-soft text-cx-brand-deep hover:brightness-[0.97] disabled:opacity-60",
};
const BUTTON_SIZES = {
  md: "min-h-11 px-4 text-[15px]",
  lg: "min-h-12 px-5 text-base",
  sm: "min-h-9 px-3 text-sm",
};

export const Button = forwardRef(function Button(
  { variant = "primary", size = "md", loading = false, block = false, icon: Icon, href, className, children, disabled, ...props },
  ref
) {
  const classes = cx(
    "cx-focus inline-flex items-center justify-center gap-2 rounded-cx font-semibold transition-colors select-none",
    "disabled:cursor-not-allowed",
    BUTTON_VARIANTS[variant],
    BUTTON_SIZES[size],
    block && "w-full",
    className
  );
  const content = (
    <>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : Icon ? <Icon className="h-4 w-4" aria-hidden /> : null}
      {children}
    </>
  );
  if (href) {
    return (
      <Link ref={ref} href={href} className={classes} {...props}>
        {content}
      </Link>
    );
  }
  return (
    <button ref={ref} type="button" className={classes} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
      {content}
    </button>
  );
});

export function IconButton({ label, icon: Icon, className, ...props }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cx(
        "cx-focus inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-cx text-cx-ink-2 hover:bg-cx-sunken",
        className
      )}
      {...props}
    >
      <Icon className="h-5 w-5" aria-hidden />
    </button>
  );
}

/* ── Form fields ─────────────────────────────────────────────────────── */

const controlBase =
  "w-full rounded-cx border bg-cx-surface px-3.5 text-base sm:text-[15px] text-cx-ink placeholder:text-cx-muted/70 outline-none transition-shadow focus:border-cx-brand focus:ring-4 focus:ring-[color:var(--cx-focus)] disabled:bg-cx-sunken disabled:text-cx-muted";

export function Field({ label, hint, error, required, optional, children, id: idProp, className }) {
  const autoId = useId();
  const id = idProp || autoId;
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
  return (
    <div className={cx("space-y-1.5", className)}>
      {label ? (
        <label htmlFor={id} className="block text-sm font-medium text-cx-ink">
          {label}
          {required ? <span className="text-cx-red"> *</span> : null}
          {optional ? <span className="font-normal text-cx-muted"> (optional)</span> : null}
        </label>
      ) : null}
      {typeof children === "function" ? children({ id, "aria-describedby": describedBy, "aria-invalid": error ? true : undefined }) : children}
      {hint && !error ? (
        <p id={`${id}-hint`} className="text-[13px] text-cx-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="flex items-start gap-1.5 text-[13px] font-medium text-cx-red">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      ) : null}
    </div>
  );
}

export const Input = forwardRef(function Input({ invalid, className, prefix, ...props }, ref) {
  const input = (
    <input
      ref={ref}
      className={cx(controlBase, "min-h-12", invalid ? "border-cx-red" : "border-cx-line-strong", prefix && "pl-9", className)}
      {...props}
    />
  );
  if (!prefix) return input;
  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-cx-muted">{prefix}</span>
      {input}
    </div>
  );
});

export const Textarea = forwardRef(function Textarea({ invalid, className, rows = 3, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={cx(controlBase, "py-3", invalid ? "border-cx-red" : "border-cx-line-strong", className)}
      {...props}
    />
  );
});

export const Select = forwardRef(function Select({ invalid, className, children, ...props }, ref) {
  return (
    <select
      ref={ref}
      className={cx(controlBase, "min-h-12 appearance-none bg-[length:16px] bg-[right_14px_center] bg-no-repeat pr-10", invalid ? "border-cx-red" : "border-cx-line-strong", className)}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%235b6660' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
      }}
      {...props}
    >
      {children}
    </select>
  );
});

/* ── Surfaces ────────────────────────────────────────────────────────── */

export function Card({ as: Tag = "section", className, padded = true, children, ...props }) {
  return (
    <Tag className={cx("rounded-cx-lg border border-cx-line bg-cx-surface shadow-cx", padded && "p-4 sm:p-5", className)} {...props}>
      {children}
    </Tag>
  );
}

export function SectionTitle({ title, action, description }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-[17px] font-semibold text-cx-ink">{title}</h2>
        {description ? <p className="mt-0.5 text-sm text-cx-muted">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function PageHeader({ title, description, backHref, backLabel = "Back", actions }) {
  return (
    <header className="mb-5 sm:mb-7">
      {backHref ? (
        <Link
          href={backHref}
          className="cx-focus -ml-2 mb-2 inline-flex min-h-11 items-center gap-1 rounded-cx px-2 text-sm font-medium text-cx-muted hover:text-cx-ink"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          {backLabel}
        </Link>
      ) : null}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-[26px] leading-tight text-cx-ink sm:text-[30px]">{title}</h1>
          {description ? <p className="mt-1.5 max-w-prose text-[15px] text-cx-muted">{description}</p> : null}
        </div>
        {actions ? <div className="flex shrink-0 gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}

const TONES = {
  neutral: "bg-cx-sunken text-cx-ink-2",
  brand: "bg-cx-brand-soft text-cx-brand-deep",
  amber: "bg-cx-amber-soft text-cx-amber",
  red: "bg-cx-red-soft text-cx-red",
};

export function Badge({ tone = "neutral", className, children }) {
  return (
    <span className={cx("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[13px] font-medium", TONES[tone], className)}>
      {children}
    </span>
  );
}

export function Notice({ tone = "neutral", title, children, action, icon: Icon = AlertCircle }) {
  return (
    <div className={cx("flex gap-3 rounded-cx-lg p-4", TONES[tone])} role={tone === "red" ? "alert" : "status"}>
      <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1 text-sm">
        {title ? <p className="font-semibold">{title}</p> : null}
        {children ? <div className={cx(title && "mt-0.5", "opacity-90")}>{children}</div> : null}
        {action ? <div className="mt-3">{action}</div> : null}
      </div>
    </div>
  );
}

/* ── States ──────────────────────────────────────────────────────────── */

export function Skeleton({ className }) {
  return <div className={cx("animate-pulse rounded-cx bg-cx-sunken", className)} aria-hidden />;
}

export function SkeletonList({ rows = 3 }) {
  return (
    <div className="space-y-3" role="status" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-24 w-full rounded-cx-lg" />
      ))}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center rounded-cx-lg border border-dashed border-cx-line-strong bg-cx-surface px-6 py-10 text-center">
      {Icon ? (
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-cx-brand-soft text-cx-brand-deep">
          <Icon className="h-6 w-6" aria-hidden />
        </div>
      ) : null}
      <p className="text-base font-semibold text-cx-ink">{title}</p>
      {description ? <p className="mt-1 max-w-sm text-sm text-cx-muted">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ title = "This didn't load", message, onRetry }) {
  return (
    <div className="flex flex-col items-center rounded-cx-lg border border-cx-line bg-cx-surface px-6 py-10 text-center" role="alert">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-cx-red-soft text-cx-red">
        <AlertCircle className="h-6 w-6" aria-hidden />
      </div>
      <p className="text-base font-semibold text-cx-ink">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-cx-muted">{message || "Check your connection and try again."}</p>
      {onRetry ? (
        <Button variant="secondary" icon={RefreshCw} onClick={onRetry} className="mt-5">
          Try again
        </Button>
      ) : null}
    </div>
  );
}

/* ── Sticky action bar ───────────────────────────────────────────────── */

// The primary action of a form or payment screen. On phones it sticks to the
// bottom, above the tab bar and the home indicator; on desktop it sits inline.
// Pass edge on pages without a bottom tab bar (admin and staff portals).
export function StickyActionBar({ children, className, edge = false }) {
  return (
    <div
      className={cx(
        edge ? "cx-safe-bottom sticky bottom-0 z-20" : "sticky bottom-[calc(64px+env(safe-area-inset-bottom))] z-20",
        " -mx-4 mt-6 border-t border-cx-line bg-cx-surface/95 px-4 py-3 backdrop-blur",
        "md:static md:mx-0 md:mt-8 md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none",
        className
      )}
    >
      <div className="flex gap-3">{children}</div>
    </div>
  );
}

/* ── Sheet: bottom sheet on phones, centred dialog on desktop ─────────── */

export function Sheet({ open, onOpenChange, title, description, children, footer, size = "md" }) {
  const width = size === "lg" ? "md:max-w-2xl" : size === "sm" ? "md:max-w-sm" : "md:max-w-lg";
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open ? (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-[70] bg-cx-ink/50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              />
            </Dialog.Overlay>
            <div className="fixed inset-0 z-[70] flex items-end justify-center md:items-center md:p-6">
              <Dialog.Content
                asChild
                forceMount
                // A confirm sheet stacked on top of this one is "outside" it;
                // don't let interacting with it close this sheet.
                onPointerDownOutside={(e) => e.target?.closest?.('[role="dialog"]') && e.preventDefault()}
                onFocusOutside={(e) => e.target?.closest?.('[role="dialog"]') && e.preventDefault()}
              >
                <motion.div
                  className={cx(
                    "flex max-h-[92dvh] w-full flex-col rounded-t-[22px] bg-cx-surface shadow-cx-raised md:rounded-cx-lg",
                    width
                  )}
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 40, opacity: 0 }}
                  transition={{ type: "spring", damping: 30, stiffness: 360 }}
                >
                  <div className="mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-cx-line-strong md:hidden" aria-hidden />
                  <div className="flex items-start justify-between gap-3 px-5 pb-2 pt-3 md:pt-5">
                    <div className="min-w-0">
                      <Dialog.Title className="text-lg font-semibold text-cx-ink">{title}</Dialog.Title>
                      {description ? (
                        <Dialog.Description className="mt-0.5 text-sm text-cx-muted">{description}</Dialog.Description>
                      ) : (
                        <Dialog.Description className="sr-only">{title}</Dialog.Description>
                      )}
                    </div>
                    <Dialog.Close asChild>
                      <IconButton label="Close" icon={X} className="-mr-2 -mt-1" />
                    </Dialog.Close>
                  </div>
                  <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">{children}</div>
                  {footer ? (
                    <div className="cx-safe-bottom border-t border-cx-line px-5 py-3">
                      <div className="flex gap-3">{footer}</div>
                    </div>
                  ) : (
                    <div className="cx-safe-bottom" />
                  )}
                </motion.div>
              </Dialog.Content>
            </div>
          </Dialog.Portal>
        ) : null}
      </AnimatePresence>
    </Dialog.Root>
  );
}

/* ── Rows ────────────────────────────────────────────────────────────── */

export function DetailRow({ label, value, className }) {
  return (
    <div className={cx("flex items-start justify-between gap-4 py-2.5", className)}>
      <dt className="text-sm text-cx-muted">{label}</dt>
      <dd className="min-w-0 text-right text-sm font-medium text-cx-ink break-words">{value ?? "—"}</dd>
    </div>
  );
}
