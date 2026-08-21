"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Archive,
  Eye,
  Loader2,
  AlertCircle,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { getSupportCustomer, getSupportArchivedDocuments, resolveMediaUrl } from "@/lib/api";
import { formatDate, freshnessMeta } from "@/app/dashboard/_shared/apply-helpers";
import { TONE_CLASSES } from "@/app/dashboard/_shared/status-config";
import DocumentPreviewModal from "@/app/components/design/DocumentPreviewModal";

function FreshnessBadge({ expiryDate }) {
  const meta = freshnessMeta(expiryDate);
  if (!meta) return null;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold ring-1 ring-inset ${TONE_CLASSES[meta.tone]}`}>
      {meta.label}
    </span>
  );
}

export default function SupportCustomerArchivePage() {
  const params = useParams();
  const customerId = params.id;

  const [customer, setCustomer] = useState(null);
  const [customerLoading, setCustomerLoading] = useState(true);

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    getSupportCustomer(customerId).then((res) => {
      if (res.data) setCustomer(res.data);
      setCustomerLoading(false);
    });
  }, [customerId]);

  const loadArchive = async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    const res = await getSupportArchivedDocuments(customerId, { page, page_size: pageSize });
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

  useEffect(() => {
    loadArchive();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  return (
    <div className="space-y-6 pb-16">
      <DocumentPreviewModal isOpen={!!previewUrl} onClose={() => setPreviewUrl(null)} fileUrl={previewUrl} />

      <Link
        href={`/support/customers/${customerId}`}
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back
      </Link>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-emerald-800 mb-2">
              <Archive className="h-3.5 w-3.5 text-[#28A745]" />
              Document archive
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {customerLoading ? "Loading…" : customer?.name ? `${customer.name}'s documents` : "Customer documents"}
            </h1>
            <p className="mt-1 text-sm text-slate-600 max-w-2xl">
              Superseded licences, permits, and vehicle documents that are no longer this customer's current version.
            </p>
          </div>
          <button
            type="button"
            onClick={() => loadArchive(true)}
            disabled={refreshing || loading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 transition-all shadow-sm shrink-0 self-start md:self-center"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin text-[#28A745]" : "text-slate-500"}`} />
            <span>{refreshing ? "Syncing…" : "Refresh"}</span>
          </button>
        </div>
      </div>

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
        ) : items.length === 0 ? (
          <div className="p-16 text-center space-y-2">
            <CheckSquare className="h-10 w-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">No archived documents</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">This customer has no superseded documents on file.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/60">
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Document</th>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Expiry</th>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((doc) => (
                  <tr key={doc.key} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                        {doc.category}
                      </span>
                      <p className="mt-1 text-[12.5px] font-semibold text-slate-800">{doc.label}</p>
                      {doc.licence_number && <p className="text-[11px] text-slate-500">Licence No: {doc.licence_number}</p>}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[12.5px] text-slate-700">{formatDate(doc.expiry_date)}</span>
                        <FreshnessBadge expiryDate={doc.expiry_date} />
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      {doc.document_url && (
                        <button
                          type="button"
                          onClick={() => setPreviewUrl(resolveMediaUrl(doc.document_url))}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11.5px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <Eye className="h-3 w-3" /> View
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
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
