"use client";

// Staff application review page. One "next step" with a single primary
// action for the current status, other valid actions underneath, then the
// application details. Every action and its gate matches the previous page.

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  AlertTriangle,
  Building,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Download,
  Eye,
  Image as ImageIcon,
  RefreshCw,
  Send,
  ShieldCheck,
  Upload,
  UserCheck,
  X,
  Zap,
} from "lucide-react";
import Link from "next/link";
import {
  downloadStaffBiodataPdf,
  getCachedUser,
  getStaffApplication,
  getSupportAgentChat,
  getVehicle,
  koboToNaira,
  resolveMediaUrl,
  sendSupportAgentChatMessage,
  staffClaimApplication,
  staffMarkDrivingSchoolCountdownExpired,
} from "@/lib/api";
import { hasAgentUploadedAllDocuments } from "@/lib/utils/sla";
import { Badge, Button, Card, ErrorState, Notice } from "@/app/dashboard/_kit";
import { useToast } from "@/app/components/shared/ToastProvider";
import { SlaChip, Spinner } from "@/app/components/portal/ui";
import DocumentPreviewModal from "@/app/components/design/DocumentPreviewModal";
import AgentChatPanel from "@/app/components/design/AgentChatPanel";
import { serviceLabel } from "@/app/agent/_components/jobs";
import { statusMeta } from "../../_components/status";
import ActionSheet from "./_components/ActionSheet";
import PciScheduleSheet from "./_components/PciScheduleSheet";
import AgentAssignment from "./_components/AgentAssignment";
import {
  ApplicantSection,
  DocumentsSection,
  DrivingSchoolSection,
  LicenceSection,
  ParticularsItems,
  PaymentSection,
  ServiceDetails,
  TimelineSection,
  VehicleSection,
} from "./_components/Sections";

const cx = (...parts) => parts.filter(Boolean).join(" ");
const DL_TYPES = ["fresh", "renewal", "reissue", "international_permit"];
const NO_PICKUP_TYPES = ["tinted_permit", "central_motor_registry", "roadworthiness_express", "vehicle_particulars", "physical_condition_inspection"];

function useCountdown(application, setApplication) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: false });
  useEffect(() => {
    const raw = application?.driving_school_target_date || application?.driving_school?.target_date;
    if (!raw) return;
    let s = String(raw);
    if (!s.includes("T")) s += "T23:59:59";
    const target = new Date(s).getTime();
    if (isNaN(target)) return;
    let fired = false;
    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: true });
        // Once the countdown ends while still enrolled, move the application
        // to the graduation stage so it stays visible to staff.
        if (!fired && application?.status === "driving_school_enrolled") {
          fired = true;
          staffMarkDrivingSchoolCountdownExpired(application.id).then((res) => {
            if (!res.error && res.data) setApplication(res.data);
          });
        }
      } else {
        setTimeLeft({
          days: Math.floor(diff / 86400000),
          hours: Math.floor((diff % 86400000) / 3600000),
          minutes: Math.floor((diff % 3600000) / 60000),
          seconds: Math.floor((diff % 60000) / 1000),
          expired: false,
        });
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [application, setApplication]);
  return timeLeft;
}

/** What staff should do now: { title, body, primary, secondary[] }. */
function plan(app, { isPaid, hasMin, hasCert, open, openPci }) {
  const type = app.application_type || "";
  const status = app.status;
  const isParticulars = type === "vehicle_particulars";
  const isPci = type === "physical_condition_inspection";
  const isRwx = type === "roadworthiness_express";
  const area = app.lga || app.state_of_residence || "the applicant's area";
  const po = app.payment_options || {};
  const needMin = hasMin
    ? null
    : po.deposit_shortfall_kobo > 0 && po.required_deposit_kobo
    ? `Waiting for ${koboToNaira(po.deposit_shortfall_kobo)} more to reach the ${koboToNaira(po.required_deposit_kobo)} deposit. An admin can allow it to proceed.`
    : "Waiting for the deposit to be paid.";
  const needFull = isPaid ? null : po.deposit_waived ? "Deposit waived by admin, but it needs full payment before it can go to an agent." : "Waiting for full payment.";
  const reject = { label: "Reject application", description: "The applicant sees your reason and can resubmit", icon: X, tone: "red", onClick: () => open("reject") };

  const freshFront = () =>
    hasCert
      ? { title: "Verify the driving school certificate and route", primary: { label: "Verify and route", icon: CheckCircle2, onClick: () => open("confirm-cert"), blocked: needMin } }
      : { title: "Enroll the applicant in driving school", primary: { label: "Enroll in driving school", icon: Building, onClick: () => open("enroll"), blocked: needMin } };

  if (status === "submitted") {
    if (type === "fresh") return { ...freshFront(), body: "Check the NIN and biodata first.", secondary: [reject] };
    return { title: "Check the documents and approve", body: "Check identity, NIN and documents.", primary: { label: "Approve and verify", icon: CheckCircle2, onClick: () => open("approve"), blocked: needMin }, secondary: [reject] };
  }
  if (status === "staff_review") {
    if (isParticulars) return { title: "Release the documents to agents", primary: { label: "Release to agents", icon: Send, onClick: () => open("release-particulars"), blocked: needFull }, secondary: [reject] };
    if (isPci) return { title: "Schedule the mechanic's visit", primary: { label: "Schedule visit", icon: Calendar, onClick: openPci, blocked: needFull }, secondary: [reject] };
    if (type !== "fresh") return { title: `Route to agents in ${area}`, body: "Once documents are verified and payment is complete.", primary: { label: "Route to agents", icon: Send, onClick: () => open("route"), blocked: needFull }, secondary: [reject] };
    return { ...freshFront(), secondary: [reject] };
  }
  if (status === "driving_school_enrolled" || status === "driving_school_graduation") {
    return { title: status === "driving_school_graduation" ? "Upload the driving school certificate" : "In driving school — upload the certificate when it arrives", primary: { label: "Upload certificate", icon: Upload, onClick: () => open("upload-cert") } };
  }
  if (status === "driving_school_certificate_ready") {
    return { title: `Route to agents in ${area}`, primary: { label: "Route to agents", icon: Send, onClick: () => open("route"), blocked: needFull ? "Waiting for full payment — it routes automatically once paid." : null } };
  }
  if (status === "temp_licence_pending_review") return { title: "Review the agent's temporary licence", body: "Approving shows it to the customer.", primary: { label: "Review temporary licence", icon: ShieldCheck, onClick: () => open("review-temp-licence") } };
  if (status === "agent_completed") return { title: "Check the agent's finished work", body: "Approve to release it to the customer, or send it back.", primary: { label: "Start final review", icon: ShieldCheck, onClick: () => open("final-review") } };
  if (isPci && status === "visit_scheduled") {
    return {
      title: "The mechanic is working through the checklist",
      body: "Watch the checklist and confirm it's complete when every item is in.",
      primary: { label: "Open checklist", icon: ClipboardCheck, href: `/staff/physical-condition-inspection/${app.id}` },
      secondary: [{ label: "Reschedule visit", icon: Calendar, onClick: openPci }],
    };
  }
  if (isPci && status === "awaiting_mechanic_verdict") {
    return {
      title: "Record the reviewing mechanic's verdict",
      body: "Releases the report to the customer.",
      primary: { label: "Record verdict", icon: ShieldCheck, href: `/staff/physical-condition-inspection/${app.id}/verdict` },
      secondary: [{ label: "Reopen for more evidence", icon: Calendar, onClick: openPci }],
    };
  }
  if (!NO_PICKUP_TYPES.includes(type) && !type.startsWith("number_plate_") && !type.startsWith("vehicle_verification_") && ["captured", "capturing_completed"].includes(status)) {
    return { title: "Tell the customer their card is ready", primary: { label: "Mark ready for pickup", icon: Send, onClick: () => open("ready-for-pickup") } };
  }
  if (status === "awaiting_customer" && !isRwx) {
    return {
      title: "Close out once the finished document is in hand",
      body: app.dispatched_at ? `Dispatched by ${app.dispatched_by || "—"} on ${new Date(app.dispatched_at).toLocaleString("en-NG")}.${app.tracking_note ? ` Note: ${app.tracking_note}` : ""}` : "Record who dispatched it, then mark it received.",
      primary: { label: "Mark as received", icon: CheckCircle2, onClick: () => open("confirm-receipt") },
      secondary: [{ label: "Record dispatch", description: "Who sent it and a note for the customer", icon: Send, onClick: () => open("push-to-customer") }],
    };
  }
  if (status === "awaiting_customer" && isRwx) return { title: "Certificate issued — waiting for the customer to confirm", waiting: true };
  if (status === "completed") return { title: "Completed", body: "The customer has been told.", waiting: true };
  if (status === "expired") return { title: "Licence expired", body: "The customer has been asked to renew. Nothing to do here.", waiting: true };
  if (status === "staff_rejected") return { title: "Rejected — waiting for the applicant to resubmit", waiting: true };
  return { title: statusMeta(status).label, body: "Nothing for staff to do right now.", waiting: true };
}

export default function StaffApplicationPage() {
  const params = useParams();
  const pushToast = useToast();
  const rawId = params?.id ? String(params.id).replace(/^app_/, "") : null;
  const appId = rawId && !isNaN(Number(rawId)) ? Number(rawId) : rawId;
  const currentUser = getCachedUser();

  const [application, setApplication] = useState(null);
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(null);
  const [action, setAction] = useState(null); // { type, item? }
  const [pciOpen, setPciOpen] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const load = async (quiet = false) => {
    if (!appId) return setLoading(false);
    quiet ? setRefreshing(true) : setLoading(true);
    setError(null);
    const res = await getStaffApplication(appId);
    if (res.error) setError(res.error);
    else if (res.data) setApplication(res.data);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appId]);

  useEffect(() => {
    if (!application) return;
    if (application.vehicle) setVehicle(application.vehicle);
    else if (application.vehicle_id) getVehicle(application.vehicle_id).then((res) => res.data && setVehicle(res.data));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [application?.id, application?.vehicle_id]);

  const timeLeft = useCountdown(application, setApplication);

  const claim = async () => {
    setClaiming(true);
    const res = await staffClaimApplication(application.id);
    setClaiming(false);
    if (res.error) return pushToast({ tone: "error", title: "Couldn't claim this application", body: res.error });
    pushToast({ tone: "success", title: "Claimed — it's yours now" });
    load(true);
  };

  const download = async () => {
    setDownloading(true);
    try {
      await downloadStaffBiodataPdf(application.id);
    } catch (err) {
      pushToast({ tone: "error", title: "Couldn't download the PDF", body: err?.message === "Failed to fetch" ? "Check your connection and try again." : err?.message });
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return <Spinner label="Loading application…" />;
  if (error || !application) {
    const restricted = /handled by another staff|assigned to another staff|not authorized|forbidden/i.test(error || "");
    return (
      <div className="mx-auto max-w-md pt-6">
        <ErrorState title={restricted ? "Another staff member has this application" : "Application not found"} message={error || "This application couldn't be loaded."} onRetry={restricted ? undefined : () => load()} />
        <div className="mt-4 text-center"><Button variant="ghost" href="/staff/applications">Back to review queue</Button></div>
      </div>
    );
  }

  const app = application;
  const type = app.application_type || "fresh";
  const isDl = DL_TYPES.includes(type);
  const isPaid = app.payment_status === "success" || app.payment_options?.payment_status === "success";
  // The minimum deposit comes from the service's own pricing (backend).
  const hasMin = isPaid || !!app.payment_options?.has_minimum_payment;
  const hasCert = app.documents?.some((d) => d.doc_type === "driving_school_certificate");
  const claimed = !!app.assigned_staff;
  const mine = app.assigned_staff?.user_id === currentUser?.id;
  const meta = statusMeta(app.status);
  const name = [app.first_name || app.applicant_details?.first_name, app.middle_name || app.applicant_details?.middle_name, app.last_name || app.applicant_details?.last_name].filter(Boolean).join(" ") || "Applicant";
  const photo = app.passport_photo || app.applicant_details?.passport_photo || app.documents?.find((d) => d.doc_type === "passport_photo")?.file_url;
  const isVehicleCentric = !isDl;
  const showSla = isPaid && app.sla && !app.sla.is_completed && !hasAgentUploadedAllDocuments(app);

  const step = claimed
    ? plan(app, { isPaid, hasMin, hasCert, open: (t) => setAction({ type: t }), openPci: () => setPciOpen(true) })
    : { title: "Claim this application to work on it", body: "Once claimed, only you can act on it.", primary: { label: "Claim application", icon: UserCheck, onClick: claim, loading: claiming } };
  const p = step.primary;

  return (
    <div className="mx-auto max-w-5xl">
      <DocumentPreviewModal isOpen={!!preview} onClose={() => setPreview(null)} fileUrl={preview} />

      <header className="mb-5">
        <Link href="/staff/applications" className="cx-focus -ml-2 mb-2 inline-flex min-h-11 items-center gap-1 rounded-cx px-2 text-sm font-medium text-cx-muted hover:text-cx-ink">
          <ChevronLeft className="h-4 w-4" aria-hidden /> Review queue
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <button
              type="button"
              onClick={() => photo && setPreview(resolveMediaUrl(photo))}
              disabled={!photo}
              aria-label={photo ? "View passport photo" : "No passport photo"}
              className="cx-focus flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-cx border border-cx-line bg-cx-sunken text-cx-muted"
            >
              {photo ? <img src={resolveMediaUrl(photo)} alt="" className="h-full w-full object-cover" /> : <ImageIcon className="h-6 w-6" aria-hidden />}
            </button>
            <div className="min-w-0">
              <p className="text-sm font-medium text-cx-muted">{serviceLabel(type)} · #{app.id}</p>
              <h1 className="font-display text-[26px] leading-tight text-cx-ink sm:text-[30px]">{name}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge tone={meta.tone}>{meta.label}</Badge>
                {claimed ? <Badge tone={mine ? "brand" : "neutral"}><UserCheck className="h-3.5 w-3.5" aria-hidden />{mine ? "Claimed by you" : app.assigned_staff.name}</Badge> : <Badge tone="amber">Unclaimed</Badge>}
                {app.is_urgent ? <Badge tone="amber"><Zap className="h-3.5 w-3.5" aria-hidden />Fast Track</Badge> : null}
                {showSla ? <SlaChip sla={app.sla} /> : null}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" icon={Download} loading={downloading} onClick={download}>Biodata PDF</Button>
            <Button variant="secondary" size="sm" icon={RefreshCw} loading={refreshing} onClick={() => load(true)}>Refresh</Button>
          </div>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <div className="space-y-4 lg:order-2 lg:sticky lg:top-24">
          <Card className={cx("relative overflow-hidden", !step.waiting && "border-cx-brand/40")}>
            <span className={cx("absolute inset-y-0 left-0 w-1", step.waiting ? "bg-cx-line-strong" : "bg-cx-brand")} aria-hidden />
            <p className="text-[13px] font-semibold text-cx-muted">{step.waiting ? "Status" : "Next step"}</p>
            <h2 className="mt-1 text-[19px] font-semibold leading-snug text-cx-ink">{step.title}</h2>
            {step.body ? <p className="mt-1.5 text-[15px] text-cx-ink-2">{step.body}</p> : null}
            {p ? (
              <div className="mt-4">
                {p.href ? (
                  <Button size="lg" block icon={p.icon} href={p.href}>{p.label}</Button>
                ) : (
                  <Button size="lg" block icon={p.icon} loading={p.loading} disabled={!!p.blocked} onClick={p.onClick}>{p.label}</Button>
                )}
                {p.blocked ? <p className="mt-2 flex items-start gap-1.5 text-[13px] text-cx-amber"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />{p.blocked}</p> : null}
              </div>
            ) : null}
          </Card>

          {step.secondary?.length ? (
            <Card padded={false}>
              <h2 className="px-4 pb-1 pt-4 text-[15px] font-semibold text-cx-ink">Other actions</h2>
              <ul className="divide-y divide-cx-line">
                {step.secondary.map((a) => {
                  const Icon = a.icon;
                  return (
                    <li key={a.label}>
                      <button type="button" onClick={a.onClick} className="cx-focus flex min-h-[56px] w-full items-center gap-3 px-4 py-3 text-left hover:bg-cx-sunken">
                        <span className={cx("flex h-9 w-9 shrink-0 items-center justify-center rounded-full", a.tone === "red" ? "bg-cx-red-soft text-cx-red" : "bg-cx-sunken text-cx-ink-2")}>
                          <Icon className="h-4 w-4" aria-hidden />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className={cx("block text-[15px] font-semibold", a.tone === "red" ? "text-cx-red" : "text-cx-ink")}>{a.label}</span>
                          {a.description ? <span className="block text-[13px] text-cx-muted">{a.description}</span> : null}
                        </span>
                        <ChevronRight className="h-4 w-4 text-cx-muted" aria-hidden />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </Card>
          ) : null}

          {DL_TYPES.slice(1).includes(type) && app.status === "awaiting_customer" ? (
            <Notice
              title="Document ready for pickup"
              action={app.permanent_licence?.document_url ? <Button variant="secondary" size="sm" icon={Eye} onClick={() => setPreview(resolveMediaUrl(app.permanent_licence.document_url))}>View the agent's upload</Button> : null}
            >
              Collect the finished card from the agent's office{app.assigned_agent?.lga || app.assigned_agent?.state ? ` (${[app.assigned_agent?.lga, app.assigned_agent?.state].filter(Boolean).join(", ")})` : ""}.
            </Notice>
          ) : null}

          <AgentAssignment application={app} onChanged={() => load(true)} />
        </div>

        <div className="space-y-4 lg:order-1">
          <PaymentSection application={app} isPaid={isPaid} />
          <DrivingSchoolSection application={app} timeLeft={timeLeft} onPreview={setPreview} />
          <ServiceDetails application={app} vehicle={vehicle} />
          {type === "vehicle_particulars" ? <ParticularsItems application={app} onPreview={setPreview} onReview={(item) => setAction({ type: "particulars-item-review", item })} /> : null}
          {isVehicleCentric ? <VehicleSection application={app} vehicle={vehicle} /> : null}
          <ApplicantSection application={app} isDl={isDl} />
          {isDl ? <LicenceSection application={app} onPreview={setPreview} /> : null}
          <DocumentsSection application={app} onPreview={setPreview} onChanged={() => load(true)} />
          <TimelineSection application={app} />
          {app.assigned_agent_id ? (
            <Card>
              <h2 className="mb-3 text-[16px] font-semibold text-cx-ink">Chat with the agent</h2>
              <AgentChatPanel
                myRole="support"
                headerLabel="Chat with the assigned agent"
                loadThread={() => getSupportAgentChat(app.id)}
                sendMessage={(body) => sendSupportAgentChatMessage(app.id, { body })}
              />
            </Card>
          ) : null}
        </div>
      </div>

      <ActionSheet
        type={action?.type}
        item={action?.item}
        application={app}
        onClose={() => setAction(null)}
        onPreview={setPreview}
        onDone={(title) => {
          setAction(null);
          pushToast({ tone: "success", title, body: `Application #${app.id} updated.` });
          load(true);
        }}
      />
      <PciScheduleSheet
        open={pciOpen}
        application={app}
        onClose={() => setPciOpen(false)}
        onDone={() => {
          setPciOpen(false);
          pushToast({ tone: "success", title: "Visit saved" });
          load(true);
        }}
      />
    </div>
  );
}
