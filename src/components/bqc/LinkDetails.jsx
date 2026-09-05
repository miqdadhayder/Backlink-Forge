import React from "react";

function Row({ label, value, link }) {
  return (
    <div className="grid grid-cols-1 gap-1 border-b border-slate-100 py-3 sm:grid-cols-3">
      <span className="text-sm text-slate-500">{label}</span>
      {link ? (
        <a href={value} target="_blank" rel="noopener noreferrer" className="break-all text-sm font-medium text-slate-900 underline sm:col-span-2">{value}</a>
      ) : (
        <span className="break-all text-sm font-medium text-slate-900 sm:col-span-2">{value || "—"}</span>
      )}
    </div>
  );
}

export default function LinkDetails({ report }) {
  const { source, link, inputs } = report;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-base font-semibold text-slate-900">Backlink Details</h3>
      <div className="mt-3">
        <Row label="Source URL" value={inputs.backlink_url} link />
        <Row label="Source (final)" value={source.final_url} link={source.final_url?.startsWith("http")} />
        <Row label="Source Domain" value={source.domain} />
        <Row label="Source Page" value={source.page_path} />
        <Row label="Target URL" value={inputs.target_url} link />
        <Row label="Your Website" value={inputs.website_url} link />
        <Row label="Anchor Text" value={link.anchor || inputs.anchor_text} />
        <Row label="Link Attribute" value={link.attribute} />
        <Row label="Link Placement" value={link.placement} />
        <Row label="HTTP Status" value={source.http_status || "Unable to verify"} />
        <Row label="Redirected" value={source.redirected ? `Yes → ${source.redirect_target || source.final_url}` : "No"} />
        <Row label="Last Checked" value={new Date(report.analyzed_at).toLocaleString()} />
      </div>
    </div>
  );
}