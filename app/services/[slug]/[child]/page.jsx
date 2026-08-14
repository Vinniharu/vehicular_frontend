import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ArrowLeft, ChevronRight } from "lucide-react";
import { SERVICES, getChild } from "../../_data";
import { ServiceCta, ServiceStatusPill } from "../../_status";

export function generateStaticParams() {
  const params = [];
  for (const service of SERVICES) {
    if (!service.children) continue;
    for (const child of service.children) {
      params.push({ slug: service.slug, child: child.slug });
    }
  }
  return params;
}

export async function generateMetadata({ params }) {
  const { slug, child: childSlug } = await params;
  const result = getChild(slug, childSlug);
  if (!result) return {};
  return {
    title: `${result.child.title} | Vehiculars`,
    description: result.child.blurb,
  };
}

export default async function ServiceChildPage({ params }) {
  const { slug, child: childSlug } = await params;
  const result = getChild(slug, childSlug);
  if (!result) notFound();

  const { service, child } = result;
  const siblings = service.children.filter((c) => c.slug !== child.slug);
  const Icon = service.icon;

  return (
    <div>
      {/* Breadcrumb */}
      <div className="px-5 md:px-8 pt-6">
        <div className="mx-auto max-w-3xl flex flex-wrap items-center gap-1.5 text-[12.5px] text-[#111111]/50">
          <Link href="/" className="hover:text-[#111111]">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/services" className="hover:text-[#111111]">Services</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href={`/services/${service.slug}`} className="hover:text-[#111111]">{service.title}</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-[#111111]/80 font-medium">{child.title}</span>
        </div>
      </div>

      {/* Hero */}
      <section className="px-5 md:px-8 pt-8 pb-14">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#28A745]/10 text-[#28A745]">
              <Icon className="h-6 w-6" />
            </span>
            <ServiceStatusPill status={child.status} />
          </div>
          <h1 className="mt-5 font-display text-[28px] sm:text-[34px] font-medium leading-tight text-[#111111]">
            {child.title}
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-[#111111]/65">{child.blurb}</p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <ServiceCta status={child.status} />
            <Link
              href={`/services/${service.slug}`}
              className="inline-flex items-center gap-2 rounded-xl text-[14px] font-semibold text-[#111111]"
              style={{ border: "1px solid rgba(17, 17, 17,0.15)", padding: "11px 24px" }}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to {service.title}
            </Link>
          </div>
        </div>
      </section>

      {/* Sibling services */}
      {siblings.length > 0 && (
        <section className="px-5 md:px-8 pb-20">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-[12px] font-bold uppercase tracking-wide text-[#111111]/50 mb-5">
              Other {service.title.toLowerCase()}
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {siblings.map((sibling) => (
                <Link
                  key={sibling.slug}
                  href={`/services/${service.slug}/${sibling.slug}`}
                  className="group flex flex-col justify-between rounded-2xl bg-white p-5 transition-transform duration-200 hover:-translate-y-1"
                  style={{ border: "1px solid rgba(17, 17, 17,0.08)" }}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-display text-[15.5px] font-medium leading-tight text-[#111111]">{sibling.title}</h3>
                      <ServiceStatusPill status={sibling.status} />
                    </div>
                    <p className="mt-2 text-[13px] leading-relaxed text-[#111111]/60">{sibling.blurb}</p>
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
