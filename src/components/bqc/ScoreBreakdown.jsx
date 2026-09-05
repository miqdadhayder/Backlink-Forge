import React from "react";
import FactorCard from "./FactorCard";

export default function ScoreBreakdown({ factors }) {
  if (!factors || !factors.length) {
    return <p className="text-sm text-slate-500">No breakdown available.</p>;
  }
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-base font-semibold text-slate-900">Quality Breakdown</h3>
      <p className="mt-1 text-sm text-slate-500">Each factor is scored from signals that could be verified or explicitly estimated.</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {factors.map((f) => <FactorCard key={f.key} factor={f} />)}
      </div>
    </div>
  );
}