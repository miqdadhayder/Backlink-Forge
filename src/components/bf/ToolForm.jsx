import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Sparkles, AlertCircle } from "lucide-react";

const COUNTRIES = ["Global", "USA", "UK", "Canada", "Australia", "Pakistan", "India", "UAE"];
const BACKLINK_TYPES = [
  "All Opportunities", "Guest Posts", "Resource Pages", "Business Directories",
  "Profile Links", "Blog Comments", "Forums", "Broken Link Opportunities"
];
const RESULT_COUNTS = [10, 25, 50, 100];

export default function ToolForm({ onGenerate, loading }) {
  const [form, setForm] = React.useState({
    website_url: "",
    keyword: "",
    country: "Global",
    backlink_type: "All Opportunities",
    minimum_da: 20,
    results_count: 25
  });
  const [error, setError] = React.useState("");

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = (e) => {
    e.preventDefault();
    setError("");
    if (!form.website_url.trim() || !isValidUrl(form.website_url)) {
      setError("Please enter a valid website URL.");
      return;
    }
    if (!form.keyword.trim() || form.keyword.trim().length < 2) {
      setError("Please enter your target niche or keyword.");
      return;
    }
    onGenerate({ ...form, search_type: "backlinks" });
  };

  return (
    <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="website_url">Website URL</Label>
          <Input
            id="website_url"
            placeholder="https://example.com"
            value={form.website_url}
            onChange={(e) => update("website_url", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="keyword">Target Keyword / Niche</Label>
          <Input
            id="keyword"
            placeholder="e.g. AI tools, digital marketing"
            value={form.keyword}
            onChange={(e) => update("keyword", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Target Country</Label>
          <Select value={form.country} onValueChange={(v) => update("country", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Backlink Type</Label>
          <Select value={form.backlink_type} onValueChange={(v) => update("backlink_type", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {BACKLINK_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Minimum Domain Authority</Label>
            <span className="text-sm font-semibold text-slate-900">{form.minimum_da}</span>
          </div>
          <Slider
            value={[form.minimum_da]}
            min={0}
            max={90}
            step={1}
            onValueChange={(v) => update("minimum_da", v[0])}
          />
          <p className="text-xs text-slate-500">Filter out low-authority sites. Default: 20.</p>
        </div>
        <div className="space-y-3">
          <Label>Number of Results</Label>
          <div className="flex gap-2">
            {RESULT_COUNTS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => update("results_count", n)}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                  form.results_count === n
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-400"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-5 flex items-center gap-2 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <AlertCircle className="h-4 w-4 flex-shrink-0" /> {error}
        </div>
      )}

      <div className="mt-6">
        <Button type="submit" size="lg" disabled={loading} className="w-full">
          <Sparkles className="mr-2 h-4 w-4" />
          {loading ? "Generating…" : "Generate Backlink Opportunities"}
        </Button>
      </div>
    </form>
  );
}

function isValidUrl(str) {
  try {
    const u = new URL(str.startsWith("http") ? str : `https://${str}`);
    return Boolean(u.hostname && u.hostname.includes("."));
  } catch (e) { return false; }
}