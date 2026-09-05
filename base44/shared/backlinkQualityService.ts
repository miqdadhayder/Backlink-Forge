// Backlink quality analysis — real, server-side.
// Fetches the source page (SSRF-protected), parses HTML to detect the link,
// its rel attribute, placement, anchor, page quality, indexability and spam/risk
// signals. NEVER fabricates authority/traffic/spam-score metrics that require a
// paid SEO API — those factors are reported as "Not available" / "Unable to
// verify" and excluded from the score (weights are renormalized over the factors
// that actually have data).

import { safeUrl } from "./sitemap/urlNormalizer.ts";
import { fetchRobots, isAllowed } from "./sitemap/robotsService.ts";

const STOPWORDS = new Set([
  "the","a","an","and","or","but","of","to","in","on","for","with","is","are","be",
  "as","at","by","this","that","it","from","your","you","we","our","best","top",
  "how","what","why","when","guide","tips","list","page","site","website","com",
  "www","https","http","html","click","here","learn","more","read","about","into"
]);

export interface Factor {
  key: string;
  name: string;
  score: number | null;
  status: string;
  explanation: string;
  available: boolean;
  estimated: boolean;
  weight: number;
}

export interface RiskSignal {
  key: string;
  label: string;
  severity: "minor" | "major" | "critical";
  explanation: string;
}

export interface QualityReport {
  inputs: { website_url: string; backlink_url: string; target_url: string | null; anchor_text: string | null };
  source: {
    final_url: string;
    http_status: number;
    content_type: string;
    redirected: boolean;
    redirect_target: string | null;
    title: string | null;
    description: string | null;
    domain: string;
    page_path: string;
    word_count: number;
    outbound_links: number;
    reachable: boolean;
    error: string | null;
  };
  link: {
    found: boolean;
    href: string | null;
    rel: string | null;
    attribute: "DoFollow" | "NoFollow" | "Sponsored" | "UGC" | "Unknown";
    anchor: string | null;
    placement: string | null;
    hidden: boolean;
  };
  factors: Factor[];
  overall_score: number;
  classification: string;
  risk_level: "Low" | "Medium" | "High";
  risk_signals: RiskSignal[];
  recommendation: { action: string; text: string };
  data_confidence: "High" | "Medium" | "Low";
  methodology: { factor: string; weight: number; included: boolean }[];
  analyzed_at: string;
  error: string | null;
}

interface FetchResult {
  status: number;
  finalUrl: string;
  contentType: string;
  redirected: boolean;
  headers: Record<string, string>;
  html: string;
  reachable: boolean;
  error: string | null;
}

async function fetchPage(url: string, timeoutMs = 12000): Promise<FetchResult> {
  const u = safeUrl(url);
  if (!u) return { status: 0, finalUrl: url, contentType: "", redirected: false, headers: {}, html: "", reachable: false, error: "Invalid or blocked URL" };
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: ctrl.signal,
      headers: { "User-Agent": "BacklinkForgeBot/1.0 (+https://backlinkforge.app)", "Accept": "text/html,application/xhtml+xml" }
    });
    clearTimeout(t);
    const contentType = res.headers.get("content-type") || "";
    const headers: Record<string, string> = {};
    res.headers.forEach((v, k) => { headers[k.toLowerCase()] = v; });
    const isHtml = /text\/html|application\/xhtml/i.test(contentType);
    let html = "";
    if (isHtml) {
      html = await res.text();
      if (html.length > 1500000) html = html.slice(0, 1500000);
    }
    return { status: res.status, finalUrl: res.url || url, contentType, redirected: res.redirected, headers, html, reachable: res.ok, error: isHtml ? null : "Non-HTML content type" };
  } catch (e) {
    return { status: 0, finalUrl: url, contentType: "", redirected: false, headers: {}, html: "", reachable: false, error: "Unable to reach the page (timeout or network error)" };
  }
}

function tokenize(text: string): string[] {
  if (!text) return [];
  return text.toLowerCase().split(/[^a-z0-9]+/i).filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

function extractMeta(html: string, name: string): string | null {
  const re = new RegExp(`<meta[^>]+(?:name|property)=["']${name}["'][^>]*content=["']([^"']*)["']`, "i");
  const re2 = new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:name|property)=["']${name}["']`, "i");
  const m = html.match(re) || html.match(re2);
  return m ? decodeEntities(m[1].trim()) : null;
}

function decodeEntities(s: string): string {
  return s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

function stripTags(html: string): string {
  return html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function extractTitle(html: string): string | null {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? decodeEntities(m[1].trim()) : null;
}

interface AnchorInfo {
  index: number;
  href: string;
  rel: string;
  anchor: string;
  hidden: boolean;
  tagStart: number;
}

function extractAnchors(html: string, base: string): AnchorInfo[] {
  const anchors: AnchorInfo[] = [];
  const re = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const attrs = m[1] || "";
    const inner = m[2] || "";
    const tagStart = m.index;
    const hrefMatch = attrs.match(/\shref\s*=\s*["']([^"']*)["']/i);
    if (!hrefMatch) continue;
    const relMatch = attrs.match(/\srel\s*=\s*["']([^"']*)["']/i);
    const styleMatch = attrs.match(/\sstyle\s*=\s*["']([^"']*)["']/i);
    let resolved: string | null = null;
    try { resolved = new URL(hrefMatch[1], base).toString(); } catch (e) { resolved = null; }
    if (!resolved) continue;
    const hidden = isHiddenStyle(styleMatch ? styleMatch[1] : "", stripTags(inner));
    anchors.push({
      index: tagStart,
      href: resolved,
      rel: (relMatch ? relMatch[1] : "").toLowerCase().trim(),
      anchor: stripTags(inner).trim().slice(0, 200),
      hidden,
      tagStart
    });
  }
  return anchors;
}

function isHiddenStyle(style: string, text: string): boolean {
  const s = style.toLowerCase();
  if (s.includes("display:none") || s.includes("display: none")) return true;
  if (s.includes("visibility:hidden") || s.includes("visibility: hidden")) return true;
  if (s.includes("opacity:0") || s.includes("opacity: 0")) return true;
  if (s.includes("text-indent:-9999") || s.includes("text-indent: -9999")) return true;
  const fs = s.match(/font-size\s*:\s*(\d+)/);
  if (fs && Number(fs[1]) <= 2) return true;
  if (s.includes("position:absolute") && (s.includes("left:-") || s.includes("left: -"))) return true;
  // link with no visible text and no img alt
  if (!text && !/<img[^>]+alt=["'][^"']+["']/i.test("")) return false;
  return false;
}

function depthAt(html: string, tag: string, idx: number): number {
  const openRe = new RegExp(`<${tag}(\\s|>|/)`, "gi");
  const closeRe = new RegExp(`</${tag}\\s*>`, "gi");
  let depth = 0;
  let m: RegExpExecArray | null;
  openRe.lastIndex = 0;
  while ((m = openRe.exec(html)) !== null && m.index < idx) depth++;
  closeRe.lastIndex = 0;
  while ((m = closeRe.exec(html)) !== null && m.index < idx) depth--;
  return depth;
}

function insideParagraph(html: string, idx: number): boolean {
  const lastOpen = lastIndexOf(html, /<p\b/gi, idx);
  const lastClose = lastIndexOf(html, /<\/p\s*>/gi, idx);
  return lastOpen > lastClose;
}

function lastIndexOf(html: string, re: RegExp, idx: number): number {
  let last = -1;
  let m: RegExpExecArray | null;
  const r = new RegExp(re.source, re.flags);
  r.lastIndex = 0;
  while ((m = r.exec(html)) !== null && m.index < idx) { last = m.index; if (m.index === r.lastIndex) r.lastIndex++; }
  return last;
}

function classifyPlacement(html: string, idx: number): string {
  if (depthAt(html, "footer", idx) > 0) return "Footer";
  if (depthAt(html, "nav", idx) > 0) return "Navigation";
  if (depthAt(html, "header", idx) > 0) return "Header";
  if (depthAt(html, "aside", idx) > 0) return "Sidebar";
  if (depthAt(html, "article", idx) > 0 || depthAt(html, "main", idx) > 0) {
    return insideParagraph(html, idx) ? "Contextual (in-content)" : "Content area";
  }
  if (insideParagraph(html, idx)) return "Contextual (in-content)";
  // author-box heuristic
  const window = html.slice(Math.max(0, idx - 600), idx);
  if (/class\s*=\s*["'][^"']*\bauthor\b/i.test(window)) return "Author profile";
  return "Unknown";
}

function classifyAnchor(anchor: string, targetHost: string, websiteHost: string): { type: string; score: number } {
  const a = (anchor || "").toLowerCase().trim();
  if (!a) return { type: "Unknown", score: 50 };
  if (/^https?:\/\//i.test(anchor)) return { type: "Naked URL", score: 60 };
  const brandBase = (websiteHost || targetHost || "").replace(/^www\./, "").split(".")[0];
  if (brandBase && a.includes(brandBase)) return { type: "Branded", score: 70 };
  if (["click here", "read more", "learn more", "this link", "here", "this post", "check this"].includes(a)) return { type: "Generic", score: 40 };
  // exact vs partial match heuristic: 1-4 words, no brand
  const words = a.split(/\s+/);
  if (words.length <= 3) return { type: "Exact match", score: 55 };
  return { type: "Partial match", score: 85 };
}

function relToAttribute(rel: string): "DoFollow" | "NoFollow" | "Sponsored" | "UGC" | "Unknown" {
  if (!rel) return "DoFollow";
  if (rel.includes("sponsored")) return "Sponsored";
  if (rel.includes("ugc")) return "UGC";
  if (rel.includes("nofollow")) return "NoFollow";
  return "DoFollow";
}

function hostOf(url: string): string {
  try { return new URL(url).hostname.toLowerCase().replace(/^www\./, ""); } catch (e) { return ""; }
}

const WEIGHTS = {
  relevance: 20,
  placement: 15,
  attribute: 10,
  pageQuality: 10,
  indexability: 10,
  anchor: 5,
  risk: 10
  // authority + traffic excluded (no reliable free API)
};

export interface AnalyzeOptions {
  skipTargetFetch?: boolean;
  robotsCache?: Map<string, any>;
}

export async function analyzeBacklink(input: {
  website_url: string;
  backlink_url: string;
  target_url?: string | null;
  anchor_text?: string | null;
}, opts: AnalyzeOptions = {}): Promise<QualityReport> {
  const website_url = (input.website_url || "").trim();
  const backlink_url = (input.backlink_url || "").trim();
  const target_url = (input.target_url || "").trim() || null;
  const anchor_text = (input.anchor_text || "").trim() || null;
  const analyzed_at = new Date().toISOString();

  const baseInit = safeUrl(website_url) || safeUrl("https://" + website_url);
  const backlinkSafe = safeUrl(backlink_url) || safeUrl("https://" + backlink_url);

  if (!backlinkSafe) {
    return errorReport({ website_url, backlink_url, target_url, anchor_text }, "Please enter a valid backlink URL (including https://).", analyzed_at);
  }
  const websiteHost = baseInit ? hostOf(baseInit.toString()) : "";
  const targetHost = target_url ? hostOf((safeUrl(target_url) || safeUrl("https://" + target_url) || { toString: () => target_url }).toString()) : websiteHost;

  const robotsCache = opts.robotsCache || new Map();
  const origin = backlinkSafe.origin;
  let robots: any;
  if (robotsCache.has(origin)) robots = robotsCache.get(origin);
  else { robots = await fetchRobots(origin); robotsCache.set(origin, robots); }

  const page = await fetchPage(backlinkSafe.toString());
  const source: QualityReport["source"] = {
    final_url: page.finalUrl,
    http_status: page.status,
    content_type: page.contentType,
    redirected: page.redirected,
    redirect_target: page.redirected ? page.finalUrl : null,
    title: null,
    description: null,
    domain: hostOf(page.finalUrl),
    page_path: "",
    word_count: 0,
    outbound_links: 0,
    reachable: page.reachable,
    error: page.error
  };
  try { source.page_path = new URL(page.finalUrl).pathname; } catch (e) {}

  const riskSignals: RiskSignal[] = [];
  const factors: Factor[] = [];

  // --- Reachability / HTTP status risk ---
  if (!page.reachable) {
    riskSignals.push({ key: "accessibility", label: "Page accessibility issue", severity: "major", explanation: `The source page returned HTTP ${page.status || "no response"} and could not be fully accessed. Some metrics may be unavailable.` });
  }
  if (page.redirected) {
    const finalHost = hostOf(page.finalUrl);
    if (finalHost && finalHost !== hostOf(backlinkSafe.toString())) {
      riskSignals.push({ key: "redirect", label: "Cross-domain redirect", severity: "major", explanation: `The source URL redirects to a different domain (${finalHost}). The link may not pass equity from the original page.` });
    } else {
      riskSignals.push({ key: "redirect", label: "Redirect detected", severity: "minor", explanation: "The source URL redirects before rendering. Verify the link still resolves as expected." });
    }
  }

  // --- robots.txt block ---
  const allowed = isAllowed(backlinkSafe.toString(), robots);
  if (!allowed) {
    riskSignals.push({ key: "robots_block", label: "Blocked by robots.txt", severity: "major", explanation: "The source page is disallowed in robots.txt, which can prevent crawling and indexing." });
  }

  let title: string | null = null;
  let description: string | null = null;
  let wordCount = 0;
  let outboundLinks = 0;
  let anchors: AnchorInfo[] = [];
  let metaRobotsNoindex = false;
  let canonical: string | null = null;

  if (page.html) {
    title = extractTitle(page.html);
    description = extractMeta(page.html, "description") || extractMeta(page.html, "og:description");
    source.title = title;
    source.description = description;
    const text = stripTags(page.html);
    wordCount = text.split(/\s+/).filter(Boolean).length;
    source.word_count = wordCount;
    anchors = extractAnchors(page.html, page.finalUrl);
    outboundLinks = anchors.filter((a) => /https?:\/\//i.test(a.href)).length;
    source.outbound_links = outboundLinks;
    const mr = extractMeta(page.html, "robots");
    if (mr && /noindex/i.test(mr)) metaRobotsNoindex = true;
    canonical = extractMeta(page.html, "canonical");
  }

  // --- Find the matching link (to website or target domain) ---
  const matchHosts = new Set([websiteHost, targetHost].filter(Boolean));
  const matched = anchors.find((a) => {
    try { return matchHosts.has(hostOf(a.href)); } catch (e) { return false; }
  }) || null;

  const link: QualityReport["link"] = {
    found: !!matched,
    href: matched ? matched.href : null,
    rel: matched ? matched.rel : null,
    attribute: matched ? relToAttribute(matched.rel) : "Unknown",
    anchor: matched ? matched.anchor : null,
    placement: null,
    hidden: matched ? matched.hidden : false
  };
  if (matched && page.html) link.placement = classifyPlacement(page.html, matched.tagStart);

  if (!matched) {
    riskSignals.push({ key: "link_not_found", label: "Link not detected on page", severity: "major", explanation: "We could not find a link to your website on the fetched source page. The link may have been removed, be loaded via JavaScript, or point to a different URL." });
  }
  if (matched && matched.hidden) {
    riskSignals.push({ key: "hidden_link", label: "Hidden link", severity: "critical", explanation: "The link appears to use hiding techniques (display:none, hidden, or off-screen positioning), which search engines treat as a spam signal." });
  }
  if (outboundLinks > 120) {
    riskSignals.push({ key: "excessive_outbound", label: "Excessive outbound links", severity: "minor", explanation: `The page contains ${outboundLinks} outbound links, which can dilute link value and resemble low-quality directory pages.` });
  }
  if (wordCount > 0 && wordCount < 300) {
    riskSignals.push({ key: "thin_content", label: "Thin content", severity: "minor", explanation: `The page has only ~${wordCount} words of text, which may be considered low-quality or thin content.` });
  }

  // --- Factor: Domain Authority Signals (no API) ---
  factors.push({
    key: "authority", name: "Domain Authority Signals", score: null, status: "Not available",
    explanation: "Domain authority/rating requires a paid SEO data provider. BacklinkForge does not fabricate this metric. Connect a provider to enable it.",
    available: false, estimated: false, weight: 0
  });

  // --- Factor: Topical Relevance ---
  const srcTokens = new Set(tokenize((title || "") + " " + (description || "")));
  let tgtTokens = new Set<string>();
  let targetFetched = false;
  let relevanceEstimated = true;
  if (target_url) {
    if (opts.skipTargetFetch) {
      tgtTokens = new Set(tokenize(target_url.replace(/https?:\/\//, "").replace(/\W+/g, " ") + " " + (anchor_text || "")));
    } else {
      const tpage = await fetchPage((safeUrl(target_url) || safeUrl("https://" + target_url)).toString(), 8000);
      if (tpage.html) {
        tgtTokens = new Set(tokenize((extractTitle(tpage.html) || "") + " " + (extractMeta(tpage.html, "description") || "")));
        targetFetched = tgtTokens.size > 0;
        relevanceEstimated = !targetFetched;
      } else {
        tgtTokens = new Set(tokenize(hostOf(target_url).replace(/\./g, " ") + " " + (anchor_text || "")));
      }
    }
  } else {
    tgtTokens = new Set(tokenize(websiteHost.replace(/\./g, " ") + " " + (anchor_text || "")));
  }
  let relScore = 0;
  if (srcTokens.size && tgtTokens.size) {
    let inter = 0;
    srcTokens.forEach((t) => { if (tgtTokens.has(t)) inter++; });
    const union = new Set([...srcTokens, ...tgtTokens]).size || 1;
    relScore = Math.round((inter / union) * 100);
  }
  if (anchor_text && srcTokens.size) {
    const at = tokenize(anchor_text);
    const hit = at.filter((w) => srcTokens.has(w)).length;
    if (hit) relScore = Math.min(100, relScore + hit * 8);
  }
  const relStatus = relScore >= 70 ? "Strong" : relScore >= 40 ? "Moderate" : relScore > 0 ? "Weak" : "Unknown";
  let relExpl = relScore > 0
    ? `The source page topic shares ${relScore >= 70 ? "strong" : relScore >= 40 ? "moderate" : "limited"} topical overlap with the target.${relevanceEstimated ? " Estimated from domain/anchor data (target page could not be fully analyzed)." : ""}`
    : "No measurable topical overlap was found between the source and target pages.";
  factors.push({
    key: "relevance", name: "Topical Relevance", score: relScore, status: relStatus,
    explanation: relExpl, available: true, estimated: relevanceEstimated, weight: WEIGHTS.relevance
  });

  // --- Factor: Link Placement ---
  if (matched) {
    const placementScores: Record<string, number> = {
      "Contextual (in-content)": 92, "Content area": 80, "Author profile": 60,
      "Sidebar": 45, "Navigation": 40, "Header": 38, "Footer": 30, "Unknown": 55
    };
    const ps = placementScores[link.placement || "Unknown"] ?? 55;
    factors.push({
      key: "placement", name: "Link Placement", score: ps, status: link.placement || "Unknown",
      explanation: placementExpl(link.placement), available: true, estimated: false, weight: WEIGHTS.placement
    });
  } else {
    factors.push({ key: "placement", name: "Link Placement", score: null, status: "Unable to verify", explanation: "The link was not detected on the page, so its placement could not be determined.", available: false, estimated: false, weight: WEIGHTS.placement });
  }

  // --- Factor: Link Attribute ---
  if (matched) {
    const attrScores: Record<string, number> = { "DoFollow": 95, "NoFollow": 58, "Sponsored": 38, "UGC": 45, "Unknown": 50 };
    factors.push({
      key: "attribute", name: "Link Attribute", score: attrScores[link.attribute], status: link.attribute,
      explanation: attrExpl(link.attribute, matched.rel), available: true, estimated: false, weight: WEIGHTS.attribute
    });
  } else {
    factors.push({ key: "attribute", name: "Link Attribute", score: null, status: "Unable to verify", explanation: "The link was not detected, so its rel attribute could not be verified.", available: false, estimated: false, weight: WEIGHTS.attribute });
  }

  // --- Factor: Anchor Text ---
  if (matched) {
    const ac = classifyAnchor(matched.anchor, targetHost, websiteHost);
    factors.push({
      key: "anchor", name: "Anchor Text", score: ac.score, status: ac.type,
      explanation: `The detected anchor text is "${(matched.anchor || "").slice(0, 60) || "(empty)"}", classified as ${ac.type}.`,
      available: true, estimated: false, weight: WEIGHTS.anchor
    });
    if (anchor_text && anchor_text.toLowerCase() !== (matched.anchor || "").toLowerCase()) {
      riskSignals.push({ key: "anchor_mismatch", label: "Anchor text mismatch", severity: "minor", explanation: `The provided anchor text differs from the anchor detected on the page ("${(matched.anchor || "").slice(0, 60)}").` });
    }
    if (matched.anchor && ["click here", "read more", "learn more", "here"].includes(matched.anchor.toLowerCase())) {
      riskSignals.push({ key: "generic_anchor", label: "Generic anchor text", severity: "minor", explanation: "Generic anchor text like \"click here\" provides little topical signal to search engines." });
    }
  } else {
    factors.push({ key: "anchor", name: "Anchor Text", score: null, status: "Unable to verify", explanation: "No link was detected, so anchor text could not be analyzed.", available: false, estimated: false, weight: WEIGHTS.anchor });
  }

  // --- Factor: Page Quality ---
  if (page.html) {
    let pq = 0;
    if (wordCount >= 1500) pq += 42; else if (wordCount >= 900) pq += 34; else if (wordCount >= 600) pq += 26; else if (wordCount >= 300) pq += 16; else pq += 4;
    if (title && title.length > 10) pq += 18;
    if (description) pq += 14;
    const h1 = (page.html.match(/<h1\b/gi) || []).length;
    if (h1 >= 1) pq += 10;
    const paras = (page.html.match(/<p\b/gi) || []).length;
    if (paras >= 5) pq += 16; else if (paras >= 1) pq += 8;
    pq = Math.min(100, pq);
    const pqStatus = pq >= 70 ? "Good" : pq >= 45 ? "Fair" : "Thin / Weak";
    factors.push({
      key: "pageQuality", name: "Page Quality", score: pq, status: pqStatus,
      explanation: `The page has ~${wordCount} words, ${h1} H1, ${paras} paragraphs${title ? ", a descriptive title" : ", no title"}${description ? ", and a meta description" : ""}.`,
      available: true, estimated: false, weight: WEIGHTS.pageQuality
    });
  } else {
    factors.push({ key: "pageQuality", name: "Page Quality", score: null, status: "Unable to verify", explanation: "The page could not be fetched, so content quality could not be evaluated.", available: false, estimated: false, weight: WEIGHTS.pageQuality });
  }

  // --- Factor: Indexability ---
  let indexable: "Indexable" | "Not indexable" | "Unable to verify" = "Unable to verify";
  let idxScore = 50;
  let idxExpl = "Indexability could not be determined.";
  if (page.html) {
    if (!allowed) { indexable = "Not indexable"; idxScore = 15; idxExpl = "The page is blocked by robots.txt, so search engines are asked not to crawl it."; }
    else if (metaRobotsNoindex) { indexable = "Not indexable"; idxScore = 15; idxExpl = "A noindex robots meta tag was found, instructing search engines not to index this page."; riskSignals.push({ key: "noindex", label: "noindex directive", severity: "major", explanation: "The page contains a noindex directive, so a link here may not be crawled/indexed by search engines." }); }
    else if (canonical && !sameUrl(canonical, page.finalUrl)) { indexable = "Not indexable"; idxScore = 25; idxExpl = `The canonical URL points to ${canonical}, so equity may consolidate elsewhere.`; }
    else { indexable = "Indexable"; idxScore = 90; idxExpl = "No noindex directive, robots block, or off-page canonical was detected. The page appears indexable."; }
  } else if (!page.reachable) {
    indexable = "Unable to verify"; idxScore = 30; idxExpl = "The page could not be reached, so indexability is unknown.";
  }
  factors.push({
    key: "indexability", name: "Indexability", score: idxScore, status: indexable,
    explanation: idxExpl, available: indexable !== "Unable to verify", estimated: false, weight: WEIGHTS.indexability
  });

  // --- Factor: Traffic Signals (no API) ---
  factors.push({
    key: "traffic", name: "Traffic Signals", score: null, status: "Not available",
    explanation: "Verified organic traffic data requires a paid SEO data provider. This metric is not estimated.",
    available: false, estimated: false, weight: 0
  });

  // --- Factor: Spam/Risk Signals ---
  const critical = riskSignals.filter((r) => r.severity === "critical").length;
  const major = riskSignals.filter((r) => r.severity === "major").length;
  const minor = riskSignals.filter((r) => r.severity === "minor").length;
  const penalty = Math.min(100, critical * 25 + major * 12 + minor * 5);
  const riskFactorScore = Math.max(0, 100 - penalty);
  factors.push({
    key: "risk", name: "Spam / Risk Signals", score: riskFactorScore,
    status: penalty === 0 ? "Clean" : penalty < 25 ? "Minor concerns" : penalty < 50 ? "Several concerns" : "High concern",
    explanation: riskSignals.length === 0 ? "No suspicious or low-quality signals were detected on the fetched page." : `${riskSignals.length} risk signal(s) detected (${critical} critical, ${major} major, ${minor} minor).`,
    available: true, estimated: false, weight: WEIGHTS.risk
  });

  // --- Risk level ---
  let risk_level: QualityReport["risk_level"] = "Low";
  if (critical >= 2 || (critical >= 1 && major >= 1) || penalty >= 50) risk_level = "High";
  else if (critical >= 1 || major >= 2 || minor >= 3 || penalty >= 25) risk_level = "Medium";

  // --- Overall score (renormalized over available factors) ---
  let num = 0;
  let den = 0;
  const methodology: QualityReport["methodology"] = [];
  for (const f of factors) {
    if (f.available && f.score !== null) {
      num += f.score * f.weight;
      den += f.weight;
      methodology.push({ factor: f.name, weight: f.weight, included: true });
    } else {
      methodology.push({ factor: f.name, weight: f.weight || 0, included: false });
    }
  }
  const overall_score = den > 0 ? Math.round(num / den) : 0;
  const classification = classify(overall_score);

  // --- Data confidence ---
  const availableCount = factors.filter((f) => f.available).length;
  const data_confidence: QualityReport["data_confidence"] = availableCount >= 7 ? "High" : availableCount >= 4 ? "Medium" : "Low";

  // --- Recommendation ---
  let recommendation: QualityReport["recommendation"];
  if (risk_level === "High" || overall_score < 25) {
    recommendation = { action: "Consider Removal", text: "Multiple risk signals were detected. Manually review the backlink and its source page before taking any action — do not disavow based on this score alone." };
  } else if (overall_score < 50 || risk_level === "Medium") {
    recommendation = { action: "Investigate", text: "Review the source site and the link context before deciding. Some positive signals exist alongside notable limitations." };
  } else if (overall_score < 75) {
    recommendation = { action: "Monitor", text: "The backlink has positive signals but also several limitations. Continue monitoring it periodically." };
  } else {
    recommendation = { action: "Keep", text: "This backlink appears valuable, with relevant context and clean signals. Continue monitoring it as part of your link profile." };
  }

  return {
    inputs: { website_url, backlink_url, target_url, anchor_text },
    source, link, factors,
    overall_score, classification, risk_level, risk_signals: riskSignals,
    recommendation, data_confidence, methodology, analyzed_at, error: null
  };
}

function sameUrl(a: string, b: string): boolean {
  try {
    const u1 = new URL(a); const u2 = new URL(b);
    return u1.origin === u2.origin && u1.pathname === u2.pathname && u1.search === u2.search;
  } catch (e) { return a === b; }
}

function classify(score: number): string {
  if (score >= 90) return "Excellent";
  if (score >= 75) return "High Quality";
  if (score >= 50) return "Moderate";
  if (score >= 25) return "Low Quality";
  return "Very Low Quality";
}

function placementExpl(p: string | null): string {
  switch (p) {
    case "Contextual (in-content)": return "The link is embedded within the main content, which is the most valuable editorial placement.";
    case "Content area": return "The link sits in the main content area of the page.";
    case "Author profile": return "The link appears in an author bio/profile area — common for guest posts.";
    case "Sidebar": return "The link is in a sidebar, which may be sitewide and less editorially valuable.";
    case "Navigation": return "The link appears in site navigation, which is less contextual.";
    case "Header": return "The link appears in the site header, which is less contextual.";
    case "Footer": return "The link is in the footer, which search engines often discount as sitewide.";
    default: return "The link's placement within the page could not be clearly determined.";
  }
}

function attrExpl(attr: string, rel: string): string {
  switch (attr) {
    case "DoFollow": return "No nofollow/sponsored/ugc rel attribute was found, so the link is followed by default and may pass link equity.";
    case "NoFollow": return "A rel=\"nofollow\" attribute was detected. The link may not directly pass link equity but can still drive referral traffic.";
    case "Sponsored": return "A rel=\"sponsored\" attribute was detected, indicating a paid or affiliate relationship.";
    case "UGC": return "A rel=\"ugc\" attribute was detected, typical of user-generated content.";
    default: return "The rel attribute could not be determined.";
  }
}

function errorReport(inputs: any, msg: string, analyzed_at: string): QualityReport {
  return {
    inputs,
    source: { final_url: inputs.backlink_url, http_status: 0, content_type: "", redirected: false, redirect_target: null, title: null, description: null, domain: "", page_path: "", word_count: 0, outbound_links: 0, reachable: false, error: msg },
    link: { found: false, href: null, rel: null, attribute: "Unknown", anchor: null, placement: null, hidden: false },
    factors: [],
    overall_score: 0,
    classification: "Very Low Quality",
    risk_level: "Low",
    risk_signals: [],
    recommendation: { action: "Investigate", text: msg },
    data_confidence: "Low",
    methodology: [],
    analyzed_at,
    error: msg
  };
}