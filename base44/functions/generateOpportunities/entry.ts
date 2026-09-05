import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { generateOpportunities } from "../../shared/backlinkService.ts";

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    let user = null;
    try { user = await base44.auth.me(); } catch (e) { /* anonymous allowed */ }

    const body = await req.json();
    const {
      website_url, keyword, country, backlink_type, minimum_da,
      results_count, competitor_url, search_type
    } = body || {};

    // Validation
    if (!website_url || !isValidUrl(website_url)) {
      return Response.json({ error: "Please enter a valid website URL." }, { status: 400 });
    }
    if (!keyword || keyword.trim().length < 2) {
      return Response.json({ error: "Please enter your target niche or keyword." }, { status: 400 });
    }
    if (search_type === "competitor" && (!competitor_url || !isValidUrl(competitor_url))) {
      return Response.json({ error: "Please enter a valid competitor URL." }, { status: 400 });
    }

    const count = [10, 25, 50, 100].includes(Number(results_count)) ? Number(results_count) : 25;
    const minDa = Math.min(90, Math.max(0, Number(minimum_da) || 20));

    const { opportunities, is_demo } = await generateOpportunities({
      keyword: keyword.trim(),
      country,
      backlink_type,
      minimum_da: minDa,
      results_count: count,
      competitor_url
    });

    // Persist the search + opportunities if the user is logged in.
    let search_id = null;
    if (user) {
      try {
        const search = await base44.entities.Search.create({
          website_url,
          keyword: keyword.trim(),
          country: country || "Global",
          backlink_type: backlink_type || "All Opportunities",
          minimum_da: minDa,
          results_count: count,
          competitor_url: competitor_url || null,
          search_type: search_type || "backlinks",
          is_demo: is_demo,
          opportunities_found: opportunities.length
        });
        search_id = search.id;
        if (opportunities.length > 0) {
          await base44.entities.Opportunity.bulkCreate(
            opportunities.slice(0, count).map(o => ({ ...o, search_id }))
          );
        }
      } catch (e) {
        // Persisting is best-effort; never block the result on storage failures.
      }
    }

    return Response.json({
      opportunities,
      is_demo,
      search_id,
      query: { website_url, keyword: keyword.trim(), country, backlink_type,
               minimum_da: minDa, results_count: count }
    });
  } catch (error) {
    return Response.json(
      { error: "We couldn't retrieve live backlink data right now. Please try again later." },
      { status: 500 }
    );
  }
}

function isValidUrl(str) {
  try {
    const u = new URL(str.startsWith("http") ? str : `https://${str}`);
    return Boolean(u.hostname && u.hostname.includes("."));
  } catch (e) { return false; }
}