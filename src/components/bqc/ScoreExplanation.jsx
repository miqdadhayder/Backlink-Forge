import React from "react";
import { ChevronDown, ChevronUp, Info } from "lucide-react";

export default function ScoreExplanation({ report }) {
  const [open, setOpen] = React.useState(false);
  const confidence = report.data_confidence;
  const confColor = confidence === "High" ? "text-emerald-600 bg-emerald-50" : confidence === "Medium" ? "text-amber-600 bg-amber-50" : "text-rose-600 bg-rose-50";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between text-left" aria-expanded={open}>
        <span className="flex items-center gap-2 text-base font-semibold text-slate-900">
          <Info className="h-4 w-4 text-slate-400" /> How We Calculate the Score
        </span>
        {open ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
      </button>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${confColor}`}>
          Data confidence: {confidence}
        </span>
        <span className="text-xs text-slate-500">Computed only from verified / estimated signals — no fabricated metrics.</span>
      </div>

      {open && (
        <div className="mt-4 space-y-3 text-sm text-slate-600">
          <p>The overall score is a weighted average of the factors that actually have data. When a metric (such as domain authority or traffic) cannot be verified, its weight is excluded and the remaining weights are renormalized so the score still reflects real evidence.</p>
          <div className="overflow-hidden rounded-lg border border-slate-100">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500">
                <tr><th className="px-3 py-2 font-medium">Factor</th><th className="px-3 py-2 font-medium">Base weight</th><th className="px-3 py-2 font-medium">Status</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(report.methodology || []).map((m) => (
                  <tr key={m.factor}>
                    <td className="px-3 py-2 text-slate-700">{m.factor}</td>
                    <td className="px-3 py-2 text-slate-500">{m.included ? `${m.weight}%` : "—"}</td>
                    <td className="px-3 py-2">{m.included ? <span className="text-emerald-600">Included</span> : <span className="text-slate-400">Not available — excluded</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-500">Base weights: Relevance 20%, Link Placement 15%, Link Attribute 10%, Page Quality 10%, Indexability 10%, Anchor Text 5%, Risk Signals 10%. Domain authority (20%) and traffic signals require a connected SEO data provider and are excluded when unavailable.</p>
        </div>
      )}
    </div>
  );
}