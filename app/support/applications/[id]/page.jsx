"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
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
  Pencil,
  X,
  CheckCircle2,
  FileText,
  ExternalLink,
} from "lucide-react";
import { getSupportApplication, getSupportAgentChat, sendSupportAgentChatMessage, editSupportApplication, resolveMediaUrl } from "@/lib/api";
import AgentChatPanel from "@/app/components/design/AgentChatPanel";
import DateOfBirthInput from "@/app/dashboard/_shared/DateOfBirthInput";
import DocumentPreviewModal from "@/app/components/design/DocumentPreviewModal";

const inputBase = "w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-[13.5px] text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-[#28A745] focus:bg-white focus:ring-2 focus:ring-[#28A745]/15";
const fieldLabel = "block text-[12px] font-semibold text-slate-600 mb-1.5";

const EDIT_FIELDS = [
  { key: "first_name", label: "First name" },
  { key: "middle_name", label: "Middle name" },
  { key: "last_name", label: "Last name" },
  { key: "gender", label: "Gender" },
  { key: "nationality", label: "Nationality" },
  { key: "marital_status", label: "Marital status" },
  { key: "nin", label: "NIN" },
  { key: "residential_address", label: "Residential address" },
  { key: "next_of_kin_name", label: "Next of kin name" },
  { key: "next_of_kin_relationship", label: "Next of kin relationship" },
  { key: "next_of_kin_phone", label: "Next of kin phone" },
];

function EditApplicationModal({ application, onClose, onSaved }) {
  const ad = application.applicant_details;
  const [form, setForm] = useState(() => {
    const initial = { date_of_birth: ad.date_of_birth || "" };
    for (const f of EDIT_FIELDS) initial[f.key] = ad[f.key] || "";
    return initial;
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    // Only send fields that actually changed from what's currently stored —
    // matches the backend's patch-style "exclude_unset" semantics rather
    // than resending every field on every save.
    const payload = {};
    if (form.date_of_birth !== (ad.date_of_birth || "")) payload.date_of_birth = form.date_of_birth;
    for (const f of EDIT_FIELDS) {
      if (form[f.key] !== (ad[f.key] || "")) payload[f.key] = form[f.key];
    }
    const res = await editSupportApplication(`app_${application.id}`, payload);
    setSaving(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    onSaved(res.data);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-[15px] font-bold text-slate-900">Edit application details</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          {error && (
            <div className="flex items-start gap-2.5 rounded-xl bg-red-50 p-3.5 text-[12.5px] text-red-700 ring-1 ring-inset ring-red-200">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" /> {error}
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={fieldLabel}>First name</label>
              <input className={inputBase} value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
            </div>
            <div>
              <label className={fieldLabel}>Middle name</label>
              <input className={inputBase} value={form.middle_name} onChange={(e) => setForm({ ...form, middle_name: e.target.value })} />
            </div>
            <div>
              <label className={fieldLabel}>Last name</label>
              <input className={inputBase} value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
            </div>
          </div>

          <div>
            <label className={fieldLabel}>Date of birth</label>
            <DateOfBirthInput value={form.date_of_birth} onChange={(iso) => setForm({ ...form, date_of_birth: iso })} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={fieldLabel}>Gender</label>
              <input className={inputBase} value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} />
            </div>
            <div>
              <label className={fieldLabel}>Nationality</label>
              <input className={inputBase} value={form.nationality} onChange={(e) => setForm({ ...form, nationality: e.target.value })} />
            </div>
            <div>
              <label className={fieldLabel}>Marital status</label>
              <input className={inputBase} value={form.marital_status} onChange={(e) => setForm({ ...form, marital_status: e.target.value })} />
            </div>
          </div>

          <div>
            <label className={fieldLabel}>NIN</label>
            <input className={inputBase} value={form.nin} onChange={(e) => setForm({ ...form, nin: e.target.value })} />
          </div>

          <div>
            <label className={fieldLabel}>Residential address</label>
            <input className={inputBase} value={form.residential_address} onChange={(e) => setForm({ ...form, residential_address: e.target.value })} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={fieldLabel}>Next of kin name</label>
              <input className={inputBase} value={form.next_of_kin_name} onChange={(e) => setForm({ ...form, next_of_kin_name: e.target.value })} />
            </div>
            <div>
              <label className={fieldLabel}>Relationship</label>
              <input className={inputBase} value={form.next_of_kin_relationship} onChange={(e) => setForm({ ...form, next_of_kin_relationship: e.target.value })} />
            </div>
            <div>
              <label className={fieldLabel}>Next of kin phone</label>
              <input className={inputBase} value={form.next_of_kin_phone} onChange={(e) => setForm({ ...form, next_of_kin_phone: e.target.value })} />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
            <button type="button" onClick={onClose} className="text-[13px] font-semibold text-slate-500 hover:text-slate-700">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-[13px] font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-60"
              style={{ background: "#28A745" }}
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

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

  const [showEditModal, setShowEditModal] = useState(false);
  const [notice, setNotice] = useState(null);
  const [previewDocUrl, setPreviewDocUrl] = useState(null);

  useEffect(() => {
    getSupportApplication(params.id).then((res) => {
      if (res.error) setError(res.error);
      else setApp(res.data);
      setLoading(false);
    });
  }, [params.id]);

  const loadThread = useCallback(() => getSupportAgentChat(params.id), [params.id]);
  const sendMessage = useCallback((body) => sendSupportAgentChatMessage(params.id, { body }), [params.id]);

  const handleSaved = (updatedApp) => {
    setApp(updatedApp);
    setShowEditModal(false);
    setNotice("Application details updated.");
    setTimeout(() => setNotice(null), 4000);
  };

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
      <DocumentPreviewModal
        isOpen={!!previewDocUrl}
        onClose={() => setPreviewDocUrl(null)}
        fileUrl={previewDocUrl}
      />

      <button
        onClick={() => router.push("/support/applications")}
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to applications
      </button>

      {notice && (
        <div className="flex items-center gap-2.5 rounded-xl bg-emerald-50 p-3.5 text-[13px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
          <CheckCircle2 className="h-4 w-4 shrink-0" /> {notice}
        </div>
      )}

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
            {!app.driving_school_enrolled_at && (
              <button
                onClick={() => setShowEditModal(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-[12px] font-semibold text-slate-600 hover:bg-slate-50"
              >
                <Pencil className="h-3.5 w-3.5" /> Edit details
              </button>
            )}
          </div>
        </div>
        {app.driving_school_enrolled_at && (
          <p className="mt-3 text-[12px] text-slate-400">
            This application has been enrolled in driving school and can no longer be edited by support.
          </p>
        )}
      </div>

      {showEditModal && (
        <EditApplicationModal application={app} onClose={() => setShowEditModal(false)} onSaved={handleSaved} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Customer */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">Customer</h2>
          <Link href={`/support/customers/${ad.user_id}`} className="text-[14px] font-bold text-slate-900 hover:underline">
            {ad.account_name}
          </Link>
          <div className="mt-2 space-y-1.5">
            <p className="flex items-center gap-1.5 text-[12.5px] text-slate-600"><Mail className="h-3.5 w-3.5" /> {ad.email}</p>
            <p className="flex items-center gap-1.5 text-[12.5px] text-slate-600"><Phone className="h-3.5 w-3.5" /> {ad.phone || "—"}</p>
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
                <Ban className="h-3 w-3" /> Contact details hidden — chat below instead of exchanging numbers/emails.
              </p>
            </div>
          ) : (
            <p className="text-[12.5px] text-slate-400">No agent assigned yet.</p>
          )}
        </div>
      </div>

      {/* Documents — view-only, no approve/reject (that stays a staff action) */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-[13px] font-semibold text-slate-700">Documents ({app.documents?.length || 0})</h2>
        </div>
        {!app.documents || app.documents.length === 0 ? (
          <p className="p-5 text-[12.5px] text-slate-400">Nothing uploaded on this file yet.</p>
        ) : (
          <div className="divide-y divide-slate-100 p-2">
            {app.documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between gap-4 p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                    <FileText className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <p className="text-[13.5px] font-bold capitalize text-slate-900">
                      {doc.doc_type?.replace(/_/g, " ")}
                    </p>
                    <p className="text-[11.5px] text-slate-400">
                      {doc.uploaded_at && new Date(doc.uploaded_at).toLocaleString()}
                      {doc.status && doc.status !== "pending" && (
                        <span className={`ml-2 font-semibold ${doc.status === "approved" ? "text-emerald-600" : "text-red-500"}`}>
                          · {doc.status}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                {doc.file_url && (
                  <button
                    onClick={(e) => { e.preventDefault(); setPreviewDocUrl(resolveMediaUrl(doc.file_url)); }}
                    className="inline-flex shrink-0 items-center gap-1.5 text-[12px] font-semibold text-slate-500 hover:text-slate-700"
                  >
                    Preview <ExternalLink className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Agent chat — no attachments, contact-info blocked both ways */}
      <AgentChatPanel
        myRole="support"
        headerLabel="Chat with assigned agent"
        loadThread={loadThread}
        sendMessage={sendMessage}
      />

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
