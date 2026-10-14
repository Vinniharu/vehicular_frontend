import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { SERVICES, getChild } from "../../_data";
import { ServiceCta } from "../../_status";
import { BlockHeading, DetailHero, SideCard, SubServiceCard } from "../../_detail";
import { Container } from "@/app/components/marketing/ui";
import { Stagger, StaggerItem } from "@/app/components/marketing/motion";

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

  const backLink = (
    <Link
      href={`/services/${service.slug}`}
      className="mk-focus inline-flex h-12 items-center justify-center gap-2 rounded-full border border-mk-line-strong bg-mk-surface px-6 text-[14.5px] font-semibold text-mk-ink shadow-mk-sm transition-[border-color,box-shadow] duration-300 hover:border-mk-ink/30 hover:shadow-mk"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden />
      Back to {service.title}
    </Link>
  );

  return (
    <div>
      <DetailHero
        breadcrumb={[
          { href: "/", label: "Home" },
          { href: "/services", label: "Services" },
          { href: `/services/${service.slug}`, label: service.title },
          { label: child.title },
        ]}
        icon={Icon}
        status={child.status}
        title={child.title}
        lead={child.blurb}
      >
        <ServiceCta status={child.status} />
        {backLink}
      </DetailHero>

      <section className="py-12 sm:py-16 lg:py-20">
        <Container>
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-12">
            <div className="min-w-0">
              {/* Sibling services */}
              {siblings.length > 0 && (
                <div>
                  <BlockHeading eyebrow={service.title} title={`Other ${service.title.toLowerCase()}`} />
                  <Stagger gap={0.05} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {siblings.map((sibling) => (
                      <StaggerItem key={sibling.slug}>
                        <SubServiceCard
                          href={`/services/${service.slug}/${sibling.slug}`}
                          title={sibling.title}
                          blurb={sibling.blurb}
                          status={sibling.status}
                        />
                      </StaggerItem>
                    ))}
                  </Stagger>
                </div>
              )}
            </div>

            <SideCard icon={Icon} title={child.title} status={child.status} pricingNote={service.pricingNote} />
          </div>
        </Container>
      </section>
    </div>
  );
}
