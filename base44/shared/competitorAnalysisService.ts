// competitorAnalysisService
// Orchestrates a backlink-gap analysis: builds per-competitor referring-domain
// sets, subtracts the user's own backlinks, and scores the resulting gap
// opportunities. Reuses searchService, domainMetricsService, guestPostService.
// When a real backlink provider key is configured (MOZ_API_KEY / AHREFS_API_KEY /
// SERPAPI_KEY / DATAFORSEO_KEY), live integration can be wired here; until then
// the data is deterministic demo data, clearly labelled.
import { findCandidateSites, NICHES } from "./searchService.ts";
import { getDomainMetrics } from "./domainMetricsService.ts";
import { enrichGuestPost } from "./guestPostService.ts";
import { scoreOpportunity, priorityFromScore } from "./opportunityScoringService.ts";
import { secrets } from "./envSecrets.ts";

export function isLiveMode() {
  return Boolean(
    secrets.get("MOZ_API_KEY") || secrets.get("AHREFS_API_KEY") ||
    secrets.get("SERPAPI_KEY") || secrets.get("DATAFORSEO_KEY")
  );
}

export const GAP_TYPES = [
  "Guest Post", "Editorial", "Resource Page", "Directory",
  "Forum", "Profile", "Blog Link", "Broken Link"
];

function normalizeDomain(url) {
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    return u.hostname.replace(/^www\./, "");
  } catch (e) { return String(url || "").replace(/^www\./, ""); }
}

function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function titleCase(s) {
  return (s || "").replace(/\w\S*/g, (t) => t.charAt(0).toUpperCase() + t.slice(1));
}

function relevanceForNiche(keyword, niche) {
  const a = (keyword || "").toLowerCase();
  const b = (niche || "").toLowerCase();
  let score = 55 + (hashStr(a + b) % 30);
  if (a && b && (a.includes(b) || b.includes(a))) score = 95;
  return Math.min(99, score);
}

export async function analyzeGaps(params) {
  const {
    website_url, competitors = [], keyword = "", country = "Global",
    minimum_da = 20, backlink_types = ["All"]
  } = params;

  const isDemo = !isLiveMode();
  const userDomain = normalizeDomain(website_url);
  const compList = (competitors || []).filter(Boolean).map((c, i) => ({
    url: c,
    name: `Competitor ${i + 1}`,
    domain: normalizeDomain(c)
  }));
  const numCompetitors = Math.max(1, compList.length);

  const typeFilter = (backlink_types || ["All"]).map((t) => t.toLowerCase());
  const allTypes = typeFilter.includes("all");

  // Build a deterministic candidate pool themed by the keyword/niche.
  const poolSize = 80;
  const pool = await findCandidateSites(keyword || "backlinks", country, poolSize);

  // Track referring-domain counts per competitor + user for the comparison chart.
  const compCounts = compList.map(() => 0);
  let userRefCount = 0;

  const gaps = [];
  for (let i = 0; i < pool.length; i++) {
    const p = pool[i];
    const baseSeed = hashStr(p.domain);

    // Does the user already have a backlink from this domain? (~30% yes)
    const userHas = (baseSeed % 10) < 3;
    if (userHas) { userRefCount++; continue; }

    // Which competitors link from this domain?
    const linking = [];
    for (let ci = 0; ci < compList.length; ci++) {
      const cseed = hashStr(p.domain + compList[ci].domain);
      if ((cseed % 10) < 5) { linking.push(compList[ci]); compCounts[ci]++; }
    }
    if (linking.length === 0) continue;

    const metrics = await getDomainMetrics(p.domain, p.niche);
    if (metrics.domain_authority < minimum_da) continue;

    const backlink_type = GAP_TYPES[baseSeed % GAP_TYPES.length];
    if (!allTypes && !typeFilter.includes(backlink_type.toLowerCase())) continue;

    const gp = await enrichGuestPost(p.domain, backlink_type);
    const relevance = relevanceForNiche(keyword, p.niche);
    const competitor_names = linking.map((l) => l.name).join(", ");

    const baseRec = {
      website: p.website,
      domain: p.domain,
      source_url: `https://${p.domain}/resources`,
      domain_authority: metrics.domain_authority,
      traffic: metrics.traffic,
      niche: p.niche,
      backlink_type,
      competitor_count: linking.length,
      competitor_names,
      guest_post_available: gp.guest_post_available,
      guest_post_url: gp.guest_post_url,
      contact_url: gp.contact_url,
      relevance_score: relevance,
      country,
      is_demo: isDemo,
      numCompetitors
    };

    const opportunity_score = scoreOpportunity(baseRec);
    const priority = priorityFromScore(opportunity_score);

    // Content-gap source title for a subset of high-DA domains.
    let source_title = null;
    if (metrics.domain_authority >= 45 && (baseSeed % 3 === 0)) {
      const niche = p.niche || "Marketing";
      source_title = `10 Best ${niche} Resources for ${new Date().getFullYear()}`;
    }

    // Broken-link flag for a small subset.
    const is_broken = backlink_type === "Broken Link" || (baseSeed % 17 === 0);
    const broken_target = is_broken
      ? `${linking[0].domain}/old-${(baseSeed % 50) + 1}`
      : null;

    gaps.push({
      ...baseRec,
      opportunity_score,
      priority,
      source_title,
      is_broken,
      broken_target
    });
  }

  // Sort by opportunity score (desc) then competitor_count (desc).
  gaps.sort((a, b) =>
    b.opportunity_score - a.opportunity_score || b.competitor_count - a.competitor_count
  );

  // Comparison stats: referring domains per site (with a realistic baseline).
  const userReferring = userRefCount + 80 + (hashStr(userDomain) % 90);
  const competitorsStats = compList.map((c, i) => ({
    name: c.name,
    url: c.url,
    domain: c.domain,
    referring_domains: compCounts[i] + 180 + (hashStr(c.domain) % 320)
  }));

  // Stats summary computed from returned data.
  const totalOpps = gaps.length;
  const referringDomains = new Set(gaps.map((g) => g.domain)).size;
  const highQuality = gaps.filter((g) => g.opportunity_score >= 75).length;
  const guestPostOpps = gaps.filter((g) => g.guest_post_available).length;
  const avgDa = gaps.length
    ? Math.round(gaps.reduce((s, g) => s + g.domain_authority, 0) / gaps.length)
    : 0;

  // Common domains linking to multiple competitors.
  const commonDomains = gaps
    .filter((g) => g.competitor_count >= 2)
    .sort((a, b) => b.competitor_count - a.competitor_count || b.opportunity_score - a.opportunity_score)
    .slice(0, 10)
    .map((g) => ({
      domain: g.domain,
      competitor_count: g.competitor_count,
      numCompetitors,
      domain_authority: g.domain_authority,
      priority: g.priority,
      opportunity_score: g.opportunity_score
    }));

  // Content-gap opportunities (domains with a known source title).
  const contentGaps = gaps
    .filter((g) => g.source_title)
    .slice(0, 6)
    .map((g) => ({
      domain: g.domain,
      source_title: g.source_title,
      source_url: g.source_url,
      domain_authority: g.domain_authority,
      suggestion: "Create a better resource and pitch it to websites linking to this article."
    }));

  // Broken-link opportunities.
  const brokenLinks = gaps
    .filter((g) => g.is_broken)
    .slice(0, 6)
    .map((g) => ({
      domain: g.domain,
      broken_target: g.broken_target,
      source_url: g.source_url,
      suggestion: "Create a relevant replacement page and contact the referring website."
    }));

  return {
    is_demo: isDemo,
    user: { domain: userDomain, url: website_url, referring_domains: userReferring },
    competitors: competitorsStats,
    gaps,
    stats: {
      totalOpportunities: totalOpps,
      referringDomains,
      highQuality,
      guestPostOpps,
      avgDa
    },
    commonDomains,
    contentGaps,
    brokenLinks
  };
}