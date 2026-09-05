import React from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Copy } from "lucide-react";

export default function GapOutreachDraft({ opportunity, onClose }) {
  const [draft, setDraft] = React.useState("");
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (opportunity) {
      setDraft(buildDraft(opportunity));
      setCopied(false);
    }
  }, [opportunity]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(draft);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) { /* ignore */ }
  };

  return (
    <Dialog open={Boolean(opportunity)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl">
        {opportunity && (
          <>
            <DialogHeader>
              <DialogTitle>Outreach draft — {opportunity.domain}</DialogTitle>
              <DialogDescription>
                A starting point you can edit before sending. This does not send any email automatically.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <Label className="text-xs">Draft</Label>
              <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={11} />
              <p className="text-xs text-slate-500">
                Potential outreach opportunity — there is no guarantee a backlink will be granted.
              </p>
              <div className="flex justify-end">
                <Button onClick={handleCopy} disabled={!draft}>
                  <Copy className="mr-2 h-4 w-4" /> {copied ? "Copied!" : "Copy draft"}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function buildDraft(o) {
  const site = o.user_site || "your website";
  const niche = o.niche || "your niche";
  const competitors = o.competitor_names || "your competitors";
  return `Subject: Guest post / resource suggestion for ${o.domain}

Hi ${o.domain} team,

I noticed that ${competitors} already reference ${o.domain}, and I thought your audience might also find value in a resource from ${site}.

We focus on ${niche}, and I'd love to contribute an original, well-researched piece relevant to your readers. I'm happy to follow your editorial guidelines and any word-count requirements.

Would you be open to a short pitch? Happy to share a few topic ideas first.

Best regards,
[Your name]
${site}`;
}