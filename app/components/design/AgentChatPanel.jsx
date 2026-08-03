"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Loader2, AlertCircle, Send, MessageCircle } from "lucide-react";
import ChatBubble from "./ChatBubble";

const ACTIVE_POLL_MS = 4000;
const IDLE_POLL_MS = 20000;
const NEAR_BOTTOM_PX = 80;

// Contact-info quick-check mirroring the server's app.core.chat_filters
// (Nigerian phone formats + email) — this is just for immediate feedback
// without a round-trip; the server call and its 400 stay authoritative.
const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;
const SEPARATOR_RE = /[\s.\-()]+/g;

function quickCheckContactInfo(text) {
  if (!text) return null;
  if (EMAIL_RE.test(text)) return "email";
  const normalized = text.replace(SEPARATOR_RE, "");
  const runs = normalized.match(/\+?\d+/g) || [];
  if (runs.some((run) => run.replace("+", "").length >= 10)) return "phone";
  return null;
}

/**
 * Shared CS<->agent chat panel for an application. Used on both the
 * support and agent application detail pages. No attachment UI at all —
 * this chat disallows images/documents entirely, unlike the customer<->CS
 * ticket chat. myRole is "support" or "agent" (whichever portal renders it).
 */
export default function AgentChatPanel({ myRole, headerLabel, loadThread, sendMessage }) {
  const [chatId, setChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(null);

  const scrollRef = useRef(null);
  const documentVisibleRef = useRef(true);

  const load = useCallback(async () => {
    const res = await loadThread();
    if (res.error) {
      setError(res.error);
    } else if (res.data) {
      setChatId(res.data.chat_id);
      setMessages(res.data.messages || []);
      setError(null);
    }
    setLoading(false);
  }, [loadThread]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const track = () => {
      documentVisibleRef.current = document.visibilityState === "visible";
    };
    document.addEventListener("visibilitychange", track);
    return () => document.removeEventListener("visibilitychange", track);
  }, []);

  useEffect(() => {
    if (error) return; // don't poll a chat we can't open (e.g. no agent assigned yet)
    let cancelled = false;
    let timeoutId;

    const tick = async () => {
      const nearBottom =
        !scrollRef.current ||
        scrollRef.current.scrollHeight - scrollRef.current.scrollTop - scrollRef.current.clientHeight < NEAR_BOTTOM_PX;

      const res = await loadThread();
      if (!cancelled && res.data) {
        setMessages(res.data.messages || []);
        if (nearBottom) {
          requestAnimationFrame(() => {
            if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
          });
        }
      }
      timeoutId = setTimeout(tick, documentVisibleRef.current ? ACTIVE_POLL_MS : IDLE_POLL_MS);
    };

    timeoutId = setTimeout(tick, ACTIVE_POLL_MS);
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadThread, error]);

  const handleSend = async () => {
    const body = draft.trim();
    if (!body || sending) return;

    const violation = quickCheckContactInfo(body);
    if (violation) {
      const phrase = violation === "email" ? "an email address" : "a phone number";
      setSendError(`Messages can't contain ${phrase}. Please rephrase.`);
      return;
    }

    setSending(true);
    setSendError(null);
    const res = await sendMessage(body);
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

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-3.5">
        <MessageCircle className="h-4 w-4 text-[#28A745]" />
        <span className="text-[13px] font-semibold text-slate-800">{headerLabel}</span>
      </div>

      {loading ? (
        <div className="p-10 text-center">
          <Loader2 className="h-6 w-6 animate-spin text-[#28A745] mx-auto" />
        </div>
      ) : error ? (
        <div className="p-5 text-[12.5px] text-slate-500 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-500" />
          <span>{error}</span>
        </div>
      ) : (
        <>
          <div ref={scrollRef} className="h-[360px] overflow-y-auto p-5 space-y-3">
            {messages.length === 0 ? (
              <p className="text-center text-[12.5px] text-slate-400 mt-8">No messages yet — say hello.</p>
            ) : (
              messages.map((m) => <ChatBubble key={m.id} message={m} isOwn={m.sender_role === myRole} />)
            )}
          </div>

          <div className="border-t border-slate-100 p-4">
            {sendError && <p className="mb-2 text-[11.5px] font-medium text-red-600">{sendError}</p>}
            <div className="flex items-end gap-2">
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
                placeholder="Type a message… (no contact info, no attachments)"
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
          </div>
        </>
      )}
    </div>
  );
}
