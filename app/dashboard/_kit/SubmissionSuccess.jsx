"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { getApplication, getWallet, initializeCardPayment, payFromWalletEndpoint } from "@/lib/api";
import { goToCheckout } from "@/lib/utils/checkout";
import { useToast } from "@/app/components/shared/ToastProvider";
import PartialPayControls from "@/app/components/dashboard/PartialPayControls";
import { typeLabel } from "@/app/dashboard/_shared/application-category";
import { Button, Card, DetailRow, koboToNaira } from "@/app/dashboard/_kit";

/**
 * Shown after any application form submits. One place for "what happens
 * next" and for paying any balance left after the deposit — every form used
 * to carry its own copy with a different wallet-payment signature.
 */
export default function SubmissionSuccess({ application, title = "Application submitted", message }) {
  const router = useRouter();
  const pushToast = useToast();
  const [payment, setPayment] = useState(application?.payment_options || null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [payingWallet, setPayingWallet] = useState(false);
  const [payingCard, setPayingCard] = useState(false);

  useEffect(() => {
    getWallet().then((res) => {
      if (res.data) setWalletBalance(res.data.balance_kobo || 0);
    });
  }, []);

  const refresh = async () => {
    const [appRes, walletRes] = await Promise.all([getApplication(application.id), getWallet()]);
    if (appRes.data?.payment_options) setPayment(appRes.data.payment_options);
    if (walletRes.data) setWalletBalance(walletRes.data.balance_kobo || 0);
    return appRes.data?.payment_options || null;
  };

  const remaining = payment ? payment.remaining_kobo ?? payment.amount_kobo : 0;
  const paidInFull = payment ? remaining <= 0 : false;
  const href = `/dashboard/apply/${application.id}`;

  const payFromWallet = async (amountKobo) => {
    setPayingWallet(true);
    const res = await payFromWalletEndpoint(application.id, { amount_kobo: amountKobo });
    setPayingWallet(false);
    if (res.error) {
      pushToast({ tone: "error", title: "Wallet payment didn't go through", body: res.error });
      return;
    }
    const latest = await refresh();
    if (res.data?.is_fully_paid || (latest && (latest.remaining_kobo ?? 1) <= 0)) {
      pushToast({ tone: "success", title: "Paid in full", body: "Your application is moving to processing." });
      router.push(href);
    } else {
      pushToast({ tone: "success", title: `${koboToNaira(amountKobo)} paid from your wallet` });
    }
  };

  const payByCard = async (amountKobo) => {
    setPayingCard(true);
    const res = await initializeCardPayment(application.id, { amount_kobo: amountKobo });
    setPayingCard(false);
    if (res.error) {
      pushToast({ tone: "error", title: "Couldn't open checkout", body: res.error });
      return;
    }
    goToCheckout(res.data?.authorization_url, { applicationId: application.id, amountPaidKobo: payment?.amount_paid_kobo });
  };

  return (
    <div className="mx-auto max-w-md py-2 sm:py-8">
      <Card>
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-cx-brand-soft text-cx-brand-deep">
            <CheckCircle2 className="h-7 w-7" aria-hidden />
          </div>
          <h1 className="font-display text-2xl text-cx-ink">{title}</h1>
          <p className="mx-auto mt-2 max-w-xs text-[15px] text-cx-muted">
            {message ||
              (paidInFull
                ? "It's fully paid. We'll keep you updated here and by email as it moves along."
                : "Your deposit is in. Pay the balance when you can; paying in full avoids delays in review.")}
          </p>
        </div>

        <dl className="mt-6 divide-y divide-cx-line rounded-cx bg-cx-sunken px-4">
          <DetailRow label="Service" value={typeLabel(application)} />
          <DetailRow label="Reference" value={`#${application.id}`} />
          {payment ? <DetailRow label="Total" value={koboToNaira(payment.amount_kobo)} /> : null}
          {payment && payment.amount_paid_kobo > 0 ? <DetailRow label="Paid" value={koboToNaira(payment.amount_paid_kobo)} /> : null}
          {payment && remaining > 0 ? <DetailRow label="Balance" value={koboToNaira(remaining)} /> : null}
        </dl>

        {payment && remaining > 0 ? (
          <div className="mt-6">
            <h2 className="mb-3 text-base font-semibold text-cx-ink">Pay the balance</h2>
            <PartialPayControls
              remainingKobo={remaining}
              walletBalanceKobo={walletBalance}
              amountPaidKobo={payment.amount_paid_kobo || 0}
              minimumPayableKobo={payment.minimum_payable_kobo}
              partialAllowed={payment.partial_payment_allowed ?? true}
              payingWallet={payingWallet}
              onPay={payFromWallet}
              payingCard={payingCard}
              onPayCard={payByCard}
            />
          </div>
        ) : null}

        <div className="mt-6 space-y-2">
          <Button block size="lg" variant={remaining > 0 ? "secondary" : "primary"} href={href}>
            View application
          </Button>
          <Button block variant="ghost" href="/dashboard">
            Back to home
          </Button>
        </div>
      </Card>
    </div>
  );
}
