"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { getAgentChatUnread, getAgentChats, getCachedUser, getToken } from "@/lib/api";
import { useToast } from "@/app/components/shared/ToastProvider";

const ACTIVE_POLL_MS = 10000;
const IDLE_POLL_MS = 60000;

const EMPTY = { total: 0, customer: 0, support: 0 };
const AgentChatContext = createContext({ unread: EMPTY, refresh: () => {} });

/** Unread totals for the agent's job chats, shared by the nav badges and the Chats pages. */
export function useAgentChatUnread() {
  return useContext(AgentChatContext);
}

/**
 * Portal-wide unread signal for the agent's customer and Support chats. Polls
 * the server-side unread totals (read state is stored per agent on the server,
 * so it's the same on every device) and pops a toast when a new message
 * arrives — linking to that job's chat, unless the agent is already on it.
 */
export function AgentChatNotificationsProvider({ children }) {
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;
  const pushToast = useToast();
  const [unread, setUnread] = useState(EMPTY);
  const prevRef = useRef(null);
  const visibleRef = useRef(true);
  const timeoutRef = useRef(null);

  const announce = useCallback(
    async (prev, next) => {
      // Find the job whose message just arrived, to link straight to it.
      const res = await getAgentChats();
      const items = res.data?.items || [];
      const kind = next.support > prev.support && next.customer <= prev.customer ? "support" : "customer";
      const job = items
        .filter((i) => i[kind]?.unread > 0)
        .sort((a, b) => new Date(b[kind].last_message_at || 0) - new Date(a[kind].last_message_at || 0))[0];
      const href = job ? `/agent/chats/${job.id}?with=${kind}` : "/agent/chats";
      if (job && pathnameRef.current === `/agent/chats/${job.id}`) return;
      pushToast({
        title: kind === "support" ? "New message from Vehiculars Support" : "New message from a customer",
        body: job?.[kind]?.last_message || "Open Chats to read it.",
        href,
      });
    },
    [pushToast]
  );

  const tick = useCallback(async () => {
    // Only once an agent is signed in (the layout handles the redirect otherwise).
    if (!getToken() || getCachedUser()?.role !== "agent") return;
    const res = await getAgentChatUnread();
    if (res.data) {
      const next = { total: res.data.total || 0, customer: res.data.customer || 0, support: res.data.support || 0 };
      const prev = prevRef.current;
      prevRef.current = next;
      setUnread(next);
      if (prev && next.total > prev.total) announce(prev, next);
    }
  }, [announce]);

  useEffect(() => {
    const track = () => {
      visibleRef.current = document.visibilityState === "visible";
    };
    document.addEventListener("visibilitychange", track);
    return () => document.removeEventListener("visibilitychange", track);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loop = async () => {
      await tick();
      if (!cancelled) timeoutRef.current = setTimeout(loop, visibleRef.current ? ACTIVE_POLL_MS : IDLE_POLL_MS);
    };
    loop();
    return () => {
      cancelled = true;
      clearTimeout(timeoutRef.current);
    };
  }, [tick]);

  // Re-check promptly after the agent opens a chat (the thread's GET marks it read).
  const refresh = useCallback(() => {
    tick();
  }, [tick]);

  return <AgentChatContext.Provider value={{ unread, refresh }}>{children}</AgentChatContext.Provider>;
}

/** Small count bubble: "9+" past nine. Hidden at zero. */
export function UnreadBubble({ count, className = "", tone = "red" }) {
  if (!count) return null;
  const tones = {
    red: "bg-cx-red text-white",
    light: "bg-white text-cx-red",
  };
  return (
    <span
      className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold leading-none tabular-nums ${tones[tone]} ${className}`}
      aria-label={`${count} unread`}
    >
      {count > 9 ? "9+" : count}
    </span>
  );
}
