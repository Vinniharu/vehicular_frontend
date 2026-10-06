"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle, CarFront, ChevronRight, FileStack, IdCard, LayoutGrid, Wallet } from "lucide-react";
import { getCachedUser, getMyApplications, getWallet } from "@/lib/api";
import ContinueApplicationCard from "./_shared/ContinueApplicationCard";
import { isApplicationPaid } from "@/app/dashboard/_shared/apply-helpers";
import { typeLabel } from "@/app/dashboard/_shared/application-category";
import { getNextStepCopy, getStageProgress, statusMeta } from "@/app/dashboard/_shared/status-config";
import { Button, Card, ErrorState, SectionTitle, Skeleton, koboToNaira } from "@/app/dashboard/_kit";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

const CLOSED = new Set(["completed", "expired", "failed"]);

// What, if anything, the customer has to do on this application.
function actionFor(app) {
  if (app.status === "staff_rejected") return { label: "Fix and resubmit", tone: "red" };
  if (app.status === "needs_correction" && ["renewal", "reissue", "international_permit", "tinted_permit"].includes(app.application_type)) {
    return { label: "Re-upload a document", tone: "amber" };
  }
  if (app.payment_options && !isApplicationPaid(app) && !CLOSED.has(app.status)) {
    const owed = app.payment_options.remaining_kobo ?? app.payment_options.amount_kobo;
    return { label: `Pay ${koboToNaira(owed)} balance`, tone: "amber" };
  }
  return null;
}

const QUICK = [
  { href: "/dashboard/apply/drivers-licence", icon: IdCard, title: "Driver's licence", body: "New, renewal or replacement" },
  { href: "/dashboard/apply/number-plate", icon: CarFront, title: "Number plate", body: "New, change of owner, fancy" },
  { href: "/dashboard/apply/vehicle-particulars", icon: FileStack, title: "Vehicle papers", body: "Licence, insurance, roadworthiness" },
  { href: "/dashboard/services", icon: LayoutGrid, title: "All services", body: "Inspections, verification and more" },
];

export default function DashboardPage() {
  const [user] = useState(() => getCachedUser());
  const [walletBalance, setWalletBalance] = useState(null);
  const [applications, setApplications] = useState(null);
  const [loadError, setLoadError] = useState(null);

  const load = () => {
    setLoadError(null);
    getWallet().then((res) => {
      if (res.data) setWalletBalance(res.data.balance_kobo || 0);
    });
    getMyApplications({ sort: "updated_at" }).then((res) => {
      if (res.error) setLoadError(res.error);
      else setApplications(res.data || []);
    });
  };

  useEffect(load, []);

  const sorted = useMemo(
    () => [...(applications || [])].sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at)),
    [applications]
  );
  const needsAction = sorted.map((app) => ({ app, action: actionFor(app) })).filter((x) => x.action).slice(0, 3);
  const latest = sorted.find((a) => !CLOSED.has(a.status)) || sorted[0];
  const firstName = (user?.first_name || user?.name || "").split(" ")[0] || "there";

  return (
    <div className="mx-auto max-w-3xl space-y-7">
      <header>
        <p className="text-[15px] text-cx-muted">{greeting()},</p>
        <h1 className="font-display text-[32px] leading-tight text-cx-ink sm:text-[38px]">{firstName}</h1>
      </header>

      {loadError ? <ErrorState title="Your applications didn't load" message={loadError} onRetry={load} /> : null}

      {needsAction.length > 0 ? (
        <section aria-labelledby="attention">
          <SectionTitle title={<span id="attention">Needs your attention</span>} />
          <ul className="space-y-2">
            {needsAction.map(({ app, action }) => (
              <li key={app.id}>
                <Link
                  href={`/dashboard/apply/${app.id}`}
                  className={`cx-focus flex min-h-16 items-center gap-3 rounded-cx-lg border px-4 py-3 transition-colors ${
                    action.tone === "red" ? "border-cx-red/30 bg-cx-red-soft" : "border-cx-amber/30 bg-cx-amber-soft"
                  }`}
                >
                  <AlertCircle className={`h-5 w-5 shrink-0 ${action.tone === "red" ? "text-cx-red" : "text-cx-amber"}`} aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-semibold text-cx-ink">{action.label}</span>
                    <span className="block truncate text-[13px] text-cx-ink-2">
                      {typeLabel(app)}, #{app.id}
                    </span>
                  </span>
                  <ChevronRight className="h-5 w-5 shrink-0 text-cx-muted" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {applications === null && !loadError ? (
        <Skeleton className="h-44 w-full rounded-cx-lg" />
      ) : latest ? (
        <section aria-labelledby="latest">
          <SectionTitle
            title={<span id="latest">Your latest application</span>}
            action={
              <Link href="/dashboard/applications" className="cx-focus inline-flex min-h-11 items-center rounded-cx px-2 text-sm font-medium text-cx-brand-deep">
                See all
              </Link>
            }
          />
          <LatestApplicationPlate app={latest} />
        </section>
      ) : loadError ? null : (
        <Card className="text-center">
          <p className="text-base font-semibold text-cx-ink">You haven't applied for anything yet</p>
          <p className="mt-1 text-sm text-cx-muted">Pick a service below. Most applications take a few minutes.</p>
        </Card>
      )}

      <ContinueApplicationCard />

      <section aria-labelledby="apply">
        <SectionTitle title={<span id="apply">Apply for a service</span>} />
        <div className="grid grid-cols-2 gap-3">
          {QUICK.map(({ href, icon: Icon, title, body }) => (
            <Link
              key={href}
              href={href}
              className="cx-focus flex flex-col gap-3 rounded-cx-lg border border-cx-line bg-cx-surface p-4 shadow-cx transition-colors hover:border-cx-line-strong"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-cx bg-cx-brand-soft text-cx-brand-deep">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <span>
                <span className="block text-[15px] font-semibold text-cx-ink">{title}</span>
                <span className="mt-0.5 block text-[13px] leading-snug text-cx-muted">{body}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <Card className="flex items-center gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-cx bg-cx-sunken text-cx-ink-2">
          <Wallet className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-cx-muted">Wallet balance</p>
          <p className="text-xl font-semibold text-cx-ink">{walletBalance == null ? "…" : koboToNaira(walletBalance)}</p>
        </div>
        <Button variant="secondary" href="/dashboard/wallet">
          Top up
        </Button>
      </Card>
    </div>
  );
}

// The one bold element of the portal: the latest application styled like
// the official document it will become — a white plate with a green rule,
// the service name set large, and how far along it is.
function LatestApplicationPlate({ app }) {
  const meta = statusMeta(app.status, app.application_type);
  const progress = Math.round(getStageProgress(app.status, app.application_type) * 100);
  return (
    <Link
      href={`/dashboard/apply/${app.id}`}
      className="cx-focus group relative block overflow-hidden rounded-cx-lg border border-cx-line-strong bg-cx-surface shadow-cx-raised"
    >
      <span className="absolute inset-y-0 left-0 w-1.5 bg-cx-brand" aria-hidden />
      <div className="py-5 pl-6 pr-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[13px] text-cx-muted">Application #{app.id}</p>
            <p className="mt-1 font-display text-[24px] leading-tight text-cx-ink">{typeLabel(app)}</p>
          </div>
          <span className="shrink-0 rounded-full bg-cx-brand-soft px-3 py-1 text-[13px] font-medium text-cx-brand-deep">{meta.label}</span>
        </div>
        <p className="mt-3 max-w-prose text-[15px] text-cx-ink-2">{getNextStepCopy(app)}</p>
        <div className="mt-4 flex items-center gap-3">
          <div
            className="h-2 flex-1 overflow-hidden rounded-full bg-cx-sunken"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Progress"
          >
            <div className="h-full rounded-full bg-cx-brand" style={{ width: `${Math.max(progress, 4)}%` }} />
          </div>
          <span className="shrink-0 text-[13px] text-cx-muted">{progress}%</span>
        </div>
      </div>
    </Link>
  );
}
