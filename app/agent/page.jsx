"use client";

import { useState, useEffect } from "react";
import {
  Briefcase,
  MapPin,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  RefreshCw,
  Inbox,
  Wallet,
  ArrowRight,
  TrendingUp,
  ClipboardList,
  Hourglass,
  BadgeCheck,
} from "lucide-react";
import Link from "next/link";
import { getAgentOffers, acceptOffer, declineOffer, getAgentWallet, getAgentApplications } from "@/lib/api";

const NEEDS_ACTION_STATUSES = ["agent_accepted", "captured", "capturing_completed", "temp_licence_pending_review"];
const DONE_STATUSES = ["completed", "expired"];

function isThisMonth(iso) {
  if (!iso) return false;
  const d = new Date(iso);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

const BRAND = "#28A745";
const BRAND_TINT = "rgba(40, 167, 69,0.08)";

function koboToNaira(kobo) {
  return (kobo / 100).toLocaleString("en-NG", { style: "currency", currency: "NGN" });
}


const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-50";
const btnSecondary =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 transition-all disabled:opacity-50";

export default function AgentOffersPage() {
  const [offers, setOffers] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [actingId, setActingId] = useState(null);

  const loadOffers = async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    const [offersRes, walletRes, appsRes] = await Promise.all([getAgentOffers(), getAgentWallet(), getAgentApplications()]);
    if (offersRes.error) setError(offersRes.error);
    else if (Array.isArray(offersRes.data)) setOffers(offersRes.data);
    if (walletRes.data) setWallet(walletRes.data);
    if (Array.isArray(appsRes.data)) setApplications(appsRes.data);
    setLoading(false);
    setRefreshing(false);
  };

  const activeJobs = applications.filter((a) => !DONE_STATUSES.includes(a.status));
  const needsAction = applications.filter((a) => NEEDS_ACTION_STATUSES.includes(a.status));
  const completedThisMonth = applications.filter((a) => a.status === "completed" && isThisMonth(a.updated_at));

  useEffect(() => {
    loadOffers();
  }, []);

  const handleAccept = async (offer) => {
    setActingId(offer.id);
    setNotice(null);
    const res = await acceptOffer(offer.id);
    setActingId(null);
    if (res.error) {
      setNotice({ type: "error", message: res.error });
    } else {
      setNotice({ type: "success", message: `Offer accepted — application ${offer.application_id} is now yours.` });
      await loadOffers(true);
    }
  };

  const handleDecline = async (offer) => {
    setActingId(offer.id);
    setNotice(null);
    const res = await declineOffer(offer.id);
    setActingId(null);
    if (res.error) {
      setNotice({ type: "error", message: res.error });
    } else {
      setNotice({ type: "success", message: "Offer declined." });
      await loadOffers(true);
    }
  };

  return (
    <div className="space-y-5 pb-16">
      {/* Earnings mini-banner */}
      {wallet !== null && (
        <div
          className="relative overflow-hidden rounded-2xl px-6 py-5 text-white flex items-center justify-between gap-4"
          style={{ background: "linear-gradient(135deg, #065f46, #28A745)" }}
        >
          <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-200/70">Total Income Earned</p>
            <p className="mt-1 font-mono text-[26px] font-bold">{koboToNaira(wallet.total_income_kobo)}</p>
            <p className="mt-0.5 text-[12px] text-emerald-200/80">
              {(wallet.transactions || []).length} earning{(wallet.transactions || []).length !== 1 ? 's' : ''} · {wallet.lga || 'Your LGA'}
            </p>
          </div>
          <Link href="/agent/wallet"
            className="flex shrink-0 items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-white/20 transition-all backdrop-blur-sm">
            <Wallet className="h-4 w-4" />
            View wallet
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {/* Stats row — at-a-glance dashboard */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-slate-400">
            <Inbox className="h-4 w-4" />
            <span className="text-[11px] font-bold uppercase tracking-wide">Open offers</span>
          </div>
          <p className="mt-1.5 text-2xl font-bold text-slate-900">{loading ? "—" : offers.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-slate-400">
            <ClipboardList className="h-4 w-4" />
            <span className="text-[11px] font-bold uppercase tracking-wide">Active jobs</span>
          </div>
          <p className="mt-1.5 text-2xl font-bold text-slate-900">{loading ? "—" : activeJobs.length}</p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-amber-600">
            <Hourglass className="h-4 w-4" />
            <span className="text-[11px] font-bold uppercase tracking-wide">Needs your action</span>
          </div>
          <p className="mt-1.5 text-2xl font-bold text-amber-900">{loading ? "—" : needsAction.length}</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-emerald-600">
            <BadgeCheck className="h-4 w-4" />
            <span className="text-[11px] font-bold uppercase tracking-wide">Completed this month</span>
          </div>
          <p className="mt-1.5 text-2xl font-bold text-emerald-900">{loading ? "—" : completedThisMonth.length}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-emerald-800 mb-2">
              <Briefcase className="h-3.5 w-3.5 text-[#28A745]" />
              Job Offers
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Available offers in your LGA</h1>
            <p className="mt-1 text-sm text-slate-600 max-w-2xl">
              Accept a job to take ownership of it, or decline to send it back to other agents in
              your LGA. Accepting requires a verified bank account.
            </p>
          </div>
          <button
            type="button"
            onClick={() => loadOffers(true)}
            disabled={refreshing || loading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 transition-all shadow-sm shrink-0 self-start md:self-center"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin text-[#28A745]" : "text-slate-500"}`} />
            <span>{refreshing ? "Syncing…" : "Refresh"}</span>
          </button>
        </div>
      </div>

      {notice && (
        <div className={`flex items-center gap-2.5 rounded-xl p-3.5 text-[13px] ${notice.type === "error" ? "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200" : "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200 font-medium"}`}>
          {notice.type === "error" ? <AlertCircle className="h-4 w-4 shrink-0" /> : <CheckCircle2 className="h-4 w-4 shrink-0" />}
          {notice.message}
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-3.5">
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center space-y-3 shadow-sm">
            <Loader2 className="h-8 w-8 animate-spin text-[#28A745] mx-auto" />
            <p className="text-sm text-slate-500 font-medium">Loading offers…</p>
          </div>
        ) : offers.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center space-y-2 shadow-sm">
            <Inbox className="h-10 w-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">No offers right now</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              New jobs routed to your LGA will show up here.
            </p>
          </div>
        ) : (
          offers.map((offer) => (
            <div
              key={offer.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="font-mono font-bold text-sm text-slate-900">App #{offer.application_id}</span>
                  <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                    {offer.application_type || "FRESH"}
                  </span>
                </div>
                <p className="flex items-center gap-1.5 text-[13px] text-slate-500">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  {offer.lga || "—"}
                </p>
                {offer.service_fee_kobo > 0 && (
                  <p className="flex items-center gap-1.5 text-[13px] font-bold" style={{ color: BRAND }}>
                    <TrendingUp className="h-3.5 w-3.5" />
                    Earn {koboToNaira(offer.service_fee_kobo)}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => handleDecline(offer)}
                  disabled={actingId === offer.id}
                  className={btnSecondary}
                >
                  {actingId === offer.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                  Decline
                </button>
                <button
                  type="button"
                  onClick={() => handleAccept(offer)}
                  disabled={actingId === offer.id}
                  className={btnPrimary}
                  style={{ background: BRAND }}
                >
                  {actingId === offer.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                  Accept
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
