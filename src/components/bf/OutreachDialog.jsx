import React from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Copy, Send } from "lucide-react";

function fillTemplate(text, opportunity) {
  if (!text) return "";
  return text
    .replace(/{website}/g, opportunity?.website || "")
    .replace(/{url}/g, opportunity?.url || "")
    .replace(/{niche}/g, opportunity?.niche || "")
    .replace(/{da}/g, opportunity?.domain_authority != null ? String(opportunity.domain_authority) : "")
    .replace(/{traffic}/g, opportunity?.traffic != null ? Number(opportunity.traffic).toLocaleString() : "")
    .replace(/{type}/g, opportunity?.backlink_type || "");
}

export default function OutreachDialog({ opportunity, templates, onClose }) {
  const [templateId, setTemplateId] = React.useState("");
  const [subject, setSubject] = React.useState("");
  const [body, setBody] = React.useState("");
  const [to, setTo] = React.useState("");
  const [copied, setCopied] = React.useState(false);

  const hasTemplates = templates && templates.length > 0;

  React.useEffect(() => {
    if (opportunity && hasTemplates) {
      setTemplateId(templates[0].id);
      setSubject(fillTemplate(templates[0].subject, opportunity));
      setBody(fillTemplate(templates[0].body, opportunity));
    } else {
      setTemplateId("");
      setSubject("");
      setBody("");
    }
    setTo("");
    setCopied(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opportunity]);

  const onSelect = (id) => {
    setTemplateId(id);
    const tpl = templates.find((t) => t.id === id);
    if (tpl) {
      setSubject(fillTemplate(tpl.subject, opportunity));
      setBody(fillTemplate(tpl.body, opportunity));
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) { /* ignore */ }
  };

  const handleMailto = () => {
    const mailto = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
  };

  return (
    <Dialog open={Boolean(opportunity)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        {opportunity && (
          <>
            <DialogHeader>
              <DialogTitle>Reach out to {opportunity.website}</DialogTitle>
              <DialogDescription>
                DA {opportunity.domain_authority} · {opportunity.backlink_type}
                {opportunity.guest_post_available ? " · Guest post available" : ""}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {!hasTemplates && (
                <div className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  No templates yet. Create outreach templates in your dashboard to speed up outreach.
                </div>
              )}
              {hasTemplates && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Template</Label>
                  <Select value={templateId} onValueChange={onSelect}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Select a template" /></SelectTrigger>
                    <SelectContent>
                      {templates.map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-1.5">
                <Label className="text-xs">Subject</Label>
                <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Email subject" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Body</Label>
                <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={8} placeholder="Email body" />
              </div>
              {hasTemplates && (
                <p className="text-xs text-slate-500">
                  Placeholders filled from this opportunity: {"{website}"}, {"{url}"}, {"{niche}"}, {"{da}"}, {"{traffic}"}, {"{type}"}.
                </p>
              )}
              <div className="space-y-1.5">
                <Label className="text-xs">Contact email (optional)</Label>
                <div className="flex gap-2">
                  <Input value={to} onChange={(e) => setTo(e.target.value)} placeholder="editor@example.com" />
                  <Button variant="outline" onClick={handleMailto} disabled={!to}>
                    <Send className="mr-2 h-4 w-4" /> Open
                  </Button>
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleCopy} disabled={!subject && !body}>
                  <Copy className="mr-2 h-4 w-4" /> {copied ? "Copied!" : "Copy email"}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}