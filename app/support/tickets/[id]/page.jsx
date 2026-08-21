"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Mail,
  Phone,
  Send,
  Paperclip,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import {
  getSupportTicket,
  getSupportTicketMessages,
  sendTicketMessage,
  claimSupportTicket,
  closeSupportTicket,
  uploadApplicationFile,
  getCachedUser,
} from "@/lib/api";
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

const ACTIVE_POLL_MS = 4000;
const IDLE_POLL_MS = 30000;
const NEAR_BOTTOM_PX = 80;

export default function SupportTicketThreadPage() {
  const params = useParams();
  const router = useRouter();
  const user = getCachedUser();
  const ticketId = params.id;

  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [claiming, setClaiming] = useState(false);
  const [closing, setClosing] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(null);

  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);
  const documentVisibleRef = useRef(true);

  const isMine = ticket?.claimed_by_id === user?.id;
  const isUnclaimed = !ticket?.claimed_by_id;
  const canReply = isMine && ticket?.status === "open";

  // Written on every successful load/poll while this page is mounted, so
  // the layout-level SupportChatNotifier's independent poll reads this
  // ticket as already caught up instead of firing a redundant toast for a
  // conversation the agent is actively looking at.
  const markSeen = useCallback(() => {
    if (user?.id) localStorage.setItem(`support_ticket_last_seen_${user.id}_${ticketId}`, String(Date.now()));
  }, [user?.id, ticketId]);

  const loadTicket = useCallback(async () => {
    const [ticketRes, messagesRes] = await Promise.all([
      getSupportTicket(ticketId),
      getSupportTicketMessages(ticketId),
    ]);
    if (ticketRes.error) {
      setError(ticketRes.error);
    } else {
      setTicket(ticketRes.data);
      if (messagesRes.data) setMessages(messagesRes.data.items || []);
      markSeen();
    }
    setLoading(false);
  }, [ticketId, markSeen]);

  useEffect(() => {
    loadTicket();
  }, [loadTicket]);

  useEffect(() => {
    const track = () => {
      documentVisibleRef.current = document.visibilityState === "visible";
    };
    document.addEventListener("visibilitychange", track);
    return () => document.removeEventListener("visibilitychange", track);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let timeoutId;

    const tick = async () => {
      const nearBottom =
        !scrollRef.current ||
        scrollRef.current.scrollHeight - scrollRef.current.scrollTop - scrollRef.current.clientHeight < NEAR_BOTTOM_PX;

      const res = await getSupportTicketMessages(ticketId);
      if (!cancelled && res.data) {
        setMessages(res.data.items || []);
        markSeen();
        if (nearBottom) {
          requestAnimationFrame(() => {
            if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
          });
        }
      }

      const active = documentVisibleRef.current && ticket?.status === "open" && ticket?.claimed_by_id;
      timeoutId = setTimeout(tick, active ? ACTIVE_POLL_MS : IDLE_POLL_MS);
    };

    timeoutId = setTimeout(tick, ticket?.status === "open" ? ACTIVE_POLL_MS : IDLE_POLL_MS);
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId, ticket?.status, ticket?.claimed_by_id, markSeen]);

  const handleClaim = async () => {
    setClaiming(true);
    const res = await claimSupportTicket(ticketId);
    setClaiming(false);
    if (!res.error) loadTicket();
  };

  const handleClose = async () => {
    setClosing(true);
    const res = await closeSupportTicket(ticketId);
    setClosing(false);
    if (!res.error) loadTicket();
  };

  const handleSend = async () => {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setSendError(null);
    const res = await sendTicketMessage(ticketId, { body });
    setSending(false);
    if (res.error) {
      setSendError(res.error);
      return;
    }
    setDraft("");
    setMessages((prev) => [...prev, res.data]);
    requestAnimationFrame(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    });
  };

  const handleAttach = async (file) => {
    if (!file || sending) return;
    setSending(true);
    setSendError(null);
    const upload = await uploadApplicationFile(file);
    if (upload.error || !upload.data?.file_url) {
      setSending(false);
      setSendError(upload.error || "Upload failed. Please try again.");
      return;
    }
    const body = draft.trim();
    const res = await sendTicketMessage(ticketId, { body: body || undefined, attachment_url: upload.data.file_url });
    setSending(false);
    if (res.error) {
      setSendError(res.error);
      return;
    }
    setDraft("");
    setMessages((prev) => [...prev, res.data]);
    requestAnimationFrame(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    });
  };

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
        onClick={() => router.push("/support/tickets")}
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
            {isMine && ticket.status === "open" && (
              <button
                type="button"
                onClick={handleClose}
                disabled={closing}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11.5px] font-semibold text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-60"
              >
                {closing ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />}
                Close
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div ref={scrollRef} className="h-[480px] overflow-y-auto p-5 space-y-3">
          {messages.map((m) => (
            <ChatBubble key={m.id} message={m} isOwn={m.sender_role === "support"} />
          ))}
        </div>

        <div className="border-t border-slate-100 p-4">
          {sendError && <p className="mb-2 text-[11.5px] font-medium text-red-600">{sendError}</p>}

          {isUnclaimed ? (
            <button
              type="button"
              onClick={handleClaim}
              disabled={claiming}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#28A745] px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-[#1F8838] transition-colors disabled:opacity-60"
            >
              {claiming ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Accept ticket
            </button>
          ) : !canReply ? (
            <p className="rounded-lg bg-slate-50 px-3 py-2.5 text-center text-[12.5px] text-slate-500">
              {ticket.status === "closed"
                ? "This ticket is closed."
                : "This ticket is being handled by another support agent."}
            </p>
          ) : (
            <div className="flex items-end gap-2">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={(e) => handleAttach(e.target.files?.[0])}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={sending}
                className="inline-flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors disabled:opacity-60"
                title="Attach a file"
              >
                <Paperclip className="h-4 w-4" />
              </button>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                disabled={sending}
                rows={1}
                placeholder="Type a reply…"
                className="flex-1 resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-[13px] text-slate-900 placeholder:text-slate-400 focus:border-[#28A745] focus:outline-none focus:ring-2 focus:ring-[#28A745]/15"
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={sending || !draft.trim()}
                className="inline-flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-lg bg-[#28A745] text-white hover:bg-[#1F8838] transition-colors disabled:opacity-60"
                title="Send"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
