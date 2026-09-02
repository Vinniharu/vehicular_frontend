"use client";

import { useRouter } from "next/navigation";
import { IdCard, RefreshCw, RotateCcw, Globe2 } from "lucide-react";
import { colors } from "@/lib/design-tokens";

const BRAND = colors.primary.DEFAULT;

// Copy mirrors the DL wizard's own step-1 type picker
// (app/dashboard/apply/page.jsx) — kept in sync deliberately, since this
// page and that step describe the exact same 4 options.
const DL_SERVICE_OPTIONS = [
  {
    application_type: "fresh",
    icon: IdCard,
    title: "Fresh application",
    desc: "First-time licence — includes driving school enrollment.",
  },
  {
    application_type: "renewal",
    icon: RefreshCw,
    title: "Renewal",
    desc: "Renew a licence that's expired or expiring soon.",
  },
  {
    application_type: "reissue",
    icon: RotateCcw,
    title: "Reissue",
    desc: "Replace a lost, stolen, or damaged licence.",
  },
  {
    application_type: "international_permit",
    icon: Globe2,
    title: "International Driver's Permit",
    desc: "Apply for an international driving permit.",
  },
];

// Existing applications now live on the unified /dashboard/applications
// list — this page is the wizard entry point only (pick a DL type, see
// what you'll need, then land on the wizard already on that type).
export default function DriversLicenceApplicationsPage() {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-4xl space-y-8 py-6 pb-20">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: BRAND }} />
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Driver's licence</span>
        </div>
        <h1
          className="mt-1.5 text-[30px] tracking-tight text-[#111111]"
          style={{ fontFamily: "var(--font-display-serif)", fontWeight: 500 }}
        >
          Driver's licence services
        </h1>
        <p className="mt-1 text-[13.5px] text-slate-500">
          Pick what you need — we'll show you exactly what to bring before you start.
        </p>
      </div>

      {/* Service-type picker */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {DL_SERVICE_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          return (
            <button
              key={opt.application_type}
              type="button"
              onClick={() => router.push(`/dashboard/apply/requirements?type=${opt.application_type}`)}
              className="flex flex-col items-start gap-2.5 rounded-2xl border border-[#E5E5E5] bg-white p-5 text-left transition-all hover:border-[#28A745]/60 hover:shadow-md"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "#F0FDF4", color: BRAND }}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="text-[14px] font-bold text-[#111111]">{opt.title}</p>
              <p className="text-[12.5px] leading-relaxed text-slate-500">{opt.desc}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
