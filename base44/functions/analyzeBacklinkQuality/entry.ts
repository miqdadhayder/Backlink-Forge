import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { analyzeBacklink } from "../../shared/backlinkQualityService.ts";
import { safeUrl } from "../../shared/sitemap/urlNormalizer.ts";

const FREE_DAILY_LIMIT = 5;
const BULK_MAX_ROWS = 25;

function isSameDay(dateStr: string, ref: Date): boolean {
  const d = new Date(dateStr);
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth() && d.getDate() === ref.getDate();
}

function normalizeInputUrl(str: string): string | null {
  if (!str) return null;
  const s = str.trim();
  const withProto = /^https?:\/\//i.test(s) ? s : `https://${s}`;
  return safeUrl(withProto) ? withProto : null;
}

function fallbackReport(r: any, msg: string): any {
  return {
    inputs: r,
    source: { final_url: r.backlink_url, http_status: 0, content_type: "", redirected: false, redirect_target: null, title: null, description: null, domain: "", page_path: "", word_count: 0, outbound_links: 0, reachable: false, error: msg },
    link: { found: false, href: null, rel: null, attribute: "Unknown", anchor: null, placement: null, hidden: false },
    factors: [],
    overall_score: 0,
    classification: "Very Low Quality",
    risk_level: "Low",
    risk_signals: [],
    recommendation: { action: "Investigate", text: msg },
    data_confidence: "Low",
    methodology: [],
    analyzed_at: new Date().toISOString(),
    error: msg
  };
}

async function safeAnalyze(r: any, robotsCache: Map<string, any>): Promise<any> {
  try {
    return await analyzeBacklink(r, { skipTargetFetch: true, robotsCache });
  } catch (e) {
    return fallbackReport(r, "Analysis failed for this row.");
  }
}

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    let user: any = null;
    try { user = await base44.auth.me(); } catch (e) { /* anonymous allowed */ }

    const body = await req.json().catch(() => ({}));

    // ---- Bulk mode ----
    if (Array.isArray(body.bulk)) {
      const rows = body.bulk
        .slice(0, BULK_MAX_ROWS)
        .map((r: any) => ({
          website_url: String(r.website_url || ""),
          backlink_url: String(r.backlink_url || ""),
          target_url: r.target_url ? String(r.target_url) : null,
          anchor_text: r.anchor_text ? String(r.anchor_text) : null
        }))
        .filter((r: any) => r.backlink_url);

      if (!rows.length) {
        return Response.json({ error: "Please provide at least one backlink URL to analyze." }, { status: 400 });
      }

      const robotsCache = new Map<string, any>();
      const results: any[] = [];
      for (let i = 0; i < rows.length; i += 5) {
        const batch = rows.slice(i, i + 5);
        const out = await Promise.all(batch.map((r: any) => safeAnalyze(r, robotsCache)));
        results.push(...out);
      }
      return Response.json({ results });
    }

    // ---- Single mode ----
    const website_url = normalizeInputUrl(body.website_url);
    const backlink_url = normalizeInputUrl(body.backlink_url);
    const target_url = body.target_url ? normalizeInputUrl(body.target_url) : null;
    const anchor_text = body.anchor_text ? String(body.anchor_text).trim().slice(0, 200) : null;

    if (!backlink_url) {
      return Response.json({ error: "Please enter a valid backlink URL (including https://)." }, { status: 400 });
    }

    const now = new Date();
    let dayCount = 0;
    const isAdmin = user && user.role === "admin";
    if (user && !isAdmin) {
      try {
        const recent = await base44.entities.BacklinkQualityAnalysis.list("-created_date", 100);
        dayCount = (recent || []).filter((a: any) => isSameDay(a.created_date, now)).length;
      } catch (e) { /* ignore */ }
      if (dayCount >= FREE_DAILY_LIMIT) {
        return Response.json(
          { error: `You've reached your free limit of ${FREE_DAILY_LIMIT} analyses today. Upgrade your plan to continue.` },
          { status: 429 }
        );
      }
    }

    const report = await analyzeBacklink({
      website_url: website_url || String(body.website_url || "").trim(),
      backlink_url,
      target_url,
      anchor_text
    });

    let analysis_id: string | null = null;
    if (user) {
      try {
        const rec = await base44.entities.BacklinkQualityAnalysis.create({
          website_url: report.inputs.website_url,
          backlink_url: report.inputs.backlink_url,
          target_url: report.inputs.target_url || "",
          anchor_text: report.inputs.anchor_text || "",
          overall_score: report.overall_score,
          classification: report.classification,
          risk_level: report.risk_level,
          recommendation: report.recommendation.action,
          data_confidence: report.data_confidence,
          report_json: JSON.stringify(report).slice(0, 12000)
        });
        analysis_id = rec.id;
      } catch (e) { /* persistence is best-effort */ }
    }

    return Response.json({
      report,
      analysis_id,
      usage: user ? { used: dayCount + 1, limit: isAdmin ? null : FREE_DAILY_LIMIT } : null
    });
  } catch (error) {
    return Response.json(
      { error: "We couldn't analyze this backlink. Please check the URLs and try again." },
      { status: 500 }
    );
  }
}