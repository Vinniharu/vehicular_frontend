"use client";

// Admin portal building blocks on top of the customer portal kit
// (app/dashboard/_kit). Same cx tokens, denser layouts for data-heavy pages.

import { useId } from "react";
import { MapPin, Search } from "lucide-react";
import { Badge, Button, Input, Select, Sheet } from "@/app/dashboard/_kit";

const cx = (...parts) => parts.filter(Boolean).join(" ");

/* ── Money ──────────────────────────────────────────────────────────── */

const NAIRA = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0, maximumFractionDigits: 2 });

/** Kobo → "₦1,500" (or the fallback for null/undefined). */
export function formatNaira(kobo, fallback = "—") {
  if (kobo === null || kobo === undefined || kobo === "") return fallback;
  return NAIRA.format(Number(kobo) / 100);
}

/** Kobo → plain naira string for an input ("1500"), "" when unset. */
export function toNaira(kobo) {
  if (kobo === null || kobo === undefined || kobo === "") return "";
  return String(Number(kobo) / 100);
}

/** Naira input text → kobo; null when blank, NaN when not a number. */
export function toKobo(naira) {
  const s = String(naira ?? "").replace(/,/g, "").trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? Math.round(n * 100) : NaN;
}

/** Validates a naira input. Returns an error message or null. */
export function moneyError(naira, { required = false, allowZero = true } = {}) {
  const k = toKobo(naira);
  if (k === null) return required ? "Enter an amount." : null;
  if (Number.isNaN(k)) return "Enter numbers only, e.g. 15000.";
  if (k < 0) return "Amount can't be negative.";
  if (!allowZero && k === 0) return "Amount must be more than ₦0.";
  return null;
}

export function MoneyInput({ value, onChange, placeholder, invalid, ...props }) {
  return (
    <Input
      inputMode="decimal"
      autoComplete="off"
      prefix={<span className="text-[15px] font-medium">₦</span>}
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/[^\d.,]/g, ""))}
      placeholder={placeholder}
      invalid={invalid}
      {...props}
    />
  );
}

export function PercentInput({ value, onChange, placeholder, ...props }) {
  return (
    <div className="relative">
      <Input
        inputMode="decimal"
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^\d.]/g, ""))}
        placeholder={placeholder}
        className="pr-10"
        {...props}
      />
      <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-cx-muted">%</span>
    </div>
  );
}

/** One consistent way to say a value comes from somewhere else. */
export function InheritedHint({ children }) {
  return <span className="text-[13px] text-cx-muted">{children}</span>;
}

/* ── Layout helpers ─────────────────────────────────────────────────── */

export function StatTile({ label, value, hint, icon: Icon, tone = "neutral", href }) {
  const toneCls = { neutral: "text-cx-muted", brand: "text-cx-brand", amber: "text-cx-amber", red: "text-cx-red" }[tone];
  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[13px] font-medium text-cx-muted">{label}</p>
        {Icon ? <Icon className={cx("h-5 w-5", toneCls)} aria-hidden /> : null}
      </div>
      <p className="mt-1.5 truncate text-[22px] font-semibold leading-tight text-cx-ink">{value}</p>
      {hint ? <p className="mt-0.5 truncate text-[13px] text-cx-muted">{hint}</p> : null}
    </>
  );
  const cls = "block rounded-cx-lg border border-cx-line bg-cx-surface p-4 shadow-cx";
  return href ? (
    <a href={href} className={cx(cls, "cx-focus hover:border-cx-brand/50")}>{body}</a>
  ) : (
    <div className={cls}>{body}</div>
  );
}

/**
 * Segmented tabs on wide screens; a dropdown on phones so nothing scrolls
 * sideways. tabs: [{ id, label, count? }]
 */
export function Tabs({ tabs, value, onChange, label = "Sections", className }) {
  const id = useId();
  return (
    <div className={className}>
      <div className="sm:hidden">
        <label htmlFor={id} className="sr-only">{label}</label>
        <Select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
          {tabs.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
              {t.count !== undefined ? ` (${t.count})` : ""}
            </option>
          ))}
        </Select>
      </div>
      <div role="tablist" aria-label={label} className="hidden flex-wrap gap-1 rounded-cx bg-cx-sunken p-1 sm:inline-flex">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={value === t.id}
            onClick={() => onChange(t.id)}
            className={cx(
              "cx-focus min-h-10 rounded-cx-sm px-4 text-[15px] font-semibold transition-colors",
              value === t.id ? "bg-cx-surface text-cx-ink shadow-cx" : "text-cx-muted hover:text-cx-ink"
            )}
          >
            {t.label}
            {t.count !== undefined ? <span className={cx("ml-1.5 text-sm", value === t.id && "text-cx-brand-deep")}>{t.count}</span> : null}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Search box + filters that stack on phones. */
export function Toolbar({ search, onSearch, placeholder = "Search", children }) {
  return (
    <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center">
      {onSearch ? (
        <div className="flex-1">
          <Input
            type="search"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={placeholder}
            aria-label={placeholder}
            prefix={<Search className="h-4 w-4" aria-hidden />}
          />
        </div>
      ) : null}
      {children ? <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap md:flex-nowrap">{children}</div> : null}
    </div>
  );
}

/**
 * Table on md+, stacked cards on phones.
 * columns: [{ key, header, render?(row), className?, hideOnMobile?, primary? }]
 * The `primary` column is the card title on phones.
 */
export function ResponsiveTable({ columns, rows, rowKey, onRowClick, empty = "Nothing to show." }) {
  if (!rows?.length) {
    return <p className="rounded-cx-lg border border-dashed border-cx-line-strong bg-cx-surface px-4 py-8 text-center text-sm text-cx-muted">{empty}</p>;
  }
  const cell = (col, row) => (col.render ? col.render(row) : row[col.key] ?? "—");
  const primary = columns.find((c) => c.primary) || columns[0];
  const rest = columns.filter((c) => c !== primary && !c.hideOnMobile);
  return (
    <>
      <div className="hidden overflow-hidden rounded-cx-lg border border-cx-line bg-cx-surface shadow-cx md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-cx-line bg-cx-sunken/60">
            <tr>
              {columns.map((c) => (
                <th key={c.key} scope="col" className={cx("px-4 py-3 font-semibold text-cx-ink-2", c.className)}>
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-cx-line">
            {rows.map((row, i) => (
              <tr
                key={rowKey ? rowKey(row) : i}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cx(onRowClick && "cursor-pointer hover:bg-cx-sunken/60")}
              >
                {columns.map((c) => (
                  <td key={c.key} className={cx("px-4 py-3 align-middle text-cx-ink", c.className)}>
                    {cell(c, row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="space-y-2 md:hidden">
        {rows.map((row, i) => {
          const Tag = onRowClick ? "button" : "div";
          return (
            <li key={rowKey ? rowKey(row) : i}>
              <Tag
                type={onRowClick ? "button" : undefined}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cx("block w-full rounded-cx-lg border border-cx-line bg-cx-surface p-4 text-left shadow-cx", onRowClick && "cx-focus hover:border-cx-brand/50")}
              >
                <div className="text-[15px] font-semibold text-cx-ink">{cell(primary, row)}</div>
                <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2">
                  {rest.map((c) => (
                    <div key={c.key} className="min-w-0">
                      <dt className="text-xs text-cx-muted">{c.header}</dt>
                      <dd className="truncate text-sm text-cx-ink">{cell(c, row)}</dd>
                    </div>
                  ))}
                </dl>
              </Tag>
            </li>
          );
        })}
      </ul>
    </>
  );
}

/* ── Confirm ────────────────────────────────────────────────────────── */

export function ConfirmSheet({ open, onOpenChange, title, description, confirmLabel = "Confirm", tone = "primary", loading, onConfirm, children }) {
  return (
    <Sheet
      open={open}
      onOpenChange={(o) => !loading && onOpenChange(o)}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
          <Button block variant={tone === "danger" ? "danger" : "primary"} loading={loading} onClick={onConfirm}>{confirmLabel}</Button>
        </>
      }
    >
      {children || <span className="sr-only">{title}</span>}
    </Sheet>
  );
}

/* ── Scope ──────────────────────────────────────────────────────────── */

/** "General (all states)" vs one state. value: "" for general, or a state id. */
export function ScopePicker({ states, value, onChange, label = "Prices for" }) {
  const id = useId();
  const current = states.find((s) => String(s.id) === String(value));
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <label htmlFor={id} className="text-sm font-medium text-cx-ink-2">{label}</label>
      <Select id={id} value={value ?? ""} onChange={(e) => onChange(e.target.value)} className="sm:w-64">
        <option value="">General (all states)</option>
        {states.map((s) => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </Select>
      <Badge tone={current ? "amber" : "brand"} className="self-start sm:self-auto">
        <MapPin className="h-3.5 w-3.5" aria-hidden />
        {current ? `Editing ${current.name} only` : "Editing every state"}
      </Badge>
    </div>
  );
}

/* ── Switch ─────────────────────────────────────────────────────────── */

export function Switch({ checked, onChange, label, description, disabled }) {
  const id = useId();
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <label htmlFor={id} className="text-[15px] font-medium text-cx-ink">{label}</label>
        {description ? <p className="text-[13px] text-cx-muted">{description}</p> : null}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={!!checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cx(
          "cx-focus relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors disabled:opacity-60",
          checked ? "bg-cx-brand" : "bg-cx-line-strong"
        )}
      >
        <span className={cx("inline-block h-5 w-5 rounded-full bg-white shadow transition-transform", checked ? "translate-x-6" : "translate-x-1")} />
      </button>
    </div>
  );
}
