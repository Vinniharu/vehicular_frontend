"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  FileClock,
  AlertCircle,
  Search,
  X,
  Loader2,
  RefreshCw,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  Eye,
  Pencil,
  Send,
  MessageSquareText,
  Archive,
  Check,
} from "lucide-react";
import {
  getSupportExpiringDocuments,
  getSupportArchivedDocuments,
  updateSupportDocumentExpiry,
  notifySupportDocumentExpiry,
  resolveMediaUrl,
} from "@/lib/api";
import { formatDate, freshnessMeta } from "@/app/dashboard/_shared/apply-helpers";
import { TONE_CLASSES } from "@/app/dashboard/_shared/status-config";
import DocumentPreviewModal from "@/app/components/design/DocumentPreviewModal";

const CATEGORIES = ["Driver's Licence", "Tinted Permit", "International Permit", "Vehicle Particulars"];

function toDateInputValue(iso) {
  if (!iso) return "";
  // Slice the date directly out of the ISO string instead of round-tripping
  // through `new Date(iso).toISOString()`: the API can return a
  // timezone-less datetime string, which `new Date()` parses as local time
  // -- for any UTC+ timezone (e.g. WAT, UTC+1) that round trip shifts the
  // date back by a day once re-serialized to UTC. The date portion is
  // always the first 10 characters of an ISO 8601 string, so this is
  // timezone-agnostic by construction.
  return iso.slice(0, 10);
}

function FreshnessBadge({ expiryDate }) {
  const meta = freshnessMeta(expiryDate);
  if (!meta) return null;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold ring-1 ring-inset ${TONE_CLASSES[meta.tone]}`}>
      {meta.label}
    </span>
  );
}

function DocumentsPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialTab = searchParams.get("tab") === "archive" ? "archive" : "expiring";
  const [tab, setTab] = useState(initialTab);

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const [archiveCustomerId, setArchiveCustomerId] = useState(searchParams.get("customer_id") || "");
  const [archiveCustomerInput, setArchiveCustomerInput] = useState(searchParams.get("customer_id") || "");

  const [previewUrl, setPreviewUrl] = useState(null);
  const [editingKey, setEditingKey] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [savingKey, setSavingKey] = useState(null);
  const [rowFeedback, setRowFeedback] = useState({}); // key -> { type: "sending"|"sent"|"error", channel, message }

  const loadExpiring = async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    const res = await getSupportExpiringDocuments({
      page,
      page_size: pageSize,
      category: categoryFilter || undefined,
      search: searchQuery || undefined,
    });
    if (res.error) {
      setError(res.error);
    } else if (res.data) {
      setItems(res.data.items || []);
      setTotal(res.data.total || 0);
      setTotalPages(res.data.total_pages || 1);
    }
    setLoading(false);
    setRefreshing(false);
  };

  const loadArchive = async (isRefresh = false) => {
    if (!archiveCustomerId) {
      setItems([]);
      setTotal(0);
      setTotalPages(1);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    const res = await getSupportArchivedDocuments(archiveCustomerId, { page, page_size: pageSize });
    if (res.error) {
      setError(res.error);
    } else if (res.data) {
      setItems(res.data.items || []);
      setTotal(res.data.total || 0);
      setTotalPages(res.data.total_pages || 1);
    }
    setLoading(false);
    setRefreshing(false);
  };

  const loadData = (isRefresh = false) => (tab === "archive" ? loadArchive(isRefresh) : loadExpiring(isRefresh));

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, page, categoryFilter, archiveCustomerId]);

  const switchTab = (nextTab) => {
    setTab(nextTab);
    setPage(1);
    setEditingKey(null);
    const params = new URLSearchParams();
    if (nextTab === "archive") {
      params.set("tab", "archive");
      if (archiveCustomerId) params.set("customer_id", archiveCustomerId);
    }
    router.replace(params.toString() ? `/support/documents?${params.toString()}` : "/support/documents");
  };

  const submitArchiveCustomer = (e) => {
    e.preventDefault();
    setPage(1);
    setArchiveCustomerId(archiveCustomerInput.trim());
    const params = new URLSearchParams({ tab: "archive" });
    if (archiveCustomerInput.trim()) params.set("customer_id", archiveCustomerInput.trim());
    router.replace(`/support/documents?${params.toString()}`);
  };

  const filteredItems = useMemo(() => {
    if (tab !== "expiring") return items;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return items;
    return items.filter(
      (d) =>
        (d.customer_name || "").toLowerCase().includes(q) ||
        (d.customer_email || "").toLowerCase().includes(q) ||
        (d.licence_number || "").toLowerCase().includes(q)
    );
  }, [items, searchQuery, tab]);

  const startEdit = (doc) => {
    setEditingKey(doc.key);
    setEditValue(toDateInputValue(doc.expiry_date));
  };

  const cancelEdit = () => {
    setEditingKey(null);
    setEditValue("");
  };

  const saveEdit = async (doc) => {
    if (!editValue) return;
    setSavingKey(doc.key);
    const isoDate = new Date(`${editValue}T00:00:00Z`).toISOString();
    const res = await updateSupportDocumentExpiry(doc.kind, doc.doc_id, isoDate);
    setSavingKey(null);
    if (res.error) {
      setRowFeedback((prev) => ({ ...prev, [doc.key]: { type: "error", message: res.error } }));
      return;
    }
    setEditingKey(null);
    if (tab === "expiring" && res.data && !res.data.is_current) {
      // No longer the current document in its group -- doesn't belong on
      // the Expiring list anymore.
      setItems((prev) => prev.filter((d) => d.key !== doc.key));
    } else if (res.data) {
      setItems((prev) => prev.map((d) => (d.key === doc.key ? res.data : d)));
    }
  };

  const sendNotification = async (doc, channel) => {
    setRowFeedback((prev) => ({ ...prev, [doc.key]: { type: "sending", channel } }));
    const res = await notifySupportDocumentExpiry(doc.kind, doc.doc_id, [channel]);
    if (res.error) {
      setRowFeedback((prev) => ({ ...prev, [doc.key]: { type: "error", channel, message: res.error } }));
      return;
    }
    setRowFeedback((prev) => ({ ...prev, [doc.key]: { type: "sent", channel } }));
    setTimeout(() => {
      setRowFeedback((prev) => {
        if (prev[doc.key]?.type !== "sent") return prev;
        const next = { ...prev };
        delete next[doc.key];
        return next;
      });
    }, 2500);
  };

  return (
    <div className="space-y-6 pb-16">
      <DocumentPreviewModal isOpen={!!previewUrl} onClose={() => setPreviewUrl(null)} fileUrl={previewUrl} />

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-emerald-800 mb-2">
              <FileClock className="h-3.5 w-3.5 text-[#28A745]" />
              Expiry tracking
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Expiring documents</h1>
            <p className="mt-1 text-sm text-slate-600 max-w-2xl">
              Every customer's current licence, permit, and vehicle document, sorted by how soon it expires —
              edit a date, or nudge a customer to renew by email or text.
            </p>
          </div>
          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={refreshing || loading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 transition-all shadow-sm shrink-0 self-start md:self-center"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin text-[#28A745]" : "text-slate-500"}`} />
            <span>{refreshing ? "Syncing…" : "Refresh"}</span>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => switchTab("expiring")}
          className={`flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-[13px] font-semibold transition-colors ${
            tab === "expiring" ? "border-[#28A745] text-[#111111]" : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <FileClock className="h-3.5 w-3.5" /> Expiring
        </button>
        <button
          type="button"
          onClick={() => switchTab("archive")}
          className={`flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-[13px] font-semibold transition-colors ${
            tab === "archive" ? "border-[#28A745] text-[#111111]" : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <Archive className="h-3.5 w-3.5" /> Archive
        </button>
      </div>

      {tab === "expiring" ? (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by customer, email, or licence number..."
              className="w-full rounded-lg border border-slate-300 bg-white pl-10 pr-9 py-2.5 text-[13px] text-slate-900 placeholder:text-slate-400 focus:border-[#28A745] focus:outline-none focus:ring-2 focus:ring-[#28A745]/15 shadow-sm transition-all"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-[13px] text-slate-700 shadow-sm focus:border-[#28A745] focus:outline-none focus:ring-2 focus:ring-[#28A745]/15"
          >
            <option value="">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      ) : (
        <form onSubmit={submitArchiveCustomer} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={archiveCustomerInput}
              onChange={(e) => setArchiveCustomerInput(e.target.value)}
              placeholder="Customer id..."
              className="w-full rounded-lg border border-slate-300 bg-white pl-10 pr-9 py-2.5 text-[13px] text-slate-900 placeholder:text-slate-400 focus:border-[#28A745] focus:outline-none focus:ring-2 focus:ring-[#28A745]/15 shadow-sm transition-all"
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-lg bg-[#28A745] px-4 py-2.5 text-[13px] font-semibold text-white shadow-sm hover:bg-[#219a3b] transition-all shrink-0"
          >
            View archive
          </button>
        </form>
      )}

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-[#28A745] mx-auto" />
            <p className="text-sm text-slate-500 font-medium">Loading documents…</p>
          </div>
        ) : tab === "archive" && !archiveCustomerId ? (
          <div className="p-16 text-center space-y-2">
            <Archive className="h-10 w-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">Look up a customer</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">Enter a customer id above to see their superseded documents.</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-16 text-center space-y-2">
            <CheckSquare className="h-10 w-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">
              {tab === "archive" ? "No archived documents" : "No expiring documents found"}
            </h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              {tab === "archive"
                ? "This customer has no superseded documents on file."
                : "No documents match your current search or filters."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/60">
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Customer</th>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Document</th>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Expiry</th>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((doc) => {
                  const feedback = rowFeedback[doc.key];
                  const isEditing = editingKey === doc.key;
                  return (
                    <tr key={doc.key} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3.5">
                        <Link href={`/support/customers/${doc.customer_id}`} className="text-[13px] font-semibold text-slate-800 hover:underline">
                          {doc.customer_name}
                        </Link>
                        <div className="mt-0.5 space-y-0.5">
                          <p className="flex items-center gap-1 text-[11px] text-slate-500"><Mail className="h-2.5 w-2.5" />{doc.customer_email}</p>
                          {doc.customer_phone && <p className="flex items-center gap-1 text-[11px] text-slate-500"><Phone className="h-2.5 w-2.5" />{doc.customer_phone}</p>}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                          {doc.category}
                        </span>
                        <p className="mt-1 text-[12.5px] font-semibold text-slate-800">{doc.label}</p>
                        {doc.licence_number && <p className="text-[11px] text-slate-500">Licence No: {doc.licence_number}</p>}
                      </td>
                      <td className="px-4 py-3.5">
                        {isEditing ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="date"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="rounded-lg border border-slate-300 px-2 py-1 text-[12.5px] text-slate-900 focus:border-[#28A745] focus:outline-none focus:ring-2 focus:ring-[#28A745]/15"
                            />
                            <button
                              type="button"
                              onClick={() => saveEdit(doc)}
                              disabled={savingKey === doc.key || !editValue}
                              className="rounded-lg bg-[#28A745] p-1.5 text-white disabled:opacity-50"
                              title="Save"
                            >
                              {savingKey === doc.key ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                            </button>
                            <button
                              type="button"
                              onClick={cancelEdit}
                              disabled={savingKey === doc.key}
                              className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50"
                              title="Cancel"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-[12.5px] text-slate-700">{formatDate(doc.expiry_date)}</span>
                            <FreshnessBadge expiryDate={doc.expiry_date} />
                            {tab === "expiring" && (
                              <button
                                type="button"
                                onClick={() => startEdit(doc)}
                                className="text-slate-400 hover:text-slate-600"
                                title="Edit expiry date"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex flex-wrap items-center gap-2">
                          {doc.document_url && (
                            <button
                              type="button"
                              onClick={() => setPreviewUrl(resolveMediaUrl(doc.document_url))}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11.5px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                            >
                              <Eye className="h-3 w-3" /> View
                            </button>
                          )}
                          {tab === "expiring" && (
                            <>
                              <button
                                type="button"
                                onClick={() => sendNotification(doc, "email")}
                                disabled={feedback?.type === "sending"}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11.5px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
                              >
                                {feedback?.type === "sending" && feedback.channel === "email" ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Send className="h-3 w-3" />
                                )}
                                Email
                              </button>
                              <button
                                type="button"
                                onClick={() => sendNotification(doc, "text")}
                                disabled={feedback?.type === "sending"}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11.5px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
                              >
                                {feedback?.type === "sending" && feedback.channel === "text" ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <MessageSquareText className="h-3 w-3" />
                                )}
                                Text
                              </button>
                            </>
                          )}
                        </div>
                        {feedback?.type === "sent" && (
                          <p className="mt-1 text-[11px] font-semibold text-emerald-600">Sent</p>
                        )}
                        {feedback?.type === "error" && (
                          <p className="mt-1 text-[11px] font-semibold text-red-600">{feedback.message || "Failed to send"}</p>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between gap-4 border-t border-slate-100 px-4 py-3.5">
            <p className="text-[12.5px] text-slate-500">
              Page <strong className="text-slate-700">{page}</strong> of{" "}
              <strong className="text-slate-700">{totalPages}</strong> · {total} total
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[12.5px] font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Prev
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[12.5px] font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                Next <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SupportDocumentsPage() {
  return (
    <Suspense fallback={null}>
      <DocumentsPageInner />
    </Suspense>
  );
}
