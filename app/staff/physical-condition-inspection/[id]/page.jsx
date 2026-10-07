"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ShieldCheck, Video, ClipboardCheck } from "lucide-react";
import { getStaffApplication, confirmPciCompleteness, adminListPciReferenceImages, resolveMediaUrl } from "@/lib/api";
import DocumentPreviewModal from "@/app/components/design/DocumentPreviewModal";
import { Badge, Button, Card, ErrorState, Notice, PageHeader, StickyActionBar } from "@/app/dashboard/_kit";
import { Collapsible, Info, InfoGrid, Spinner } from "@/app/components/portal/ui";

// Mirrors PCI_CHECKLIST_SECTIONS in app/modules/driver_licence/router.py —
// keep in sync if the checklist itself ever changes. requiresEvidence flags
// match the backend's evidence_required booleans.
const PCI_SECTIONS = [
  { key: "exterior_body", label: "Exterior & Body", items: [
    ["body_panel_alignment", true], ["paint_consistency", true], ["glass_windscreen_mirrors", true], ["lights", true], ["tyres", true],
  ] },
  { key: "engine_bay", label: "Engine Bay", items: [
    ["oil_condition_level", true], ["coolant_fluid_levels", true], ["leaks", true], ["belts_hoses", true], ["battery_condition", true],
  ] },
  { key: "underbody", label: "Underbody", items: [
    ["suspension_components", true], ["exhaust_system", true], ["chassis_rust_structural_damage", true], ["accident_repair_weld_signs", true],
  ] },
  { key: "interior", label: "Interior", items: [
    ["dashboard_warning_lights", true], ["ac_function", false], ["electronics", false], ["seats_belts", true], ["odometer_reading", true],
  ] },
  { key: "road_test", label: "Road Test", items: [
    ["engine_performance_under_load", true], ["transmission_gearbox", true], ["brakes", true], ["steering_alignment", true], ["unusual_noises_vibrations", true],
  ] },
];

const TOTAL_ITEMS = PCI_SECTIONS.reduce((n, s) => n + s.items.length, 0);

function isVideoUrl(url) {
  return /\.(mp4|mov|webm|m4v|3gp)(\?|$)/i.test(url || "");
}

function ratingTone(rating) {
  if (rating === "good") return "brand";
  if (rating === "fair" || rating === "poor") return "amber";
  if (rating === "needs_attention") return "red";
  return "neutral";
}

function isItemMissing(item, requiresEvidence) {
  return !item?.rating || (requiresEvidence && !item?.evidence_url);
}

function ChecklistItemRow({ itemKey, item, reference, requiresEvidence, onPreview }) {
  const missingEvidence = requiresEvidence && !item?.evidence_url;
  const label = itemKey.replace(/_/g, " ");
  return (
    <li className="py-3.5 first:pt-0 last:pb-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[15px] font-semibold text-cx-ink first-letter:uppercase">{label}</p>
          {item?.notes ? <p className="mt-0.5 text-sm text-cx-ink-2">{item.notes}</p> : null}
          {!item?.rating ? <p className="mt-0.5 text-[13px] font-medium text-cx-amber">Not yet rated</p> : null}
          {item?.rating && missingEvidence ? <p className="mt-0.5 text-[13px] font-medium text-cx-amber">Missing required evidence</p> : null}
        </div>
        <Badge tone={ratingTone(item?.rating)} className="shrink-0 first-letter:uppercase">
          {item?.rating?.replace(/_/g, " ") || "Not rated"}
        </Badge>
      </div>

      {item?.evidence_url || reference?.image_url ? (
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          {item?.evidence_url ? (
            isVideoUrl(item.evidence_url) ? (
              <a
                href={resolveMediaUrl(item.evidence_url)}
                target="_blank"
                rel="noreferrer"
                className="cx-focus inline-flex min-h-11 items-center gap-1.5 rounded-cx border border-cx-line-strong bg-cx-surface px-3 text-sm font-semibold text-cx-ink hover:bg-cx-sunken"
              >
                <Video className="h-4 w-4" aria-hidden /> Watch video
              </a>
            ) : (
              <button
                type="button"
                onClick={() => onPreview(resolveMediaUrl(item.evidence_url))}
                aria-label={`View evidence for ${label}`}
                className="cx-focus h-14 w-14 shrink-0 overflow-hidden rounded-cx-sm border border-cx-line bg-cx-sunken"
              >
                <img src={resolveMediaUrl(item.evidence_url)} alt="" className="h-full w-full object-cover" />
              </button>
            )
          ) : null}
          {reference?.image_url ? (
            <button
              type="button"
              onClick={() => onPreview(resolveMediaUrl(reference.image_url))}
              className="cx-focus flex min-h-11 min-w-0 items-center gap-2 rounded-cx-sm border border-dashed border-cx-line-strong bg-cx-sunken p-1.5 pr-3 text-left"
            >
              <img src={resolveMediaUrl(reference.image_url)} alt="" className="h-10 w-10 shrink-0 rounded-cx-sm object-cover" />
              <span className="min-w-0 text-[13px] text-cx-muted">{reference.caption || "Reference photo for this item"}</span>
            </button>
          ) : null}
        </div>
      ) : null}

      {item?.voice_note_url ? (
        <audio controls src={resolveMediaUrl(item.voice_note_url)} className="mt-2.5 h-10 w-full max-w-xs" />
      ) : null}
    </li>
  );
}

export default function StaffPhysicalConditionInspectionReviewPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = params?.id ? String(params.id).replace(/^app_/, "") : null;
  const appId = rawId && !isNaN(Number(rawId)) ? Number(rawId) : rawId;

  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [previewDocUrl, setPreviewDocUrl] = useState(null);
  const [referenceImages, setReferenceImages] = useState([]);

  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState(null);
  const [missingItems, setMissingItems] = useState(null);

  const pollRef = useRef(null);

  const loadDetail = useCallback(async ({ silent = false } = {}) => {
    if (!appId) {
      if (!silent) setLoading(false);
      return;
    }
    if (!silent) setLoading(true);
    const res = await getStaffApplication(appId);
    if (res.error) setError(res.error);
    else if (res.data) setApplication(res.data);
    if (!silent) setLoading(false);
  }, [appId]);

  useEffect(() => {
    loadDetail();
    adminListPciReferenceImages().then((res) => { if (res.data) setReferenceImages(res.data); });
  }, [loadDetail]);

  // Poll while the visit is in progress so newly-saved items from the field
  // mechanic's link show up here without a manual reload.
  useEffect(() => {
    if (application?.status !== "visit_scheduled") return;
    pollRef.current = setInterval(() => loadDetail({ silent: true }), 15000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [application?.status, loadDetail]);

  const handleConfirmCompleteness = async () => {
    setConfirming(true);
    setConfirmError(null);
    setMissingItems(null);
    const res = await confirmPciCompleteness(appId);
    setConfirming(false);
    if (res.error) {
      setConfirmError(res.error);
      return;
    }
    router.push(`/staff/applications/${appId}`);
  };

  if (loading) return <Spinner label="Loading checklist…" />;

  if (error || !application) {
    return (
      <div className="mx-auto max-w-3xl">
        <PageHeader title="Inspection checklist" backHref="/staff/applications" backLabel="Back to applications" />
        <ErrorState title="Application not found" message={error || "This application doesn't exist or you can't see it."} onRetry={() => loadDetail()} />
      </div>
    );
  }

  const detail = application.pci_detail || {};
  const itemsByKey = {};
  for (const item of application.pci_checklist_items || []) {
    itemsByKey[`${item.section_key}.${item.item_key}`] = item;
  }
  const referenceByKey = Object.fromEntries(referenceImages.map((r) => [`${r.section_key}.${r.item_key}`, r]));

  const missingCount = PCI_SECTIONS.reduce(
    (n, s) => n + s.items.filter(([itemKey, requiresEvidence]) => {
      const item = itemsByKey[`${s.key}.${itemKey}`];
      return !item?.rating || (requiresEvidence && !item?.evidence_url);
    }).length,
    0
  );
  const capturedCount = TOTAL_ITEMS - missingCount;
  const canConfirm = application.status === "visit_scheduled";
  const alreadyConfirmed = application.status && !["submitted", "staff_review", "visit_scheduled"].includes(application.status);

  return (
    <div className="mx-auto max-w-3xl">
      <DocumentPreviewModal isOpen={!!previewDocUrl} onClose={() => setPreviewDocUrl(null)} fileUrl={previewDocUrl} />

      <PageHeader
        backHref={`/staff/applications/${appId}`}
        backLabel="Back to application"
        title={<>Inspection checklist <span className="font-mono text-[17px] text-cx-muted">#{appId}</span></>}
        description="Check every item the field mechanic captured is properly recorded before sending the evidence to the reviewing mechanic."
      />

      <div className="space-y-4">
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-sm">
            <span className="font-semibold text-cx-ink">{capturedCount} of {TOTAL_ITEMS} items captured</span>
            {canConfirm ? <span className="text-[13px] text-cx-muted">Updates every 15 seconds</span> : null}
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-cx-line" role="progressbar" aria-valuemin={0} aria-valuemax={TOTAL_ITEMS} aria-valuenow={capturedCount}>
            <div className="h-full rounded-full bg-cx-brand transition-all" style={{ width: `${(capturedCount / TOTAL_ITEMS) * 100}%` }} />
          </div>
        </Card>

        <Card>
          <h2 className="text-[16px] font-semibold text-cx-ink">Booking</h2>
          <div className="mt-3">
            <InfoGrid>
              <Info label="Vehicle" value={`${detail.make || ""} ${detail.model || ""} — ${detail.plate_number || ""}`} wide />
              <Info label="Category" value={detail.vehicle_category ? <span className="capitalize">{detail.vehicle_category.replace(/_/g, " ")}</span> : null} />
              <Info
                label="Confirmed visit"
                value={`${detail.confirmed_visit_date ? new Date(detail.confirmed_visit_date).toLocaleDateString() : "Not scheduled"}${detail.confirmed_visit_time ? ` (${detail.confirmed_visit_time})` : ""}`}
              />
            </InfoGrid>
          </div>
        </Card>

        {alreadyConfirmed ? (
          <Notice
            tone="brand"
            icon={ShieldCheck}
            title="Completeness already confirmed"
            action={application.status === "awaiting_mechanic_verdict" ? (
              <Button size="sm" href={`/staff/physical-condition-inspection/${appId}/verdict`}>Record verdict</Button>
            ) : null}
          >
            The field mechanic&apos;s link is closed.
          </Notice>
        ) : null}

        {PCI_SECTIONS.map((section) => {
          const sectionMissing = section.items.filter(([k, req]) => isItemMissing(itemsByKey[`${section.key}.${k}`], req)).length;
          return (
            <Collapsible
              key={section.key}
              title={section.label}
              icon={ClipboardCheck}
              count={`${section.items.length - sectionMissing}/${section.items.length}`}
              defaultOpen
            >
              <ul className="divide-y divide-cx-line">
                {section.items.map(([itemKey, requiresEvidence]) => (
                  <ChecklistItemRow
                    key={itemKey}
                    itemKey={itemKey}
                    item={itemsByKey[`${section.key}.${itemKey}`]}
                    reference={referenceByKey[`${section.key}.${itemKey}`]}
                    requiresEvidence={requiresEvidence}
                    onPreview={setPreviewDocUrl}
                  />
                ))}
              </ul>
            </Collapsible>
          );
        })}

        {canConfirm ? (
          <StickyActionBar edge>
            <div className="w-full space-y-2">
              {confirmError ? <Notice tone="red">{confirmError}</Notice> : null}
              {missingCount > 0 ? (
                <p className="text-[13px] text-cx-muted">
                  {missingCount} item{missingCount === 1 ? "" : "s"} still need{missingCount === 1 ? "s" : ""} a rating or required evidence before this can be confirmed.
                </p>
              ) : null}
              <Button size="lg" block icon={ShieldCheck} loading={confirming} disabled={missingCount > 0} onClick={handleConfirmCompleteness}>
                {confirming ? "Confirming…" : "Confirm checklist is complete"}
              </Button>
            </div>
          </StickyActionBar>
        ) : null}
      </div>
    </div>
  );
}
