"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FilePlus2, FileText, Search } from "lucide-react";
import { getMyApplications, getWallet, payFromWalletEndpoint } from "@/lib/api";
import ApplicationCard from "@/app/dashboard/_shared/ApplicationCard";
import { isApplicationPaid } from "@/app/dashboard/_shared/apply-helpers";
import { APPLICATION_CATEGORIES, categoryForApplicationType, typeLabel } from "@/app/dashboard/_shared/application-category";
import { useToast } from "@/app/components/shared/ToastProvider";
import { Button, EmptyState, ErrorState, Input, PageHeader, SkeletonList, koboToNaira } from "@/app/dashboard/_kit";

function Chip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`cx-focus min-h-10 shrink-0 rounded-full px-4 text-sm font-medium transition-colors ${
        active ? "bg-cx-ink text-white" : "border border-cx-line-strong bg-cx-surface text-cx-ink-2 hover:bg-cx-sunken"
      }`}
    >
      {children}
    </button>
  );
}

export default function ApplicationsPage() {
  const router = useRouter();
  const pushToast = useToast();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [walletBalance, setWalletBalance] = useState(0);
  const [payingFromWallet, setPayingFromWallet] = useState(null);
  const payingRef = useRef(false);

  const load = async () => {
    setLoadError(null);
    const [appsRes, walletRes] = await Promise.all([getMyApplications({ sort: "updated_at" }), getWallet()]);
    if (appsRes.error) setLoadError(appsRes.error);
    else setApplications(appsRes.data || []);
    if (walletRes.data) setWalletBalance(walletRes.data.balance_kobo || 0);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handlePayFromWallet = async (appId, amountKobo) => {
    if (payingRef.current) return;
    payingRef.current = true;
    setPayingFromWallet(appId);
    const res = await payFromWalletEndpoint(appId, { amount_kobo: amountKobo });
    payingRef.current = false;
    setPayingFromWallet(null);
    if (res.error) {
      pushToast({ tone: "error", title: "Wallet payment didn't go through", body: res.error });
      return;
    }
    pushToast({
      tone: "success",
      title: res.data?.is_fully_paid ? "Paid in full" : `${koboToNaira(amountKobo)} paid`,
      body: res.data?.is_fully_paid ? undefined : `${koboToNaira(res.data?.remaining_kobo || 0)} still to pay.`,
    });
    await load();
  };

  const sorted = useMemo(
    () => [...applications].sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at)),
    [applications]
  );

  const needsPayment = (a) => !isApplicationPaid(a) && !!a.payment_options;
  const counts = useMemo(() => {
    const c = { all: sorted.length, payment: sorted.filter(needsPayment).length };
    for (const cat of APPLICATION_CATEGORIES) c[cat] = sorted.filter((a) => categoryForApplicationType(a.application_type) === cat).length;
    return c;
  }, [sorted]);

  const q = query.trim().toLowerCase().replace(/^#/, "");
  const visible = sorted.filter((a) => {
    if (filter === "payment" && !needsPayment(a)) return false;
    if (filter !== "all" && filter !== "payment" && categoryForApplicationType(a.application_type) !== filter) return false;
    if (!q) return true;
    return String(a.id).includes(q) || typeLabel(a).toLowerCase().includes(q);
  });

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="My applications"
        description="Everything you've applied for, most recently updated first."
        actions={
          <Button href="/dashboard/services" icon={FilePlus2} className="hidden sm:inline-flex">
            New application
          </Button>
        }
      />

      {loading ? (
        <SkeletonList rows={3} />
      ) : loadError ? (
        <ErrorState title="Your applications didn't load" message={loadError} onRetry={() => { setLoading(true); load(); }} />
      ) : applications.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No applications yet"
          description="Pick a service to get started. Most take a few minutes."
          action={<Button href="/dashboard/services" icon={FilePlus2}>Apply for a service</Button>}
        />
      ) : (
        <>
          <div className="mb-3">
            <label htmlFor="app-search" className="sr-only">Search applications</label>
            <Input
              id="app-search"
              type="search"
              placeholder="Search by service or reference number"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              prefix={<Search className="h-4 w-4" aria-hidden />}
            />
          </div>

          <div className="-mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label="Filter applications">
            <Chip active={filter === "all"} onClick={() => setFilter("all")}>All {counts.all}</Chip>
            {counts.payment > 0 ? (
              <Chip active={filter === "payment"} onClick={() => setFilter("payment")}>Needs payment {counts.payment}</Chip>
            ) : null}
            {APPLICATION_CATEGORIES.filter((c) => counts[c] > 0).map((c) => (
              <Chip key={c} active={filter === c} onClick={() => setFilter(c)}>
                {c} {counts[c]}
              </Chip>
            ))}
          </div>

          {visible.length === 0 ? (
            <EmptyState
              icon={Search}
              title="Nothing matches"
              description="Try a different filter or search."
              action={<Button variant="secondary" onClick={() => { setFilter("all"); setQuery(""); }}>Show all applications</Button>}
            />
          ) : (
            <div className="space-y-3">
              {visible.map((app) => (
                <ApplicationCard
                  key={app.id}
                  app={app}
                  walletBalance={walletBalance}
                  payingFromWallet={payingFromWallet}
                  onPayFromWallet={handlePayFromWallet}
                  onNavigate={(href) => router.push(href)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
