"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FileText, Layers } from "lucide-react";
import { getMyApplications, getWallet, payFromWalletEndpoint } from "@/lib/api";
import ApplicationCard from "@/app/dashboard/_shared/ApplicationCard";
import { koboToNaira, isApplicationPaid } from "@/app/dashboard/_shared/apply-helpers";
import { APPLICATION_CATEGORIES, categoryForApplicationType } from "@/app/dashboard/_shared/application-category";
import { colors } from "@/lib/design-tokens";

const BRAND = colors.primary.DEFAULT;

export default function ApplicationsPage() {
  const router = useRouter();
  const [applications, setApplications] = useState([]);
  const [category, setCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState(0);
  const [payingFromWallet, setPayingFromWallet] = useState(null);
  const payingFromWalletRef = useRef(false);
  const [toast, setToast] = useState(null);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 5000);
  };

  const load = async () => {
    const [appsRes, walletRes] = await Promise.all([getMyApplications({ sort: "updated_at" }), getWallet()]);
    if (appsRes.data) setApplications(appsRes.data);
    if (walletRes.data) setWalletBalance(walletRes.data.balance_kobo || 0);
    setLoading(false);
  };

  useEffect(() => {
    load();
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
    await load();
  };

  // Server sort (updated_at desc) is trusted as the primary order; this is
  // a stable secondary sort so "most recently updated first" holds
  // unconditionally rather than depending on an unverified backend
  // contract for the types that have never been sorted before.
  const sorted = useMemo(
    () => [...applications].sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at)),
    [applications]
  );

  const categoryCounts = useMemo(() => {
    const counts = {};
    for (const app of sorted) {
      const c = categoryForApplicationType(app.application_type);
      counts[c] = (counts[c] || 0) + 1;
    }
    return counts;
  }, [sorted]);

  const filtered = category === "all" ? sorted : sorted.filter((a) => categoryForApplicationType(a.application_type) === category);

  const totalApps = filtered.length;
  const paidApps = filtered.filter(isApplicationPaid).length;
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
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">All services</span>
        </div>
        <h1
          className="mt-1.5 text-[30px] tracking-tight text-[#111111]"
          style={{ fontFamily: "var(--font-display-serif)", fontWeight: 500 }}
        >
          My Applications
        </h1>
        <p className="mt-1 text-[13.5px] text-slate-500">
          Everything you've started, across every service, most recently updated first.
        </p>
      </div>

      {/* Category filter chips */}
      {applications.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setCategory("all")}
            className={`rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition-all ${
              category === "all" ? "text-white" : "border border-[#E5E5E5] bg-white text-slate-600 hover:bg-slate-50"
            }`}
            style={category === "all" ? { background: BRAND } : undefined}
          >
            All ({applications.length})
          </button>
          {APPLICATION_CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={`rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition-all ${
                category === c ? "text-white" : "border border-[#E5E5E5] bg-white text-slate-600 hover:bg-slate-50"
              }`}
              style={category === c ? { background: BRAND } : undefined}
            >
              {c} ({categoryCounts[c] || 0})
            </button>
          ))}
        </div>
      )}

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
            <span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400">Awaiting payment</span>
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
          <h3 className="mt-4 text-[16px] font-bold text-[#111111]">You haven't started any applications yet</h3>
          <p className="mx-auto mt-1 max-w-xs text-[13px] text-slate-500">
            Pick a service to get started — it takes a few minutes.
          </p>
          <Link
            href="/dashboard/services"
            className="mt-5 inline-flex items-center gap-2 rounded-xl px-5 py-3 text-[13.5px] font-semibold text-white shadow-sm transition-all active:scale-[0.98]"
            style={{ background: BRAND }}
          >
            Browse services
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#E5E5E5] bg-white px-8 py-16 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
            <Layers className="h-7 w-7" />
          </div>
          <h3 className="mt-4 text-[16px] font-bold text-[#111111]">No applications in this category yet</h3>
          <p className="mx-auto mt-1 max-w-xs text-[13px] text-slate-500">
            Try a different category, or view all your applications.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((app) => (
            <ApplicationCard
              key={app.id}
              app={app}
              walletBalance={walletBalance}
              payingFromWallet={payingFromWallet}
              onPayFromWallet={handlePayFromWallet}
              onNavigate={(href) => router.push(href)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
