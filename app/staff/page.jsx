"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  ChevronRight,
  Truck,
  RefreshCw,
  CheckSquare,
  ListFilter,
  Timer,
  Flag,
  GraduationCap,
  ClipboardList,
  Clock,
  Inbox,
  Route,
} from "lucide-react";
import { getStaffQueue, getStaffCounts } from "@/lib/api";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Notice,
  PageHeader,
  SectionTitle,
  SkeletonList,
} from "@/app/dashboard/_kit";
import { StatTile } from "@/app/admin/_kit";
import { statusMeta } from "@/app/staff/_components/status";
import { serviceLabel } from "@/app/agent/_components/jobs";

const cx = (...parts) => parts.filter(Boolean).join(" ");

function applicantName(app) {
  return [app.last_name, app.first_name, app.middle_name].filter(Boolean).join(" ") || app.applicant_name || "—";
}

function PipelineBar({ label, count, pct, tone = "brand" }) {
  const bar = { brand: "bg-cx-brand", amber: "bg-cx-amber", neutral: "bg-cx-ink-2" }[tone];
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <span className="text-sm text-cx-ink-2">{label}</span>
        <span className="shrink-0 text-sm font-semibold text-cx-ink">
          {count} <span className="font-normal text-cx-muted">({pct}%)</span>
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-cx-sunken">
        <div className={cx("h-full rounded-full transition-all duration-500", bar)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function PriorityLink({ href, icon: Icon, tone = "brand", title, count, body, action }) {
  const iconCls = {
    brand: "bg-cx-brand-soft text-cx-brand-deep",
    amber: "bg-cx-amber-soft text-cx-amber",
    neutral: "bg-cx-sunken text-cx-ink-2",
  }[tone];
  return (
    <li>
      <Link
        href={href}
        className="cx-focus group flex items-start gap-3 rounded-cx-lg border border-cx-line bg-cx-surface p-4 transition-colors hover:border-cx-brand/50"
      >
        <span className={cx("flex h-10 w-10 shrink-0 items-center justify-center rounded-full", iconCls)}>
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center justify-between gap-2">
            <span className="text-[15px] font-semibold text-cx-ink">{title}</span>
            <Badge tone={count > 0 ? tone : "neutral"}>{count}</Badge>
          </span>
          <span className="mt-0.5 block text-sm text-cx-muted">{body}</span>
          <span className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-cx-brand-deep">
            {action}
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </span>
        </span>
      </Link>
    </li>
  );
}

export default function StaffStatsDashboardPage() {
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    const [queueRes, countsRes] = await Promise.all([
      getStaffQueue({ page: 1, page_size: 100 }),
      getStaffCounts(),
    ]);

    if (queueRes.error) {
      setError(queueRes.error);
    } else if (Array.isArray(queueRes.data?.items)) {
      setApplications(queueRes.data.items);
    }

    if (countsRes.data) {
      setStats(countsRes.data);
    }

    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute stats
  const counts = useMemo(() => {
    const total = stats?.all ?? applications.length;
    const submitted = stats?.submitted ?? applications.filter((a) => a.status === "submitted").length;
    const staff_review = stats?.staff_review ?? applications.filter((a) => a.status === "staff_review").length;
    const driving_school_countdown = stats?.driving_school_countdown ?? applications.filter((a) => a.status === "driving_school_enrolled").length;
    const driving_school_graduation = stats?.driving_school_graduation ?? applications.filter((a) => a.status === "driving_school_graduation").length;
    const graduated = stats?.graduated ?? applications.filter((a) => a.status === "driving_school_certificate_ready").length;
    // Total driving school includes both countdown and graduated (and cert ready)
    const driving_school = stats?.driving_school ?? (driving_school_countdown + driving_school_graduation + graduated);
    const routed = stats?.routed ?? applications.filter((a) => a.status === "routed").length;
    const needsFinalReview = stats?.needs_final_review ?? applications.filter((a) => ["agent_completed", "staff_final_review"].includes(a.status)).length;
    const awaitingCustomer = stats?.awaiting_customer ?? applications.filter((a) => a.status === "awaiting_customer").length;
    const flagged = stats?.flagged ?? applications.filter((a) => a.status === "staff_rejected" || a.status === "needs_correction").length;

    const calcPct = (cnt) => (total > 0 ? Math.round((cnt / total) * 100) : 0);

    return {
      all: total,
      submitted,
      staff_review,
      driving_school,
      driving_school_countdown,
      driving_school_graduation,
      graduated,
      routed,
      needsFinalReview,
      awaitingCustomer,
      flagged,
      pctSubmitted: calcPct(submitted),
      pctReview: calcPct(staff_review),
      pctDriving: calcPct(driving_school),
      pctDrivingCountdown: calcPct(driving_school_countdown),
      pctDrivingGraduation: calcPct(driving_school_graduation),
      pctGraduated: calcPct(graduated),
      pctRouted: calcPct(routed),
    };
  }, [applications, stats]);

  // Top recent applications requiring action
  const recentActionApps = useMemo(() => {
    return applications
      .filter((a) =>
        [
          "submitted",
          "staff_review",
          "driving_school_graduation",
          "driving_school_certificate_ready",
          "agent_completed",
          "awaiting_customer",
        ].includes(a.status)
      )
      .slice(0, 6);
  }, [applications]);

  const show = (n) => (loading ? "—" : n);

  return (
    <div className="space-y-5">
      <PageHeader
        title="What needs your attention"
        description="Every application in your queue, grouped by what happens next."
        actions={
          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            loading={refreshing}
            disabled={loading}
            onClick={() => loadData(true)}
            className="min-h-11"
          >
            {refreshing ? "Syncing…" : "Sync stats"}
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
        <Button href="/staff/applications" icon={ListFilter}>
          Open review queue
        </Button>
        <Button href="/staff/countdown" variant="secondary" icon={Timer}>
          SLA countdown
        </Button>
      </div>

      {error ? (
        <Notice tone="red" title="Some data didn't load">
          {error}
        </Notice>
      ) : null}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatTile label="All applications" value={show(counts.all)} icon={ClipboardList} href="/staff/applications" />
        <StatTile label="Awaiting review" value={show(counts.submitted)} icon={Inbox} tone="amber" href="/staff/applications" />
        <StatTile label="Under review" value={show(counts.staff_review)} icon={ShieldCheck} tone="amber" href="/staff/applications" />
        <StatTile
          label="Driving school"
          value={show(counts.driving_school)}
          hint={loading ? undefined : `${counts.driving_school_countdown} in countdown · ${counts.driving_school_graduation + counts.graduated} graduated`}
          icon={GraduationCap}
          href="/staff/applications?tab=driving_school"
        />
        <StatTile
          label="Ready to route"
          value={show(counts.graduated)}
          hint="School complete"
          icon={Route}
          tone="brand"
          href="/staff/applications?tab=graduated"
        />
        <StatTile label="Flagged" value={show(counts.flagged)} icon={Flag} tone="red" href="/staff/applications" />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <SectionTitle
            title="Pipeline"
            description="Where active files are right now"
            action={<Badge>{show(counts.all)} total</Badge>}
          />
          <div className="space-y-4">
            <PipelineBar label="Awaiting first review" count={counts.submitted} pct={counts.pctSubmitted} tone="amber" />
            <PipelineBar label="Under verification" count={counts.staff_review} pct={counts.pctReview} tone="amber" />
            <div className="space-y-3 rounded-cx border border-cx-line bg-cx-sunken/50 p-3">
              <PipelineBar label="In driving school" count={counts.driving_school} pct={counts.pctDriving} tone="neutral" />
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Link
                  href="/staff/applications?tab=driving_school_countdown"
                  className="cx-focus flex min-h-11 items-center justify-between gap-2 rounded-cx-sm border border-cx-line bg-cx-surface px-3 text-sm hover:border-cx-brand/50"
                >
                  <span className="flex items-center gap-1.5 text-cx-ink-2">
                    <Clock className="h-4 w-4 text-cx-muted" aria-hidden />
                    In countdown
                  </span>
                  <span className="font-semibold text-cx-ink">
                    {counts.driving_school_countdown} <span className="font-normal text-cx-muted">({counts.pctDrivingCountdown}%)</span>
                  </span>
                </Link>
                <Link
                  href="/staff/applications?tab=driving_school_graduation"
                  className="cx-focus flex min-h-11 items-center justify-between gap-2 rounded-cx-sm border border-cx-line bg-cx-surface px-3 text-sm hover:border-cx-brand/50"
                >
                  <span className="flex items-center gap-1.5 text-cx-ink-2">
                    <GraduationCap className="h-4 w-4 text-cx-muted" aria-hidden />
                    Awaiting certificate
                  </span>
                  <span className="font-semibold text-cx-ink">
                    {counts.driving_school_graduation} <span className="font-normal text-cx-muted">({counts.pctDrivingGraduation}%)</span>
                  </span>
                </Link>
              </div>
            </div>
            <PipelineBar label="School complete, ready to route" count={counts.graduated} pct={counts.pctGraduated} />
            <PipelineBar label="Routed to field agents" count={counts.routed} pct={counts.pctRouted} />
          </div>
        </Card>

        <Card>
          <SectionTitle title="Priorities" description="Queues that need staff action now" />
          <ul className="space-y-2.5">
            {counts.driving_school_graduation > 0 ? (
              <PriorityLink
                href="/staff/applications?tab=driving_school_graduation"
                icon={GraduationCap}
                tone="amber"
                title="Needs school certificate"
                count={counts.driving_school_graduation}
                body="Finished the 26-day countdown. Upload the graduation certificate to move them to routing."
                action="Upload certificate"
              />
            ) : null}
            <PriorityLink
              href="/staff/applications?tab=graduated"
              icon={Truck}
              title="Ready to route"
              count={counts.graduated}
              body="Driving school complete with certificate uploaded. Route to a field agent."
              action="Route now"
            />
            <PriorityLink
              href="/staff/applications?tab=submitted"
              icon={ShieldCheck}
              tone="amber"
              title="New submissions"
              count={counts.submitted}
              body="Awaiting first review. Check NIN details and driving school eligibility."
              action="Inspect"
            />
            <PriorityLink
              href="/staff/applications?tab=action_needed"
              icon={ShieldCheck}
              tone="amber"
              title="Needs final review"
              count={counts.needsFinalReview}
              body="The agent finished and uploaded proof. Sign off before it moves to the customer."
              action="Review now"
            />
            <PriorityLink
              href="/staff/applications?tab=dispatch"
              icon={Truck}
              tone="neutral"
              title="Needs dispatch details"
              count={counts.awaitingCustomer}
              body="Record who dispatched the licence and any tracking note before the customer confirms receipt."
              action="Record dispatch"
            />
          </ul>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-cx-line pt-3">
            <span className="text-sm text-cx-muted">
              Flagged for correction or rejection: <strong className="font-semibold text-cx-red">{show(counts.flagged)}</strong>
            </span>
            <Link
              href="/staff/applications"
              className="cx-focus inline-flex min-h-11 items-center gap-1 rounded-cx px-2 text-sm font-semibold text-cx-brand-deep hover:underline"
            >
              View full queue
              <ChevronRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </Card>
      </div>

      <section>
        <SectionTitle
          title="Recent files needing attention"
          description="Waiting on review, certificates, final sign-off or dispatch"
          action={
            <Button href="/staff/applications" variant="ghost" size="sm" className="min-h-11 shrink-0">
              View all{loading ? "" : ` (${counts.all})`}
            </Button>
          }
        />
        {loading ? (
          <SkeletonList rows={3} />
        ) : recentActionApps.length === 0 ? (
          <EmptyState
            icon={CheckSquare}
            title="All caught up"
            description="No new submissions or graduation files are waiting for review."
          />
        ) : (
          <ul className="space-y-3">
            {recentActionApps.map((app) => {
              const meta = statusMeta(app.status);
              return (
                <li key={app.id}>
                  <Link
                    href={`/staff/applications/${app.id}`}
                    className="cx-focus group flex items-center gap-3 rounded-cx-lg border border-cx-line bg-cx-surface p-4 shadow-cx transition-colors hover:border-cx-brand/50"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="min-w-0 truncate text-sm text-cx-muted">
                          {serviceLabel(app.application_type || "fresh")} · #{app.id}
                        </p>
                        <Badge tone={meta.tone} className="shrink-0">{meta.label}</Badge>
                      </div>
                      <p className="mt-1 truncate text-[17px] font-semibold text-cx-ink">{applicantName(app)}</p>
                      <p className="mt-0.5 text-sm text-cx-muted">
                        {[app.lga, app.state_of_residence].filter(Boolean).join(" · ") || "No location yet"}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 shrink-0 text-cx-muted transition-transform group-hover:translate-x-0.5" aria-hidden />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
