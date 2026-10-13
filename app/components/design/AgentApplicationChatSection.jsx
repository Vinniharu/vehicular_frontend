"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Headset, MessagesSquare, UserRound } from "lucide-react";
import AgentChatPanel from "@/app/components/design/AgentChatPanel";
import ApplicationChatPanel from "@/app/components/dashboard/ApplicationChatPanel";
import { getAgentChats, getAgentSupportChat, sendAgentSupportChatMessage } from "@/lib/api";
import { UnreadBubble, useAgentChatUnread } from "@/app/agent/_components/AgentChatNotifications";

const cx = (...parts) => parts.filter(Boolean).join(" ");

const TABS = [
  { id: "customer", label: "Customer", icon: UserRound },
  { id: "support", label: "Vehiculars Support", icon: Headset },
];

/**
 * The job's two chats (customer and Vehiculars Support), shown at the bottom of each agent job
 * screen. Each tab shows its own unread count; opening a tab reads it (the thread's GET marks it
 * read on the server). The full conversation view lives at /agent/chats/<job>.
 */
export default function AgentApplicationChatSection({ application }) {
  const [activeChatTab, setActiveChatTab] = useState("customer");
  const [counts, setCounts] = useState({ customer: 0, support: 0 });
  const { unread, refresh } = useAgentChatUnread();
  const appId = application?.raw_id || application?.id;
  const rawId = typeof appId === "string" ? appId.replace(/^app_/, "") : appId;

  // Per-tab unread for this job, kept in step with the portal-wide badge.
  useEffect(() => {
    if (!rawId) return;
    let cancelled = false;
    getAgentChats().then((res) => {
      const job = (res.data?.items || []).find((i) => String(i.raw_id) === String(rawId));
      if (!cancelled && job) setCounts({ customer: job.customer?.unread || 0, support: job.support?.unread || 0 });
    });
    return () => {
      cancelled = true;
    };
  }, [rawId, unread.total]);

  useEffect(() => {
    const t = setTimeout(refresh, 1500);
    return () => clearTimeout(t);
  }, [activeChatTab, refresh]);

  // Stable callbacks: the panel restarts its polling whenever these change identity, and inline
  // arrows here used to restart it on every re-render.
  const loadSupport = useCallback(() => getAgentSupportChat(rawId), [rawId]);
  const sendSupport = useCallback(
    (msg) => sendAgentSupportChatMessage(rawId, { body: typeof msg === "string" ? msg : msg?.body }),
    [rawId]
  );

  if (!rawId) return null;

  return (
    <section id="chat" className="scroll-mt-20 space-y-4 rounded-cx-lg border border-cx-line bg-cx-surface p-4 shadow-cx sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-[17px] font-semibold text-cx-ink">
          <MessagesSquare className="h-5 w-5 text-cx-brand" aria-hidden />
          Messages
        </h2>
        <Link href={`/agent/chats/app_${rawId}?with=${activeChatTab}`} className="cx-focus rounded-cx-sm text-sm font-semibold text-cx-brand-deep hover:underline">
          Open in Chats
        </Link>
      </div>

      <div role="tablist" aria-label="Who you're chatting with" className="grid grid-cols-2 gap-1 rounded-cx bg-cx-sunken p-1">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = activeChatTab === t.id;
          return (
            <button
              key={t.id}
              role="tab"
              type="button"
              aria-selected={active}
              onClick={() => setActiveChatTab(t.id)}
              className={cx(
                "cx-focus flex min-h-11 items-center justify-center gap-2 rounded-cx-sm px-2 text-[15px] font-semibold transition-colors",
                active ? "bg-cx-surface text-cx-ink shadow-cx" : "text-cx-muted hover:text-cx-ink"
              )}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
              <span className="truncate">{t.label}</span>
              <UnreadBubble count={active ? 0 : counts[t.id]} />
            </button>
          );
        })}
      </div>

      {activeChatTab === "customer" ? (
        <ApplicationChatPanel key="customer" applicationId={rawId} myRole="agent" title="Chat with the customer" />
      ) : (
        <AgentChatPanel key="support" myRole="agent" headerLabel="Chat with Vehiculars Support" loadThread={loadSupport} sendMessage={sendSupport} />
      )}
    </section>
  );
}
