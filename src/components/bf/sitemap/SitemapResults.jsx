import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Check, Download, RefreshCw, FileCode2, FileText, AlertTriangle, Bot } from "lucide-react";
import { exportSitemapCsv, downloadText } from "@/utils/sitemapExport";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "included", label: "Included" },
  { id: "excluded", label: "Excluded" },
  { id: "errors", label: "Errors" },
  { id: "redirects", label: "Redirects" },
  { id: "nonindex", label: "Non-indexable" }
];

export default function SitemapResults({ result, onRegenerate, onValidateExisting }) {
  const [copied, setCopied] = React.useState(false);
  const [filter, setFilter] = React.useState("all");
  const [search, setSearch] = React.useState("");

  const urls = result.urls || [];
  const filtered = urls.filter((u) => {
    if (filter === "included" && !u.included) return false;
    if (filter === "excluded" && u.included) return false;
    if (filter === "errors" && !(u.status === 0 || u.status >= 400)) return false;
    if (filter === "redirects" && !(u.status >= 300 && u.status < 400)) return false;
    if (filter === "nonindex" && u.included) return false;
    if (search && !u.url.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(result.xml);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) { /* ignore */ }
  };

  return (
    <div className="space-y-6">
      {result.existing_sitemaps && result.existing_sitemaps.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <h3 className="text-sm font-semibold text-amber-900">Existing Sitemap Detected</h3>
          </div>
          <ul className="mt-2 space-y-1">
            {result.existing_sitemaps.map((s) => (
              <li key={s} className="break-all text-sm text-amber-800">{s}</li>
            ))}
          </ul>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={onValidateExisting}>Validate Existing Sitemap</Button>
            <Button size="sm" variant="ghost" onClick={onRegenerate}>Generate New Sitemap</Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Stat label="URLs Discovered" value={result.stats.discovered} />
        <Stat label="Valid URLs" value={result.stats.valid} />
        <Stat label="Excluded" value={result.stats.excluded} />
        <Stat label="Errors" value={result.stats.errors} />
        <Stat label="Final Sitemap URLs" value={result.stats.included} accent />
      </div>

      {result.capped && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          The crawl reached the processing limit and stopped early. {result.stats.discovered} URLs were discovered. Upgrade your plan to crawl more URLs.
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-900">Robots.txt</h3>
        </div>
        {result.robots.found ? (
          <p className="mt-1 text-sm text-slate-600"><span className="font-medium text-emerald-600">Found ✓</span> — Disallow rules were respected during the crawl.</p>
        ) : (
          <p className="mt-1 text-sm text-slate-500">robots.txt not found. The crawl proceeded without robots restrictions.</p>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-sm font-semibold text-slate-900">URL Analysis ({filtered.length})</h3>
          <Input placeholder="Search URLs..." value={search} onChange={(e) => setSearch(e.target.value)} className="sm:max-w-xs" />
        </div>
        <div className="flex flex-wrap gap-1 border-b border-slate-100 p-3">
          {FILTERS.map((f) => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className={`rounded-full px-3 py-1 text-xs font-medium ${filter === f.id ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
              {f.label}
            </button>
          ))}
        </div>
        <div className="max-h-[480px] overflow-auto">
          {filtered.length === 0 ? (
            <p className="p-6 text-center text-sm text-slate-500">No URLs match this filter.</p>
          ) : (
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="sticky top-0 border-b border-slate-100 bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-2.5 font-medium">URL</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 font-medium">Code</th>
                  <th className="px-4 py-2.5 font-medium">Canonical</th>
                  <th className="px-4 py-2.5 font-medium">Indexable</th>
                  <th className="px-4 py-2.5 font-medium">Included</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((u, i) => (
                  <tr key={i} className="hover:bg-slate-50/60">
                    <td className="px-4 py-2.5 text-slate-700"><span className="block max-w-md truncate" title={u.url}>{u.url}</span></td>
                    <td className="px-4 py-2.5"><StatusBadge label={u.status_label} code={u.status} /></td>
                    <td className="px-4 py-2.5 text-slate-600">{u.status || "—"}</td>
                    <td className="px-4 py-2.5 text-slate-600">{u.canonical ? "Yes" : "—"}</td>
                    <td className="px-4 py-2.5">{u.indexable ? <span className="text-emerald-600">Yes</span> : <span className="text-slate-400">No</span>}</td>
                    <td className="px-4 py-2.5">
                      {u.included ? (
                        <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-xs text-emerald-700">Yes</span>
                      ) : (
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500" title={u.exclusion_reason || ""}>{u.exclusion_reason || "No"}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-900 shadow-sm">
        <div className="flex items-center justify-between gap-2 border-b border-slate-800 p-4">
          <div className="flex items-center gap-2">
            <FileCode2 className="h-4 w-4 text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-100">Sitemap Preview</h3>
            <span className="text-xs text-slate-500">sitemap.xml</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={copy}>
              {copied ? <><Check className="mr-1 h-3.5 w-3.5" /> Copied ✓</> : <><Copy className="mr-1 h-3.5 w-3.5" /> Copy XML</>}
            </Button>
            <Button size="sm" variant="secondary" onClick={() => downloadText(result.xml, "sitemap.xml")}>
              <Download className="mr-1 h-3.5 w-3.5" /> Download
            </Button>
            <Button size="sm" variant="ghost" className="text-slate-300 hover:text-white" onClick={onRegenerate}>
              <RefreshCw className="mr-1 h-3.5 w-3.5" /> Regenerate
            </Button>
          </div>
        </div>
        <pre className="max-h-96 overflow-auto p-4 text-xs leading-relaxed text-slate-300"><code>{result.xml}</code></pre>
      </div>

      <Button variant="outline" size="sm" onClick={() => exportSitemapCsv(urls)}>
        <FileText className="mr-2 h-4 w-4" /> Download Sitemap Report (CSV)
      </Button>
    </div>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div className={`rounded-2xl border bg-white p-4 shadow-sm ${accent ? "border-slate-900" : "border-slate-200"}`}>
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`mt-1 text-2xl font-semibold tracking-tight ${accent ? "text-slate-900" : "text-slate-800"}`}>
        {Number(value || 0).toLocaleString()}
      </div>
    </div>
  );
}

function StatusBadge({ label, code }) {
  let cls = "bg-slate-100 text-slate-600";
  if (code >= 200 && code < 300) cls = "bg-emerald-50 text-emerald-700";
  else if (code >= 300 && code < 400) cls = "bg-amber-50 text-amber-700";
  else if (code === 0) cls = "bg-slate-100 text-slate-500";
  else if (code >= 400) cls = "bg-rose-50 text-rose-700";
  return <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${cls}`}>{label}</span>;
}