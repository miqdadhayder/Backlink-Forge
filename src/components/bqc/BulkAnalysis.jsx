import React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, Sparkles, Download, Search, ArrowUpDown } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { bulkToCsv, downloadCsv } from "@/utils/qualityExport";

const MAX_ROWS = 25;

function riskColor(l) { return l === "Low" ? "text-emerald-600" : l === "Medium" ? "text-amber-600" : "text-rose-600"; }
function scoreColor(s) { return s >= 75 ? "text-emerald-600" : s >= 50 ? "text-amber-600" : s >= 25 ? "text-orange-600" : "text-rose-600"; }

export default function BulkAnalysis() {
  const { toast } = useToast();
  const [text, setText] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [results, setResults] = React.useState(null);
  const [query, setQuery] = React.useState("");
  const [sortKey, setSortKey] = React.useState("score");

  const parseCsv = (raw) => {
    const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const out = [];
    for (const line of lines) {
      const cells = line.split(",").map((c) => c.trim());
      if (cells[0] && /^https?:\/\//i.test(cells[0])) {
        out.push({ website_url: cells[3] || "", backlink_url: cells[0], target_url: cells[3] || "", anchor_text: cells[2] || "" });
      }
    }
    return out;
  };

  const run = async () => {
    const rows = parseCsv(text);
    if (!rows.length) { toast({ title: "Paste backlink URLs (one per line, or CSV).", variant: "destructive" }); return; }
    if (rows.length > MAX_ROWS) { toast({ title: `Limited to ${MAX_ROWS} rows per analysis.`, variant: "destructive" }); }
    setLoading(true); setResults(null);
    try {
      const res = await base44.functions.invoke("analyzeBacklinkQuality", { bulk: rows.slice(0, MAX_ROWS) });
      setResults(res.data.results.map((r) => ({ report: r })));
    } catch (e) {
      toast({ title: "Bulk analysis failed. Please try fewer URLs.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const onFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setText(String(reader.result || ""));
    reader.readAsText(file);
  };

  const filtered = React.useMemo(() => {
    let rows = results || [];
    if (query) {
      const q = query.toLowerCase();
      rows = rows.filter((it) =>
        (it.report.inputs.backlink_url || "").toLowerCase().includes(q) ||
        (it.report.source?.domain || "").toLowerCase().includes(q) ||
        (it.report.inputs.target_url || "").toLowerCase().includes(q)
      );
    }
    rows = [...rows].sort((a, b) => {
      if (sortKey === "score") return b.report.overall_score - a.report.overall_score;
      if (sortKey === "risk") return ["Low", "Medium", "High"].indexOf(a.report.risk_level) - ["Low", "Medium", "High"].indexOf(b.report.risk_level);
      return 0;
    });
    return rows;
  }, [results, query, sortKey]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h3 className="text-base font-semibold text-slate-900">Analyze Multiple Backlinks</h3>
        <p className="mt-1 text-sm text-slate-500">Upload a CSV or paste backlink URLs (one per line). Limited to {MAX_ROWS} per run.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto]">
          <div className="space-y-2">
            <Label htmlFor="bulk_text">Backlink URLs (CSV: source_url,target,anchor,target_url)</Label>
            <textarea id="bulk_text" rows={6} value={text} onChange={(e) => setText(e.target.value)}
              placeholder={"https://example.com/post\nhttps://news.site/article,learn more,https://yoursite.com"}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 font-mono text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
          </div>
          <div className="flex flex-col items-start gap-2">
            <Label>Upload CSV</Label>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">
              <Upload className="h-4 w-4" /> Choose file
              <input type="file" accept=".csv,.txt" className="hidden" onChange={onFile} />
            </label>
          </div>
        </div>
        <div className="mt-5">
          <Button onClick={run} disabled={loading}>
            <Sparkles className="mr-2 h-4 w-4" /> {loading ? "Analyzing…" : `Analyze ${Math.min(parseCsv(text).length || 0, MAX_ROWS) || ""} Backlinks`}
          </Button>
        </div>
      </div>

      {loading && (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />
          <p className="mt-4 text-sm text-slate-500">Analyzing backlinks in batches…</p>
        </div>
      )}

      {results && !loading && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-base font-semibold text-slate-900">Results ({filtered.length})</h3>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter…"
                  className="h-9 rounded-md border border-input pl-8 pr-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
              </div>
              <select value={sortKey} onChange={(e) => setSortKey(e.target.value)}
                className="h-9 rounded-md border border-input px-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <option value="score">Sort by score</option>
                <option value="risk">Sort by risk</option>
              </select>
              <Button variant="outline" size="sm" onClick={() => downloadCsv(`backlink-quality-bulk-${Date.now()}.csv`, bulkToCsv(results))}>
                <Download className="mr-2 h-4 w-4" /> Export CSV
              </Button>
            </div>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs text-slate-500">
                <tr>
                  <th className="py-2 pr-3 font-medium"><ArrowUpDown className="inline h-3 w-3" /> Source Domain</th>
                  <th className="py-2 pr-3 font-medium">Target Page</th>
                  <th className="py-2 pr-3 font-medium">Anchor</th>
                  <th className="py-2 pr-3 font-medium">Link Type</th>
                  <th className="py-2 pr-3 font-medium">Quality</th>
                  <th className="py-2 pr-3 font-medium">Risk</th>
                  <th className="py-2 pr-3 font-medium">Recommendation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((it, i) => {
                  const r = it.report;
                  return (
                    <tr key={i} className="align-top">
                      <td className="py-3 pr-3"><a href={r.inputs.backlink_url} target="_blank" rel="noreferrer" className="break-all font-medium text-slate-900 underline">{r.source?.domain || r.inputs.backlink_url}</a></td>
                      <td className="py-3 pr-3 break-all text-slate-600">{r.inputs.target_url || "—"}</td>
                      <td className="py-3 pr-3 text-slate-600">{r.link?.anchor || r.inputs.anchor_text || "—"}</td>
                      <td className="py-3 pr-3 text-slate-600">{r.link?.attribute || "—"}</td>
                      <td className={`py-3 pr-3 font-semibold ${scoreColor(r.overall_score)}`}>{r.overall_score}/100</td>
                      <td className={`py-3 pr-3 font-medium ${riskColor(r.risk_level)}`}>{r.risk_level}</td>
                      <td className="py-3 pr-3 text-slate-600">{r.recommendation?.action}</td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && <tr><td colSpan={7} className="py-6 text-center text-slate-400">No matching results.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}