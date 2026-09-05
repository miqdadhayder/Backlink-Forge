import React from "react";

const STEPS = [
  "Analyzing your website...",
  "Finding relevant opportunities...",
  "Filtering opportunities..."
];

export default function LoadingState() {
  const [step, setStep] = React.useState(0);

  React.useEffect(() => {
    const id = setInterval(() => {
      setStep((s) => (s < STEPS.length - 1 ? s + 1 : s));
    }, 900);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
      <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />
      <p className="mt-5 text-base font-medium text-slate-900">{STEPS[step]}</p>
      <p className="mt-1 text-sm text-slate-500">This usually takes a few seconds.</p>
      <div className="mx-auto mt-6 flex max-w-xs items-center justify-center gap-2">
        {STEPS.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 flex-1 rounded-full transition ${
              i <= step ? "bg-slate-900" : "bg-slate-200"
            }`}
          />
        ))}
      </div>
    </div>
  );
}