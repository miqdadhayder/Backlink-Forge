import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { FileCode2, ChevronDown, Search } from "lucide-react";

const MAX_URLS = [100, 500, 1000, 5000, 10000, 25000];
const DEPTHS = [1, 2, 3, 5, 0];
const INCLUDE_TYPES = ["HTML pages", "PDFs", "Images"];

function isValidUrl(str) {
  try {
    const u = new URL(str.startsWith("http") ? str : `https://${str}`);
    return Boolean(
      u.hostname && u.hostname.includes(".") &&
      (u.protocol === "http:" || u.protocol === "https:")
    );
  } catch (e) {
    return false;
  }
}

export default function SitemapForm({ onGenerate, loading, usage }) {
  const [website_url, setUrl] = React.useState("");
  const [max_urls, setMax] = React.useState(100);
  const [crawl_depth, setDepth] = React.useState(0);
  const [include_types, setTypes] = React.useState(["HTML pages"]);
  const [exclude_patterns, setExclude] = React.useState("");
  const [advanced, setAdvanced] = React.useState(false);
  const [error, setError] = React.useState("");

  const toggleType = (t) => {
    setTypes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };

  const submit = (e) => {
    e.preventDefault();
    setError("");
    if (!website_url.trim() || !isValidUrl(website_url)) {
      setError("Please enter a valid website URL (https://example.com).");
      return;
    }
    if (include_types.length === 0) {
      setError("Select at least one URL type to include.");
      return;
    }
    onGenerate({
      website_url: website_url.trim().startsWith("http") ? website_url.trim() : `https://${website_url.trim()}`,
      max_urls,
      crawl_depth,
      include_types,
      exclude_patterns: exclude_patterns.split(/[\n,]/).map((s) => s.trim()).filter(Boolean)
    });
  };

  return (
    <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white">
          <FileCode2 className="h-4 w-4" />
        </span>
        <h3 className="text-lg font-semibold tracking-tight text-slate-900">Generate Sitemap</h3>
      </div>
      <p className="mt-1 text-sm text-slate-500">Crawl your website and generate a standards-compliant XML sitemap.</p>

      <div className="mt-6 space-y-1.5">
        <Label htmlFor="sm_website">Website URL</Label>
        <Input id="sm_website" placeholder="https://example.com" value={website_url} onChange={(e) => setUrl(e.target.value)} />
      </div>

      <button type="button" onClick={() => setAdvanced((a) => !a)} className="mt-4 flex items-center gap-1 text-sm font-medium text-slate-700 hover:text-slate-900">
        <ChevronDown className={`h-4 w-4 transition ${advanced ? "rotate-180" : ""}`} /> Advanced Crawl Settings
      </button>

      {advanced && (
        <div className="mt-4 space-y-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Maximum URLs</Label>
              <Select value={String(max_urls)} onValueChange={(v) => setMax(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MAX_URLS.map((n) => <SelectItem key={n} value={String(n)}>{n.toLocaleString()}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Crawl Depth</Label>
              <Select value={String(crawl_depth)} onValueChange={(v) => setDepth(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DEPTHS.map((d) => <SelectItem key={d} value={String(d)}>{d === 0 ? "Unlimited" : d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Include URLs</Label>
            <div className="flex flex-wrap gap-4">
              {INCLUDE_TYPES.map((t) => (
                <label key={t} className="flex items-center gap-2 text-sm text-slate-700">
                  <Checkbox checked={include_types.includes(t)} onCheckedChange={() => toggleType(t)} /> {t}
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sm_exclude">URL patterns to exclude (one per line or comma)</Label>
            <textarea
              id="sm_exclude"
              rows={2}
              placeholder={"/admin/\n/login/\n/cart/"}
              value={exclude_patterns}
              onChange={(e) => setExclude(e.target.value)}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
        </div>
      )}

      {usage && usage.limit != null && (
        <div className="mt-4 text-xs text-slate-500">{usage.used} / {usage.limit} generations used this month</div>
      )}

      {error && (
        <div className="mt-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      )}

      <Button type="submit" size="lg" disabled={loading} className="mt-6 w-full">
        <Search className="mr-2 h-4 w-4" /> {loading ? "Crawling…" : "Generate Sitemap"}
      </Button>
    </form>
  );
}