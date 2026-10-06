"use client";

// Vehicle papers: a bundle of documents, each finished and reviewed on its
// own. Every document has its own "Upload finished document" step.

import { useState } from "react";
import { CheckCircle2, Clock, Eye, FileStack, Send, Upload } from "lucide-react";
import { koboToNaira, resolveMediaUrl, uploadParticularsItemFinal } from "@/lib/api";
import { Badge, Button, Card, Field, Input, Notice, Sheet } from "@/app/dashboard/_kit";
import { useToast } from "@/app/components/shared/ToastProvider";
import AgentApplicationChatSection from "@/app/components/design/AgentApplicationChatSection";
import { PARTICULAR_DOC_LABELS } from "./jobs";
import { UploadBox } from "./ui";
import { CustomerCard, DocumentsSection, JobHeader, NextStep, VehicleSection } from "./JobShell";

const TO_UPLOAD = ["agent_accepted", "evidence_submitted", "submitted", "pending_evidence"];
const docName = (type) => PARTICULAR_DOC_LABELS[type] || (type || "Document").replace(/_/g, " ");

function itemState(item) {
  if (item.status === "approved") return { tone: "brand", label: "Approved", icon: CheckCircle2 };
  if (item.status === "rejected") return { tone: "red", label: "Needs changes" };
  if (item.status === "agent_completed") return { tone: "neutral", label: "With staff", icon: Clock };
  if (TO_UPLOAD.includes(item.status)) return { tone: "amber", label: "To upload" };
  return { tone: "neutral", label: (item.status || "").replace(/_/g, " ") };
}

function nextYear() {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
}

export default function ParticularsJob({ application, vehicle, stage, onPreview, reload }) {
  const pushToast = useToast();
  const items = application.items || [];
  const docs = application.documents || [];
  const earnings = items.reduce((sum, i) => sum + (i.agent_compensation_kobo || 0), 0);
  const done = items.filter((i) => ["approved", "agent_completed"].includes(i.status)).length;

  const [item, setItem] = useState(null);
  const [fileUrl, setFileUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const needsExpiry = item && item.document_type !== "proof_of_ownership";

  const openItem = (it) => {
    setError(null);
    setFileUrl("");
    setFileName("");
    setExpiry(it.expiry_date ? it.expiry_date.slice(0, 10) : it.document_type !== "proof_of_ownership" ? nextYear() : "");
    setItem(it);
  };

  const submit = async () => {
    setError(null);
    if (!fileUrl) return setError("Add the finished document.");
    if (needsExpiry && !expiry) return setError("Enter the expiry date shown on the document.");
    setSaving(true);
    const res = await uploadParticularsItemFinal(item.id, { file_url: fileUrl, expiry_date: needsExpiry ? expiry : undefined });
    setSaving(false);
    if (res.error) return setError(res.error);
    pushToast({ tone: "success", title: `${docName(item.document_type)} sent to staff for review` });
    setItem(null);
    await reload();
  };

  const firstToDo = items.find((i) => i.status === "rejected") || items.find((i) => TO_UPLOAD.includes(i.status));

  return (
    <div className="mx-auto max-w-3xl">
      <JobHeader application={application} stage={stage} extra={earnings > 0 ? <Badge tone="brand">You earn {koboToNaira(earnings)}</Badge> : null} />
      <div className="space-y-4">
        <NextStep
          stage={stage}
          action={firstToDo ? <Button size="lg" icon={Upload} onClick={() => openItem(firstToDo)}>Upload {docName(firstToDo.document_type).toLowerCase()}</Button> : null}
        >
          {items.length > 0 ? (
            <div className="mt-1">
              <div className="flex items-center justify-between text-sm text-cx-muted">
                <span>{done} of {items.length} documents handed in</span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-cx-line">
                <div className="h-full rounded-full bg-cx-brand transition-all" style={{ width: `${items.length ? (done / items.length) * 100 : 0}%` }} />
              </div>
            </div>
          ) : null}
        </NextStep>

        <Card padded={false}>
          <h2 className="flex items-center gap-2 px-4 pb-1 pt-4 text-[16px] font-semibold text-cx-ink sm:px-5">
            <FileStack className="h-5 w-5 text-cx-muted" aria-hidden /> Documents to deliver
          </h2>
          <ul className="divide-y divide-cx-line">
            {items.map((it) => {
              const st = itemState(it);
              const finalDoc = docs.find((d) => d.doc_type === `${it.document_type}_final`);
              const canUpload = it.status === "rejected" || TO_UPLOAD.includes(it.status) || it.status === "agent_completed";
              return (
                <li key={it.id} className="px-4 py-4 sm:px-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[15px] font-semibold text-cx-ink">{docName(it.document_type)}</p>
                      <p className="text-[13px] text-cx-muted">
                        {it.expiry_date ? `Expires ${new Date(it.expiry_date).toLocaleDateString("en-NG", { dateStyle: "medium" })}` : "No expiry date yet"}
                        {it.agent_compensation_kobo > 0 ? ` · You earn ${koboToNaira(it.agent_compensation_kobo)}` : ""}
                      </p>
                    </div>
                    <Badge tone={st.tone}>{st.label}</Badge>
                  </div>
                  {it.status === "rejected" && (it.staff_review_note || finalDoc?.review_note) ? (
                    <div className="mt-2">
                      <Notice tone="red" title="Staff asked for changes">{it.staff_review_note || finalDoc?.review_note}</Notice>
                    </div>
                  ) : null}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {canUpload ? (
                      <Button size="md" variant={it.status === "agent_completed" ? "secondary" : "primary"} icon={Upload} onClick={() => openItem(it)}>
                        {it.status === "rejected" ? "Upload corrected copy" : it.status === "agent_completed" ? "Replace upload" : "Upload finished document"}
                      </Button>
                    ) : null}
                    {finalDoc?.file_url ? (
                      <Button size="md" variant="ghost" icon={Eye} onClick={() => onPreview(resolveMediaUrl(finalDoc.file_url))}>
                        View upload
                      </Button>
                    ) : null}
                  </div>
                </li>
              );
            })}
            {items.length === 0 ? <li className="px-4 py-4 text-sm text-cx-muted sm:px-5">No documents on this job.</li> : null}
          </ul>
        </Card>

        <CustomerCard application={application} />
        <VehicleSection application={application} vehicle={vehicle} defaultOpen />
        <DocumentsSection
          application={application}
          onPreview={onPreview}
          onChanged={reload}
          defaultOpen={false}
          filter={(d) => !d.doc_type?.endsWith("_final") && d.doc_type !== "vehicle_particulars_proof"}
        />
        <AgentApplicationChatSection application={application} />
      </div>

      <Sheet
        open={!!item}
        onOpenChange={(o) => !o && !saving && setItem(null)}
        title={item ? `Upload ${docName(item.document_type).toLowerCase()}` : "Upload document"}
        description="Staff review it before the customer gets it."
        footer={
          <>
            <Button variant="secondary" onClick={() => setItem(null)} disabled={saving}>Cancel</Button>
            <Button block icon={Send} loading={saving} onClick={submit}>Send for review</Button>
          </>
        }
      >
        <div className="space-y-4">
          {error ? <Notice tone="red">{error}</Notice> : null}
          <Field label="Finished document" required>
            <UploadBox value={fileUrl} fileName={fileName} previewSrc={fileUrl ? resolveMediaUrl(fileUrl) : undefined} onUploaded={({ url, fileName: n }) => { setFileUrl(url); setFileName(n); }} />
          </Field>
          {needsExpiry ? (
            <Field label="Expiry date on the document" required>
              {(p) => <Input {...p} type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} />}
            </Field>
          ) : null}
        </div>
      </Sheet>
    </div>
  );
}
