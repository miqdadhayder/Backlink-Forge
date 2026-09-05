import { escapeXml } from "./urlNormalizer.ts";
import { CrawledUrl } from "./sitemapCrawler.ts";

export function generateSitemap(urls: CrawledUrl[]): string {
  const seen = new Set<string>();
  const lines: string[] = [];
  for (const u of urls) {
    if (!u.included || !u.final_url) continue;
    const loc = u.final_url;
    if (seen.has(loc)) continue;
    seen.add(loc);
    lines.push("  <url>\n    <loc>" + escapeXml(loc) + "</loc>\n  </url>");
  }
  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    lines.join("\n") +
    "\n</urlset>\n"
  );
}

// Pragmatic well-formedness check (inspects real structure, not a fake validator).
export function isWellFormed(xml: string): { ok: boolean; error: string | null } {
  if (!xml || !xml.trim()) return { ok: false, error: "Empty document" };
  if (!/<\?xml/.test(xml)) return { ok: false, error: "Missing XML declaration" };
  const openRoot = (xml.match(/<(urlset|sitemapindex)[\s>]/g) || []).length;
  const closeRoot = (xml.match(/<\/(urlset|sitemapindex)>/g) || []).length;
  if (openRoot !== closeRoot) return { ok: false, error: "Root element not balanced" };
  const tags = xml.match(/<\/?([a-zA-Z_][\w.-]*)[^>]*?\/?>/g) || [];
  const stack: string[] = [];
  for (const tag of tags) {
    if (tag.endsWith("/>")) continue;
    const m = tag.match(/^<\/?([a-zA-Z_][\w.-]*)/);
    if (!m) continue;
    const name = m[1];
    if (tag.startsWith("</")) {
      if (stack.length && stack[stack.length - 1] === name) stack.pop();
      else return { ok: false, error: `Mismatched closing tag </${name}>` };
    } else {
      stack.push(name);
    }
  }
  if (stack.length) return { ok: false, error: `Unclosed tag <${stack[stack.length - 1]}>` };
  return { ok: true, error: null };
}