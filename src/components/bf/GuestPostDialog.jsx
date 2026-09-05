import React from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, Mail } from "lucide-react";

export default function GuestPostDialog({ opportunity, onClose }) {
  return (
    <Dialog open={Boolean(opportunity)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        {opportunity && (
          <>
            <DialogHeader>
              <DialogTitle>Guest Post Guidelines — {opportunity.website}</DialogTitle>
              <DialogDescription>
                Domain Authority {opportunity.domain_authority} · ~{opportunity.traffic.toLocaleString()} monthly visits
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Submission Requirements</p>
                <p className="mt-1 text-sm text-slate-700">{opportunity.submission_requirements || "Not specified."}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Write for Us page</p>
                <p className="mt-1 truncate text-sm text-slate-700">{opportunity.guest_post_url}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Contact page</p>
                <p className="mt-1 truncate text-sm text-slate-700">{opportunity.contact_url}</p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <a href={opportunity.guest_post_url} target="_blank" rel="noopener noreferrer" className="flex-1">
                  <Button className="w-full">
                    <ExternalLink className="mr-2 h-4 w-4" /> View Guest Post Guidelines
                  </Button>
                </a>
                <a href={opportunity.contact_url} target="_blank" rel="noopener noreferrer" className="flex-1">
                  <Button variant="outline" className="w-full">
                    <Mail className="mr-2 h-4 w-4" /> Visit Website
                  </Button>
                </a>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}