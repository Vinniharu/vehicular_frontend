"use client";

import { useRouter } from "next/navigation";
import { Hash, Repeat, FileSignature, Sparkles, Building2 } from "lucide-react";
import { colors } from "@/lib/design-tokens";

const BRAND = colors.primary.DEFAULT;

const PLATE_SERVICE_OPTIONS = [
  {
    type: "new",
    icon: Hash,
    title: "New plate",
    desc: "Newly bought or imported vehicle — register a fresh plate.",
  },
  {
    type: "replacement",
    icon: Repeat,
    title: "Replacement",
    desc: "Lost or damaged plate — get a replacement issued.",
  },
  {
    type: "change-of-ownership",
    icon: FileSignature,
    title: "Change of ownership",
    desc: "Just bought a used vehicle — transfer ownership and get a fresh plate.",
  },
  {
    type: "fancy",
    icon: Sparkles,
    title: "Fancy plate",
    desc: "Choose your own custom plate number for a fresh registration.",
  },
  {
    type: "dealership",
    icon: Building2,
    title: "Dealership plate",
    desc: "For registered dealerships — a plate issued against your company's identity, no vehicle required.",
  },
];

// Existing applications now live on the unified /dashboard/applications
// list — this page is the wizard entry point only (pick a plate type,
// land on the new?type= wizard).
export default function NumberPlateApplicationsPage() {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-4xl space-y-8 py-6 pb-20">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: BRAND }} />
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Number plate</span>
        </div>
        <h1
          className="mt-1.5 text-[30px] tracking-tight text-[#111111]"
          style={{ fontFamily: "var(--font-display-serif)", fontWeight: 500 }}
        >
          Number / dealership plate services
        </h1>
        <p className="mt-1 text-[13.5px] text-slate-500">
          Pick what you need — we'll handle the VIO processing end-to-end.
        </p>
      </div>

      {/* Service-type picker */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {PLATE_SERVICE_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          return (
            <button
              key={opt.type}
              type="button"
              onClick={() => router.push(`/dashboard/apply/number-plate/new?type=${opt.type}`)}
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
