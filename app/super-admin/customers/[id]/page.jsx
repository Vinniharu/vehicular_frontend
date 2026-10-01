"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  AlertTriangle,
  Mail,
  Phone,
  Calendar,
  Wallet,
  CheckCircle2,
  XCircle,
  MapPin,
  FileText,
  Receipt,
  Eye,
  Trash2,
  ShieldAlert,
  Clock,
  User,
  Car,
  X,
  RefreshCw,
  FileCheck,
} from "lucide-react";
import {
  superAdminGetCustomerOverview,
  getSupportApplication,
  koboToNaira,
} from "@/lib/api";

const PAYMENT_STATUS_STYLES = {
  success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  partial: "bg-blue-50 text-blue-700 border-blue-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  failed: "bg-rose-50 text-rose-700 border-rose-200",
  unpaid: "bg-slate-100 text-slate-500 border-slate-200",
};

function StatusBadge({ status }) {
  const norm = (status || "unpaid").toLowerCase();
  const cls = PAYMENT_STATUS_STYLES[norm] || "bg-slate-100 text-slate-600 border-slate-200";
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border capitalize ${cls}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {norm}
    </span>
  );
}

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

function ApplicationDetailModal({ appId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getSupportApplication(appId).then((res) => {
      if (!mounted) return;
      if (res.data) {
        setData(res.data);
      } else {
        setError(res.error || "Failed to load application details.");
      }
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, [appId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
          <div>
            <h3 className="text-[16px] font-bold text-slate-900">
              Application #{appId} Details
            </h3>
            <p className="text-[12px] text-slate-500 mt-0.5">
              Full application information and customer submission data
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <Loader2 className="h-6 w-6 animate-spin text-[#28A745] mx-auto" />
              <p className="text-[13px] text-slate-500">Loading full application details…</p>
            </div>
          ) : error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-[13px] text-rose-700 flex items-center gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          ) : data ? (
            <>
              {/* Status Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Application Type
                  </span>
                  <p className="text-[14px] font-bold text-slate-900 capitalize">
                    {(data.application_type || "").replace(/_/g, " ")}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Current Status
                  </span>
                  <StatusBadge status={data.status} />
                </div>
              </div>

              {/* Applicant Details */}
              <div>
                <h4 className="text-[12.5px] font-bold uppercase tracking-wide text-slate-700 mb-3 flex items-center gap-2">
                  <User className="h-4 w-4 text-[#28A745]" />
                  Applicant Identity
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white border border-slate-200 rounded-xl p-4 text-[13px]">
                  <div>
                    <span className="text-[11.5px] text-slate-400 block">Full Name</span>
                    <span className="font-semibold text-slate-800">
                      {data.applicant_details?.first_name || data.applicant_name || "—"}{" "}
                      {data.applicant_details?.middle_name || ""}{" "}
                      {data.applicant_details?.last_name || ""}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11.5px] text-slate-400 block">Email</span>
                    <span className="font-medium text-slate-800">
                      {data.applicant_details?.applicant_email || data.applicant_email || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11.5px] text-slate-400 block">Phone</span>
                    <span className="font-mono text-slate-800">
                      {data.applicant_details?.applicant_phone || data.applicant_phone || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11.5px] text-slate-400 block">NIN</span>
                    <span className="font-mono text-slate-800">
                      {data.applicant_details?.nin || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11.5px] text-slate-400 block">Location</span>
                    <span className="text-slate-800">
                      {data.state_of_residence || "—"}{data.lga ? ` / ${data.lga}` : ""}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11.5px] text-slate-400 block">Submitted On</span>
                    <span className="text-slate-800">
                      {formatDate(data.created_at)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Documents */}
              {data.documents && data.documents.length > 0 && (
                <div>
                  <h4 className="text-[12.5px] font-bold uppercase tracking-wide text-slate-700 mb-3 flex items-center gap-2">
                    <FileCheck className="h-4 w-4 text-[#28A745]" />
                    Uploaded Documents ({data.documents.length})
                  </h4>
                  <div className="space-y-2">
                    {data.documents.map((doc) => (
                      <div
                        key={doc.id || doc.document_type}
                        className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50/50 text-[12.5px]"
                      >
                        <div>
                          <p className="font-semibold text-slate-800 capitalize">
                            {(doc.document_type || "").replace(/_/g, " ")}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            Uploaded {formatDate(doc.created_at)}
                          </p>
                        </div>
                        {doc.file_url && (
                          <a
                            href={doc.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium text-[#28A745] hover:bg-[#28A745]/10 transition-colors"
                          >
                            <Eye className="h-3 w-3" /> View
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Status Events Timeline */}
              {data.events && data.events.length > 0 && (
                <div>
                  <h4 className="text-[12.5px] font-bold uppercase tracking-wide text-slate-700 mb-3 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-slate-500" />
                    Timeline & History
                  </h4>
                  <div className="space-y-2 border-l-2 border-slate-200 pl-4 ml-2">
                    {data.events.map((ev, i) => (
                      <div key={ev.id || i} className="relative pb-2">
                        <div className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-[#28A745]" />
                        <p className="text-[12.5px] font-semibold text-slate-800 capitalize">
                          {(ev.status || "").replace(/_/g, " ")}
                        </p>
                        {ev.note && <p className="text-[11.5px] text-slate-500">{ev.note}</p>}
                        <p className="text-[11px] text-slate-400 mt-0.5">{formatDate(ev.created_at)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-slate-100 px-6 py-3 bg-slate-50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-[12.5px] font-semibold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SuperAdminCustomerOverviewPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("applications"); // "applications" | "payments" | "deletion_logs"
  const [selectedAppId, setSelectedAppId] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await superAdminGetCustomerOverview(customerId);
      if (res.data) {
        setData(res.data);
      } else {
        setError(res.error || "Failed to load customer profile.");
      }
    } catch (err) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId]);

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-[#28A745] mx-auto" />
        <p className="text-[13.5px] text-slate-500 font-medium">Loading customer profile…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => router.push("/super-admin/customers")}
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Customers
        </button>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-[13.5px] text-red-700 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
          <span>{error || "Customer not found."}</span>
        </div>
      </div>
    );
  }

  const applications = data.applications || [];
  const payments = data.payments || [];
  const deletionLogs = data.deletion_logs || [];

  return (
    <div className="space-y-6 pb-20">
      {/* Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => router.push("/super-admin/customers")}
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Customers
        </button>

        <button
          onClick={loadData}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-xs"
        >
          <RefreshCw className="h-3.5 w-3.5 text-slate-500" /> Refresh Data
        </button>
      </div>

      {/* Outstanding Balance Warning */}
      {data.has_pending_payment && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-[13px] text-amber-800 flex items-center gap-3">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
          <span>This customer has one or more applications with an unpaid or partial balance.</span>
        </div>
      )}

      {/* Customer Profile Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">{data.name}</h1>
              <p className="mt-0.5 font-mono text-[12px] text-slate-400">Customer ID #{data.id}</p>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold border ${
                data.is_active
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-slate-100 text-slate-500 border-slate-200"
              }`}
            >
              {data.is_active ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
              {data.is_active ? "Active Account" : "Inactive Account"}
            </span>
          </div>

          <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <p className="flex items-center gap-1.5 text-[12.5px] text-slate-600">
              <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" /> {data.email}
            </p>
            {data.phone && (
              <p className="flex items-center gap-1.5 text-[12.5px] text-slate-600 font-mono">
                <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" /> {data.phone}
              </p>
            )}
            <p className="flex items-center gap-1.5 text-[12.5px] text-slate-600">
              <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              Joined {data.created_at ? new Date(data.created_at).toLocaleDateString("en-NG", { dateStyle: "medium" }) : "—"}
            </p>
          </div>
        </div>

        {/* Wallet Balance Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between">
          <h2 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-500">
            <Wallet className="h-3.5 w-3.5 text-[#28A745]" /> Wallet Balance
          </h2>
          <div>
            <p className="text-2xl font-bold text-slate-900 mt-2">
              {koboToNaira(data.wallet_balance_kobo || 0)}
            </p>
            <p className="text-[11.5px] text-slate-400 mt-1">Available customer funds</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-1">
        <button
          type="button"
          onClick={() => setActiveTab("applications")}
          className={`flex items-center gap-2 px-4 py-3 text-[13px] font-semibold border-b-2 transition-all ${
            activeTab === "applications"
              ? "border-[#28A745] text-[#28A745]"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <FileText className="h-4 w-4" />
          Applications ({applications.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("payments")}
          className={`flex items-center gap-2 px-4 py-3 text-[13px] font-semibold border-b-2 transition-all ${
            activeTab === "payments"
              ? "border-[#28A745] text-[#28A745]"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <Receipt className="h-4 w-4" />
          Payments ({payments.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("deletion_logs")}
          className={`flex items-center gap-2 px-4 py-3 text-[13px] font-semibold border-b-2 transition-all ${
            activeTab === "deletion_logs"
              ? "border-rose-500 text-rose-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <Trash2 className="h-4 w-4" />
          Deletion Audit Log ({deletionLogs.length})
        </button>
      </div>

      {/* TAB CONTENT: APPLICATIONS */}
      {activeTab === "applications" && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
            <h2 className="text-[13px] font-semibold text-slate-700">
              Active & Historic Customer Applications ({applications.length})
            </h2>
          </div>
          {applications.length === 0 ? (
            <div className="py-16 text-center text-[13px] text-slate-400">
              No applications submitted under this account.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/60">
                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">ID</th>
                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Applicant</th>
                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Type</th>
                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Application Status</th>
                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Payment</th>
                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">State / LGA</th>
                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Date</th>
                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {applications.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3.5 font-mono text-[12.5px] font-bold text-slate-900">
                        #{app.id}
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-[12.5px] font-semibold text-slate-800">{app.applicant_name || data.name}</p>
                        <p className="text-[11px] text-slate-400">{app.applicant_email || data.email}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                          {(app.application_type || "").replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={app.status} />
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={app.payment_status} />
                        {app.remaining_kobo > 0 && (
                          <span className="ml-2 text-[11px] text-slate-400 font-mono">
                            {koboToNaira(app.remaining_kobo)} due
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-[12.5px] text-slate-600">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                          {app.state_of_residence || "—"}{app.lga ? ` / ${app.lga}` : ""}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-[12px] text-slate-400 font-mono">
                        {formatDate(app.created_at)}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedAppId(app.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11.5px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
                        >
                          <Eye className="h-3 w-3" /> Full Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: PAYMENTS */}
      {activeTab === "payments" && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
            <h2 className="text-[13px] font-semibold text-slate-700">
              Customer Payment Records ({payments.length})
            </h2>
          </div>
          {payments.length === 0 ? (
            <div className="py-16 text-center text-[13px] text-slate-400">
              No payments recorded for this customer account.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/60">
                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Reference</th>
                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Application</th>
                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Amount</th>
                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Amount Paid</th>
                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Status</th>
                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3.5 font-mono text-[12px] text-slate-600">{p.reference}</td>
                      <td className="px-4 py-3.5">
                        <span className="text-[12.5px] font-semibold text-slate-800">
                          #{p.application_id} · {(p.application_type || p.service_type || "").replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-[12.5px] font-medium text-slate-700">{koboToNaira(p.amount_kobo)}</td>
                      <td className="px-4 py-3.5 text-[12.5px] font-bold text-slate-900">{koboToNaira(p.amount_paid_kobo)}</td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={p.status} />
                      </td>
                      <td className="px-4 py-3.5 text-[12px] text-slate-400 font-mono">
                        {formatDate(p.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: DELETION AUDIT LOG */}
      {activeTab === "deletion_logs" && (
        <div className="rounded-2xl border border-rose-100 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-rose-100 bg-rose-50/40 px-5 py-3.5">
            <div>
              <h2 className="text-[13px] font-semibold text-rose-900 flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-rose-600" />
                Application Deletion Audit Log
              </h2>
              <p className="text-[11.5px] text-slate-500 mt-0.5">
                Audit trail recorded whenever an application belonging to this customer is permanently deleted.
              </p>
            </div>
          </div>
          {deletionLogs.length === 0 ? (
            <div className="py-16 text-center text-[13px] text-slate-400">
              No deleted applications recorded for this customer.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/60">
                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">App ID</th>
                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Service Type</th>
                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Status At Deletion</th>
                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Amount / Paid</th>
                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Deleted By</th>
                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Deletion Reason</th>
                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {deletionLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-rose-50/30 transition-colors">
                      <td className="px-4 py-3.5 font-mono text-[12.5px] font-bold text-rose-700">
                        #{log.application_id}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-700">
                          {(log.application_type || "").replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 capitalize">
                          {log.status_at_deletion}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-[12px] text-slate-700 font-mono">
                        {log.amount_kobo != null ? koboToNaira(log.amount_kobo) : "—"}
                        {log.amount_paid_kobo != null && log.amount_paid_kobo > 0 && (
                          <span className="text-[11px] text-emerald-600 block">
                            Paid: {koboToNaira(log.amount_paid_kobo)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-[12.5px] font-semibold text-slate-900 block">
                          {log.deleted_by_name || "System"}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono capitalize">
                          {log.deleted_by_role || "admin"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-[12px] text-slate-600 italic">
                        {log.reason || "Administrative deletion"}
                      </td>
                      <td className="px-4 py-3.5 text-[12px] text-slate-400 font-mono">
                        {formatDate(log.deleted_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal for viewing complete application details */}
      {selectedAppId && (
        <ApplicationDetailModal
          appId={selectedAppId}
          onClose={() => setSelectedAppId(null)}
        />
      )}
    </div>
  );
}
