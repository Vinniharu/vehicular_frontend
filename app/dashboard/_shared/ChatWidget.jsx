"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MessageCircle, X, Send, Paperclip, Loader2 } from "lucide-react";
import { getMyChatThread, sendCustomerChatMessage, uploadApplicationFile, getCachedUser } from "@/lib/api";
import ChatBubble from "@/app/components/design/ChatBubble";
import { useToast } from "@/app/components/shared/ToastProvider";

const ACTIVE_POLL_MS = 4000;
const IDLE_POLL_MS = 30000;
const NEAR_BOTTOM_PX = 80;

function lastSeenKey(userId) {
  return `chat_last_seen_${userId || "anon"}`;
}

export default function ChatWidget() {
  const user = getCachedUser();
  const pushToast = useToast();
  const [open, setOpen] = useState(false);
  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);

  const openRef = useRef(open);
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);
  const documentVisibleRef = useRef(true);

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  useEffect(() => {
    const track = () => {
      documentVisibleRef.current = document.visibilityState === "visible";
    };
    document.addEventListener("visibilitychange", track);
    return () => document.removeEventListener("visibilitychange", track);
  }, []);

  const applyThread = useCallback(
    (data, { scrollToBottom = false } = {}) => {
      setTicket(data.ticket || null);
      setMessages(data.messages || []);

      const msgs = data.messages || [];
      const lastMessage = msgs[msgs.length - 1];
      const lastSeenAt = Number(localStorage.getItem(lastSeenKey(user?.id)) || 0);

      if (openRef.current) {
        const lastMessageAt = lastMessage?.created_at ? new Date(lastMessage.created_at).getTime() : 0;
        if (lastMessage) localStorage.setItem(lastSeenKey(user?.id), String(lastMessageAt));
        setUnreadCount(0);
      } else {
        const newUnreadCount = msgs.filter(
          (m) => m.sender_role !== "customer" && m.created_at && new Date(m.created_at).getTime() > lastSeenAt
        ).length;
        setUnreadCount((prev) => {
          if (newUnreadCount > 0 && prev === 0) {
            pushToast({
              title: "New message from support",
              body: lastMessage?.body || "Tap to view your conversation.",
              onClick: handleOpen,
            });
          }
          return newUnreadCount;
        });
      }

      if (scrollToBottom) {
        requestAnimationFrame(() => {
          if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user?.id, pushToast]
  );

  // Continuous polling while the widget is mounted — runs regardless of
  // open/collapsed state so the unread badge can update while collapsed.
  // Adaptive interval: fast only when the panel is open and there's an
  // active open ticket; otherwise back off to avoid polling every idle tab.
  useEffect(() => {
    let cancelled = false;
    let timeoutId;

    const tick = async () => {
      const nearBottom =
        !scrollRef.current ||
        scrollRef.current.scrollHeight - scrollRef.current.scrollTop - scrollRef.current.clientHeight < NEAR_BOTTOM_PX;

      const res = await getMyChatThread();
      if (!cancelled && res.data) {
        applyThread(res.data, { scrollToBottom: openRef.current && nearBottom });
      }
      setInitialLoading(false);

      const active = documentVisibleRef.current && openRef.current && res.data?.ticket?.status === "open";
      timeoutId = setTimeout(tick, active ? ACTIVE_POLL_MS : IDLE_POLL_MS);
    };

    tick();
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applyThread]);

  const handleOpen = () => {
    setOpen(true);
    setUnreadCount(0);
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.created_at) {
      localStorage.setItem(lastSeenKey(user?.id), String(new Date(lastMessage.created_at).getTime()));
    }
    requestAnimationFrame(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    });
  };

  const handleSend = async () => {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setSendError(null);
    const res = await sendCustomerChatMessage({ body });
    setSending(false);
    if (res.error) {
      setSendError(res.error);
      return;
    }
    setDraft("");
    const thread = await getMyChatThread();
    if (thread.data) applyThread(thread.data, { scrollToBottom: true });
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
    const res = await sendCustomerChatMessage({ body: body || undefined, attachment_url: upload.data.file_url });
    setSending(false);
    if (res.error) {
      setSendError(res.error);
      return;
    }
    setDraft("");
    const thread = await getMyChatThread();
    if (thread.data) applyThread(thread.data, { scrollToBottom: true });
  };

  if (!user) return null;

  if (!open) {
    return (
      <button
        type="button"
        onClick={handleOpen}
        className="fixed bottom-5 right-5 z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-[#28A745] text-white shadow-lg shadow-black/20 hover:bg-[#1F8838] transition-colors"
        aria-label="Open live chat"
      >
        <MessageCircle className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10.5px] font-bold text-white ring-2 ring-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
    );
  }

  const closed = ticket?.status === "closed";

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-white sm:inset-auto sm:bottom-5 sm:right-5 sm:h-[520px] sm:w-[380px] sm:rounded-2xl sm:shadow-2xl sm:ring-1 sm:ring-black/10">
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-3 sm:rounded-t-2xl">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-[#28A745]" />
          <h3 className="text-[13.5px] font-bold text-slate-900">Live chat</h3>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {initialLoading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-[#28A745]" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center px-4">
            <MessageCircle className="h-8 w-8 text-slate-300" />
            <p className="text-[13px] font-semibold text-slate-700">Need help?</p>
            <p className="text-[12px] text-slate-400">Send a message and a support agent will pick it up shortly.</p>
          </div>
        ) : (
          messages.map((m) => <ChatBubble key={m.id} message={m} isOwn={m.sender_role === "customer"} />)
        )}
      </div>

      <div className="border-t border-slate-100 p-3 sm:rounded-b-2xl">
        {sendError && <p className="mb-2 text-[11px] font-medium text-red-600">{sendError}</p>}
        {closed && (
          <p className="mb-2 text-[11px] text-slate-500">
            This conversation was closed — sending a message starts a new one.
          </p>
        )}
        <div className="flex items-end gap-2">
          <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => handleAttach(e.target.files?.[0])} />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={sending}
            className="inline-flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors disabled:opacity-60"
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
            placeholder="Type a message…"
            className="flex-1 resize-none rounded-lg border border-slate-200 px-3 py-2 text-[13px] text-slate-900 placeholder:text-slate-400 focus:border-[#28A745] focus:outline-none focus:ring-2 focus:ring-[#28A745]/15"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={sending || !draft.trim()}
            className="inline-flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-lg bg-[#28A745] text-white hover:bg-[#1F8838] transition-colors disabled:opacity-60"
            title="Send"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
