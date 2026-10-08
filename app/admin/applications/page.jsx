"use client";

import { useState, useEffect, useMemo } from "react";
import {
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
  Timer,
  Trash2,
  AlertTriangle,
  AlertCircle,
  Car,
  Zap,
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
  sendAdminFastTrackRequest,
} from "@/lib/api";
import { useToast } from "@/app/components/shared/ToastProvider";
import {
  Badge,
  Button,
  DetailRow,
  EmptyState,
  Field,
  IconButton,
  Notice,
  PageHeader,
  Select,
  Sheet,
  SkeletonList,
} from "@/app/dashboard/_kit";
import { ConfirmSheet, ResponsiveTable, Toolbar } from "../_kit";
import DepositWaiver from "./DepositWaiver";

// Status → badge tone. The keys also drive the status filter options.
const STATUS_TONE = {
  submitted: "neutral",
  staff_review: "amber",
  driving_school_enrolled: "neutral",
  driving_school_graduation: "neutral",
  driving_school_certificate_ready: "brand",
  routed: "brand",
  agent_assigned: "brand",
  agent_accepted: "brand",
  captured: "brand",
  capturing_completed: "brand",
  temp_licence_pending_review: "amber",
  temp_licence_issued: "brand",
  agent_completed: "amber",
  staff_final_review: "amber",
  awaiting_customer: "brand",
  completed: "brand",
  staff_rejected: "red",
  needs_correction: "amber",
  expired: "red",
};

const cx = (...parts) => parts.filter(Boolean).join(" ");

function StatusBadge({ status }) {
  return (
    <Badge tone={STATUS_TONE[status] || "neutral"} className="capitalize">
      {(status || "unknown").replace(/_/g, " ")}
    </Badge>
  );
}

function TypeBadge({ type }) {
  return (
    <Badge tone="neutral" className="capitalize">
      {(type || "fresh").replace(/_/g, " ")}
    </Badge>
  );
}

function FastTrackBadge() {
  return (
    <Badge tone="amber">
      <Zap className="h-3.5 w-3.5" aria-hidden /> Fast Track
    </Badge>
  );
}

function slaTone(sla) {
  return sla.is_breached ? "red" : sla.is_nearing ? "amber" : "brand";
}

function AssignmentPill({ assigned_staff, assigned_agent }) {
  if (!assigned_staff && !assigned_agent) {
    return <span className="text-sm text-cx-muted">—</span>;
  }
  return (
    <div className="min-w-0 space-y-1">
      {assigned_staff && (
        <div className="flex items-center gap-1.5 text-sm font-medium text-cx-ink">
          <UserCheck className="h-4 w-4 shrink-0 text-cx-brand" aria-hidden />
          <span className="truncate">{assigned_staff.name}</span>
        </div>
      )}
      {assigned_agent && (
        <div className="flex items-center gap-1.5 text-[13px] text-cx-muted">
          <Building2 className="h-4 w-4 shrink-0" aria-hidden />
          <span className="truncate">{assigned_agent.name}</span>
        </div>
      )}
    </div>
  );
}

function AssignedHeader({ title, editing, onEdit }) {
  return (
    <div className="mb-2 flex items-center justify-between gap-3">
      <h3 className="text-[15px] font-semibold text-cx-ink">{title}</h3>
      {!editing && (
        <Button variant="soft" size="sm" icon={Pencil} className="min-h-11" onClick={onEdit}>
          Reassign
        </Button>
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
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("updated_at");
  const [isUrgentOnly, setIsUrgentOnly] = useState(false);
  const [sendingFastTrack, setSendingFastTrack] = useState(false);

  const [selected, setSelected] = useState(null);
  const pushToast = useToast();
  const showToast = (type, msg) => {
    pushToast({ tone: type, title: msg });
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
    const isSearching = Boolean(debouncedSearch);
    const res = await adminGetApplications({
      page: isSearching ? 1 : page,
      page_size: isSearching ? 100 : pageSize,
      status: statusFilter || undefined,
      application_type: typeFilter || undefined,
      payment_status: paymentStatusFilter || undefined,
      sort: sortBy,
      is_urgent_only: isUrgentOnly ? true : undefined,
      search: isSearching ? debouncedSearch : undefined,
    });
    if (res.error) {
      setError(res.error);
    } else if (res.data) {
      setItems(res.data.items || []);
      setTotal(res.data.total || 0);
      setTotalPages(isSearching ? 1 : (res.data.total_pages || 1));
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter, typeFilter, paymentStatusFilter, sortBy, isUrgentOnly, debouncedSearch]);

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

  const handleOfferFastTrack = async () => {
    setSendingFastTrack(true);
    const res = await sendAdminFastTrackRequest(selected.id);
    setSendingFastTrack(false);
    if (res.error) {
      showToast("error", res.error);
    } else {
      showToast("success", "Fast Track upgrade request sent to customer!");
      loadData(true);
    }
  };

  const allSelected = filteredItems.length > 0 && selectedIds.length === filteredItems.length;

  const columns = [
    {
      key: "application",
      header: "Application",
      primary: true,
      render: (app) => (
        <div className="flex min-w-0 items-start gap-1">
          <label className="-my-2 -ml-3 flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center">
            <input
              type="checkbox"
              checked={selectedIds.includes(app.id)}
              onChange={() => toggleSelect(app.id)}
              aria-label={`Select application #${app.id}`}
              className="h-5 w-5 accent-cx-brand"
            />
          </label>
          <button
            type="button"
            onClick={() => setSelected(app)}
            className="cx-focus -my-1 min-h-11 min-w-0 rounded-cx-sm py-1 text-left hover:text-cx-brand-deep"
          >
            <span className="block font-mono text-[13px] font-normal text-cx-muted">#{app.id}</span>
            <span className="block truncate font-semibold text-cx-ink">{app.last_name || "—"}</span>
            <span className="block truncate text-[13px] font-normal text-cx-muted">
              First name: <span className="text-cx-ink-2">{app.first_name || "—"}</span>
              {app.middle_name ? ` (${app.middle_name})` : ""}
            </span>
          </button>
        </div>
      ),
    },
    { key: "application_type", header: "Type", render: (app) => <TypeBadge type={app.application_type} /> },
    {
      key: "status",
      header: "Status",
      render: (app) => (
        <div className="flex flex-wrap items-center gap-1.5">
          <StatusBadge status={app.status} />
          {app.is_urgent && <FastTrackBadge />}
        </div>
      ),
    },
    {
      key: "sla",
      header: "SLA / deadline",
      render: (app) =>
        (app.payment_status === "success" || app.payment_status === "paid") && app.sla ? (
          <Badge tone={slaTone(app.sla)} className={cx("whitespace-nowrap", app.sla.is_breached && "animate-pulse")}>
            <Timer className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {app.sla.label} ({app.sla.days_elapsed}/{app.sla.days_allocated}d)
          </Badge>
        ) : (
          <span className="text-cx-muted">—</span>
        ),
    },
    { key: "lga", header: "LGA", render: (app) => <span className="text-cx-ink-2">{app.lga || "—"}</span> },
    {
      key: "assigned",
      header: "Assigned to",
      render: (app) => <AssignmentPill assigned_staff={app.assigned_staff} assigned_agent={app.assigned_agent} />,
    },
    {
      key: "updated_at",
      header: "Updated",
      hideOnMobile: true,
      className: "whitespace-nowrap",
      render: (app) => (
        <span className="text-cx-muted">
          {app.updated_at ? new Date(app.updated_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) : "—"}
        </span>
      ),
    },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      hideOnMobile: true,
      className: "w-16 text-right",
      render: (app) => (
        <IconButton
          label={`Delete application #${app.id}`}
          icon={Trash2}
          onClick={() => promptDeleteSingle(app)}
          className="text-cx-muted hover:bg-cx-red-soft hover:text-cx-red"
        />
      ),
    },
  ];

  const closeDeleteModal = () => setDeleteModal({ open: false, items: [], deleting: false });

  const eligibleChoices = selected
    ? eligibleAgents.filter((a) => a.agent_id !== (selected.assigned_agent?.agent_id || selected.assigned_agent_id) && a.has_bank_account)
    : [];

  return (
    <div className="space-y-5 pb-8">
      <PageHeader
        title="All applications"
        description="Every application, with the staff member and agent handling it — including ones other staff have claimed."
        actions={
          <Button variant="secondary" icon={RefreshCw} loading={refreshing} disabled={refreshing || loading} onClick={() => loadData(true)}>
            {refreshing ? "Syncing…" : "Refresh"}
          </Button>
        }
      />

      {/* Filters */}
      <div>
        <Toolbar
          search={searchQuery}
          onSearch={(value) => {
            setSearchQuery(value);
            setPage(1);
          }}
          placeholder="Search by ID, applicant, LGA or assignee"
        >
          <label className="flex min-h-12 cursor-pointer select-none items-center gap-2.5 rounded-cx border border-cx-line-strong bg-cx-surface px-3.5 text-[15px] font-medium text-cx-ink hover:bg-cx-sunken">
            <input
              type="checkbox"
              checked={isUrgentOnly}
              onChange={(e) => { setIsUrgentOnly(e.target.checked); setPage(1); }}
              className="h-5 w-5 accent-cx-brand"
            />
            <Zap className="h-4 w-4 text-cx-amber" aria-hidden />
            <span className="whitespace-nowrap">Fast Track only</span>
          </label>
        </Toolbar>
        <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 lg:grid-cols-4">
          <Select
            aria-label="Application type"
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            className="min-w-0"
          >
            <option value="">All types</option>
            <option value="fresh">Fresh</option>
            <option value="renewal">Renewal</option>
            <option value="reissue">Reissue</option>
            <option value="international_permit">International Permit</option>
            <option value="tinted_permit">Tinted Permit</option>
            <option value="central_motor_registry">Electronic Central Motor Registry (eCMR)</option>
            <option value="roadworthiness_express">Roadworthiness Express</option>
            <option value="vehicle_particulars">Vehicle Particulars</option>
            <option value="physical_condition_inspection">Physical Condition Inspection</option>
            <option value="number_plate_new">Number Plate — New</option>
            <option value="number_plate_replacement">Number Plate — Replacement</option>
            <option value="number_plate_change_of_ownership">Number Plate — Change of Ownership</option>
            <option value="number_plate_fancy">Number Plate — Fancy</option>
            <option value="number_plate_dealership">Number Plate — Dealership</option>
          </Select>
          <Select
            aria-label="Payment status"
            value={paymentStatusFilter}
            onChange={(e) => { setPaymentStatusFilter(e.target.value); setPage(1); }}
            className="min-w-0"
          >
            <option value="">All payments</option>
            <option value="paid">Paid fee</option>
            <option value="unpaid">Unpaid</option>
            <option value="partial">Partially paid</option>
          </Select>
          <Select
            aria-label="Application status"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="min-w-0 capitalize"
          >
            <option value="">All statuses</option>
            {Object.keys(STATUS_TONE).map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
            ))}
          </Select>
          <Select
            aria-label="Sort by"
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
            className="min-w-0"
          >
            <option value="updated_at">Recently updated</option>
            <option value="id">ID number</option>
            <option value="name">Applicant name</option>
          </Select>
        </div>
      </div>

      {error && (
        <Notice tone="red" title="Applications didn't load">
          {error}
        </Notice>
      )}

      {/* Selection + bulk actions */}
      {!loading && filteredItems.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-cx-lg border border-cx-line bg-cx-surface px-2 py-1 shadow-cx sm:px-3">
          <label className="flex min-h-11 cursor-pointer select-none items-center gap-2.5 px-1 text-[15px] text-cx-ink">
            <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} className="h-5 w-5 accent-cx-brand" />
            {selectedIds.length > 0 ? (
              <span className="font-semibold">
                {selectedIds.length} application{selectedIds.length > 1 ? "s" : ""} selected
              </span>
            ) : (
              <span>Select all on this page</span>
            )}
          </label>
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="min-h-11" onClick={() => setSelectedIds([])}>
                Deselect all
              </Button>
              <Button variant="danger" size="sm" icon={Trash2} className="min-h-11" onClick={promptDeleteBulk}>
                Delete selected
              </Button>
            </div>
          )}
        </div>
      )}

      {/* List */}
      {loading ? (
        <SkeletonList rows={5} />
      ) : filteredItems.length === 0 ? (
        <EmptyState icon={CheckSquare} title="No applications found" description="No applications match your current search or filters." />
      ) : (
        <ResponsiveTable columns={columns} rows={filteredItems} rowKey={(app) => app.id} />
      )}

      {/* Pagination */}
      {!loading && !searchQuery.trim() && totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-cx-muted">
            Page <strong className="text-cx-ink">{page}</strong> of <strong className="text-cx-ink">{totalPages}</strong> · {total} total
          </p>
          <div className="flex items-center gap-2">
            <Button variant="secondary" icon={ChevronLeft} onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
              Prev
            </Button>
            <Button variant="secondary" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
              Next <ChevronRight className="h-4 w-4" aria-hidden />
            </Button>
          </div>
        </div>
      )}
      {!loading && searchQuery.trim() && filteredItems.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-cx-muted">
            Showing all <strong className="text-cx-ink">{filteredItems.length}</strong> matching result{filteredItems.length !== 1 ? "s" : ""} on one page
          </p>
          <Button variant="ghost" onClick={() => { setSearchQuery(""); setPage(1); }}>
            Clear search
          </Button>
        </div>
      )}

      {/* Detail sheet */}
      <Sheet
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
        title={selected ? `Application #${selected.id}` : "Application"}
        description={selected ? [selected.last_name, selected.first_name, selected.middle_name].filter(Boolean).join(" ") || undefined : undefined}
        size="lg"
        footer={
          selected ? (
            <>
              <Button variant="secondary" icon={Trash2} className="text-cx-red" onClick={() => promptDeleteSingle(selected)} aria-label="Delete application">
                <span className="hidden sm:inline">Delete</span>
              </Button>
              {!selected.is_urgent && (
                <Button variant="secondary" icon={Zap} loading={sendingFastTrack} onClick={handleOfferFastTrack}>
                  {sendingFastTrack ? "Sending…" : "Offer Fast Track"}
                </Button>
              )}
              <Button block onClick={() => setSelected(null)}>
                Close
              </Button>
            </>
          ) : null
        }
      >
        {selected && (
          <div className="space-y-5">
            <dl className="divide-y divide-cx-line rounded-cx-lg border border-cx-line px-4">
              <DetailRow label="Surname" value={selected.last_name || "—"} />
              <DetailRow label="First name" value={selected.first_name || "—"} />
              {selected.middle_name && <DetailRow label="Middle name" value={selected.middle_name} />}
            </dl>

            <div className="flex flex-wrap items-center gap-2">
              <TypeBadge type={selected.application_type} />
              <StatusBadge status={selected.status} />
              {selected.is_urgent && <FastTrackBadge />}
              <Badge tone="neutral">Payment: {selected.payment_status || "unpaid"}</Badge>
            </div>

            <DepositWaiver applicationId={selected.id} />

            {(selected.payment_status === "success" || selected.payment_status === "paid") && selected.sla && (
              <div
                className={cx(
                  "rounded-cx-lg border p-4",
                  selected.sla.is_breached
                    ? "border-cx-red/30 bg-cx-red-soft"
                    : selected.sla.is_nearing
                    ? "border-cx-amber/30 bg-cx-amber-soft"
                    : "border-cx-line bg-cx-sunken"
                )}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-[15px] font-semibold text-cx-ink">
                    <Timer
                      className={cx(
                        "h-4 w-4",
                        selected.sla.is_breached ? "text-cx-red" : selected.sla.is_nearing ? "text-cx-amber" : "text-cx-brand"
                      )}
                      aria-hidden
                    />
                    SLA: {selected.sla.label}
                  </span>
                  <span className="font-mono text-sm font-semibold text-cx-ink-2">
                    {selected.sla.days_elapsed} / {selected.sla.days_allocated} {selected.sla.day_type === "business_days" ? "work days" : "days"}
                  </span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-cx-line">
                  <div
                    className={cx(
                      "h-full rounded-full",
                      selected.sla.is_breached ? "bg-cx-red" : selected.sla.is_nearing ? "bg-cx-amber" : "bg-cx-brand"
                    )}
                    style={{ width: `${Math.min(100, selected.sla.percent_elapsed)}%` }}
                  />
                </div>
                <div className="mt-2 flex flex-wrap justify-between gap-2 text-[13px] text-cx-muted">
                  <span>
                    Target:{" "}
                    {selected.sla.target_deadline
                      ? new Date(selected.sla.target_deadline).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                      : "—"}
                  </span>
                  <span className="font-semibold text-cx-ink-2">{selected.sla.days_remaining}d remaining</span>
                </div>
              </div>
            )}

            <dl className="divide-y divide-cx-line rounded-cx-lg border border-cx-line px-4">
              <DetailRow
                label="State / LGA"
                value={
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-4 w-4 shrink-0 text-cx-muted" aria-hidden />
                    {selected.state_of_residence || "—"} / {selected.lga || "—"}
                  </span>
                }
              />
              <DetailRow
                label="Last updated"
                value={selected.updated_at ? new Date(selected.updated_at).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" }) : "—"}
              />
            </dl>

            {/* Delivery address (all services except fresh/renewal DL) */}
            {(selected.delivery_address || selected.applicant_details?.delivery_address) && (
              <div className="rounded-cx-lg bg-cx-sunken p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-[15px] font-semibold text-cx-ink">
                    <MapPin className="h-4 w-4 shrink-0 text-cx-brand" aria-hidden />
                    Delivery address
                  </span>
                  <Badge tone="brand">Physical dispatch</Badge>
                </div>
                <p className="mt-1.5 break-words text-sm text-cx-ink-2">
                  {selected.delivery_address || selected.applicant_details?.delivery_address}
                </p>
              </div>
            )}

            {/* Vehicle & plate details (vehicle services) */}
            {(selected.vehicle || selected.vehicle_type || selected.chassis_number || selected.make || selected.vehicle_body_type) && (
              <div className="rounded-cx-lg border border-cx-line p-4">
                <h3 className="flex items-center gap-1.5 text-[15px] font-semibold text-cx-ink">
                  <Car className="h-4 w-4 shrink-0 text-cx-muted" aria-hidden />
                  Vehicle & plate details
                </h3>
                <dl className="mt-3 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
                  {selected.vehicle_type && (
                    <div className="min-w-0">
                      <dt className="text-[13px] text-cx-muted">Vehicle type</dt>
                      <dd className="text-sm font-semibold text-cx-ink">{selected.vehicle_type}</dd>
                    </div>
                  )}
                  {selected.vehicle_body_type && (
                    <div className="min-w-0">
                      <dt className="text-[13px] text-cx-muted">Body type (SUV / Saloon)</dt>
                      <dd className="text-sm font-semibold text-cx-ink">{selected.vehicle_body_type}</dd>
                    </div>
                  )}
                  {(selected.make || selected.vehicle?.make) && (
                    <div className="min-w-0">
                      <dt className="text-[13px] text-cx-muted">Make & model</dt>
                      <dd className="text-sm font-semibold text-cx-ink">
                        {selected.make || selected.vehicle?.make} {selected.model || selected.vehicle?.model}
                      </dd>
                    </div>
                  )}
                  {(selected.colour || selected.vehicle?.colour) && (
                    <div className="min-w-0">
                      <dt className="text-[13px] text-cx-muted">Colour</dt>
                      <dd className="text-sm font-semibold capitalize text-cx-ink">{selected.colour || selected.vehicle?.colour}</dd>
                    </div>
                  )}
                  {(selected.year || selected.vehicle?.year) && (
                    <div className="min-w-0">
                      <dt className="text-[13px] text-cx-muted">Manufacturing year</dt>
                      <dd className="font-mono text-sm font-semibold text-cx-ink">{selected.year || selected.vehicle?.year}</dd>
                    </div>
                  )}
                  {(selected.chassis_number || selected.vehicle?.chassis_number) && (
                    <div className="min-w-0">
                      <dt className="text-[13px] text-cx-muted">Chassis / VIN</dt>
                      <dd className="break-all font-mono text-sm font-semibold text-cx-ink">{selected.chassis_number || selected.vehicle?.chassis_number}</dd>
                    </div>
                  )}
                  {selected.former_registration_number && (
                    <div className="min-w-0">
                      <dt className="text-[13px] text-cx-muted">Former reg no</dt>
                      <dd className="break-all font-mono text-sm font-semibold text-cx-ink">{selected.former_registration_number}</dd>
                    </div>
                  )}
                </dl>
              </div>
            )}

            {/* Assigned staff */}
            <section>
              <AssignedHeader title="Assigned staff" editing={editingStaff} onEdit={() => setEditingStaff(true)} />
              {editingStaff ? (
                <div className="space-y-3 rounded-cx-lg border border-cx-line bg-cx-sunken p-4">
                  <Field label="Staff member">
                    {(p) => (
                      <Select {...p} value={pendingStaffId} onChange={(e) => setPendingStaffId(e.target.value)}>
                        <option value="">— Unassigned —</option>
                        {staffOptions.map((s) => (
                          <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
                        ))}
                      </Select>
                    )}
                  </Field>
                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => setEditingStaff(false)} disabled={reassigning}>
                      Cancel
                    </Button>
                    <Button block loading={reassigning} onClick={handleSaveStaff}>
                      {reassigning ? "Saving…" : "Save"}
                    </Button>
                  </div>
                </div>
              ) : selected.assigned_staff ? (
                <div className="space-y-1.5 rounded-cx-lg bg-cx-brand-soft p-4">
                  <p className="flex items-center gap-1.5 text-[15px] font-semibold text-cx-ink">
                    <UserCheck className="h-4 w-4 text-cx-brand-deep" aria-hidden /> {selected.assigned_staff.name}
                  </p>
                  {selected.assigned_staff.email && (
                    <p className="flex items-center gap-1.5 break-all text-sm text-cx-ink-2">
                      <Mail className="h-4 w-4 shrink-0" aria-hidden /> {selected.assigned_staff.email}
                    </p>
                  )}
                  {selected.assigned_staff.phone && (
                    <p className="flex items-center gap-1.5 text-sm text-cx-ink-2">
                      <Phone className="h-4 w-4 shrink-0" aria-hidden /> {selected.assigned_staff.phone}
                    </p>
                  )}
                </div>
              ) : (
                <p className="rounded-cx-lg border border-dashed border-cx-line-strong p-4 text-sm text-cx-muted">Not yet claimed by a staff member.</p>
              )}
            </section>

            {/* Assigned agent */}
            <section>
              <AssignedHeader title="Assigned agent" editing={editingAgent} onEdit={() => setEditingAgent(true)} />
              {editingAgent ? (
                <div className="space-y-3 rounded-cx-lg border border-cx-line bg-cx-sunken p-4">
                  {reassignAgentError && (
                    <Notice
                      tone="red"
                      title="Assignment failed"
                      action={
                        <Button variant="ghost" size="sm" className="min-h-11" onClick={() => setReassignAgentError(null)}>
                          Dismiss
                        </Button>
                      }
                    >
                      {reassignAgentError}
                    </Notice>
                  )}

                  {loadingEligibleAgents ? (
                    <p className="flex items-center gap-2 py-1 text-sm text-cx-muted" role="status">
                      <Loader2 className="h-4 w-4 animate-spin text-cx-brand" aria-hidden />
                      Finding eligible agents for this application…
                    </p>
                  ) : eligibleChoices.length === 0 ? (
                    <Notice tone="amber" icon={AlertCircle}>
                      No eligible agents found capable of handling {(selected.application_type || "this service").replace(/_/g, " ")}.
                    </Notice>
                  ) : (
                    <Field label="Task-eligible agent">
                      {(p) => (
                        <Select
                          {...p}
                          value={pendingAgentId}
                          onChange={(e) => {
                            setPendingAgentId(e.target.value);
                            setReassignAgentError(null);
                          }}
                        >
                          <option value="">Select an agent…</option>
                          {eligibleChoices.map((a) => (
                            <option key={a.agent_id} value={a.agent_id}>
                              Agent #{a.agent_id} — {a.name} ({a.state || ""}{a.lga ? ` / ${a.lga}` : ""} • {a.vio_office}){a.matches_location ? " [Local Area]" : ""}
                            </option>
                          ))}
                        </Select>
                      )}
                    </Field>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setEditingAgent(false);
                        setReassignAgentError(null);
                        setPendingAgentId("");
                      }}
                      disabled={reassigning}
                    >
                      Cancel
                    </Button>
                    <Button block loading={reassigning} disabled={!pendingAgentId || loadingEligibleAgents} onClick={handleSaveAgent}>
                      {reassigning ? "Saving…" : "Save assignment"}
                    </Button>
                  </div>
                </div>
              ) : selected.assigned_agent ? (
                <div className="space-y-1.5 rounded-cx-lg border border-cx-line bg-cx-sunken p-4">
                  <p className="flex items-center gap-1.5 text-[15px] font-semibold text-cx-ink">
                    <Building2 className="h-4 w-4 text-cx-muted" aria-hidden /> {selected.assigned_agent.name}
                  </p>
                  <p className="text-sm text-cx-ink-2">{selected.assigned_agent.vio_office}</p>
                  {selected.assigned_agent.phone && (
                    <p className="flex items-center gap-1.5 text-sm text-cx-ink-2">
                      <Phone className="h-4 w-4 shrink-0" aria-hidden /> {selected.assigned_agent.phone}
                    </p>
                  )}
                </div>
              ) : (
                <p className="rounded-cx-lg border border-dashed border-cx-line-strong p-4 text-sm text-cx-muted">No agent assigned yet.</p>
              )}
            </section>
          </div>
        )}
      </Sheet>

      {/* Delete confirmation */}
      <ConfirmSheet
        open={deleteModal.open}
        onOpenChange={(open) => {
          if (!open) closeDeleteModal();
        }}
        title={deleteModal.items.length === 1 ? "Permanently delete application" : "Permanently delete applications"}
        description="This is an irreversible admin action."
        confirmLabel="Delete permanently"
        tone="danger"
        loading={deleteModal.deleting}
        onConfirm={handleConfirmDelete}
      >
        <div className="space-y-3 text-[15px] text-cx-ink-2">
          <p>
            {deleteModal.items.length === 1 ? (
              <>
                Are you sure you want to permanently delete application{" "}
                <strong className="font-mono text-cx-ink">#{deleteModal.items[0]?.id}</strong>
                {deleteModal.items[0]?.applicant_name || deleteModal.items[0]?.last_name
                  ? ` (${deleteModal.items[0]?.last_name || ""} ${deleteModal.items[0]?.first_name || ""})`
                  : ""}
                ?
              </>
            ) : (
              <>
                Are you sure you want to permanently delete{" "}
                <strong className="text-cx-ink">{deleteModal.items.length} selected applications</strong>?
              </>
            )}
          </p>
          <Notice tone="red" icon={AlertTriangle} title="What this removes">
            <ul className="mt-1 list-disc space-y-1 pl-4">
              <li>This action is <strong>permanent</strong> and cannot be undone.</li>
              <li>All uploaded files, customer slips, and verification images will be purged.</li>
              <li>Audit logs, payment records, and status histories will be removed.</li>
              <li>Assigned staff and field agents will immediately lose access.</li>
            </ul>
          </Notice>
        </div>
      </ConfirmSheet>
    </div>
  );
}
