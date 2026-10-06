"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronRight, Inbox, RefreshCw, UserCheck } from "lucide-react";
import { getSupportTickets } from "@/lib/api";
import { Badge, Button, Card, EmptyState, Notice, PageHeader, Select, SkeletonList } from "@/app/dashboard/_kit";
import { Toolbar } from "@/app/admin/_kit";

function StatusBadge({ status }) {
  return (
    <Badge tone={status === "closed" ? "neutral" : "brand"} className="capitalize">
      {status}
    </Badge>
  );
}

function ClaimBadge({ name }) {
  return (
    <Badge tone={name ? "neutral" : "amber"}>
      <UserCheck className="h-3.5 w-3.5" aria-hidden />
      {name || "Unclaimed"}
    </Badge>
  );
}

export default function AdminTicketsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");

  const loadData = async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    const res = await getSupportTickets({ scope: "all", status: statusFilter || undefined, page_size: 50 });
    if (res.error) setError(res.error);
    else if (res.data) setItems(res.data.items || []);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  return (
    <div>
      <PageHeader
        title="Support tickets"
        description="Every conversation, whoever claimed it. Read-only: accepting and replying stays with support agents."
        actions={
          <Button variant="secondary" icon={RefreshCw} loading={refreshing} disabled={loading} onClick={() => loadData(true)}>
            Refresh
          </Button>
        }
      />

      <Toolbar>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter by status"
          className="md:w-56"
        >
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="closed">Closed</option>
        </Select>
      </Toolbar>

      {error && (
        <div className="mb-4">
          <Notice tone="red">{error}</Notice>
        </div>
      )}

      {loading ? (
        <SkeletonList rows={4} />
      ) : items.length === 0 ? (
        <EmptyState icon={Inbox} title="No tickets found" description="No tickets match this filter." />
      ) : (
        <Card padded={false} className="overflow-hidden">
          <ul className="divide-y divide-cx-line">
            {items.map((ticket) => (
              <li key={ticket.id}>
                <Link
                  href={`/admin/tickets/${ticket.id}`}
                  className="cx-focus flex items-start gap-3 p-4 transition-colors hover:bg-cx-sunken/60 sm:p-5"
                >
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="break-words text-[15px] font-semibold text-cx-ink">{ticket.subject}</p>
                        <p className="mt-0.5 text-[13px] text-cx-muted">
                          {ticket.created_at
                            ? new Date(ticket.created_at).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })
                            : "—"}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge status={ticket.status} />
                        <ClaimBadge name={ticket.claimed_by_name} />
                      </div>
                    </div>
                    <p className="line-clamp-2 whitespace-pre-wrap text-sm text-cx-ink-2">{ticket.initial_message}</p>
                    <p className="text-[13px] text-cx-muted">
                      Customer #{ticket.customer_id}
                      {ticket.application_id && <> · re: application #{ticket.application_id}</>}
                    </p>
                  </div>
                  <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-cx-muted" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
