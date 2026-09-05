import { safeUrl, normalizeUrl, sameHost, escapeRe } from "./urlNormalizer.ts";
import { fetchRobots, isAllowed, RobotsInfo } from "./robotsService.ts";
import { decideIndexable } from "./indexability.ts";

const TIMEOUT_MS = 7000;
const UA = "BacklinkForgeSitemapBot/1.0 (+https://backlinkforge.com/bot)";
const DEADLINE_MS = 25000;
const HARD_URL_CAP = 250;

export interface CrawledUrl {
  url: string;
  final_url: string | null;
  status: number;
  status_label: string;
  content_type: string;
  canonical: string | null;
  indexable: boolean;
  included: boolean;
  exclusion_reason: string | null;
  depth: number;
}

export interface CrawlResult {
  urls: CrawledUrl[];
  robots: RobotsInfo;
  existing_sitemaps: string[];
  stats: { discovered: number; valid: number; excluded: number; errors: number; included: number };
  capped: boolean;
}

function statusLabel(code: number): string {
  if (code === 0) return "Timeout";
  if (code >= 500) return "Server Error";
  if (code === 404) return "Not Found";
  if (code === 403) return "Forbidden";
  if (code >= 400) return "Client Error";
  if (code >= 300) return "Redirect";
  if (code >= 200) return "OK";
  return "Unknown";
}

export async function crawl(opts: {
  startUrl: string;
  maxUrls: number;
  maxDepth: number; // 0 = unlimited
  includeTypes: string[];
  excludePatterns: string[];
}): Promise<CrawlResult> {
  const start = safeUrl(opts.startUrl);
  if (!start) throw new Error("Invalid start URL");
  const origin = start.origin;
  const includeNonHtml =
    opts.includeTypes.includes("PDFs") || opts.includeTypes.includes("Images");

  const robots = await fetchRobots(origin);
  const existing_sitemaps = Array.from(new Set(robots.sitemaps));

  const deadline = Date.now() + DEADLINE_MS;
  const maxUrls = Math.max(1, Math.min(opts.maxUrls, HARD_URL_CAP));
  const maxDepth = opts.maxDepth === 0 ? 99 : opts.maxDepth;

  const seen = new Set<string>();
  const results: CrawledUrl[] = [];
  let queue: { url: string; depth: number }[] = [{ url: start.toString(), depth: 0 }];
  seen.add(start.toString());
  let capped = false;

  const excludeRes = (opts.excludePatterns || [])
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => new RegExp(escapeRe(p).replace(/\\\*/g, ".*")));

  const enqueue = (rawUrl: string, base: string, depth: number) => {
    const n = normalizeUrl(rawUrl, base);
    if (!n) return;
    if (!sameHost(n, origin)) return;
    if (seen.has(n)) return;
    if (depth > maxDepth) return;
    if (excludeRes.some((re) => re.test(n))) return;
    seen.add(n);
    queue.push({ url: n, depth });
  };

  while (queue.length > 0 && results.length < maxUrls) {
    if (Date.now() > deadline) {
      capped = true;
      break;
    }
    const batch = queue.splice(0, Math.min(8, queue.length, maxUrls - results.length));
    const settled = await Promise.allSettled(
      batch.map((item) => fetchUrl(item.url, item.depth, robots, includeNonHtml))
    );
    for (let i = 0; i < batch.length; i++) {
      const item = batch[i];
      const s = settled[i];
      if (s.status !== "fulfilled") {
        results.push({
          url: item.url, final_url: null, status: 0, status_label: "Error",
          content_type: "", canonical: null, indexable: false, included: false,
          exclusion_reason: "Unreachable", depth: item.depth
        });
        continue;
      }
      const { result, links } = s.value;
      results.push(result);
      if (links.length) {
        for (const l of links) enqueue(l, item.url, item.depth + 1);
      }
    }
  }
  if (queue.length > 0) capped = true;

  const stats = {
    discovered: seen.size,
    valid: results.filter((r) => r.status >= 200 && r.status < 400).length,
    excluded: results.filter((r) => !r.included).length,
    errors: results.filter((r) => r.status === 0 || r.status >= 400).length,
    included: results.filter((r) => r.included).length
  };
  return { urls: results, robots, existing_sitemaps, stats, capped };
}

async function fetchUrl(
  url: string,
  depth: number,
  robots: RobotsInfo,
  includeNonHtml: boolean
): Promise<{ result: CrawledUrl; links: string[] }> {
  const links: string[] = [];
  const result: CrawledUrl = {
    url, final_url: null, status: 0, status_label: "Error", content_type: "",
    canonical: null, indexable: false, included: false, exclusion_reason: null, depth
  };

  if (!isAllowed(url, robots)) {
    result.status_label = "Blocked";
    result.exclusion_reason = "Blocked by robots.txt";
    return { result, links };
  }

  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: ctrl.signal,
      headers: { "User-Agent": UA, "Accept": "text/html,application/xhtml+xml,*/*;q=0.8" }
    });
    clearTimeout(t);
    result.final_url = res.url || url;
    result.status = res.status;
    result.status_label = statusLabel(res.status);
    result.content_type = res.headers.get("content-type") || "";
    const isHtml = /text\/html|application\/xhtml/i.test(result.content_type);
    const isRedirect = res.redirected || (res.status >= 300 && res.status < 400);
    let noindex = false;
    let canonical: string | null = null;
    if (isHtml) {
      const body = await res.text();
      noindex = /<meta[^>]+name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(body);
      const cm = body.match(/<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']+)["']/i);
      if (cm) canonical = normalizeUrl(cm[1], url);
      const hrefs = body.match(/href=["']([^"']+)["']/gi) || [];
      for (const h of hrefs) {
        const m = h.match(/href=["']([^"']+)["']/i);
        if (m) links.push(m[1]);
      }
    }
    const selfUrl = normalizeUrl(result.final_url || url) || url;
    const dec = decideIndexable({
      statusCode: res.status, isRedirect, contentType: result.content_type,
      canonical, selfUrl, noindex, robotsBlocked: false, includeNonHtml
    });
    result.canonical = canonical;
    result.indexable = dec.indexable;
    result.included = dec.included;
    result.exclusion_reason = dec.reason;
    if (canonical && sameHost(canonical, url) && canonical !== selfUrl) {
      links.push(canonical);
    }
  } catch (e) {
    result.status = 0;
    result.status_label = "Timeout";
    result.exclusion_reason = "Unreachable";
  }
  return { result, links };
}