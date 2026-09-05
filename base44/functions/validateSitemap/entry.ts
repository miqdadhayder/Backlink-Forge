import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { validateSitemap, fetchXml } from "../../shared/sitemap/sitemapValidator.ts";
import { safeUrl } from "../../shared/sitemap/urlNormalizer.ts";

const MAX_BYTES = 10 * 1024 * 1024;

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Please sign in to validate a sitemap." }, { status: 401 });

    const body = await req.json();
    const { sitemap_url, xml_content, check_http } = body || {};

    let xml = "";
    let sourceUrl: string | null = null;

    if (sitemap_url) {
      const u = safeUrl(sitemap_url);
      if (!u) return Response.json({ error: "Please enter a valid sitemap URL." }, { status: 400 });
      sourceUrl = u.toString();
      const fetched = await fetchXml(sourceUrl, MAX_BYTES);
      if (!fetched.ok) {
        if (fetched.status === 0) {
          return Response.json({ error: "We couldn't connect to this website. Please check the URL and try again." }, { status: 502 });
        }
        return Response.json({ error: `Could not fetch the sitemap (HTTP ${fetched.status}).` }, { status: 502 });
      }
      xml = fetched.text;
    } else if (xml_content) {
      xml = String(xml_content);
      if (xml.length > MAX_BYTES) {
        return Response.json({ error: "This sitemap exceeds the supported file size." }, { status: 413 });
      }
    } else {
      return Response.json({ error: "Provide a sitemap URL or upload an XML file." }, { status: 400 });
    }

    const result = await validateSitemap({ xml, sourceUrl, checkHttp: check_http !== false });

    try {
      await base44.entities.SitemapAnalysis.create({
        website_url: sourceUrl || "(uploaded)",
        type: "validate",
        sitemap_type: result.is_index ? "sitemapindex" : "urlset",
        urls_found: result.stats.url_count,
        urls_included: result.stats.url_count,
        errors: result.issues.filter((i) => i.severity === "error").length,
        warnings: result.issues.filter((i) => i.severity === "warning").length,
        status: result.health >= 80 ? "healthy" : result.health >= 50 ? "issues" : "poor",
        health: result.health,
        robots_found: false,
        existing_sitemaps: "",
        is_demo: false,
        xml_preview: xml.slice(0, 2000)
      });
    } catch (e) { /* persistence is best-effort */ }

    return Response.json({ ...result, source_url: sourceUrl });
  } catch (error) {
    return Response.json(
      { error: "We couldn't validate this sitemap. Please check the input and try again." },
      { status: 500 }
    );
  }
}