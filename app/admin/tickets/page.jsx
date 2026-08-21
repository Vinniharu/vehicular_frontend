"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  MessageCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  CheckSquare,
  User,
  Clock,
  UserCheck,
} from "lucide-react";
import { getSupportTickets } from "@/lib/api";

const STATUS_TONE = {
  open: "bg-sky-50 text-sky-700 ring-sky-200",
  closed: "bg-slate-100 text-slate-500 ring-slate-200",
};

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset capitalize ${STATUS_TONE[status] || STATUS_TONE.open}`}>
      {status}
    </span>
  );
}

export default function AdminTicketsPage() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");

  const loadData = async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    const res = await getSupportTickets({ scope: "all", status: statusFilter || undefined, page_size: 50 });
    if (res.error) setError(res.error);
    else if (res.data) setItems(res.data.items || []);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  return (
    <div className="space-y-6 pb-16">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-emerald-800 mb-2">
              <MessageCircle className="h-3.5 w-3.5 text-[#28A745]" />
              Full oversight
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Every support ticket</h1>
            <p className="mt-1 text-sm text-slate-600 max-w-2xl">
              Every conversation regardless of who claimed it. Read-only — accepting and replying stays
              a support-agent action, this view is for visibility into who's handling what.
            </p>
          </div>
          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={refreshing || loading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 transition-all shadow-sm shrink-0 self-start md:self-center"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin text-[#28A745]" : "text-slate-500"}`} />
            <span>{refreshing ? "Syncing…" : "Refresh"}</span>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-[13px] text-slate-700 shadow-sm focus:border-[#28A745] focus:outline-none focus:ring-2 focus:ring-[#28A745]/15"
        >
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-[#28A745] mx-auto" />
            <p className="text-sm text-slate-500 font-medium">Loading tickets…</p>
          </div>
        ) : items.length === 0 ? (
          <div className="p-16 text-center space-y-2">
            <CheckSquare className="h-10 w-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">No tickets found</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">No tickets match this filter.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {items.map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => router.push(`/admin/tickets/${ticket.id}`)}
                className="p-5 space-y-3 cursor-pointer hover:bg-slate-50/80 transition-colors"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link href={`/admin/tickets/${ticket.id}`} onClick={(e) => e.stopPropagation()} className="text-[13.5px] font-bold text-slate-900 hover:underline">
                      {ticket.subject}
                    </Link>
                    <p className="mt-0.5 flex items-center gap-1.5 text-[11.5px] text-slate-400">
                      <Clock className="h-3 w-3" />
                      {ticket.created_at ? new Date(ticket.created_at).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" }) : "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={ticket.status} />
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${
                      ticket.claimed_by_name ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-amber-50 text-amber-700 ring-amber-200"
                    }`}>
                      <UserCheck className="h-3 w-3" />
                      {ticket.claimed_by_name || "Unclaimed"}
                    </span>
                  </div>
                </div>
                <p className="text-[13px] text-slate-600 whitespace-pre-wrap line-clamp-2">{ticket.initial_message}</p>
                <p className="flex items-center gap-1.5 text-[11.5px] text-slate-400">
                  <User className="h-3 w-3" />
                  Customer #{ticket.customer_id}
                  {ticket.application_id && (
                    <>
                      {" · re: application #"}
                      {ticket.application_id}
                    </>
                  )}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
