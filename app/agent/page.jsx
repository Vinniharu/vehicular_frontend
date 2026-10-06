"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, ChevronRight, ClipboardList, Hourglass, Inbox, MapPin, RefreshCw, Wallet } from "lucide-react";
import {
  acceptOffer,
  acceptParticularsOffer,
  authGetMe,
  declineOffer,
  declineParticularsOffer,
  getAgentApplications,
  getAgentOffers,
  getAgentParticularsOffers,
  getAgentWallet,
  koboToNaira,
} from "@/lib/api";
import { hasAgentUploadedAllDocuments } from "@/lib/utils/sla";
import { Button, Card, EmptyState, ErrorState, Field, Notice, PageHeader, Sheet, SkeletonList, Textarea } from "@/app/dashboard/_kit";
import { useToast } from "@/app/components/shared/ToastProvider";
import { PARTICULAR_DOC_LABELS, jobStage, serviceLabel } from "./_components/jobs";

const MAX_ACTIVE_JOBS = 10;
const ACTIVE_STATUSES = ["agent_accepted", "agent_assigned", "in_progress", "in_process", "capture_scheduled", "capturing_scheduled", "captured", "capturing_completed", "needs_correction"];

// Mirrors the backend job cap: jobs the agent still owes work on.
function countsTowardCap(app) {
  return ACTIVE_STATUSES.includes(app?.status) && !hasAgentUploadedAllDocuments(app);
}

function rawId(id) {
  return typeof id === "string" ? id.replace(/^(app_|offer_)/, "") : id;
}

export default function AgentOffersPage() {
  const router = useRouter();
  const pushToast = useToast();
  const [offers, setOffers] = useState(null);
  const [apps, setApps] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [acting, setActing] = useState(null);
  const [declining, setDeclining] = useState(null);
  const [reason, setReason] = useState("");

  const load = async (quiet = false) => {
    if (quiet) setRefreshing(true);
    setError(null);
    const [offersRes, partRes, appsRes, walletRes, meRes] = await Promise.all([
      getAgentOffers(),
      getAgentParticularsOffers(),
      getAgentApplications(),
      getAgentWallet(),
      authGetMe(),
    ]);
    if (offersRes.error && partRes.error) setError(offersRes.error);
    const jobOffers = (Array.isArray(offersRes.data) ? offersRes.data : []).map((o) => ({ ...o, kind: "job" }));
    const docOffers = (Array.isArray(partRes.data) ? partRes.data : [])
      .filter((o) => !o.status || o.status === "offered")
      .map((o) => ({ ...o, kind: "particulars" }));
    setOffers([...jobOffers, ...docOffers]);
    if (Array.isArray(appsRes.data)) setApps(appsRes.data);
    if (walletRes.data) setWallet(walletRes.data);
    if (meRes.data) setProfile(meRes.data);
    setRefreshing(false);
  };

  useEffect(() => {
    load();
  }, []);

  const active = apps.filter(countsTowardCap).length;
  const atCap = active >= MAX_ACTIVE_JOBS;
  const todo = apps.filter((a) => jobStage(a).bucket === "todo").length;

  const accept = async (offer) => {
    setActing(offer.id);
    const res = offer.kind === "particulars" ? await acceptParticularsOffer(offer.id) : await acceptOffer(offer.id);
    setActing(null);
    if (res.error) return pushToast({ tone: "error", title: "Couldn't accept this offer", body: res.error });
    pushToast({ tone: "success", title: "Job accepted", body: "Here's what to do next." });
    const appId = rawId(res.data?.application_id ?? offer.application_id);
    router.push(offer.application_type === "roadworthiness_express" ? `/agent/rwx/${appId}` : `/agent/applications/${appId}`);
  };

  const confirmDecline = async () => {
    const offer = declining;
    setActing(offer.id);
    const res = offer.kind === "particulars" ? await declineParticularsOffer(offer.id) : await declineOffer(offer.id, { reason: reason.trim() || undefined });
    setActing(null);
    if (res.error) return pushToast({ tone: "error", title: "Couldn't decline this offer", body: res.error });
    setDeclining(null);
    pushToast({ tone: "success", title: "Offer declined", body: "It goes to other agents in your area." });
    await load(true);
  };

  const relocation = profile?.agent_profile;

  return (
    <div>
      <PageHeader
        title="Job offers"
        description="New jobs in your area. Accept one to start working on it."
        actions={
          <Button variant="secondary" size="sm" icon={RefreshCw} loading={refreshing} onClick={() => load(true)}>
            Refresh
          </Button>
        }
      />

      <div className="mb-5 grid grid-cols-3 gap-2 sm:gap-3">
        <Link href="/agent/applications" className="cx-focus rounded-cx-lg border border-cx-line bg-cx-surface p-3 shadow-cx hover:border-cx-brand/50 sm:p-4">
          <ClipboardList className="h-5 w-5 text-cx-amber" aria-hidden />
          <p className="mt-2 text-2xl font-semibold text-cx-ink">{offers ? todo : "—"}</p>
          <p className="text-[13px] text-cx-muted">Jobs to do</p>
        </Link>
        <Link href="/agent/applications" className={`cx-focus rounded-cx-lg border p-3 shadow-cx sm:p-4 ${atCap ? "border-cx-red/40 bg-cx-red-soft" : "border-cx-line bg-cx-surface hover:border-cx-brand/50"}`}>
          <Hourglass className={`h-5 w-5 ${atCap ? "text-cx-red" : "text-cx-muted"}`} aria-hidden />
          <p className="mt-2 text-2xl font-semibold text-cx-ink">{offers ? `${active}/${MAX_ACTIVE_JOBS}` : "—"}</p>
          <p className="text-[13px] text-cx-muted">Active jobs</p>
        </Link>
        <Link href="/agent/wallet" className="cx-focus rounded-cx-lg border border-cx-line bg-cx-surface p-3 shadow-cx hover:border-cx-brand/50 sm:p-4">
          <Wallet className="h-5 w-5 text-cx-brand" aria-hidden />
          <p className="mt-2 truncate text-xl font-semibold text-cx-ink sm:text-2xl">{wallet ? koboToNaira(wallet.total_income_kobo || 0) : "—"}</p>
          <p className="text-[13px] text-cx-muted">Total earned</p>
        </Link>
      </div>

      <div className="space-y-3">
        {relocation?.relocation_status === "pending" ? (
          <Notice tone="amber" icon={Hourglass} title="Relocation waiting for approval">
            You asked to move to {relocation.pending_vio_office} in {relocation.pending_lga}, {relocation.pending_state}. Offers keep coming from your current area until an admin approves it.
          </Notice>
        ) : null}
        {atCap ? (
          <Notice tone="red" title={`You have ${active} active jobs`}>
            The limit is {MAX_ACTIVE_JOBS}. Finish some jobs before accepting new ones.
          </Notice>
        ) : null}

        {error && !offers ? (
          <ErrorState message={error} onRetry={() => load()} />
        ) : !offers ? (
          <SkeletonList rows={3} />
        ) : offers.length === 0 ? (
          <EmptyState icon={Inbox} title="No offers right now" description="New jobs routed to your area appear here. We also text you when one arrives." />
        ) : (
          <ul className="space-y-3">
            {offers.map((offer) => {
              const isDoc = offer.kind === "particulars";
              const earn = isDoc ? offer.agent_compensation_kobo : offer.service_fee_kobo;
              return (
                <li key={`${offer.kind}-${offer.id}`}>
                  <Card>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm text-cx-muted">Job #{rawId(offer.application_id)}</p>
                        <p className="mt-0.5 text-[17px] font-semibold text-cx-ink">
                          {isDoc ? `Vehicle papers: ${(PARTICULAR_DOC_LABELS[offer.document_type] || offer.document_type || "").toLowerCase()}` : serviceLabel(offer.application_type)}
                        </p>
                        <p className="mt-1 flex items-center gap-1.5 text-sm text-cx-muted">
                          <MapPin className="h-4 w-4" aria-hidden />
                          {offer.lga || offer.state || "Your area"}
                          {!isDoc && offer.application_type === "vehicle_particulars" && offer.items_count ? ` · ${offer.items_count} documents` : ""}
                        </p>
                      </div>
                      {earn > 0 ? (
                        <div className="shrink-0 text-right">
                          <p className="text-[13px] text-cx-muted">You earn</p>
                          <p className="text-lg font-semibold text-cx-brand-deep">{koboToNaira(earn)}</p>
                        </div>
                      ) : null}
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:justify-end">
                      <Button variant="secondary" disabled={acting === offer.id} onClick={() => { setReason(""); setDeclining(offer); }}>
                        Decline
                      </Button>
                      <Button
                        icon={CheckCircle2}
                        loading={acting === offer.id}
                        disabled={atCap}
                        title={atCap ? `You've reached the ${MAX_ACTIVE_JOBS}-job limit` : undefined}
                        onClick={() => accept(offer)}
                      >
                        Accept
                      </Button>
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}

        {offers && todo > 0 ? (
          <Link href="/agent/applications" className="cx-focus flex min-h-14 items-center justify-between rounded-cx-lg bg-cx-brand-soft px-4 text-[15px] font-semibold text-cx-brand-deep">
            You have {todo} job{todo === 1 ? "" : "s"} to do
            <ChevronRight className="h-5 w-5" aria-hidden />
          </Link>
        ) : null}
      </div>

      <Sheet
        open={!!declining}
        onOpenChange={(o) => !o && acting === null && setDeclining(null)}
        title="Decline this offer?"
        description="It goes to other agents in your area. You can't undo this."
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeclining(null)} disabled={acting !== null}>Keep it</Button>
            <Button block variant="danger" loading={acting !== null} onClick={confirmDecline}>Decline offer</Button>
          </>
        }
      >
        {declining?.kind !== "particulars" ? (
          <Field label="Reason" optional>
            {(p) => <Textarea {...p} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Too far from my office" />}
          </Field>
        ) : (
          <p className="text-sm text-cx-muted">The document offer will be sent to another agent.</p>
        )}
      </Sheet>
    </div>
  );
}
