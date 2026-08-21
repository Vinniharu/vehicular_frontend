"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MapPin, RefreshCw, Loader2, CheckSquare, Car, Clock } from "lucide-react";
import { getReferenceStates, getRwxBaysByState, staffGetRwxQueue } from "@/lib/api";

const STATUS_TONE = {
  paid: "bg-sky-50 text-sky-700 ring-sky-200",
  staff_review: "bg-amber-50 text-amber-700 ring-amber-200",
  routed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  agent_accepted: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  agent_completed: "bg-violet-50 text-violet-700 ring-violet-200",
  staff_final_review: "bg-violet-50 text-violet-700 ring-violet-200",
  awaiting_customer: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  completed: "bg-slate-100 text-slate-500 ring-slate-200",
  failed: "bg-red-50 text-red-700 ring-red-200",
  staff_rejected: "bg-red-50 text-red-700 ring-red-200",
};

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset capitalize ${STATUS_TONE[status] || "bg-slate-100 text-slate-600 ring-slate-200"}`}>
      {(status || "").replace(/_/g, " ")}
    </span>
  );
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function StaffRwxQueuePage() {
  const router = useRouter();
  const [states, setStates] = useState([]);
  const [stateId, setStateId] = useState("");
  const [bays, setBays] = useState([]);
  const [bayId, setBayId] = useState("");
  const [bookingDate, setBookingDate] = useState(todayIso());
  const [statusFilter, setStatusFilter] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    getReferenceStates().then((res) => { if (res.data) setStates(res.data); });
  }, []);

  useEffect(() => {
    if (!stateId) {
      setBays([]);
      setBayId("");
      return;
    }
    getRwxBaysByState(stateId).then((res) => {
      setBays(res.data?.items || []);
      setBayId("");
    });
  }, [stateId]);

  const loadQueue = async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    const res = await staffGetRwxQueue({
      bay_id: bayId || undefined,
      booking_date: bookingDate || undefined,
      status_filter: statusFilter || undefined,
    });
    if (res.data?.items) setItems(res.data.items);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    loadQueue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bayId, bookingDate, statusFilter]);

  return (
    <div className="space-y-6 pb-16">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-emerald-800 mb-2">
              <MapPin className="h-3.5 w-3.5 text-[#28A745]" />
              Roadworthiness Express
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Bay day queue</h1>
            <p className="mt-1 text-sm text-slate-600 max-w-2xl">
              Every booking for a bay on a given day, regardless of who claimed it — oversight for the day's schedule.
            </p>
          </div>
          <button
            type="button"
            onClick={() => loadQueue(true)}
            disabled={refreshing || loading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 transition-all shadow-sm shrink-0 self-start md:self-center"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin text-[#28A745]" : "text-slate-500"}`} />
            <span>{refreshing ? "Syncing…" : "Refresh"}</span>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select value={stateId} onChange={(e) => setStateId(e.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-[13px] text-slate-700 shadow-sm">
          <option value="">Select state</option>
          {states.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={bayId} onChange={(e) => setBayId(e.target.value)} disabled={!stateId} className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-[13px] text-slate-700 shadow-sm disabled:opacity-50">
          <option value="">All bays</option>
          {bays.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <input type="date" value={bookingDate} onChange={(e) => setBookingDate(e.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-[13px] text-slate-700 shadow-sm" />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-[13px] text-slate-700 shadow-sm">
          <option value="">All statuses</option>
          {Object.keys(STATUS_TONE).map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
        </select>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-[#28A745] mx-auto" />
            <p className="text-sm text-slate-500 font-medium">Loading queue…</p>
          </div>
        ) : items.length === 0 ? (
          <div className="p-16 text-center space-y-2">
            <CheckSquare className="h-10 w-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">No bookings</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">Nothing scheduled for this filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/60">
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">ID</th>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Bay</th>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Slot</th>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Customer</th>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Vehicle</th>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => (
                  <tr key={item.id} onClick={() => router.push(`/staff/applications/${item.id}`)} className="cursor-pointer hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3.5 font-mono text-[12.5px] font-bold text-slate-900">#{item.id}</td>
                    <td className="px-4 py-3.5 text-[13px] text-slate-700">{item.bay_name}</td>
                    <td className="px-4 py-3.5 text-[12.5px] text-slate-600"><span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-slate-400" /> {item.slot_label}</span></td>
                    <td className="px-4 py-3.5 text-[13px] font-semibold text-slate-800">{item.customer_name || "—"}</td>
                    <td className="px-4 py-3.5 text-[12.5px] text-slate-600"><span className="flex items-center gap-1"><Car className="h-3.5 w-3.5 text-slate-400" /> {item.make ? `${item.make} ${item.model || ""}` : "—"} {item.plate_number ? `· ${item.plate_number}` : ""}</span></td>
                    <td className="px-4 py-3.5"><StatusBadge status={item.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
