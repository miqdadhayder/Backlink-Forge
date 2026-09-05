import React from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Bookmark, BookmarkCheck, ExternalLink, FileText, Mail, HelpCircle } from "lucide-react";
import { formatTraffic } from "@/utils/opportunityHelpers";
import { scoreLabel } from "@/utils/gapHelpers";

export default function GapDetailDialog({
  opportunity, savedIds, onClose, onSave, onOutreach
}) {
  return (
    <Dialog open={Boolean(opportunity)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        {opportunity && (
          <>
            <DialogHeader>
              <DialogTitle>{opportunity.domain}</DialogTitle>
              <DialogDescription>
                {opportunity.backlink_type} · {opportunity.niche || "Niche not specified"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Stat label="Domain Authority" value={opportunity.domain_authority} />
                <Stat label="Estimated Traffic" value={`${formatTraffic(opportunity.traffic)}/mo`} />
                <Stat label="Niche" value={opportunity.niche || "—"} />
                <Stat label="Country" value={opportunity.country || "Global"} />
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Competitors Linking From This Domain</p>
                <p className="mt-1 text-sm text-slate-700">{opportunity.competitor_names || "—"}</p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Link Type</p>
                <p className="mt-1 text-sm text-slate-700">{opportunity.backlink_type}</p>
              </div>

              <div className="flex items-start gap-2">
                <HelpCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" />
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Opportunity Score</p>
                  <p className="text-sm font-semibold text-slate-900">
                    {opportunity.opportunity_score}/100 — {scoreLabel(opportunity.opportunity_score)}
                  </p>
                </div>
              </div>

              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Why This Is An Opportunity</p>
                <p className="mt-1 text-sm text-slate-700">
                  This website links to {opportunity.competitor_count} of your competitors
                  {opportunity.competitor_count > 1 ? "s" : ""} but no backlink from this domain was found for your website.
                </p>
              </div>

              {opportunity.guest_post_url && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Guest Post Page</p>
                  <p className="mt-1 truncate text-sm text-slate-700">{opportunity.guest_post_url}</p>
                </div>
              )}
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Contact Page</p>
                <p className="mt-1 truncate text-sm text-slate-700">{opportunity.contact_url || "Not available"}</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <a href={`https://${opportunity.domain}`} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="w-full"><ExternalLink className="mr-2 h-4 w-4" /> Visit Website</Button>
                </a>
                <a href={opportunity.source_url} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="w-full"><FileText className="mr-2 h-4 w-4" /> Source Page</Button>
                </a>
                {opportunity.guest_post_url && (
                  <a href={opportunity.guest_post_url} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" className="w-full"><FileText className="mr-2 h-4 w-4" /> Guest Post Guidelines</Button>
                  </a>
                )}
                <Button variant="outline" className="w-full" onClick={() => onOutreach(opportunity)}>
                  <Mail className="mr-2 h-4 w-4" /> Outreach Draft
                </Button>
              </div>

              <Button
                className="w-full"
                variant={savedIds && savedIds.has(opportunity._gapId) ? "secondary" : "default"}
                onClick={() => onSave(opportunity)}
                disabled={savedIds && savedIds.has(opportunity._gapId)}
              >
                {savedIds && savedIds.has(opportunity._gapId)
                  ? <><BookmarkCheck className="mr-2 h-4 w-4" /> Saved ✓</>
                  : <><Bookmark className="mr-2 h-4 w-4" /> Save Opportunity</>}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}