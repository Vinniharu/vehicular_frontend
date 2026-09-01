import Link from "next/link";
import { ArrowRight } from "lucide-react";
import ServiceIcon from "./ServiceIcon";
import { ServiceStatusPill } from "@/app/services/_status";
import { INK, GOLD, INK_SOFT } from "@/app/components/landing/theme";

/**
 * Shared "browse services, link out to /services/[slug]" card — used by
 * the services hub grid (variant="hub") and the homepage Services section
 * (variant="landing", with the first two homepage items rendered in the
 * larger dark/gold "featured" treatment). Deliberately does NOT include
 * any motion/animation wrapper — the landing section's whileInView stagger
 * stays in Services.jsx itself, wrapping this component, so this stays
 * framework-agnostic and importable from the server-rendered hub page
 * without pulling framer-motion into that route.
 *
 * app/pricing/page.jsx's ServiceCard is intentionally NOT unified into
 * this component — it's an expand/collapse toggle with an inline
 * calculator, not a link, a genuinely different interaction model. It
 * reuses ServiceIcon instead.
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
        className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl transition-transform duration-200 hover:-translate-y-1 ${
          featured ? "p-6 sm:p-8 min-h-[200px]" : "p-5 sm:p-6"
        }`}
        style={{ background: featured ? INK : "#ffffff", border: featured ? `1px solid ${GOLD}33` : `1px solid ${INK}14` }}
      >
        {featured && (
          <div
            aria-hidden
            className="absolute -right-20 -top-20 h-40 w-40 rounded-full opacity-25"
            style={{ background: `radial-gradient(circle, ${GOLD}, transparent 70%)` }}
          />
        )}
        <div>
          <ServiceIcon icon={icon} tone={featured ? "onDark" : "brand"} />
          <Heading className="mt-4 font-display text-[18px] font-medium leading-tight" style={{ color: featured ? "#ffffff" : INK }}>
            {title}
          </Heading>
          <p className="mt-2 text-[14px] leading-relaxed" style={{ color: featured ? "rgba(255,255,255,0.55)" : INK_SOFT }}>
            {description}
          </p>
        </div>
        <span className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold" style={{ color: featured ? GOLD : "#28A745" }}>
          View details
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-1" />
        </span>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className="group flex flex-col justify-between rounded-2xl bg-white p-6 transition-transform duration-200 hover:-translate-y-1"
      style={{ border: "1px solid rgba(17, 17, 17,0.08)" }}
    >
      <div>
        <div className="flex items-start justify-between gap-2">
          <ServiceIcon icon={icon} tone="brand" />
          <ServiceStatusPill status={status} />
        </div>
        <Heading className="mt-4 font-display text-[18px] font-medium leading-tight text-[#111111]">{title}</Heading>
        <p className="mt-2 text-[13.5px] leading-relaxed text-[#111111]/60">{description}</p>
      </div>
      <span className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#28A745]">
        View details
        <ArrowRight className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-1" />
      </span>
    </Link>
  );
}
