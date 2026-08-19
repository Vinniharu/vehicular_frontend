"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Inbox, Loader2, ChevronRight } from "lucide-react";
import { sparePartsListRequests } from "@/lib/api";

const BRAND = "#28A745";

const STATUS_TONE = {
  open: "bg-slate-100 text-slate-600",
  matched: "bg-slate-100 text-slate-600",
  bidding_open: "bg-amber-50 text-amber-700",
  bidding_closed_no_bids: "bg-slate-100 text-slate-600",
  bid_selected: "bg-blue-50 text-blue-700",
  shipped: "bg-blue-50 text-blue-700",
  delivered: "bg-blue-50 text-blue-700",
  confirmed: "bg-emerald-50 text-emerald-700",
  completed: "bg-emerald-50 text-emerald-700",
  disputed: "bg-red-50 text-red-700",
  under_staff_review: "bg-red-50 text-red-700",
  resolved: "bg-slate-100 text-slate-600",
};

export default function SparePartsListPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    sparePartsListRequests().then((res) => {
      if (Array.isArray(res.data)) setRequests(res.data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: BRAND }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#111111]">Spare Parts</h1>
          <p className="mt-1 text-[13.5px] text-[#7A7A7A]">Post a request, review dealer bids, and track your orders.</p>
        </div>
        <Link href="/dashboard/spare-parts/new" className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-[13.5px] font-semibold text-white" style={{ background: BRAND }}>
          <Plus className="h-4 w-4" /> New request
        </Link>
      </div>

      {requests.length === 0 ? (
        <div className="rounded-2xl border border-[#E5E5E5] bg-white p-16 text-center shadow-sm">
          <Inbox className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-4 text-[14px] font-bold text-slate-800">No requests yet</p>
          <p className="mt-1 text-[12.5px] text-slate-400">Post the part you need and matched dealers will start bidding.</p>
          <Link href="/dashboard/spare-parts/new" className="mt-5 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-[13px] font-semibold text-white" style={{ background: BRAND }}>
            <Plus className="h-4 w-4" /> Post a request
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[#E5E5E5] bg-white shadow-sm">
          <div className="divide-y divide-slate-100">
            {requests.map((r) => (
              <Link key={r.id} href={`/dashboard/spare-parts/${r.id}`} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-slate-900">{r.part_name}</p>
                  <p className="mt-0.5 text-[12.5px] text-slate-500">{r.vehicle_make} {r.vehicle_model} ({r.vehicle_year})</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS_TONE[r.status] || "bg-slate-100 text-slate-600"}`}>
                    {r.status.replace(/_/g, " ")}
                  </span>
                  <ChevronRight className="h-4 w-4 text-slate-300" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
