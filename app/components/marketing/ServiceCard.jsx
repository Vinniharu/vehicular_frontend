import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import ServiceIcon from "./ServiceIcon";
import { ServiceStatusPill } from "@/app/services/_status";

/**
 * Shared "browse services, link out to /services/[slug]" card — used by
 * the services hub grid (variant="hub") and the homepage Services bento
 * (variant="landing", where `featured` items get the wider gradient-border
 * treatment). Deliberately has no "use client" and no motion/ui imports:
 * app/services/page.jsx is server-rendered and must not gain a client
 * bundle by using this. Hover polish is CSS only (mk-lift).
 *
 * app/pricing/page.jsx's ServiceCard is intentionally NOT unified into
 * this component — it's an expand/collapse toggle with an inline
 * calculator, not a link. It reuses ServiceIcon instead.
 */
export default function ServiceCard({
  href,
  title,
  description,
  icon,
  status,
  variant = "hub", // "hub" | "landing"
  featured = false,
  headingTag: Heading = "h3",
}) {
  if (variant === "landing") {
    return (
      <Link
        href={href}
        className={`mk-focus mk-lift group relative flex h-full flex-col justify-between overflow-hidden rounded-mk-lg ${
          featured
            ? "mk-gradient-border shadow-mk p-6 sm:p-8 min-h-[220px]"
            : "border border-mk-line bg-mk-surface shadow-mk-sm hover:border-mk-line-strong p-5 sm:p-6 min-h-[180px]"
        }`}
      >
        {featured && (
          <>
            <div aria-hidden className="mk-grid-bg pointer-events-none absolute inset-0 opacity-60" />
            <div
              aria-hidden
              className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full opacity-70 transition-opacity duration-500 group-hover:opacity-100"
              style={{ background: "radial-gradient(closest-side, rgba(40,167,69,0.16), transparent)" }}
            />
          </>
        )}
        <div className="relative">
          <div className="flex items-start justify-between gap-3">
            <ServiceIcon icon={icon} tone={featured ? "brandStrong" : "brand"} size={featured ? "lg" : "md"} />
            <span
              aria-hidden
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-mk-line text-mk-muted transition-colors duration-300 group-hover:border-cx-brand/30 group-hover:bg-cx-brand-soft group-hover:text-cx-brand-deep"
            >
              <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-px group-hover:translate-x-px" />
            </span>
          </div>
          <Heading
            className={`mt-5 font-semibold tracking-[-0.02em] text-mk-ink leading-tight ${
              featured ? "text-[20px] sm:text-[22px]" : "text-[16.5px]"
            }`}
          >
            {title}
          </Heading>
          <p className={`mt-2 leading-relaxed text-mk-muted ${featured ? "text-[15px] max-w-sm" : "text-[14px]"}`}>{description}</p>
        </div>
        <span className="relative mt-5 inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-cx-brand-deep">
          View details
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
        </span>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className="mk-focus mk-lift group flex flex-col justify-between rounded-mk-lg border border-mk-line bg-mk-surface p-6 shadow-mk-sm hover:border-mk-line-strong"
    >
      <div>
        <div className="flex items-start justify-between gap-2">
          <ServiceIcon icon={icon} tone="brand" />
          <ServiceStatusPill status={status} />
        </div>
        <Heading className="mt-5 text-[17px] font-semibold tracking-[-0.02em] leading-tight text-mk-ink">{title}</Heading>
        <p className="mt-2 text-[14px] leading-relaxed text-mk-muted">{description}</p>
      </div>
      <span className="mt-5 inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-cx-brand-deep">
        View details
        <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
      </span>
    </Link>
  );
}
