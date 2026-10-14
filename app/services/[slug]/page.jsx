import { notFound } from "next/navigation";
import { SERVICES, getService } from "../_data";
import { ServiceCta } from "../_status";
import { BlockHeading, ChecklistCard, DetailHero, SideCard, SubServiceCard } from "../_detail";
import ServiceCard from "@/app/components/marketing/ServiceCard";
import { Container } from "@/app/components/marketing/ui";
import { Reveal, Stagger, StaggerItem } from "@/app/components/marketing/motion";

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

/** Up to 3 other services, same category first. */
function relatedServices(service) {
  const others = SERVICES.filter((s) => s.slug !== service.slug);
  const same = others.filter((s) => s.category && s.category === service.category);
  const rest = others.filter((s) => !same.includes(s));
  return [...same, ...rest].slice(0, 3);
}

export default async function ServicePage({ params }) {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) notFound();

  const Icon = service.icon;
  const related = relatedServices(service);

  return (
    <div>
      <DetailHero
        breadcrumb={[{ href: "/", label: "Home" }, { href: "/services", label: "Services" }, { label: service.title }]}
        icon={Icon}
        status={service.status}
        title={service.title}
        lead={service.tagline}
      >
        <ServiceCta status={service.status} />
        {service.pricingNote && <span className="max-w-md text-[13.5px] leading-relaxed text-mk-muted">{service.pricingNote}</span>}
      </DetailHero>

      <section className="py-12 sm:py-16 lg:py-20">
        <Container>
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-12">
            <div className="min-w-0 space-y-14">
              <Reveal>
                <p className="max-w-2xl text-[16px] leading-[1.75] text-mk-ink-2 sm:text-[17px]">{service.intro}</p>
              </Reveal>

              {/* What's included / What you bring */}
              <ChecklistCard included={service.whatsIncluded} bring={service.whatYouBring} />

              {/* How it works */}
              <div>
                <BlockHeading eyebrow="Process" title="How it works" />
                <Stagger as="ol" gap={0.06} className="space-y-3">
                  {service.howItWorks.map((step, i) => (
                    <StaggerItem
                      as="li"
                      key={step.title}
                      className="relative flex items-start gap-4 rounded-mk-lg border border-mk-line bg-mk-surface p-4 shadow-mk-sm sm:p-5"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cx-brand-soft font-mono text-[13px] font-semibold text-cx-brand-deep shadow-[inset_0_0_0_1px_rgba(40,167,69,0.2)]">
                        {i + 1}
                      </span>
                      <div>
                        <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-mk-ink">{step.title}</h3>
                        <p className="mt-1 text-[14px] leading-relaxed text-mk-muted">{step.desc}</p>
                      </div>
                    </StaggerItem>
                  ))}
                </Stagger>
              </div>

              {/* Child services */}
              {service.children && service.children.length > 0 && (
                <div>
                  <BlockHeading eyebrow="Options" title={`Explore ${service.title}`} />
                  <Stagger gap={0.05} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {service.children.map((child) => (
                      <StaggerItem key={child.slug}>
                        <SubServiceCard
                          href={`/services/${service.slug}/${child.slug}`}
                          title={child.title}
                          blurb={child.blurb}
                          status={child.status}
                        />
                      </StaggerItem>
                    ))}
                  </Stagger>
                </div>
              )}
            </div>

            <SideCard icon={Icon} title={service.title} status={service.status} pricingNote={service.pricingNote} />
          </div>
        </Container>
      </section>

      {/* Related services */}
      {related.length > 0 && (
        <section className="border-t border-mk-line bg-mk-surface py-14 sm:py-20">
          <Container>
            <BlockHeading eyebrow="Keep going" title="Related services" />
            <Stagger gap={0.05} className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
              {related.map((s) => (
                <StaggerItem key={s.slug} className="flex [&>*]:w-full">
                  <ServiceCard
                    href={`/services/${s.slug}`}
                    title={s.title}
                    description={s.tagline}
                    icon={s.icon}
                    status={s.status}
                    variant="hub"
                    headingTag="h3"
                  />
                </StaggerItem>
              ))}
            </Stagger>
          </Container>
        </section>
      )}
    </div>
  );
}
