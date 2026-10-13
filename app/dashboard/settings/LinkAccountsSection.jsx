"use client";

import { useEffect, useState } from "react";
import { Link2, Unlink, MailCheck, ShieldCheck, Timer, Loader2, AlertCircle, CheckCircle2, AlertTriangle } from "lucide-react";
import {
  getWalletLink,
  startEmailVerification,
  confirmEmailVerification,
  startManualWalletLink,
  confirmManualWalletLink,
  unlinkWallet,
  koboToNaira,
} from "@/lib/api";
import Modal from "@/app/dashboard/_shared/Modal";
import { colors } from "@/lib/design-tokens";

const BRAND = colors.primary.DEFAULT;
const CODE_TTL_SECONDS = 5 * 60;

const inputCls =
  "w-full min-h-12 rounded-cx px-4 py-2.5 text-base sm:text-[15px] bg-cx-surface border border-cx-line-strong text-cx-ink focus:outline-none focus:border-cx-brand focus:ring-4 focus:ring-[color:var(--cx-focus)]";
const btnPrimaryCls =
  "inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#28A745] text-white disabled:opacity-60";
const btnSecondaryCls =
  "inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-cx-ink-2 border border-cx-line disabled:opacity-60";

/** Counts down from 5 minutes after a code is sent. */
function useCountdown(startedAt) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!startedAt) return undefined;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [startedAt]);
  if (!startedAt) return 0;
  return Math.max(0, CODE_TTL_SECONDS - Math.floor((now - startedAt) / 1000));
}

function formatSeconds(s) {
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}

function ErrorLine({ message }) {
  if (!message) return null;
  return (
    <div className="flex items-start gap-2.5 rounded-lg bg-red-50 p-3 text-sm text-red-700 ring-1 ring-inset ring-red-200">
      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
      <span>{message}</span>
    </div>
  );
}

/** 6-digit code entry with a 5-minute countdown and resend. */
function CodeStep({ sentTo, sentAt, busy, error, onConfirm, onResend, onCancel }) {
  const [code, setCode] = useState("");
  const left = useCountdown(sentAt);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (code.length === 6) onConfirm(code);
      }}
      className="space-y-4 max-w-lg"
    >
      <p className="text-sm text-cx-ink-2">
        We sent a 6-digit code to <span className="font-semibold">{sentTo}</span>.
      </p>
      <ErrorLine message={error} />
      <input
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
        placeholder="123456"
        className={`${inputCls} font-mono tracking-[0.4em] text-center`}
        aria-label="6-digit code"
      />
      <p className="flex items-center gap-1.5 text-[12.5px] text-cx-muted">
        <Timer className="h-3.5 w-3.5" />
        {left > 0 ? `Code expires in ${formatSeconds(left)}` : "This code has expired. Send a new one."}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={busy || code.length !== 6 || left === 0} className={btnPrimaryCls}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Confirm
        </button>
        <button type="button" disabled={busy} onClick={onResend} className={btnSecondaryCls}>
          Send a new code
        </button>
        <button type="button" disabled={busy} onClick={onCancel} className="text-sm text-cx-muted hover:text-cx-ink-2">
          Cancel
        </button>
      </div>
    </form>
  );
}

/**
 * Settings → "Link My Accounts": one shared wallet with Spare Parts.
 * Same verified email links automatically; a different email links with a
 * 6-digit code sent to the Spare Parts account.
 */
export default function LinkAccountsSection({ onToast }) {
  const [link, setLink] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // Email verification
  const [emailCodeAt, setEmailCodeAt] = useState(null);
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailError, setEmailError] = useState(null);

  // Manual link
  const [identifier, setIdentifier] = useState("");
  const [manualSentTo, setManualSentTo] = useState(null);
  const [manualCodeAt, setManualCodeAt] = useState(null);
  const [manualBusy, setManualBusy] = useState(false);
  const [manualError, setManualError] = useState(null);

  // Unlink
  const [unlinkOpen, setUnlinkOpen] = useState(false);
  const [unlinkBusy, setUnlinkBusy] = useState(false);
  const [unlinkError, setUnlinkError] = useState(null);

  const load = async () => {
    const res = await getWalletLink();
    if (res.data) {
      setLink(res.data);
      setLoadError(null);
    } else {
      setLoadError(res.error || "Couldn't load your linked accounts.");
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  // While a merge is finishing, check back every few seconds.
  useEffect(() => {
    if (link?.status !== "merging") return undefined;
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, [link?.status]);

  const sendEmailCode = async () => {
    setEmailBusy(true);
    setEmailError(null);
    const res = await startEmailVerification();
    setEmailBusy(false);
    if (res.error) return setEmailError(res.error);
    if (res.data?.already_verified) {
      setEmailCodeAt(null);
      return load();
    }
    setEmailCodeAt(Date.now());
  };

  const confirmEmail = async (code) => {
    setEmailBusy(true);
    setEmailError(null);
    const res = await confirmEmailVerification({ code });
    setEmailBusy(false);
    if (res.error) return setEmailError(res.error);
    setEmailCodeAt(null);
    setLink(res.data);
    onToast?.(
      "success",
      res.data?.linked ? "Email verified. Your wallets are now linked." : "Email verified."
    );
  };

  const sendManualCode = async (e) => {
    e?.preventDefault?.();
    const id = identifier.trim();
    if (!id) return setManualError("Enter your Spare Parts email or phone number.");
    setManualBusy(true);
    setManualError(null);
    const res = await startManualWalletLink({ identifier: id });
    setManualBusy(false);
    if (res.error) return setManualError(res.error);
    setManualSentTo(res.data?.sent_to || id);
    setManualCodeAt(Date.now());
  };

  const confirmManual = async (code) => {
    setManualBusy(true);
    setManualError(null);
    const res = await confirmManualWalletLink({ code });
    setManualBusy(false);
    if (res.error) return setManualError(res.error);
    setManualCodeAt(null);
    setManualSentTo(null);
    setIdentifier("");
    setLink(res.data);
    onToast?.("success", "Accounts linked. Your wallet balance is now shared with Spare Parts.");
  };

  const doUnlink = async () => {
    setUnlinkBusy(true);
    setUnlinkError(null);
    const res = await unlinkWallet();
    setUnlinkBusy(false);
    if (res.error) return setUnlinkError(res.error);
    setUnlinkOpen(false);
    setLink(res.data);
    onToast?.(
      "success",
      `Wallets unlinked. ${koboToNaira(res.data?.kept_balance_kobo ?? 0)} stays as your Vehiculars balance.`
    );
  };

  const linked = link?.status === "linked";
  const merging = link?.status === "merging";

  return (
    <div className="bg-white rounded-cx-lg border border-cx-line overflow-hidden">
      <div className="px-6 sm:px-8 py-5 border-b border-cx-line">
        <h2 className="font-display text-base font-semibold text-cx-ink flex items-center gap-2">
          <Link2 className="h-4 w-4" style={{ color: BRAND }} /> Link My Accounts
        </h2>
        <p className="text-sm text-cx-muted mt-0.5">
          Share one wallet balance with Spare Parts. Spend it on either platform.
        </p>
      </div>

      <div className="px-6 sm:px-8 py-6 space-y-6">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-cx-muted">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : loadError ? (
          <ErrorLine message={loadError} />
        ) : linked || merging ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#28A745]/10 px-3 py-1 text-xs font-bold text-[#28A745]">
                🔗 {merging ? "Linking with Spare Parts…" : "Linked with Spare Parts · Shared balance"}
              </span>
              {link.link_type ? (
                <span className="text-[12px] text-cx-muted">
                  {link.link_type === "auto" ? "Linked automatically (same email)" : "Linked with a code"}
                </span>
              ) : null}
            </div>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div>
                <dt className="text-cx-muted text-[12px]">Spare Parts account</dt>
                <dd className="font-medium text-cx-ink font-mono">{link.spare_parts_account || "—"}</dd>
              </div>
              <div>
                <dt className="text-cx-muted text-[12px]">Shared balance</dt>
                <dd className="font-semibold text-cx-ink">{koboToNaira(link.shared_balance_kobo ?? 0)}</dd>
              </div>
              {link.linked_at ? (
                <div>
                  <dt className="text-cx-muted text-[12px]">Linked on</dt>
                  <dd className="font-medium text-cx-ink">
                    {new Date(link.linked_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                  </dd>
                </div>
              ) : null}
            </dl>
            {linked ? (
              <button
                type="button"
                onClick={() => {
                  setUnlinkError(null);
                  setUnlinkOpen(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border border-red-200 text-red-700 hover:bg-red-50"
              >
                <Unlink className="h-4 w-4" /> Unlink accounts
              </button>
            ) : (
              <p className="flex items-center gap-2 text-sm text-cx-muted">
                <Loader2 className="h-4 w-4 animate-spin" /> Moving your balances into one wallet. This takes a few seconds.
              </p>
            )}
          </div>
        ) : (
          <>
            {/* Step 1: verify email (enables automatic linking) */}
            <section className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-cx-ink">
                <MailCheck className="h-4 w-4 text-cx-muted" /> Verify your email
              </h3>
              {link?.email_verified ? (
                <p className="flex items-center gap-2 text-sm text-cx-ink-2">
                  <ShieldCheck className="h-4 w-4 text-[#28A745]" />
                  <span>
                    <span className="font-medium">{link.email}</span> is verified. If your Spare Parts account uses the
                    same verified email, your wallets link automatically.
                  </span>
                </p>
              ) : emailCodeAt ? (
                <CodeStep
                  sentTo={link?.email}
                  sentAt={emailCodeAt}
                  busy={emailBusy}
                  error={emailError}
                  onConfirm={confirmEmail}
                  onResend={sendEmailCode}
                  onCancel={() => {
                    setEmailCodeAt(null);
                    setEmailError(null);
                  }}
                />
              ) : (
                <div className="space-y-3 max-w-lg">
                  <p className="text-sm text-cx-muted">
                    Verify <span className="font-medium text-cx-ink-2">{link?.email}</span> so we can link your wallets
                    automatically when your Spare Parts account uses the same email.
                  </p>
                  <ErrorLine message={emailError} />
                  <button type="button" disabled={emailBusy} onClick={sendEmailCode} className={btnSecondaryCls}>
                    {emailBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <MailCheck className="h-4 w-4" />} Send
                    verification code
                  </button>
                </div>
              )}
            </section>

            <div className="border-t border-cx-line" />

            {/* Step 2: link a Spare Parts account with a different email */}
            <section className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-cx-ink">
                <Link2 className="h-4 w-4 text-cx-muted" /> Link Spare Parts Account
              </h3>
              {manualCodeAt ? (
                <CodeStep
                  sentTo={manualSentTo}
                  sentAt={manualCodeAt}
                  busy={manualBusy}
                  error={manualError}
                  onConfirm={confirmManual}
                  onResend={sendManualCode}
                  onCancel={() => {
                    setManualCodeAt(null);
                    setManualSentTo(null);
                    setManualError(null);
                  }}
                />
              ) : (
                <form onSubmit={sendManualCode} className="space-y-3 max-w-lg">
                  <p className="text-sm text-cx-muted">
                    Used a different email on Spare Parts? Enter your Spare Parts email or phone number. We&apos;ll send a
                    6-digit code to it to confirm it&apos;s yours.
                  </p>
                  <ErrorLine message={manualError} />
                  <label className="block text-sm font-medium text-cx-ink-2" htmlFor="sp-identifier">
                    Spare Parts email or phone number
                  </label>
                  <input
                    id="sp-identifier"
                    type="text"
                    autoComplete="off"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="john2@gmail.com or 0803 123 4567"
                    className={inputCls}
                  />
                  <button type="submit" disabled={manualBusy} className={btnPrimaryCls}>
                    {manualBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />} Send code
                  </button>
                </form>
              )}
            </section>
          </>
        )}
      </div>

      <Modal
        open={unlinkOpen}
        onOpenChange={(open) => {
          if (!unlinkBusy) setUnlinkOpen(open);
        }}
        title="Unlink accounts"
      >
        <div className="bg-white rounded-cx-lg shadow-2xl border border-cx-line max-w-md w-full p-6 sm:p-7 text-left">
          <div className="flex items-center gap-3.5 mb-4">
            <div className="h-11 w-11 shrink-0 rounded-cx-lg bg-amber-100 flex items-center justify-center text-amber-700">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h3 className="font-display text-lg font-bold text-cx-ink">Unlink your wallets?</h3>
          </div>
          <p className="text-sm text-cx-ink-2 leading-relaxed mb-4">
            {link?.unlink_warning ||
              `If you unlink, your current shared balance of ${koboToNaira(link?.shared_balance_kobo ?? 0)} will remain as your balance on this platform, and future transactions will be separate.`}
          </p>
          <ErrorLine message={unlinkError} />
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 pt-4">
            <button type="button" disabled={unlinkBusy} onClick={() => setUnlinkOpen(false)} className={btnSecondaryCls}>
              Keep linked
            </button>
            <button
              type="button"
              disabled={unlinkBusy}
              onClick={doUnlink}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white"
            >
              {unlinkBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Unlink className="h-4 w-4" />} Unlink
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
