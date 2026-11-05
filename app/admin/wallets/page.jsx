"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Coins, MinusCircle, Users, Wallet } from "lucide-react";
import {
  adminGetClientWalletSummary,
  adminGetClientWalletTransactions,
  adminListClientWallets,
  adminListWalletDeductions,
} from "@/lib/api";
import { Badge, Button, Notice, PageHeader, Select, Sheet, SkeletonList } from "@/app/dashboard/_kit";
import { ResponsiveTable, StatTile, Tabs, Toolbar, formatNaira } from "@/app/admin/_kit";
import DeductSheet from "./_deduct_sheet";

const PAGE_SIZE = 25;

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-NG", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function txLabel(tx) {
  if (tx.source === "admin_deduction") return "Deducted by Vehiculars";
  if (tx.source?.startsWith("referral_reward_app_")) return "Referral reward";
  if (tx.source === "link_merge") return "Wallets linked";
  if (tx.source === "unlink_transfer") return "Wallets unlinked";
  if (tx.source === "spare_parts_reversal") return "Spare Parts refund";
  if (tx.platform === "spare_parts") return tx.type === "credit" ? "Spare Parts credit" : "Spare Parts payment";
  return tx.type === "credit" ? "Wallet deposit" : "Service payment";
}

function Pager({ page, totalPages, onPage }) {
  if (totalPages <= 1) return null;
  return (
    <div className="mt-4 flex items-center justify-between gap-3">
      <p className="text-[14px] text-cx-muted">
        Page {page} of {totalPages}
      </p>
      <div className="flex gap-2">
        <Button variant="secondary" icon={ChevronLeft} onClick={() => onPage(page - 1)} disabled={page <= 1}>
          Previous
        </Button>
        <Button variant="secondary" icon={ChevronRight} onClick={() => onPage(page + 1)} disabled={page >= totalPages}>
          Next
        </Button>
      </div>
    </div>
  );
}

export default function ClientWalletsPage() {
  const [section, setSection] = useState("clients");
  const [summary, setSummary] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("balance_desc");
  const [page, setPage] = useState(1);
  const [clients, setClients] = useState({ items: [], total: 0, total_pages: 1 });
  const [clientsLoading, setClientsLoading] = useState(true);
  const [clientsError, setClientsError] = useState(null);
  const latestClientsRequest = useRef(0);

  const [historyPage, setHistoryPage] = useState(1);
  const [history, setHistory] = useState({ items: [], total: 0, total_pages: 1 });
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState(null);

  const [viewing, setViewing] = useState(null);
  const [activity, setActivity] = useState(null);
  const [activityError, setActivityError] = useState(null);
  const [deducting, setDeducting] = useState(null);

  const loadSummary = useCallback(async () => {
    const res = await adminGetClientWalletSummary();
    if (res.data) setSummary(res.data);
  }, []);

  const loadClients = useCallback(async () => {
    const requestId = ++latestClientsRequest.current;
    setClientsLoading(true);
    const res = await adminListClientWallets({ search: search || undefined, sort, page, page_size: PAGE_SIZE });
    // A slower, older search must not overwrite a newer one.
    if (requestId !== latestClientsRequest.current) return;
    if (res.data) setClients(res.data);
    setClientsError(res.error || null);
    setClientsLoading(false);
  }, [search, sort, page]);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    const res = await adminListWalletDeductions({ page: historyPage, page_size: PAGE_SIZE });
    if (res.data) setHistory(res.data);
    setHistoryError(res.error || null);
    setHistoryLoading(false);
  }, [historyPage]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchTerm.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const openView = async (client) => {
    setViewing(client);
    setActivity(null);
    setActivityError(null);
    const res = await adminGetClientWalletTransactions(client.id, { page_size: 50 });
    if (res.data) setActivity(res.data);
    setActivityError(res.error || null);
  };

  const startDeduct = (client) => {
    setViewing(null);
    setDeducting(client);
  };

  const afterDeduction = async () => {
    setDeducting(null);
    await Promise.all([loadClients(), loadSummary(), loadHistory()]);
  };

  const clientColumns = [
    {
      key: "client",
      header: "Client",
      primary: true,
      render: (c) => (
        <div className="min-w-0">
          <p className="font-medium text-cx-ink">{c.name}</p>
          <p className="break-all text-[13px] text-cx-muted">{[c.email, c.phone].filter(Boolean).join(" · ")}</p>
        </div>
      ),
    },
    {
      key: "balance",
      header: "Wallet balance",
      render: (c) => (
        <div className="space-y-1">
          <p className="font-semibold">{formatNaira(c.wallet_balance_kobo)}</p>
          {c.wallet_linked_to_spare_parts ? <Badge tone="amber">Shared with Spare Parts</Badge> : null}
          {!c.is_active ? <Badge tone="neutral">Inactive account</Badge> : null}
        </div>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (c) => (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={() => openView(c)}>
            View
          </Button>
          <Button size="sm" icon={MinusCircle} onClick={() => startDeduct(c)} disabled={!c.wallet_balance_kobo}>
            Deduct
          </Button>
        </div>
      ),
    },
  ];

  const historyColumns = [
    {
      key: "client",
      header: "Client",
      primary: true,
      render: (d) => (
        <div className="min-w-0">
          <p className="font-medium text-cx-ink">{d.customer_name}</p>
          <p className="break-all text-[13px] text-cx-muted">{d.customer_email}</p>
        </div>
      ),
    },
    { key: "amount", header: "Amount", render: (d) => <span className="font-semibold">{formatNaira(d.amount_kobo)}</span> },
    { key: "note", header: "What it was for", render: (d) => <p className="max-w-md whitespace-pre-line text-[14px]">{d.note || "—"}</p> },
    {
      key: "by",
      header: "Done by",
      render: (d) => (
        <div className="text-[14px]">
          <p>{d.admin_name || "—"}</p>
          <p className="text-[13px] text-cx-muted">{formatDate(d.created_at)}</p>
        </div>
      ),
    },
    { key: "reference", header: "Reference", render: (d) => <span className="break-all font-mono text-[13px] text-cx-muted">{d.reference}</span> },
  ];

  const activityBalance = activity ? activity.wallet_balance_kobo : viewing?.wallet_balance_kobo;

  return (
    <>
      <PageHeader title="Client wallets" description="Every client's wallet balance. Search for a client, check their wallet activity, and deduct money when needed. The client is emailed about every deduction." />

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Held in wallets" value={summary ? formatNaira(summary.total_balance_kobo) : "—"} hint="Across all clients" icon={Wallet} />
        <StatTile label="Clients with a balance" value={summary ? String(summary.clients_with_balance) : "—"} hint="Above ₦0" icon={Coins} tone="brand" />
        <StatTile label="Total clients" value={summary ? String(summary.total_clients) : "—"} hint="All customer accounts" icon={Users} />
        <StatTile label="Total deducted" value={summary ? formatNaira(summary.total_deducted_kobo) : "—"} hint={summary ? `${summary.deduction_count} ${summary.deduction_count === 1 ? "deduction" : "deductions"} by admins` : "—"} icon={MinusCircle} tone="amber" />
      </div>

      <Tabs
        tabs={[
          { id: "clients", label: "All clients", count: clients.total },
          { id: "history", label: "Deduction history", count: history.total },
        ]}
        value={section}
        onChange={setSection}
        label="Client wallets section"
        className="mb-4"
      />

      {section === "clients" ? (
        <section>
          <Toolbar search={searchTerm} onSearch={setSearchTerm} placeholder="Search name, email or phone">
            <Select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setPage(1);
              }}
              aria-label="Sort clients"
              className="md:w-56"
            >
              <option value="balance_desc">Highest balance first</option>
              <option value="balance_asc">Lowest balance first</option>
              <option value="name">Name A to Z</option>
              <option value="newest">Newest accounts first</option>
            </Select>
          </Toolbar>
          {clientsError ? <Notice tone="amber" title="Couldn't load clients">{String(clientsError)}</Notice> : null}
          {clientsLoading && !clients.items.length ? (
            <SkeletonList rows={5} />
          ) : (
            <ResponsiveTable columns={clientColumns} rows={clients.items} rowKey={(c) => c.id} empty={search ? "No client matches that search." : "No clients yet."} />
          )}
          <Pager page={page} totalPages={clients.total_pages} onPage={setPage} />
        </section>
      ) : (
        <section>
          {historyError ? <Notice tone="amber" title="Couldn't load the history">{String(historyError)}</Notice> : null}
          {historyLoading && !history.items.length ? (
            <SkeletonList rows={3} />
          ) : (
            <ResponsiveTable columns={historyColumns} rows={history.items} rowKey={(d) => d.id} empty="No deductions yet." />
          )}
          <Pager page={historyPage} totalPages={history.total_pages} onPage={setHistoryPage} />
        </section>
      )}

      <Sheet
        open={!!viewing}
        onOpenChange={(o) => !o && setViewing(null)}
        title={viewing?.name || "Client wallet"}
        description={viewing ? [viewing.email, viewing.phone].filter(Boolean).join(" · ") : ""}
        footer={
          <>
            <Button variant="secondary" onClick={() => setViewing(null)}>
              Close
            </Button>
            <Button block icon={MinusCircle} onClick={() => startDeduct({ ...viewing, wallet_balance_kobo: activityBalance })} disabled={!activityBalance}>
              Deduct
            </Button>
          </>
        }
      >
        {viewing ? (
          <div className="space-y-4">
            <div>
              <p className="text-[13px] font-medium text-cx-muted">Wallet balance</p>
              <p className="mt-1 text-[22px] font-semibold text-cx-ink">{formatNaira(activityBalance)}</p>
            </div>
            {activityError ? <Notice tone="amber" title="Couldn't load the activity">{String(activityError)}</Notice> : null}
            {!activity && !activityError ? <SkeletonList rows={3} /> : null}
            {activity && !activity.items.length ? <p className="text-sm text-cx-muted">No wallet activity yet.</p> : null}
            {activity?.items.length ? (
              <ul className="divide-y divide-cx-line">
                {activity.items.map((tx) => (
                  <li key={tx.id} className="py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-cx-ink">{txLabel(tx)}</p>
                        <p className="text-[13px] text-cx-muted">{formatDate(tx.created_at)}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className={`text-sm font-semibold ${tx.type === "credit" ? "text-cx-brand-deep" : "text-cx-red"}`}>
                          {tx.type === "credit" ? "+" : "−"} {formatNaira(tx.amount_kobo)}
                        </p>
                        {tx.status !== "success" ? <p className="text-[13px] capitalize text-cx-muted">{tx.status}</p> : null}
                      </div>
                    </div>
                    {tx.note ? <p className="mt-1 whitespace-pre-line text-[13px] text-cx-muted">{tx.note}</p> : null}
                    <p className="mt-1 break-all font-mono text-[12px] text-cx-muted">{tx.reference}</p>
                  </li>
                ))}
              </ul>
            ) : null}
            {activity && activity.total > activity.items.length ? <p className="text-[13px] text-cx-muted">Showing the latest {activity.items.length} of {activity.total}.</p> : null}
          </div>
        ) : null}
      </Sheet>

      <DeductSheet client={deducting} onClose={() => setDeducting(null)} onDeducted={afterDeduction} />
    </>
  );
}
