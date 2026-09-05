export function formatTraffic(n) {
  if (!n && n !== 0) return "—";
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1000) return Math.round(n / 1000) + "K";
  return String(n);
}

export function difficultyColor(d) {
  if (d === "Easy") return "text-emerald-600 bg-emerald-50";
  if (d === "Medium") return "text-amber-600 bg-amber-50";
  return "text-rose-600 bg-rose-50";
}

export function daColor(da) {
  if (da >= 70) return "text-emerald-600";
  if (da >= 40) return "text-amber-600";
  return "text-slate-500";
}

export function relevanceColor(score) {
  if (score >= 85) return "bg-emerald-500";
  if (score >= 70) return "bg-amber-500";
  return "bg-slate-400";
}