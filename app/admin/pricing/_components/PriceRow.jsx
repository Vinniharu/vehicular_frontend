"use client";

// One price line (read view) and the sheet that edits it. Every pricing row
// on the page — flat rows, vehicle-type cells — is edited through this one
// sheet, one row at a time.

import { useEffect, useState } from "react";
import { ChevronRight, Trash2 } from "lucide-react";
import { Badge, Button, Field, Notice, Sheet } from "@/app/dashboard/_kit";
import { useToast } from "@/app/components/shared/ToastProvider";
import { ConfirmSheet, InheritedHint, MoneyInput, PercentInput, Switch, formatNaira, moneyError, toKobo } from "../../_kit";

const cx = (...parts) => parts.filter(Boolean).join(" ");

/** What deposit % the customer pays, and where it comes from. */
export function depositText(row, isGeneralScope) {
  if (row.initial_deposit_amount_kobo) return `${formatNaira(toKobo(row.initial_deposit_amount_kobo))} fixed`;
  if (row.initial_deposit_percent !== "" && row.initial_deposit_percent != null) return `${row.initial_deposit_percent}%`;
  if (row.effective_deposit_percent != null) return `${row.effective_deposit_percent}% (${isGeneralScope ? "default" : "from general"})`;
  return isGeneralScope ? "10% (default)" : "Same as general";
}

export function priceText(row, emptyLabel = "Not set") {
  return row.amount ? formatNaira(toKobo(row.amount)) : emptyLabel;
}

/** A tappable read-only line: label · price · deposit, opens the editor. */
export function PriceLine({ label, hint, row, isGeneralScope, onEdit, emptyLabel }) {
  const inactive = row.is_active === false;
  return (
    <button
      type="button"
      onClick={onEdit}
      className="cx-focus group flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-cx-sunken/70 sm:px-5"
    >
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-medium text-cx-ink">{label}</p>
        {hint ? <p className="text-[13px] text-cx-muted">{hint}</p> : null}
        <div className="mt-1 flex flex-wrap gap-1.5 sm:hidden">
          <span className="text-[13px] text-cx-muted">Deposit {depositText(row, isGeneralScope)}</span>
        </div>
        {(row.is_override || inactive) ? (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {row.is_override ? <Badge tone="amber">This state's price</Badge> : null}
            {inactive ? <Badge tone="neutral">Off — {row.is_override ? "general price used" : "fallback used"}</Badge> : null}
          </div>
        ) : null}
      </div>
      <div className="hidden w-40 shrink-0 text-right text-[13px] text-cx-muted sm:block">Deposit {depositText(row, isGeneralScope)}</div>
      <div className={cx("w-28 shrink-0 text-right text-[15px] font-semibold", row.amount ? "text-cx-ink" : "text-cx-muted")}>{priceText(row, emptyLabel)}</div>
      <ChevronRight className="h-5 w-5 shrink-0 text-cx-muted transition-transform group-hover:translate-x-0.5" aria-hidden />
    </button>
  );
}

/**
 * Edit one price row. `onSave(nextRow)` and `onDelete()` return { ok, error }.
 * `canDelete` should be true only when there is something to remove
 * (a general row, or this state's own override).
 */
export function PriceEditSheet({ open, onOpenChange, title, description, row, isGeneralScope, amountRequired, onSave, onDelete, canDelete }) {
  const pushToast = useToast();
  const [amount, setAmount] = useState("");
  const [percent, setPercent] = useState("");
  const [active, setActive] = useState(true);
  const [clearFixed, setClearFixed] = useState(false);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!open || !row) return;
    setAmount(row.amount || "");
    setPercent(row.initial_deposit_percent ?? "");
    setActive(row.is_active !== false);
    setClearFixed(false);
    setError(null);
  }, [open, row]);

  if (!row) return null;
  const ownPercent = row.initial_deposit_percent !== "" && row.initial_deposit_percent != null;
  const inherited = !ownPercent && row.effective_deposit_percent != null
    ? `Leave blank to use ${row.effective_deposit_percent}% (${isGeneralScope ? "the default" : "from the general price"}).`
    : isGeneralScope ? "Leave blank to use the 10% default." : "Leave blank to use the general price's deposit.";
  const fixedDeposit = row.initial_deposit_amount_kobo && !clearFixed;

  const save = async () => {
    const amountErr = moneyError(amount, { required: amountRequired, allowZero: false });
    if (amountErr) return setError(amountErr);
    if (percent !== "" && (Number.isNaN(Number(percent)) || Number(percent) < 0 || Number(percent) > 100)) {
      return setError("Deposit must be between 0 and 100%.");
    }
    setError(null);
    setSaving(true);
    const next = {
      ...row,
      amount: amount.replace(/,/g, ""),
      initial_deposit_percent: percent,
      is_active: active,
      // A % replaces any old fixed deposit amount (which would otherwise win at checkout).
      initial_deposit_amount_kobo: percent !== "" || clearFixed ? "" : row.initial_deposit_amount_kobo,
    };
    const res = await onSave(next);
    setSaving(false);
    if (!res.ok) return setError(res.error || "Couldn't save this price.");
    pushToast({ tone: "success", title: "Price saved", body: title });
    onOpenChange(false);
  };

  const remove = async () => {
    setDeleting(true);
    const res = await onDelete();
    setDeleting(false);
    setConfirmDelete(false);
    if (!res.ok) return setError(res.error || "Couldn't remove this price.");
    pushToast({ tone: "success", title: isGeneralScope ? "Price removed" : "State price removed", body: isGeneralScope ? title : `${title} now uses the general price.` });
    onOpenChange(false);
  };

  return (
    <>
      <Sheet
        open={open && !confirmDelete}
        onOpenChange={(o) => !saving && onOpenChange(o)}
        title={title}
        description={description || (isGeneralScope ? "Applies to every state without its own price." : "Applies to this state only.")}
        footer={
          <>
            <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
            <Button block loading={saving} onClick={save}>Save price</Button>
          </>
        }
      >
        <div className="space-y-5">
          {error ? <Notice tone="red">{error}</Notice> : null}
          <Field label="Price" required={amountRequired} hint={amountRequired ? undefined : "Leave blank to stop selling this until a price is set."}>
            {(p) => <MoneyInput {...p} value={amount} onChange={setAmount} placeholder="0" invalid={!!error && !!moneyError(amount, { required: amountRequired })} />}
          </Field>
          <Field label="Initial deposit" optional hint={inherited}>
            {(p) => <PercentInput {...p} value={percent} onChange={setPercent} placeholder={!ownPercent && row.effective_deposit_percent != null ? String(row.effective_deposit_percent) : isGeneralScope ? "10" : ""} />}
          </Field>
          {fixedDeposit ? (
            <Notice tone="amber" title={`This price has an old fixed deposit of ${formatNaira(toKobo(row.initial_deposit_amount_kobo))}`}>
              It's charged instead of any %. Set a % above, or{" "}
              <button type="button" className="cx-focus rounded font-semibold underline" onClick={() => setClearFixed(true)}>remove it</button>.
            </Notice>
          ) : null}
          <div className="rounded-cx border border-cx-line p-3.5">
            <Switch
              checked={active}
              onChange={setActive}
              label="Price is on"
              description={active ? "Customers are charged this price." : isGeneralScope ? "Turned off — the system fallback is used." : "Turned off — the general price is used."}
            />
          </div>
          {canDelete && onDelete ? (
            <div className="border-t border-cx-line pt-4">
              <Button variant="ghost" icon={Trash2} className="-ml-1 text-cx-red" onClick={() => setConfirmDelete(true)}>
                {isGeneralScope ? "Remove this price" : "Remove this state's price"}
              </Button>
              <p className="mt-1 pl-3">
                <InheritedHint>
                  {isGeneralScope ? "States without their own price fall back to the system default." : "This state goes back to the general price."}
                </InheritedHint>
              </p>
            </div>
          ) : null}
        </div>
      </Sheet>
      <ConfirmSheet
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={isGeneralScope ? "Remove this price?" : "Remove this state's price?"}
        description={isGeneralScope ? `States without their own price for ${title} will fall back to the system default.` : `${title} will use the general price in this state.`}
        confirmLabel="Remove"
        tone="danger"
        loading={deleting}
        onConfirm={remove}
      />
    </>
  );
}
