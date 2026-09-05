// CSV export utility — builds a real CSV and triggers a browser download.
export function exportOpportunitiesToCSV(opportunities, filename = "backlink-opportunities.csv") {
  if (!opportunities || opportunities.length === 0) return false;
  const headers = [
    "Website", "URL", "DA", "Traffic", "Niche", "Backlink Type",
    "Guest Post Availability", "Contact URL", "Relevance Score"
  ];
  const escape = (val) => {
    const s = String(val == null ? "" : val);
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const rows = opportunities.map((o) => [
    o.website, o.url, o.domain_authority, o.traffic, o.niche,
    o.backlink_type, o.guest_post_available ? "Yes" : "No",
    o.contact_url, o.relevance_score
  ].map(escape).join(","));

  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return true;
}

export function exportGapOpportunitiesToCSV(opportunities, filename = "backlink-gap-opportunities.csv") {
  if (!opportunities || opportunities.length === 0) return false;
  const headers = [
    "Website", "Domain", "Domain Authority", "Estimated Traffic",
    "Competitor", "Number of Competitors", "Backlink Type", "Source URL",
    "Guest Post URL", "Contact URL", "Relevance Score", "Opportunity Score",
    "Priority", "Country"
  ];
  const escape = (val) => {
    const s = String(val == null ? "" : val);
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const rows = opportunities.map((o) => [
    o.website || o.domain, o.domain, o.domain_authority, o.traffic,
    o.competitor_names, o.competitor_count, o.backlink_type, o.source_url,
    o.guest_post_url, o.contact_url, o.relevance_score, o.opportunity_score,
    o.priority, o.country
  ].map(escape).join(","));

  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return true;
}