"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  ChevronRight,
  Clock,
  ExternalLink,
  FileText,
  Hash,
  RefreshCw,
  Repeat,
  FileSignature,
  Sparkles,
} from "lucide-react";
import { getMyApplications, getWallet, payFromWalletEndpoint } from "@/lib/api";
import PartialPayControls from "@/app/components/dashboard/PartialPayControls";
import StatusBadge from "@/app/dashboard/_shared/StatusBadge";
import { btnPrimary, btnGhost } from "@/app/dashboard/_shared/ui";
import { colors } from "@/lib/design-tokens";
import {
  koboToNaira,
  formatDate,
  MiniProgressRing,
  isApplicationPaid,
  paymentStatusMeta,
} from "@/app/dashboard/_shared/apply-helpers";

const BRAND = colors.primary.DEFAULT;

// Mirrors app/core/payment_helpers.py's confirmed defaults — only used as a
// fallback label while payment_options hasn't loaded yet.
const PLATE_TYPE_META = {
  number_plate_new: { label: "New plate", fallbackFeeKobo: 10_500_000 },
  number_plate_replacement: { label: "Replacement", fallbackFeeKobo: 10_500_000 },
  number_plate_change_of_ownership: { label: "Change of ownership", fallbackFeeKobo: 12_000_000 },
  number_plate_fancy: { label: "Fancy plate", fallbackFeeKobo: 12_500_000 },
};

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
];

export default function NumberPlateApplicationsPage() {
  const router = useRouter();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState(0);
  const [payingFromWallet, setPayingFromWallet] = useState(null);
  const payingFromWalletRef = useRef(false);
  const [toast, setToast] = useState(null);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 5000);
  };

  const loadApplications = async () => {
    const [appsRes, walletRes] = await Promise.all([getMyApplications(), getWallet()]);
    if (appsRes.data) setApplications(appsRes.data.filter((a) => a.application_type?.startsWith("number_plate_")));
    if (walletRes.data) setWalletBalance(walletRes.data.balance_kobo || 0);
    setLoading(false);
  };

  useEffect(() => {
    loadApplications();
  }, []);

  const handlePayFromWallet = async (appId, amountKobo) => {
    if (payingFromWalletRef.current) return;
    payingFromWalletRef.current = true;
    setPayingFromWallet(appId);
    const res = await payFromWalletEndpoint(appId, { amount_kobo: amountKobo });
    payingFromWalletRef.current = false;
    setPayingFromWallet(null);
    if (res.error) {
      showToast("error", res.error || "Insufficient wallet funds. Please top up your wallet or pay by card.");
      return;
    }
    showToast(
      "success",
      res.data?.is_fully_paid
        ? `Paid ${koboToNaira(amountKobo)} from your wallet — application fully paid!`
        : `Paid ${koboToNaira(amountKobo)} from your wallet. ${koboToNaira(res.data?.remaining_kobo || 0)} still remaining.`
    );
    await loadApplications();
  };

  const totalApps = applications.length;
  const paidApps = applications.filter(isApplicationPaid).length;
  const pendingPaymentApps = totalApps - paidApps;

  return (
    <div className="mx-auto max-w-4xl space-y-8 py-6 pb-20">
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 rounded-xl px-4 py-3 text-[13px] font-semibold shadow-lg ${
            toast.type === "error" ? "bg-red-600 text-white" : "bg-emerald-600 text-white"
          }`}
        >
          {toast.msg}
        </div>
      )}

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
          Number plate services
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

      {/* Summary strip */}
      {totalApps > 0 && (
        <div className="grid grid-cols-1 divide-y divide-slate-100 rounded-2xl border border-[#E5E5E5] bg-white sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <div className="px-5 py-4">
            <span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400">Total</span>
            <span className="mt-0.5 block text-[22px] font-bold text-[#111111]">{totalApps}</span>
          </div>
          <div className="px-5 py-4">
            <span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400">Paid</span>
            <span className="mt-0.5 block text-[22px] font-bold text-emerald-600">{paidApps}</span>
          </div>
          <div className="px-5 py-4">
            <span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Awaiting payment
            </span>
            <span className="mt-0.5 block text-[22px] font-bold text-amber-600">{pendingPaymentApps}</span>
          </div>
        </div>
      )}

      {/* Applications — card list */}
      {loading ? (
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl border border-slate-100 bg-slate-50" />
          ))}
        </div>
      ) : applications.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#E5E5E5] bg-white px-8 py-16 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
            <FileText className="h-7 w-7" />
          </div>
          <h3 className="mt-4 text-[16px] font-bold text-[#111111]">No number plate applications yet</h3>
          <p className="mx-auto mt-1 max-w-xs text-[13px] text-slate-500">
            Pick a service above to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {applications.map((app) => {
            const meta = PLATE_TYPE_META[app.application_type] || { label: "Number plate", fallbackFeeKobo: 10_500_000 };
            const payOpts = app.payment_options;
            const isPaid = isApplicationPaid(app);
            const payMeta = paymentStatusMeta(app);
            const amountKobo = payOpts?.amount_kobo || meta.fallbackFeeKobo;
            const remainingKobo = payOpts?.remaining_kobo ?? amountKobo;

            return (
              <div
                key={app.id}
                onClick={() => router.push(`/dashboard/apply/${app.id}`)}
                className="cursor-pointer rounded-2xl border border-[#E5E5E5] bg-white p-5 transition-all hover:border-[#28A745]/60 hover:shadow-md group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 min-w-0">
                    <MiniProgressRing status={app.status} applicationType={app.application_type} size={40} />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[15px] font-bold text-[#111111] group-hover:text-[#28A745] transition-colors">
                          {meta.label}
                        </span>
                        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-slate-500">
                          #{app.id}
                        </span>
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          {formatDate(app.created_at)}
                        </span>
                        {app.use_type === "commercial" && (
                          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">Commercial</span>
                        )}
                      </div>
                      <div className="mt-2.5">
                        <StatusBadge status={app.status} size="sm" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 border-t border-slate-100 pt-4" onClick={(e) => e.stopPropagation()}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    {isPaid ? (
                      <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-emerald-700">
                        <CheckCircle2 className="h-4 w-4" />
                        Paid {koboToNaira(amountKobo)}
                      </span>
                    ) : (
                      <span className={`inline-flex items-center gap-1.5 text-[12.5px] font-semibold ${payMeta.needsRetry ? "text-red-600" : "text-amber-700"}`}>
                        {payMeta.needsRetry ? <RefreshCw className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                        {payMeta.label} ({koboToNaira(remainingKobo)} left)
                      </span>
                    )}
                    {!isPaid && payOpts?.checkout_url && (
                      <a
                        href={payOpts.checkout_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={btnGhost}
                      >
                        Checkout
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>

                  {!isPaid && (
                    <div className="mt-3.5 max-w-md">
                      <PartialPayControls
                        remainingKobo={remainingKobo}
                        walletBalanceKobo={walletBalance}
                        payingWallet={payingFromWallet === app.id}
                        onPay={(amt) => handlePayFromWallet(app.id, amt)}
                      />
                    </div>
                  )}

                  <div className="mt-3 flex items-center gap-2">
                    <button type="button" onClick={() => router.push(`/dashboard/apply/${app.id}`)} className="inline-flex items-center gap-1.5 rounded-xl border border-[#E5E5E5] bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-[#28A745] hover:text-white hover:border-[#28A745] transition-all shadow-sm">
                      <span>View Full Details &amp; Status</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
