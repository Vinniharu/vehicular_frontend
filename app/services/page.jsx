import { SERVICES } from "./_data";
import ServiceCard from "@/app/components/marketing/ServiceCard";

export const metadata = {
  title: "Services | Vehiculars",
  description: "Everything your vehicle needs, handled end-to-end and delivered nationwide — driver's licence, number plates, particulars, and inspections.",
};

export default function ServicesHubPage() {
  return (
    <div>
      <section className="px-5 md:px-8 pt-16 pb-10">
        <div className="mx-auto max-w-6xl text-center">
          <span className="inline-flex items-center rounded-full px-3 py-1 text-[12px] font-semibold" style={{ background: "#E9F7EC", color: "#166B2C" }}>
            All services
          </span>
          <h1 className="mt-4 font-display text-[32px] sm:text-[42px] font-medium leading-tight text-[#111111]">
            Everything your vehicle needs, in one place
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-[15px] leading-relaxed text-[#111111]/60">
            From your first driver's licence to your vehicle particulars — we handle the FRSC,
            VIO, and police end of it so you don't have to queue.
          </p>
        </div>
      </section>

      <section className="px-5 md:px-8 pb-20">
        <div className="mx-auto max-w-6xl grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((service) => (
            <ServiceCard
              key={service.slug}
              href={`/services/${service.slug}`}
              title={service.title}
              description={service.tagline}
              icon={service.icon}
              status={service.status}
              variant="hub"
              headingTag="h2"
            />
          ))}
        </div>
      </section>
    </div>
  );
}
