"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Inbox, Loader2, ChevronRight } from "lucide-react";
import { dealerListOrders } from "@/lib/api";

const BRAND = "#28A745";

const STATUS_TONE = {
  bid_selected: "bg-amber-50 text-amber-700",
  shipped: "bg-blue-50 text-blue-700",
  delivered: "bg-blue-50 text-blue-700",
  confirmed: "bg-emerald-50 text-emerald-700",
  completed: "bg-emerald-50 text-emerald-700",
  disputed: "bg-red-50 text-red-700",
  under_staff_review: "bg-red-50 text-red-700",
  resolved: "bg-slate-100 text-slate-600",
};

export default function DealerOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dealerListOrders().then((res) => {
      if (Array.isArray(res.data)) setOrders(res.data);
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">My Bids & Orders</h1>
        <p className="mt-1 text-[13.5px] text-slate-500">Requests where your bid was selected.</p>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center shadow-sm">
          <Inbox className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-4 text-[14px] font-bold text-slate-800">No orders yet</p>
          <p className="mt-1 text-[12.5px] text-slate-400">Submit bids on matched requests to win your first order.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="divide-y divide-slate-100">
            {orders.map((o) => (
              <Link key={o.id} href={`/dealer/requests/${o.id}`} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-slate-900">{o.part_name}</p>
                  <p className="mt-0.5 text-[12.5px] text-slate-500">{o.vehicle_make} {o.vehicle_model} ({o.vehicle_year})</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS_TONE[o.status] || "bg-slate-100 text-slate-600"}`}>
                    {o.status}
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
