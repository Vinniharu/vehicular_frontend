import { SERVICES } from "./_data";
import ServiceCard from "@/app/components/marketing/ServiceCard";
import { Container, PageHero } from "@/app/components/marketing/ui";
import { Stagger, StaggerItem } from "@/app/components/marketing/motion";

export const metadata = {
  title: "Services | Vehiculars",
  description: "Everything your vehicle needs, handled end-to-end and delivered nationwide — driver's licence, number plates, particulars, and inspections.",
};

export default function ServicesHubPage() {
  return (
    <div>
      <PageHero
        eyebrow="All services"
        title="Everything your vehicle needs,"
        accent="in one place"
        description="From your first driver's licence to your vehicle particulars — we submit and follow up with the relevant authority on your behalf so you don't have to queue."
      />

      <section className="py-14 sm:py-20 lg:py-24">
        <Container>
          <Stagger gap={0.05} className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {SERVICES.map((service) => (
              <StaggerItem key={service.slug} className="flex [&>*]:w-full">
                <ServiceCard
                  href={`/services/${service.slug}`}
                  title={service.title}
                  description={service.tagline}
                  icon={service.icon}
                  status={service.status}
                  variant="hub"
                  headingTag="h2"
                />
              </StaggerItem>
            ))}
          </Stagger>
        </Container>
      </section>
    </div>
  );
}
