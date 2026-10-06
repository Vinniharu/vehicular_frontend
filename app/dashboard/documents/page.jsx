"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock, Download, Eye, FileCheck2 } from "lucide-react";
import {
  downloadPciReportPdf,
  downloadRwxCertificatePdf,
  downloadVehicleVerificationReportPdf,
  getMyApplications,
  resolveMediaUrl,
} from "@/lib/api";
import { formatDate, freshnessMeta } from "@/app/dashboard/_shared/apply-helpers";
import DocumentPreviewModal from "@/app/components/design/DocumentPreviewModal";
import { useToast } from "@/app/components/shared/ToastProvider";
import { Badge, Button, Card, EmptyState, ErrorState, PageHeader, SkeletonList } from "@/app/dashboard/_kit";

const PARTICULARS_LABELS = {
  vehicle_licence: "Vehicle licence",
  road_worthiness: "Roadworthiness certificate",
  proof_of_ownership: "Proof of ownership",
  insurance_third_party: "Third-party insurance",
  hackney_permit: "Hackney permit",
};

// Services whose finished document is an approved permanent_licence.
const LICENCE_TYPE_META = {
  fresh: { category: "Driver's licence", label: "Driver's licence" },
  renewal: { category: "Driver's licence", label: "Driver's licence (renewal)" },
  reissue: { category: "Driver's licence", label: "Driver's licence (reissue)" },
  international_permit: { category: "Driver's licence", label: "International driving permit" },
  tinted_permit: { category: "Permits", label: "Tinted permit" },
  number_plate_new: { category: "Number plates", label: "Number plate (new)" },
  number_plate_replacement: { category: "Number plates", label: "Number plate (replacement)" },
  number_plate_change_of_ownership: { category: "Number plates", label: "Number plate (change of ownership)" },
  number_plate_fancy: { category: "Number plates", label: "Number plate (fancy)" },
  number_plate_dealership: { category: "Number plates", label: "Number plate (dealership)" },
  central_motor_registry: { category: "Vehicle records", label: "Central Motor Registry record" },
};

const CATEGORY_ORDER = ["Driver's licence", "Vehicle papers", "Number plates", "Permits", "Vehicle records", "Inspections"];

// One row per finished document. Temporary licences are left out on purpose:
// once the permanent one lands they're superseded.
function flattenDocuments(applications) {
  const rows = [];
  for (const app of applications) {
    const t = app.application_type;
    if (t === "vehicle_particulars") {
      for (const item of app.items || []) {
        if (item.status !== "approved") continue;
        const finalDoc = (app.documents || []).find((d) => d.doc_type === `${item.document_type}_final`);
        rows.push({
          id: `particulars-${item.id}`,
          category: "Vehicle papers",
          label: PARTICULARS_LABELS[item.document_type] || item.document_type,
          applicationId: app.id,
          expiryDate: item.expiry_date,
          viewUrl: finalDoc?.file_url || null,
          sortDate: item.updated_at || item.created_at || app.created_at,
        });
      }
      continue;
    }
    if (t === "roadworthiness_express" && app.rwx_detail?.certificate_token) {
      rows.push({
        id: `rwx-${app.id}`, category: "Inspections", label: "Roadworthiness certificate", applicationId: app.id,
        reference: app.rwx_detail.certificate_token, download: () => downloadRwxCertificatePdf(app.id),
        sortDate: app.updated_at || app.created_at,
      });
      continue;
    }
    if (t?.startsWith("vehicle_verification_") && app.verification_detail?.verification_token) {
      rows.push({
        id: `vv-${app.id}`, category: "Inspections", label: "Vehicle verification report", applicationId: app.id,
        reference: app.verification_detail.verification_token, download: () => downloadVehicleVerificationReportPdf(app.id),
        sortDate: app.updated_at || app.created_at,
      });
      continue;
    }
    if (t === "physical_condition_inspection" && app.pci_detail?.verification_token && app.pci_detail?.verdict) {
      rows.push({
        id: `pci-${app.id}`, category: "Inspections", label: "Physical condition inspection report", applicationId: app.id,
        reference: app.pci_detail.verification_token, download: () => downloadPciReportPdf(app.id),
        sortDate: app.updated_at || app.created_at,
      });
      continue;
    }

    const meta = LICENCE_TYPE_META[t];
    const licence = app.permanent_licence;
    if (!meta || !licence || licence.review_status !== "approved") continue;
    rows.push({
      id: `licence-${app.id}`,
      category: meta.category,
      label: meta.label,
      applicationId: app.id,
      reference: licence.licence_number,
      expiryDate: licence.expiry_date,
      viewUrl: licence.document_url,
      sortDate: licence.issued_at || app.created_at,
    });
  }
  return rows.sort((a, b) => new Date(b.sortDate || 0) - new Date(a.sortDate || 0));
}

const FRESHNESS_TONE = { success: "brand", warning: "amber", danger: "red" };

export default function MyDocumentsPage() {
  const pushToast = useToast();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [category, setCategory] = useState("All");
  const [previewDocUrl, setPreviewDocUrl] = useState(null);
  const [downloading, setDownloading] = useState(null);

  const load = () => {
    setLoadError(null);
    getMyApplications().then((res) => {
      if (res.error) setLoadError(res.error);
      else setApplications(res.data || []);
      setLoading(false);
    });
  };

  useEffect(load, []);

  const documents = useMemo(() => flattenDocuments(applications), [applications]);
  const categories = CATEGORY_ORDER.filter((c) => documents.some((d) => d.category === c));
  const visible = category === "All" ? documents : documents.filter((d) => d.category === category);

  const download = async (doc) => {
    setDownloading(doc.id);
    try {
      await doc.download();
    } catch (err) {
      pushToast({ tone: "error", title: "Download didn't start", body: err?.message || "Try again in a moment." });
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <DocumentPreviewModal isOpen={!!previewDocUrl} onClose={() => setPreviewDocUrl(null)} fileUrl={previewDocUrl} />
      <PageHeader
        title="My documents"
        description="Licences, permits, certificates and reports you've been issued. Check expiry dates and download them any time."
      />

      {loading ? (
        <SkeletonList rows={3} />
      ) : loadError ? (
        <ErrorState title="Your documents didn't load" message={loadError} onRetry={() => { setLoading(true); load(); }} />
      ) : documents.length === 0 ? (
        <EmptyState
          icon={FileCheck2}
          title="No documents yet"
          description="When an application is completed, its licence, permit or report appears here."
          action={<Button variant="secondary" href="/dashboard/applications">See my applications</Button>}
        />
      ) : (
        <>
          {categories.length > 1 ? (
            <div className="-mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label="Filter documents">
              {["All", ...categories].map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-pressed={category === c}
                  onClick={() => setCategory(c)}
                  className={`cx-focus min-h-10 shrink-0 rounded-full px-4 text-sm font-medium ${
                    category === c ? "bg-cx-ink text-white" : "border border-cx-line-strong bg-cx-surface text-cx-ink-2 hover:bg-cx-sunken"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          ) : null}

          <ul className="space-y-3">
            {visible.map((doc) => {
              const freshness = freshnessMeta(doc.expiryDate);
              return (
                <li key={doc.id}>
                  <Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-base font-semibold text-cx-ink">{doc.label}</p>
                        {freshness ? <Badge tone={FRESHNESS_TONE[freshness.tone]}>{freshness.label}</Badge> : null}
                      </div>
                      <p className="mt-1 text-sm text-cx-muted">
                        {doc.category} · Application #{doc.applicationId}
                        {doc.reference ? ` · ${doc.reference}` : ""}
                      </p>
                      {doc.expiryDate ? (
                        <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-cx-muted">
                          <Clock className="h-4 w-4" aria-hidden />
                          Expires {formatDate(doc.expiryDate)}
                        </p>
                      ) : null}
                    </div>
                    {doc.viewUrl ? (
                      <Button variant="secondary" icon={Eye} onClick={() => setPreviewDocUrl(resolveMediaUrl(doc.viewUrl))}>
                        View
                      </Button>
                    ) : doc.download ? (
                      <Button variant="secondary" icon={Download} loading={downloading === doc.id} onClick={() => download(doc)}>
                        Download PDF
                      </Button>
                    ) : null}
                  </Card>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
