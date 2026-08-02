"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  MessageCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  CheckSquare,
  User,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { getSupportTickets, claimSupportTicket, closeSupportTicket, getCachedUser } from "@/lib/api";

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

export default function SupportTicketsPage() {
  const user = getCachedUser();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [actingOn, setActingOn] = useState(null);

  const loadData = async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    const res = await getSupportTickets({ page_size: 50 });
    if (res.error) setError(res.error);
    else if (res.data) setItems(res.data.items || []);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleClaim = async (ticket) => {
    setActingOn(ticket.id);
    const res = await claimSupportTicket(ticket.id);
    setActingOn(null);
    if (!res.error) loadData(true);
  };

  const handleClose = async (ticket) => {
    setActingOn(ticket.id);
    const res = await closeSupportTicket(ticket.id);
    setActingOn(null);
    if (!res.error) loadData(true);
  };

  return (
    <div className="space-y-6 pb-16">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-emerald-800 mb-2">
              <MessageCircle className="h-3.5 w-3.5 text-[#28A745]" />
              Support tickets
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Ticket queue</h1>
            <p className="mt-1 text-sm text-slate-600 max-w-2xl">
              Unclaimed tickets and the ones you've accepted. Accept a ticket before you can close it —
              once claimed, it drops out of everyone else's queue.
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
            <h3 className="text-base font-bold text-slate-900">No tickets</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">Nothing waiting right now.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {items.map((ticket) => {
              const isMine = ticket.claimed_by_id === user?.id;
              const isUnclaimed = !ticket.claimed_by_id;
              return (
                <div key={ticket.id} className="p-5 space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link href={`/support/tickets/${ticket.id}`} className="text-[13.5px] font-bold text-slate-900 hover:underline">
                        {ticket.subject}
                      </Link>
                      <p className="mt-0.5 flex items-center gap-1.5 text-[11.5px] text-slate-400">
                        <Clock className="h-3 w-3" />
                        {ticket.created_at ? new Date(ticket.created_at).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" }) : "—"}
                      </p>
                    </div>
                    <StatusBadge status={ticket.status} />
                  </div>
                  <p className="text-[13px] text-slate-600 whitespace-pre-wrap">{ticket.initial_message}</p>
                  <div className="flex items-center justify-between gap-3">
                    <p className="flex items-center gap-1.5 text-[11.5px] text-slate-400">
                      <User className="h-3 w-3" /> Customer #{ticket.customer_id}
                      {ticket.application_id && <span> · re: application #{ticket.application_id}</span>}
                    </p>
                    <div className="flex items-center gap-2">
                      {isUnclaimed && (
                        <button
                          type="button"
                          onClick={() => handleClaim(ticket)}
                          disabled={actingOn === ticket.id}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-[#28A745] px-3 py-1.5 text-[11.5px] font-semibold text-white hover:bg-[#1F8838] transition-colors disabled:opacity-60"
                        >
                          {actingOn === ticket.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                          Accept
                        </button>
                      )}
                      {isMine && ticket.status === "open" && (
                        <button
                          type="button"
                          onClick={() => handleClose(ticket)}
                          disabled={actingOn === ticket.id}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11.5px] font-semibold text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-60"
                        >
                          {actingOn === ticket.id && <Loader2 className="h-3 w-3 animate-spin" />}
                          Close
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
