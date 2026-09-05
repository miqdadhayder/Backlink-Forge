import React from "react";

const STEPS = [
  "Checking URL",
  "Analyzing source page",
  "Checking link attributes",
  "Evaluating relevance",
  "Evaluating authority signals",
  "Calculating quality score"
];

export default function QualityLoading() {
  const [step, setStep] = React.useState(0);
  React.useEffect(() => {
    const id = setInterval(() => {
      setStep((s) => (s < STEPS.length - 1 ? s + 1 : s));
    }, 700);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
      <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />
      <p className="mt-5 text-base font-medium text-slate-900">Analyzing backlink…</p>
      <p className="mt-1 text-sm text-slate-500">Reading publicly available signals from the source page.</p>
      <div className="mx-auto mt-6 max-w-md">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2 py-1 text-left">
            <span className={`h-2 w-2 flex-shrink-0 rounded-full ${i <= step ? "bg-slate-900" : "bg-slate-200"}`} />
            <span className={`text-sm ${i <= step ? "text-slate-700" : "text-slate-400"}`}>{s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}