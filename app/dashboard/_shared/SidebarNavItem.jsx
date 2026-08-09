"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { colors } from "@/lib/design-tokens";

const BRAND = colors.primary.DEFAULT;

// /dashboard/apply/[id] is a shared detail route for Driver's Licence,
// Tinted Permit, Number Plate, and Vehicle Particulars applications — path
// alone can't tell which type a given id belongs to, so the Driver's
// Licence child claims it by default; the other children only claim their
// own prefix.
const NON_DL_APPLY_PREFIXES = ["/dashboard/apply/tinted-permit", "/dashboard/apply/number-plate", "/dashboard/apply/vehicle-particulars"];

export function isChildActive(pathname, child) {
  if (child.href === "/dashboard/apply") {
    return (
      pathname === "/dashboard/apply" ||
      (pathname.startsWith("/dashboard/apply/") && !NON_DL_APPLY_PREFIXES.some((p) => pathname.startsWith(p)))
    );
  }
  return pathname === child.href || pathname.startsWith(child.href + "/");
}

export function isActive(pathname, item) {
  if (item.children) return item.children.some((c) => isChildActive(pathname, c));
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(item.href + "/");
}

const VARIANTS = {
  desktop: {
    rowClass: "group flex items-center gap-3 px-3 py-3 rounded-xl text-[13.5px] font-semibold transition-all w-full",
    iconBoxClass: "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all",
    iconClass: "h-[17px] w-[17px]",
    labelClass: "block",
    descClass: "block text-[11px] font-normal",
    showDot: true,
    childIndentClass: "ml-[19px] mt-0.5 space-y-0.5 border-l border-white/10 pl-3",
    childRowClass: "flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12.5px] font-semibold transition-all",
  },
  mobile: {
    rowClass: "flex items-center gap-3.5 px-4 py-3.5 rounded-xl transition-all w-full",
    iconBoxClass: "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
    iconClass: "h-5 w-5",
    labelClass: "text-[14px] font-semibold",
    descClass: "text-[11.5px]",
    showDot: false,
    childIndentClass: "ml-[21px] mt-0.5 space-y-0.5 border-l border-white/10 pl-3.5",
    childRowClass: "flex items-center gap-3 px-3.5 py-3 rounded-lg text-[13px] font-semibold transition-all",
  },
};

function LeafRow({ item, active, variant, onNavigate }) {
  const v = VARIANTS[variant];
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={v.rowClass}
      style={{ background: active ? "rgba(40, 167, 69,0.15)" : "transparent" }}
    >
      <div
        className={v.iconBoxClass}
        style={{ background: active ? BRAND : "rgba(255,255,255,0.06)", color: active ? "#fff" : "rgba(255,255,255,0.4)" }}
      >
        <Icon className={v.iconClass} />
      </div>
      <div className="min-w-0">
        <span className={v.labelClass} style={{ color: active ? "#fff" : "rgba(255,255,255,0.6)" }}>
          {item.label}
        </span>
        {item.desc && (
          <span className={v.descClass} style={{ color: active ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.25)" }}>
            {item.desc}
          </span>
        )}
      </div>
      {v.showDot && active && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />}
    </Link>
  );
}

function ChildRow({ child, active, variant, onNavigate }) {
  const v = VARIANTS[variant];
  const Icon = child.icon;
  return (
    <Link
      href={child.href}
      onClick={onNavigate}
      className={v.childRowClass}
      style={{ color: active ? "#fff" : "rgba(255,255,255,0.5)" }}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: active ? "#4ade80" : "rgba(255,255,255,0.35)" }} />
      <span>{child.label}</span>
      {active && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />}
    </Link>
  );
}

export default function SidebarNavItem({ item, pathname, variant, onNavigate }) {
  const v = VARIANTS[variant];
  const hasChildren = !!item.children;
  const active = isActive(pathname, item);

  const [expanded, setExpanded] = useState(() => hasChildren && item.children.some((c) => isChildActive(pathname, c)));

  useEffect(() => {
    if (hasChildren && item.children.some((c) => isChildActive(pathname, c))) {
      setExpanded(true);
    }
    // Only auto-expand on navigation to an active child — never auto-collapse
    // a group the user opened manually.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  if (!hasChildren) {
    return <LeafRow item={item} active={active} variant={variant} onNavigate={onNavigate} />;
  }

  const Icon = item.icon;
  const groupId = `nav-group-${item.label.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
        aria-controls={groupId}
        className={v.rowClass}
        style={{ background: active && !expanded ? "rgba(40, 167, 69,0.15)" : "transparent" }}
      >
        <div
          className={v.iconBoxClass}
          style={{ background: active ? BRAND : "rgba(255,255,255,0.06)", color: active ? "#fff" : "rgba(255,255,255,0.4)" }}
        >
          <Icon className={v.iconClass} />
        </div>
        <div className="min-w-0 flex-1 text-left">
          <span className={v.labelClass} style={{ color: active ? "#fff" : "rgba(255,255,255,0.6)" }}>
            {item.label}
          </span>
          {item.desc && (
            <span className={v.descClass} style={{ color: active ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.25)" }}>
              {item.desc}
            </span>
          )}
        </div>
        <ChevronDown
          className="h-3.5 w-3.5 shrink-0 transition-transform"
          style={{ color: "rgba(255,255,255,0.35)", transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            id={groupId}
            role="group"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className={v.childIndentClass}>
              {item.children.map((child) => (
                <ChildRow key={child.href} child={child} active={isChildActive(pathname, child)} variant={variant} onNavigate={onNavigate} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
