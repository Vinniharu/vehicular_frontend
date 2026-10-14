import Link from "next/link";
import { ArrowRight } from "lucide-react";

// Copy + styling for every non-"live" status — shared by the hub grid, the
// parent detail page, and the child detail page, so a status reads the same
// everywhere a customer can see it.
export const STATUS_META = {
  coming_soon: { badge: "Coming soon", pillClass: "border-mk-line bg-mk-ink/[0.04] text-mk-muted" },
  off_sale: { badge: "Off sale", pillClass: "border-cx-amber/20 bg-cx-amber-soft text-cx-amber" },
};

/** Small pill for grid/card contexts — renders nothing for "live". */
export function ServiceStatusPill({ status, className = "" }) {
  const meta = STATUS_META[status];
  if (!meta) return null;
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11.5px] font-medium ${meta.pillClass} ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60" aria-hidden />
      {meta.badge}
    </span>
  );
}

/**
 * Hero-area call to action. "live" renders the real signup button; anything
 * else renders a muted, non-clickable status pill instead — a service that
 * isn't actually purchasable yet should never imply it is via a "Get
 * started" button.
 */
export function ServiceCta({ status, className = "" }) {
  if (status !== "coming_soon" && status !== "off_sale") {
    return (
      <Link
        href="/auth/signup"
        className={`mk-focus mk-shine group inline-flex h-12 items-center justify-center gap-2 rounded-full bg-cx-brand px-7 text-[15px] font-semibold text-white shadow-mk-brand transition-colors duration-300 hover:bg-cx-brand-deep active:scale-[0.98] ${className}`}
      >
        Get started
        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
      </Link>
    );
  }
  const meta = STATUS_META[status];
  return (
    <span
      className={`inline-flex h-12 items-center justify-center rounded-full border px-6 text-[14.5px] font-semibold ${meta.pillClass} ${className}`}
    >
      {status === "off_sale" ? "Off sale — quote on request" : meta.badge}
    </span>
  );
}
