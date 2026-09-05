// CSV / file download helpers for the sitemap tools — builds real files client-side.

function csvEscape(v) {
  const s = String(v == null ? "" : v);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function triggerDownload(content, filename, type) {
  const blob = new Blob([content], { type: `${type};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.setAttribute("download", filename);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadText(text, filename, type = "application/xml") {
  triggerDownload(text, filename, type);
}

export function exportSitemapCsv(urls, filename = "sitemap-report.csv") {
  const headers = [
    "URL", "Final URL", "Status Code", "Status", "Canonical",
    "Indexable", "Included", "Exclusion Reason", "Content-Type", "Depth"
  ];
  const rows = (urls || []).map((u) =>
    [u.url, u.final_url, u.status, u.status_label, u.canonical || "",
     u.indexable ? "Yes" : "No", u.included ? "Yes" : "No",
     u.exclusion_reason || "", u.content_type, u.depth].map(csvEscape).join(",")
  );
  triggerDownload([headers.join(","), ...rows].join("\n"), filename, "text/csv");
}

export function exportValidationCsv(result, filename = "sitemap-validation-report.csv") {
  const issues = result.issues || [];
  const summary = [
    ["Sitemap Health", result.health],
    ["URLs Found", result.stats.url_count],
    ["Duplicates", result.stats.duplicate_count],
    ["Invalid URLs", result.stats.invalid_count],
    ["Non-HTTPS", result.stats.non_https_count],
    ["Errors", issues.filter((i) => i.severity === "error").length],
    ["Warnings", issues.filter((i) => i.severity === "warning").length]
  ].map((r) => r.map(csvEscape).join(","));
  const headers = ["URL", "Issue Type", "Severity", "Status", "Recommendation"];
  const rows = issues.map((i) =>
    [i.url, i.type, i.severity, i.status == null ? "" : i.status, i.recommendation].map(csvEscape).join(",")
  );
  triggerDownload([summary.join("\n"), "", headers.join(","), ...rows].join("\n"), filename, "text/csv");
}