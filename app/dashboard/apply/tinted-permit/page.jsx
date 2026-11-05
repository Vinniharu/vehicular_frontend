"use client";

import { useRouter } from "next/navigation";
import { RefreshCw, ShieldCheck } from "lucide-react";
import { colors } from "@/lib/design-tokens";

const BRAND = colors.primary.DEFAULT;

const PERMIT_OPTIONS = [
  {
    application_type: "tinted_permit",
    icon: ShieldCheck,
    title: "New permit",
    desc: "First tinted permit for this vehicle. You'll need your NIN, ownership and vehicle documents, and vehicle photos.",
  },
  {
    application_type: "tinted_permit_renewal",
    icon: RefreshCw,
    title: "Renewal",
    desc: "Your permit has expired or is about to. You only need your NIN, a passport photograph and the expired permit.",
  },
];

// Existing applications live on the unified /dashboard/applications list, so
// this page is only the wizard entry point. Both options go through the
// requirements screen, which shows what's needed before the form opens.
export default function TintedPermitPage() {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-4xl space-y-8 py-6 pb-20">
      <div>
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: BRAND }} />
          <span className="text-xs font-bold text-cx-muted">Tinted permit</span>
        </div>
        <h1
          className="mt-1.5 text-[30px] tracking-tight text-cx-ink"
          style={{ fontFamily: "var(--font-display-serif)", fontWeight: 500 }}
        >
          Tinted glass permit
        </h1>
        <p className="mt-1 text-sm text-cx-muted">Is this a new permit, or are you renewing one?</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {PERMIT_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          return (
            <button
              key={opt.application_type}
              type="button"
              onClick={() => router.push(`/dashboard/apply/requirements?type=${opt.application_type}`)}
              className="flex flex-col items-start gap-2.5 rounded-cx-lg border border-cx-line bg-white p-5 text-left transition-all hover:border-[#28A745]/60 hover:shadow-md"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "#F0FDF4", color: BRAND }}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="text-[14px] font-bold text-cx-ink">{opt.title}</p>
              <p className="text-[12.5px] leading-relaxed text-cx-muted">{opt.desc}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
