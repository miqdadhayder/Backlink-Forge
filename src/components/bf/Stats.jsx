import React from "react";

const STATS = [
  { value: "10K+", label: "Opportunities Discovered" },
  { value: "2K+", label: "Guest Posting Sites" },
  { value: "50+", label: "Niches Covered" }
];

export default function Stats() {
  return (
    <section className="bg-slate-900 py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p className="text-center text-xs font-medium uppercase tracking-wider text-slate-400">
          Illustrative figures — not live company statistics
        </p>
        <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-3">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">{s.value}</div>
              <div className="mt-2 text-sm text-slate-400">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}