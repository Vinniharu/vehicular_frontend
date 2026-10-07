"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, CheckSquare, Car, Clock } from "lucide-react";
import { getReferenceStates, getRwxBaysByState, staffGetRwxQueue } from "@/lib/api";
import { Badge, Button, EmptyState, Input, PageHeader, Select, SkeletonList } from "@/app/dashboard/_kit";
import { ResponsiveTable } from "@/app/admin/_kit";
import { statusMeta } from "@/app/staff/_components/status";

// Statuses offered in the filter (same set the queue has always offered).
const RWX_STATUSES = [
  "paid",
  "staff_review",
  "routed",
  "agent_accepted",
  "agent_completed",
  "staff_final_review",
  "awaiting_customer",
  "completed",
  "failed",
  "staff_rejected",
];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function StaffRwxQueuePage() {
  const router = useRouter();
  const [states, setStates] = useState([]);
  const [stateId, setStateId] = useState("");
  const [bays, setBays] = useState([]);
  const [bayId, setBayId] = useState("");
  const [bookingDate, setBookingDate] = useState(todayIso());
  const [statusFilter, setStatusFilter] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    getReferenceStates().then((res) => { if (res.data) setStates(res.data); });
  }, []);

  useEffect(() => {
    if (!stateId) {
      setBays([]);
      setBayId("");
      return;
    }
    getRwxBaysByState(stateId).then((res) => {
      setBays(res.data?.items || []);
      setBayId("");
    });
  }, [stateId]);

  const loadQueue = async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    const res = await staffGetRwxQueue({
      bay_id: bayId || undefined,
      booking_date: bookingDate || undefined,
      status_filter: statusFilter || undefined,
    });
    if (res.data?.items) setItems(res.data.items);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    loadQueue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bayId, bookingDate, statusFilter]);

  const columns = [
    {
      key: "customer",
      header: "Customer",
      primary: true,
      render: (item) => (
        <span>
          <span className="font-semibold text-cx-ink">{item.customer_name || "—"}</span>
          <span className="ml-1.5 font-normal text-cx-muted">#{item.id}</span>
        </span>
      ),
    },
    { key: "bay", header: "Bay", render: (item) => item.bay_name || "—" },
    {
      key: "slot",
      header: "Slot",
      render: (item) => (
        <span className="inline-flex items-center gap-1">
          <Clock className="h-4 w-4 shrink-0 text-cx-muted" aria-hidden />
          {item.slot_label || "—"}
        </span>
      ),
    },
    {
      key: "vehicle",
      header: "Vehicle",
      render: (item) => (
        <span className="inline-flex items-center gap-1">
          <Car className="h-4 w-4 shrink-0 text-cx-muted" aria-hidden />
          {item.make ? `${item.make} ${item.model || ""}` : "—"} {item.plate_number ? `· ${item.plate_number}` : ""}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (item) => {
        const meta = statusMeta(item.status);
        return <Badge tone={meta.tone}>{meta.label}</Badge>;
      },
    },
  ];

  return (
    <div>
      <PageHeader
        title="Bay day queue"
        description="Every Roadworthiness Express booking for a bay on a given day, whoever claimed it."
        actions={
          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            loading={refreshing}
            disabled={loading}
            onClick={() => loadQueue(true)}
            className="min-h-11"
          >
            Refresh
          </Button>
        }
      />

      <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Select value={stateId} onChange={(e) => setStateId(e.target.value)} aria-label="State">
          <option value="">Select state</option>
          {states.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>
        <Select value={bayId} onChange={(e) => setBayId(e.target.value)} disabled={!stateId} aria-label="Bay">
          <option value="">All bays</option>
          {bays.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </Select>
        <Input type="date" value={bookingDate} onChange={(e) => setBookingDate(e.target.value)} aria-label="Booking date" />
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Status">
          <option value="">All statuses</option>
          {RWX_STATUSES.map((s) => <option key={s} value={s}>{statusMeta(s).label}</option>)}
        </Select>
      </div>

      {loading ? (
        <SkeletonList rows={4} />
      ) : items.length === 0 ? (
        <EmptyState icon={CheckSquare} title="No bookings" description="Nothing is scheduled for this filter." />
      ) : (
        <ResponsiveTable
          columns={columns}
          rows={items}
          rowKey={(item) => item.id}
          onRowClick={(item) => router.push(`/staff/applications/${item.id}`)}
        />
      )}
    </div>
  );
}
