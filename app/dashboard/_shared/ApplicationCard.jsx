"use client";

import { CheckCircle2, ChevronRight, Clock, ExternalLink, RefreshCw } from "lucide-react";
import PartialPayControls from "@/app/components/dashboard/PartialPayControls";
import StatusBadge from "@/app/dashboard/_shared/StatusBadge";
import { btnGhost } from "@/app/dashboard/_shared/ui";
import { isNumberPlateType } from "@/app/dashboard/_shared/status-config";
import {
  koboToNaira,
  formatDate,
  MiniProgressRing,
  isApplicationPaid,
  paymentStatusMeta,
} from "@/app/dashboard/_shared/apply-helpers";
import { typeLabel, renewHref, DOCUMENT_TYPE_LABELS, ITEM_STATUS_META } from "@/app/dashboard/_shared/application-category";

// The single card component consolidating the near-identical markup that
// used to be duplicated across 4 separate per-service list pages. Reuses
// every status/progress/payment helper as-is — no new display logic beyond
// the type-specific bits noted inline below.
export default function ApplicationCard({ app, walletBalance, payingFromWallet, onPayFromWallet, onNavigate }) {
  const payOpts = app.payment_options;
  const isPaid = isApplicationPaid(app);
  const payMeta = paymentStatusMeta(app);
  const items = app.application_type === "vehicle_particulars" ? app.items || [] : null;

  // payment_options is already present on the list endpoint response in the
  // normal case — if it hasn't loaded for a given card, show the paid/due
  // label without a kobo figure rather than re-deriving per-type flat-fee
  // estimates a 4th time in a shared component.
  const amountKobo = payOpts?.amount_kobo ?? (items ? items.reduce((sum, i) => sum + i.price_kobo, 0) : null);
  const remainingKobo = payOpts?.remaining_kobo ?? amountKobo;

  const goToDetail = () => onNavigate(`/dashboard/apply/${app.id}`);

  return (
    <div
      onClick={goToDetail}
      className="cursor-pointer rounded-2xl border border-[#E5E5E5] bg-white p-5 transition-all hover:border-[#28A745]/60 hover:shadow-md group"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0">
          <MiniProgressRing status={app.status} applicationType={app.application_type} size={40} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[15px] font-bold text-[#111111] group-hover:text-[#28A745] transition-colors">
                {typeLabel(app)}
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
              {isNumberPlateType(app.application_type) && app.use_type === "commercial" && (
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">Commercial</span>
              )}
            </div>
            {items && items.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {items.map((item) => {
                  const meta = ITEM_STATUS_META[item.status] || { label: item.status, tone: "text-slate-600" };
                  return (
                    <span key={item.id} className={`rounded-full bg-slate-50 px-2 py-0.5 text-[10.5px] font-semibold ${meta.tone}`}>
                      {DOCUMENT_TYPE_LABELS[item.document_type] || item.document_type}: {meta.label}
                    </span>
                  );
                })}
              </div>
            )}
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
              {amountKobo != null ? `Paid ${koboToNaira(amountKobo)}` : "Paid"}
            </span>
          ) : (
            <span className={`inline-flex items-center gap-1.5 text-[12.5px] font-semibold ${payMeta.needsRetry ? "text-red-600" : "text-amber-700"}`}>
              {payMeta.needsRetry ? <RefreshCw className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
              {payMeta.label}{remainingKobo != null ? ` (${koboToNaira(remainingKobo)} left)` : ""}
            </span>
          )}
          {!isPaid && payOpts?.checkout_url && (
            <a href={payOpts.checkout_url} target="_blank" rel="noopener noreferrer" className={btnGhost}>
              Checkout
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>

        {!isPaid && remainingKobo != null && (
          <div className="mt-3.5 max-w-md">
            <PartialPayControls
              remainingKobo={remainingKobo}
              walletBalanceKobo={walletBalance}
              payingWallet={payingFromWallet === app.id}
              onPay={(amt) => onPayFromWallet(app.id, amt)}
            />
          </div>
        )}

        <div className="mt-3 flex items-center gap-2">
          {app.status === "expired" && (
            <button
              type="button"
              onClick={() => onNavigate(renewHref(app))}
              className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[12.5px] font-semibold text-white transition-all active:scale-[0.98]"
              style={{ background: "#dc2626" }}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Renew now
            </button>
          )}
          <button
            type="button"
            onClick={goToDetail}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#E5E5E5] bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-[#28A745] hover:text-white hover:border-[#28A745] transition-all shadow-sm"
          >
            <span>View Full Details &amp; Status</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
