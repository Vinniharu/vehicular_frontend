import Link from "next/link";
import { ArrowRight } from "lucide-react";

// Copy + styling for every non-"live" status — shared by the hub grid, the
// parent detail page, and the child detail page, so a status reads the same
// everywhere a customer can see it.
export const STATUS_META = {
  coming_soon: { badge: "Coming soon", pillClass: "bg-slate-100 text-slate-500" },
  off_sale: { badge: "Off sale", pillClass: "bg-amber-50 text-amber-700" },
};

/** Small pill for grid/card contexts — renders nothing for "live". */
export function ServiceStatusPill({ status, className = "" }) {
  const meta = STATUS_META[status];
  if (!meta) return null;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${meta.pillClass} ${className}`}>
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
export function ServiceCta({ status }) {
  if (status !== "coming_soon" && status !== "off_sale") {
    return (
      <Link
        href="/auth/signup"
        className="inline-flex items-center gap-2 rounded-xl text-[14px] font-semibold text-white"
        style={{ background: "#28A745", padding: "11px 24px" }}
      >
        Get started
        <ArrowRight className="h-4 w-4" />
      </Link>
    );
  }
  const meta = STATUS_META[status];
  return (
    <span className={`inline-flex items-center rounded-xl px-4 py-2.5 text-[14px] font-semibold ${meta.pillClass}`}>
      {status === "off_sale" ? "Off sale — quote on request" : meta.badge}
    </span>
  );
}
