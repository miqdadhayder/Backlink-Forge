import React from "react";

function colorFor(score) {
  if (score >= 75) return "#16a34a";
  if (score >= 50) return "#ca8a04";
  if (score >= 25) return "#ea580c";
  return "#dc2626";
}

export default function ScoreGauge({ score = 0, classification, label }) {
  const r = 70;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score)) / 100;
  const dash = circ * pct;
  const col = colorFor(score);
  return (
    <div className="flex flex-col items-center">
      <svg width="180" height="180" viewBox="0 0 180 180" role="img" aria-label={`Quality score ${score} out of 100`}>
        <circle cx="90" cy="90" r={r} fill="none" stroke="#e2e8f0" strokeWidth="14" />
        <circle
          cx="90" cy="90" r={r} fill="none" stroke={col} strokeWidth="14" strokeLinecap="round"
          strokeDasharray={`${dash} ${circ - dash}`}
          transform="rotate(-90 90 90)"
          style={{ transition: "stroke-dasharray 0.6s ease" }}
        />
        <text x="90" y="86" textAnchor="middle" className="fill-slate-900" style={{ fontSize: 40, fontWeight: 700 }}>{score}</text>
        <text x="90" y="108" textAnchor="middle" className="fill-slate-400" style={{ fontSize: 13, fontWeight: 500 }}>/ 100</text>
      </svg>
      {classification && (
        <div className="mt-2 text-center">
          <p className="text-lg font-semibold" style={{ color: col }}>{classification}</p>
          {label && <p className="text-sm text-slate-500">{label}</p>}
        </div>
      )}
    </div>
  );
}