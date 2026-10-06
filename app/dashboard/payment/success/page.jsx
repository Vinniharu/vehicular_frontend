"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle2, Clock, RefreshCw } from "lucide-react";
import { getApplication, getMyApplications, verifyPaymentTransaction } from "@/lib/api";
import { clearCheckoutBaseline, readCheckoutBaseline } from "@/lib/utils/checkout";
import { typeLabel } from "@/app/dashboard/_shared/application-category";
import { Button, Card, DetailRow, koboToNaira } from "@/app/dashboard/_kit";

// Monnify brings the customer back here after checkout. The outcome is only
// ever taken from the backend — never assumed — and nothing (reference,
// amount, application) is invented when the callback doesn't carry it.

function formatDateTime(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleString("en-NG", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

const OUTCOMES = {
  paid: {
    icon: CheckCircle2,
    ring: "bg-cx-brand-soft text-cx-brand-deep",
    title: "Payment received",
  },
  partial: {
    icon: CheckCircle2,
    ring: "bg-cx-brand-soft text-cx-brand-deep",
    title: "Part payment received",
  },
  failed: {
    icon: AlertCircle,
    ring: "bg-cx-red-soft text-cx-red",
    title: "Payment didn't go through",
  },
  pending: {
    icon: Clock,
    ring: "bg-cx-amber-soft text-cx-amber",
    title: "Confirming your payment",
  },
};

function PaymentReturn() {
  const searchParams = useSearchParams();
  const reference =
    searchParams.get("paymentReference") || searchParams.get("transactionReference") || searchParams.get("reference") || null;
  const appIdParam = searchParams.get("application_id") || searchParams.get("id");

  const [application, setApplication] = useState(null);
  const [outcome, setOutcome] = useState("pending");
  const [verifiedAmount, setVerifiedAmount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  const run = useCallback(async () => {
    let status = null;
    let verified = null;
    if (reference || appIdParam) {
      const res = await verifyPaymentTransaction({
        ...(reference ? { reference } : {}),
        ...(appIdParam ? { application_id: appIdParam } : {}),
      });
      verified = res.data || null;
      status = verified?.status || null;
      if (verified?.amount_paid_kobo != null) setVerifiedAmount(verified.amount_paid_kobo);
    }

    // Only the application this payment belongs to — never "the latest one".
    let app = null;
    const appId = appIdParam || verified?.application_id;
    if (appId) {
      const res = await getApplication(appId);
      app = res.data || null;
    } else if (reference) {
      const list = await getMyApplications();
      app = Array.isArray(list.data) ? list.data.find((a) => a.payment_options?.payment_reference === reference) || null : null;
    }
    setApplication(app);

    const options = app?.payment_options;
    const paidNow = options?.amount_paid_kobo ?? verified?.amount_paid_kobo ?? null;
    const baseline = app ? readCheckoutBaseline(app.id) : null;
    const fullyPaid = status === "success" || status === "paid" || (options && options.remaining_kobo === 0 && options.amount_paid_kobo > 0);

    if (fullyPaid) {
      setOutcome("paid");
      if (app) clearCheckoutBaseline(app.id);
    } else if (baseline != null && paidNow != null && paidNow > baseline) {
      // A part-payment leaves the overall payment "pending"/"partial", so
      // compare against what was paid before this checkout started.
      setOutcome("partial");
      clearCheckoutBaseline(app.id);
    } else if (status === "failed") {
      setOutcome("failed");
    } else {
      setOutcome("pending");
    }
  }, [reference, appIdParam]);

  useEffect(() => {
    run().finally(() => setLoading(false));
  }, [run]);

  const checkAgain = async () => {
    setChecking(true);
    await run();
    setChecking(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-[50dvh] items-center justify-center" role="status" aria-label="Checking payment">
        <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-cx-brand-soft border-t-cx-brand" />
      </div>
    );
  }

  const meta = OUTCOMES[outcome];
  const Icon = meta.icon;
  const service = application ? typeLabel(application) : "your application";
  const options = application?.payment_options;
  const applicationHref = application ? `/dashboard/apply/${application.id}` : appIdParam ? `/dashboard/apply/${appIdParam}` : "/dashboard/applications";

  const message = {
    paid: `Your ${service} is fully paid and moving to processing.`,
    partial: `Your ${service} has started. The remaining ${options ? koboToNaira(options.remaining_kobo) : "balance"} is due before final routing or delivery.`,
    failed: "No money was taken. You can try again by card, or pay from your wallet.",
    pending: "Monnify hasn't confirmed this payment yet. If you've just paid, it usually takes under a minute.",
  }[outcome];

  return (
    <div className="mx-auto max-w-md py-4 sm:py-10">
      <Card className="text-center">
        <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${meta.ring}`}>
          <Icon className="h-7 w-7" aria-hidden />
        </div>
        <h1 className="font-display text-2xl text-cx-ink">{meta.title}</h1>
        <p className="mx-auto mt-2 max-w-xs text-[15px] text-cx-muted">{message}</p>

        <dl className="mt-6 divide-y divide-cx-line rounded-cx bg-cx-sunken px-4 text-left">
          {application ? <DetailRow label="Service" value={service} /> : null}
          {reference ? <DetailRow label="Reference" value={reference} /> : null}
          {outcome === "partial" || outcome === "paid" ? (
            <DetailRow
              label="Paid so far"
              value={options ? koboToNaira(options.amount_paid_kobo) : verifiedAmount != null ? koboToNaira(verifiedAmount) : "—"}
            />
          ) : null}
          {options && options.remaining_kobo > 0 ? <DetailRow label="Balance" value={koboToNaira(options.remaining_kobo)} /> : null}
          {application?.updated_at ? <DetailRow label="Updated" value={formatDateTime(application.updated_at)} /> : null}
        </dl>

        <div className="mt-6 space-y-3">
          {outcome === "pending" ? (
            <Button block size="lg" icon={RefreshCw} loading={checking} onClick={checkAgain}>
              {checking ? "Checking…" : "Check again"}
            </Button>
          ) : null}
          <Button block size="lg" variant={outcome === "pending" ? "secondary" : "primary"} href={applicationHref}>
            {outcome === "failed" ? "Go back and try again" : "View application"}
          </Button>
          <Button block variant="ghost" href="/dashboard">
            Back to home
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50dvh] items-center justify-center">
          <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-cx-brand-soft border-t-cx-brand" />
        </div>
      }
    >
      <PaymentReturn />
    </Suspense>
  );
}
