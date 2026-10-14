import { GOLD } from "@/app/components/landing/theme";

/**
 * Shared icon chip for every marketing "service card" surface — extracted
 * from 3 near-identical copies (services hub, landing Services section,
 * pricing page). Deliberately has no "use client" — must stay
 * server-renderable so app/services/page.jsx (a zero-client-JS route)
 * doesn't gain a client bundle just by using this.
 */
export default function ServiceIcon({ icon: Icon, tone = "brand", size = "md" }) {
  const sizeCls = size === "lg" ? "h-12 w-12 rounded-[14px]" : size === "sm" ? "h-9 w-9 rounded-[10px]" : "h-11 w-11 rounded-xl";
  const iconCls = size === "sm" ? "h-[18px] w-[18px]" : "h-5 w-5";
  const toneStyle =
    tone === "onDark"
      ? { background: `linear-gradient(145deg, ${GOLD}33, ${GOLD}12)`, color: GOLD, boxShadow: `inset 0 0 0 1px ${GOLD}33` }
      : tone === "brandStrong"
      ? { background: "linear-gradient(145deg, #28A745, #1f7a35)", color: "#ffffff", boxShadow: "0 6px 16px -8px rgba(40,167,69,0.7), inset 0 1px 0 rgba(255,255,255,0.2)" }
      : { background: "linear-gradient(145deg, rgba(40,167,69,0.14), rgba(40,167,69,0.06))", color: "#1f7a35", boxShadow: "inset 0 0 0 1px rgba(40,167,69,0.16)" };
  return (
    <span className={`inline-flex ${sizeCls} shrink-0 items-center justify-center`} style={toneStyle}>
      <Icon className={iconCls} />
    </span>
  );
}
