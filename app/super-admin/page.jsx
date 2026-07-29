"use client";

import { useState, useEffect } from "react";
import { Users, UserCog, Briefcase, Shield, ShieldCheck, CheckCircle2, XCircle } from "lucide-react";
import { superAdminGetUserStats } from "@/lib/api";

const ROLE_META = {
  customer: { label: "Customers", icon: Users, color: "#28A745" },
  staff: { label: "Staff", icon: UserCog, color: "#6366f1" },
  agent: { label: "Agents", icon: Briefcase, color: "#f59e0b" },
  admin: { label: "Admins", icon: Shield, color: "#0ea5e9" },
  super_admin: { label: "Super Admins", icon: ShieldCheck, color: "#8b5cf6" },
};

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    superAdminGetUserStats().then((res) => {
      if (res.data) setStats(res.data);
      else setError(res.error || "Could not load account stats.");
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6 pb-16" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      <div>
        <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">Platform Accounts</h1>
        <p className="text-[13px] text-slate-500 mt-1">Every account type across Vehiculars, at a glance.</p>
      </div>

      {loading ? (
        <div className="py-20 text-center text-[13px] text-slate-400">Loading account stats&hellip;</div>
      ) : error ? (
        <div className="py-20 text-center text-[13px] text-red-500">{error}</div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-white rounded-xl border border-slate-200 px-4 py-4 shadow-sm">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Total Accounts</p>
              <p className="text-[28px] font-bold text-slate-900 mt-1 leading-none">{stats.total}</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 px-4 py-4 shadow-sm">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Active
              </p>
              <p className="text-[28px] font-bold text-slate-900 mt-1 leading-none">{stats.active}</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 px-4 py-4 shadow-sm">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                <XCircle className="h-3 w-3 text-slate-400" /> Inactive
              </p>
              <p className="text-[28px] font-bold text-slate-900 mt-1 leading-none">{stats.inactive}</p>
            </div>
          </div>

          <div>
            <h2 className="text-[13px] font-bold uppercase tracking-wide text-slate-500 mb-3">By Account Type</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {Object.entries(ROLE_META).map(([role, meta]) => {
                const Icon = meta.icon;
                const count = stats.by_role[role] || 0;
                return (
                  <div key={role} className="bg-white rounded-xl border border-slate-200 px-4 py-4 shadow-sm">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg mb-2.5" style={{ background: `${meta.color}15`, color: meta.color }}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <p className="text-[20px] font-bold text-slate-900 leading-none">{count}</p>
                    <p className="text-[11.5px] text-slate-500 mt-1">{meta.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
