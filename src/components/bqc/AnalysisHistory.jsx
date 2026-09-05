import React from "react";
import { Link } from "react-router-dom";
import { History, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";

function riskColor(l) { return l === "Low" ? "text-emerald-600" : l === "Medium" ? "text-amber-600" : "text-rose-600"; }
function scoreColor(s) { return s >= 75 ? "text-emerald-600" : s >= 50 ? "text-amber-600" : s >= 25 ? "text-orange-600" : "text-rose-600"; }

export default function AnalysisHistory({ onOpen }) {
  const { toast } = useToast();
  const [rows, setRows] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const list = await base44.entities.BacklinkQualityAnalysis.list("-created_date", 50);
      setRows(list || []);
    } catch (e) {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const remove = async (id) => {
    try {
      await base44.entities.BacklinkQualityAnalysis.delete(id);
      setRows((r) => (r || []).filter((x) => x.id !== id));
    } catch (e) {
      toast({ title: "Could not delete this analysis.", variant: "destructive" });
    }
  };

  const openReport = (row) => {
    let report = null;
    try { report = JSON.parse(row.report_json || "null"); } catch (e) { report = null; }
    if (report) onOpen(report);
    else toast({ title: "Full report data is no longer available.", variant: "destructive" });
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900">
          <History className="h-4 w-4 text-slate-400" /> Analysis History
        </h3>
        <Button variant="ghost" size="sm" onClick={load}>Refresh</Button>
      </div>

      {loading ? (
        <div className="py-10 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-slate-400" /></div>
      ) : !rows || rows.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-sm text-slate-500">No analyses yet. Your analyzed backlinks will appear here.</p>
          <p className="mt-1 text-xs text-slate-400">History is saved to your BacklinkForge account.</p>
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs text-slate-500">
              <tr>
                <th className="py-2 pr-3 font-medium">Backlink URL</th>
                <th className="py-2 pr-3 font-medium">Score</th>
                <th className="py-2 pr-3 font-medium">Classification</th>
                <th className="py-2 pr-3 font-medium">Risk</th>
                <th className="py-2 pr-3 font-medium">Recommendation</th>
                <th className="py-2 pr-3 font-medium">Date</th>
                <th className="py-2 pr-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => (
                <tr key={r.id} className="align-top">
                  <td className="py-3 pr-3"><button onClick={() => openReport(r)} className="break-all text-left font-medium text-slate-900 underline">{r.backlink_url}</button></td>
                  <td className={`py-3 pr-3 font-semibold ${scoreColor(r.overall_score)}`}>{r.overall_score}/100</td>
                  <td className="py-3 pr-3 text-slate-600">{r.classification}</td>
                  <td className={`py-3 pr-3 font-medium ${riskColor(r.risk_level)}`}>{r.risk_level}</td>
                  <td className="py-3 pr-3 text-slate-600">{r.recommendation}</td>
                  <td className="py-3 pr-3 text-slate-500">{new Date(r.created_date).toLocaleDateString()}</td>
                  <td className="py-3 pr-3">
                    <button onClick={() => remove(r.id)} className="text-slate-400 hover:text-rose-600" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}