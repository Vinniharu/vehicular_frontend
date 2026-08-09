"use client";

import { useState, useEffect } from "react";
import {
  Briefcase,
  MapPin,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  RefreshCw,
  Inbox,
  TrendingUp,
  Upload,
  Eye,
  Image as ImageIcon,
} from "lucide-react";
import {
  getAgentParticularsOffers,
  getAgentParticularsItems,
  acceptParticularsOffer,
  declineParticularsOffer,
  uploadParticularsItemFinal,
  uploadApplicationFile,
  koboToNaira,
  resolveMediaUrl,
} from "@/lib/api";
import DocumentPreviewModal from "@/app/components/design/DocumentPreviewModal";

const BRAND = "#28A745";

const DOCUMENT_TYPE_LABELS = {
  vehicle_licence: "Vehicle Licence",
  road_worthiness: "Road Worthiness Certificate",
  proof_of_ownership: "Proof of Ownership",
  insurance_third_party: "Third-Party Insurance",
  hackney_permit: "Hackney Permit",
};

const ITEM_STATUS_META = {
  agent_accepted: { label: "Awaiting your upload", tone: "text-amber-700 bg-amber-50 ring-amber-200" },
  agent_completed: { label: "Under staff review", tone: "text-sky-700 bg-sky-50 ring-sky-200" },
  rejected: { label: "Sent back to you — re-upload", tone: "text-red-700 bg-red-50 ring-red-200" },
  approved: { label: "Approved", tone: "text-emerald-700 bg-emerald-50 ring-emerald-200" },
};

const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-50";
const btnSecondary =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 transition-all disabled:opacity-50";

export default function AgentParticularsJobsPage() {
  const [offers, setOffers] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [actingId, setActingId] = useState(null);
  const [previewDocUrl, setPreviewDocUrl] = useState(null);

  const [uploadingItemId, setUploadingItemId] = useState(null);
  const [uploadFileNames, setUploadFileNames] = useState({});

  const loadData = async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    const [offersRes, itemsRes] = await Promise.all([getAgentParticularsOffers(), getAgentParticularsItems()]);
    if (offersRes.error) setError(offersRes.error);
    else if (Array.isArray(offersRes.data)) setOffers(offersRes.data);
    if (Array.isArray(itemsRes.data)) setItems(itemsRes.data);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAccept = async (offer) => {
    setActingId(offer.id);
    setNotice(null);
    const res = await acceptParticularsOffer(offer.id);
    setActingId(null);
    if (res.error) {
      setNotice({ type: "error", message: res.error });
    } else {
      setNotice({ type: "success", message: `Offer accepted — ${DOCUMENT_TYPE_LABELS[offer.document_type] || offer.document_type} is now yours.` });
      await loadData(true);
    }
  };

  const handleDecline = async (offer) => {
    setActingId(offer.id);
    setNotice(null);
    const res = await declineParticularsOffer(offer.id);
    setActingId(null);
    if (res.error) {
      setNotice({ type: "error", message: res.error });
    } else {
      setNotice({ type: "success", message: "Offer declined." });
      await loadData(true);
    }
  };

  const handleUploadFinal = async (item, file) => {
    if (!file) return;
    setUploadingItemId(item.id);
    setNotice(null);
    setUploadFileNames((prev) => ({ ...prev, [item.id]: file.name }));
    const { data, error: uploadError } = await uploadApplicationFile(file);
    if (uploadError || !data?.file_url) {
      setUploadingItemId(null);
      setNotice({ type: "error", message: uploadError || "Upload failed. Please try again." });
      return;
    }
    const res = await uploadParticularsItemFinal(item.id, { file_url: data.file_url });
    setUploadingItemId(null);
    if (res.error) {
      setNotice({ type: "error", message: res.error });
      return;
    }
    setNotice({ type: "success", message: `Finished document uploaded for ${DOCUMENT_TYPE_LABELS[item.document_type] || item.document_type} — awaiting staff review.` });
    await loadData(true);
  };

  const activeItems = items.filter((i) => ["agent_accepted", "agent_completed", "rejected"].includes(i.status));
  const completedItems = items.filter((i) => i.status === "approved");

  return (
    <div className="space-y-5 pb-16">
      <DocumentPreviewModal isOpen={!!previewDocUrl} onClose={() => setPreviewDocUrl(null)} fileUrl={previewDocUrl} />

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-emerald-800 mb-2">
              <Briefcase className="h-3.5 w-3.5 text-[#28A745]" />
              Particulars Jobs
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Vehicle particulars document offers</h1>
            <p className="mt-1 text-sm text-slate-600 max-w-2xl">
              Each offer here is a single document from a customer's renewal bundle — not a whole
              application. Accepting one doesn't affect any other document in the same bundle, even
              if it went to a different agent.
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

      {notice && (
        <div className={`flex items-center gap-2.5 rounded-xl p-3.5 text-[13px] ${notice.type === "error" ? "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200" : "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200 font-medium"}`}>
          {notice.type === "error" ? <AlertCircle className="h-4 w-4 shrink-0" /> : <CheckCircle2 className="h-4 w-4 shrink-0" />}
          {notice.message}
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Open offers */}
      <section className="space-y-3.5">
        <h2 className="text-[13px] font-bold uppercase tracking-wide text-slate-500">Open offers ({loading ? "—" : offers.length})</h2>
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center space-y-3 shadow-sm">
            <Loader2 className="h-8 w-8 animate-spin text-[#28A745] mx-auto" />
            <p className="text-sm text-slate-500 font-medium">Loading offers…</p>
          </div>
        ) : offers.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center space-y-2 shadow-sm">
            <Inbox className="h-9 w-9 text-slate-300 mx-auto" />
            <h3 className="text-[15px] font-bold text-slate-900">No offers right now</h3>
            <p className="text-[13px] text-slate-500 max-w-sm mx-auto">
              New documents released to your state will show up here.
            </p>
          </div>
        ) : (
          offers.map((offer) => (
            <div
              key={offer.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="font-mono font-bold text-sm text-slate-900">{offer.application_id}</span>
                  <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                    {DOCUMENT_TYPE_LABELS[offer.document_type] || offer.document_type}
                  </span>
                </div>
                <p className="flex items-center gap-1.5 text-[13px] text-slate-500">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  {offer.state || "—"}
                </p>
                {offer.agent_compensation_kobo > 0 && (
                  <p className="flex items-center gap-1.5 text-[13px] font-bold" style={{ color: BRAND }}>
                    <TrendingUp className="h-3.5 w-3.5" />
                    Earn {koboToNaira(offer.agent_compensation_kobo)}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                <button type="button" onClick={() => handleDecline(offer)} disabled={actingId === offer.id} className={btnSecondary}>
                  {actingId === offer.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                  Decline
                </button>
                <button type="button" onClick={() => handleAccept(offer)} disabled={actingId === offer.id} className={btnPrimary} style={{ background: BRAND }}>
                  {actingId === offer.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                  Accept
                </button>
              </div>
            </div>
          ))
        )}
      </section>

      {/* Your active items */}
      <section className="space-y-3.5">
        <h2 className="text-[13px] font-bold uppercase tracking-wide text-slate-500">Your documents ({loading ? "—" : activeItems.length})</h2>
        {!loading && activeItems.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center space-y-2 shadow-sm">
            <ImageIcon className="h-9 w-9 text-slate-300 mx-auto" />
            <h3 className="text-[15px] font-bold text-slate-900">Nothing accepted yet</h3>
            <p className="text-[13px] text-slate-500 max-w-sm mx-auto">Accept an offer above to see it here.</p>
          </div>
        ) : (
          activeItems.map((item) => {
            const meta = ITEM_STATUS_META[item.status] || { label: item.status, tone: "text-slate-600 bg-slate-100 ring-slate-200" };
            return (
              <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-mono font-bold text-sm text-slate-900">{item.application_id}</span>
                    <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                      {DOCUMENT_TYPE_LABELS[item.document_type] || item.document_type}
                    </span>
                  </div>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset ${meta.tone}`}>
                    {meta.label}
                  </span>
                </div>

                {item.status === "rejected" && item.final_review_note && (
                  <p className="mt-2.5 rounded-lg bg-red-50 p-3 text-[12.5px] text-red-700 ring-1 ring-inset ring-red-200">
                    <strong>Staff feedback:</strong> {item.final_review_note}
                  </p>
                )}

                {item.final_document_url && (
                  <button
                    onClick={(e) => { e.preventDefault(); setPreviewDocUrl(resolveMediaUrl(item.final_document_url)); }}
                    className={`${btnSecondary} mt-3`}
                    style={{ padding: "0.4rem 0.75rem" }}
                  >
                    <Eye className="h-3.5 w-3.5" /> View uploaded document
                  </button>
                )}

                {(item.status === "agent_accepted" || item.status === "rejected") && (
                  <label className="mt-3.5 flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-3.5 transition-all hover:border-[#28A745]">
                    {uploadingItemId === item.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" style={{ color: BRAND }} />
                    ) : (
                      <Upload className="h-4 w-4" style={{ color: BRAND }} />
                    )}
                    <span className="text-[12.5px] font-semibold text-slate-700">
                      {uploadingItemId === item.id
                        ? "Uploading…"
                        : item.status === "rejected"
                        ? "Re-upload finished document"
                        : "Upload finished document"}
                    </span>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      disabled={uploadingItemId === item.id}
                      onChange={(e) => handleUploadFinal(item, e.target.files?.[0])}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            );
          })
        )}
      </section>

      {/* Completed */}
      {completedItems.length > 0 && (
        <section className="space-y-3.5">
          <h2 className="text-[13px] font-bold uppercase tracking-wide text-slate-500">Completed ({completedItems.length})</h2>
          <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white">
            {completedItems.map((item) => (
              <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="font-mono font-bold text-sm text-slate-900">{item.application_id}</span>
                  <span className="text-[13px] font-semibold text-slate-700">{DOCUMENT_TYPE_LABELS[item.document_type] || item.document_type}</span>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 ring-1 ring-inset ring-emerald-200">
                  <CheckCircle2 className="h-3 w-3" /> Approved
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
