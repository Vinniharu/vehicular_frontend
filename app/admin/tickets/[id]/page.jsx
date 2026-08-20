"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, AlertCircle, Mail, Phone, UserCheck } from "lucide-react";
import { getSupportTicket, getSupportTicketMessages } from "@/lib/api";
import ChatBubble from "@/app/components/design/ChatBubble";

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

export default function AdminTicketThreadPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params.id;

  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      const [ticketRes, messagesRes] = await Promise.all([
        getSupportTicket(ticketId),
        getSupportTicketMessages(ticketId),
      ]);
      if (ticketRes.error) {
        setError(ticketRes.error);
      } else {
        setTicket(ticketRes.data);
        if (messagesRes.data) setMessages(messagesRes.data.items || []);
      }
      setLoading(false);
    })();
  }, [ticketId]);

  if (loading) {
    return (
      <div className="p-16 text-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-[#28A745] mx-auto" />
        <p className="text-sm text-slate-500 font-medium">Loading ticket…</p>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-center gap-3">
        <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
        <span>{error || "Ticket not found."}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      <button
        onClick={() => router.push("/admin/tickets")}
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to tickets
      </button>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">{ticket.subject}</h1>
            <Link href={`/support/customers/${ticket.customer_id}`} className="text-[13px] font-semibold text-slate-700 hover:underline">
              {ticket.customer_name}
            </Link>
            <div className="mt-1.5 space-y-0.5">
              <p className="flex items-center gap-1.5 text-[12.5px] text-slate-600">
                <Mail className="h-3.5 w-3.5" /> {ticket.customer_email}
              </p>
              {ticket.customer_phone && (
                <p className="flex items-center gap-1.5 text-[12.5px] text-slate-600">
                  <Phone className="h-3.5 w-3.5" /> {ticket.customer_phone}
                </p>
              )}
              {ticket.application_id && (
                <p className="text-[12.5px] text-slate-500">
                  Re:{" "}
                  <Link href={`/support/applications/${ticket.application_id}`} className="font-semibold hover:underline">
                    Application #{ticket.application_id}
                  </Link>
                </p>
              )}
            </div>
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
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="h-[480px] overflow-y-auto p-5 space-y-3">
          {messages.length === 0 ? (
            <p className="text-center text-[13px] text-slate-400">No messages yet.</p>
          ) : (
            messages.map((m) => (
              <ChatBubble key={m.id} message={m} isOwn={m.sender_role === "support"} />
            ))
          )}
        </div>
        <div className="border-t border-slate-100 p-4">
          <p className="rounded-lg bg-slate-50 px-3 py-2.5 text-center text-[12.5px] text-slate-500">
            Read-only — replying stays a support-agent action.
          </p>
        </div>
      </div>
    </div>
  );
}
