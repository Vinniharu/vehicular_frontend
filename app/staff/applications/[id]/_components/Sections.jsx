"use client";

// Read-mostly information sections for the staff application page.

import { useState } from "react";
import {
  Car,
  ClipboardList,
  Eye,
  FileText,
  GraduationCap,
  History,
  IdCard,
  MapPin,
  Stethoscope,
  Wallet,
} from "lucide-react";
import { koboToNaira, resolveMediaUrl, staffReviewDocument } from "@/lib/api";
import { Badge, Button, Card, Field, Sheet, Textarea } from "@/app/dashboard/_kit";
import { useToast } from "@/app/components/shared/ToastProvider";
import { Collapsible, CopyButton, Info, InfoGrid } from "@/app/components/portal/ui";
import { statusMeta } from "../../../_components/status";

const cx = (...parts) => parts.filter(Boolean).join(" ");
const pick = (app, key) => app[key] ?? app.applicant_details?.[key];
const date = (v, opts = { dateStyle: "medium" }) => (v ? new Date(v).toLocaleDateString("en-NG", opts) : null);
const dateTime = (v) => (v ? new Date(v).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" }) : null);
const isImage = (url) => /\.(jpe?g|png|webp|gif)(\?|$)/i.test(url || "") || (url || "").startsWith("data:image");

/* ── Payment ────────────────────────────────────────────────────────── */

export function PaymentSection({ application, isPaid }) {
  const po = application.payment_options;
  return (
    <Card>
      <h2 className="flex items-center gap-2 text-[16px] font-semibold text-cx-ink">
        <Wallet className="h-5 w-5 text-cx-muted" aria-hidden /> Payment
        {isPaid ? <Badge tone="brand">Paid in full</Badge> : po ? <Badge tone={po.is_overdue ? "red" : "amber"}>{po.is_overdue ? "Overdue" : "Part paid"}</Badge> : null}
        {po?.deposit_waived ? <Badge tone="neutral">Deposit waived by admin</Badge> : null}
      </h2>
      <div className="mt-3">
        <InfoGrid>
          <Info label="Service fee" value={po ? koboToNaira(po.amount_kobo) : "Not available"} />
          {!isPaid && po ? (
            <>
              <Info label="Paid" value={koboToNaira(po.amount_paid_kobo || 0)} />
              <Info label="Balance" value={<span className="text-cx-red">{koboToNaira(po.remaining_kobo || 0)}</span>} />
              {po.required_deposit_kobo ? <Info label="Deposit required" value={koboToNaira(po.required_deposit_kobo)} /> : null}
              {po.deposit_shortfall_kobo > 0 && !po.deposit_waived ? (
                <Info label="Still needed for deposit" value={<span className="text-cx-amber">{koboToNaira(po.deposit_shortfall_kobo)}</span>} />
              ) : null}
              <Info label="Payment due" value={date(po.payment_due_date)} />
            </>
          ) : null}
          <Info label="Applied" value={date(application.created_at)} />
        </InfoGrid>
      </div>
      {!isPaid && po?.deposit_waived ? (
        <p className="mt-3 text-sm text-cx-muted">An admin let this go ahead without a deposit. You can review and process it, but it only goes to an agent once the customer pays in full.</p>
      ) : null}
      {!isPaid && application.status === "driving_school_certificate_ready" && po ? (
        <p className="mt-3 text-sm text-cx-muted">Certificate verified — this goes to an agent automatically once the balance is paid.</p>
      ) : null}
    </Card>
  );
}

/* ── Applicant ──────────────────────────────────────────────────────── */

export function ApplicantSection({ application, isDl }) {
  const a = application;
  const phone = a.phone_number || a.applicant_details?.phone || a.applicant_details?.phone_number;
  const delivery = a.delivery_address || a.applicant_details?.delivery_address;
  return (
    <Collapsible title="Applicant" icon={IdCard} defaultOpen>
      <div className="space-y-5">
        <InfoGrid>
          <Info label="Surname" value={pick(a, "last_name")} />
          <Info label="First name" value={pick(a, "first_name")} />
          <Info label="Other name" value={pick(a, "middle_name")} />
          <Info label="Phone" value={phone} mono copy />
          <Info label="Email" value={a.applicant_email} copy />
          <Info label="NIN" value={a.nin || a.applicant_details?.nin} mono copy />
          <Info label="Date of birth" value={a.date_of_birth} />
          <Info label="Gender" value={a.gender} />
          <Info label="Residence" value={[a.state_of_residence, a.lga].filter(Boolean).join(" / ")} />
          {a.state_of_origin ? <Info label="Origin" value={[a.state_of_origin, a.lga_of_origin].filter(Boolean).join(" / ")} /> : null}
          {a.nationality ? <Info label="Nationality" value={a.nationality} /> : null}
          {a.mothers_maiden_name ? <Info label="Mother's maiden name" value={a.mothers_maiden_name} /> : null}
          <Info label="Address" value={a.residential_address} wide />
        </InfoGrid>
        {delivery ? (
          <div className="rounded-cx bg-cx-brand-soft p-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="flex items-center gap-1.5 text-[13px] font-semibold text-cx-brand-deep"><MapPin className="h-4 w-4" aria-hidden /> Deliver to</p>
                <p className="mt-0.5 text-[15px] font-medium text-cx-ink">{delivery}</p>
              </div>
              <CopyButton value={delivery} label="delivery address" />
            </div>
          </div>
        ) : null}
        {isDl ? (
          <>
            <div>
              <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-cx-ink-2"><Stethoscope className="h-4 w-4" aria-hidden /> Medical</h3>
              <InfoGrid>
                <Info label="Blood group" value={a.blood_group} />
                <Info label="Height" value={a.height_cm ? `${a.height_cm} cm` : null} />
                <Info label="Vision" value={a.vision_acuity_test || "Pending"} />
                <Info label="Facial mark" value={a.has_facial_mark ? a.facial_mark_description || "Yes" : "None"} />
                <Info label="Disability" value={a.has_disability ? a.disability_description || "Yes" : "None"} />
              </InfoGrid>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-semibold text-cx-ink-2">Next of kin</h3>
              <InfoGrid>
                <Info label="Name" value={a.next_of_kin_name} />
                <Info label="Relationship" value={a.next_of_kin_relationship} />
                <Info label="Phone" value={a.next_of_kin_phone} mono copy />
              </InfoGrid>
            </div>
          </>
        ) : null}
      </div>
    </Collapsible>
  );
}

/* ── Licence ────────────────────────────────────────────────────────── */

function LicenceCard({ title, licence, onPreview }) {
  return (
    <div className="rounded-cx bg-cx-sunken p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[13px] font-semibold text-cx-ink-2">{title}</p>
        {licence?.review_status ? <Badge tone={licence.review_status === "approved" ? "brand" : licence.review_status === "rejected" ? "red" : "amber"}>{licence.review_status}</Badge> : null}
      </div>
      <p className="mt-1 font-mono text-[15px] font-semibold text-cx-ink">{licence?.licence_number || "Not issued yet"}</p>
      {licence?.expiry_date ? <p className="text-[13px] text-cx-muted">Valid until {date(licence.expiry_date)}</p> : null}
      {licence?.is_expired ? <p className="text-[13px] font-semibold text-cx-red">Expired</p> : null}
      {licence?.document_url ? (
        <Button variant="ghost" size="sm" icon={Eye} className="-ml-2 mt-1" onClick={() => onPreview(resolveMediaUrl(licence.document_url))}>View document</Button>
      ) : null}
    </div>
  );
}

export function LicenceSection({ application, onPreview }) {
  const a = application;
  return (
    <Collapsible title="Licence" icon={ClipboardList}>
      <div className="space-y-4">
        <InfoGrid>
          <Info label="Class" value={a.licence_class} />
          <Info label="Validity" value={a.validity_period} />
          <Info label="Driving school cert." value={a.driving_school_certificate_number} mono />
          <Info label="Processing area" value={[a.state_of_residence, a.lga].filter(Boolean).join(" / ")} />
        </InfoGrid>
        {a.temporary_licence || a.permanent_licence ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <LicenceCard title="Temporary licence" licence={a.temporary_licence} onPreview={onPreview} />
            <LicenceCard title="Permanent licence" licence={a.permanent_licence} onPreview={onPreview} />
          </div>
        ) : null}
      </div>
    </Collapsible>
  );
}

/* ── Vehicle & service details ──────────────────────────────────────── */

export function VehicleSection({ application, vehicle }) {
  const a = application;
  const ad = a.applicant_details || {};
  const v = vehicle || {};
  const make = v.make || a.vehicle_make || ad.vehicle_make;
  const model = v.model || a.vehicle_model || ad.vehicle_model;
  const year = v.year || a.year_of_manufacture || a.manufacturing_year || ad.year_of_manufacture;
  const chassis = v.chassis_number || a.chassis_number || ad.chassis_number;
  const plate = v.plate_number || a.plate_number;
  if (!vehicle && !make && !model && !chassis && !(a.vehicle_type || ad.vehicle_type)) return null;
  return (
    <Collapsible title="Vehicle" icon={Car} defaultOpen>
      <InfoGrid>
        <Info label="Make and model" value={[make, model].filter(Boolean).join(" ")} />
        <Info label="Year" value={year} />
        <Info label="Plate" value={plate || "New plate"} mono copy={!!plate} />
        <Info label="Chassis / VIN" value={chassis} mono copy wide />
        <Info label="Type" value={a.vehicle_type || v.vehicle_type || ad.vehicle_type} />
        <Info label="Body" value={a.vehicle_body_type || v.vehicle_category || ad.vehicle_body_type} />
        <Info label="Colour" value={v.colour || a.vehicle_colour || ad.vehicle_colour} />
        <Info label="Former plate" value={a.former_registration_number || ad.former_registration_number || "None"} mono />
        {v.engine_number ? <Info label="Engine number" value={v.engine_number} mono copy /> : null}
        {v.state ? <Info label="Registered in" value={v.state} /> : null}
        {a.use_type ? <Info label="Use" value={a.use_type} /> : null}
        {a.is_fancy_plate && a.fancy_plate_number ? <Info label="Requested plate" value={a.fancy_plate_number} mono /> : null}
        {a.previous_owner_details ? <Info label="Previous owner" value={a.previous_owner_details} wide /> : null}
        {a.justification ? <Info label="Justification" value={a.justification} wide /> : null}
      </InfoGrid>
    </Collapsible>
  );
}

export function ServiceDetails({ application, vehicle }) {
  const a = application;
  const type = a.application_type;
  let title = null;
  let grid = null;
  if (type === "number_plate_dealership") {
    title = "Dealership";
    grid = (
      <>
        <Info label="Dealership" value={a.dealership_name} />
        <Info label="Registered company" value={a.is_registered_company ? "Yes" : "No"} />
        <Info label="NIN" value={a.nin} mono />
        <Info label="Email" value={a.applicant_email} />
        {a.residential_address ? <Info label="Address" value={a.residential_address} wide /> : null}
      </>
    );
  } else if (type === "roadworthiness_express" && a.rwx_detail) {
    const r = a.rwx_detail;
    title = "Inspection booking";
    grid = (
      <>
        <Info label="Bay" value={r.bay?.name ? `${r.bay.name}${r.bay.address ? ` — ${r.bay.address}` : ""}` : null} wide />
        <Info label="Date" value={date(r.booking_date)} />
        <Info label="Time" value={r.slot?.label} />
        <Info label="Vehicle category" value={r.vehicle_category?.replace(/_/g, " ")} />
        {vehicle ? <Info label="Vehicle" value={`${vehicle.make} ${vehicle.model} — ${vehicle.plate_number}`} /> : null}
        {r.overall_verdict ? <Info label="Verdict" value={<span className={r.overall_verdict === "roadworthy" ? "text-cx-brand-deep" : "text-cx-red"}>{r.overall_verdict.replace(/_/g, " ")}</span>} /> : null}
      </>
    );
  } else if (type?.startsWith("vehicle_verification_") && a.verification_detail) {
    const d = a.verification_detail;
    title = "Verification";
    grid = (
      <>
        <Info label="Check" value={d.check_type?.replace(/_/g, " ")} />
        <Info label="Vehicle" value={`${d.make || ""} ${d.model || ""} — ${d.plate_number || ""}`} />
        <Info label="Reason" value={d.reason?.replace(/_/g, " ")} />
        {d.verdict ? <Info label="Verdict" value={<span className={["clear", "legitimate_complete"].includes(d.verdict) ? "text-cx-brand-deep" : "text-cx-red"}>{d.verdict.replace(/_/g, " ")}</span>} /> : null}
      </>
    );
  } else if (type === "physical_condition_inspection" && a.pci_detail) {
    const p = a.pci_detail;
    title = "Physical condition inspection";
    grid = (
      <>
        <Info label="Whose vehicle" value={p.whose_vehicle === "other" ? "Someone else's" : "The customer's"} />
        <Info label="Vehicle" value={`${p.make || ""} ${p.model || ""} — ${p.plate_number || ""}`} />
        <Info label="Category" value={p.vehicle_category?.replace(/_/g, " ")} />
        <Info label="Meeting place" value={p.location_address} wide />
        <Info label="Preferred" value={[date(p.preferred_date), p.preferred_time].filter(Boolean).join(" ")} />
        {p.confirmed_visit_date ? <Info label="Confirmed visit" value={[date(p.confirmed_visit_date), p.confirmed_visit_time].filter(Boolean).join(" ")} /> : null}
        {p.verdict ? <Info label="Verdict" value={p.verdict.replace(/_/g, " ")} /> : null}
        {p.report_text ? <Info label="Report" value={p.report_text} wide /> : null}
      </>
    );
  }
  if (!title) return null;
  return (
    <Card>
      <h2 className="mb-3 text-[16px] font-semibold text-cx-ink">{title}</h2>
      <InfoGrid>{grid}</InfoGrid>
    </Card>
  );
}

/* ── Vehicle papers items ───────────────────────────────────────────── */

export function ParticularsItems({ application, onReview, onPreview }) {
  const items = application.items || [];
  if (!items.length) return null;
  return (
    <Card padded={false}>
      <h2 className="px-4 pb-1 pt-4 text-[16px] font-semibold text-cx-ink sm:px-5">Documents in this request ({items.length})</h2>
      <ul className="divide-y divide-cx-line">
        {items.map((item) => {
          const meta = statusMeta(item.status);
          const finalDoc = (application.documents || []).find((d) => d.doc_type === `${item.document_type}_final`);
          return (
            <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-5">
              <div className="min-w-0">
                <p className="text-[15px] font-semibold capitalize text-cx-ink">{item.document_type?.replace(/_/g, " ")}</p>
                <p className="text-[13px] text-cx-muted">
                  {koboToNaira(item.price_kobo)}
                  {item.expiry_date ? ` · valid until ${date(item.expiry_date)}` : ""}
                </p>
                {item.status === "rejected" && item.final_review_note ? <p className="text-[13px] text-cx-red">Reason: {item.final_review_note}</p> : null}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={meta.tone}>{meta.label}</Badge>
                {finalDoc?.file_url ? <Button variant="ghost" size="sm" icon={Eye} onClick={() => onPreview(resolveMediaUrl(finalDoc.file_url))}>View</Button> : null}
                {item.status === "agent_completed" ? <Button size="sm" onClick={() => onReview(item)}>Review</Button> : null}
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

/* ── Documents ──────────────────────────────────────────────────────── */

export function DocumentsSection({ application, onPreview, onChanged }) {
  const pushToast = useToast();
  const [rejecting, setRejecting] = useState(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(null);

  const seen = new Set();
  const docs = (application.documents || []).filter((d) => {
    const key = `${d.doc_type}_${d.file_url || ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const review = async (doc, decision, reviewNote) => {
    setBusy(doc.id);
    const res = await staffReviewDocument(doc.id, { decision, note: decision === "rejected" ? reviewNote : undefined });
    setBusy(null);
    if (res.error) return pushToast({ tone: "error", title: "Couldn't update the document", body: res.error });
    pushToast({ tone: "success", title: decision === "approved" ? "Document approved" : "Document rejected" });
    setRejecting(null);
    onChanged();
  };

  return (
    <Collapsible title="Documents" icon={FileText} count={docs.length} defaultOpen>
      {docs.length === 0 ? (
        <p className="text-sm text-cx-muted">Nothing uploaded yet.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          {docs.map((doc, i) => {
            const url = resolveMediaUrl(doc.file_url);
            return (
              <li key={`${doc.doc_type}-${i}`} className="flex flex-col overflow-hidden rounded-cx border border-cx-line bg-cx-surface">
                <button type="button" onClick={() => onPreview(url)} className="cx-focus relative block aspect-[4/3] bg-cx-sunken" aria-label={`View ${doc.doc_type?.replace(/_/g, " ")}`}>
                  {isImage(doc.file_url) ? (
                    <img src={url} alt="" className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-cx-muted"><FileText className="h-8 w-8" aria-hidden /></span>
                  )}
                  <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-cx-surface/95 px-2 py-1 text-xs font-medium text-cx-ink shadow-cx"><Eye className="h-3.5 w-3.5" aria-hidden /> View</span>
                </button>
                <div className="flex flex-1 flex-col gap-1.5 p-2.5">
                  <p className="text-sm font-medium capitalize leading-snug text-cx-ink">{doc.doc_type?.replace(/_/g, " ")}</p>
                  {doc.status && doc.status !== "pending" ? <Badge tone={doc.status === "approved" ? "brand" : "red"} className="self-start">{doc.status}</Badge> : null}
                  {doc.uploaded_at ? <p className="text-xs text-cx-muted">{dateTime(doc.uploaded_at)}</p> : null}
                  {doc.id ? (
                    <div className="mt-auto grid grid-cols-2 gap-1.5 pt-1">
                      <button
                        type="button"
                        disabled={busy === doc.id}
                        onClick={() => review(doc, "approved")}
                        className={cx("cx-focus inline-flex min-h-10 items-center justify-center rounded-cx-sm border px-1 text-[13px] font-semibold disabled:opacity-60", doc.status === "approved" ? "border-cx-brand bg-cx-brand-soft text-cx-brand-deep" : "border-cx-line-strong text-cx-ink-2 hover:bg-cx-sunken")}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        disabled={busy === doc.id}
                        onClick={() => { setNote(""); setRejecting(doc); }}
                        className={cx("cx-focus inline-flex min-h-10 items-center justify-center rounded-cx-sm border px-1 text-[13px] font-semibold disabled:opacity-60", doc.status === "rejected" ? "border-cx-red bg-cx-red-soft text-cx-red" : "border-cx-line-strong text-cx-ink-2 hover:bg-cx-sunken")}
                      >
                        Reject
                      </button>
                    </div>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <Sheet
        open={!!rejecting}
        onOpenChange={(o) => !o && !busy && setRejecting(null)}
        title="Reject this document?"
        description={rejecting?.doc_type?.replace(/_/g, " ")}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setRejecting(null)} disabled={!!busy}>Cancel</Button>
            <Button block variant="danger" loading={!!busy} onClick={() => review(rejecting, "rejected", note.trim() || "Flagged during document review.")}>Reject document</Button>
          </>
        }
      >
        <Field label="What's wrong with it?" optional>
          {(p) => <Textarea {...p} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Photo is blurry, please upload a clearer copy." />}
        </Field>
      </Sheet>
    </Collapsible>
  );
}

/* ── Driving school ─────────────────────────────────────────────────── */

export function DrivingSchoolSection({ application, timeLeft, onPreview }) {
  const a = application;
  const enrolled = !!a.driving_school_enrolled_at;
  const hasCert = a.documents?.some((d) => d.doc_type === "driving_school_certificate");
  const certOnFile = hasCert && !enrolled;
  const slip =
    a.driving_school?.verification_image_url ||
    a.documents?.find((d) => ["driving_school_verification_slip", "driving_school_enrollment_screenshot", "driving_school_screenshot"].includes(d.doc_type))?.file_url;
  if (a.application_type !== "fresh" || (!enrolled && !certOnFile)) return null;

  const graduating = a.status === "driving_school_graduation" || (timeLeft.expired && a.status === "driving_school_enrolled");
  const target = a.driving_school_target_date || a.driving_school?.target_date;

  return (
    <Card>
      <h2 className="flex items-center gap-2 text-[16px] font-semibold text-cx-ink"><GraduationCap className="h-5 w-5 text-cx-muted" aria-hidden /> Driving school</h2>
      {certOnFile ? (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[15px] font-medium text-cx-ink">Certificate provided when applying</p>
            <p className="text-[13px] text-cx-muted">
              {a.driving_school?.certificate_received_at ? `Verified ${dateTime(a.driving_school.certificate_received_at)}.` : "Awaiting verification — enrollment skipped."}
            </p>
          </div>
          {a.driving_school?.certificate_url ? <Button variant="secondary" size="sm" icon={Eye} onClick={() => onPreview(resolveMediaUrl(a.driving_school.certificate_url))}>View</Button> : null}
        </div>
      ) : (
        <div className="mt-3 grid gap-4 lg:grid-cols-2">
          <div className="rounded-cx bg-cx-sunken p-3">
            <p className="text-[13px] text-cx-muted">School</p>
            <p className="text-[15px] font-semibold text-cx-ink">{a.driving_school?.name || "Accredited driving school"}</p>
            <div className="mt-2 flex items-center justify-between gap-2">
              <p className="text-[13px] text-cx-muted">Verification slip</p>
              {slip ? <Button variant="ghost" size="sm" icon={Eye} onClick={() => onPreview(resolveMediaUrl(slip))}>View</Button> : <span className="text-[13px] text-cx-muted">Not attached</span>}
            </div>
          </div>
          <div className="rounded-cx bg-cx-sunken p-3">
            <p className="text-[13px] text-cx-muted">26-day countdown</p>
            {graduating ? (
              <p className="mt-1 text-[15px] font-semibold text-cx-ink">Countdown complete — upload the school certificate.</p>
            ) : a.status === "driving_school_certificate_ready" ? (
              <p className="mt-1 text-[15px] font-semibold text-cx-brand-deep">Complete — ready to route to an agent.</p>
            ) : (
              <>
                <div className="mt-2 grid grid-cols-4 gap-1.5 text-center">
                  {[["Days", timeLeft.days], ["Hours", timeLeft.hours], ["Mins", timeLeft.minutes], ["Secs", timeLeft.seconds]].map(([l, v]) => (
                    <div key={l} className="rounded-cx-sm bg-cx-surface py-2">
                      <span className="block font-mono text-lg font-semibold text-cx-ink">{v}</span>
                      <span className="block text-xs text-cx-muted">{l}</span>
                    </div>
                  ))}
                </div>
                {target ? <p className="mt-2 text-[13px] text-cx-muted">Target {dateTime(String(target).includes("T") ? target : `${target}T23:59:59`)}</p> : null}
              </>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}

/* ── Activity timeline ──────────────────────────────────────────────── */

export function TimelineSection({ application }) {
  const events = [...(application.events || [])].sort((x, y) => new Date(y.created_at || 0) - new Date(x.created_at || 0));
  return (
    <Collapsible title="Activity" icon={History} count={events.length}>
      {events.length === 0 ? (
        <p className="text-sm text-cx-muted">No activity recorded yet.</p>
      ) : (
        <ol className="relative space-y-4 border-l border-cx-line pl-5">
          {events.map((e, i) => {
            const meta = statusMeta(e.new_status);
            return (
              <li key={e.id || i} className="relative">
                <span className={cx("absolute -left-[26px] top-1.5 h-3 w-3 rounded-full ring-4 ring-cx-surface", i === 0 ? "bg-cx-brand" : "bg-cx-line-strong")} aria-hidden />
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={meta.tone}>{meta.label}</Badge>
                  <span className="text-[13px] text-cx-muted">{dateTime(e.created_at)}</span>
                </div>
                {e.note ? <p className="mt-1 text-[15px] text-cx-ink-2">{e.note}</p> : null}
              </li>
            );
          })}
        </ol>
      )}
    </Collapsible>
  );
}

