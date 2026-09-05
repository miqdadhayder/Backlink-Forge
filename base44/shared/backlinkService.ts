// backlinkService
// Orchestrates searchService + domainMetricsService + guestPostService to build
// a full opportunity list. This is the single entry point the backend function uses.
import { findCandidateSites } from "./searchService.ts";
import { getDomainMetrics } from "./domainMetricsService.ts";
import { enrichGuestPost } from "./guestPostService.ts";
import { secrets } from "base44:runtime";

export function isLiveMode() {
  return Boolean(
    secrets.get("MOZ_API_KEY") || secrets.get("AHREFS_API_KEY") ||
    secrets.get("SERPAPI_KEY") || secrets.get("DATAFORSEO_KEY") ||
    secrets.get("GUESTPOST_API_KEY")
  );
}

function difficultyFromDa(da) {
  if (da >= 70) return "Hard";
  if (da >= 40) return "Medium";
  return "Easy";
}

function relevanceForNiche(targetNiche, siteNiche) {
  const a = (targetNiche || "").toLowerCase();
  const b = (siteNiche || "").toLowerCase();
  let score = 60 + (Math.abs(a.length - b.length) % 30);
  if (a && b && (a.includes(b) || b.includes(a))) score = 95;
  return Math.min(99, score);
}

export async function generateOpportunities(params) {
  const {
    keyword,
    country = "Global",
    backlink_type = "All Opportunities",
    minimum_da = 20,
    results_count = 25,
    competitor_url = null
  } = params;

  const isDemo = !isLiveMode();
  const candidateCount = Math.max(results_count * 2, 30);
  const candidates = await findCandidateSites(keyword, country, candidateCount);

  let opportunities = [];
  for (const c of candidates) {
    const metrics = await getDomainMetrics(c.domain, c.niche);
    if (metrics.domain_authority < minimum_da) continue;
    const gp = await enrichGuestPost(c.domain, c.backlink_type);
    opportunities.push({
      website: c.website,
      url: `https://${c.domain}`,
      domain_authority: metrics.domain_authority,
      traffic: metrics.traffic,
      niche: c.niche,
      backlink_type: competitor_url ? "Competitor Opportunity" : c.backlink_type,
      ...gp,
      relevance_score: relevanceForNiche(keyword, c.niche),
      difficulty: difficultyFromDa(metrics.domain_authority),
      status: "Available",
      country,
      is_demo: isDemo
    });
    if (opportunities.length >= results_count) break;
  }

  // Sort by relevance then DA desc
  opportunities.sort((a, b) =>
    b.relevance_score - a.relevance_score || b.domain_authority - a.domain_authority
  );

  return { opportunities, is_demo: isDemo };
}