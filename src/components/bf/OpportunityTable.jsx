import React from "react";
import { Button } from "@/components/ui/button";
import {
  ExternalLink, Bookmark, BookmarkCheck, FileText, Info, Mail
} from "lucide-react";
import { formatTraffic, difficultyColor, daColor, relevanceColor } from "@/utils/opportunityHelpers";

export default function OpportunityTable({ opportunities, savedIds, onSave, onShowGuidelines, onReachOut }) {
  if (!opportunities || opportunities.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
        <p className="text-sm text-slate-500">No opportunities match your filters. Try lowering the minimum DA or changing the filters.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full min-w-[820px] text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3 font-medium">Website</th>
            <th className="px-4 py-3 font-medium">DA</th>
            <th className="px-4 py-3 font-medium">Traffic</th>
            <th className="px-4 py-3 font-medium">Type</th>
            <th className="px-4 py-3 font-medium">Guest Post</th>
            <th className="px-4 py-3 font-medium">Relevance</th>
            <th className="px-4 py-3 font-medium">Difficulty</th>
            <th className="px-4 py-3 text-right font-medium">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {opportunities.map((o, i) => {
            const isSaved = savedIds && savedIds.has(o._localId || o.url || `${o.website}-${i}`);
            return (
              <tr key={i} className="hover:bg-slate-50/60">
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-900">{o.website}</div>
                  <div className="max-w-[200px] truncate text-xs text-slate-500">{o.url}</div>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-base font-semibold ${daColor(o.domain_authority)}`}>{o.domain_authority}</span>
                </td>
                <td className="px-4 py-3 text-slate-700">{formatTraffic(o.traffic)}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">{o.backlink_type}</span>
                </td>
                <td className="px-4 py-3">
                  {o.guest_post_available
                    ? <span className="inline-flex rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">Yes</span>
                    : <span className="text-xs text-slate-400">No</span>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-12 overflow-hidden rounded-full bg-slate-100">
                      <div className={`h-full ${relevanceColor(o.relevance_score)}`} style={{ width: `${o.relevance_score}%` }} />
                    </div>
                    <span className="text-xs font-medium text-slate-700">{o.relevance_score}%</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-md px-2 py-1 text-xs font-medium ${difficultyColor(o.difficulty)}`}>{o.difficulty}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <a href={o.url} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="sm">View</Button>
                    </a>
                    {o.guest_post_available && o.guest_post_url && (
                      <Button variant="ghost" size="sm" onClick={() => onShowGuidelines(o)}>
                        <FileText className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => onSave(o)} disabled={isSaved}>
                      {isSaved ? <BookmarkCheck className="h-4 w-4 text-emerald-600" /> : <Bookmark className="h-4 w-4" />}
                    </Button>
                    {onReachOut && (
                      <Button variant="ghost" size="sm" onClick={() => onReachOut(o)} title="Reach out">
                        <Mail className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}