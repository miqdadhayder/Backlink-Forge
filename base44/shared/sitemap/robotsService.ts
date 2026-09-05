import { safeUrl } from "./urlNormalizer.ts";

export interface RobotsInfo {
  found: boolean;
  status: number | null;
  sitemaps: string[];
  rules: { path: string; allow: boolean }[];
}

export async function fetchRobots(origin: string): Promise<RobotsInfo> {
  const info: RobotsInfo = { found: false, status: null, sitemaps: [], rules: [] };
  const url = origin.replace(/\/$/, "") + "/robots.txt";
  const u = safeUrl(url);
  if (!u) return info;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(url, {
      method: "GET",
      signal: ctrl.signal,
      redirect: "follow",
      headers: { "User-Agent": "BacklinkForgeSitemapBot/1.0" }
    });
    clearTimeout(t);
    info.status = res.status;
    if (res.status !== 200) return info;
    info.found = true;
    const text = await res.text();
    parseRobots(text, info);
  } catch (e) {
    /* network/timeout — treat as not found */
  }
  return info;
}

function parseRobots(text: string, info: RobotsInfo) {
  let inStar = false;
  const lines = text.split(/\r?\n/);
  for (const raw of lines) {
    const line = raw.split("#")[0].trim();
    if (!line) continue;
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const field = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim();
    if (field === "user-agent") {
      inStar = value === "*";
      continue;
    }
    if (field === "sitemap") {
      if (value) info.sitemaps.push(value);
      continue;
    }
    if (!inStar) continue;
    if (field === "allow") {
      info.rules.push({ path: value, allow: true });
    } else if (field === "disallow") {
      if (value === "") continue;
      info.rules.push({ path: value, allow: false });
    }
  }
  // Longest path wins; on ties, allow wins.
  info.rules.sort((a, b) =>
    b.path.length - a.path.length || (a.allow === b.allow ? 0 : a.allow ? -1 : 1)
  );
}

export function isAllowed(url: string, robots: RobotsInfo): boolean {
  if (!robots.found) return true;
  try {
    const u = new URL(url);
    const path = u.pathname + u.search;
    for (const r of robots.rules) {
      if (matches(path, r.path)) return r.allow;
    }
    return true;
  } catch (e) {
    return true;
  }
}

function matches(path: string, pattern: string): boolean {
  if (!pattern) return false;
  let re = "^";
  for (let i = 0; i < pattern.length; i++) {
    const c = pattern[i];
    if (c === "*") re += ".*";
    else if (c === "$") re += "$";
    else re += c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
  try {
    return new RegExp(re).test(path);
  } catch (e) {
    return path.startsWith(pattern);
  }
}