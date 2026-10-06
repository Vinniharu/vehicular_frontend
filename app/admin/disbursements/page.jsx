"use client";

import { useState, useEffect, useRef } from "react";
import {
  Send,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCw,
  Copy,
  Check,
  UploadCloud,
  FileText,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  X,
  Wallet,
} from "lucide-react";
import {
  adminGetDisbursements,
  adminGetDisbursementStats,
  adminInitiateDisbursement,
  adminManualDisburse,
  adminUploadDisbursementReceipt,
} from "@/lib/api";
import {
  Badge,
  Button,
  Card,
  DetailRow,
  Field,
  IconButton,
  Input,
  Notice,
  PageHeader,
  Select,
  Sheet,
  SkeletonList,
} from "@/app/dashboard/_kit";
import { ConfirmSheet, ResponsiveTable, StatTile, Tabs, Toolbar, formatNaira } from "@/app/admin/_kit";
import { useToast } from "@/app/components/shared/ToastProvider";

const cx = (...parts) => parts.filter(Boolean).join(" ");

/* ─── Helpers ─── */
function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatAge(ageHours) {
  if (ageHours === undefined || ageHours === null) return "";
  if (ageHours < 1) return "< 1 hr ago";
  if (ageHours < 24) return `${Math.floor(ageHours)} hrs ago`;
  const days = Math.floor(ageHours / 24);
  const remainingHours = Math.floor(ageHours % 24);
  if (remainingHours === 0) return `${days}d ago`;
  return `${days}d ${remainingHours}h ago`;
}

function toDateInputValue(d) {
  const yr = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${yr}-${mo}-${day}`;
}

function startOfWeek(d) {
  const date = new Date(d);
  const dow = date.getDay();
  const diffToMonday = dow === 0 ? -6 : 1 - dow;
  date.setDate(date.getDate() + diffToMonday);
  return date;
}

const DATE_PRESETS = [
  { id: "today", label: "Today", range: () => { const t = new Date(); return [t, t]; } },
  { id: "this_week", label: "This week", range: () => [startOfWeek(new Date()), new Date()] },
  { id: "this_month", label: "This month", range: () => [new Date(new Date().getFullYear(), new Date().getMonth(), 1), new Date()] },
  { id: "all_time", label: "All time", range: () => [null, null] },
];

function TransferStatus({ transfer }) {
  if (transfer.status === "success") {
    return (
      <Badge tone="brand">
        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
        Completed
      </Badge>
    );
  }
  if (transfer.status === "pending") {
    return transfer.is_overdue ? (
      <Badge tone="amber">
        <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
        Waiting over 24h
      </Badge>
    ) : (
      <Badge>
        <Clock className="h-3.5 w-3.5" aria-hidden />
        Pending
      </Badge>
    );
  }
  if (transfer.status === "failed") {
    return (
      <Badge tone="red">
        <XCircle className="h-3.5 w-3.5" aria-hidden />
        Failed
      </Badge>
    );
  }
  return <Badge className="capitalize">{transfer.status || "—"}</Badge>;
}

function methodText(transfer) {
  if (!transfer.disbursement_method) return null;
  return `${transfer.disbursement_method}${transfer.disbursed_by_admin_name ? ` (${transfer.disbursed_by_admin_name})` : ""}`;
}

export default function AdminDisbursementsPage() {
  const pushToast = useToast();

  // Stats
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // List
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState("all"); // all, pending, overdue, success, failed
  const [methodFilter, setMethodFilter] = useState("all"); // all, automatic, manual
  const [searchTerm, setSearchTerm] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [datePreset, setDatePreset] = useState("all_time");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Action states
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Payout detail sheet + automatic payout confirm
  const [detailTransfer, setDetailTransfer] = useState(null);
  const [confirmPayoutTransfer, setConfirmPayoutTransfer] = useState(null);

  // Manual Disbursement Modal
  const [selectedTransferForManual, setSelectedTransferForManual] = useState(null);
  const [confirmManualOpen, setConfirmManualOpen] = useState(false);
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreviewUrl, setReceiptPreviewUrl] = useState("");
  const [uploadedReceiptUrl, setUploadedReceiptUrl] = useState("");
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [manualNotes, setManualNotes] = useState("");
  const [submittingManual, setSubmittingManual] = useState(false);
  const [copiedField, setCopiedField] = useState(null);

  // Receipt Viewer Modal
  const [viewingReceiptUrl, setViewingReceiptUrl] = useState(null);

  const fileInputRef = useRef(null);

  // Load stats
  const fetchStats = async () => {
    setStatsLoading(true);
    const res = await adminGetDisbursementStats();
    if (res?.data) {
      setStats(res.data);
    }
    setStatsLoading(false);
  };

  // Load disbursements list
  const fetchDisbursements = async () => {
    setLoading(true);
    const params = {
      page,
      page_size: pageSize,
      search: searchQuery || undefined,
      from_date: fromDate || undefined,
      to_date: toDate || undefined,
    };

    if (statusFilter === "overdue") {
      params.overdue_only = true;
    } else if (statusFilter !== "all") {
      params.status = statusFilter;
    }

    if (methodFilter !== "all") {
      params.method = methodFilter;
    }

    const res = await adminGetDisbursements(params);
    if (res?.data) {
      setItems(res.data.items || []);
      setTotal(res.data.total || 0);
      setTotalPages(res.data.total_pages || 1);
    } else {
      setItems([]);
      setTotal(0);
      setTotalPages(1);
    }
    setLoading(false);
  };

  // Initial load
  useEffect(() => {
    fetchStats();
  }, []);

  // Reload table on filter / page change
  useEffect(() => {
    fetchDisbursements();
  }, [page, statusFilter, methodFilter, searchQuery, fromDate, toDate]);

  // Handle Search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    setSearchQuery(searchTerm.trim());
  };

  const handleSearchClear = () => {
    setSearchTerm("");
    setSearchQuery("");
    setPage(1);
  };

  // Date preset click
  const handlePresetClick = (preset) => {
    setDatePreset(preset.id);
    const [start, end] = preset.range();
    setFromDate(start ? toDateInputValue(start) : "");
    setToDate(end ? toDateInputValue(end) : "");
    setPage(1);
  };

  const handleStatusChange = (id) => {
    setStatusFilter(id);
    setPage(1);
  };

  // Copy helper
  const copyToClipboard = (text, fieldKey) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Automatic Payout Initiation — asks first via ConfirmSheet
  const handleInitiatePayout = (transfer) => {
    setDetailTransfer(null);
    setConfirmPayoutTransfer(transfer);
  };

  const runInitiatePayout = async () => {
    const transfer = confirmPayoutTransfer;
    if (!transfer) return;

    setActionLoadingId(transfer.id);

    const res = await adminInitiateDisbursement(transfer.id);
    setActionLoadingId(null);
    setConfirmPayoutTransfer(null);

    if (res?.error) {
      pushToast({
        tone: "error",
        title: "Payout didn't start",
        body: res.error?.detail || res.error?.message || (typeof res.error === "string" ? res.error : "Failed to initiate automatic disbursement."),
      });
    } else if (res?.data) {
      const { status, message } = res.data;
      if (status === "success") {
        pushToast({ tone: "success", title: "Payout sent", body: message });
      } else if (status === "failed") {
        pushToast({ tone: "error", title: "Gateway failed", body: message });
      } else {
        pushToast({ tone: "info", title: "Payout started", body: message });
      }
      // Refresh list & stats
      fetchDisbursements();
      fetchStats();
    }
  };

  // Open Manual Disbursement Modal
  const handleOpenManualModal = (transfer) => {
    setDetailTransfer(null);
    setSelectedTransferForManual(transfer);
    setReceiptFile(null);
    setReceiptPreviewUrl("");
    setUploadedReceiptUrl("");
    setManualNotes("");
    setCopiedField(null);
  };

  // Handle Receipt File Selection & Upload
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setReceiptFile(file);
    const previewUrl = URL.createObjectURL(file);
    setReceiptPreviewUrl(previewUrl);

    // Automatically upload to server
    setUploadingReceipt(true);
    const res = await adminUploadDisbursementReceipt(file);
    setUploadingReceipt(false);

    if (res?.data?.file_url) {
      setUploadedReceiptUrl(res.data.file_url);
    } else {
      pushToast({
        tone: "error",
        title: "Receipt didn't upload",
        body: res?.error?.detail || "Failed to upload receipt image. Please try again.",
      });
      setReceiptFile(null);
      setReceiptPreviewUrl("");
      setUploadedReceiptUrl("");
    }
  };

  // Remove Receipt File
  const handleRemoveReceipt = () => {
    setReceiptFile(null);
    setReceiptPreviewUrl("");
    setUploadedReceiptUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const askConfirmManual = () => {
    if (!uploadedReceiptUrl) {
      pushToast({ tone: "error", title: "Add the receipt first", body: "Please upload a transaction receipt image before marking as done." });
      return;
    }
    setConfirmManualOpen(true);
  };

  // Confirm Manual Disbursement
  const handleConfirmManualDisburse = async () => {
    if (!selectedTransferForManual) return;
    if (!uploadedReceiptUrl) {
      pushToast({ tone: "error", title: "Add the receipt first", body: "Please upload a transaction receipt image before marking as done." });
      return;
    }

    setSubmittingManual(true);
    const res = await adminManualDisburse(selectedTransferForManual.id, {
      receipt_url: uploadedReceiptUrl,
      notes: manualNotes.trim() || undefined,
    });
    setSubmittingManual(false);
    setConfirmManualOpen(false);

    if (res?.error) {
      pushToast({
        tone: "error",
        title: "Couldn't record the payout",
        body: res.error?.detail || res.error?.message || (typeof res.error === "string" ? res.error : "Failed to record manual disbursement."),
      });
    } else {
      const doneId = selectedTransferForManual.id;
      setSelectedTransferForManual(null);
      pushToast({
        tone: "success",
        title: "Marked as paid",
        body: `Transfer #${doneId} marked as manually disbursed and agent wallet debited successfully.`,
      });
      fetchDisbursements();
      fetchStats();
    }
  };

  const statusTabs = [
    { id: "all", label: "All" },
    { id: "pending", label: "Pending" },
    { id: "overdue", label: "Waiting over 24h", count: stats?.overdue_pending_count || undefined },
    { id: "success", label: "Completed" },
    { id: "failed", label: "Failed" },
  ];

  const refType = (transfer) => transfer.transfer_code || `#TRF-${transfer.id}`;

  const columns = [
    {
      key: "agent",
      header: "Agent",
      primary: true,
      render: (t) => (
        <div className="min-w-0">
          <p className="font-semibold text-cx-ink">{t.agent?.name || "Unknown agent"}</p>
          <p className="text-[13px] font-normal text-cx-muted">{t.agent?.phone || "—"}</p>
          {t.agent?.state || t.agent?.lga ? (
            <p className="text-[13px] font-normal text-cx-muted">
              {[t.agent?.state, t.agent?.lga].filter(Boolean).join(" · ")}
            </p>
          ) : null}
        </div>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      render: (t) => <span className="font-semibold text-cx-ink">{formatNaira(t.amount_kobo)}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (t) => (
        <div className="space-y-1">
          <TransferStatus transfer={t} />
          {t.status === "success" && methodText(t) ? <p className="text-[13px] capitalize text-cx-muted">{methodText(t)}</p> : null}
        </div>
      ),
    },
    {
      key: "age",
      header: "Age",
      render: (t) => (
        <div>
          <p className={cx(t.is_overdue ? "font-semibold text-cx-amber" : "text-cx-ink")}>{formatAge(t.age_hours) || "—"}</p>
          <p className="text-[13px] text-cx-muted">{formatDate(t.created_at)}</p>
        </div>
      ),
    },
    {
      key: "bank",
      header: "Bank account",
      hideOnMobile: true,
      render: (t) =>
        t.bank_account ? (
          <div className="min-w-0">
            <p className="text-[13px] text-cx-muted">{t.bank_account.bank_name || `Bank code ${t.bank_account.bank_code}`}</p>
            <p className="font-mono font-semibold text-cx-ink">{t.bank_account.account_number}</p>
            <p className="max-w-[180px] truncate text-[13px] text-cx-muted">{t.bank_account.account_name}</p>
          </div>
        ) : (
          <span className="text-[13px] text-cx-muted">No bank account</span>
        ),
    },
    {
      key: "ref",
      header: "Reference",
      hideOnMobile: true,
      render: (t) => (
        <div className="min-w-0">
          <p className="font-mono text-[13px] text-cx-ink">{refType(t)}</p>
          {t.application_id ? (
            <p className="text-[13px] text-cx-muted">
              App #{t.application_id}
              {t.application_type ? <span className="capitalize"> · {t.application_type.replace(/_/g, " ")}</span> : null}
            </p>
          ) : null}
        </div>
      ),
    },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      hideOnMobile: true,
      className: "text-right",
      render: (t) => (
        <div className="flex flex-wrap justify-end gap-2" onClick={(e) => e.stopPropagation()}>
          {t.status !== "success" ? (
            <>
              <Button size="sm" icon={Send} onClick={() => handleInitiatePayout(t)} loading={actionLoadingId === t.id} disabled={actionLoadingId === t.id}>
                Pay out
              </Button>
              <Button size="sm" variant="secondary" icon={UploadCloud} onClick={() => handleOpenManualModal(t)} disabled={actionLoadingId === t.id}>
                Paid manually
              </Button>
            </>
          ) : t.receipt_url ? (
            <Button size="sm" variant="ghost" icon={FileText} onClick={() => setViewingReceiptUrl(t.receipt_url)}>
              Receipt
            </Button>
          ) : (
            <span className="text-[13px] text-cx-muted">Paid</span>
          )}
        </div>
      ),
    },
  ];

  const d = detailTransfer;
  const m = selectedTransferForManual;
  const cp = confirmPayoutTransfer;

  return (
    <div className="space-y-6 pb-16">
      <PageHeader
        title="Agent payouts"
        description="Watch automatic payouts, deal with delayed ones and record payouts you made by bank transfer."
        actions={
          <Button
            variant="secondary"
            icon={RefreshCw}
            loading={loading || statsLoading}
            onClick={() => {
              fetchStats();
              fetchDisbursements();
            }}
          >
            Refresh
          </Button>
        }
      />

      {/* ─── Summary ─── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Total"
          value={statsLoading ? "…" : formatNaira(stats?.total_amount_kobo || 0)}
          hint={statsLoading ? "Loading" : `${stats?.total_count || 0} requests`}
          icon={Wallet}
        />
        <StatTile
          label="Completed"
          value={statsLoading ? "…" : formatNaira(stats?.completed_amount_kobo || 0)}
          hint={statsLoading ? "Loading" : `${stats?.completed_count || 0} paid · ${stats?.completed_auto_count || 0} auto, ${stats?.completed_manual_count || 0} manual`}
          icon={CheckCircle2}
          tone="brand"
        />
        <StatTile
          label="Pending"
          value={statsLoading ? "…" : formatNaira(stats?.pending_amount_kobo || 0)}
          hint={statsLoading ? "Loading" : `${stats?.pending_count || 0} waiting`}
          icon={Clock}
        />
        <StatTile
          label="Failed"
          value={statsLoading ? "…" : formatNaira(stats?.failed_amount_kobo || 0)}
          hint={statsLoading ? "Loading" : `${stats?.failed_count || 0} failed payouts`}
          icon={XCircle}
          tone="red"
        />
      </div>

      {/* Overdue callout — tapping filters the list */}
      <button
        type="button"
        onClick={() => handleStatusChange("overdue")}
        aria-pressed={statusFilter === "overdue"}
        className={cx(
          "cx-focus flex w-full items-center gap-3 rounded-cx-lg border p-4 text-left transition-colors",
          statusFilter === "overdue" ? "border-cx-amber bg-cx-amber-soft" : "border-cx-line bg-cx-amber-soft/60 hover:bg-cx-amber-soft"
        )}
      >
        <AlertTriangle className="h-5 w-5 shrink-0 text-cx-amber" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold text-cx-ink">
            {statsLoading ? "…" : formatNaira(stats?.overdue_pending_amount_kobo || 0)} waiting over 24 hours
          </p>
          <p className="text-[13px] text-cx-ink-2">
            {stats?.overdue_pending_count || 0} payouts need someone to pay them by hand. {statusFilter === "overdue" ? "Showing these below." : "Tap to show them."}
          </p>
        </div>
        <ChevronRight className="h-5 w-5 shrink-0 text-cx-amber" aria-hidden />
      </button>

      {/* ─── Filters ─── */}
      <div>
        <Tabs tabs={statusTabs} value={statusFilter} onChange={handleStatusChange} label="Payout status" className="mb-3" />
        <form onSubmit={handleSearchSubmit}>
          <Toolbar search={searchTerm} onSearch={setSearchTerm} placeholder="Search agent, account, code or app ID">
            <Button type="submit" variant="secondary">
              Search
            </Button>
            {searchTerm || searchQuery ? (
              <Button variant="ghost" onClick={handleSearchClear}>
                Clear
              </Button>
            ) : null}
            <Select
              value={methodFilter}
              onChange={(e) => {
                setMethodFilter(e.target.value);
                setPage(1);
              }}
              aria-label="Method"
              className="md:w-56"
            >
              <option value="all">All methods</option>
              <option value="automatic">Automatic gateway</option>
              <option value="manual">Manual disbursement</option>
            </Select>
          </Toolbar>
        </form>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Date range">
          {DATE_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              aria-pressed={datePreset === p.id}
              onClick={() => handlePresetClick(p)}
              className={cx(
                "cx-focus min-h-11 rounded-cx px-4 text-[15px] font-medium transition-colors",
                datePreset === p.id ? "bg-cx-brand text-white" : "border border-cx-line-strong bg-cx-surface text-cx-ink-2 hover:bg-cx-sunken"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── List ─── */}
      <section>
        {loading ? (
          <SkeletonList rows={4} />
        ) : (
          <ResponsiveTable
            columns={columns}
            rows={items}
            rowKey={(t) => t.id}
            onRowClick={setDetailTransfer}
            empty="No payouts found. Try other filters or search terms."
          />
        )}

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[13px] text-cx-muted">
            Showing {items.length} of {total} payouts · page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" icon={ChevronLeft} onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1 || loading}>
              Prev
            </Button>
            <Button variant="secondary" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages || loading}>
              Next
              <ChevronRight className="h-4 w-4" aria-hidden />
            </Button>
          </div>
        </div>
      </section>

      {/* ─── Payout detail ─── */}
      <Sheet
        open={!!d}
        onOpenChange={(o) => !o && setDetailTransfer(null)}
        title={d ? `${formatNaira(d.amount_kobo)} to ${d.agent?.name || "Unknown agent"}` : "Payout"}
        description={d ? refType(d) : undefined}
        footer={
          d ? (
            d.status !== "success" ? (
              <>
                <Button variant="secondary" icon={UploadCloud} onClick={() => handleOpenManualModal(d)} disabled={actionLoadingId === d.id}>
                  Paid manually
                </Button>
                <Button block icon={Send} onClick={() => handleInitiatePayout(d)} loading={actionLoadingId === d.id}>
                  Pay out
                </Button>
              </>
            ) : d.receipt_url ? (
              <Button block variant="secondary" icon={FileText} onClick={() => setViewingReceiptUrl(d.receipt_url)}>
                View receipt
              </Button>
            ) : null
          ) : null
        }
      >
        {d ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <TransferStatus transfer={d} />
              {methodText(d) ? <span className="text-[13px] capitalize text-cx-muted">{methodText(d)}</span> : null}
            </div>
            <dl className="divide-y divide-cx-line">
              <DetailRow label="Agent" value={d.agent?.name || "Unknown agent"} />
              <DetailRow label="Phone" value={d.agent?.phone || "—"} />
              <DetailRow label="Area" value={[d.agent?.state, d.agent?.lga].filter(Boolean).join(" · ") || "—"} />
              <DetailRow
                label="Reference"
                value={
                  <span className="inline-flex items-center gap-1">
                    <span className="break-all font-mono">{refType(d)}</span>
                    <IconButton
                      label="Copy reference"
                      icon={copiedField === `ref_${d.id}` ? Check : Copy}
                      onClick={() => copyToClipboard(refType(d), `ref_${d.id}`)}
                      className="-my-2 -mr-2"
                    />
                  </span>
                }
              />
              {d.application_id ? (
                <DetailRow
                  label="Application"
                  value={
                    <span>
                      #{d.application_id}
                      {d.application_type ? <span className="capitalize"> · {d.application_type.replace(/_/g, " ")}</span> : null}
                    </span>
                  }
                />
              ) : null}
              <DetailRow label="Age" value={formatAge(d.age_hours) || "—"} />
              <DetailRow label="Created" value={formatDate(d.created_at)} />
            </dl>
            {d.bank_account ? (
              <Card className="bg-cx-sunken/60">
                <p className="mb-1 text-[13px] text-cx-muted">Bank account</p>
                <dl className="divide-y divide-cx-line">
                  <DetailRow label="Bank" value={d.bank_account.bank_name || `Code ${d.bank_account.bank_code}`} />
                  <DetailRow
                    label="Account number"
                    value={
                      <span className="inline-flex items-center gap-1">
                        <span className="font-mono">{d.bank_account.account_number}</span>
                        <IconButton
                          label="Copy account number"
                          icon={copiedField === `acc_${d.id}` ? Check : Copy}
                          onClick={() => copyToClipboard(d.bank_account.account_number, `acc_${d.id}`)}
                          className="-my-2 -mr-2"
                        />
                      </span>
                    }
                  />
                  <DetailRow label="Account name" value={d.bank_account.account_name} />
                </dl>
              </Card>
            ) : (
              <Notice tone="amber">No bank account recorded for this agent.</Notice>
            )}
            {d.receipt_url && d.status !== "success" ? (
              <Button variant="ghost" icon={FileText} onClick={() => setViewingReceiptUrl(d.receipt_url)}>
                View receipt
              </Button>
            ) : null}
          </div>
        ) : null}
      </Sheet>

      {/* ─── Confirm automatic payout ─── */}
      <ConfirmSheet
        open={!!cp}
        onOpenChange={(o) => !o && setConfirmPayoutTransfer(null)}
        title={cp ? `Send ${formatNaira(cp.amount_kobo)} to ${cp.agent?.name || "Agent"}?` : "Send payout?"}
        description="We'll try to pay this through the payment gateway now."
        confirmLabel="Send payout"
        loading={!!cp && actionLoadingId === cp.id}
        onConfirm={runInitiatePayout}
      >
        {cp?.bank_account ? (
          <dl className="divide-y divide-cx-line">
            <DetailRow label="Bank" value={cp.bank_account.bank_name || `Code ${cp.bank_account.bank_code}`} />
            <DetailRow label="Account" value={<span className="font-mono">{cp.bank_account.account_number}</span>} />
            <DetailRow label="Name" value={cp.bank_account.account_name} />
          </dl>
        ) : null}
      </ConfirmSheet>

      {/* ─── Manual disbursement ─── */}
      <Sheet
        open={!!m}
        onOpenChange={(o) => !o && !submittingManual && setSelectedTransferForManual(null)}
        title="Record a manual payout"
        description={m ? `Transfer #${m.id} · ${m.transfer_code || "No code"}` : undefined}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setSelectedTransferForManual(null)} disabled={submittingManual}>
              Cancel
            </Button>
            <Button block icon={CheckCircle2} onClick={askConfirmManual} disabled={!uploadedReceiptUrl || uploadingReceipt || submittingManual} loading={submittingManual}>
              Mark as paid
            </Button>
          </>
        }
      >
        {m ? (
          <div className="space-y-5">
            {/* Step 1 */}
            <section>
              <p className="mb-1 text-[15px] font-semibold text-cx-ink">1. Send the money by bank transfer</p>
              <Card className="bg-cx-sunken/60">
                <dl className="divide-y divide-cx-line">
                  <DetailRow label="Amount" value={<span className="text-[17px] font-semibold text-cx-brand-deep">{formatNaira(m.amount_kobo)}</span>} />
                  <DetailRow label="Agent" value={`${m.agent?.name || "—"}${m.agent?.phone ? ` (${m.agent.phone})` : ""}`} />
                  {m.bank_account ? (
                    <>
                      <DetailRow label="Bank" value={m.bank_account.bank_name || `Code ${m.bank_account.bank_code}`} />
                      <DetailRow
                        label="Account number"
                        value={
                          <span className="inline-flex items-center gap-1">
                            <span className="font-mono text-[15px] font-semibold">{m.bank_account.account_number}</span>
                            <IconButton
                              label="Copy account number"
                              icon={copiedField === "modal_acc" ? Check : Copy}
                              onClick={() => copyToClipboard(m.bank_account.account_number, "modal_acc")}
                              className="-my-2 -mr-2"
                            />
                          </span>
                        }
                      />
                      <DetailRow label="Account name" value={m.bank_account.account_name} />
                    </>
                  ) : null}
                </dl>
                {!m.bank_account ? (
                  <div className="mt-2">
                    <Notice tone="amber">Agent has no verified bank account on file. Contact the agent directly for account details.</Notice>
                  </div>
                ) : null}
              </Card>
            </section>

            {/* Step 2 */}
            <section>
              <p className="mb-1 text-[15px] font-semibold text-cx-ink">
                2. Upload the transfer receipt <span className="text-cx-red">*</span>
              </p>
              <p className="mb-2 text-[13px] text-cx-muted">Required, so the payout can be traced later. PNG, JPG, WEBP or PDF, up to 10MB.</p>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/jpeg,image/png,image/webp,application/pdf"
                className="hidden"
              />
              {!receiptFile ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="cx-focus flex w-full flex-col items-center rounded-cx-lg border-2 border-dashed border-cx-line-strong bg-cx-surface px-4 py-6 text-center hover:border-cx-brand hover:bg-cx-brand-soft/40"
                >
                  <UploadCloud className="mb-2 h-7 w-7 text-cx-muted" aria-hidden />
                  <span className="text-[15px] font-semibold text-cx-ink">Choose receipt file</span>
                </button>
              ) : (
                <div className="flex items-center gap-3 rounded-cx-lg border border-cx-line bg-cx-sunken/60 p-3">
                  {receiptFile.type.startsWith("image/") && receiptPreviewUrl ? (
                    <img src={receiptPreviewUrl} alt="Receipt preview" className="h-12 w-12 shrink-0 rounded-cx-sm border border-cx-line object-cover" />
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-cx-sm bg-cx-brand-soft text-cx-brand-deep">
                      <FileText className="h-6 w-6" aria-hidden />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-medium text-cx-ink">{receiptFile.name}</p>
                    <p className="text-[13px] text-cx-muted">
                      {(receiptFile.size / 1024).toFixed(1)} KB ·{" "}
                      {uploadingReceipt ? (
                        <span className="font-medium text-cx-amber">Uploading…</span>
                      ) : uploadedReceiptUrl ? (
                        <span className="font-medium text-cx-brand-deep">Ready</span>
                      ) : (
                        "Uploaded"
                      )}
                    </p>
                  </div>
                  <IconButton label="Remove file" icon={X} onClick={handleRemoveReceipt} />
                </div>
              )}
            </section>

            {/* Step 3 */}
            <Field label="Notes or bank reference" optional>
              {(p) => (
                <Input
                  {...p}
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  placeholder="e.g. Sent via GTB Corporate, session ID 00000000123"
                />
              )}
            </Field>

            <Notice tone="amber" title="This debits the agent's wallet">
              Marking this as paid takes {formatNaira(m.amount_kobo)} from the agent&apos;s platform wallet and attaches the receipt to this payout for good.
            </Notice>
          </div>
        ) : null}
      </Sheet>

      {/* ─── Confirm manual payout ─── */}
      <ConfirmSheet
        open={confirmManualOpen}
        onOpenChange={setConfirmManualOpen}
        title={m ? `Mark ${formatNaira(m.amount_kobo)} to ${m.agent?.name || "Agent"} as paid?` : "Mark as paid?"}
        description="The agent's wallet is debited by this amount and the receipt is saved with the payout. This can't be undone."
        confirmLabel="Mark as paid"
        loading={submittingManual}
        onConfirm={handleConfirmManualDisburse}
      />

      {/* ─── Receipt viewer ─── */}
      <Sheet
        open={!!viewingReceiptUrl}
        onOpenChange={(o) => !o && setViewingReceiptUrl(null)}
        title="Proof of payment"
        size="lg"
        footer={
          viewingReceiptUrl ? (
            <Button block variant="secondary" icon={ExternalLink} href={viewingReceiptUrl} target="_blank" rel="noopener noreferrer">
              Open full size
            </Button>
          ) : null
        }
      >
        {viewingReceiptUrl ? (
          <div className="flex items-center justify-center rounded-cx-lg bg-cx-sunken p-3">
            {viewingReceiptUrl.endsWith(".pdf") ? (
              <iframe src={viewingReceiptUrl} title="Receipt PDF" className="h-[60dvh] w-full rounded-cx-sm border border-cx-line bg-cx-surface" />
            ) : (
              <img src={viewingReceiptUrl} alt="Transaction receipt" className="max-h-[60dvh] w-auto max-w-full rounded-cx-sm object-contain" />
            )}
          </div>
        ) : null}
      </Sheet>
    </div>
  );
}
