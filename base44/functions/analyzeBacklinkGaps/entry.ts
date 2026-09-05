import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { analyzeGaps } from "../../shared/competitorAnalysisService.ts";

const FREE_MONTHLY_LIMIT = 3;

function isValidUrl(str) {
  try {
    const u = new URL(str.startsWith("http") ? str : `https://${str}`);
    return Boolean(u.hostname && u.hostname.includes("."));
  } catch (e) { return false; }
}

function normalizeDomain(url) {
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    return u.hostname.replace(/^www\./, "").toLowerCase();
  } catch (e) { return String(url || "").toLowerCase().replace(/^www\./, ""); }
}

function isSameMonth(dateStr, ref) {
  const d = new Date(dateStr);
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth();
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Please sign in to run a backlink gap analysis." }, { status: 401 });

    const body = await req.json();
    const {
      website_url, competitors, keyword, country, minimum_da, backlink_types
    } = body || {};

    // Validate user website
    if (!website_url || !isValidUrl(website_url)) {
      return Response.json({ error: "Please enter a valid website URL." }, { status: 400 });
    }

    const compList = Array.isArray(competitors)
      ? competitors.map((c) => (c || "").trim()).filter(Boolean)
      : [];
    if (compList.length < 1 || compList.length > 5) {
      return Response.json({ error: "Please add between 1 and 5 competitor websites." }, { status: 400 });
    }
    for (const c of compList) {
      if (!isValidUrl(c)) {
        return Response.json({ error: "Please enter a valid competitor URL." }, { status: 400 });
      }
    }
    const userDom = normalizeDomain(website_url);
    const compDoms = compList.map(normalizeDomain);
    if (compDoms.some((d) => d === userDom)) {
      return Response.json({ error: "Your website cannot also be a competitor." }, { status: 400 });
    }
    const uniq = new Set(compDoms);
    if (uniq.size !== compDoms.length) {
      return Response.json({ error: "This competitor has already been added." }, { status: 400 });
    }

    // Usage limit (Free plan). Admins are unlimited.
    const now = new Date();
    let monthCount = 0;
    try {
      const recent = await base44.entities.BacklinkGapAnalysis.list("-created_date", 100);
      monthCount = (recent || []).filter((a) => isSameMonth(a.created_date, now)).length;
    } catch (e) { /* ignore */ }
    const isAdmin = user.role === "admin";
    if (!isAdmin && monthCount >= FREE_MONTHLY_LIMIT) {
      return Response.json({
        error: "You've reached your monthly competitor analysis limit. Upgrade your plan to continue."
      }, { status: 429 });
    }

    const result = await analyzeGaps({
      website_url,
      competitors: compList,
      keyword: (keyword || "").trim(),
      country: country || "Global",
      minimum_da: Math.min(90, Math.max(0, Number(minimum_da) || 20)),
      backlink_types: Array.isArray(backlink_types) && backlink_types.length ? backlink_types : ["All"]
    });

    // Persist the analysis + competitors + gaps (best-effort).
    let analysis_id = null;
    try {
      const analysis = await base44.entities.BacklinkGapAnalysis.create({
        website_url,
        keyword: (keyword || "").trim(),
        country: country || "Global",
        minimum_da: Math.min(90, Math.max(0, Number(minimum_da) || 20)),
        backlink_types: (Array.isArray(backlink_types) ? backlink_types : ["All"]).join(", "),
        status: "completed",
        result_count: result.gaps.length,
        is_demo: result.is_demo,
        competitors_summary: compList.join(", ")
      });
      analysis_id = analysis.id;

      if (result.competitors.length > 0) {
        await base44.entities.Competitor.bulkCreate(
          result.competitors.map((c) => ({
            analysis_id,
            competitor_url: c.url,
            competitor_name: c.name,
            referring_domains: c.referring_domains
          }))
        );
      }
      if (result.gaps.length > 0) {
        await base44.entities.BacklinkGap.bulkCreate(
          result.gaps.map((g) => ({
            analysis_id,
            domain: g.domain,
            source_url: g.source_url,
            source_title: g.source_title,
            domain_authority: g.domain_authority,
            traffic: g.traffic,
            backlink_type: g.backlink_type,
            competitor_count: g.competitor_count,
            competitor_names: g.competitor_names,
            relevance_score: g.relevance_score,
            opportunity_score: g.opportunity_score,
            priority: g.priority,
            guest_post_url: g.guest_post_url,
            contact_url: g.contact_url,
            niche: g.niche,
            country: g.country,
            is_broken: g.is_broken,
            is_demo: g.is_demo
          }))
        );
      }
    } catch (e) {
      // Persistence is best-effort; never block the result on storage failures.
    }

    return Response.json({
      analysis_id,
      is_demo: result.is_demo,
      user: result.user,
      competitors: result.competitors,
      gaps: result.gaps,
      stats: result.stats,
      commonDomains: result.commonDomains,
      contentGaps: result.contentGaps,
      brokenLinks: result.brokenLinks,
      query: {
        website_url,
        competitors: compList,
        keyword: (keyword || "").trim(),
        country: country || "Global",
        minimum_da,
        backlink_types: backlink_types || ["All"]
      },
      usage: {
        used: monthCount + 1,
        limit: isAdmin ? null : FREE_MONTHLY_LIMIT
      }
    });
  } catch (error) {
    return Response.json(
      { error: "Live backlink data is currently unavailable. Please try again later." },
      { status: 500 }
    );
  }
}