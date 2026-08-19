"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Inbox, Loader2, ChevronRight, MapPin } from "lucide-react";
import { dealerListMatchedRequests, koboToNaira } from "@/lib/api";

const BRAND = "#28A745";

const STATUS_LABEL = {
  matched: "Awaiting bid window",
  bidding_open: "Open for bids",
  bid_selected: "Bid selected",
  shipped: "Shipped",
  delivered: "Delivered",
  disputed: "Disputed",
};

export default function DealerDashboardPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dealerListMatchedRequests().then((res) => {
      if (Array.isArray(res.data)) setRequests(res.data);
      setLoading(false);
    });
  }, []);

  const biddable = requests.filter((r) => r.status === "bidding_open");
  const other = requests.filter((r) => r.status !== "bidding_open");

  if (loading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: BRAND }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Matched Requests</h1>
        <p className="mt-1 text-[13.5px] text-slate-500">Requests matched to your categories and market.</p>
      </div>

      {requests.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center shadow-sm">
          <Inbox className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-4 text-[14px] font-bold text-slate-800">No matched requests yet</p>
          <p className="mt-1 text-[12.5px] text-slate-400">New requests in your categories/market will appear here automatically.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {biddable.length > 0 && (
            <RequestGroup title="Open for bidding" items={biddable} />
          )}
          {other.length > 0 && (
            <RequestGroup title="Other matched requests" items={other} />
          )}
        </div>
      )}
    </div>
  );
}

function RequestGroup({ title, items }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-3.5">
        <h2 className="text-[13px] font-bold uppercase tracking-wide text-slate-500">{title}</h2>
      </div>
      <div className="divide-y divide-slate-100">
        {items.map((r) => (
          <Link
            key={r.id}
            href={`/dealer/requests/${r.id}`}
            className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-slate-50 transition-colors"
          >
            <div className="min-w-0">
              <p className="text-[14px] font-semibold text-slate-900">{r.part_name}</p>
              <p className="mt-0.5 text-[12.5px] text-slate-500">
                {r.vehicle_make} {r.vehicle_model} ({r.vehicle_year})
              </p>
              <p className="mt-1 flex items-center gap-1 text-[11.5px] text-slate-400">
                <MapPin className="h-3 w-3" /> Request #{r.id}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                {STATUS_LABEL[r.status] || r.status}
              </span>
              <ChevronRight className="h-4 w-4 text-slate-300" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
