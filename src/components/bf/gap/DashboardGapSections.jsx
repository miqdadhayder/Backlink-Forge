import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Target, Trash2, ExternalLink, Download } from "lucide-react";
import moment from "moment";
import { exportGapOpportunitiesToCSV } from "@/utils/csvExport";
import { priorityBadge, priorityEmoji } from "@/utils/gapHelpers";

export function GapFinderCTA({ analysesCount }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white">
          <Target className="h-4 w-4" />
        </span>
        <h3 className="text-base font-semibold text-slate-900">Backlink Gap Finder</h3>
      </div>
      <p className="mt-2 text-sm text-slate-600">
        Discover backlink opportunities your competitors already have. Compare your backlink profile with up to 5
        competitors and find websites that link to them but not to you.
      </p>
      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs text-slate-500">{analysesCount} analyses this month</span>
        <Link to="/backlink-gap-finder">
          <Button size="sm">Open Backlink Gap Finder</Button>
        </Link>
      </div>
    </div>
  );
}

export function GapHistory({ analyses, onReopen }) {
  const navigate = useNavigate();
  if (!analyses || analyses.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
        <p className="text-sm text-slate-500">No gap analyses yet. <Link to="/backlink-gap-finder" className="font-medium text-slate-900 underline">Run your first analysis</Link>.</p>
      </div>
    );
  }
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3 font-medium">Date</th>
            <th className="px-4 py-3 font-medium">Website</th>
            <th className="px-4 py-3 font-medium">Competitors</th>
            <th className="px-4 py-3 font-medium">Opportunities</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 text-right font-medium">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {analyses.map((a) => (
            <tr key={a.id} className="hover:bg-slate-50/60">
              <td className="px-4 py-3 text-slate-600">{moment(a.created_date).format("MMM D, YYYY")}</td>
              <td className="px-4 py-3 font-medium text-slate-900">{a.website_url}</td>
              <td className="px-4 py-3 text-slate-600">{a.competitors_summary || "—"}</td>
              <td className="px-4 py-3 text-slate-600">{a.result_count || 0}</td>
              <td className="px-4 py-3">
                <span className={`rounded px-2 py-0.5 text-xs font-medium ${a.status === "completed" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                  {a.status || "completed"}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <Button variant="ghost" size="sm" onClick={() => navigate(`/backlink-gap-finder?analysis=${a.id}`)}>
                  <ExternalLink className="mr-1 h-4 w-4" /> View Results
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SavedGaps({ saved, onReload }) {
  const { toast } = useToast();

  const handleExport = () => {
    if (!saved || saved.length === 0) {
      toast({ title: "Nothing to export", description: "Save some opportunities first." });
      return;
    }
    const ok = exportGapOpportunitiesToCSV(saved, "saved-gap-opportunities.csv");
    if (ok) toast({ title: "CSV exported", description: `${saved.length} opportunities downloaded.` });
  };

  const remove = async (s) => {
    try {
      await base44.entities.SavedGapOpportunity.delete(s.id);
      toast({ title: "Removed" });
      onReload();
    } catch (e) {
      toast({ title: "Could not remove", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900">Saved Gap Opportunities</h3>
        <Button variant="outline" size="sm" onClick={handleExport} disabled={!saved || saved.length === 0}>
          <Download className="mr-2 h-4 w-4" /> Export CSV
        </Button>
      </div>
      {(!saved || saved.length === 0) ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-sm text-slate-500">No saved gap opportunities yet. Save opportunities from the Backlink Gap Finder.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {saved.map((s) => (
            <div key={s.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-slate-900">{s.domain}</p>
                  <p className="text-xs text-slate-500">{s.backlink_type}</p>
                </div>
                <span className={`rounded px-2 py-0.5 text-xs font-medium ${priorityBadge(s.priority)}`}>{priorityEmoji(s.priority)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                <span>DA {s.domain_authority}</span>
                <span>Score {s.opportunity_score}/100</span>
              </div>
              {s.competitor_names && <p className="mt-1 truncate text-xs text-slate-400">{s.competitor_names}</p>}
              <div className="mt-3 flex gap-2">
                <a href={`https://${s.domain}`} target="_blank" rel="noopener noreferrer" className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">Visit</Button>
                </a>
                <Button variant="ghost" size="sm" onClick={() => remove(s)}><Trash2 className="h-4 w-4 text-rose-500" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}