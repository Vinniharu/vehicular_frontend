"use client";

import { useState, useEffect, useMemo } from "react";
import { FileCheck2, Clock, ExternalLink } from "lucide-react";
import { getMyApplications, resolveMediaUrl } from "@/lib/api";
import { formatDate, koboToNaira, freshnessMeta } from "@/app/dashboard/_shared/apply-helpers";
import { CategoryChip } from "@/app/dashboard/_shared/ServicesList";
import { TONE_CLASSES } from "@/app/dashboard/_shared/status-config";
import DocumentPreviewModal from "@/app/components/design/DocumentPreviewModal";
import { colors } from "@/lib/design-tokens";

const BRAND = colors.primary.DEFAULT;
const PAPER_BORDER = colors.paper.border;

const PARTICULARS_LABELS = {
  vehicle_licence: "Vehicle Licence",
  road_worthiness: "Road Worthiness Certificate",
  proof_of_ownership: "Proof of Ownership",
  insurance_third_party: "Third-Party Insurance",
  hackney_permit: "Hackney Permit",
};

const LICENCE_TYPE_META = {
  fresh: { category: "Driver's Licence", label: "Driver's Licence" },
  renewal: { category: "Driver's Licence", label: "Driver's Licence (Renewal)" },
  reissue: { category: "Driver's Licence", label: "Driver's Licence (Reissue)" },
  tinted_permit: { category: "Tinted Permit", label: "Tinted Permit" },
  international_permit: { category: "International Permit", label: "International Driving Permit" },
  number_plate_new: { category: "Number Plate", label: "Number Plate (New)" },
  number_plate_replacement: { category: "Number Plate", label: "Number Plate (Replacement)" },
  number_plate_change_of_ownership: { category: "Number Plate", label: "Number Plate (Change of Ownership)" },
  number_plate_fancy: { category: "Number Plate", label: "Number Plate (Fancy)" },
};

const CATEGORIES = ["Driver's Licence", "Tinted Permit", "International Permit", "Vehicle Particulars", "Number Plate"];

// Flattens every application into one "document row" per completed/approved
// document. vehicle_particulars is item-shaped (a bundle of independently
// approved documents); every other type carries a single permanent_licence.
// Temporary licences are deliberately excluded — a superseded interim
// credential once the permanent card lands, out of place on a page meant to
// show a customer's *current* documents.
function flattenDocuments(applications) {
  const rows = [];
  for (const app of applications) {
    if (app.application_type === "vehicle_particulars") {
      for (const item of app.items || []) {
        if (item.status !== "approved") continue;
        const finalDoc = (app.documents || []).find((d) => d.doc_type === `${item.document_type}_final`);
        rows.push({
          id: `particulars-${item.id}`,
          category: "Vehicle Particulars",
          label: PARTICULARS_LABELS[item.document_type] || item.document_type,
          applicationId: app.id,
          expiryDate: item.expiry_date,
          priceKobo: item.price_kobo ?? null,
          documentUrl: finalDoc?.file_url || null,
          sortDate: item.updated_at || item.created_at || app.created_at,
        });
      }
      continue;
    }

    const meta = LICENCE_TYPE_META[app.application_type];
    if (!meta) continue;
    const licence = app.permanent_licence;
    if (!licence || licence.review_status !== "approved") continue;
    rows.push({
      id: `licence-${app.id}`,
      category: meta.category,
      label: meta.label,
      applicationId: app.id,
      licenceNumber: licence.licence_number,
      expiryDate: licence.expiry_date,
      priceKobo: app.payment_options?.amount_kobo ?? null,
      documentUrl: licence.document_url,
      sortDate: licence.issued_at || app.created_at,
    });
  }
  return rows.sort((a, b) => new Date(b.sortDate || 0) - new Date(a.sortDate || 0));
}

export default function MyDocumentsPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [previewDocUrl, setPreviewDocUrl] = useState(null);

  useEffect(() => {
    getMyApplications().then((res) => {
      if (res.data) setApplications(res.data);
      setLoading(false);
    });
  }, []);

  const documents = useMemo(() => flattenDocuments(applications), [applications]);

  const categoryCounts = useMemo(() => {
    const counts = {};
    for (const d of documents) counts[d.category] = (counts[d.category] || 0) + 1;
    return counts;
  }, [documents]);

  const visibleCategories = CATEGORIES.filter((c) => categoryCounts[c]);
  const visibleDocuments = activeCategory === "All" ? documents : documents.filter((d) => d.category === activeCategory);

  return (
    <div className="mx-auto max-w-4xl space-y-8 py-6 pb-20">
      <DocumentPreviewModal isOpen={!!previewDocUrl} onClose={() => setPreviewDocUrl(null)} fileUrl={previewDocUrl} />

      <div>
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: BRAND }} />
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">My documents</span>
        </div>
        <h1
          className="mt-1.5 text-[30px] tracking-tight text-[#111111]"
          style={{ fontFamily: "var(--font-display-serif)", fontWeight: 500 }}
        >
          Every document you've received
        </h1>
        <p className="mt-1 text-[13.5px] text-slate-500">
          All your approved licences, permits, and vehicle papers in one place — track expiry and download at any time.
        </p>
      </div>

      {!loading && documents.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <CategoryChip label="All" count={documents.length} active={activeCategory === "All"} onClick={() => setActiveCategory("All")} />
          {visibleCategories.map((c) => (
            <CategoryChip key={c} label={c} count={categoryCounts[c] || 0} active={activeCategory === c} onClick={() => setActiveCategory(c)} />
          ))}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl border border-slate-100 bg-slate-50" />
          ))}
        </div>
      ) : documents.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#E5E5E5] bg-white px-8 py-16 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
            <FileCheck2 className="h-7 w-7" />
          </div>
          <h3 className="mt-4 text-[16px] font-bold text-[#111111]">No completed documents yet</h3>
          <p className="mx-auto mt-1 max-w-xs text-[13px] text-slate-500">
            Once a document is approved, it'll show up here for you to track and download.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleDocuments.map((doc) => {
            const freshness = freshnessMeta(doc.expiryDate);
            return (
              <div key={doc.id} className="rounded-2xl border bg-white p-5" style={{ borderColor: PAPER_BORDER }}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[15px] font-bold text-[#111111]">{doc.label}</span>
                      <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-slate-500">
                        #{doc.applicationId}
                      </span>
                      {freshness && (
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold ring-1 ring-inset ${TONE_CLASSES[freshness.tone]}`}
                        >
                          {freshness.label}
                        </span>
                      )}
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-slate-500">
                      <span className="inline-flex items-center rounded-md bg-slate-50 px-2 py-0.5 font-medium text-slate-500">
                        {doc.category}
                      </span>
                      {doc.licenceNumber && <span>Licence No: {doc.licenceNumber}</span>}
                      {doc.priceKobo != null && <span>{koboToNaira(doc.priceKobo)}</span>}
                      {doc.expiryDate && (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          Expires {formatDate(doc.expiryDate)}
                        </span>
                      )}
                    </div>
                  </div>

                  {doc.documentUrl && (
                    <button
                      type="button"
                      onClick={() => setPreviewDocUrl(resolveMediaUrl(doc.documentUrl))}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-[#E5E5E5] bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-[#28A745] hover:text-white hover:border-[#28A745] transition-all shadow-sm"
                    >
                      <span>View document</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
