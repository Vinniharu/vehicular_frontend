"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, ClipboardList, RefreshCw, Search, X } from "lucide-react";
import { getAgentApplications } from "@/lib/api";
import { hasAgentUploadedAllDocuments } from "@/lib/utils/sla";
import { Button, EmptyState, ErrorState, Input, PageHeader, Select, SkeletonList } from "@/app/dashboard/_kit";
import { applicantName, jobHref, jobId, jobStage, serviceLabel } from "../_components/jobs";
import { SlaChip, StagePill } from "../_components/ui";

const cx = (...parts) => parts.filter(Boolean).join(" ");

const TABS = [
  { id: "todo", label: "To do", empty: "Nothing to do right now", emptyBody: "Accepted offers show up here." },
  { id: "waiting", label: "Waiting", empty: "Nothing waiting", emptyBody: "Jobs with staff or the customer show up here." },
  { id: "done", label: "Done", empty: "No finished jobs yet", emptyBody: "Jobs approved by staff show up here." },
];

export default function AgentJobsPage() {
  const [apps, setApps] = useState(null);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState("todo");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("updated_at");

  const load = async (quiet = false) => {
    if (quiet) setRefreshing(true);
    setError(null);
    const res = await getAgentApplications({ sort });
    if (res.error) setError(res.error);
    else setApps(Array.isArray(res.data) ? res.data : []);
    setRefreshing(false);
  };

  useEffect(() => {
    load(apps !== null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort]);

  const withStage = useMemo(() => (apps || []).map((a) => ({ app: a, stage: jobStage(a) })), [apps]);
  const counts = useMemo(() => {
    const c = { todo: 0, waiting: 0, done: 0 };
    withStage.forEach(({ stage }) => (c[stage.bucket] += 1));
    return c;
  }, [withStage]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return withStage.filter(({ app, stage }) => {
      if (stage.bucket !== tab) return false;
      if (!q) return true;
      return [String(jobId(app)), applicantName(app), app.lga, serviceLabel(app.application_type), app.phone]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [withStage, tab, query]);

  const current = TABS.find((t) => t.id === tab);

  return (
    <div>
      <PageHeader
        title="My jobs"
        description="Everything you've accepted. Open a job to see its next step."
        actions={
          <Button variant="secondary" size="sm" icon={RefreshCw} loading={refreshing} onClick={() => load(true)}>
            Refresh
          </Button>
        }
      />

      <div role="tablist" aria-label="Job status" className="mb-4 grid grid-cols-3 gap-1 rounded-cx bg-cx-sunken p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cx(
              "cx-focus min-h-11 rounded-cx-sm text-[15px] font-semibold transition-colors",
              tab === t.id ? "bg-cx-surface text-cx-ink shadow-cx" : "text-cx-muted hover:text-cx-ink"
            )}
          >
            {t.label}
            {apps ? <span className={cx("ml-1.5 text-sm", tab === t.id ? "text-cx-brand-deep" : "")}>{counts[t.id]}</span> : null}
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, job number or LGA"
            aria-label="Search jobs"
            prefix={<Search className="h-4 w-4" aria-hidden />}
          />
          {query ? (
            <button type="button" aria-label="Clear search" onClick={() => setQuery("")} className="cx-focus absolute inset-y-0 right-1 my-auto flex h-10 w-10 items-center justify-center rounded-cx text-cx-muted">
              <X className="h-4 w-4" aria-hidden />
            </button>
          ) : null}
        </div>
        <Select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort jobs" className="sm:w-56">
          <option value="updated_at">Recently updated</option>
          <option value="id">Job number</option>
          <option value="name">Customer name</option>
        </Select>
      </div>

      {error && !apps ? (
        <ErrorState message={error} onRetry={() => load()} />
      ) : !apps ? (
        <SkeletonList rows={4} />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title={query ? "No jobs match your search" : current.empty}
          description={query ? "Try a different name or number." : current.emptyBody}
          action={tab === "todo" && !query ? <Button href="/agent" variant="secondary">See job offers</Button> : null}
        />
      ) : (
        <ul className="space-y-3">
          {visible.map(({ app, stage }) => (
            <li key={jobId(app)}>
              <Link
                href={jobHref(app)}
                className="cx-focus group flex items-center gap-3 rounded-cx-lg border border-cx-line bg-cx-surface p-4 shadow-cx transition-colors hover:border-cx-brand/50"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm text-cx-muted">
                      {serviceLabel(app.application_type)} · #{jobId(app)}
                    </p>
                    <StagePill stage={stage} />
                  </div>
                  <p className="mt-1 truncate text-[17px] font-semibold text-cx-ink">{applicantName(app)}</p>
                  <p className={cx("mt-0.5 text-sm", stage.bucket === "todo" ? "font-medium text-cx-ink-2" : "text-cx-muted")}>{stage.next}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[13px] text-cx-muted">
                    {app.lga ? <span>{app.lga}</span> : null}
                    {stage.bucket === "todo" && !hasAgentUploadedAllDocuments(app) ? <SlaChip sla={app.sla} compact /> : null}
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-cx-muted transition-transform group-hover:translate-x-0.5" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
