// opportunityScoringService
// Calculates a 0-100 opportunity score and a High/Medium/Low priority for
// backlink gap opportunities. Used by competitorAnalysisService.
export function scoreOpportunity(o) {
  const da = o.domain_authority || 0;
  const traffic = o.traffic || 0;
  const relevance = o.relevance_score || 0;
  const numCompetitors = o.numCompetitors || 1;
  const compRatio = numCompetitors > 0 ? Math.min(1, (o.competitor_count || 1) / numCompetitors) : 0;
  const guest = o.guest_post_available ? 1 : 0;

  // Domain authority: 0-35
  const daScore = Math.min(35, (da / 90) * 35);
  // Estimated traffic (log scale): 0-15
  const trafficScore = Math.min(15, (Math.log10(Math.max(10, traffic)) / 6) * 15);
  // Topical relevance: 0-20
  const relScore = (relevance / 100) * 20;
  // Number of competitors linking from this domain: 0-20
  const compScore = compRatio * 20;
  // Link quality / type + guest post availability: 0-10
  const typeBonuses = {
    "Guest Post": 4,
    "Editorial": 3,
    "Editorial Links": 3,
    "Resource Page": 2,
    "Blog Link": 1
  };
  let typeScore = guest * 5 + (typeBonuses[o.backlink_type] || 0);
  typeScore = Math.min(10, typeScore);

  const total = Math.round(daScore + trafficScore + relScore + compScore + typeScore);
  return Math.max(0, Math.min(100, total));
}

export function priorityFromScore(score) {
  if (score >= 75) return "High";
  if (score >= 50) return "Medium";
  return "Low";
}

export function scoreLabel(score) {
  if (score >= 85) return "Excellent Opportunity";
  if (score >= 70) return "Strong Opportunity";
  if (score >= 50) return "Good Opportunity";
  return "Low Priority";
}