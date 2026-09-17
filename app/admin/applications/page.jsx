"use client";

import { useState, useEffect, useMemo } from "react";
import {
  ClipboardList,
  AlertCircle,
  Search,
  X,
  Loader2,
  RefreshCw,
  CheckSquare,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Building2,
  Phone,
  Mail,
  MapPin,
  Pencil,
  CheckCircle2,
  Timer,
  Trash2,
  AlertTriangle,
  Car,
} from "lucide-react";
import {
  adminGetApplications,
  adminGetStaff,
  adminGetAgents,
  adminReassignStaff,
  adminReassignAgent,
  adminGetEligibleAgents,
  adminDeleteApplication,
  adminBulkDeleteApplications,
} from "@/lib/api";

const STATUS_TONE = {
  submitted: "bg-sky-50 text-sky-700 ring-sky-200",
  staff_review: "bg-amber-50 text-amber-700 ring-amber-200",
  driving_school_enrolled: "bg-violet-50 text-violet-700 ring-violet-200",
  driving_school_certificate_ready: "bg-teal-50 text-teal-700 ring-teal-200",
  routed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  agent_assigned: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  agent_accepted: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  captured: "bg-teal-50 text-teal-700 ring-teal-200",
  capturing_completed: "bg-teal-50 text-teal-700 ring-teal-200",
  temp_licence_pending_review: "bg-amber-50 text-amber-700 ring-amber-200",
  temp_licence_issued: "bg-violet-50 text-violet-700 ring-violet-200",
  agent_completed: "bg-amber-50 text-amber-700 ring-amber-200",
  staff_final_review: "bg-amber-50 text-amber-700 ring-amber-200",
  awaiting_customer: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  completed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  staff_rejected: "bg-red-50 text-red-700 ring-red-200",
  needs_correction: "bg-amber-50 text-amber-700 ring-amber-200",
  expired: "bg-red-50 text-red-700 ring-red-200",
};

function StatusBadge({ status }) {
  const tone = STATUS_TONE[status] || "bg-slate-100 text-slate-600 ring-slate-200";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset capitalize ${tone}`}>
      {(status || "unknown").replace(/_/g, " ")}
    </span>
  );
}

function AssignmentPill({ assigned_staff, assigned_agent }) {
  if (!assigned_staff && !assigned_agent) {
    return <span className="text-[12px] text-slate-400">—</span>;
  }
  return (
    <div className="space-y-1">
      {assigned_staff && (
        <div className="flex items-center gap-1.5 text-[12px] font-medium text-slate-700">
          <UserCheck className="h-3 w-3 shrink-0 text-[#28A745]" />
          <span className="truncate">{assigned_staff.name}</span>
        </div>
      )}
      {assigned_agent && (
        <div className="flex items-center gap-1.5 text-[11.5px] text-slate-500">
          <Building2 className="h-3 w-3 shrink-0 text-slate-400" />
          <span className="truncate">{assigned_agent.name}</span>
        </div>
      )}
    </div>
  );
}

export default function AdminApplicationsPage() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [sortBy, setSortBy] = useState("updated_at");

  const [selected, setSelected] = useState(null);
  const [toast, setToast] = useState(null);
  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 5000);
  };

  const [staffOptions, setStaffOptions] = useState([]);
  const [agentOptions, setAgentOptions] = useState([]);
  const [optionsLoaded, setOptionsLoaded] = useState(false);
  const [editingStaff, setEditingStaff] = useState(false);
  const [editingAgent, setEditingAgent] = useState(false);
  const [pendingStaffId, setPendingStaffId] = useState("");
  const [pendingAgentId, setPendingAgentId] = useState("");
  const [reassigning, setReassigning] = useState(false);
  const [eligibleAgents, setEligibleAgents] = useState([]);
  const [loadingEligibleAgents, setLoadingEligibleAgents] = useState(false);
  const [reassignAgentError, setReassignAgentError] = useState(null);

  useEffect(() => {
    if (!selected || optionsLoaded) return;
    (async () => {
      const [staffRes, agentRes] = await Promise.all([adminGetStaff(), adminGetAgents()]);
      if (staffRes.data) setStaffOptions(staffRes.data);
      if (agentRes.data) setAgentOptions(agentRes.data);
      setOptionsLoaded(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  useEffect(() => {
    setEditingStaff(false);
    setEditingAgent(false);
    setPendingStaffId(selected?.staff_id ? String(selected.staff_id) : "");
    setPendingAgentId("");
    setEligibleAgents([]);
    setReassignAgentError(null);
  }, [selected?.id]);

  useEffect(() => {
    if (!selected || !editingAgent) return;
    setLoadingEligibleAgents(true);
    setReassignAgentError(null);
    adminGetEligibleAgents(selected.id).then((res) => {
      if (res.data && Array.isArray(res.data)) {
        setEligibleAgents(res.data);
      } else {
        setEligibleAgents([]);
      }
      setLoadingEligibleAgents(false);
    });
  }, [selected?.id, editingAgent]);

  const applyReassignResult = (updated) => {
    setSelected(updated);
    setItems((prev) => prev.map((it) => (it.id === updated.id ? updated : it)));
  };

  const handleSaveStaff = async () => {
    setReassigning(true);
    const res = await adminReassignStaff(selected.id, pendingStaffId ? Number(pendingStaffId) : null);
    setReassigning(false);
    if (res.error) {
      showToast("error", res.error);
      return;
    }
    applyReassignResult(res.data);
    setEditingStaff(false);
    showToast("success", "Staff assignment updated.");
  };

  const handleSaveAgent = async () => {
    if (!pendingAgentId) {
      setReassignAgentError("Please pick an agent first.");
      return;
    }
    setReassigning(true);
    setReassignAgentError(null);
    const res = await adminReassignAgent(selected.id, Number(pendingAgentId));
    setReassigning(false);
    if (res.error) {
      setReassignAgentError(res.error);
      showToast("error", res.error);
      return;
    }
    applyReassignResult(res.data);
    setEditingAgent(false);
    setReassignAgentError(null);
    showToast("success", "Agent assignment updated.");
  };

  const loadData = async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    const res = await adminGetApplications({
      page,
      page_size: pageSize,
      status: statusFilter || undefined,
      application_type: typeFilter || undefined,
      sort: sortBy,
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

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter, typeFilter, sortBy]);

  const filteredItems = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return items;
    return items.filter(
      (a) =>
        String(a.id).includes(q) ||
        (a.last_name || "").toLowerCase().includes(q) ||
        (a.first_name || "").toLowerCase().includes(q) ||
        (a.middle_name || "").toLowerCase().includes(q) ||
        (a.applicant_name || "").toLowerCase().includes(q) ||
        (a.lga || "").toLowerCase().includes(q) ||
        (a.state_of_residence || "").toLowerCase().includes(q) ||
        (a.assigned_staff?.name || "").toLowerCase().includes(q) ||
        (a.assigned_agent?.name || "").toLowerCase().includes(q)
    );
  }, [items, searchQuery]);

  const [selectedIds, setSelectedIds] = useState([]);
  const [deleteModal, setDeleteModal] = useState({ open: false, items: [], deleting: false });

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (filteredItems.length > 0 && selectedIds.length === filteredItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredItems.map((it) => it.id));
    }
  };

  const promptDeleteSingle = (app) => {
    setDeleteModal({ open: true, items: [app], deleting: false });
  };

  const promptDeleteBulk = () => {
    const toDelete = items.filter((it) => selectedIds.includes(it.id));
    if (toDelete.length === 0) return;
    setDeleteModal({ open: true, items: toDelete, deleting: false });
  };

  const handleConfirmDelete = async () => {
    const { items: toDelete } = deleteModal;
    if (toDelete.length === 0) return;
    setDeleteModal((prev) => ({ ...prev, deleting: true }));

    let success = false;
    let errMessage = null;

    if (toDelete.length === 1) {
      const res = await adminDeleteApplication(toDelete[0].id);
      if (res.error) {
        errMessage = res.error;
      } else {
        success = true;
      }
    } else {
      const ids = toDelete.map((it) => it.id);
      const res = await adminBulkDeleteApplications(ids);
      if (res.error) {
        errMessage = res.error;
      } else {
        success = true;
      }
    }

    if (success) {
      showToast("success", `Successfully deleted ${toDelete.length} application${toDelete.length > 1 ? "s" : ""}.`);
      setDeleteModal({ open: false, items: [], deleting: false });
      const deletedIdSet = new Set(toDelete.map((it) => it.id));
      setSelectedIds((prev) => prev.filter((id) => !deletedIdSet.has(id)));
      if (selected && deletedIdSet.has(selected.id)) {
        setSelected(null);
      }
      loadData(true);
    } else {
      showToast("error", errMessage || "Failed to delete applications.");
      setDeleteModal((prev) => ({ ...prev, deleting: false }));
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-start gap-3 pl-4 pr-5 py-3.5 rounded-xl shadow-xl border text-[13px] font-medium max-w-sm transition-all ${
          toast.type === "success"
            ? "bg-white border-emerald-200 text-slate-800"
            : "bg-white border-red-200 text-slate-800"
        }`}>
          {toast.type === "success"
            ? <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-[#28A745]" />
            : <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-500" />}
          <span className="flex-1 leading-snug">{toast.msg}</span>
          <button type="button" onClick={() => setToast(null)} className="ml-1 text-slate-400 hover:text-slate-600 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-emerald-800 mb-2">
              <ClipboardList className="h-3.5 w-3.5 text-[#28A745]" />
              Full oversight
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">All applications</h1>
            <p className="mt-1 text-sm text-slate-600 max-w-2xl">
              Every application in the system regardless of claim state, with the assigned staff
              member and field agent shown for each — the unrestricted view staff's own queue
              deliberately hides once an application is claimed.
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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by ID, applicant, LGA, or assignee..."
            className="w-full rounded-lg border border-slate-300 bg-white pl-10 pr-9 py-2.5 text-[13px] text-slate-900 placeholder:text-slate-400 focus:border-[#28A745] focus:outline-none focus:ring-2 focus:ring-[#28A745]/15 shadow-sm transition-all"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-[13px] text-slate-700 shadow-sm focus:border-[#28A745] focus:outline-none focus:ring-2 focus:ring-[#28A745]/15"
        >
          <option value="">All types</option>
          <option value="fresh">Fresh</option>
          <option value="renewal">Renewal</option>
          <option value="reissue">Reissue</option>
          <option value="tinted_permit">Tinted Permit</option>
          <option value="number_plate_new">Number Plate — New</option>
          <option value="number_plate_replacement">Number Plate — Replacement</option>
          <option value="number_plate_change_of_ownership">Number Plate — Change of Ownership</option>
          <option value="number_plate_fancy">Number Plate — Fancy</option>
          <option value="number_plate_dealership">Number Plate — Dealership</option>
          <option value="physical_condition_inspection">Physical Condition Inspection</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-[13px] text-slate-700 shadow-sm focus:border-[#28A745] focus:outline-none focus:ring-2 focus:ring-[#28A745]/15"
        >
          <option value="">All statuses</option>
          {Object.keys(STATUS_TONE).map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
          ))}
        </select>
        <select
          value={sortBy}
          onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-[13px] text-slate-700 shadow-sm focus:border-[#28A745] focus:outline-none focus:ring-2 focus:ring-[#28A745]/15"
        >
          <option value="updated_at">Recently updated</option>
          <option value="id">ID number</option>
          <option value="name">Applicant name</option>
        </select>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Bulk action banner */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-900 px-5 py-3 text-white shadow-lg animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#28A745] text-xs font-bold text-white">
              {selectedIds.length}
            </span>
            <span className="text-[13.5px] font-semibold">
              {selectedIds.length} application{selectedIds.length > 1 ? "s" : ""} selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="rounded-lg px-3 py-1.5 text-[12.5px] font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Deselect all
            </button>
            <button
              type="button"
              onClick={promptDeleteBulk}
              className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3.5 py-1.5 text-[12.5px] font-bold text-white hover:bg-rose-700 transition-colors shadow-sm"
            >
              <Trash2 className="h-4 w-4" />
              Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-[#28A745] mx-auto" />
            <p className="text-sm text-slate-500 font-medium">Loading applications…</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-16 text-center space-y-2">
            <CheckSquare className="h-10 w-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">No applications found</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              No applications match your current search or filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/60">
                  <th className="w-12 px-3 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={filteredItems.length > 0 && selectedIds.length === filteredItems.length}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-slate-300 text-[#28A745] focus:ring-[#28A745]"
                      title="Select all"
                    />
                  </th>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">ID</th>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Applicant</th>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Type</th>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Status</th>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">SLA / Deadline</th>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">LGA</th>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Assigned to</th>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Updated</th>
                  <th className="w-16 px-3 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((app) => (
                  <tr
                    key={app.id}
                    onClick={() => setSelected(app)}
                    className="cursor-pointer hover:bg-slate-50 transition-colors"
                  >
                    <td className="w-12 px-3 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(app.id)}
                        onChange={() => toggleSelect(app.id)}
                        className="h-4 w-4 rounded border-slate-300 text-[#28A745] focus:ring-[#28A745]"
                      />
                    </td>
                    <td className="px-4 py-3.5 font-mono text-[12.5px] font-bold text-slate-900">#{app.id}</td>
                    <td className="px-4 py-3.5 text-[13px]">
                      <div className="font-bold text-slate-900">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mr-1.5">Surname:</span>
                        {app.last_name || "—"}
                      </div>
                      <div className="text-[12px] text-slate-600 mt-0.5">
                        <span className="text-[10px] font-medium text-slate-400 mr-1">First:</span>
                        <strong className="font-semibold text-slate-800">{app.first_name || "—"}</strong>
                        {app.middle_name && (
                          <span className="text-slate-500 ml-1.5">({app.middle_name})</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                        {(app.application_type || "fresh").replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3.5"><StatusBadge status={app.status} /></td>
                    <td className="px-4 py-3.5">
                      {(app.payment_status === "success" || app.payment_status === "paid") && app.sla ? (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold ${
                          app.sla.is_breached
                            ? "bg-rose-100 text-rose-700 border border-rose-200 animate-pulse"
                            : app.sla.is_nearing
                            ? "bg-amber-100 text-amber-700 border border-amber-200"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        }`}>
                          <Timer className="h-3 w-3 shrink-0" />
                          {app.sla.label} ({app.sla.days_elapsed}/{app.sla.days_allocated}d)
                        </span>
                      ) : (
                        <span className="text-[11.5px] text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-[12.5px] text-slate-600">{app.lga || "—"}</td>
                    <td className="px-4 py-3.5">
                      <AssignmentPill assigned_staff={app.assigned_staff} assigned_agent={app.assigned_agent} />
                    </td>
                    <td className="px-4 py-3.5 text-[12px] text-slate-500">
                      {app.updated_at ? new Date(app.updated_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                    </td>
                    <td className="w-16 px-3 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => promptDeleteSingle(app)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                        title="Delete application"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
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

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-[12px] font-semibold text-slate-500 uppercase tracking-wide">Surname: <strong className="text-[17px] font-bold text-slate-900">{selected.last_name || "—"}</strong></span>
                  <span className="text-slate-300">•</span>
                  <span className="text-[12px] font-semibold text-slate-500 uppercase tracking-wide">First: <strong className="text-[17px] font-bold text-slate-900">{selected.first_name || "—"}</strong></span>
                  {selected.middle_name && (
                    <>
                      <span className="text-slate-300">•</span>
                      <span className="text-[12px] font-semibold text-slate-500 uppercase tracking-wide">Middle: <strong className="text-[17px] font-bold text-slate-900">{selected.middle_name}</strong></span>
                    </>
                  )}
                </div>
                <p className="mt-0.5 font-mono text-[12px] text-slate-400">#{selected.id}</p>
              </div>
              <button onClick={() => setSelected(null)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                  {(selected.application_type || "fresh").replace(/_/g, " ")}
                </span>
                <StatusBadge status={selected.status} />
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                  {selected.payment_status || "unpaid"}
                </span>
              </div>

              {(selected.payment_status === "success" || selected.payment_status === "paid") && selected.sla && (
                <div className={`rounded-xl border p-3.5 ${
                  selected.sla.is_breached
                    ? "border-rose-200 bg-rose-50/70"
                    : selected.sla.is_nearing
                    ? "border-amber-200 bg-amber-50/70"
                    : "border-slate-200 bg-slate-50/70"
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Timer className={`h-4 w-4 ${selected.sla.is_breached ? "text-rose-600" : selected.sla.is_nearing ? "text-amber-600" : "text-emerald-600"}`} />
                      <span className="text-[12.5px] font-bold text-slate-900">
                        SLA: {selected.sla.label}
                      </span>
                    </div>
                    <span className="text-[11.5px] font-mono font-bold text-slate-700">
                      {selected.sla.days_elapsed} / {selected.sla.days_allocated} {selected.sla.day_type === "business_days" ? "work days" : "days"}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        selected.sla.is_breached ? "bg-rose-600" : selected.sla.is_nearing ? "bg-amber-500" : "bg-emerald-500"
                      }`}
                      style={{ width: `${Math.min(100, selected.sla.percent_elapsed)}%` }}
                    />
                  </div>
                  <div className="mt-1.5 flex justify-between text-[11px] text-slate-500">
                    <span>Target: {new Date(selected.sla.target_deadline).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                    <span className="font-semibold">{selected.sla.days_remaining}d remaining</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                <div>
                  <span className="block text-[10.5px] font-bold uppercase tracking-wide text-slate-400">State / LGA</span>
                  <span className="mt-1 flex items-center gap-1 text-[13px] font-semibold text-slate-800">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    {selected.state_of_residence || "—"} / {selected.lga || "—"}
                  </span>
                </div>
                <div>
                  <span className="block text-[10.5px] font-bold uppercase tracking-wide text-slate-400">Last updated</span>
                  <span className="mt-1 block text-[13px] font-semibold text-slate-800">
                    {selected.updated_at ? new Date(selected.updated_at).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" }) : "—"}
                  </span>
                </div>
              </div>

              {/* Delivery Address Card (All services except fresh/renewal DL) */}
              {(selected.delivery_address || selected.applicant_details?.delivery_address) && (
                <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 p-4 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-indigo-900 font-bold text-[12.5px]">
                      <MapPin className="h-4 w-4 text-indigo-600 shrink-0" />
                      <span>Delivery Address</span>
                    </div>
                    <span className="text-[10px] uppercase font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                      Physical Dispatch
                    </span>
                  </div>
                  <p className="text-[13px] text-slate-800 font-medium pl-5.5">
                    {selected.delivery_address || selected.applicant_details?.delivery_address}
                  </p>
                </div>
              )}

              {/* Vehicle & Plate Specifications (Tailored for vehicle services) */}
              {(selected.vehicle || selected.vehicle_type || selected.chassis_number || selected.make || selected.vehicle_body_type) && (
                <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-blue-900 font-bold text-[12.5px]">
                    <Car className="h-4 w-4 text-blue-600 shrink-0" />
                    <span>Vehicle & Plate Details</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-[12px] pt-1">
                    {selected.vehicle_type && (
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Vehicle Type</span>
                        <span className="font-bold text-slate-800">{selected.vehicle_type}</span>
                      </div>
                    )}
                    {selected.vehicle_body_type && (
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Body Type (SUV / Saloon)</span>
                        <span className="font-bold text-slate-800">{selected.vehicle_body_type}</span>
                      </div>
                    )}
                    {(selected.make || selected.vehicle?.make) && (
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Make & Model</span>
                        <span className="font-bold text-slate-800">{selected.make || selected.vehicle?.make} {selected.model || selected.vehicle?.model}</span>
                      </div>
                    )}
                    {(selected.colour || selected.vehicle?.colour) && (
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Colour</span>
                        <span className="font-bold text-slate-800 capitalize">{selected.colour || selected.vehicle?.colour}</span>
                      </div>
                    )}
                    {(selected.year || selected.vehicle?.year) && (
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Manufacturing Year</span>
                        <span className="font-bold text-slate-800 font-mono">{selected.year || selected.vehicle?.year}</span>
                      </div>
                    )}
                    {(selected.chassis_number || selected.vehicle?.chassis_number) && (
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Chassis / VIN</span>
                        <span className="font-bold text-slate-800 font-mono">{selected.chassis_number || selected.vehicle?.chassis_number}</span>
                      </div>
                    )}
                    {selected.former_registration_number && (
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Former Reg No</span>
                        <span className="font-bold text-slate-800 font-mono">{selected.former_registration_number}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Assigned staff</h4>
                  {!editingStaff && (
                    <button onClick={() => setEditingStaff(true)} className="flex items-center gap-1 rounded bg-[#28A745]/5 px-2 py-0.5 text-[11px] text-[#28A745] hover:text-[#218838]">
                      <Pencil className="h-3 w-3" /> Reassign
                    </button>
                  )}
                </div>
                {editingStaff ? (
                  <div className="space-y-2">
                    <select
                      value={pendingStaffId}
                      onChange={(e) => setPendingStaffId(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px] text-slate-800 focus:border-[#28A745] focus:outline-none focus:ring-2 focus:ring-[#28A745]/15"
                    >
                      <option value="">— Unassigned —</option>
                      {staffOptions.map((s) => (
                        <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
                      ))}
                    </select>
                    <div className="flex items-center gap-2">
                      <button onClick={handleSaveStaff} disabled={reassigning} className="rounded-lg bg-[#28A745] px-3 py-1.5 text-[11.5px] font-semibold text-white disabled:opacity-70">
                        {reassigning ? "Saving…" : "Save"}
                      </button>
                      <button onClick={() => setEditingStaff(false)} disabled={reassigning} className="rounded-lg border border-slate-200 px-3 py-1.5 text-[11.5px] font-medium text-slate-600">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : selected.assigned_staff ? (
                  <div className="rounded-xl border border-[#28A745]/20 bg-[#E9F7EC] p-3.5 space-y-1.5">
                    <p className="flex items-center gap-1.5 text-[13.5px] font-bold text-slate-900">
                      <UserCheck className="h-3.5 w-3.5 text-[#166B2C]" /> {selected.assigned_staff.name}
                    </p>
                    {selected.assigned_staff.email && (
                      <p className="flex items-center gap-1.5 text-[12px] text-slate-600"><Mail className="h-3 w-3" /> {selected.assigned_staff.email}</p>
                    )}
                    {selected.assigned_staff.phone && (
                      <p className="flex items-center gap-1.5 text-[12px] text-slate-600"><Phone className="h-3 w-3" /> {selected.assigned_staff.phone}</p>
                    )}
                  </div>
                ) : (
                  <p className="rounded-xl border border-dashed border-slate-200 p-3.5 text-[12.5px] text-slate-400">Not yet claimed by a staff member.</p>
                )}
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Assigned agent</h4>
                  {!editingAgent && (
                    <button onClick={() => setEditingAgent(true)} className="flex items-center gap-1 rounded bg-[#28A745]/5 px-2 py-0.5 text-[11px] text-[#28A745] hover:text-[#218838]">
                      <Pencil className="h-3 w-3" /> Reassign
                    </button>
                  )}
                </div>
                {editingAgent ? (
                  <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
                    {reassignAgentError && (
                      <div className="rounded-lg border border-red-200 bg-red-50 p-3 flex items-start gap-2 text-[12.5px] text-red-800 shadow-sm">
                        <AlertCircle className="h-4.5 w-4.5 text-red-600 shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-red-900">Assignment Failed</p>
                          <p className="mt-0.5 text-red-700 leading-relaxed text-[12px]">{reassignAgentError}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setReassignAgentError(null)}
                          className="text-red-400 hover:text-red-600 transition-colors p-0.5"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}

                    {loadingEligibleAgents ? (
                      <p className="flex items-center gap-2 text-[12.5px] text-slate-500 py-1">
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-[#28A745]" />
                        Finding eligible agents for this application...
                      </p>
                    ) : eligibleAgents.filter(a => a.agent_id !== (selected.assigned_agent?.agent_id || selected.assigned_agent_id) && a.has_bank_account).length === 0 ? (
                      <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-[12.5px] text-amber-800 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                        <span>No eligible agents found capable of handling {(selected.application_type || "this service").replace(/_/g, " ")}.</span>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                          Select Task-Eligible Agent:
                        </label>
                        <select
                          value={pendingAgentId}
                          onChange={(e) => {
                            setPendingAgentId(e.target.value);
                            setReassignAgentError(null);
                          }}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px] text-slate-800 focus:border-[#28A745] focus:outline-none focus:ring-2 focus:ring-[#28A745]/15"
                        >
                          <option value="">Select an agent…</option>
                          {eligibleAgents
                            .filter((a) => a.agent_id !== (selected.assigned_agent?.agent_id || selected.assigned_agent_id) && a.has_bank_account)
                            .map((a) => (
                              <option key={a.agent_id} value={a.agent_id}>
                                Agent #{a.agent_id} — {a.name} ({a.state || ""}{a.lga ? ` / ${a.lga}` : ""} • {a.vio_office}){a.matches_location ? " [Local Area]" : ""}
                              </option>
                            ))}
                        </select>
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={handleSaveAgent}
                        disabled={reassigning || !pendingAgentId || loadingEligibleAgents}
                        className="rounded-lg bg-[#28A745] px-3.5 py-1.5 text-[11.5px] font-semibold text-white hover:bg-[#218838] transition-colors disabled:opacity-50"
                      >
                        {reassigning ? (
                          <span className="flex items-center gap-1.5"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…</span>
                        ) : (
                          "Save Assignment"
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setEditingAgent(false);
                          setReassignAgentError(null);
                          setPendingAgentId("");
                        }}
                        disabled={reassigning}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11.5px] font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : selected.assigned_agent ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 space-y-1.5">
                    <p className="flex items-center gap-1.5 text-[13.5px] font-bold text-slate-900">
                      <Building2 className="h-3.5 w-3.5 text-slate-500" /> {selected.assigned_agent.name}
                    </p>
                    <p className="text-[12px] text-slate-600">{selected.assigned_agent.vio_office}</p>
                    {selected.assigned_agent.phone && (
                      <p className="flex items-center gap-1.5 text-[12px] text-slate-600"><Phone className="h-3 w-3" /> {selected.assigned_agent.phone}</p>
                    )}
                  </div>
                ) : (
                  <p className="rounded-xl border border-dashed border-slate-200 p-3.5 text-[12.5px] text-slate-400">No agent assigned yet.</p>
                )}
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => promptDeleteSingle(selected)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2 text-[12.5px] font-semibold text-rose-700 hover:bg-rose-100 transition-all"
              >
                <Trash2 className="h-4 w-4 text-rose-600" /> Delete application
              </button>
              <button
                onClick={() => setSelected(null)}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#28A745] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#1F8838] transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Repercussions Delete Confirmation Modal */}
      {deleteModal.open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border border-rose-100 bg-white p-6 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100">
                <AlertTriangle className="h-5 w-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-[16px] font-bold text-slate-900">
                  {deleteModal.items.length === 1 ? "Permanently Delete Application" : "Permanently Delete Applications"}
                </h3>
                <p className="text-[12px] text-rose-600 font-semibold">Irreversible Administrative Action</p>
              </div>
            </div>

            <div className="space-y-3 py-2 text-[13px] text-slate-600">
              <p>
                {deleteModal.items.length === 1 ? (
                  <>
                    Are you sure you want to permanently delete application{" "}
                    <strong className="font-mono text-slate-900">#{deleteModal.items[0]?.id}</strong>
                    {deleteModal.items[0]?.applicant_name || deleteModal.items[0]?.last_name
                      ? ` (${deleteModal.items[0]?.last_name || ""} ${deleteModal.items[0]?.first_name || ""})`
                      : ""}
                    ?
                  </>
                ) : (
                  <>
                    Are you sure you want to permanently delete{" "}
                    <strong className="text-slate-900">{deleteModal.items.length} selected applications</strong>?
                  </>
                )}
              </p>

              <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-3.5 space-y-1.5 text-rose-900 text-[12px]">
                <p className="font-bold flex items-center gap-1.5 text-rose-700">
                  <AlertCircle className="h-4 w-4 shrink-0" /> Repercussions & Warning:
                </p>
                <ul className="list-disc list-inside space-y-1 text-rose-800 leading-relaxed pl-1">
                  <li>This action is <strong>permanent</strong> and cannot be undone.</li>
                  <li>All uploaded files, customer slips, and verification images will be purged.</li>
                  <li>Audit logs, payment records, and status histories will be removed.</li>
                  <li>Assigned staff and field agents will immediately lose access.</li>
                </ul>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2.5 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setDeleteModal({ open: false, items: [], deleting: false })}
                disabled={deleteModal.deleting}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleteModal.deleting}
                className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-[13px] font-bold text-white hover:bg-rose-700 transition-colors disabled:opacity-50 shadow-sm"
              >
                {deleteModal.deleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Deleting…
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Delete Permanently
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-3 text-[13px] font-semibold text-slate-800 shadow-xl ring-1 ring-black/5">
          <span className={`h-2.5 w-2.5 rounded-full ${toast.type === "error" ? "bg-red-500" : "bg-[#28A745]"}`} />
          <span>{toast.msg}</span>
          <button onClick={() => setToast(null)} className="ml-2 text-slate-400 hover:text-slate-600">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
