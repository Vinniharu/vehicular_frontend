"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ShieldCheck, XCircle, Loader2 } from "lucide-react";
import { getPublicPciVerification } from "@/lib/api";
import { EASE } from "@/app/components/marketing/motion";

const VERDICT_LABELS = { buy: "Recommended to buy", proceed_with_caution: "Proceed with caution", dont_buy: "Not recommended" };
const VERDICT_CLASS = {
  buy: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  proceed_with_caution: "bg-amber-50 text-amber-700 ring-amber-200",
  dont_buy: "bg-red-50 text-red-700 ring-red-200",
};

export default function PublicPciVerifyPage() {
  const params = useParams();
  const token = params?.token;
  const reduce = useReducedMotion();

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!token) return;
    getPublicPciVerification(token).then((res) => {
      if (res.error || !res.data) {
        setNotFound(true);
      } else {
        setResult(res.data);
      }
      setLoading(false);
    });
  }, [token]);

  return (
    <div className="mk-root relative flex min-h-screen items-center justify-center overflow-hidden bg-mk-bg px-4 py-12">
      <div aria-hidden className="mk-grid-bg pointer-events-none absolute inset-0" />
      <div aria-hidden className="mk-glow pointer-events-none absolute -top-40 left-1/2 h-[420px] w-[640px] max-w-[160vw] -translate-x-1/2" />

      <motion.div
        className="relative w-full max-w-md"
        initial={reduce ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE }}
      >
        <div className="rounded-mk-lg border border-mk-line bg-mk-surface px-6 py-8 text-center shadow-mk-lg sm:px-8">
          <Link href="/" className="mk-focus mb-6 inline-flex min-h-[44px] items-center gap-2 rounded-lg">
            <img src="/logo.png" alt="" className="h-6 w-auto object-contain" />
            <span className="text-[15px] font-semibold tracking-[-0.02em] text-mk-ink">Vehiculars</span>
          </Link>

          {loading && (
            <div className="py-10">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-cx-brand" />
            </div>
          )}

          {!loading && notFound && (
            <div className="py-6">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-mk-bg ring-1 ring-inset ring-mk-line">
                <XCircle className="h-7 w-7 text-mk-muted" />
              </div>
              <h1 className="mt-4 text-[18px] font-semibold tracking-[-0.02em] text-mk-ink">Verification code not found</h1>
              <p className="mt-1.5 text-[14px] leading-relaxed text-mk-muted">This code doesn't match a released condition inspection report.</p>
            </div>
          )}

          {!loading && result && (
            <div>
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-cx-brand-soft ring-1 ring-inset ring-cx-brand/20">
                <ShieldCheck className="h-7 w-7 text-cx-brand" />
              </div>
              <p className="mt-4 font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-cx-brand-deep">Verified record</p>
              <h1 className="mt-1.5 text-[20px] font-semibold tracking-[-0.02em] text-mk-ink">Physical Condition Inspection</h1>

              <div className="mt-5 rounded-mk border border-mk-line bg-mk-bg px-4 py-3.5">
                <p className="text-[15px] font-semibold text-mk-ink">
                  {result.make} {result.model} {result.year} — {result.plate_number}
                </p>
                <p className="mt-0.5 text-[13px] text-mk-muted">
                  Inspected {result.verified_at ? new Date(result.verified_at).toLocaleDateString() : "—"}
                </p>
              </div>

              <div className="mt-5">
                <span className={`inline-block rounded-full px-4 py-1.5 text-[13.5px] font-semibold ring-1 ring-inset ${VERDICT_CLASS[result.verdict] || "bg-slate-100 text-slate-600 ring-slate-200"}`}>
                  {VERDICT_LABELS[result.verdict] || result.verdict}
                </span>
              </div>

              <p className="mt-6 border-t border-mk-line pt-5 text-[12px] leading-relaxed text-mk-muted">
                This confirms a Vehiculars physical condition inspection was completed for this vehicle. The verdict reflects the vehicle's condition at the time of inspection only — no further detail is shown here; the full report was released to the customer directly.
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
