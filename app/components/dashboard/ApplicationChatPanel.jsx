"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Loader2, AlertCircle, Send, MessageCircle, ShieldCheck, User } from "lucide-react";
import { getCustomerAgentChat, sendCustomerAgentChatMessage } from "@/lib/api";

const ACTIVE_POLL_MS = 4000;
const IDLE_POLL_MS = 20000;
const NEAR_BOTTOM_PX = 80;

export default function ApplicationChatPanel({
  applicationId,
  myRole = "customer",
  title = null,
}) {
  const [threadData, setThreadData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(null);

  const scrollRef = useRef(null);
  const documentVisibleRef = useRef(true);

  const defaultTitle =
    title || (myRole === "agent" ? "Live Chat with Customer" : "Live Chat with Field Agent");

  const loadThread = useCallback(async () => {
    if (!applicationId) return;
    const res = await getCustomerAgentChat(applicationId);
    if (res.error) {
      setError(res.error);
    } else if (res.data) {
      setThreadData(res.data);
      setMessages(res.data.messages || []);
      setError(null);
    }
    setLoading(false);
  }, [applicationId]);

  useEffect(() => {
    loadThread();
  }, [loadThread]);

  useEffect(() => {
    const track = () => {
      documentVisibleRef.current = document.visibilityState === "visible";
    };
    document.addEventListener("visibilitychange", track);
    return () => document.removeEventListener("visibilitychange", track);
  }, []);

  // Polling loop
  useEffect(() => {
    if (error || (threadData && !threadData.can_chat)) return;
    let cancelled = false;
    let timeoutId;

    const tick = async () => {
      const nearBottom =
        !scrollRef.current ||
        scrollRef.current.scrollHeight - scrollRef.current.scrollTop - scrollRef.current.clientHeight < NEAR_BOTTOM_PX;

      const res = await getCustomerAgentChat(applicationId);
      if (!cancelled && res.data) {
        setThreadData(res.data);
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
  }, [applicationId, error, threadData?.can_chat]);

  const handleSend = async () => {
    const body = draft.trim();
    if (!body || sending) return;

    setSending(true);
    setSendError(null);
    const res = await sendCustomerAgentChatMessage(applicationId, { body });
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
    <div id="chat" className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 bg-slate-50/50">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-[#28A745]">
            <MessageCircle className="h-4.5 w-4.5" />
          </div>
          <div>
            <h3 className="text-[13.5px] font-bold text-slate-900">{defaultTitle}</h3>
            <p className="text-[11.5px] text-slate-500">
              {threadData?.agent_name && myRole === "customer"
                ? `Assigned: ${threadData.agent_name}`
                : threadData?.customer_name && myRole === "agent"
                ? `Applicant: ${threadData.customer_name}`
                : "Direct application messaging"}
            </p>
          </div>
        </div>
        {threadData?.can_chat && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 ring-1 ring-inset ring-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Active
          </span>
        )}
      </div>

      {loading ? (
        <div className="p-10 text-center">
          <Loader2 className="h-6 w-6 animate-spin text-[#28A745] mx-auto" />
          <p className="mt-2 text-[12px] text-slate-400">Loading chat…</p>
        </div>
      ) : error ? (
        <div className="p-5 text-[12.5px] text-slate-500 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-500" />
          <span>{error}</span>
        </div>
      ) : threadData && !threadData.can_chat ? (
        <div className="p-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <MessageCircle className="h-6 w-6" />
          </div>
          <h4 className="text-[14px] font-semibold text-slate-800">Live chat not active yet</h4>
          <p className="mx-auto mt-1 max-w-sm text-[12.5px] text-slate-500">
            {threadData.status_message ||
              "Live chat will open automatically once a field agent accepts your application and starts working on it."}
          </p>
        </div>
      ) : (
        <>
          {/* Message History */}
          <div ref={scrollRef} className="h-[340px] overflow-y-auto p-4 space-y-3 bg-[#fdfdfd]">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center p-6">
                <p className="text-[13px] font-medium text-slate-600">No messages yet</p>
                <p className="mt-1 max-w-xs text-[12px] text-slate-400">
                  {myRole === "agent"
                    ? "Reach out to the customer if you need any additional details or clarification."
                    : "You can ask your assigned agent questions or send requested details here."}
                </p>
              </div>
            ) : (
              messages.map((m) => {
                const isOwn = m.sender_role === myRole;
                return (
                  <div key={m.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed shadow-sm ${
                        isOwn
                          ? "bg-[#28A745] text-white rounded-br-sm"
                          : "bg-white border border-slate-200 text-slate-800 rounded-bl-sm"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3 mb-1">
                        <span
                          className={`text-[10.5px] font-bold uppercase tracking-wider ${
                            isOwn ? "text-white/80" : "text-slate-400"
                          }`}
                        >
                          {isOwn
                            ? "You"
                            : m.sender_role === "agent"
                            ? (threadData?.agent_name || "Field Agent")
                            : (threadData?.customer_name || "Applicant")}
                        </span>
                        <span className={`text-[10px] ${isOwn ? "text-white/70" : "text-slate-400"}`}>
                          {m.created_at
                            ? new Date(m.created_at).toLocaleTimeString("en-NG", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : ""}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap break-words">{m.body}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Input Area */}
          <div className="border-t border-slate-100 p-3 bg-white">
            {sendError && (
              <p className="mb-2 text-[11.5px] font-medium text-red-600 px-1">{sendError}</p>
            )}
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
                placeholder={
                  myRole === "agent"
                    ? "Message customer… (Enter to send)"
                    : "Message your field agent… (Enter to send)"
                }
                className="flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-[13px] text-slate-900 placeholder:text-slate-400 focus:border-[#28A745] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#28A745]/15 transition-all"
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={sending || !draft.trim()}
                className="inline-flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl bg-[#28A745] text-white hover:bg-[#1F8838] transition-colors disabled:opacity-50 active:scale-95 shadow-sm"
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
