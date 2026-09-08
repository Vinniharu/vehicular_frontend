"use client";

import { useState, useEffect, useRef } from "react";
import {
  Send,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCw,
  Search,
  CalendarRange,
  Copy,
  Check,
  UploadCloud,
  FileText,
  Eye,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  X,
  Building,
  User,
  Wallet,
  ArrowDownToLine,
  SlidersHorizontal,
} from "lucide-react";
import {
  koboToNaira,
  adminGetDisbursements,
  adminGetDisbursementStats,
  adminInitiateDisbursement,
  adminManualDisburse,
  adminUploadDisbursementReceipt,
} from "@/lib/api";

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
  { id: "this_week", label: "This Week", range: () => [startOfWeek(new Date()), new Date()] },
  { id: "this_month", label: "This Month", range: () => [new Date(new Date().getFullYear(), new Date().getMonth(), 1), new Date()] },
  { id: "all_time", label: "All Time", range: () => [null, null] },
];

export default function AdminDisbursementsPage() {
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
  const [actionMessage, setActionMessage] = useState(null); // { type: 'success' | 'error', text: '' }

  // Manual Disbursement Modal
  const [selectedTransferForManual, setSelectedTransferForManual] = useState(null);
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

  // Auto-dismiss action message
  useEffect(() => {
    if (actionMessage) {
      const timer = setTimeout(() => setActionMessage(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [actionMessage]);

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

  // Date preset click
  const handlePresetClick = (preset) => {
    setDatePreset(preset.id);
    const [start, end] = preset.range();
    setFromDate(start ? toDateInputValue(start) : "");
    setToDate(end ? toDateInputValue(end) : "");
    setPage(1);
  };

  // Copy helper
  const copyToClipboard = (text, fieldKey) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Automatic Payout Initiation
  const handleInitiatePayout = async (transfer) => {
    if (!confirm(`Attempt automatic payment gateway disbursement of ${koboToNaira(transfer.amount_kobo)} to ${transfer.agent?.name || "Agent"}?`)) {
      return;
    }

    setActionLoadingId(transfer.id);
    setActionMessage(null);

    const res = await adminInitiateDisbursement(transfer.id);
    setActionLoadingId(null);

    if (res?.error) {
      setActionMessage({
        type: "error",
        text: res.error?.detail || res.error?.message || "Failed to initiate automatic disbursement.",
      });
    } else if (res?.data) {
      const { status, message } = res.data;
      if (status === "success") {
        setActionMessage({
          type: "success",
          text: `Success! ${message}`,
        });
      } else if (status === "failed") {
        setActionMessage({
          type: "error",
          text: `Gateway Failed: ${message}`,
        });
      } else {
        setActionMessage({
          type: "warning",
          text: `Initiated: ${message}`,
        });
      }
      // Refresh list & stats
      fetchDisbursements();
      fetchStats();
    }
  };

  // Open Manual Disbursement Modal
  const handleOpenManualModal = (transfer) => {
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
      alert(res?.error?.detail || "Failed to upload receipt image. Please try again.");
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

  // Confirm Manual Disbursement
  const handleConfirmManualDisburse = async () => {
    if (!selectedTransferForManual) return;
    if (!uploadedReceiptUrl) {
      alert("Please upload a transaction receipt image before marking as done.");
      return;
    }

    setSubmittingManual(true);
    const res = await adminManualDisburse(selectedTransferForManual.id, {
      receipt_url: uploadedReceiptUrl,
      notes: manualNotes.trim() || undefined,
    });
    setSubmittingManual(false);

    if (res?.error) {
      alert(res.error?.detail || res.error?.message || "Failed to record manual disbursement.");
    } else {
      setSelectedTransferForManual(null);
      setActionMessage({
        type: "success",
        text: `Transfer #${selectedTransferForManual.id} marked as manually disbursed and agent wallet debited successfully.`,
      });
      fetchDisbursements();
      fetchStats();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Agent Disbursements</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Payouts Management
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Monitor automated disbursements, address delayed transfers, and execute verified manual payouts.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              fetchStats();
              fetchDisbursements();
            }}
            disabled={loading || statsLoading}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-sm transition disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${loading || statsLoading ? "animate-spin text-emerald-600" : "text-slate-500"}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Action Banner / Notification */}
      {actionMessage && (
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 shadow-sm transition-all animate-in fade-in slide-in-from-top-2 ${
            actionMessage.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : actionMessage.type === "warning"
              ? "bg-amber-50 border-amber-200 text-amber-900"
              : "bg-rose-50 border-rose-200 text-rose-900"
          }`}
        >
          {actionMessage.type === "success" && <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />}
          {actionMessage.type === "warning" && <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />}
          {actionMessage.type === "error" && <XCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />}
          <div className="flex-1 text-sm font-medium">{actionMessage.text}</div>
          <button onClick={() => setActionMessage(null)} className="text-slate-400 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Volume */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:border-slate-300 transition">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Volume</span>
            <Wallet className="h-4 w-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {statsLoading ? "..." : koboToNaira(stats?.total_amount_kobo || 0)}
          </div>
          <div className="text-xs text-slate-500 mt-1 font-medium">
            {statsLoading ? "Loading..." : `${stats?.total_count || 0} total requests`}
          </div>
        </div>

        {/* Completed */}
        <div className="bg-white rounded-2xl p-5 border border-emerald-200/80 shadow-sm hover:border-emerald-300 transition bg-gradient-to-br from-white to-emerald-50/20">
          <div className="flex items-center justify-between text-emerald-700 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Completed</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-950">
            {statsLoading ? "..." : koboToNaira(stats?.completed_amount_kobo || 0)}
          </div>
          <div className="text-xs text-emerald-700 mt-1 flex items-center gap-1 font-medium">
            <span>{stats?.completed_count || 0} disbursed</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500 font-normal">
              {stats?.completed_auto_count || 0} auto, {stats?.completed_manual_count || 0} manual
            </span>
          </div>
        </div>

        {/* Pending Normal */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:border-slate-300 transition">
          <div className="flex items-center justify-between text-slate-600 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending</span>
            <Clock className="h-4 w-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {statsLoading ? "..." : koboToNaira(stats?.pending_amount_kobo || 0)}
          </div>
          <div className="text-xs text-slate-500 mt-1 font-medium">
            {statsLoading ? "..." : `${stats?.pending_count || 0} awaiting confirmation`}
          </div>
        </div>

        {/* Overdue Pending > 24 Hours (Yellow Highlight Card) */}
        <div
          onClick={() => {
            setStatusFilter("overdue");
            setPage(1);
          }}
          className={`rounded-2xl p-5 border shadow-sm transition cursor-pointer relative overflow-hidden ${
            statusFilter === "overdue"
              ? "bg-amber-100/80 border-amber-400 ring-2 ring-amber-400/40"
              : "bg-amber-50/80 border-amber-300/80 hover:bg-amber-100/50"
          }`}
        >
          <div className="flex items-center justify-between text-amber-800 mb-2">
            <div className="flex items-center gap-1.5 font-semibold text-xs uppercase tracking-wider">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
              <span>Pending &gt; 24h</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200/80 text-amber-900 border border-amber-300">
              Needs Manual Action
            </span>
          </div>
          <div className="text-2xl font-bold text-amber-950">
            {statsLoading ? "..." : koboToNaira(stats?.overdue_pending_amount_kobo || 0)}
          </div>
          <div className="text-xs text-amber-800 mt-1 font-semibold flex items-center justify-between">
            <span>{stats?.overdue_pending_count || 0} delayed requests</span>
            <span className="text-[11px] underline opacity-90">Filter table &rarr;</span>
          </div>
        </div>

        {/* Failed */}
        <div className="bg-white rounded-2xl p-5 border border-rose-200/80 shadow-sm hover:border-rose-300 transition">
          <div className="flex items-center justify-between text-rose-700 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Failed</span>
            <XCircle className="h-4 w-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-950">
            {statsLoading ? "..." : koboToNaira(stats?.failed_amount_kobo || 0)}
          </div>
          <div className="text-xs text-rose-600 mt-1 font-medium">
            {statsLoading ? "..." : `${stats?.failed_count || 0} failed payouts`}
          </div>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
            {[
              { id: "all", label: "All Disbursements" },
              { id: "pending", label: "Pending" },
              {
                id: "overdue",
                label: "Pending > 24h",
                badge: stats?.overdue_pending_count,
                badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
              },
              { id: "success", label: "Completed" },
              { id: "failed", label: "Failed" },
            ].map((tab) => {
              const active = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setStatusFilter(tab.id);
                    setPage(1);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap flex items-center gap-1.5 ${
                    active
                      ? tab.id === "overdue"
                        ? "bg-amber-500 text-white shadow-sm"
                        : "bg-slate-900 text-white shadow-sm"
                      : tab.id === "overdue" && tab.badge > 0
                      ? "text-amber-800 hover:bg-amber-50 font-bold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.badge > 0 && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        active ? "bg-white/30 text-white" : tab.badgeColor || "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative min-w-[280px] lg:w-80">
            <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search agent, account, code, or app ID..."
              className="w-full pl-9 pr-20 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-slate-50/50"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setSearchQuery("");
                  setPage(1);
                }}
                className="absolute right-12 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                Clear
              </button>
            )}
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 text-[11px] font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-lg transition"
            >
              Search
            </button>
          </form>
        </div>

        {/* Secondary Filters (Method & Date Range) */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Method:</span>
            <select
              value={methodFilter}
              onChange={(e) => {
                setMethodFilter(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs font-medium"
            >
              <option value="all">All Methods</option>
              <option value="automatic">Automatic Gateway</option>
              <option value="manual">Manual Disbursement</option>
            </select>
          </div>

          {/* Date Presets */}
          <div className="flex items-center gap-1">
            <CalendarRange className="h-3.5 w-3.5 text-slate-400 mr-1" />
            {DATE_PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => handlePresetClick(p)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                  datePreset === p.id
                    ? "bg-slate-100 text-slate-900 font-semibold"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Disbursements Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Ref / App</th>
                <th className="py-3.5 px-4">Agent Name & Contact</th>
                <th className="py-3.5 px-4">Destination Bank Account</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Status & Method</th>
                <th className="py-3.5 px-4">Age / Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-slate-400" />
                    <span>Loading disbursements...</span>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    <Send className="h-8 w-8 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                    <p className="font-semibold text-slate-600">No disbursements found</p>
                    <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or search terms</p>
                  </td>
                </tr>
              ) : (
                items.map((transfer) => {
                  const isOverdue = transfer.is_overdue;
                  const isActionLoading = actionLoadingId === transfer.id;

                  // Conditional row styling: Overdue rows get a distinct soft yellow/amber background and border
                  const rowClass = isOverdue
                    ? "bg-amber-50/80 hover:bg-amber-100/70 border-l-4 border-l-amber-500 transition"
                    : transfer.status === "failed"
                    ? "bg-rose-50/30 hover:bg-rose-50/60 transition"
                    : "hover:bg-slate-50/80 transition";

                  return (
                    <tr key={transfer.id} className={rowClass}>
                      {/* Ref / App */}
                      <td className="py-4 px-4 align-top">
                        <div className="flex items-center gap-1.5 font-mono text-[11px] font-semibold text-slate-800">
                          <span>{transfer.transfer_code || `#TRF-${transfer.id}`}</span>
                          <button
                            onClick={() => copyToClipboard(transfer.transfer_code || `#TRF-${transfer.id}`, `ref_${transfer.id}`)}
                            title="Copy reference code"
                            className="text-slate-400 hover:text-slate-600"
                          >
                            {copiedField === `ref_${transfer.id}` ? (
                              <Check className="h-3 w-3 text-emerald-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                        {transfer.application_id && (
                          <div className="mt-1 flex items-center gap-1.5">
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                              App #{transfer.application_id}
                            </span>
                            {transfer.application_type && (
                              <span className="text-[10px] text-slate-400 capitalize truncate max-w-[120px]">
                                {transfer.application_type.replace(/_/g, " ")}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Agent */}
                      <td className="py-4 px-4 align-top">
                        <div className="font-semibold text-slate-900 text-xs flex items-center gap-1">
                          <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>{transfer.agent?.name || "Unknown Agent"}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{transfer.agent?.phone || "—"}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {transfer.agent?.state} • {transfer.agent?.lga}
                        </div>
                      </td>

                      {/* Bank Details */}
                      <td className="py-4 px-4 align-top">
                        {transfer.bank_account ? (
                          <div>
                            <div className="font-semibold text-slate-800 text-[11px] flex items-center gap-1">
                              <Building className="h-3 w-3 text-slate-400" />
                              <span>{transfer.bank_account.bank_name || `Bank Code: ${transfer.bank_account.bank_code}`}</span>
                            </div>
                            <div className="mt-1 flex items-center gap-1 font-mono font-bold text-slate-900 text-xs">
                              <span>{transfer.bank_account.account_number}</span>
                              <button
                                onClick={() => copyToClipboard(transfer.bank_account.account_number, `acc_${transfer.id}`)}
                                title="Copy account number"
                                className="text-slate-400 hover:text-slate-600"
                              >
                                {copiedField === `acc_${transfer.id}` ? (
                                  <Check className="h-3 w-3 text-emerald-600" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </button>
                            </div>
                            <div className="text-[10px] text-slate-500 font-medium truncate max-w-[180px]">
                              {transfer.bank_account.account_name}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">No bank account recorded</span>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="py-4 px-4 align-top">
                        <div className="font-bold text-slate-900 text-sm">{koboToNaira(transfer.amount_kobo)}</div>
                        <span className="text-[10px] text-slate-400">Agent Commission</span>
                      </td>

                      {/* Status & Method */}
                      <td className="py-4 px-4 align-top space-y-1">
                        {transfer.status === "success" && (
                          <div className="flex flex-col items-start gap-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                              <span>Completed</span>
                            </span>
                            <span className="text-[10px] font-medium text-slate-500 capitalize">
                              Method: {transfer.disbursement_method}
                              {transfer.disbursed_by_admin_name && ` (${transfer.disbursed_by_admin_name})`}
                            </span>
                          </div>
                        )}

                        {transfer.status === "pending" && (
                          <div className="flex flex-col items-start gap-1">
                            {isOverdue ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-200 text-amber-900 border border-amber-400 shadow-sm animate-pulse">
                                <Clock className="h-3 w-3 text-amber-800" />
                                <span>Pending &gt; 24h</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                                <Clock className="h-3 w-3 text-slate-500" />
                                <span>Pending</span>
                              </span>
                            )}
                          </div>
                        )}

                        {transfer.status === "failed" && (
                          <div className="flex flex-col items-start gap-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800 border border-rose-200">
                              <XCircle className="h-3 w-3 text-rose-600" />
                              <span>Failed</span>
                            </span>
                          </div>
                        )}

                        {/* View Receipt button if receipt exists */}
                        {transfer.receipt_url && (
                          <button
                            onClick={() => setViewingReceiptUrl(transfer.receipt_url)}
                            className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 underline"
                          >
                            <FileText className="h-3 w-3" />
                            <span>View Receipt</span>
                          </button>
                        )}
                      </td>

                      {/* Age / Date */}
                      <td className="py-4 px-4 align-top">
                        <div className={`font-medium ${isOverdue ? "text-amber-900 font-bold" : "text-slate-700"}`}>
                          {formatAge(transfer.age_hours)}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{formatDate(transfer.created_at)}</div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 align-top text-right space-y-1.5">
                        {transfer.status !== "success" ? (
                          <div className="flex flex-col items-end gap-1.5">
                            {/* Initiate Automatic Payout */}
                            <button
                              onClick={() => handleInitiatePayout(transfer)}
                              disabled={isActionLoading}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition disabled:opacity-50"
                              title="Attempt automatic Monnify payout"
                            >
                              {isActionLoading ? (
                                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Send className="h-3.5 w-3.5" />
                              )}
                              <span>Initiate Payout</span>
                            </button>

                            {/* Manual Disbursement Button */}
                            <button
                              onClick={() => handleOpenManualModal(transfer)}
                              disabled={isActionLoading}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 hover:border-slate-400 shadow-sm transition"
                              title="Disburse manually and upload proof of receipt"
                            >
                              <UploadCloud className="h-3.5 w-3.5 text-slate-500" />
                              <span>Manual Disbursement</span>
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-end gap-1">
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-medium text-xs">
                              <CheckCircle2 className="h-4 w-4" />
                              <span>Disbursed</span>
                            </span>
                            {transfer.receipt_url && (
                              <button
                                onClick={() => setViewingReceiptUrl(transfer.receipt_url)}
                                className="text-[11px] text-slate-600 hover:text-slate-900 font-medium underline flex items-center gap-1"
                              >
                                <Eye className="h-3 w-3" />
                                <span>Inspect Receipt</span>
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="py-3.5 px-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Showing <span className="font-semibold text-slate-700">{items.length}</span> of{" "}
            <span className="font-semibold text-slate-700">{total}</span> total disbursements
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="font-medium text-slate-700 px-2">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ─── MANUAL DISBURSEMENT MODAL ─── */}
      {selectedTransferForManual && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                  <Wallet className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Manual Agent Disbursement</h3>
                  <p className="text-xs text-slate-500">
                    Transfer #{selectedTransferForManual.id} • {selectedTransferForManual.transfer_code || "No code"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTransferForManual(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              {/* Step 1: Agent Bank Details Card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase tracking-wider">
                  <span>Step 1: Recipient Account Details</span>
                  <span className="text-emerald-700 font-bold">Direct Bank Transfer</span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-baseline py-1 border-b border-slate-200/60">
                    <span className="text-xs text-slate-500">Amount to Disburse:</span>
                    <span className="text-xl font-extrabold text-emerald-800">
                      {koboToNaira(selectedTransferForManual.amount_kobo)}
                    </span>
                  </div>

                  <div className="flex justify-between items-baseline py-1 border-b border-slate-200/60">
                    <span className="text-xs text-slate-500">Agent:</span>
                    <span className="text-xs font-semibold text-slate-800">
                      {selectedTransferForManual.agent?.name} ({selectedTransferForManual.agent?.phone})
                    </span>
                  </div>

                  {selectedTransferForManual.bank_account ? (
                    <>
                      <div className="flex justify-between items-baseline py-1 border-b border-slate-200/60">
                        <span className="text-xs text-slate-500">Bank Name:</span>
                        <span className="text-xs font-bold text-slate-900">
                          {selectedTransferForManual.bank_account.bank_name || `Code: ${selectedTransferForManual.bank_account.bank_code}`}
                        </span>
                      </div>

                      <div className="flex justify-between items-center py-1.5 border-b border-slate-200/60 bg-white px-2.5 rounded-lg border">
                        <span className="text-xs text-slate-500">Account Number:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-bold text-slate-900 tracking-wider">
                            {selectedTransferForManual.bank_account.account_number}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(selectedTransferForManual.bank_account.account_number, "modal_acc")}
                            className="p-1 text-slate-500 hover:text-slate-800 bg-slate-100 rounded"
                            title="Copy Account Number"
                          >
                            {copiedField === "modal_acc" ? (
                              <Check className="h-3.5 w-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="flex justify-between items-baseline py-1">
                        <span className="text-xs text-slate-500">Account Name:</span>
                        <span className="text-xs font-semibold text-slate-800">
                          {selectedTransferForManual.bank_account.account_name}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="p-3 bg-amber-50 rounded-lg text-xs text-amber-800 border border-amber-200">
                      Agent has no verified bank account on file. Please contact the agent directly for account details.
                    </div>
                  )}
                </div>
              </div>

              {/* Step 2: Upload Receipt (Mandatory) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">
                    Step 2: Upload Transaction Receipt <span className="text-rose-600">*</span>
                  </span>
                  <span className="text-[11px] text-slate-400">Required for tracking</span>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  className="hidden"
                />

                {!receiptFile ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl p-6 text-center cursor-pointer bg-slate-50/50 hover:bg-emerald-50/20 transition group"
                  >
                    <UploadCloud className="h-8 w-8 mx-auto text-slate-400 group-hover:text-emerald-600 mb-2 transition" />
                    <p className="text-xs font-semibold text-slate-700 group-hover:text-emerald-800">
                      Click to browse or drop payment receipt
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">Supports PNG, JPG, WEBP or PDF (max 10MB)</p>
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 overflow-hidden">
                      {receiptFile.type.startsWith("image/") && receiptPreviewUrl ? (
                        <img
                          src={receiptPreviewUrl}
                          alt="Receipt Preview"
                          className="h-12 w-12 object-cover rounded-lg border border-slate-200"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                          <FileText className="h-6 w-6" />
                        </div>
                      )}
                      <div className="truncate">
                        <p className="text-xs font-semibold text-slate-800 truncate">{receiptFile.name}</p>
                        <p className="text-[10px] text-slate-400">
                          {(receiptFile.size / 1024).toFixed(1)} KB •{" "}
                          {uploadingReceipt ? (
                            <span className="text-amber-600 font-semibold">Uploading...</span>
                          ) : uploadedReceiptUrl ? (
                            <span className="text-emerald-600 font-semibold">Ready to record</span>
                          ) : (
                            "Uploaded"
                          )}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleRemoveReceipt}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-200/60 transition"
                      title="Remove file"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Step 3: Admin Notes (Optional) */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Admin Notes / Bank Reference (Optional)</label>
                <input
                  type="text"
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  placeholder="e.g. Sent via GTB Corporate, Session ID 00000000123"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                />
              </div>

              {/* Warning note */}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-2 text-xs text-amber-900">
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Notice:</span> Marking this disbursement as done will automatically
                  debit <span className="font-bold">{koboToNaira(selectedTransferForManual.amount_kobo)}</span> from the
                  agent&apos;s platform wallet and permanently attach the receipt proof to this payout record.
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/50">
              <button
                type="button"
                onClick={() => setSelectedTransferForManual(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmManualDisburse}
                disabled={!uploadedReceiptUrl || uploadingReceipt || submittingManual}
                className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submittingManual ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Processing Debit &amp; Marking Done...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Confirm &amp; Mark as Disbursed</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── RECEIPT VIEWER MODAL ─── */}
      {viewingReceiptUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <FileText className="h-4 w-4 text-emerald-600" />
                <span>Transaction Proof of Payment</span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={viewingReceiptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition flex items-center gap-1 text-xs"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Open Full Size</span>
                </a>
                <button
                  onClick={() => setViewingReceiptUrl(null)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-4 bg-slate-100 flex items-center justify-center max-h-[75vh] overflow-auto">
              {viewingReceiptUrl.endsWith(".pdf") ? (
                <iframe src={viewingReceiptUrl} title="Receipt PDF" className="w-full h-[500px] rounded-lg border" />
              ) : (
                <img
                  src={viewingReceiptUrl}
                  alt="Transaction Receipt"
                  className="max-h-[600px] w-auto max-w-full rounded-lg shadow-sm object-contain"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
