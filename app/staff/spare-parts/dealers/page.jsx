"use client";

import { useState, useEffect } from "react";
import { Loader2, CheckCircle2, XCircle, PauseCircle, PlayCircle, Inbox } from "lucide-react";
import { staffListDealers, staffApproveDealer, staffRejectDealer, staffSuspendDealer, staffReinstateDealer } from "@/lib/api";

const BRAND = "#28A745";
const btnSm = "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-all disabled:opacity-50";

const TABS = ["pending_review", "approved", "rejected", "suspended"];

export default function StaffDealerVettingPage() {
  const [tab, setTab] = useState("pending_review");
  const [dealers, setDealers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState(null);

  const load = async (status_filter) => {
    setLoading(true);
    const res = await staffListDealers({ status_filter });
    if (Array.isArray(res.data)) setDealers(res.data);
    setLoading(false);
  };

  useEffect(() => { load(tab); }, [tab]);

  const act = async (fn, dealerId, ...args) => {
    setActingId(dealerId);
    const res = await fn(dealerId, ...args);
    setActingId(null);
    if (res.error) {
      alert(res.error);
      return;
    }
    load(tab);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dealer Vetting</h1>
        <p className="mt-1 text-[13.5px] text-slate-500">Approve, reject, suspend, or reinstate spare-parts dealers.</p>
      </div>

      <div className="flex items-center gap-1 self-start rounded-lg bg-slate-100 p-1 w-fit">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className="rounded-md px-3.5 py-1.5 text-[13px] font-semibold transition-all"
            style={{ background: tab === t ? "#fff" : "transparent", color: tab === t ? "#0f172a" : "#64748b" }}>
            {t.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex min-h-[30vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" style={{ color: BRAND }} /></div>
      ) : dealers.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center shadow-sm">
          <Inbox className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-4 text-[14px] font-bold text-slate-800">No dealers in this status</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="divide-y divide-slate-100">
            {dealers.map((d) => (
              <div key={d.id} className="flex items-center justify-between gap-4 px-5 py-4">
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-slate-900">{d.business_name}</p>
                  <p className="mt-0.5 text-[12.5px] text-slate-500">
                    {d.categories.join(", ")} · {d.membership_tier} tier · {d.rating_avg.toFixed(1)}★ ({d.rating_count})
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {d.status === "pending_review" && (
                    <>
                      <button disabled={actingId === d.id} onClick={() => act(staffApproveDealer, d.id)} className={btnSm} style={{ background: "#ecfdf5", color: "#047857" }}>
                        <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                      </button>
                      <button disabled={actingId === d.id} onClick={() => act(staffRejectDealer, d.id, {})} className={btnSm} style={{ background: "#fef2f2", color: "#b91c1c" }}>
                        <XCircle className="h-3.5 w-3.5" /> Reject
                      </button>
                    </>
                  )}
                  {d.status === "approved" && (
                    <button disabled={actingId === d.id} onClick={() => act(staffSuspendDealer, d.id)} className={btnSm} style={{ background: "#fffbeb", color: "#b45309" }}>
                      <PauseCircle className="h-3.5 w-3.5" /> Suspend
                    </button>
                  )}
                  {d.status === "suspended" && (
                    <button disabled={actingId === d.id} onClick={() => act(staffReinstateDealer, d.id)} className={btnSm} style={{ background: "#ecfdf5", color: "#047857" }}>
                      <PlayCircle className="h-3.5 w-3.5" /> Reinstate
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
