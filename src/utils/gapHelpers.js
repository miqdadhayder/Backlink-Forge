export function scoreLabel(score) {
  if (score >= 85) return "Excellent Opportunity";
  if (score >= 70) return "Strong Opportunity";
  if (score >= 50) return "Good Opportunity";
  return "Low Priority";
}

export function priorityBadge(priority) {
  if (priority === "High") return "bg-rose-50 text-rose-600";
  if (priority === "Medium") return "bg-amber-50 text-amber-600";
  return "bg-slate-100 text-slate-500";
}

export function priorityEmoji(priority) {
  if (priority === "High") return "🔥 High";
  if (priority === "Medium") return "🟡 Medium";
  return "⚪ Low";
}