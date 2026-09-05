import React from "react";
import { CheckCircle2, Eye, Search, AlertOctagon } from "lucide-react";

const ACTIONS = {
  Keep: { icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50", ring: "ring-emerald-200", title: "Keep" },
  Monitor: { icon: Eye, color: "text-slate-700", bg: "bg-slate-50", ring: "ring-slate-200", title: "Monitor" },
  Investigate: { icon: Search, color: "text-amber-600", bg: "bg-amber-50", ring: "ring-amber-200", title: "Investigate" },
  "Consider Removal": { icon: AlertOctagon, color: "text-rose-600", bg: "bg-rose-50", ring: "ring-rose-200", title: "Consider Removal" }
};

export default function Recommendation({ report }) {
  const a = ACTIONS[report.recommendation?.action] || ACTIONS.Investigate;
  const Icon = a.icon;
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ring-1 ${a.ring}`}>
      <div className="flex items-center gap-3">
        <span className={`flex h-10 w-10 items-center justify-center rounded-full ${a.bg} ${a.color}`}>
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <h3 className="text-base font-semibold text-slate-900">What Should You Do?</h3>
          <p className={`text-lg font-semibold ${a.color}`}>{a.title}</p>
        </div>
      </div>
      <p className="mt-3 text-sm text-slate-600">{report.recommendation?.text}</p>
    </div>
  );
}