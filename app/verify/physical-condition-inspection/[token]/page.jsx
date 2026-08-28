"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ShieldCheck, XCircle, Loader2 } from "lucide-react";
import { getPublicPciVerification } from "@/lib/api";

function gradeBadgeClass(grade) {
  if (grade === "good") return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  if (grade === "fair") return "bg-amber-50 text-amber-700 ring-amber-200";
  return "bg-red-50 text-red-700 ring-red-200";
}

export default function PublicPciVerifyPage() {
  const params = useParams();
  const token = params?.token;

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!token) return;
    getPublicPciVerification(token).then((res) => {
      if (res.error || !res.data) {
        setNotFound(true);
      } else {
        setResult(res.data);
      }
      setLoading(false);
    });
  }, [token]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-[#E5E5E5] bg-white p-8 text-center shadow-sm">
        <p className="mb-6 text-[13px] font-bold uppercase tracking-wide text-slate-400">Vehiculars</p>

        {loading && (
          <div className="py-10">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-slate-300" />
          </div>
        )}

        {!loading && notFound && (
          <div className="py-8">
            <XCircle className="mx-auto h-12 w-12 text-slate-300" />
            <h1 className="mt-3 text-[16px] font-bold text-slate-800">Verification code not found</h1>
            <p className="mt-1.5 text-[13px] text-slate-500">This code doesn't match a released condition inspection report.</p>
          </div>
        )}

        {!loading && result && (
          <div>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
              <ShieldCheck className="h-7 w-7 text-emerald-600" />
            </div>
            <h1 className="mt-3 text-[18px] font-bold text-slate-900">Physical Condition Inspection</h1>
            <p className="mt-1 text-[13px] text-slate-500">
              {result.make} {result.model} {result.year} — {result.plate_number}
            </p>
            <p className="mt-0.5 text-[12px] text-slate-400">
              Inspected {result.verified_at ? new Date(result.verified_at).toLocaleDateString() : "—"}
            </p>

            <div className="mt-5 space-y-3">
              <span className={`inline-block rounded-full px-4 py-1.5 text-[13px] font-bold uppercase ring-1 ring-inset ${gradeBadgeClass(result.overall_grade)}`}>
                Overall: {result.overall_grade?.replace(/_/g, " ") || "—"}
              </span>

              <div className="flex flex-wrap justify-center gap-1.5 pt-1">
                {[
                  ["Exterior & body", result.exterior_grade],
                  ["Engine bay", result.engine_bay_grade],
                  ["Underbody", result.underbody_grade],
                  ["Interior", result.interior_grade],
                  ["Road test", result.road_test_grade],
                ].filter(([, grade]) => grade).map(([sectionLabel, grade]) => (
                  <span key={sectionLabel} className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${gradeBadgeClass(grade)}`}>
                    {sectionLabel}: {grade.replace(/_/g, " ")}
                  </span>
                ))}
              </div>
            </div>

            <p className="mt-6 text-[11px] leading-relaxed text-slate-400">
              This confirms a Vehiculars-graded condition inspection was completed for this vehicle. Condition reflects the vehicle at the time of inspection only.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
