"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, ClipboardPaste, Loader2 } from "lucide-react";
import { confirmPhoneVerificationCode, getPhoneVerificationStatus, sendPhoneVerificationCode } from "@/lib/api";
import { btnPrimary, btnSecondary, inputBase, label as labelClass } from "@/app/dashboard/_shared/ui";
import { FieldError, errInputClass } from "@/app/dashboard/_shared/apply-helpers";

const BRAND = "#28A745";
const CODE_LENGTH = 6;

export const PHONE_NOTE_GENERAL = "Kindly provide an active phone number that can receive calls, as our agent will contact you.";
export const PHONE_NOTE_TINTED = "Kindly provide an active phone number that can receive calls, as our agent will need to contact you to obtain your POSSAP code.";
export const PHONE_NOT_VERIFIED_ERROR = "Please verify this number to continue.";

/** Pulls the code out of whatever was typed or pasted, e.g. "123 456" or the whole SMS. */
function extractCode(text) {
  const raw = String(text || "");
  const whole = raw.match(/\b\d{6}\b/);
  if (whole) return whole[0];
  return raw.replace(/\D/g, "").slice(0, CODE_LENGTH);
}

/**
 * Lives in the form, not the field, so a number verified on an earlier step
 * still counts on the final check after the field has unmounted.
 */
export function usePhoneVerification(phone) {
  const [verified, setVerified] = useState(false);
  const number = (phone || "").trim();

  useEffect(() => {
    setVerified(false);
    if (number.replace(/\D/g, "").length < 10) return undefined;
    let cancelled = false;
    const timer = setTimeout(async () => {
      const res = await getPhoneVerificationStatus(number);
      if (!cancelled && res.data?.verified) setVerified(true);
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [number]);

  return { verified, setVerified };
}

export default function PhoneVerifyField({
  value,
  onChange,
  verification,
  label = "Mobile / Phone number",
  note = PHONE_NOTE_GENERAL,
  placeholder = "08012345678",
  error,
  className,
}) {
  const { verified, setVerified } = verification;
  const number = (value || "").trim();
  const [stage, setStage] = useState("idle"); // idle | code
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [code, setCode] = useState("");
  const [sentTo, setSentTo] = useState(null);
  const [message, setMessage] = useState(null);
  const [wait, setWait] = useState(0);
  const phoneInput = useRef(null);
  const codeInput = useRef(null);
  const submittedCode = useRef(null);

  // A different number needs its own code.
  useEffect(() => {
    setStage("idle");
    setCode("");
    setSentTo(null);
    setMessage(null);
    setWait(0);
    submittedCode.current = null;
  }, [number]);

  useEffect(() => {
    if (wait <= 0) return undefined;
    const timer = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(timer);
  }, [wait]);

  const confirm = async (candidate) => {
    if (candidate.length !== CODE_LENGTH || checking) return;
    submittedCode.current = candidate;
    setChecking(true);
    setMessage(null);
    const res = await confirmPhoneVerificationCode(number, candidate);
    setChecking(false);
    if (res.error) {
      setMessage(String(res.error));
      return;
    }
    setVerified(true);
    setStage("idle");
    setCode("");
  };

  const updateCode = (text) => {
    const next = extractCode(text);
    setCode(next);
    // Autofill and paste finish the job; no need to tap Confirm as well. The
    // ref stops a rejected code resubmitting itself on every re-render.
    if (next.length === CODE_LENGTH && submittedCode.current !== next) confirm(next);
  };

  // Android Chrome can read the code straight from the SMS. iPhones and other
  // Android browsers offer it above the keyboard through autoComplete below.
  useEffect(() => {
    if (stage !== "code" || typeof window === "undefined" || !("OTPCredential" in window)) return undefined;
    const controller = new AbortController();
    navigator.credentials
      .get({ otp: { transport: ["sms"] }, signal: controller.signal })
      .then((otp) => otp?.code && updateCode(otp.code))
      .catch(() => {});
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  useEffect(() => {
    if (stage === "code") codeInput.current?.focus();
  }, [stage]);

  const send = async () => {
    setSending(true);
    setMessage(null);
    const res = await sendPhoneVerificationCode(number);
    setSending(false);
    if (res.error) {
      setMessage(String(res.error));
      // Inside the resend wait: the server says how long is left.
      const seconds = String(res.error).match(/(\d+) seconds/);
      if (seconds) setWait(Number(seconds[1]));
      return;
    }
    if (res.data?.already_verified) {
      setVerified(true);
      return;
    }
    setSentTo(res.data);
    setStage("code");
    setCode("");
    submittedCode.current = null;
    setWait(res.data?.resend_after_seconds ?? 60);
  };

  const pasteCode = async () => {
    try {
      updateCode(await navigator.clipboard.readText());
      codeInput.current?.focus();
    } catch {
      // Clipboard access refused; typing or the keyboard's paste still works.
      setMessage("Couldn't read your clipboard. Press and hold the box to paste the code.");
    }
  };

  const changeNumber = () => {
    setVerified(false);
    setStage("idle");
    phoneInput.current?.focus();
    phoneInput.current?.select();
  };

  const destinations = sentTo
    ? [sentTo.sms_sent && `by SMS to ${sentTo.sent_to_phone}`, sentTo.email_sent && `by email to ${sentTo.sent_to_email}`].filter(Boolean).join(" and ")
    : "";

  return (
    <div className={className}>
      <label className={labelClass}>
        {label} <span className="text-red-400">*</span>
      </label>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          ref={phoneInput}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          className={`${inputBase} ${errInputClass(!!error)} sm:flex-1`}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
        {verified ? (
          <span className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[#28A745]/10 px-3 py-2.5 text-[13px] font-semibold text-[#1e7e34]">
            <CheckCircle2 className="h-4 w-4" aria-hidden /> Verified
          </span>
        ) : stage === "idle" ? (
          <button type="button" onClick={send} disabled={sending || !number || wait > 0} className={`${btnPrimary} shrink-0`} style={{ background: BRAND }}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
            {wait > 0 ? `Try again in ${wait}s` : "Verify number"}
          </button>
        ) : null}
      </div>
      <p className="mt-1.5 text-xs text-cx-muted">{note}</p>
      {stage === "idle" && !verified ? <FieldError message={error} /> : null}

      {stage === "idle" && !verified && message ? <FieldError message={message} /> : null}

      {stage === "code" && !verified ? (
        <div className="mt-3 rounded-xl border border-cx-line bg-cx-sunken p-3.5">
          <p className="text-[13px] text-cx-ink-2">
            We sent a {CODE_LENGTH}-digit code {destinations}. It expires in {sentTo?.expires_in_minutes ?? 5} minutes. Check your spam folder if you can't see the email.
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              ref={codeInput}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              name="one-time-code"
              aria-label="Verification code"
              className={`${inputBase} ${errInputClass(!!message)} text-center font-mono text-lg tracking-[0.4em] sm:flex-1`}
              value={code}
              onChange={(e) => updateCode(e.target.value)}
              onPaste={(e) => {
                e.preventDefault();
                updateCode(e.clipboardData.getData("text"));
              }}
              placeholder="000000"
            />
            <button type="button" onClick={() => confirm(code)} disabled={code.length !== CODE_LENGTH || checking} className={`${btnPrimary} shrink-0`} style={{ background: BRAND }}>
              {checking ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              Confirm
            </button>
          </div>
          <FieldError message={message} />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button type="button" onClick={pasteCode} className={`${btnSecondary} !py-2 text-[13px]`}>
              <ClipboardPaste className="h-3.5 w-3.5" aria-hidden /> Paste code
            </button>
            <button type="button" onClick={send} disabled={sending || wait > 0} className={`${btnSecondary} !py-2 text-[13px]`}>
              {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : null}
              {wait > 0 ? `Resend code in ${wait}s` : "Resend code"}
            </button>
            <button type="button" onClick={changeNumber} className={`${btnSecondary} !py-2 text-[13px]`}>
              Use a different number
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
