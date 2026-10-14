import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check, ChevronRight, Receipt } from "lucide-react";
import { Container, Eyebrow } from "@/app/components/marketing/ui";
import { Reveal } from "@/app/components/marketing/motion";
import { ServiceCta, ServiceStatusPill } from "./_status";

// Server-rendered building blocks shared by /services/[slug] and
// /services/[slug]/[child]. Client primitives (Reveal, Eyebrow) are used only
// as islands with plain serialisable props — never pass icon components to
// them; render <Icon /> here on the server and hand it over as children.

/** Home / Services / … trail. `items` = [{ href?, label }], last item is current. */
export function Breadcrumb({ items }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[13px] text-mk-muted">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${item.label}-${i}`} className="flex items-center gap-1.5">
              {item.href && !last ? (
                <Link href={item.href} className="mk-focus inline-flex min-h-[44px] items-center rounded transition-colors hover:text-mk-ink">
                  {item.label}
                </Link>
              ) : (
                <span className="font-medium text-mk-ink-2" aria-current={last ? "page" : undefined}>
                  {item.label}
                </span>
              )}
              {!last && <ChevronRight className="h-3.5 w-3.5 text-mk-line-strong" aria-hidden />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** Light hero band for a detail page. */
export function DetailHero({ breadcrumb, icon: Icon, status, eyebrow, title, lead, children }) {
  return (
    <section className="relative overflow-hidden border-b border-mk-line bg-mk-surface">
      <div aria-hidden className="mk-grid-bg pointer-events-none absolute inset-0" />
      <div aria-hidden className="mk-glow pointer-events-none absolute -top-48 right-[-10%] h-[420px] w-[620px]" />
      <Container className="relative pb-12 pt-8 sm:pb-16 sm:pt-10 lg:pb-20">
        <Breadcrumb items={breadcrumb} />
        <Reveal className="mt-8 max-w-3xl sm:mt-10">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-[14px] bg-cx-brand-soft text-cx-brand-deep shadow-[inset_0_0_0_1px_rgba(40,167,69,0.18)]">
              <Icon className="h-6 w-6" aria-hidden />
            </span>
            {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
            <ServiceStatusPill status={status} />
          </div>
          <h1
            className="mt-6 font-semibold tracking-[-0.03em] text-mk-ink text-balance"
            style={{ fontSize: "clamp(1.9rem, 2.6vw + 1rem, 3.1rem)", lineHeight: 1.08 }}
          >
            {title}
          </h1>
          {lead ? <p className="mt-4 max-w-2xl text-[16px] leading-relaxed text-mk-ink-2 text-pretty sm:text-[17px]">{lead}</p> : null}
          {children ? <div className="mt-7 flex flex-wrap items-center gap-3">{children}</div> : null}
        </Reveal>
      </Container>
    </section>
  );
}

/** Two-column "what's included / what you bring" checklist card. */
export function ChecklistCard({ included, bring, title }) {
  const cols = [
    { heading: "What's included", items: included },
    { heading: "What you bring", items: bring },
  ].filter((c) => c.items && c.items.length > 0);
  if (cols.length === 0) return null;
  const ColHeading = title ? "h3" : "h2";
  return (
    <Reveal className="overflow-hidden rounded-mk-lg border border-mk-line bg-mk-surface shadow-mk-sm">
      {title ? (
        <div className="border-b border-mk-line px-5 py-4 sm:px-7">
          <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-mk-ink">{title}</h2>
        </div>
      ) : null}
      <div className="grid grid-cols-1 divide-y divide-mk-line sm:grid-cols-2 sm:divide-x sm:divide-y-0">
        {cols.map((col) => (
          <div key={col.heading} className="p-5 sm:p-7">
            <ColHeading className="font-mono text-[11.5px] font-medium uppercase tracking-[0.14em] text-mk-muted">{col.heading}</ColHeading>
            <ul className="mt-4 space-y-3">
              {col.items.map((item) => (
                <li key={item} className="flex items-start gap-3 text-[14.5px] leading-relaxed text-mk-ink-2">
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cx-brand-soft text-cx-brand-deep">
                    <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Reveal>
  );
}

/** Sticky side card with status / price note and the CTA. Put it as a direct grid child. */
export function SideCard({ icon: Icon, title, status, pricingNote, children }) {
  const live = status !== "coming_soon" && status !== "off_sale";
  return (
    <Reveal delay={0.08} className="lg:sticky lg:top-24 lg:self-start">
      <div className="mk-gradient-border rounded-mk-lg p-6 shadow-mk sm:p-7">
        <div className="flex items-start justify-between gap-3">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cx-brand to-cx-brand-deep text-white shadow-mk-brand">
            <Icon className="h-5 w-5" aria-hidden />
          </span>
          {live ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-cx-brand/20 bg-cx-brand-soft px-2.5 py-1 text-[11.5px] font-medium text-cx-brand-deep">
              <span className="mk-pulse-dot h-1.5 w-1.5 rounded-full bg-cx-brand" aria-hidden />
              Available now
            </span>
          ) : (
            <ServiceStatusPill status={status} />
          )}
        </div>
        <p className="mt-5 text-[17px] font-semibold tracking-[-0.01em] text-mk-ink">{title}</p>

        <div className="mt-5 rounded-mk border border-mk-line bg-mk-bg p-4">
          <p className="flex items-center gap-1.5 font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-mk-muted">
            <Receipt className="h-3.5 w-3.5" aria-hidden />
            Pricing
          </p>
          <p className="mt-2 text-[13.5px] leading-relaxed text-mk-ink-2">
            {pricingNote || (live ? "Priced live from what we actually charge — configure it to see your exact total." : "Pricing will be published when this service opens.")}
          </p>
          {live ? (
            <Link
              href="/pricing"
              className="mk-focus group mt-3 inline-flex min-h-[44px] items-center gap-1.5 rounded text-[13.5px] font-semibold text-cx-brand-deep"
            >
              See live pricing
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
            </Link>
          ) : null}
        </div>

        <ServiceCta status={status} className="mt-5 w-full" />
        {children ? <div className="mt-3">{children}</div> : null}
      </div>
    </Reveal>
  );
}

/** Section label used above lists in the main column. */
export function BlockHeading({ eyebrow, title }) {
  return (
    <div className="mb-5">
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <h2 className="mt-3 text-[22px] font-semibold tracking-[-0.02em] text-mk-ink sm:text-[24px]">{title}</h2>
    </div>
  );
}

/** Linked sub-service card (children / siblings). */
export function SubServiceCard({ href, title, blurb, status }) {
  return (
    <Link
      href={href}
      className="mk-focus mk-lift group flex h-full flex-col justify-between rounded-mk-lg border border-mk-line bg-mk-surface p-5 shadow-mk-sm hover:border-mk-line-strong sm:p-6"
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-[16px] font-semibold leading-snug tracking-[-0.01em] text-mk-ink">{title}</h3>
          <ServiceStatusPill status={status} />
        </div>
        <p className="mt-2 text-[14px] leading-relaxed text-mk-muted">{blurb}</p>
      </div>
      <span className="mt-5 inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-cx-brand-deep">
        Learn more
        <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
      </span>
    </Link>
  );
}
