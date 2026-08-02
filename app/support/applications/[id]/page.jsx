"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Mail,
  Phone,
  MapPin,
  UserCheck,
  Building2,
  Ban,
  Clock,
} from "lucide-react";
import { getSupportApplication } from "@/lib/api";

const STATUS_TONE = {
  submitted: "bg-sky-50 text-sky-700 ring-sky-200",
  staff_review: "bg-amber-50 text-amber-700 ring-amber-200",
  routed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  completed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  staff_rejected: "bg-red-50 text-red-700 ring-red-200",
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

export default function SupportApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getSupportApplication(params.id).then((res) => {
      if (res.error) setError(res.error);
      else setApp(res.data);
      setLoading(false);
    });
  }, [params.id]);

  if (loading) {
    return (
      <div className="p-16 text-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-[#28A745] mx-auto" />
        <p className="text-sm text-slate-500 font-medium">Loading application…</p>
      </div>
    );
  }

  if (error || !app) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-center gap-3">
        <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
        <span>{error || "Application not found."}</span>
      </div>
    );
  }

  const ad = app.applicant_details;

  return (
    <div className="space-y-6 pb-16">
      <button
        onClick={() => router.push("/support/applications")}
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to applications
      </button>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{ad.account_name}</h1>
            <p className="mt-0.5 font-mono text-[12px] text-slate-400">#{app.id}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
              {(app.application_type || "fresh").replace(/_/g, " ")}
            </span>
            <StatusBadge status={app.status} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Customer */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">Customer</h2>
          <p className="text-[14px] font-bold text-slate-900">{ad.account_name}</p>
          <div className="mt-2 space-y-1.5">
            <p className="flex items-center gap-1.5 text-[12.5px] text-slate-600"><Mail className="h-3.5 w-3.5" /> {ad.email}</p>
            <p className="flex items-center gap-1.5 text-[12.5px] text-slate-600"><Phone className="h-3.5 w-3.5" /> {ad.phone}</p>
            <p className="flex items-center gap-1.5 text-[12.5px] text-slate-600">
              <MapPin className="h-3.5 w-3.5" /> {ad.state_of_residence || "—"} / {ad.lga || "—"}
            </p>
          </div>
        </div>

        {/* Staff */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">Assigned staff</h2>
          {app.assigned_staff ? (
            <div className="space-y-1.5">
              <p className="flex items-center gap-1.5 text-[13.5px] font-bold text-slate-900">
                <UserCheck className="h-3.5 w-3.5 text-[#28A745]" /> {app.assigned_staff.name}
              </p>
              <p className="flex items-center gap-1.5 text-[12px] text-slate-600"><Mail className="h-3 w-3" /> {app.assigned_staff.email}</p>
              {app.assigned_staff.phone && (
                <p className="flex items-center gap-1.5 text-[12px] text-slate-600"><Phone className="h-3 w-3" /> {app.assigned_staff.phone}</p>
              )}
            </div>
          ) : (
            <p className="text-[12.5px] text-slate-400">Not yet claimed by a staff member.</p>
          )}
        </div>

        {/* Agent (redacted) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">Assigned agent</h2>
          {app.assigned_agent ? (
            <div className="space-y-1.5">
              <p className="flex items-center gap-1.5 text-[13.5px] font-bold text-slate-900">
                <Building2 className="h-3.5 w-3.5 text-slate-500" /> Agent #{app.assigned_agent.agent_id}
              </p>
              <p className="flex items-center gap-1.5 text-[12px] text-slate-600">
                <MapPin className="h-3 w-3" /> {app.assigned_agent.state} / {app.assigned_agent.lga}
              </p>
              <p className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-400">
                <Ban className="h-3 w-3" /> Contact details hidden — Support cannot message agents directly.
              </p>
            </div>
          ) : (
            <p className="text-[12.5px] text-slate-400">No agent assigned yet.</p>
          )}
        </div>
      </div>

      {/* Event timeline */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-[13px] font-semibold text-slate-700">History</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {app.events.length === 0 ? (
            <p className="p-5 text-[12.5px] text-slate-400">No events recorded yet.</p>
          ) : (
            app.events.map((ev) => (
              <div key={ev.id} className="flex items-start gap-3 px-5 py-3.5">
                <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-300" />
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] font-semibold text-slate-800 capitalize">
                    {(ev.new_status || "").replace(/_/g, " ")}
                  </p>
                  {ev.note && <p className="mt-0.5 text-[12px] text-slate-500">{ev.note}</p>}
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    {ev.created_at ? new Date(ev.created_at).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" }) : "—"}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
