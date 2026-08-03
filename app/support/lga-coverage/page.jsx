"use client";

import { useState, useEffect, useMemo } from "react";
import { MapPin, AlertCircle, Search, X, Loader2, RefreshCw } from "lucide-react";
import { getSupportLgaCoverage } from "@/lib/api";

export default function SupportLgaCoveragePage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    const res = await getSupportLgaCoverage();
    if (res.error) setError(res.error);
    else if (res.data) setItems(res.data || []);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredItems = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return items;
    return items.filter(
      (item) =>
        (item.state_name || "").toLowerCase().includes(q) ||
        (item.lga_name || "").toLowerCase().includes(q)
    );
  }, [items, searchQuery]);

  return (
    <div className="space-y-6 pb-16">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-emerald-800 mb-2">
              <MapPin className="h-3.5 w-3.5 text-[#28A745]" />
              LGA coverage
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Where we have agents</h1>
            <p className="mt-1 text-sm text-slate-600 max-w-2xl">
              Every LGA and how many active agents currently cover it — use this to tell a customer
              whether their location has coverage before redirecting them.
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
          placeholder="Search state or LGA..."
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
            <p className="text-sm text-slate-500 font-medium">Loading coverage…</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-16 text-center space-y-2">
            <MapPin className="h-10 w-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">No matches</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">Try a different state or LGA name.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/60">
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">State</th>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">LGA</th>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Active agents</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((item) => (
                  <tr key={`${item.state_name}-${item.lga_name}`} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3.5 text-[12.5px] text-slate-600">{item.state_name}</td>
                    <td className="px-4 py-3.5 text-[13px] font-semibold text-slate-900">{item.lga_name}</td>
                    <td className="px-4 py-3.5">
                      {item.active_agents > 0 ? (
                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
                          {item.active_agents} agent{item.active_agents === 1 ? "" : "s"}
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500 ring-1 ring-inset ring-slate-200">
                          No agents
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
