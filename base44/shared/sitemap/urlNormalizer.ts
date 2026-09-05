// URL validation, normalization, and SSRF protection for the sitemap tools.
// Only public HTTP/HTTPS targets are allowed; private/reserved ranges are blocked.

const PRIVATE_HOSTNAMES = new Set([
  "localhost", "ip6-localhost", "ip6-loopback",
  "metadata.google.internal", "metadata.aws.internal", "metadata.azure.com"
]);

function parseIpv4(host: string): number[] | null {
  const parts = host.split(".");
  if (parts.length !== 4) return null;
  const nums: number[] = [];
  for (const p of parts) {
    if (!/^\d+$/.test(p)) return null;
    const n = Number(p);
    if (n < 0 || n > 255) return null;
    nums.push(n);
  }
  return nums;
}

export function isPrivateHost(hostname: string): boolean {
  const h = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (PRIVATE_HOSTNAMES.has(h)) return true;
  if (h.endsWith(".local") || h.endsWith(".internal")) return true;
  const ip = parseIpv4(h);
  if (ip) {
    const [a, b] = ip;
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 0) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 169 && b === 254) return true; // link-local + cloud metadata
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
    return false;
  }
  if (h === "::1" || h === "::") return true;
  if (h.startsWith("fe80:")) return true; // link-local IPv6
  if (h.startsWith("fc") || h.startsWith("fd")) return true; // unique local IPv6
  return false;
}

export function safeUrl(str: string): URL | null {
  try {
    const u = new URL(str);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    if (!u.hostname) return null;
    if (isPrivateHost(u.hostname)) return null;
    return u;
  } catch (e) {
    return null;
  }
}

export function isValidHttpUrl(str: string): boolean {
  const u = safeUrl(str);
  if (!u) return false;
  return Boolean(u.hostname.includes("."));
}

function stripDefaultPort(u: URL) {
  if ((u.protocol === "http:" && u.port === "80") || (u.protocol === "https:" && u.port === "443")) {
    u.port = "";
  }
}

// Normalize for de-duplication: lowercase host, strip default port + fragment,
// collapse trailing slashes (except root), sort query params.
export function normalizeUrl(raw: string, base?: string): string | null {
  let u: URL;
  try {
    u = new URL(raw, base);
  } catch (e) {
    return null;
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") return null;
  if (isPrivateHost(u.hostname)) return null;
  u.hostname = u.hostname.toLowerCase();
  stripDefaultPort(u);
  u.hash = "";
  let path = u.pathname.replace(/\/+/g, "/");
  if (path !== "/" && path.endsWith("/")) path = path.replace(/\/$/, "");
  u.pathname = path;
  const keys = Array.from(new Set(u.searchParams.keys())).sort();
  const sorted = new URLSearchParams();
  for (const k of keys) {
    u.searchParams.getAll(k).forEach((v) => sorted.append(k, v));
  }
  u.search = sorted.toString();
  return u.toString();
}

export function sameHost(a: string, b: string): boolean {
  try {
    return new URL(a).hostname.toLowerCase() === new URL(b).hostname.toLowerCase();
  } catch (e) {
    return false;
  }
}

export function escapeXml(str: string): string {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}