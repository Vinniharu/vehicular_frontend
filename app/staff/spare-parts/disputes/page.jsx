"use client";

import { useState, useEffect } from "react";
import { Loader2, Inbox, Scale } from "lucide-react";
import { staffListSparePartDisputes, staffResolveSparePartDispute, koboToNaira } from "@/lib/api";

const BRAND = "#28A745";
const inputBase = "w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-[13.5px] text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-[#28A745] focus:bg-white focus:ring-2 focus:ring-[#28A745]/15";
const btnPrimary = "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-50";

const TABS = ["open", "resolved"];

export default function StaffSparePartDisputesPage() {
  const [tab, setTab] = useState("open");
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  const load = async (status_filter) => {
    setLoading(true);
    const res = await staffListSparePartDisputes({ status_filter });
    if (Array.isArray(res.data)) setDisputes(res.data);
    setLoading(false);
  };

  useEffect(() => { load(tab); }, [tab]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Spare Part Disputes</h1>
        <p className="mt-1 text-[13.5px] text-slate-500">Adjudicate against held escrow — full refund, partial refund, or release to dealer.</p>
      </div>

      <div className="flex items-center gap-1 self-start rounded-lg bg-slate-100 p-1 w-fit">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className="rounded-md px-3.5 py-1.5 text-[13px] font-semibold transition-all"
            style={{ background: tab === t ? "#fff" : "transparent", color: tab === t ? "#0f172a" : "#64748b" }}>
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex min-h-[30vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" style={{ color: BRAND }} /></div>
      ) : disputes.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center shadow-sm">
          <Inbox className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-4 text-[14px] font-bold text-slate-800">No {tab} disputes</p>
        </div>
      ) : (
        <div className="space-y-3">
          {disputes.map((d) => (
            <DisputeCard
              key={d.id}
              dispute={d}
              expanded={expandedId === d.id}
              onToggle={() => setExpandedId(expandedId === d.id ? null : d.id)}
              onResolved={() => load(tab)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DisputeCard({ dispute, expanded, onToggle, onResolved }) {
  const [outcome, setOutcome] = useState("full_refund");
  const [refundAmount, setRefundAmount] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleResolve = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const res = await staffResolveSparePartDispute(dispute.id, {
      outcome,
      refund_amount_kobo: outcome === "partial_refund" ? Math.round(parseFloat(refundAmount) * 100) : undefined,
      note: note || undefined,
    });
    setSubmitting(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    onResolved();
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <button onClick={onToggle} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left hover:bg-slate-50 transition-colors">
        <div className="min-w-0">
          <p className="text-[14px] font-semibold text-slate-900">Dispute #{dispute.id} — Request #{dispute.request_id}</p>
          <p className="mt-0.5 text-[12.5px] text-slate-500">{dispute.reason.replace(/_/g, " ")}{dispute.description ? ` — ${dispute.description}` : ""}</p>
        </div>
        <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
          {dispute.outcome || dispute.status}
        </span>
      </button>

      {expanded && dispute.status === "open" && (
        <form onSubmit={handleResolve} className="space-y-4 border-t border-slate-100 px-5 py-5">
          {error && <p className="text-[12.5px] font-medium text-red-600">{error}</p>}
          <div>
            <label className="block text-[11.5px] font-semibold uppercase tracking-wide text-slate-500 mb-1.5">Outcome</label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: "full_refund", label: "Full refund to customer" },
                { value: "partial_refund", label: "Partial refund" },
                { value: "release_to_dealer", label: "Release to dealer" },
              ].map((opt) => (
                <button type="button" key={opt.value} onClick={() => setOutcome(opt.value)}
                  className="rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition-all"
                  style={{ background: outcome === opt.value ? BRAND : "#f1f5f9", color: outcome === opt.value ? "#fff" : "#475569" }}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {outcome === "partial_refund" && (
            <div>
              <label className="block text-[11.5px] font-semibold uppercase tracking-wide text-slate-500 mb-1.5">Refund amount to customer (₦)</label>
              <input type="number" min="1" className={inputBase} value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} required />
              <p className="mt-1.5 text-[11.5px] text-slate-400">The remainder releases to the dealer.</p>
            </div>
          )}

          <div>
            <label className="block text-[11.5px] font-semibold uppercase tracking-wide text-slate-500 mb-1.5">Resolution note</label>
            <textarea className={inputBase} rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>

          <button type="submit" disabled={submitting} className={btnPrimary} style={{ background: BRAND }}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Scale className="h-4 w-4" />}
            Resolve dispute
          </button>
        </form>
      )}

      {expanded && dispute.status !== "open" && (
        <div className="border-t border-slate-100 px-5 py-4 text-[13px] text-slate-600">
          {dispute.resolution_note || "No resolution note."}
          {dispute.refund_amount_kobo != null && (
            <p className="mt-1 font-mono text-[12.5px] text-slate-500">Refunded to customer: {koboToNaira(dispute.refund_amount_kobo)}</p>
          )}
        </div>
      )}
    </div>
  );
}
