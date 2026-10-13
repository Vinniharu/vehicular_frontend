"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Headset, MessagesSquare, RefreshCw, UserRound } from "lucide-react";
import { getAgentChats } from "@/lib/api";
import { Button, EmptyState, ErrorState, PageHeader, SkeletonList } from "@/app/dashboard/_kit";
import { serviceLabel } from "../_components/jobs";
import { UnreadBubble, useAgentChatUnread } from "../_components/AgentChatNotifications";

const cx = (...parts) => parts.filter(Boolean).join(" ");
const REFRESH_MS = 15000;

const FILTERS = [
  { id: "all", label: "All chats" },
  { id: "unread", label: "Unread" },
];

function timeAgo(iso) {
  if (!iso) return "";
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 7 * 86400) return `${Math.floor(diff / 86400)}d`;
  return new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short" });
}

function preview(thread, kind) {
  if (!thread?.last_message) return kind === "customer" ? "No messages from the customer yet" : "No messages from Support yet";
  const fromYou = thread.last_sender_role === "agent";
  return `${fromYou ? "You: " : ""}${thread.last_message}`;
}

function ThreadRow({ job, kind }) {
  const thread = job[kind];
  const Icon = kind === "customer" ? UserRound : Headset;
  const unread = thread?.unread || 0;
  const who = kind === "customer" ? (job.customer_first_name ? `${job.customer_first_name} (customer)` : "Customer") : "Vehiculars Support";
  return (
    <Link
      href={`/agent/chats/${job.id}?with=${kind}`}
      className="cx-focus group flex min-h-14 items-center gap-3 px-4 py-3 transition-colors hover:bg-cx-sunken/60"
    >
      <span
        className={cx(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
          kind === "customer" ? "bg-cx-brand-soft text-cx-brand-deep" : "bg-cx-sunken text-cx-ink-2"
        )}
        aria-hidden
      >
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className={cx("truncate text-[15px]", unread ? "font-semibold text-cx-ink" : "text-cx-ink-2")}>{who}</p>
          <span className={cx("shrink-0 text-xs", unread ? "font-semibold text-cx-brand-deep" : "text-cx-muted")}>{timeAgo(thread?.last_message_at)}</span>
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <p className={cx("truncate text-sm", unread ? "font-medium text-cx-ink" : "text-cx-muted")}>{preview(thread, kind)}</p>
          <UnreadBubble count={unread} />
        </div>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-cx-muted transition-transform group-hover:translate-x-0.5" aria-hidden />
    </Link>
  );
}

export default function AgentChatsPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("all");
  const { unread, refresh } = useAgentChatUnread();

  const load = useCallback(async (quiet = false) => {
    if (quiet) setRefreshing(true);
    const res = await getAgentChats();
    if (res.error) setError(res.error);
    else {
      setData(res.data);
      setError(null);
    }
    setRefreshing(false);
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(() => load(), REFRESH_MS);
    return () => clearInterval(id);
  }, [load]);

  // Keep the list in step with the nav badge when a new message lands.
  useEffect(() => {
    if (data && unread.total !== data.unread?.total) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unread.total]);

  const items = useMemo(() => data?.items || [], [data]);
  const visible = filter === "unread" ? items.filter((j) => j.unread > 0) : items;
  const unreadJobs = items.filter((j) => j.unread > 0).length;

  return (
    <div>
      <PageHeader
        title="Chats"
        description="Messages from customers and from Vehiculars Support about your jobs."
        actions={
          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            loading={refreshing}
            onClick={() => {
              load(true);
              refresh();
            }}
          >
            Refresh
          </Button>
        }
      />

      <div role="tablist" aria-label="Filter chats" className="mb-4 grid grid-cols-2 gap-1 rounded-cx bg-cx-sunken p-1 sm:max-w-sm">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            role="tab"
            type="button"
            aria-selected={filter === f.id}
            onClick={() => setFilter(f.id)}
            className={cx(
              "cx-focus flex min-h-11 items-center justify-center gap-1.5 rounded-cx-sm text-[15px] font-semibold transition-colors",
              filter === f.id ? "bg-cx-surface text-cx-ink shadow-cx" : "text-cx-muted hover:text-cx-ink"
            )}
          >
            {f.label}
            {f.id === "unread" && unreadJobs ? <UnreadBubble count={unreadJobs} /> : null}
          </button>
        ))}
      </div>

      {error && !data ? (
        <ErrorState message={error} onRetry={() => load()} />
      ) : !data ? (
        <SkeletonList rows={4} />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={MessagesSquare}
          title={filter === "unread" ? "You're all caught up" : "No messages yet"}
          description={
            filter === "unread"
              ? "New messages from customers and Support will show up here."
              : "When a customer or Vehiculars Support writes to you about a job, it shows up here."
          }
          action={filter === "unread" ? null : <Button href="/agent/applications" variant="secondary">See my jobs</Button>}
        />
      ) : (
        <ul className="space-y-3">
          {visible.map((job) => (
            <li
              key={job.id}
              className={cx(
                "overflow-hidden rounded-cx-lg border bg-cx-surface shadow-cx",
                job.unread ? "border-cx-brand/40" : "border-cx-line"
              )}
            >
              <div className="flex items-center justify-between gap-2 border-b border-cx-line px-4 py-2.5">
                <p className="truncate text-sm text-cx-muted">
                  <span className="font-semibold text-cx-ink">{serviceLabel(job.application_type)}</span> · Job #{job.raw_id}
                </p>
                <Link href={`/agent/chats/${job.id}`} className="cx-focus shrink-0 rounded-cx-sm text-sm font-semibold text-cx-brand-deep hover:underline">
                  Open
                </Link>
              </div>
              <div className="divide-y divide-cx-line">
                <ThreadRow job={job} kind="customer" />
                <ThreadRow job={job} kind="support" />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
