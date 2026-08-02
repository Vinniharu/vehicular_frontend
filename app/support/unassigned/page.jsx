"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  MapPinOff,
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
} from "lucide-react";
import { getSupportUnassignedApplications } from "@/lib/api";
import RedirectModal from "../_shared/RedirectModal";

export default function SupportUnassignedPage() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [redirecting, setRedirecting] = useState(null);

  const loadData = async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    const res = await getSupportUnassignedApplications({ page, page_size: pageSize });
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
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const filteredItems = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return items;
    return items.filter(
      (a) =>
        String(a.id).includes(q) ||
        (a.applicant_name || "").toLowerCase().includes(q) ||
        (a.customer_email || "").toLowerCase().includes(q) ||
        (a.lga || "").toLowerCase().includes(q) ||
        (a.state_of_residence || "").toLowerCase().includes(q)
    );
  }, [items, searchQuery]);

  return (
    <div className="space-y-6 pb-16">
      <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-amber-800 mb-2">
              <MapPinOff className="h-3.5 w-3.5" />
              Needs a new state/LGA
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Unassigned applications</h1>
            <p className="mt-1 text-sm text-slate-600 max-w-2xl">
              Applications whose destination LGA currently has zero active agents. Redirect each one
              to a state/LGA that has coverage.
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

      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter by ID, customer, or LGA..."
          className="w-full rounded-lg border border-slate-300 bg-white pl-10 pr-9 py-2.5 text-[13px] text-slate-900 placeholder:text-slate-400 focus:border-[#28A745] focus:outline-none focus:ring-2 focus:ring-[#28A745]/15 shadow-sm transition-all"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        )}
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
            <p className="text-sm text-slate-500 font-medium">Loading…</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-16 text-center space-y-2">
            <CheckSquare className="h-10 w-10 text-emerald-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">Nothing unassigned</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">Every active application is in an LGA with at least one agent.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/60">
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">ID</th>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Customer</th>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Type</th>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">State / LGA</th>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Status</th>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3.5 font-mono text-[12.5px] font-bold text-slate-900">
                      <Link href={`/support/applications/${app.id}`} className="hover:underline">#{app.id}</Link>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-[13px] font-semibold text-slate-800">{app.applicant_name}</p>
                      <div className="mt-0.5 space-y-0.5">
                        <p className="flex items-center gap-1 text-[11px] text-slate-500"><Mail className="h-2.5 w-2.5" />{app.customer_email}</p>
                        {app.customer_phone && <p className="flex items-center gap-1 text-[11px] text-slate-500"><Phone className="h-2.5 w-2.5" />{app.customer_phone}</p>}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                        {(app.application_type || "fresh").replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-[12.5px] text-slate-600">{app.state_of_residence} / {app.lga}</td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 capitalize">
                        {(app.status || "").replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <button
                        type="button"
                        onClick={() => setRedirecting(app)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#28A745] px-3 py-1.5 text-[11.5px] font-semibold text-white hover:bg-[#1F8838] transition-colors"
                      >
                        <MapPinOff className="h-3 w-3" /> Redirect
                      </button>
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

      {redirecting && (
        <RedirectModal
          application={redirecting}
          onClose={() => setRedirecting(null)}
          onRedirected={() => loadData(true)}
        />
      )}
    </div>
  );
}
