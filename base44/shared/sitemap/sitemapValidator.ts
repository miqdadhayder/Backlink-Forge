import { safeUrl, normalizeUrl } from "./urlNormalizer.ts";
import { fetchRobots, isAllowed, RobotsInfo } from "./robotsService.ts";
import { isWellFormed } from "./sitemapGenerator.ts";

const MAX_URL_CHECKS = 100;
const MAX_CHILD_SITEMAPS = 5;
const MAX_BYTES = 10 * 1024 * 1024;

export interface SitemapIssue {
  url: string;
  type: string;
  severity: "error" | "warning";
  status: number | null;
  recommendation: string;
}

export interface SitemapCheck {
  label: string;
  status: "passed" | "warning" | "error";
  detail: string;
}

export interface ValidationResult {
  health: number;
  is_index: boolean;
  child_sitemaps: { url: string; url_count: number; status: string }[];
  stats: { url_count: number; duplicate_count: number; invalid_count: number; non_https_count: number };
  checks: SitemapCheck[];
  issues: SitemapIssue[];
  source_url: string | null;
}

export interface ParsedSitemap {
  isIndex: boolean;
  hasNs: boolean;
  locations: string[];
}

export function parseSitemapXml(xml: string): ParsedSitemap {
  if (!xml || !xml.trim()) return { isIndex: false, hasNs: false, locations: [] };
  const hasNs = /xmlns=["']http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9["']/.test(xml);
  const isIndex = /<sitemapindex[\s>]/.test(xml);
  const locRe = /<loc>([\s\S]*?)<\/loc>/gi;
  const locations: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = locRe.exec(xml)) !== null) locations.push(m[1].trim());
  return { isIndex, hasNs, locations };
}

export async function fetchXml(
  url: string,
  maxBytes: number
): Promise<{ ok: boolean; status: number; text: string }> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 9000);
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: ctrl.signal,
      headers: { "User-Agent": "BacklinkForgeSitemapBot/1.0", "Accept": "application/xml,text/xml,*/*;q=0.8" }
    });
    clearTimeout(t);
    if (!res.ok) return { ok: false, status: res.status, text: "" };
    const reader = res.body?.getReader();
    if (!reader) {
      const txt = await res.text();
      return { ok: true, status: res.status, text: txt.slice(0, maxBytes) };
    }
    const dec = new TextDecoder();
    let buf = "";
    let received = 0;
    while (received < maxBytes) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.length;
      buf += dec.decode(value, { stream: true });
    }
    try { await reader.cancel(); } catch (e) { /* ignore */ }
    return { ok: true, status: res.status, text: buf };
  } catch (e) {
    return { ok: false, status: 0, text: "" };
  }
}

export async function validateSitemap(opts: {
  xml: string;
  sourceUrl: string | null;
  checkHttp: boolean;
}): Promise<ValidationResult> {
  const { xml, sourceUrl, checkHttp } = opts;
  const parsed = parseSitemapXml(xml);
  let child_sitemaps: { url: string; url_count: number; status: string }[] = [];
  let allLocs: string[] = [];

  if (parsed.isIndex) {
    const children = parsed.locations.slice(0, MAX_CHILD_SITEMAPS);
    for (const c of children) {
      const cu = safeUrl(c);
      if (!cu) { child_sitemaps.push({ url: c, url_count: 0, status: "Invalid URL" }); continue; }
      const sub = await fetchXml(cu.toString(), MAX_BYTES);
      if (!sub.ok) { child_sitemaps.push({ url: c, url_count: 0, status: sub.status === 0 ? "Unreachable" : `HTTP ${sub.status}` }); continue; }
      const sp = parseSitemapXml(sub.text);
      if (sp.isIndex) { child_sitemaps.push({ url: c, url_count: 0, status: "Nested index" }); continue; }
      child_sitemaps.push({ url: c, url_count: sp.locations.length, status: "OK" });
      allLocs = allLocs.concat(sp.locations);
    }
  } else {
    allLocs = parsed.locations;
  }

  const seen = new Set<string>();
  const issues: SitemapIssue[] = [];
  let duplicateCount = 0, invalidCount = 0, nonHttpsCount = 0;
  const validLocs: string[] = [];
  for (const loc of allLocs) {
    const u = safeUrl(loc);
    if (!u) {
      invalidCount++;
      issues.push({ url: loc, type: "Invalid URL", severity: "error", status: null, recommendation: "Remove or fix this malformed URL in the sitemap." });
      continue;
    }
    const norm = normalizeUrl(loc, sourceUrl || undefined) || loc;
    if (seen.has(norm)) {
      duplicateCount++;
      issues.push({ url: loc, type: "Duplicate", severity: "warning", status: null, recommendation: "Remove duplicate entries — keep a single canonical URL." });
      continue;
    }
    seen.add(norm);
    if (u.protocol === "http:") {
      nonHttpsCount++;
      issues.push({ url: loc, type: "Non-HTTPS", severity: "warning", status: null, recommendation: "Use the HTTPS version of this URL if one exists." });
    }
    validLocs.push(loc);
  }

  const robotsCache = new Map<string, RobotsInfo>();
  const getRobots = async (url: string): Promise<RobotsInfo | null> => {
    let o: string | null = null;
    try { o = new URL(url).origin; } catch (e) { return null; }
    if (!o) return null;
    if (robotsCache.has(o)) return robotsCache.get(o) as RobotsInfo;
    const r = await fetchRobots(o);
    robotsCache.set(o, r);
    return r;
  };

  let redirectCount = 0, err404 = 0, err403 = 0, err5xx = 0, noindexCount = 0, robotsBlockedCount = 0;
  if (checkHttp && validLocs.length) {
    const sample = validLocs.slice(0, MAX_URL_CHECKS);
    const results = await Promise.allSettled(
      sample.map(async (loc) => {
        const r = { loc, status: 0, redirected: false, contentType: "", noindex: false, robotsBlocked: false };
        const robots = await getRobots(loc);
        if (robots && !isAllowed(loc, robots)) { r.robotsBlocked = true; return r; }
        try {
          const ctrl = new AbortController();
          const t = setTimeout(() => ctrl.abort(), 7000);
          const res = await fetch(loc, { method: "GET", redirect: "follow", signal: ctrl.signal, headers: { "User-Agent": "BacklinkForgeSitemapBot/1.0" } });
          clearTimeout(t);
          r.status = res.status;
          r.redirected = res.redirected || (res.status >= 300 && res.status < 400);
          r.contentType = res.headers.get("content-type") || "";
          if (/text\/html/i.test(r.contentType)) {
            const body = await res.text();
            r.noindex = /<meta[^>]+name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(body);
          }
        } catch (e) { r.status = 0; }
        return r;
      })
    );
    for (const s of results) {
      if (s.status !== "fulfilled") continue;
      const r = s.value;
      if (r.robotsBlocked) { robotsBlockedCount++; issues.push({ url: r.loc, type: "Robots blocked", severity: "warning", status: null, recommendation: "This URL is blocked by robots.txt — consider removing it from the sitemap." }); continue; }
      if (r.status === 0) { issues.push({ url: r.loc, type: "Unreachable", severity: "error", status: null, recommendation: "The URL could not be reached. Verify the page exists and is publicly accessible." }); continue; }
      if (r.status === 404) { err404++; issues.push({ url: r.loc, type: "404", severity: "error", status: 404, recommendation: "Remove this URL from the sitemap or restore the page if it should remain accessible." }); continue; }
      if (r.status === 403) { err403++; issues.push({ url: r.loc, type: "403", severity: "warning", status: 403, recommendation: "This URL returns 403 Forbidden. Confirm it should be public before keeping it in the sitemap." }); continue; }
      if (r.status >= 500) { err5xx++; issues.push({ url: r.loc, type: "5xx", severity: "error", status: r.status, recommendation: "The server returned an error. Resolve the server issue or remove this URL." }); continue; }
      if (r.redirected) { redirectCount++; issues.push({ url: r.loc, type: "301/302", severity: "warning", status: r.status, recommendation: "This URL redirects. Update the sitemap to point to the final destination URL." }); continue; }
      if (r.noindex) { noindexCount++; issues.push({ url: r.loc, type: "Noindex", severity: "warning", status: r.status, recommendation: "This page has a noindex directive. Remove it from the sitemap or remove the noindex tag." }); continue; }
    }
  }

  const checks: SitemapCheck[] = [];
  const wf = isWellFormed(xml);
  checks.push({ label: "XML syntax valid", status: wf.ok ? "passed" : "error", detail: wf.ok ? "XML is well formed." : wf.error || "Invalid XML." });
  checks.push({ label: "Sitemap namespace valid", status: parsed.hasNs ? "passed" : "warning", detail: parsed.hasNs ? "Correct sitemap namespace detected." : "Expected namespace http://www.sitemaps.org/schemas/sitemap/0.9." });
  checks.push({ label: `${allLocs.length} URLs found`, status: allLocs.length > 0 ? "passed" : "error", detail: allLocs.length ? `${allLocs.length} <loc> entries parsed.` : "No <loc> entries found." });
  checks.push({ label: "No duplicate URLs", status: duplicateCount === 0 ? "passed" : "warning", detail: duplicateCount ? `${duplicateCount} duplicate URL(s).` : "No duplicates." });
  checks.push({ label: "All URLs valid", status: invalidCount === 0 ? "passed" : "error", detail: invalidCount ? `${invalidCount} invalid URL(s).` : "All URLs valid." });
  checks.push({ label: "HTTPS URLs", status: nonHttpsCount === 0 ? "passed" : "warning", detail: nonHttpsCount ? `${nonHttpsCount} non-HTTPS URL(s).` : "All URLs use HTTPS." });
  if (checkHttp) {
    checks.push({ label: "No 404 URLs", status: err404 === 0 ? "passed" : "error", detail: err404 ? `${err404} broken URL(s).` : "No 404s detected." });
    checks.push({ label: "No redirects", status: redirectCount === 0 ? "passed" : "warning", detail: redirectCount ? `${redirectCount} redirect(s).` : "No redirects." });
    checks.push({ label: "No server errors", status: err5xx === 0 ? "passed" : "error", detail: err5xx ? `${err5xx} server error(s).` : "No 5xx errors." });
    checks.push({ label: "No noindex pages", status: noindexCount === 0 ? "passed" : "warning", detail: noindexCount ? `${noindexCount} noindex page(s).` : "No noindex pages." });
    checks.push({ label: "Not blocked by robots.txt", status: robotsBlockedCount === 0 ? "passed" : "warning", detail: robotsBlockedCount ? `${robotsBlockedCount} blocked URL(s).` : "No robots blocks." });
  }
  if (parsed.isIndex) {
    checks.push({ label: `Sitemap index (${child_sitemaps.length} child sitemaps)`, status: child_sitemaps.length > 0 ? "passed" : "warning", detail: child_sitemaps.map((c) => `${c.url}: ${c.status}`).join("; ") || "No child sitemaps." });
  }

  const errors = checks.filter((c) => c.status === "error").length;
  const warnings = checks.filter((c) => c.status === "warning").length;
  const health = checks.length ? Math.max(0, Math.round(100 - errors * 18 - warnings * 6)) : 0;

  return {
    health, is_index: parsed.isIndex, child_sitemaps,
    stats: { url_count: allLocs.length, duplicate_count: duplicateCount, invalid_count: invalidCount, non_https_count: nonHttpsCount },
    checks, issues, source_url: sourceUrl
  };
}