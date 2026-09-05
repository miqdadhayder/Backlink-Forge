import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import moment from "moment";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function SitemapTab({ analyses }) {
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(null);

  const generations = analyses.filter((a) => a.type === "generate");
  const validations = analyses.filter((a) => a.type === "validate");
  const urlsAnalyzed = analyses.reduce((s, a) => s + (a.urls_found || 0), 0);
  const last = analyses[0];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card label="Total Generations" value={generations.length} />
        <Card label="Total Validations" value={validations.length} />
        <Card label="URLs Analyzed" value={urlsAnalyzed} />
        <Card label="Last Analysis" value={last ? moment(last.created_date).format("MMM D") : "—"} />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900">XML Sitemap Generator & Validator</h3>
            <p className="mt-1 text-sm text-slate-500">Crawl your site, generate a sitemap, and validate existing sitemaps for errors.</p>
          </div>
          <Button onClick={() => navigate("/sitemap-generator")}>Open Tool <ArrowRight className="ml-2 h-4 w-4" /></Button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-4"><h3 className="text-sm font-semibold text-slate-900">Sitemap History</h3></div>
        {analyses.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500">
            No sitemap analyses yet. <button onClick={() => navigate("/sitemap-generator")} className="font-medium text-slate-900 underline">Run your first analysis</button>.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Website</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">URLs Found</th>
                  <th className="px-4 py-3 font-medium">Included</th>
                  <th className="px-4 py-3 font-medium">Errors</th>
                  <th className="px-4 py-3 font-medium">Sitemap Type</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {analyses.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/60">
                    <td className="max-w-[220px] truncate px-4 py-3 text-slate-700" title={a.website_url}>{a.website_url}</td>
                    <td className="px-4 py-3 capitalize text-slate-600">{a.type}</td>
                    <td className="px-4 py-3 text-slate-600">{a.urls_found || 0}</td>
                    <td className="px-4 py-3 text-slate-600">{a.urls_included || 0}</td>
                    <td className="px-4 py-3 text-slate-600">{a.errors || 0}</td>
                    <td className="px-4 py-3 text-slate-600">{a.sitemap_type || "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{a.status}</td>
                    <td className="px-4 py-3 text-slate-500">{moment(a.created_date).format("MMM D")}</td>
                    <td className="px-4 py-3"><Button variant="ghost" size="sm" onClick={() => setOpen(a)}>View Report</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={!!open} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Sitemap Report</DialogTitle></DialogHeader>
          {open && (
            <div className="space-y-3 text-sm">
              <Row k="Website" v={open.website_url} />
              <Row k="Type" v={open.type} />
              <Row k="URLs Found" v={open.urls_found} />
              <Row k="URLs Included" v={open.urls_included} />
              <Row k="Errors" v={open.errors} />
              <Row k="Warnings" v={open.warnings} />
              {open.health != null && <Row k="Health Score" v={`${open.health}/100`} />}
              <Row k="Robots.txt" v={open.robots_found ? "Found" : "Not found"} />
              {open.existing_sitemaps && <Row k="Existing Sitemaps" v={open.existing_sitemaps} />}
              {open.xml_preview && (
                <div>
                  <div className="text-slate-500">XML Preview</div>
                  <pre className="mt-1 max-h-60 overflow-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-300"><code>{open.xml_preview}</code></pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Card({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{typeof value === "number" ? value.toLocaleString() : value}</div>
    </div>
  );
}

function Row({ k, v }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-slate-500">{k}</span>
      <span className="text-right text-slate-900 break-all">{String(v ?? "—")}</span>
    </div>
  );
}