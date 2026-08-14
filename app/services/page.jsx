import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SERVICES } from "./_data";
import { ServiceStatusPill } from "./_status";

export const metadata = {
  title: "Services | Vehiculars",
  description: "Everything your vehicle needs, handled end-to-end and delivered nationwide — driver's licence, number plates, particulars, inspections, spare parts, and more.",
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
            From your first driver's licence to clearing a car at the port — we handle the FRSC,
            VIO, police, and customs end of it so you don't have to queue.
          </p>
        </div>
      </section>

      <section className="px-5 md:px-8 pb-20">
        <div className="mx-auto max-w-6xl grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((service) => {
            const Icon = service.icon;
            return (
              <Link
                key={service.slug}
                href={`/services/${service.slug}`}
                className="group flex flex-col justify-between rounded-2xl bg-white p-6 transition-transform duration-200 hover:-translate-y-1"
                style={{ border: "1px solid rgba(17, 17, 17,0.08)" }}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#28A745]/10 text-[#28A745]">
                      <Icon className="h-5 w-5" />
                    </span>
                    <ServiceStatusPill status={service.status} />
                  </div>
                  <h2 className="mt-4 font-display text-[18px] font-medium leading-tight text-[#111111]">
                    {service.title}
                  </h2>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-[#111111]/60">{service.tagline}</p>
                </div>
                <span className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#28A745]">
                  View details
                  <ArrowRight className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-1" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
