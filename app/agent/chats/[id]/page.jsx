"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ClipboardList, Headset, UserRound } from "lucide-react";
import AgentChatPanel from "@/app/components/design/AgentChatPanel";
import ApplicationChatPanel from "@/app/components/dashboard/ApplicationChatPanel";
import { getAgentChats, getAgentSupportChat, sendAgentSupportChatMessage } from "@/lib/api";
import { Button, ErrorState, PageHeader, SkeletonList } from "@/app/dashboard/_kit";
import { jobHref, serviceLabel } from "../../_components/jobs";
import { UnreadBubble, useAgentChatUnread } from "../../_components/AgentChatNotifications";

const cx = (...parts) => parts.filter(Boolean).join(" ");

const TABS = [
  { id: "customer", label: "Customer", icon: UserRound },
  { id: "support", label: "Vehiculars Support", icon: Headset },
];

export default function AgentChatThreadPage() {
  return (
    <Suspense fallback={<SkeletonList rows={3} />}>
      <AgentChatThread />
    </Suspense>
  );
}

function AgentChatThread() {
  const params = useParams();
  const search = useSearchParams();
  const router = useRouter();
  const rawParam = String(params?.id || "");
  const rawId = rawParam.replace(/^app_/, "");
  const [tab, setTab] = useState(search.get("with") === "support" ? "support" : "customer");
  const [job, setJob] = useState(null);
  const [error, setError] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const { unread, refresh } = useAgentChatUnread();

  const loadJob = useCallback(async () => {
    const res = await getAgentChats();
    if (res.error) setError(res.error);
    else {
      const found = (res.data?.items || []).find((i) => String(i.raw_id) === rawId);
      if (found) setJob(found);
      else setError("This job isn't one of yours, or it no longer exists.");
    }
    setLoaded(true);
  }, [rawId]);

  useEffect(() => {
    loadJob();
  }, [loadJob]);

  // Refresh the per-tab badges whenever the portal-wide unread count changes.
  useEffect(() => {
    if (loaded) loadJob();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unread.total]);

  // Opening a thread marks it read on the server (its GET); re-check the badges shortly after.
  useEffect(() => {
    const t = setTimeout(refresh, 1500);
    return () => clearTimeout(t);
  }, [tab, refresh]);

  const selectTab = (id) => {
    setTab(id);
    router.replace(`/agent/chats/${rawParam}?with=${id}`, { scroll: false });
  };

  // Stable callbacks: the panel restarts its polling whenever these change identity.
  const loadSupport = useCallback(() => getAgentSupportChat(rawId), [rawId]);
  const sendSupport = useCallback(
    (msg) => sendAgentSupportChatMessage(rawId, { body: typeof msg === "string" ? msg : msg?.body }),
    [rawId]
  );

  if (loaded && error && !job) {
    return (
      <div>
        <PageHeader title="Chat" backHref="/agent/chats" backLabel="Chats" />
        <ErrorState title="Can't open this chat" message={error} onRetry={() => loadJob()} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={job ? `${serviceLabel(job.application_type)} · Job #${job.raw_id}` : "Chat"}
        description={job?.customer_first_name ? `Customer: ${job.customer_first_name}` : "Messages about this job"}
        backHref="/agent/chats"
        backLabel="Chats"
        actions={
          job ? (
            <Button href={jobHref({ raw_id: job.raw_id, application_type: job.application_type })} variant="secondary" size="sm" icon={ClipboardList}>
              Open job
            </Button>
          ) : null
        }
      />

      <div role="tablist" aria-label="Who you're chatting with" className="mb-4 grid grid-cols-2 gap-1 rounded-cx bg-cx-sunken p-1">
        {TABS.map((t) => {
          const Icon = t.icon;
          const count = tab === t.id ? 0 : job?.[t.id]?.unread || 0;
          return (
            <button
              key={t.id}
              role="tab"
              type="button"
              aria-selected={tab === t.id}
              onClick={() => selectTab(t.id)}
              className={cx(
                "cx-focus flex min-h-11 items-center justify-center gap-2 rounded-cx-sm px-2 text-[15px] font-semibold transition-colors",
                tab === t.id ? "bg-cx-surface text-cx-ink shadow-cx" : "text-cx-muted hover:text-cx-ink"
              )}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
              <span className="truncate">{t.label}</span>
              <UnreadBubble count={count} />
            </button>
          );
        })}
      </div>

      {!loaded ? (
        <SkeletonList rows={3} />
      ) : tab === "customer" ? (
        <ApplicationChatPanel key="customer" applicationId={rawId} myRole="agent" title="Chat with the customer" />
      ) : (
        <AgentChatPanel key="support" myRole="agent" headerLabel="Chat with Vehiculars Support" loadThread={loadSupport} sendMessage={sendSupport} />
      )}

      {tab === "support" ? (
        <p className="mt-3 text-center text-[13px] text-cx-muted">Phone numbers and email addresses can&apos;t be shared with Support in chat.</p>
      ) : null}
    </div>
  );
}
