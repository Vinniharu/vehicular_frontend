import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ChevronRight, Check } from "lucide-react";
import { SERVICES, getService } from "../_data";
import { ServiceCta, ServiceStatusPill } from "../_status";

export function generateStaticParams() {
  return SERVICES.map((service) => ({ slug: service.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) return {};
  return {
    title: `${service.title} | Vehiculars`,
    description: service.tagline,
  };
}

export default async function ServicePage({ params }) {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) notFound();

  const Icon = service.icon;

  return (
    <div>
      {/* Breadcrumb */}
      <div className="px-5 md:px-8 pt-6">
        <div className="mx-auto max-w-4xl flex items-center gap-1.5 text-[12.5px] text-[#111111]/50">
          <Link href="/" className="hover:text-[#111111]">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/services" className="hover:text-[#111111]">Services</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-[#111111]/80 font-medium">{service.title}</span>
        </div>
      </div>

      {/* Hero */}
      <section className="px-5 md:px-8 pt-8 pb-10">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#28A745]/10 text-[#28A745]">
              <Icon className="h-6 w-6" />
            </span>
            <ServiceStatusPill status={service.status} />
          </div>
          <h1 className="mt-5 font-display text-[30px] sm:text-[38px] font-medium leading-tight text-[#111111]">
            {service.title}
          </h1>
          <p className="mt-3 max-w-2xl text-[15.5px] leading-relaxed text-[#111111]/65">{service.tagline}</p>
          <p className="mt-4 max-w-2xl text-[14.5px] leading-relaxed text-[#111111]/55">{service.intro}</p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <ServiceCta status={service.status} />
            {service.pricingNote && (
              <span className="text-[13px] text-[#111111]/55">{service.pricingNote}</span>
            )}
          </div>
        </div>
      </section>

      {/* What's included / What you bring */}
      <section className="px-5 md:px-8 pb-10">
        <div className="mx-auto max-w-4xl grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="rounded-2xl bg-white p-6" style={{ border: "1px solid rgba(17, 17, 17,0.08)" }}>
            <h2 className="text-[12px] font-bold uppercase tracking-wide text-[#111111]/50">What's included</h2>
            <ul className="mt-4 space-y-3">
              {service.whatsIncluded.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-[14px] leading-relaxed text-[#111111]/75">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#28A745]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl bg-white p-6" style={{ border: "1px solid rgba(17, 17, 17,0.08)" }}>
            <h2 className="text-[12px] font-bold uppercase tracking-wide text-[#111111]/50">What you bring</h2>
            <ul className="mt-4 space-y-3">
              {service.whatYouBring.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-[14px] leading-relaxed text-[#111111]/75">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#28A745]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-5 md:px-8 pb-14">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-[12px] font-bold uppercase tracking-wide text-[#111111]/50 mb-5">How it works</h2>
          <ol className="space-y-4">
            {service.howItWorks.map((step, i) => (
              <li key={step.title} className="flex items-start gap-4 rounded-2xl bg-white p-5" style={{ border: "1px solid rgba(17, 17, 17,0.08)" }}>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#28A745]/10 font-mono text-[13px] font-bold text-[#28A745]">
                  {i + 1}
                </span>
                <div>
                  <h3 className="text-[14.5px] font-semibold text-[#111111]">{step.title}</h3>
                  <p className="mt-1 text-[13.5px] leading-relaxed text-[#111111]/60">{step.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Child services */}
      {service.children && service.children.length > 0 && (
        <section className="px-5 md:px-8 pb-20">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-[12px] font-bold uppercase tracking-wide text-[#111111]/50 mb-5">
              Explore {service.title}
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {service.children.map((child) => (
                <Link
                  key={child.slug}
                  href={`/services/${service.slug}/${child.slug}`}
                  className="group flex flex-col justify-between rounded-2xl bg-white p-5 transition-transform duration-200 hover:-translate-y-1"
                  style={{ border: "1px solid rgba(17, 17, 17,0.08)" }}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-display text-[16px] font-medium leading-tight text-[#111111]">{child.title}</h3>
                      <ServiceStatusPill status={child.status} />
                    </div>
                    <p className="mt-2 text-[13px] leading-relaxed text-[#111111]/60">{child.blurb}</p>
                  </div>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[#28A745]">
                    Learn more
                    <ArrowRight className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-1" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
