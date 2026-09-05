import React from "react";
import InfoTip from "./infoTip";

function dot(score) {
  if (score == null) return "bg-slate-300";
  if (score >= 75) return "bg-emerald-500";
  if (score >= 50) return "bg-amber-500";
  if (score >= 25) return "bg-orange-500";
  return "bg-rose-500";
}

export default function FactorCard({ factor }) {
  const f = factor;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <h4 className="flex items-center text-sm font-semibold text-slate-900">
          {f.name}
          <InfoTip term={f.name} />
        </h4>
        {f.available ? (
          <span className="text-sm font-semibold text-slate-900">{f.score}<span className="text-slate-400">/100</span></span>
        ) : (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">N/A</span>
        )}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <span className={`inline-block h-2.5 w-2.5 rounded-full ${dot(f.score)}`} />
        <span className="text-sm font-medium text-slate-700">{f.status}{f.estimated ? " · Estimated" : ""}</span>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-slate-500">{f.explanation}</p>
    </div>
  );
}