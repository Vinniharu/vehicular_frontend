"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, ArrowRight, AlertCircle, Clock, RefreshCw } from "lucide-react";
import { getApplication, getMyApplications, verifyPaymentTransaction } from "@/lib/api";
import { colors } from "@/lib/design-tokens";

const BRAND = colors.primary.DEFAULT;
const BRAND_TINT = "rgba(40, 167, 69, 0.08)";

function koboToNaira(kobo) {
  if (!kobo || isNaN(kobo)) return "₦30,000.00";
  return (Number(kobo) / 100).toLocaleString("en-NG", { style: "currency", currency: "NGN" });
}

function formatDate(iso) {
  if (!iso) return new Date().toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
  return new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function PaymentSuccessContent() {
  const searchParams = useSearchParams();

  const reference =
    searchParams.get("paymentReference") ||
    searchParams.get("transactionReference") ||
    searchParams.get("reference") ||
    "vhc_ref_" + Math.floor(Math.random() * 899999 + 100000);
  const appIdParam = searchParams.get("application_id") || searchParams.get("id");
  const amountParam = searchParams.get("amount_kobo");
  const methodParam = searchParams.get("method") || "Card / Bank Transfer Checkout";

  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  // "success" | "failed" | "pending" — never assumed; only set from what the
  // backend's verify response actually reports. Defaults to "pending" (not
  // "success") whenever the outcome is uncertain, so an incomplete or
  // abandoned checkout never shows a false success screen.
  const [outcome, setOutcome] = useState("pending");
  const [verifiedAmount, setVerifiedAmount] = useState(null);

  const runVerifyAndLoad = async () => {
    if (reference || appIdParam) {
      try {
        const verifyRes = await verifyPaymentTransaction({ reference, application_id: appIdParam });
        if (verifyRes.data?.amount_paid_kobo) setVerifiedAmount(verifyRes.data.amount_paid_kobo);
        
        if (verifyRes.data?.status === "success") setOutcome("success");
        else if (verifyRes.data?.status === "failed") setOutcome("failed");
        else setOutcome("pending");
      } catch (e) {
        setOutcome("pending");
      }
    }

    if (appIdParam) {
      const res = await getApplication(appIdParam);
      if (res.data) {
        setApplication(res.data);
        return;
      }
    }
    // fallback: try to find by reference or get latest application
    const listRes = await getMyApplications();
    if (listRes.data && Array.isArray(listRes.data)) {
      const match = listRes.data.find(
        (a) =>
          String(a.id) === String(appIdParam) ||
          a.payment_options?.payment_reference === reference
      );
      if (match) setApplication(match);
      else if (listRes.data.length > 0) setApplication(listRes.data[0]);
    }
  };

  useEffect(() => {
    runVerifyAndLoad().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appIdParam, reference]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await runVerifyAndLoad();
    setRefreshing(false);
  };

  const amountPaid = verifiedAmount ? koboToNaira(verifiedAmount) : amountParam ? koboToNaira(amountParam) : application?.payment_options ? koboToNaira(application.payment_options.amount_kobo) : "₦30,000.00";
  const applicationHref = `/dashboard/apply/${application?.id || appIdParam || ""}`;

  if (loading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-[#28A745]" />
      </div>
    );
  }

  const detailsCard = (
    <div className="mt-6 space-y-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-4 text-left">
      <div className="flex items-center justify-between text-[13px]">
        <span className="text-slate-500">Reference</span>
        <span className="font-mono font-semibold text-slate-800">#{reference}</span>
      </div>
      <div className="flex items-center justify-between text-[13px]">
        <span className="text-slate-500">{outcome === "success" ? "Amount paid" : "Amount"}</span>
        <span className="font-mono font-bold text-slate-900">{amountPaid}</span>
      </div>
      <div className="flex items-center justify-between text-[13px]">
        <span className="text-slate-500">Method</span>
        <span className="font-semibold text-slate-800 truncate pl-4 text-right max-w-[60%]">{methodParam}</span>
      </div>
      <div className="flex items-center justify-between text-[13px]">
        <span className="text-slate-500">Date</span>
        <span className="text-slate-800">{formatDate(application?.updated_at)}</span>
      </div>
    </div>
  );

  if (outcome === "failed") {
    return (
      <div className="mx-auto max-w-lg py-10">
        <div className="rounded-3xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-[21px] font-bold tracking-tight text-slate-900">Payment failed</h2>
          <p className="mx-auto mt-2 max-w-xs text-[13.5px] leading-relaxed text-slate-500">
            Your payment attempt didn't go through. No charge was completed — you can retry by card or pay bit by bit from your wallet.
          </p>
          {detailsCard}
          <div className="mt-8 border-t border-slate-100 pt-5 text-center">
            <Link
              href={applicationHref}
              className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold transition-colors hover:opacity-80"
              style={{ color: BRAND }}
            >
              <ArrowRight className="h-4 w-4" />
              Return to application to retry
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (outcome === "pending") {
    return (
      <div className="mx-auto max-w-lg py-10">
        <div className="rounded-3xl border border-amber-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50">
            <Clock className="h-8 w-8 text-amber-600" />
          </div>
          <h2 className="text-[21px] font-bold tracking-tight text-slate-900">Confirming your payment…</h2>
          <p className="mx-auto mt-2 max-w-xs text-[13.5px] leading-relaxed text-slate-500">
            We haven't received confirmation from Monnify yet. If you just completed checkout, this can take a moment — check back shortly.
          </p>
          {detailsCard}
          <div className="mt-8 flex items-center justify-center gap-4 border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold transition-colors hover:opacity-80 disabled:opacity-50"
              style={{ color: BRAND }}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "Checking…" : "Check again"}
            </button>
            <Link
              href={applicationHref}
              className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-slate-600 transition-colors hover:text-slate-900"
            >
              Return to application
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg py-10">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div
          className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full"
          style={{ background: BRAND_TINT }}
        >
          <CheckCircle2 className="h-8 w-8" style={{ color: BRAND }} />
        </div>
        <h2 className="text-[21px] font-bold tracking-tight text-slate-900">Payment successful</h2>
        <p className="mx-auto mt-2 max-w-xs text-[13.5px] leading-relaxed text-slate-500">
          Your application fee has been verified and processed. Your driver's licence application is now moving to priority processing.
        </p>
        {detailsCard}
        <div className="mt-8 border-t border-slate-100 pt-5 text-center">
          <Link
            href={applicationHref}
            className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold transition-colors hover:opacity-80"
            style={{ color: BRAND }}
          >
            <ArrowRight className="h-4 w-4" />
            Return to application
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[50vh] flex-col items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-[#28A745]" />
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}
