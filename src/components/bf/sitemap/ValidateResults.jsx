import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, AlertTriangle, XCircle, Download, FileCode2, ChevronDown, ChevronRight } from "lucide-react";
import { exportValidationCsv } from "@/utils/sitemapExport";

const SEVERITY_FILTERS = ["all", "error", "warning", "404", "301/302", "403", "5xx", "Noindex", "Robots blocked", "Duplicate", "Invalid URL", "Non-HTTPS"];

export default function ValidateResults({ result }) {
  const [filter, setFilter] = React.useState("all");
  const [search, setSearch] = React.useState("");
  const [open, setOpen] = React.useState(null);

  const issues = (result.issues || []).filter((i) => {
    if (filter === "error" && i.severity !== "error") return false;
    if (filter === "warning" && i.severity !== "warning") return false;
    if (["404", "301/302", "403", "5xx", "Noindex", "Robots blocked", "Duplicate", "Invalid URL", "Non-HTTPS"].includes(filter) && i.type !== filter) return false;
    if (search && !i.url.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const passed = result.checks.filter((c) => c.status === "passed");
  const warnings = result.checks.filter((c) => c.status === "warning");
  const errors = result.checks.filter((c) => c.status === "error");
  const healthColor = result.health >= 80 ? "text-emerald-600" : result.health >= 50 ? "text-amber-600" : "text-rose-600";

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-500">Sitemap Health</h3>
        <div className={`mt-1 text-5xl font-semibold tracking-tight ${healthColor}`}>
          {result.health}<span className="text-2xl text-slate-400">/100</span>
        </div>
        {result.is_index && (
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
            <FileCode2 className="h-3.5 w-3.5" /> Sitemap Index · {result.child_sitemaps.length} child sitemaps
          </div>
        )}
      </div>

      {result.is_index && result.child_sitemaps.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900">Sitemap Index</h3>
          <p className="mt-1 text-sm text-slate-500">
            {result.child_sitemaps.length} child sitemaps · {result.child_sitemaps.reduce((s, c) => s + c.url_count, 0)} total URLs
          </p>
          <div className="mt-3 divide-y divide-slate-100">
            {result.child_sitemaps.map((c, i) => (
              <div key={i} className="flex items-center justify-between py-2 text-sm">
                <span className="truncate text-slate-700" title={c.url}>{c.url}</span>
                <span className="ml-3 flex-shrink-0 text-slate-500">{c.url_count} URLs · {c.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <CheckGroup title="Passed" icon={CheckCircle2} color="emerald" items={passed} />
        <CheckGroup title="Warnings" icon={AlertTriangle} color="amber" items={warnings} />
        <CheckGroup title="Errors" icon={XCircle} color="rose" items={errors} />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-sm font-semibold text-slate-900">Issues ({issues.length})</h3>
          <Input placeholder="Search issues..." value={search} onChange={(e) => setSearch(e.target.value)} className="sm:max-w-xs" />
        </div>
        <div className="flex flex-wrap gap-1 border-b border-slate-100 p-3">
          {SEVERITY_FILTERS.map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`rounded-full px-3 py-1 text-xs font-medium ${filter === f ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
              {f}
            </button>
          ))}
        </div>
        <div className="max-h-[420px] overflow-auto">
          {issues.length === 0 ? (
            <p className="p-6 text-center text-sm text-slate-500">No issues match this filter.</p>
          ) : (
            <div className="divide-y divide-slate-50">
              {issues.map((i, idx) => {
                const openIdx = open === idx;
                return (
                  <div key={idx}>
                    <button onClick={() => setOpen(openIdx ? null : idx)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50/60">
                      {i.severity === "error" ? <XCircle className="h-4 w-4 flex-shrink-0 text-rose-500" /> : <AlertTriangle className="h-4 w-4 flex-shrink-0 text-amber-500" />}
                      <span className="min-w-0 flex-1 truncate text-sm text-slate-700">{i.url}</span>
                      <span className="flex-shrink-0 rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{i.type}</span>
                      {openIdx ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                    </button>
                    {openIdx && (
                      <div className="bg-slate-50 px-4 py-3 text-sm">
                        <div className="grid gap-2 sm:grid-cols-3">
                          <div><span className="text-xs text-slate-400">URL</span><p className="break-all text-slate-700">{i.url}</p></div>
                          <div><span className="text-xs text-slate-400">Issue</span><p className="text-slate-700">{i.type}{i.status ? ` (${i.status})` : ""}</p></div>
                          <div><span className="text-xs text-slate-400">Status</span><p className="text-slate-700">{i.status == null ? "—" : i.status}</p></div>
                        </div>
                        <div className="mt-2"><span className="text-xs text-slate-400">Recommendation</span><p className="text-slate-700">{i.recommendation}</p></div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Button variant="outline" size="sm" onClick={() => exportValidationCsv(result)}>
        <Download className="mr-2 h-4 w-4" /> Download Validation Report
      </Button>
    </div>
  );
}

function CheckGroup({ title, icon: Icon, color, items }) {
  const map = { emerald: "text-emerald-500", amber: "text-amber-500", rose: "text-rose-500" };
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${map[color]}`} />
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        <span className="ml-auto text-sm text-slate-400">{items.length}</span>
      </div>
      <ul className="mt-3 space-y-1.5">
        {items.length === 0 ? (
          <li className="text-xs text-slate-400">None</li>
        ) : (
          items.map((c, i) => (
            <li key={i} className="text-xs text-slate-600">
              <span className={map[color]}>•</span> {c.label}
              <span className="block text-slate-400">{c.detail}</span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}