"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  ChevronRight,
  Clock,
  ExternalLink,
  FileText,
  Plus,
  RefreshCw,
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

// Mirrors the backend's flat tinted_permit fee (app/core/payment_helpers.py)
// — only used as a fallback while payment_options hasn't loaded; the real
// amount always comes from the backend once available.
const TINTED_FEE_KOBO = 2_405_000;

export default function TintedPermitApplicationsPage() {
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
    if (appsRes.data) setApplications(appsRes.data.filter((a) => a.application_type === "tinted_permit"));
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
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: BRAND }} />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Tinted permit
            </span>
          </div>
          <h1
            className="mt-1.5 text-[30px] tracking-tight text-[#111111]"
            style={{ fontFamily: "var(--font-display-serif)", fontWeight: 500 }}
          >
            Your tinted permit applications
          </h1>
          <p className="mt-1 text-[13.5px] text-slate-500">
            Track progress, handle payment, and see what's next for each one.
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push("/dashboard/apply/tinted-permit/new")}
          className={btnPrimary}
          style={{ background: BRAND }}
        >
          <Plus className="h-4 w-4" />
          New application
        </button>
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
          <h3 className="mt-4 text-[16px] font-bold text-[#111111]">No tinted permit applications yet</h3>
          <p className="mx-auto mt-1 max-w-xs text-[13px] text-slate-500">
            Apply for a vehicle tinted glass permit — pick or add a vehicle to get started.
          </p>
          <button
            type="button"
            onClick={() => router.push("/dashboard/apply/tinted-permit/new")}
            className={`${btnPrimary} mt-5`}
            style={{ background: BRAND }}
          >
            <Plus className="h-4 w-4" />
            Start application
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {applications.map((app) => {
            const payOpts = app.payment_options;
            const isPaid = isApplicationPaid(app);
            const payMeta = paymentStatusMeta(app);
            const amountKobo = payOpts?.amount_kobo || TINTED_FEE_KOBO;
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
                          Tinted permit application
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
