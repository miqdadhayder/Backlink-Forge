// searchService
// Responsible for finding candidate websites for a given niche/keyword/country.
// When a real SERP / site-discovery API key is available, call it here.
// Otherwise return a curated pool of demo domains themed by the keyword.
import { secrets } from "./envSecrets.ts";

export function hasLiveSearchProvider() {
  return Boolean(secrets.get("SERPAPI_KEY") || secrets.get("DATAFORSEO_KEY"));
}

const BASE_DOMAINS = [
  "bloghub", "marketersguide", "techpulse", "growthweekly", "seonews",
  "contentloop", "digitalinsider", "nichepost", "writelab", "mediacore",
  "authorityblog", "insiderpost", "themarketingreview", "devjournal",
  "startupstory", "foundernotes", "businesstalk", "expertcolumn",
  "dailydigest", "industryvoice", "proinsights", "theleadersboard",
  "creativeweb", "codecraft", "aiweekly", "smarthub", "linkbuilder",
  "outreachpro", "resourceindex", "dirhub", "forumnet", "profilelist",
  "guestpost", "writeforus", "contributorcentral", "mediumpost", "voxmedia",
  "quorahub", "redditlike", "stackoverflowish", "producthuntish", "devtoish",
  "hashnodeish", "mediumish", "substackish", "ghostblog", "wordpressmag",
  "wixinsider", "shopifyblog", "hubspotmagazine", "mozjournal", "ahrefsreview"
];

const NICHES = [
  "Digital Marketing", "Technology", "Web Development", "Business",
  "Finance", "Health", "Lifestyle", "Education", "SaaS", "Startups"
];

const TYPES = [
  "Guest Post", "Resource Page", "Business Directory", "Profile Link",
  "Blog Comment", "Forum", "Broken Link", "Competitor Opportunity"
];

const COUNTRY_TLDS = {
  Global: "", USA: ".com", UK: ".co.uk", Canada: ".ca", Australia: ".com.au",
  Pakistan: ".pk", India: ".in", UAE: ".ae"
};

export async function findCandidateSites(keyword, country, count) {
  if (hasLiveSearchProvider()) {
    // TODO: call SERP/DataForSEO API using secrets.get("SERPAPI_KEY")
  }
  const tld = COUNTRY_TLDS[country] || "";
  const kw = (keyword || "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 10);
  const results = [];
  for (let i = 0; i < count; i++) {
    const base = BASE_DOMAINS[(i + (kw.length || 0)) % BASE_DOMAINS.length];
    const suffix = i >= BASE_DOMAINS.length ? String(i + 1) : "";
    const domain = `${base}${kw}${suffix}${tld}`.replace(/\s/g, "");
    results.push({
      domain,
      website: capitalize(base) + (suffix ? ` ${suffix}` : ""),
      niche: NICHES[i % NICHES.length],
      backlink_type: TYPES[i % TYPES.length]
    });
  }
  return results;
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export { NICHES, TYPES, BASE_DOMAINS };