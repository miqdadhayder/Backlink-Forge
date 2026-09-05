import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { crawl } from "../../shared/sitemap/sitemapCrawler.ts";
import { generateSitemap, isWellFormed } from "../../shared/sitemap/sitemapGenerator.ts";
import { safeUrl } from "../../shared/sitemap/urlNormalizer.ts";

const FREE_MONTHLY_LIMIT = 3;

function isSameMonth(dateStr: string, ref: Date): boolean {
  const d = new Date(dateStr);
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth();
}

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Please sign in to generate a sitemap." }, { status: 401 });

    const body = await req.json();
    const { website_url, max_urls, crawl_depth, include_types, exclude_patterns } = body || {};

    if (!website_url || !safeUrl(website_url)) {
      return Response.json({ error: "Please enter a valid website URL." }, { status: 400 });
    }

    const now = new Date();
    let monthCount = 0;
    try {
      const recent = await base44.entities.SitemapAnalysis.list("-created_date", 100);
      monthCount = (recent || []).filter(
        (a: any) => a.type === "generate" && isSameMonth(a.created_date, now)
      ).length;
    } catch (e) { /* ignore */ }
    const isAdmin = user.role === "admin";
    if (!isAdmin && monthCount >= FREE_MONTHLY_LIMIT) {
      return Response.json(
        { error: "You've reached your monthly sitemap generation limit. Upgrade your plan to continue." },
        { status: 429 }
      );
    }

    const result = await crawl({
      startUrl: website_url,
      maxUrls: Math.min(Number(max_urls) || 100, isAdmin ? 5000 : 500),
      maxDepth: Number(crawl_depth) || 0,
      includeTypes: Array.isArray(include_types) && include_types.length ? include_types : ["HTML pages"],
      excludePatterns: Array.isArray(exclude_patterns) ? exclude_patterns : []
    });

    const xml = generateSitemap(result.urls);
    const wf = isWellFormed(xml);

    let analysis_id: string | null = null;
    try {
      const rec = await base44.entities.SitemapAnalysis.create({
        website_url,
        type: "generate",
        sitemap_type: result.stats.included > 0 ? "urlset" : "empty",
        urls_found: result.stats.discovered,
        urls_included: result.stats.included,
        errors: result.stats.errors,
        warnings: result.stats.excluded,
        status: wf.ok ? "completed" : "completed_with_issues",
        robots_found: result.robots.found,
        existing_sitemaps: (result.existing_sitemaps || []).join(", "),
        is_demo: false,
        xml_preview: xml.slice(0, 2000)
      });
      analysis_id = rec.id;
    } catch (e) { /* persistence is best-effort */ }

    return Response.json({
      analysis_id,
      xml,
      urls: result.urls,
      stats: result.stats,
      robots: { found: result.robots.found, status: result.robots.status, sitemaps: result.existing_sitemaps },
      existing_sitemaps: result.existing_sitemaps,
      capped: result.capped,
      well_formed: wf.ok,
      usage: { used: monthCount + 1, limit: isAdmin ? null : FREE_MONTHLY_LIMIT }
    });
  } catch (error) {
    return Response.json(
      { error: "We couldn't generate a sitemap for this website. Please check the URL and try again." },
      { status: 500 }
    );
  }
}