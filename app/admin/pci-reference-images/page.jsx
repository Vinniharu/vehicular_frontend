"use client";

import { useState, useEffect, useRef } from "react";
import { Camera, Loader2, Upload } from "lucide-react";
import { adminListPciReferenceImages, adminUpsertPciReferenceImage, uploadApplicationFile, resolveMediaUrl } from "@/lib/api";
import { Button, Card, EmptyState, Input, PageHeader, SectionTitle, Skeleton } from "@/app/dashboard/_kit";
import { useToast } from "@/app/components/shared/ToastProvider";

// Display grouping only — the backend's PCI_CHECKLIST_SECTIONS
// (app/modules/driver_licence/router.py) is the source of truth for which
// (section_key, item_key) pairs are legal; this just needs matching labels.
const SECTION_LABELS = {
  exterior_body: "Exterior & Body",
  engine_bay: "Engine Bay",
  underbody: "Underbody",
  interior: "Interior",
  road_test: "Road Test",
};

function ReferenceImageCard({ row, onUpdated, onError }) {
  const [caption, setCaption] = useState(row.caption || "");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    setUploading(true);
    const { data, error } = await uploadApplicationFile(file);
    if (error || !data?.file_url) {
      setUploading(false);
      onError(error || "Upload failed — try again.");
      return;
    }
    const res = await adminUpsertPciReferenceImage(row.section_key, row.item_key, { image_url: data.file_url, caption: caption.trim() || undefined });
    setUploading(false);
    if (res.error) {
      onError(res.error);
      return;
    }
    onUpdated(res.data);
  };

  const handleCaptionBlur = async () => {
    if (!row.image_url || caption === (row.caption || "")) return;
    const res = await adminUpsertPciReferenceImage(row.section_key, row.item_key, { image_url: row.image_url, caption: caption.trim() || undefined });
    if (res.error) onError(res.error);
    else onUpdated(res.data);
  };

  const itemLabel = row.item_key.replace(/_/g, " ");

  return (
    <Card padded={false} className="flex flex-col overflow-hidden">
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        aria-label={row.image_url ? `Replace photo for ${itemLabel}` : `Add photo for ${itemLabel}`}
        className="cx-focus relative flex aspect-square w-full items-center justify-center overflow-hidden bg-cx-sunken"
      >
        {uploading ? (
          <Loader2 className="h-6 w-6 animate-spin text-cx-muted" aria-hidden />
        ) : row.image_url ? (
          <img src={resolveMediaUrl(row.image_url)} alt="" className="h-full w-full object-cover" />
        ) : (
          <Camera className="h-7 w-7 text-cx-muted" aria-hidden />
        )}
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        disabled={uploading}
        onChange={(e) => {
          handleFile(e.target.files?.[0]);
          e.target.value = "";
        }}
        className="hidden"
      />
      <div className="flex flex-1 flex-col gap-2 p-3">
        <p className="text-[15px] font-medium text-cx-ink first-letter:uppercase">{itemLabel}</p>
        <Input
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          onBlur={handleCaptionBlur}
          placeholder="Caption (optional)"
          aria-label={`Caption for ${itemLabel}`}
        />
        <Button
          variant={row.image_url ? "secondary" : "soft"}
          icon={Upload}
          loading={uploading}
          onClick={() => fileRef.current?.click()}
          className="mt-auto"
          block
        >
          {row.image_url ? "Replace" : "Upload"}
        </Button>
      </div>
    </Card>
  );
}

export default function AdminPciReferenceImagesPage() {
  const pushToast = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminListPciReferenceImages().then((res) => {
      if (res.data) setRows(res.data);
      setLoading(false);
    });
  }, []);

  const showError = (msg) =>
    pushToast({ tone: "error", title: "Couldn't save the photo", body: typeof msg === "string" ? msg : msg?.detail || undefined });

  const handleUpdated = (updated) => {
    setRows((rs) => rs.map((r) => (r.section_key === updated.section_key && r.item_key === updated.item_key ? updated : r)));
    pushToast({ tone: "success", title: "Saved" });
  };

  const sections = Object.entries(
    rows.reduce((acc, r) => {
      (acc[r.section_key] ||= []).push(r);
      return acc;
    }, {})
  );

  return (
    <div className="space-y-8 pb-16">
      <PageHeader
        title="Inspection reference photos"
        description="Photos of what a good result looks like for each checklist item. Mechanics see them on their inspection link and staff see them on the completeness dashboard. Items without a photo show nothing extra."
      />

      {loading ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[3/4] w-full rounded-cx-lg" />
          ))}
        </div>
      ) : sections.length === 0 ? (
        <EmptyState icon={Camera} title="No checklist items" description="There are no inspection checklist items to add photos to." />
      ) : (
        sections.map(([sectionKey, items]) => (
          <section key={sectionKey}>
            <SectionTitle title={SECTION_LABELS[sectionKey] || sectionKey} />
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
              {items.map((row) => (
                <ReferenceImageCard key={`${row.section_key}.${row.item_key}`} row={row} onUpdated={handleUpdated} onError={showError} />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
