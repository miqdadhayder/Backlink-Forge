import React from "react";
import { AlertTriangle, ShieldCheck, ShieldAlert } from "lucide-react";

const LEVELS = {
  Low: { color: "text-emerald-600", bg: "bg-emerald-50", ring: "ring-emerald-200", icon: ShieldCheck, emoji: "🟢" },
  Medium: { color: "text-amber-600", bg: "bg-amber-50", ring: "ring-amber-200", icon: ShieldAlert, emoji: "🟡" },
  High: { color: "text-rose-600", bg: "bg-rose-50", ring: "ring-rose-200", icon: AlertTriangle, emoji: "🔴" }
};

export default function RiskAnalysis({ report }) {
  const lvl = LEVELS[report.risk_level] || LEVELS.Low;
  const Icon = lvl.icon;
  const signals = report.risk_signals || [];
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900">Backlink Risk Analysis</h3>
        <span className={`inline-flex items-center gap-1.5 rounded-full ${lvl.bg} px-3 py-1 text-sm font-medium ${lvl.color} ring-1 ${lvl.ring}`}>
          <span>{lvl.emoji}</span> {report.risk_level} Risk
        </span>
      </div>

      <p className="mt-4 text-sm text-slate-600">
        <span className="font-semibold text-slate-900">Risk Assessment:</span>{" "}
        {signals.length === 0
          ? "No suspicious or low-quality signals were detected on the fetched source page. A single weak signal alone does not make a backlink toxic."
          : `${signals.length} signal(s) were detected. A weak signal does not automatically make the backlink toxic — review the evidence below.`}
      </p>

      {signals.length > 0 && (
        <ul className="mt-4 space-y-3">
          {signals.map((s) => (
            <li key={s.key} className="flex gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3">
              <span className={`mt-0.5 inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full ${
                s.severity === "critical" ? "bg-rose-500" : s.severity === "major" ? "bg-amber-500" : "bg-slate-400"}`} />
              <div>
                <p className="text-sm font-medium text-slate-900">{s.label} <span className="text-xs font-normal text-slate-400">({s.severity})</span></p>
                <p className="mt-0.5 text-xs text-slate-600">{s.explanation}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex items-start gap-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
        <Icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" />
        <p>This tool does not automatically recommend Google's disavow process based solely on its score. Manual review is always advised before taking action.</p>
      </div>
    </div>
  );
}