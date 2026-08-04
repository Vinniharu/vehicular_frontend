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
} from "lucide-react";
import { getSupportCustomer } from "@/lib/api";

const PAYMENT_STATUS_TONE = {
  success: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  pending: "bg-amber-50 text-amber-700 ring-amber-200",
  unpaid: "bg-slate-100 text-slate-500 ring-slate-200",
};

function PaymentStatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset capitalize ${PAYMENT_STATUS_TONE[status] || PAYMENT_STATUS_TONE.unpaid}`}>
      {status}
    </span>
  );
}

function formatNaira(kobo) {
  return `₦${((kobo || 0) / 100).toLocaleString("en-NG")}`;
}

export default function SupportCustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getSupportCustomer(params.id).then((res) => {
      if (res.error) setError(res.error);
      else setCustomer(res.data);
      setLoading(false);
    });
  }, [params.id]);

  if (loading) {
    return (
      <div className="p-16 text-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-[#28A745] mx-auto" />
        <p className="text-sm text-slate-500 font-medium">Loading customer…</p>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-center gap-3">
        <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
        <span>{error || "Customer not found."}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back
      </button>

      {customer.has_pending_payment && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
          <span>This customer has one or more applications with an outstanding balance.</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Profile */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">{customer.name}</h1>
              <p className="mt-0.5 font-mono text-[12px] text-slate-400">#{customer.id}</p>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${
                customer.is_active
                  ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                  : "bg-slate-100 text-slate-500 ring-slate-200"
              }`}
            >
              {customer.is_active ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
              {customer.is_active ? "Active" : "Deactivated"}
            </span>
          </div>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <p className="flex items-center gap-1.5 text-[12.5px] text-slate-600">
              <Mail className="h-3.5 w-3.5 text-slate-400" /> {customer.email}
            </p>
            {customer.phone && (
              <p className="flex items-center gap-1.5 text-[12.5px] text-slate-600">
                <Phone className="h-3.5 w-3.5 text-slate-400" /> {customer.phone}
              </p>
            )}
            <p className="flex items-center gap-1.5 text-[12.5px] text-slate-600">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              Joined {customer.created_at ? new Date(customer.created_at).toLocaleDateString("en-NG", { dateStyle: "medium" }) : "—"}
            </p>
          </div>
        </div>

        {/* Wallet */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-500">
            <Wallet className="h-3.5 w-3.5 text-[#28A745]" /> Wallet balance
          </h2>
          <p className="text-2xl font-bold text-slate-900">{formatNaira(customer.wallet_balance_kobo)}</p>
        </div>
      </div>

      {/* Applications */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-3.5">
          <FileText className="h-4 w-4 text-[#28A745]" />
          <h2 className="text-[13px] font-semibold text-slate-700">Applications ({customer.applications.length})</h2>
        </div>
        {customer.applications.length === 0 ? (
          <p className="p-5 text-[12.5px] text-slate-400">No applications submitted yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/60">
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">ID</th>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Type</th>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Status</th>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Payment</th>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">State / LGA</th>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Submitted</th>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customer.applications.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3.5 font-mono text-[12.5px] font-bold text-slate-900">
                      <Link href={`/support/applications/${a.id}`} className="hover:underline">#{a.id}</Link>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                        {(a.application_type || "fresh").replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 capitalize">
                        {(a.status || "").replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <PaymentStatusBadge status={a.payment_status} />
                      {a.remaining_kobo > 0 && (
                        <span className="ml-2 text-[11px] text-slate-400">{formatNaira(a.remaining_kobo)} due</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-[12.5px] text-slate-600">
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3 text-slate-400" />{a.state_of_residence} / {a.lga}</span>
                    </td>
                    <td className="px-4 py-3.5 text-[12px] text-slate-400">
                      {a.created_at ? new Date(a.created_at).toLocaleDateString("en-NG", { dateStyle: "medium" }) : "—"}
                    </td>
                    <td className="px-4 py-3.5">
                      <Link
                        href={`/support/applications/${a.id}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11.5px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <Eye className="h-3 w-3" /> Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payments */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-3.5">
          <Receipt className="h-4 w-4 text-[#28A745]" />
          <h2 className="text-[13px] font-semibold text-slate-700">Payments ({customer.payments.length})</h2>
        </div>
        {customer.payments.length === 0 ? (
          <p className="p-5 text-[12.5px] text-slate-400">No payments recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/60">
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Reference</th>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Application</th>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Amount</th>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Paid</th>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Status</th>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customer.payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3.5 font-mono text-[12px] text-slate-600">{p.reference}</td>
                    <td className="px-4 py-3.5">
                      <Link href={`/support/applications/${p.application_id}`} className="text-[12.5px] font-semibold text-slate-800 hover:underline">
                        #{p.application_id} · {(p.application_type || "").replace(/_/g, " ")}
                      </Link>
                    </td>
                    <td className="px-4 py-3.5 text-[12.5px] text-slate-700">{formatNaira(p.amount_kobo)}</td>
                    <td className="px-4 py-3.5 text-[12.5px] text-slate-700">{formatNaira(p.amount_paid_kobo)}</td>
                    <td className="px-4 py-3.5"><PaymentStatusBadge status={p.status} /></td>
                    <td className="px-4 py-3.5 text-[12px] text-slate-400">
                      {p.created_at ? new Date(p.created_at).toLocaleDateString("en-NG", { dateStyle: "medium" }) : "—"}
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
