import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Wand2, ShieldCheck, AlertCircle } from "lucide-react";

export default function QualityCheckerForm({ onAnalyze, loading }) {
  const [form, setForm] = React.useState({
    website_url: "",
    backlink_url: "",
    target_url: "",
    anchor_text: ""
  });
  const [error, setError] = React.useState("");
  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const useExample = () => {
    setError("");
    setForm({
      website_url: "https://backlinkforge.app",
      backlink_url: "https://ahrefs.com/blog/backlinks/",
      target_url: "https://backlinkforge.app",
      anchor_text: "backlink analysis tool"
    });
  };

  const submit = (e) => {
    e.preventDefault();
    setError("");
    if (!form.backlink_url.trim()) {
      setError("Please enter the backlink (source page) URL.");
      return;
    }
    if (!isValidUrl(form.backlink_url)) {
      setError("Please enter a valid backlink URL (including https://).");
      return;
    }
    if (form.website_url && !isValidUrl(form.website_url)) {
      setError("Please enter a valid website URL.");
      return;
    }
    if (form.target_url && !isValidUrl(form.target_url)) {
      setError("Please enter a valid target page URL.");
      return;
    }
    onAnalyze({
      website_url: form.website_url.trim(),
      backlink_url: form.backlink_url.trim(),
      target_url: form.target_url.trim() || null,
      anchor_text: form.anchor_text.trim() || null
    });
  };

  return (
    <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="bq_website">Your Website URL</Label>
          <Input id="bq_website" placeholder="https://yoursite.com" value={form.website_url} onChange={(e) => update("website_url", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bq_backlink">Backlink URL <span className="text-rose-500">*</span></Label>
          <Input id="bq_backlink" placeholder="https://example.com/article" value={form.backlink_url} onChange={(e) => update("backlink_url", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bq_target">Target Page URL <span className="text-slate-400">(optional)</span></Label>
          <Input id="bq_target" placeholder="https://yoursite.com/page" value={form.target_url} onChange={(e) => update("target_url", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bq_anchor">Anchor Text <span className="text-slate-400">(optional)</span></Label>
          <Input id="bq_anchor" placeholder="e.g. best SEO tools" value={form.anchor_text} onChange={(e) => update("anchor_text", e.target.value)} />
        </div>
      </div>

      {error && (
        <div className="mt-5 flex items-center gap-2 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <AlertCircle className="h-4 w-4 flex-shrink-0" /> {error}
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Button type="submit" size="lg" disabled={loading} className="flex-1">
          <Sparkles className="mr-2 h-4 w-4" /> {loading ? "Analyzing…" : "Analyze Backlink"}
        </Button>
        <Button type="button" size="lg" variant="outline" onClick={useExample} disabled={loading}>
          <Wand2 className="mr-2 h-4 w-4" /> Use Example
        </Button>
      </div>

      <p className="mt-4 flex items-center gap-2 text-xs text-slate-500">
        <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
        We analyze publicly available information. Never enter passwords or private account information.
      </p>
    </form>
  );
}

function isValidUrl(str) {
  try {
    const u = new URL(str.startsWith("http") ? str : `https://${str}`);
    return Boolean(u.hostname && u.hostname.includes("."));
  } catch (e) { return false; }
}